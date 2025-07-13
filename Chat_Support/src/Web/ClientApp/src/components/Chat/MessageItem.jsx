import React, {useState, useEffect, useRef} from 'react';
import {Check2, Check2All, Clock, Reply, Pencil, Forward, Trash, EmojiSmile} from 'react-bootstrap-icons';
import {MessageDeliveryStatus} from '../../types/chat';
import {useChat} from '../../hooks/useChat';
import {getUserIdFromToken} from '../../utils/jwt';
import './Chat.css';
import {VoiceMessagePlayer} from './VoiceRecorderComponent';

const MENU_WIDTH = 180; // حداقل عرض منو از CSS
const MENU_HEIGHT = 220;

const EmojiReactionPicker = ({onSelect, onClose}) => {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={pickerRef} className="emoji-reaction-picker">
      {emojis.map((emoji) => (
        <span key={emoji} onClick={() => onSelect(emoji)}>
          {emoji}
        </span>
      ))}
    </div>
  );
};

const MessageItem = ({message, isGroupChat = false}) => {
  const {deleteMessage, setReplyingToMessage, setEditingMessage, setForwardingMessage, sendReaction} = useChat();
  const currentUserId = getUserIdFromToken(localStorage.getItem('token'));
  const isOwnMessage = message.senderId === currentUserId;

  const [contextMenu, setContextMenu] = useState({visible: false, styles: {}});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const longPressTimer = useRef();

  const handleContextMenu = (e) => {
    e.preventDefault();

    // ابعاد و موقعیت والد (message-item-wrapper)
    const rect = e.currentTarget.getBoundingClientRect();

    // ۱. بررسی سرریز افقی (آیا منو از سمت راست صفحه بیرون می‌زند؟)
    const opensLeft = e.clientX + MENU_WIDTH > window.innerWidth;

    // ۲. بررسی سرریز عمودی (آیا منو از پایین صفحه بیرون می‌زند؟)
    const opensUp = e.clientY + MENU_HEIGHT > window.innerHeight;

    const styles = {};

    // تنظیم موقعیت عمودی
    if (opensUp) {
      styles.bottom = rect.height - (e.clientY - rect.top);
    } else {
      styles.top = e.clientY - rect.top;
    }

    // تنظیم موقعیت افقی بر اساس نوع پیام (sent/received)
    if (isOwnMessage) {
      // پیام سمت راست (sent)
      if (!opensLeft) {
        // فضای کافی سمت راست پیام: منو را از راست پیام باز کن
        styles.right = 0;
      } else {
        // فضای کافی نیست: منو را از چپ پیام باز کن
        styles.left = 0;
      }
    } else {
      // پیام سمت چپ (received)
      if (!opensLeft) {
        // فضای کافی سمت چپ پیام: منو را از چپ پیام باز کن
        styles.left = 0;
      } else {
        // فضای کافی نیست: منو را از راست پیام باز کن
        styles.right = 0;
      }
    }

    setContextMenu({visible: true, styles: styles});
  };

  const handleTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({visible: true, x: touch.clientX, y: touch.clientY});
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, styles: {} });
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', closeContextMenu);
      return () => document.removeEventListener('click', closeContextMenu);
    }
  }, [contextMenu.visible]);

  const handleAction = (action) => {
    closeContextMenu();
    action();
  };

  const handleReaction = (emoji) => {
    sendReaction(message.id, message.chatRoomId, emoji);
    setShowEmojiPicker(false);
    closeContextMenu();
  };

  const handleReply = () => {
    setReplyingToMessage(message);
  };

  const handleEdit = () => {
    setEditingMessage(message);
  };

  const handleForward = () => {
    setForwardingMessage(message);
  };

  const handleDelete = async () => {
    if (window.confirm('آیا از حذف این پیام اطمینان دارید؟')) {
      try {
        await deleteMessage(message.id);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const renderDeliveryStatus = () => {
    if (!isOwnMessage) return null;

    switch (message.deliveryStatus) {
      case MessageDeliveryStatus.Sent:
        return <Check2 size={18} />;
      case MessageDeliveryStatus.Delivered:
        return <Check2All size={18} />;
      case MessageDeliveryStatus.Read:
        return <Check2All size={18} className="text-primary" />;
      default:
        return <Clock size={14} />;
    }
  };

  const renderRepliedMessage = () => {
    if (!message.replyToMessageId || !message.repliedMessageContent) return null;

    return (
      <div className="p-2 rounded mb-1" style={{background: 'rgba(0,0,0,0.05)', borderRight: '2px solid var(--primary-color)'}}>
        <div className="fw-bold text-primary" style={{fontSize: '0.85rem'}}>
          {message.repliedMessageSenderFullName || 'کاربر'}
        </div>
        <div className="text-muted text-truncate" style={{fontSize: '0.8rem'}}>
          {message.repliedMessageContent}
        </div>
      </div>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji
    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {});

    return (
      <div className="message-reactions mt-1">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <span key={emoji} className="reaction-badge" onClick={() => handleReaction(emoji)} title={reactions.map((r) => r.userName).join(', ')}>
            {emoji} {reactions.length}
          </span>
        ))}
      </div>
    );
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'});
  };

  // Debug: Log message prop at the top of render

  if (message.isDeleted) {
    return (
      <div className={`message-item-wrapper ${isOwnMessage ? 'sent' : 'received'}`}>
        <div className="message-bubble fst-italic text-muted">پیام حذف شد</div>
      </div>
    );
  }

  return (
    <>
      <div className={`message-item-wrapper ${isOwnMessage ? 'sent' : 'received'}`} onContextMenu={handleContextMenu} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchEnd}>
        <div className={`message-bubble ${isOwnMessage ? 'message-sent' : 'message-received'}`}>
          {!isOwnMessage && isGroupChat && (
            <div className="fw-bold text-primary mb-1" style={{fontSize: '0.85rem'}}>
              {message.senderFullName}
            </div>
          )}
          {renderRepliedMessage()}

          {/* Render different content based on message type */}

          {message.type === 0 && <div className="message-content">{message.content}</div>}

          {message.type === 1 && message.attachmentUrl && (
            <img src={message.attachmentUrl} alt={message.content} className="message-image" style={{width: 220, height: 220, objectFit: 'cover', borderRadius: '8px', cursor: 'pointer'}} onClick={() => setImageModalOpen(true)} />
          )}

          {message.type === 2 && message.attachmentUrl && (
            <div className="message-file">
              <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                📎 {message.content}
              </a>
            </div>
          )}

          {((message.type === 3 && message.attachmentUrl) || (message.attachmentUrl && message.content === 'پیام صوتی')) && <VoiceMessagePlayer audioUrl={message.attachmentUrl} duration={message.duration} />}

          {message.type === 4 && message.attachmentUrl && (
            <video controls className="message-video" style={{maxWidth: '100%'}}>
              <source src={message.attachmentUrl} />
            </video>
          )}

          {message.isEdited && (
            <span className="text-muted" style={{fontSize: '0.7rem', marginLeft: '0.5rem'}}>
              (ویرایش شده)
            </span>
          )}

          <div className="message-footer">
            <span className="message-time">{formatTime(message.timestamp)}</span>
            <span className="message-status">{renderDeliveryStatus()}</span>
          </div>

          {renderReactions()}
        </div>

        {contextMenu.visible && (
          <div
            className="custom-context-menu"
            style={contextMenu.styles}
            onClick={(e) => e.stopPropagation()}
          >
            <ul>
              <li onClick={() => handleAction(handleReply)}>
                <Reply /> پاسخ
              </li>
              <li onClick={() => handleAction(handleForward)}>
                <Forward /> هدایت
              </li>
              {isOwnMessage && message.type === 0 && (
                <li onClick={() => handleAction(handleEdit)}>
                  <Pencil /> ویرایش
                </li>
              )}
              <li onMouseEnter={() => setShowEmojiPicker(true)} onMouseLeave={() => setShowEmojiPicker(false)} style={{position: 'relative'}}>
                <EmojiSmile /> واکنش
                {showEmojiPicker && <EmojiReactionPicker onSelect={handleReaction} onClose={() => setShowEmojiPicker(false)} />}
              </li>
              {isOwnMessage && (
                <li className="danger" onClick={() => handleAction(handleDelete)}>
                  <Trash /> حذف
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {/* Image Modal */}
      {imageModalOpen && message.type === 1 && message.attachmentUrl && (
        <div className="image-modal-overlay" onClick={() => setImageModalOpen(false)}>
          <img src={message.attachmentUrl} alt={message.content} className="image-modal-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

export default MessageItem;
