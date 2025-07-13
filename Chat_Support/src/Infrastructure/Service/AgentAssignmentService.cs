using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Domain.Entities;
using Chat_Support.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Chat_Support.Infrastructure.Service;

public class AgentAssignmentService : IAgentAssignmentService
{
    private readonly IApplicationDbContext _context;

    public AgentAssignmentService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetBestAvailableAgentAsync(CancellationToken cancellationToken = default)
    {
        // یافتن Agent های آنلاین با ظرفیت
        var availableAgents = await _context.Users
            .Where(u => u.AgentStatus == AgentStatus.Available
                && u.CurrentActiveChats < u.MaxConcurrentChats)
            .OrderBy(u => u.CurrentActiveChats) // کمترین تعداد چت فعال
            .FirstOrDefaultAsync(cancellationToken);

        if (availableAgents != null)
        {
            // افزایش تعداد چت های فعال
            availableAgents.CurrentActiveChats = (availableAgents.CurrentActiveChats ?? 0) + 1;

            // اگر به حداکثر ظرفیت رسید، وضعیت را Busy کن
            if (availableAgents.CurrentActiveChats >= availableAgents.MaxConcurrentChats)
            {
                availableAgents.AgentStatus = AgentStatus.Busy;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return availableAgents;
    }

    public async Task<int> GetAgentWorkloadAsync(string agentId, CancellationToken cancellationToken = default)
    {
        return await _context.SupportTickets
            .CountAsync(t => t.AssignedAgentUserId == agentId
                && (t.Status == SupportTicketStatus.Open || t.Status == SupportTicketStatus.InProgress),
                cancellationToken);
    }

    public async Task UpdateAgentStatusAsync(string agentId, AgentStatus status, CancellationToken cancellationToken = default)
    {
        var agent = await _context.Users.FindAsync(new object[] { agentId }, cancellationToken);
        if (agent != null)
        {
            agent.AgentStatus = status;

            if (status == AgentStatus.Offline || status == AgentStatus.Away)
            {
                // انتقال چت های فعال به Agent های دیگر
                var activeTickets = await _context.SupportTickets
                    .Where(t => t.AssignedAgentUserId == agentId
                        && (t.Status == SupportTicketStatus.Open || t.Status == SupportTicketStatus.InProgress))
                    .ToListAsync(cancellationToken);

                foreach (var ticket in activeTickets)
                {
                    var newAgent = await GetBestAvailableAgentAsync(cancellationToken);
                    if (newAgent != null)
                    {
                        ticket.AssignedAgentUserId = newAgent.Id;
                        ticket.Status = SupportTicketStatus.Transferred;

                        // Add system message
                        var systemMessage = new ChatMessage
                        {
                            Content = "Your chat has been transferred to another agent.",
                            ChatRoomId = ticket.ChatRoomId,
                            Type = MessageType.System
                        };
                        _context.ChatMessages.Add(systemMessage);
                    }
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
