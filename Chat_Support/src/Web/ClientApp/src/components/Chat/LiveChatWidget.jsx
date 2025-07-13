import React, {useState, useEffect, useRef} from 'react';
import {MessageCircle, X, Send, Paperclip, Mic, StopCircle} from 'lucide-react';
import './Chat.css';
import api from '../../api/axios';

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentInfo, setAgentInfo] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [ticketId, setTicketId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // دریافت یا ایجاد شناسه جلسه
  useEffect(() => {
    let sessionId = localStorage.getItem('chat_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', sessionId);
    }

    // بررسی کاربر بازگشتی
    const savedInfo = localStorage.getItem('chat_guest_info');
    if (savedInfo) {
      const info = JSON.parse(savedInfo);
      setGuestInfo(info);
      setIsRegistered(true);
    }
  }, []);

  // اتصال SignalR برای مهمانان
  useEffect(() => {
    if (isOpen && isRegistered && !window.chatHubConnection) {
      initializeGuestConnection();
    }

    return () => {
      if (window.chatHubConnection && !isRegistered) {
        window.chatHubConnection.stop();
        window.chatHubConnection = null;
      }
    };
  }, [isOpen, isRegistered]);

  const initializeGuestConnection = async () => {
    try {
      const {HubConnectionBuilder, LogLevel} = await import('@microsoft/signalr');

      // تعیین آدرس SignalR بر اساس محیط
      const hubUrl = import.meta.env.MODE === 'development' ? 'https://localhost:5001/guestchathub' : window.location.origin + '/guestchathub';

      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => localStorage.getItem('chat_session_id'),
          withCredentials: false, // مهم برای CORS
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      // تنظیم مدیریت‌کننده‌های رویداد
      connection.on('ReceiveMessage', (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      connection.on('AgentTyping', (data) => {
        setIsTyping(data.isTyping);
      });

      connection.on('SupportChatUpdate', (update) => {
        if (update.type === 'AgentAssigned') {
          setAgentInfo(update.agent);
        } else if (update.type === 'ChatTransferred') {
          setAgentInfo(update.newAgent);
          addSystemMessage('چت شما به کارشناس دیگری منتقل شد.');
        }
      });

      connection.onreconnecting(() => setConnectionStatus('در حال اتصال مجدد'));
      connection.onreconnected(() => setConnectionStatus('متصل'));
      connection.onclose(() => setConnectionStatus('قطع شده'));

      await connection.start();
      setConnectionStatus('متصل');
      window.chatHubConnection = connection;

      // شروع چت پشتیبانی
      await startSupportChat();
    } catch (error) {
      console.error('اتصال با شکست مواجه شد:', error);
      setConnectionStatus('خطا');
    }
  };

  const startSupportChat = async () => {
    try {
      const response = await api.post('/api/support/start', {
        guestSessionId: localStorage.getItem('chat_session_id'),
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        ipAddress: '',
        userAgent: navigator.userAgent,
        initialMessage: 'Guest started a support chat',
      });

      const result = response.data;
      setChatRoomId(result.chatRoomId);
      setTicketId(result.ticketId);

      if (result.assignedAgentName) {
        setAgentInfo({
          id: result.assignedAgentId,
          name: result.assignedAgentName,
        });
      }

      // پیوستن به اتاق از طریق SignalR
      if (window.chatHubConnection) {
        await window.chatHubConnection.invoke('JoinRoom', result.chatRoomId.toString());
      }
    } catch (error) {
      console.error('شروع چت با شکست مواجه شد:', error);
      addSystemMessage('اتصال به پشتیبانی با شکست مواجه شد. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleRegistration = (e) => {
    e.preventDefault();
    if (guestInfo.name.trim()) {
      setIsRegistered(true);
      localStorage.setItem('chat_guest_info', JSON.stringify(guestInfo));
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatRoomId) return;

    const tempMessage = {
      id: Date.now(),
      content: inputMessage,
      senderName: 'شما',
      isGuest: true,
      createdAt: new Date().toISOString(),
      status: 'درحال ارسال',
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage('');

    try {
      await api.post(
        `/api/chat/rooms/${chatRoomId}/messages`,
        {
          content: inputMessage,
          type: 0, // متن
        },
        {
          headers: {
            'X-Session-Id': localStorage.getItem('chat_session_id'),
          },
        }
      );
    } catch (error) {
      console.error('ارسال پیام با شکست مواجه شد:', error);
      updateMessageStatus(tempMessage.id, 'ناموفق');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chatRoomId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type.startsWith('image/') ? '1' : '2');

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: {
          'X-Session-Id': localStorage.getItem('chat_session_id'),
        },
      });
      const result = response.data;

      // ارسال پیام فایل
      await api.post(
        `/api/chat/rooms/${chatRoomId}/messages`,
        {
          content: file.name,
          type: file.type.startsWith('image/') ? 1 : 2,
          attachmentUrl: result.fileUrl,
        },
        {
          headers: {
            'X-Session-Id': localStorage.getItem('chat_session_id'),
          },
        }
      );
    } catch (error) {
      console.error('آپلود فایل با شکست مواجه شد:', error);
      addSystemMessage('آپلود فایل با شکست مواجه شد. لطفاً دوباره تلاش کنید.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
        await uploadAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('شروع ضبط با شکست مواجه شد:', error);
      addSystemMessage('دسترسی به میکروفون رد شد.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    formData.append('type', '3'); // نوع صوتی

    try {
      const response = await api.post('/api/chat/upload', formData, {
        headers: {
          'X-Session-Id': localStorage.getItem('chat_session_id'),
        },
      });
      const result = response.data;

      // ارسال پیام صوتی
      await api.post(
        `/api/chat/rooms/${chatRoomId}/messages`,
        {
          content: 'پیام صوتی',
          type: 3, // صوتی
          attachmentUrl: result.fileUrl,
        },
        {
          headers: {
            'X-Session-Id': localStorage.getItem('chat_session_id'),
          },
        }
      );
    } catch (error) {
      console.error('آپلود صدا با شکست مواجه شد:', error);
    }
  };

  const addSystemMessage = (content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        content,
        type: 5, // سیستم
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const updateMessageStatus = (messageId, status) => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? {...msg, status} : msg)));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const styles = {
    widgetButton: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#0d6efd',
      color: 'white',
      borderRadius: '50%',
      padding: '16px',
      border: 'none',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      zIndex: 50,
    },
    chatWindow: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s',
    },
    chatHeader: {
      backgroundColor: '#0d6efd',
      color: 'white',
      padding: '16px',
      borderRadius: '8px 8px 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
    },
    messageContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    inputContainer: {
      borderTop: '1px solid #dee2e6',
      padding: '16px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
    },
  };

  // Widget button با Bootstrap classes
  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} style={styles.widgetButton} className="position-fixed" onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')} onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}>
        <MessageCircle size={24} />
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">1</span>
      </button>
    );
  }

  // Chat window structure با Bootstrap
  return (
    <div
      style={{
        ...styles.chatWindow,
        width: isMinimized ? '320px' : '384px',
        height: isMinimized ? '64px' : '600px',
        maxHeight: '80vh',
      }}
    >
      {/* Header با Bootstrap */}
      <div style={styles.chatHeader} onClick={() => setIsMinimized(!isMinimized)} className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white bg-opacity-25 rounded-circle p-2">
            <MessageCircle size={24} />
          </div>
          <div>
            <h6 className="mb-0 fw-semibold">گفتگوی پشتیبانی</h6>
            {agentInfo && <small className="opacity-75">{agentInfo.name}</small>}
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="btn btn-sm text-white p-1"
            style={{background: 'transparent', border: 'none'}}
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="btn btn-sm text-white p-1"
            style={{background: 'transparent', border: 'none'}}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Registration form با Bootstrap */}
          {!isRegistered ? (
            <div className="p-4 d-flex flex-column justify-content-center h-100">
              <h5 className="mb-3">شروع گفتگو</h5>
              <p className="text-muted mb-4">لطفاً اطلاعات خود را وارد کنید تا گفتگوی شما با پشتیبانی آغاز شود.</p>
              <div className="d-flex flex-column gap-3">
                <input type="text" placeholder="نام شما *" value={guestInfo.name} onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})} className="form-control" required />
                <input type="email" placeholder="ایمیل (اختیاری)" value={guestInfo.email} onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})} className="form-control" />
                <input type="tel" placeholder="شماره تماس (اختیاری)" value={guestInfo.phone} onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})} className="form-control" />
                <button onClick={handleRegistration} className="btn btn-primary" disabled={!guestInfo.name.trim()}>
                  شروع چت
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Connection status با Bootstrap Alert */}
              {connectionStatus !== 'connected' && (
                <div className="alert alert-warning mb-0 rounded-0 py-2">
                  <small>{connectionStatus === 'reconnecting' ? 'در حال اتصال مجدد...' : 'ارتباط قطع شد'}</small>
                </div>
              )}

              {/* Messages با Bootstrap */}
              <div style={styles.messageContainer}>
                {messages.map((message) => (
                  <div key={message.id} className={`d-flex ${message.isGuest ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div className={`rounded p-3 ${message.type === 5 ? 'w-100 text-center bg-light' : message.isGuest ? 'bg-primary text-white' : 'bg-light'}`} style={{maxWidth: '70%'}}>
                      {message.type === 5 ? (
                        <small className="text-muted fst-italic">{message.content}</small>
                      ) : (
                        <>
                          {!message.isGuest && <small className="d-block fw-semibold opacity-75 mb-1">{message.senderName || agentInfo?.name || 'پشتیبانی'}</small>}

                          {/* Message content based on type */}
                          {message.type === 0 && <p className="mb-1 small">{message.content}</p>}

                          {message.type === 1 && <img src={message.attachmentUrl} alt={message.content} className="img-fluid rounded" style={{maxWidth: '100%'}} />}

                          {message.type === 2 && (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-2 text-decoration-underline">
                              <Paperclip size={16} />
                              {message.content}
                            </a>
                          )}

                          {message.type === 3 && (
                            <audio controls className="w-100" style={{maxWidth: '250px'}}>
                              <source src={message.attachmentUrl} type="audio/webm" />
                            </audio>
                          )}

                          <small className="d-block opacity-75 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                            {message.status === 'sending' && ' • در حال ارسال...'}
                            {message.status === 'failed' && ' • ناموفق'}
                          </small>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <div className="d-flex gap-1">
                      <span className="badge bg-secondary rounded-circle" style={{width: '8px', height: '8px'}}></span>
                      <span className="badge bg-secondary rounded-circle" style={{width: '8px', height: '8px'}}></span>
                      <span className="badge bg-secondary rounded-circle" style={{width: '8px', height: '8px'}}></span>
                    </div>
                    <small>{agentInfo?.name || 'اپراتور'} در حال نوشتن...</small>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area با Bootstrap */}
              <div style={styles.inputContainer}>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-light btn-sm" disabled={!chatRoomId}>
                  <Paperclip size={20} />
                </button>

                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="d-none" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" />

                <button onClick={isRecording ? stopRecording : startRecording} className={`btn btn-sm ${isRecording ? 'btn-danger' : 'btn-light'}`} disabled={!chatRoomId}>
                  {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={chatRoomId ? 'پیام خود را بنویسید...' : 'در حال اتصال...'}
                  className="form-control form-control-sm"
                  disabled={!chatRoomId}
                />

                <button onClick={sendMessage} disabled={!inputMessage.trim() || !chatRoomId} className="btn btn-primary btn-sm">
                  <Send size={20} />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LiveChatWidget;
