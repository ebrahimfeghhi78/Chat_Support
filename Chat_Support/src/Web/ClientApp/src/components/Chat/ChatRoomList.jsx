import React, {useState, useRef} from 'react';
import {ListGroup, Button, Form, Spinner, Badge} from 'react-bootstrap';
import {Search, PlusLg} from 'react-bootstrap-icons';
import {useChat} from '../../hooks/useChat';
import {chatApi} from '../../services/chatApi';
import {useQueryClient} from '@tanstack/react-query';

const ChatRoomList = ({rooms = [], currentRoom, onRoomSelect, onNewRoom, isLoading}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // تغییر ۱: اطلاعات کاربر لاگین کرده را از کانتکست چت بگیرید
  const {createChatRoom, currentLoggedInUserId} = useChat();

  const [usersWithoutActiveChat, setUsersWithoutActiveChat] = useState([]);
  const [showUserSearchResults, setShowUserSearchResults] = useState(false);
  const searchInputRef = useRef(null);

  // تغییر ۲: منطق فیلتر را برای استفاده از پراپرتی جدید memberIds اصلاح کنید
  const filterUsersWithoutChat = (users, activeRooms) => {
    const usersWithChat = new Set();
    activeRooms.forEach((room) => {
      // از پراپرتی جدید که از سرور می آید (memberIds) استفاده کنید
      if (!room.isGroup && room.members) {
        console.log('Room Members:', room.members);
        room.members.forEach((member) => {
          // ما فقط به آیدی کاربر طرف مقابل نیاز داریم، نه کاربر فعلی
          if (member.userId !== currentLoggedInUserId) {
            usersWithChat.add(member.userId);
          }
        });
      }
    });
    // کاربرانی را برگردانید که در لیست چت‌های فعال نیستند و خود کاربر لاگین کرده هم نباشند
    return users.filter((user) => !usersWithChat.has(user.id) && user.id !== currentLoggedInUserId);
  };

  // تغییر ۳: تابع را برای جلوگیری از فراخوانی API اضافی بهینه کنید
  const updateUsersList = async (searchValue = '') => {
    try {
      // فقط کاربران را جستجو کنید
      const users = await chatApi.searchUsers(searchValue);
      // برای فیلتر کردن، از پراپ rooms که اکنون کامل است استفاده کنید
      const filteredUsers = filterUsersWithoutChat(users, rooms);
      setUsersWithoutActiveChat(filteredUsers);
    } catch (error) {
      console.error('Error updating users list:', error);
      setUsersWithoutActiveChat([]);
    }
  };

  const handleSearchFocus = async () => {
    setShowUserSearchResults(true);
    await updateUsersList(searchTerm);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowUserSearchResults(false);
      if (!currentRoom) {
        setSearchTerm('');
      }
    }, 200);
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (showUserSearchResults) {
      await updateUsersList(value);
    }
  };

  const handleUserSelectForChat = async (selectedUser) => {
    if (!selectedUser?.id) return;

    try {
      const newRoom = await createChatRoom({
        name: selectedUser.fullName,
        isGroup: false,
        memberIds: [selectedUser.id],
      });

      if (newRoom) {
        queryClient.invalidateQueries(['chatRooms']);
        onRoomSelect(newRoom);
      }

      setSearchTerm('');
      setShowUserSearchResults(false);
      setUsersWithoutActiveChat([]);
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'});
    }
    return date.toLocaleDateString('fa-IR', {day: '2-digit', month: '2-digit'});
  };

  const filteredRooms = rooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="d-flex flex-column h-100">
      <div className="sidebar-header">
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative flex-grow-1">
            <Search className="search-icon" size={18} />
            <Form.Control
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              ref={searchInputRef}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onChange={handleSearchChange}
              className="search-input"
              autoComplete="off"
            />
          </div>
          <Button variant="primary" onClick={onNewRoom} className="rounded-circle p-2 d-flex">
            <PlusLg size={20} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center p-4">
          <Spinner animation="border" size="sm" />
        </div>
      ) : (
        <ListGroup variant="flush" className="chatroom-list hide-scrollbar">
          {showUserSearchResults ? (
            usersWithoutActiveChat.length > 0 ? (
              <>
                <div className="user-search-list-separator">کاربران جدید</div>
                {usersWithoutActiveChat.map((user) => (
                  <ListGroup.Item key={user.id} className="user-search-list-item" action onMouseDown={() => handleUserSelectForChat(user)}>
                    <span className="user-search-avatar bg-secondary text-light me-2">{user.fullName?.charAt(0)}</span>
                    <span className="fw-bold">{user.fullName}</span>
                    <span className="text-muted ms-2">{user.userName}</span>
                  </ListGroup.Item>
                ))}
              </>
            ) : (
              <div className="text-center p-4 text-muted">{searchTerm ? 'کاربری یافت نشد' : 'برای شروع چت، کاربری را جستجو کنید'}</div>
            )
          ) : filteredRooms.length === 0 ? (
            <div className="text-center p-4 text-muted">{searchTerm ? 'چتی یافت نشد' : 'هنوز چتی ندارید'}</div>
          ) : (
            filteredRooms.map((room) => (
              <ListGroup.Item key={room.id} action active={currentRoom?.id === room.id} onClick={() => onRoomSelect(room)} className="chatroom-list-item">
                <div className="position-relative">
                  {room.avatar ? (
                    <img src={room.avatar} alt={room.name} className="avatar" />
                  ) : (
                    <div className={`avatar-placeholder ${room.isGroup ? 'bg-success' : 'bg-primary'}`}>{room.isGroup ? <i className="bi bi-people-fill fs-5"></i> : room.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div className="chatroom-info">
                  <div className="d-flex justify-content-between">
                    <h6 className="mb-0 text-truncate fw-bold">{room.name}</h6>
                    <small className="text-muted flex-shrink-0">{room.lastMessageTime && formatDate(room.lastMessageTime)}</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted text-truncate">{room.lastMessageContent || room.description || ''}</small>
                    {room.unreadCount > 0 && (
                      <Badge className="unread-badge" pill>
                        {room.unreadCount > 9 ? '9+' : room.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}
    </div>
  );
};

export default ChatRoomList;
