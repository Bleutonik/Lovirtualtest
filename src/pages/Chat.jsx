import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../services/chat';

// ─────────────────────────────────────────────────────────────────
//  Helpers y sub-componentes definidos FUERA de Chat
//  (si estuvieran dentro, React los desmontaría en cada render,
//   causando que el textarea pierda el foco cada 4 segundos)
// ─────────────────────────────────────────────────────────────────

const fmtTime = (ds) =>
  new Date(ds).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (ds) => {
  const d = new Date(ds), now = new Date(), yest = new Date();
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  if (d.toDateString() === yest.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const Avatar = ({ name = '?', size = 'md' }) => (
  <div
    className={`${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white`}
    style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)' }}>
    {String(name).charAt(0).toUpperCase()}
  </div>
);

const EmptyChat = ({ name }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
      style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
      <svg className="w-7 h-7" style={{ color: '#475569' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <p className="font-medium text-sm" style={{ color: '#64748b' }}>Sin mensajes aún</p>
    <p className="text-xs mt-1" style={{ color: '#334155' }}>Inicia la conversación con {name}</p>
  </div>
);

const MsgSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
        {i % 2 !== 0 && <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />}
        <div className={`skeleton rounded-2xl ${i % 2 === 0 ? 'w-36' : 'w-52'}`} style={{ height: '40px' }} />
        {i % 2 === 0 && <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />}
      </div>
    ))}
  </div>
);

