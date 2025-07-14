using Chat_Support.Domain.Entities;

namespace Chat_Support.Application.Common.Interfaces;
public interface IApplicationDbContext
{
    DbSet<TodoList> TodoLists { get; }
    DbSet<TodoItem> TodoItems { get; }

    DbSet<User> Users { get; }
    DbSet<Group> Groups { get; }
    DbSet<UserGroup> UserGroups { get; }
    DbSet<Region> Regions { get; }
    DbSet<UserRegion> UserRegions { get; }
    DbSet<SupportAgent> SupportAgents { get; }
    DbSet<UserFacility> UserFacilities { get; }
    DbSet<GroupFacility> GroupFacilities { get; }
    DbSet<TicketReply> TicketReplies { get; }
    DbSet<ChatRoom> ChatRooms { get; }
    DbSet<ChatRoomMember> ChatRoomMembers { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<MessageStatus> MessageStatuses { get; }
    DbSet<MessageReaction> MessageReactions { get; }
    DbSet<UserConnection> UserConnections { get; }
    DbSet<GuestUser> GuestUsers { get; }
    DbSet<SupportTicket> SupportTickets { get; }
    DbSet<ChatFileMetadata> ChatFileMetadatas { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
