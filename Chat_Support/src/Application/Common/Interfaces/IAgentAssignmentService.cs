using Chat_Support.Domain.Entities;
using Chat_Support.Domain.Enums;


namespace Chat_Support.Application.Common.Interfaces;

public interface IAgentAssignmentService
{
    Task<KciUser?> GetBestAvailableAgentAsync(CancellationToken cancellationToken = default);
    Task<int> GetAgentWorkloadAsync(int agentId, CancellationToken cancellationToken = default);
    Task UpdateAgentStatusAsync(int agentId, AgentStatus status, CancellationToken cancellationToken = default);
}