const MessageBubble = ({ msg, otherName, myName }) => {
  const isMe = msg.fromMe;
  return (
    <div className={`flex items-end gap-2 mb-2 msg-appear ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && <Avatar name={otherName} size="sm" />}
      <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-sm ${isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'} ${msg._sending ? 'opacity-60' : ''}`}
          style={isMe
            ? { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff' }
            : { background: '#1e2433', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px]" style={{ color: '#334155' }}>{fmtTime(msg.created_at)}</span>
          {isMe && (
            <span className="text-[10px]">
              {msg._sending
                ? <span style={{ color: '#334155' }}>•••</span>
                : msg.read_at
                  ? <span style={{ color: '#06b6d4' }}>✓✓</span>
                  : <span style={{ color: '#475569' }}>✓</span>}
            </span>
          )}
        </div>
      </div>
      {isMe && <Avatar name={myName} size="sm" />}
    </div>
  );
};

// MessageInput DEBE estar fuera de Chat para no perder el foco en cada render
const MessageInput = ({ value, isSending, textareaRef, onChange, onKeyDown, onSubmit }) => (
  <div className="flex-shrink-0 px-4 py-3"
    style={{ background: '#0b0f1a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
    <form onSubmit={onSubmit} className="flex items-end gap-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Escribe un mensaje… (Enter para enviar)"
        className="flex-1 rounded-2xl px-4 py-3 text-sm resize-none leading-relaxed focus:outline-none transition-colors duration-200"
        style={{
          background: '#1a2030',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#f1f5f9',
          minHeight: '44px',
          maxHeight: '120px',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(6,182,212,0.4)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      />
      <button
        type="submit"
        disabled={isSending || !value.trim()}
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
        style={{
          background: (!isSending && value.trim()) ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 'rgba(255,255,255,0.04)',
          color: '#f1f5f9',
        }}>
        {isSending
          ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          : <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>}
      </button>
    </form>
  </div>
);

// ─────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────
const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derivado del contexto de auth — sin estado, sin flash al cargar
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Cargar conversaciones al montar y cada 10s ──
  useEffect(() => {
    loadConversations();
    const iv = setInterval(loadConversations, 10000);
    return () => clearInterval(iv);
  }, []);

  // ── Cargar mensajes cuando cambia el userId seleccionado ──
  // Usar selectedUser?.userId evita que el efecto se dispare cuando el
  // intervalo de loadConversations crea un nuevo objeto con los mismos valores
  useEffect(() => {
    if (!selectedUser?.userId) return;
    setIsLoadingMessages(true);
    loadMessages(selectedUser.userId);
    const iv = setInterval(() => loadMessages(selectedUser.userId), 4000);
    return () => clearInterval(iv);
  }, [selectedUser?.userId]);

  // ── Auto-scroll al llegar mensajes nuevos ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── API ──
  const loadConversations = async () => {
    try {
      const res = await getConversations();
      const data = res?.data || res;
      if (data.isAdmin) {
        setConversations(data.conversations || []);
      } else if (data.conversation) {
        // Solo actualizar si el userId cambió — evita reiniciar el intervalo de mensajes
        setSelectedUser(prev =>
          prev?.userId === data.conversation.userId ? prev : data.conversation
        );
      }
    } catch (err) {
      console.error('loadConversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await getMessages(userId);
      const data = res?.data || res;
      setMessages(data.messages || []);
    } catch (err) {
      console.error('loadMessages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // ── Handlers ──
  const handleSelectUser = (conv) => {
    setSelectedUser(conv);
    setMessages([]);
    setIsLoadingMessages(true);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || !selectedUser) return;
    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      fromMe: true,
      created_at: new Date().toISOString(),
      _sending: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    try {
      await sendMessage(selectedUser.userId, content);
      await loadMessages(selectedUser.userId);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // Agrupar mensajes por fecha — llamado como función, no como componente
  const renderMessageList = () => {
    if (isLoadingMessages) return <MsgSkeleton />;
    if (messages.length === 0) return <EmptyChat name={selectedUser?.username || 'Admin'} />;

    const groups = {};
    messages.forEach(m => {
      const k = new Date(m.created_at).toDateString();
      (groups[k] = groups[k] || []).push(m);
    });

    return Object.entries(groups).map(([dk, msgs]) => (
      <div key={dk}>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="text-[11px] px-3 py-1 rounded-full"
            style={{ color: '#334155', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {fmtDate(msgs[0].created_at)}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        {msgs.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            otherName={selectedUser?.username}
            myName={user?.username}
          />
        ))}
      </div>
    ));
  };

  // ────────────────────────────────────────────────────────────
  //  VISTA ADMIN
  // ────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#070b12', color: '#f1f5f9' }}>

        {/* Header */}
        <header className="flex-shrink-0 flex items-center gap-4 px-5 py-3.5"
          style={{ background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-semibold text-sm">Chat Privado</h1>
            <p className="text-xs" style={{ color: '#475569' }}>{conversations.length} empleados</p>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
            style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: '#0b0f1a' }}>
            <div className="px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold tracking-wider" style={{ color: '#334155' }}>EMPLEADOS</p>
            </div>

            <div className="flex-1 overflow-y-auto chat-scroll">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 rounded w-3/4" />
                        <div className="skeleton h-2 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm" style={{ color: '#475569' }}>Sin empleados</p>
                </div>
              ) : conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectUser(conv)}
                  className="w-full p-4 flex items-center gap-3 text-left transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: selectedUser?.userId === conv.userId ? 'rgba(6,182,212,0.07)' : 'transparent',
                    borderLeft: selectedUser?.userId === conv.userId ? '2px solid #06b6d4' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (selectedUser?.userId !== conv.userId) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (selectedUser?.userId !== conv.userId) e.currentTarget.style.background = 'transparent'; }}>
                  <div className="relative">
                    <Avatar name={conv.username} />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: '#ef4444' }}>
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{conv.username}</span>
                      {conv.lastMessage && (
                        <span className="text-[10px] flex-shrink-0" style={{ color: '#334155' }}>
                          {fmtTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${conv.unreadCount > 0 ? 'font-medium' : ''}`}
                      style={{ color: conv.unreadCount > 0 ? '#94a3b8' : '#334155' }}>
                      {conv.lastMessage
                        ? (conv.lastMessage.fromMe ? 'Tú: ' : '') + conv.lastMessage.content
                        : 'Sin mensajes'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel de chat */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedUser ? (
              <>
                {/* Header del chat */}
                <div className="flex-shrink-0 px-5 py-3 flex items-center gap-3"
                  style={{ background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Avatar name={selectedUser.username} size="sm" />
                  <div>
                    <p className="font-medium text-sm">{selectedUser.username}</p>
                    <p className="text-xs" style={{ color: '#475569' }}>{selectedUser.email || 'Empleado'}</p>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4">
                  {renderMessageList()}
                  <div ref={messagesEndRef} className="h-2" />
                </div>

                <MessageInput
                  value={newMessage}
                  isSending={isSending}
                  textareaRef={textareaRef}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSendMessage}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: '#334155' }}>
                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p className="text-sm">Selecciona un empleado para chatear</p>
              </div>
            )}
          </div>
        </div>

        <style>{chatStyles}</style>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  //  VISTA EMPLEADO
  // ────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#070b12', color: '#f1f5f9' }}>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-4 px-5 py-3.5"
        style={{ background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={selectedUser?.username || 'A'} />
          <div>
            <p className="font-semibold text-sm">{selectedUser?.username || 'Administrador'}</p>
            <p className="text-xs" style={{ color: '#475569' }}>Conversación privada</p>
          </div>
        </div>
      </header>

      {/* Área de mensajes */}
      {isLoading ? (
        <div className="flex-1 overflow-y-auto chat-scroll"><MsgSkeleton /></div>
      ) : !selectedUser ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#475569' }}>No hay administrador disponible</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4">
            {renderMessageList()}
            <div ref={messagesEndRef} className="h-2" />
          </div>
          <MessageInput
            value={newMessage}
            isSending={isSending}
            textareaRef={textareaRef}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSubmit={handleSendMessage}
          />
        </>
      )}

      <style>{chatStyles}</style>
    </div>
  );
};

const chatStyles = `
  .chat-scroll::-webkit-scrollbar { width: 4px; }
  .chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 10px; }
  .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(6px) scale(0.98); }
    to   { opacity: 1; transform: none; }
  }
  .msg-appear { animation: msgIn 0.18s ease-out forwards; }
`;

export default Chat;
