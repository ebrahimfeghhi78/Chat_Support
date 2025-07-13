import React, { useRef, useEffect, useCallback, useState} from 'react';
import {Spinner, Button} from 'react-bootstrap';
import MessageItem from './MessageItem';
import './Chat.css';

const MessageList = ({messages, isLoading, hasMoreMessages, onLoadMoreMessages, isGroupChat = false}) => {
  const listRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const scrollToBottom = useCallback((smooth = false) => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // تشخیص اینکه آیا کاربر نزدیک پایین است یا نه
  const isNearBottom = useCallback(() => {
    if (!listRef.current) return false;
    const container = listRef.current;
    const threshold = 100; // 100 پیکسل از پایین
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  useEffect(() => {
    // اگر پیام جدیدی اضافه شد یا چت جدید باز شد، همیشه به پایین اسکرول کن
    const timeoutId = setTimeout(() => {
      scrollToBottom(true); // استفاده از smooth scroll
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = listRef.current;
    if (container) {
      const atBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      setIsUserScrolledUp(!atBottom);

      if (container.scrollTop < 50 && hasMoreMessages && !isLoading) {
        onLoadMoreMessages();
      }
    }
  }, [hasMoreMessages, isLoading, onLoadMoreMessages]);

  const formatDateHeader = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) return 'امروز';
    if (messageDate.toDateString() === yesterday.toDateString()) return 'دیروز';
    return messageDate.toLocaleDateString('fa-IR', {year: 'numeric', month: 'long', day: 'numeric'});
  };

  const renderMessages = () => {
    let lastDate = null;
    return messages.map((message) => {
      const messageDate = new Date(message.timestamp).toDateString();
      const showDateHeader = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <React.Fragment key={message.id}>
          {showDateHeader && (
            <div className="message-date-header">
              <span className="message-date-header-badge">{formatDateHeader(message.timestamp)}</span>
            </div>
          )}
          <MessageItem message={message} isGroupChat={isGroupChat} />
        </React.Fragment>
      );
    });
  };

  return (
    <div ref={listRef} className="message-list-container hide-scrollbar p-2" onScroll={handleScroll}>
      {isLoading && messages.length === 0 ? (
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {hasMoreMessages && (
            <div className="text-center my-2">
              <Button variant="light" size="sm" onClick={onLoadMoreMessages} disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'بارگذاری پیام‌های قدیمی‌تر'}
              </Button>
            </div>
          )}
          {messages.length === 0 && !isLoading ? (
            <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted">
              <p>اولین پیام را ارسال کنید!</p>
            </div>
          ) : (
            renderMessages()
          )}
        </>
      )}
    </div>
  );
};

export default MessageList;
