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

    public async Task<SupportAgent?> GetBestAvailableAgentAsync(CancellationToken cancellationToken = default)
    {
        // یافتن Agent های آنلاین با ظرفیت
        var availableAgent = await _context.SupportAgents
            .Where(a => a.AgentStatus == AgentStatus.Available
                && a.CurrentActiveChats < a.MaxConcurrentChats)
            .OrderBy(a => a.CurrentActiveChats)
            .FirstOrDefaultAsync(cancellationToken);

        if (availableAgent != null)
        {
            availableAgent.CurrentActiveChats += 1;

            // اگر به حداکثر ظرفیت رسید، وضعیت را Busy کن
            if (availableAgent.CurrentActiveChats >= availableAgent.MaxConcurrentChats)
            {
                availableAgent.AgentStatus = AgentStatus.Busy;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        return availableAgent;
    }

    public async Task<int> GetAgentWorkloadAsync(int agentId, CancellationToken cancellationToken = default)
    {
        return await _context.SupportTickets
            .CountAsync(t => t.AssignedAgentUserId == agentId
                && (t.Status == SupportTicketStatus.Open || t.Status == SupportTicketStatus.InProgress),
                cancellationToken);
    }

    public async Task UpdateAgentStatusAsync(int agentId, AgentStatus status, CancellationToken cancellationToken = default)
    {
        var agent = await _context.SupportAgents.FirstOrDefaultAsync(a => a.UserId == agentId, cancellationToken);
        if (agent != null)
        {
            agent.AgentStatus = status;

            if (status is AgentStatus.Offline or AgentStatus.Away)
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
                        ticket.AssignedAgentUserId = newAgent.UserId;
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
