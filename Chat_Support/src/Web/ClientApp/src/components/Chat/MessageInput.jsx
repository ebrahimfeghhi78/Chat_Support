import React, {useState, useRef, useEffect} from 'react';

import {Form, Button, Spinner, CloseButton, OverlayTrigger, Popover} from 'react-bootstrap';

import {useChat} from '../../hooks/useChat';

import {MessageType} from '../../types/chat';

import './Chat.css';

import {IoSend, IoCheckmark} from 'react-icons/io5';

import {BsEmojiSmile} from 'react-icons/bs';

import EmojiPicker, {EmojiStyle} from 'emoji-picker-react';

import VoiceRecorderComponent from './VoiceRecorderComponent';

import FileUploadComponent from './FileUploadComponent';

const MessageInput = ({roomId}) => {
  const [message, setMessage] = useState('');

  const {sendMessage, startTyping, stopTyping, replyingToMessage, clearReplyingToMessage, editingMessage, clearEditingMessage, editMessage, forwardingMessage, clearForwardingMessage, forwardMessage} = useChat();

  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';

      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (replyingToMessage) {
      textareaRef.current?.focus();
    }
  }, [replyingToMessage]);

  const isEditing = !!editingMessage;

  const isReplying = !!replyingToMessage;

  const isForwarding = !!forwardingMessage;

  useEffect(() => {
    if (isEditing) {
      setMessage(editingMessage.content);

      textareaRef.current?.focus();
    } else if (isReplying || isForwarding) {
      textareaRef.current?.focus();
    }
  }, [isEditing, editingMessage, isReplying, isForwarding]);

  const handleCancelAction = () => {
    if (isEditing) clearEditingMessage();

    if (isReplying) clearReplyingToMessage();

    if (isForwarding) clearForwardingMessage();

    setMessage('');
  };

  const handleSubmit = async () => {
    const content = message.trim();

    if (!content && !isForwarding) return;

    if (isSending) return;

    setIsSending(true);

    try {
      if (isEditing) {
        await editMessage(editingMessage.id, content);
      } else if (isReplying) {
        await sendMessage(roomId, {content, type: MessageType.Text, replyToMessageId: replyingToMessage.id});
      } else if (isForwarding) {
        // برای هدایت، محتوای جدیدی ارسال نمی‌شود

        await forwardMessage(forwardingMessage.id, roomId);
      } else {
        await sendMessage(roomId, {content, type: MessageType.Text});
      }

      handleCancelAction(); // پاک کردن همه حالت‌ها

      setMessage('');
    } catch (error) {
      console.error('Action failed:', error);

      // پیام را در صورت خطا بازگردان

      if (!isForwarding) setMessage(content);
    } finally {
      setIsSending(false);

      // تأخیر کوتاه برای اطمینان از حفظ focus

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  };

  const handleTyping = () => {
    if (!typingTimeoutRef.current) {
      startTyping(roomId);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(roomId);

      typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleSendMessage = async () => {
    const content = message.trim();

    if (!content || isSending) return;

    // ذخیره reference به textarea قبل از تغییر state

    const textareaElement = textareaRef.current;

    setIsSending(true);

    setMessage('');

    try {
      await sendMessage(roomId, {
        content,

        type: MessageType.Text,

        replyToMessageId: replyingToMessage?.id,
      });

      clearReplyingToMessage();
    } catch (error) {
      console.error('Failed to send message:', error);

      setMessage(content); // Restore message on failure
    } finally {
      setIsSending(false);

      // تأخیر برای حفظ focus بعد از ارسال پیام

      setTimeout(() => {
        if (textareaElement) {
          textareaElement.focus();

          // در موبایل، گاهی نیاز است cursor را تنظیم کنیم

          if (/Mobi|Android/i.test(navigator.userAgent)) {
            textareaElement.setSelectionRange(0, 0);
          }
        }
      }, 200);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);

    setShowEmojiPicker(false);

    textareaRef.current?.focus();
  };

  // Callback for file upload component

  const onFileUploaded = async ({url, name, size, type, mimeType}) => {
    try {
      setIsSending(true);

      await sendMessage(roomId, {
        content: name,

        type,

        attachmentUrl: url,
      });
    } catch (error) {
      console.error('Failed to send file message:', error);

      alert('خطا در ارسال فایل');
    } finally {
      setIsSending(false);

      // حفظ focus بعد از ارسال فایل

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  };

  // Callback for voice recorder component

  const onVoiceRecorded = async ({url, duration, size, type, mimeType}) => {
    try {
      setIsSending(true);

      await sendMessage(roomId, {
        content: 'پیام صوتی',

        type,

        attachmentUrl: url,
      });
    } catch (error) {
      console.error('Failed to send voice message:', error);

      alert('خطا در ارسال پیام صوتی');
    } finally {
      setIsSending(false);

      // حفظ focus بعد از ارسال پیام صوتی

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  };

  // Emoji picker popover

  const emojiPickerPopover = (
    <Popover id="emoji-picker-popover" style={{maxWidth: 'none', direction: 'ltr'}}>
      <Popover.Body className="p-0">
        <EmojiPicker onEmojiClick={onEmojiClick} emojiStyle={EmojiStyle.NATIVE} />
      </Popover.Body>
    </Popover>
  );

  const renderActionPreview = () => {
    if (isEditing) {
      return (
        <div className="action-preview">
          <div className="fw-bold text-primary">ویرایش پیام</div>

          <div className="preview-content text-muted">{editingMessage.content}</div>

          <Button variant="link" className="p-0 text-danger" onClick={handleCancelAction} title="لغو ویرایش">
            ×
          </Button>
        </div>
      );
    }

    if (isReplying) {
      return (
        <div className="action-preview">
          <div className="fw-bold text-primary">پاسخ به: {replyingToMessage.senderFullName}</div>

          <div className="preview-content text-muted">{replyingToMessage.content}</div>

          <Button variant="link" className="p-0 text-danger" onClick={handleCancelAction} title="لغو پاسخ">
            ×
          </Button>
        </div>
      );
    }

    if (isForwarding) {
      return (
        <div className="action-preview">
          <div className="fw-bold text-primary">هدایت پیام</div>

          <div className="preview-content text-muted">از: {forwardingMessage.senderFullName}</div>

          <Button variant="link" className="p-0 text-danger" onClick={handleCancelAction} title="لغو هدایت">
            ×
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="message-input-container p-2">
      {renderActionPreview()}

      <div className="message-input-wrapper gap-1">
        <div className="message-input-actions d-flex flex-grow-1 gap-1">
          <div>
            {/* Emoji picker button */}

            <OverlayTrigger trigger="click" placement="top" overlay={emojiPickerPopover} rootClose>
              <Button variant="link" className="attachment-button p-1" disabled={isSending} title="افزودن ایموجی">
                <BsEmojiSmile size={20} />
              </Button>
            </OverlayTrigger>
          </div>

          <div className="flex-grow-1">
            <Form.Control
              ref={textareaRef}
              as="textarea"
              rows={1}
              placeholder={isForwarding ? 'برای ارسال پیام هدایت شده، دکمه ارسال را بزنید' : 'پیام...'}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);

                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              disabled={isSending || isForwarding}
              className="message-input-field"
              style={{
                fontSize: '16px', // جلوگیری از zoom در iOS

                minHeight: '44px', // حداقل ارتفاع برای راحتی لمس
              }}
            />
          </div>

          <div className="d-flex gap-1 align-items-center">
            <FileUploadComponent onFileUploaded={onFileUploaded} disabled={isSending} chatRoomId={roomId} />

            <VoiceRecorderComponent onVoiceRecorded={onVoiceRecorded} disabled={isSending} chatRoomId={roomId} />

            {isEditing ? (
              <Button variant="link" onClick={handleSubmit} disabled={!message.trim() || isSending} className="send-button p-1" title="ثبت ویرایش">
                {isSending ? <Spinner size="sm" /> : <IoCheckmark size={20} color="#198754" />}
              </Button>
            ) : message.trim() ? (
              <Button variant="link" onClick={handleSendMessage} disabled={!message.trim() || isSending} className="send-button p-1" title="ارسال پیام">
                {isSending ? <Spinner size="sm" /> : <IoSend size={20} className="icon_flip" />}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
