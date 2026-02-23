import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../services/chat';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [prevMsgCount, setPrevMsgCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.userId);
      const interval = setInterval(() => loadMessages(selectedUser.userId), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (messages.length > prevMsgCount) {
      scrollToBottom('smooth');
    }
    setPrevMsgCount(messages.length);
  }, [messages]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      const data = response.data || response;
      setIsAdmin(data.isAdmin);
      if (data.isAdmin) {
        setConversations(data.conversations || []);
      } else {
        if (data.conversation) {
          setSelectedUser(data.conversation);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    if (!userId) return;
    try {
      const response = await getMessages(userId);
      const data = response.data || response;
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectUser = (conv) => {
    setSelectedUser(conv);
    setMessages([]);
    setIsLoadingMessages(true);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || !selectedUser) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Mensaje optimista
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      fromMe: true,
      created_at: new Date().toISOString(),
      _sending: true
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      await sendMessage(selectedUser.userId, content);
      await loadMessages(selectedUser.userId);
    } catch (error) {
      console.error('Error enviando:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  const groupByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const key = new Date(msg.created_at).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  };

  const Avatar = ({ name, size = 'md', color = 'cyan' }) => {
    const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base' };
    const colors = {
      cyan: 'from-cyan-500 to-cyan-700',
      purple: 'from-purple-500 to-purple-700',
      green: 'from-green-500 to-green-700'
    };
    return (
      <div className={`${sizes[size]} bg-gradient-to-br ${colors[color]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg`}>
        {name?.charAt(0).toUpperCase()}
      </div>
    );
  };

  const MessageBubble = ({ msg, otherUser }) => {
    const isMe = msg.fromMe;
    return (
      <div className={`flex items-end gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'} msg-appear`}>
        {!isMe && <Avatar name={otherUser?.username} size="sm" color="purple" />}
        <div className={`group max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className={`relative px-4 py-2.5 rounded-2xl shadow-md transition-all duration-200 ${
            isMe
              ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-br-sm'
              : 'bg-[#1e2433] text-gray-100 border border-white/5 rounded-bl-sm'
          } ${msg._sending ? 'opacity-60' : 'opacity-100'}`}>
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
          </div>
          <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span className="text-[10px] text-gray-500">{formatTime(msg.created_at)}</span>
            {isMe && (
              <span className="text-[10px]">
                {msg._sending ? (
                  <span className="text-gray-600">•••</span>
                ) : msg.read_at ? (
                  <span className="text-cyan-400">✓✓</span>
                ) : (
                  <span className="text-gray-500">✓</span>
                )}
              </span>
            )}
          </div>
        </div>
        {isMe && <Avatar name={user?.username} size="sm" color="cyan" />}
      </div>
    );
  };

  const EmptyChat = ({ name }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-white/10">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="text-gray-300 font-medium">Ningún mensaje aún</p>
      <p className="text-gray-500 text-sm mt-1">Inicia la conversación con {name}</p>
    </div>
  );

  const MessageInput = () => (
    <div className="bg-[#0e1117] border-t border-white/5 px-4 py-3">
      <form onSubmit={handleSendMessage} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); autoResize(e); }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            className="w-full bg-[#1a2030] border border-white/10 rounded-2xl px-4 py-3 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-[#1e2540] transition-all duration-200 resize-none leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        <button
          type="submit"
          disabled={isSending || !newMessage.trim()}
          className="w-11 h-11 flex-shrink-0 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 active:scale-95"
        >
          {isSending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );

  const grouped = groupByDate(messages);

  // ──────────────────────────────────────────
  // VISTA ADMIN
  // ──────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="h-screen bg-[#080c14] text-white flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0e1117] border-b border-white/5 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-white">Chat Privado</h1>
            <p className="text-xs text-gray-500">{conversations.length} empleados</p>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar de conversaciones */}
          <div className="w-72 border-r border-white/5 flex flex-col bg-[#0b0f1a] flex-shrink-0">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversaciones</p>
            </div>

            <div className="flex-1 overflow-y-auto chat-scroll">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-white/5 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-12 px-4">
                  <p className="text-sm">Sin empleados</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => handleSelectUser(conv)}
                    className={`w-full p-4 flex items-center gap-3 transition-all duration-150 hover:bg-white/5 text-left border-b border-white/[0.03] ${
                      selectedUser?.userId === conv.userId ? 'bg-white/5 border-l-2 border-l-cyan-500' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar name={conv.username} color="cyan" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{conv.username}</span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-gray-600 flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                          {conv.lastMessage.fromMe ? 'Tú: ' : ''}{conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 mt-0.5">Sin mensajes</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel de chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedUser ? (
              <>
                {/* Header del chat */}
                <div className="bg-[#0e1117] border-b border-white/5 px-5 py-3 flex items-center gap-3 flex-shrink-0">
                  <Avatar name={selectedUser.username} size="sm" color="cyan" />
                  <div>
                    <p className="font-medium text-sm">{selectedUser.username}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email || 'Empleado'}</p>
                  </div>
                </div>

                {/* Mensajes */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 chat-scroll">
                  {isLoadingMessages ? (
                    <div className="space-y-4 pt-4">
                      {[1,2,3].map(i => (
                        <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : ''} animate-pulse`}>
                          <div className="w-8 h-8 bg-white/5 rounded-full flex-shrink-0" />
                          <div className={`h-10 bg-white/5 rounded-2xl ${i % 2 === 0 ? 'w-40' : 'w-56'}`} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <EmptyChat name={selectedUser.username} />
                  ) : (
                    Object.entries(grouped).map(([dateKey, msgs]) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-3 my-5">
                          <div className="flex-1 h-px bg-white/5" />
                          <span className="text-[11px] text-gray-600 px-3 py-1 bg-white/[0.03] rounded-full border border-white/5">
                            {formatDate(msgs[0].created_at)}
                          </span>
                          <div className="flex-1 h-px bg-white/5" />
                        </div>
                        {msgs.map(msg => (
                          <MessageBubble key={msg.id} msg={msg} otherUser={selectedUser} />
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} className="h-1" />
                </div>

                <MessageInput />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-600">
                <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p className="text-sm">Selecciona un empleado para chatear</p>
              </div>
            )}
          </div>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // VISTA EMPLEADO
  // ──────────────────────────────────────────
  return (
    <div className="h-screen bg-[#080c14] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#0e1117] border-b border-white/5 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          {selectedUser && <Avatar name={selectedUser.username} color="purple" />}
          <div>
            <h1 className="font-semibold text-white text-sm">{selectedUser?.username || 'Administrador'}</h1>
            <p className="text-xs text-gray-500">Conversación privada</p>
          </div>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 chat-scroll">
        {isLoading || isLoadingMessages ? (
          <div className="space-y-4 pt-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : ''} animate-pulse`}>
                {i % 2 !== 0 && <div className="w-8 h-8 bg-white/5 rounded-full flex-shrink-0" />}
                <div className={`h-10 bg-white/5 rounded-2xl ${i % 2 === 0 ? 'w-32' : 'w-48'}`} />
                {i % 2 === 0 && <div className="w-8 h-8 bg-white/5 rounded-full flex-shrink-0" />}
              </div>
            ))}
          </div>
        ) : !selectedUser ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No hay administrador disponible</p>
          </div>
        ) : messages.length === 0 ? (
          <EmptyChat name={selectedUser.username} />
        ) : (
          Object.entries(grouped).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[11px] text-gray-600 px-3 py-1 bg-white/[0.03] rounded-full border border-white/5">
                  {formatDate(msgs[0].created_at)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              {msgs.map(msg => (
                <MessageBubble key={msg.id} msg={msg} otherUser={selectedUser} />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {selectedUser && <MessageInput />}

      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .chat-scroll::-webkit-scrollbar { width: 4px; }
  .chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
  .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .msg-appear { animation: msgIn 0.2s ease-out forwards; }
`;

export default Chat;
