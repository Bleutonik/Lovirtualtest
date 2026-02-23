import { useState, useEffect, useRef, useCallback, memo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage, deleteConversation } from '../services/chat';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtTime = ds =>
  new Date(ds).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const fmtDate = ds => {
  const d = new Date(ds), now = new Date(), yest = new Date();
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())   return 'Hoy';
  if (d.toDateString() === yest.toDateString())  return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

// ── Avatar ─────────────────────────────────────────────────────────────────────
const Av = ({ name = '?', sm }) => (
  <div style={{
    width: sm ? 30 : 38, height: sm ? 30 : 38, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: sm ? 11 : 14, color: '#fff',
  }}>
    {String(name).charAt(0).toUpperCase()}
  </div>
);

// ── Burbuja de mensaje ─────────────────────────────────────────────────────────
const Bubble = ({ msg, otherName, myName }) => {
  const mine = msg.fromMe;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6, justifyContent: mine ? 'flex-end' : 'flex-start', animation: msg._isNew ? 'bubbleIn .2s ease both' : 'none' }}>
      {!mine && <Av name={otherName} sm />}
      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 3 }}>
        <div style={{
          padding: '9px 14px', fontSize: 14, lineHeight: 1.55,
          wordBreak: 'break-word', whiteSpace: 'pre-wrap',
          ...(mine
            ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#fff', borderRadius: '18px 18px 4px 18px', opacity: msg._sending ? 0.6 : 1 }
            : { background: '#1c2537', color: '#dde6f0', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 4px' })
        }}>
          {msg.content}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingInline: 4, flexDirection: mine ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 10, color: '#374151' }}>{fmtTime(msg.created_at)}</span>
          {mine && (
            <span style={{ fontSize: 10, color: msg._sending ? '#374151' : msg.read_at ? '#06b6d4' : '#4b5563' }}>
              {msg._sending ? '·' : msg.read_at ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
      {mine && <Av name={myName} sm />}
    </div>
  );
};

// ── Separador de fecha ─────────────────────────────────────────────────────────
const DateBar = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    <span style={{ fontSize: 11, color: '#374151', padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
  </div>
);

// ── Shimmer de carga ───────────────────────────────────────────────────────────
const Shimmer = () => (
  <div style={{ padding: 16 }}>
    {[52, 80, 60, 96, 44].map((w, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12, justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
        {i % 2 !== 0 && <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />}
        <div className="skeleton" style={{ width: w + 40, height: 36, borderRadius: 18 }} />
        {i % 2 === 0 && <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />}
      </div>
    ))}
  </div>
);

// ── ChatInput ─────────────────────────────────────────────────────────────────
// memo() garantiza que NO re-renderiza cuando el padre actualiza mensajes (polling).
// useState interno solo re-renderiza este componente, nunca el padre.
const ChatInput = memo(({ onSend, sending }) => {
  const [text, setText] = useState('');
  const taRef = useRef(null);

  // Restaurar foco después de enviar
  useEffect(() => {
    if (!sending) taRef.current?.focus();
  }, [sending]);

  const handleChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = () => {
    const val = text.trim();
    if (!val || sending) return;
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
    onSend(val);
  };

  const canSend = text.trim().length > 0 && !sending;

  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#07090f', flexShrink: 0 }}>
      <textarea
        ref={taRef}
        value={text}
        onChange={handleChange}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Escribe un mensaje…"
        disabled={sending}
        rows={1}
        style={{
          flex: 1, borderRadius: 22, padding: '10px 16px', fontSize: 14,
          resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
          background: '#111827', border: '1px solid rgba(14,165,233,0.3)',
          color: '#f1f5f9', minHeight: 42, maxHeight: 120,
        }}
      />
      <button type="submit" disabled={!canSend}
        style={{
          width: 40, height: 40, borderRadius: 12, border: 'none', color: '#fff', flexShrink: 0,
          background: canSend ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canSend ? 'pointer' : 'default',
        }}>
        {sending
          ? <svg className="animate-spin" width={16} height={16} fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }} />
            </svg>
          : <svg width={16} height={16} fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
        }
      </button>
    </form>
  );
});

// ── Modal genérico ─────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 }}>
      {children}
    </div>
  </div>
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin' || user?.role === 'supervisor';

  const [convs,        setConvs]        = useState([]);
  const [selUser,      setSelUser]      = useState(null);
  const [msgs,         setMsgs]         = useState([]);
  const [convLoading,  setConvLoading]  = useState(true);
  const [msgsLoading,  setMsgsLoading]  = useState(false);
  const [sending,      setSending]      = useState(false);

  // Admin extras
  const [confirmDel,     setConfirmDel]     = useState(null); // userId
  const [showCompose,    setShowCompose]    = useState(false);
  const [composeUid,     setComposeUid]     = useState('');
  const [composeTxt,     setComposeTxt]     = useState('');
  const [composeSending, setComposeSending] = useState(false);

  const endRef    = useRef(null);
  const scrollRef = useRef(null);
  const lastIdRef = useRef(0);
  const selUidRef = useRef(null);

  useEffect(() => { selUidRef.current = selUser?.userId ?? null; }, [selUser?.userId]);

  // Poll conversaciones
  useEffect(() => {
    fetchConvs();
    const iv = setInterval(fetchConvs, 8000);
    return () => clearInterval(iv);
  }, []);

  // Mensajes: carga inicial + poll 3s
  useEffect(() => {
    if (!selUser?.userId) return;
    lastIdRef.current = 0;
    setMsgsLoading(true);
    loadAll(selUser.userId);
    const iv = setInterval(() => poll(selUidRef.current), 3000);
    return () => clearInterval(iv);
  }, [selUser?.userId]);

  // Auto-scroll
  useEffect(() => {
    if (msgs.length && isNearBottom()) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs.length]);

  const isNearBottom = () => {
    const c = scrollRef.current;
    return !c || c.scrollHeight - c.scrollTop - c.clientHeight < 120;
  };

  const scrollToEnd = (instant) =>
    endRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });

  // ── API calls ──────────────────────────────────────────────────────────────
  const fetchConvs = async () => {
    try {
      const res = await getConversations();
      const d = res?.data || res;
      if (d.isAdmin) {
        startTransition(() => setConvs(d.conversations || []));
      } else if (d.conversation) {
        setSelUser(prev => prev?.userId === d.conversation.userId ? prev : d.conversation);
      }
    } catch { }
    finally { setConvLoading(false); }
  };

  const loadAll = async (uid) => {
    try {
      const res  = await getMessages(uid, null);
      const list = (res?.data?.messages || []).map(m => ({ ...m, _isNew: false }));
      setMsgs(list);
      lastIdRef.current = list.length ? list[list.length - 1].id : 0;
      requestAnimationFrame(() => scrollToEnd(true));
    } catch { }
    finally { setMsgsLoading(false); }
  };

  const poll = async (uid) => {
    if (!uid) return;
    try {
      const res      = await getMessages(uid, lastIdRef.current);
      const incoming = res?.data?.messages || [];
      if (!incoming.length) return;
      startTransition(() => {
        setMsgs(prev => {
          const seen  = new Set(prev.map(m => m.id));
          const fresh = incoming
            .filter(m => !seen.has(m.id))
            .map(m => ({ ...m, _isNew: true }));
          if (!fresh.length) return prev;
          lastIdRef.current = fresh[fresh.length - 1].id;
          return [...prev, ...fresh];
        });
      });
    } catch { }
  };

  const handleSend = useCallback(async (content) => {
    if (!content || !selUidRef.current) return;
    setSending(true);
    const tid  = `t${Date.now()}`;
    const temp = { id: tid, content, fromMe: true, created_at: new Date().toISOString(), _sending: true, _isNew: true };
    setMsgs(prev => [...prev, temp]);
    scrollToEnd(true);
    try {
      const res  = await sendMessage(selUidRef.current, content);
      const real = res?.data?.message;
      if (real) {
        setMsgs(prev => prev.map(m => m.id === tid ? { ...real, fromMe: true, _isNew: false } : m));
        lastIdRef.current = real.id;
      } else {
        await loadAll(selUidRef.current);
      }
    } catch {
      setMsgs(prev => prev.filter(m => m.id !== tid));
    } finally {
      setSending(false);
    }
  }, []);

  // ── Admin: eliminar conversación ───────────────────────────────────────────
  const handleDelete = async (userId) => {
    try {
      await deleteConversation(userId);
      if (selUser?.userId === userId) {
        setMsgs([]);
        lastIdRef.current = 0;
      }
      setConfirmDel(null);
      fetchConvs();
    } catch { }
  };

  // ── Admin: nueva conversación ──────────────────────────────────────────────
  const handleCompose = async () => {
    if (!composeUid || !composeTxt.trim()) return;
    setComposeSending(true);
    try {
      await sendMessage(parseInt(composeUid), composeTxt.trim());
      await fetchConvs();
      const target = convs.find(c => c.userId === parseInt(composeUid));
      if (target) selectUser(target);
      setShowCompose(false);
      setComposeTxt('');
      setComposeUid('');
    } catch { }
    finally { setComposeSending(false); }
  };

  const selectUser = (conv) => {
    if (conv.userId === selUser?.userId) return;
    setMsgs([]);
    setMsgsLoading(true);
    setSelUser(conv);
  };

  // ── Render mensajes ────────────────────────────────────────────────────────
  const renderMessages = () => {
    if (msgsLoading) return <Shimmer />;
    if (!msgs.length) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={20} height={20} fill="none" stroke="currentColor" style={{ color: '#374151' }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p style={{ fontSize: 13, color: '#4b5563' }}>
          {isAdmin ? `Inicia la conversación con ${selUser?.username}` : 'Escribe tu primer mensaje'}
        </p>
      </div>
    );
    const groups = {};
    msgs.forEach(m => {
      const k = new Date(m.created_at).toDateString();
      (groups[k] = groups[k] || []).push(m);
    });
    return Object.entries(groups).map(([dk, grp]) => (
      <div key={dk}>
        <DateBar label={fmtDate(grp[0].created_at)} />
        {grp.map(msg => (
          <Bubble key={msg.id} msg={msg} otherName={selUser?.username} myName={user?.username} />
        ))}
      </div>
    ));
  };

  // ── VISTA ADMIN ────────────────────────────────────────────────────────────
  if (isAdmin) return (
    <div style={S.screen}>
      <header style={S.header}>
        <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Chat</p>
          <p style={{ fontSize: 11, color: '#4b5563' }}>{convs.length} empleados</p>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={S.sidebar}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '.08em' }}>EMPLEADOS</p>
            <button onClick={() => { setComposeUid(convs[0]?.userId?.toString() || ''); setShowCompose(true); }}
              title="Nueva conversación"
              style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: '#67e8f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="chat-scroll">
            {convLoading
              ? [1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '70%' }} />
                      <div className="skeleton" style={{ height: 9,  borderRadius: 6, width: '45%' }} />
                    </div>
                  </div>
                ))
              : convs.length === 0
                ? <p style={{ padding: '36px 14px', textAlign: 'center', fontSize: 12, color: '#374151' }}>Sin empleados</p>
                : convs.map(conv => {
                    const active     = selUser?.userId === conv.userId;
                    const confirming = confirmDel  === conv.userId;
                    return (
                      <div key={conv.userId} style={{ position: 'relative' }}>

                        {/* Confirmación de borrado inline */}
                        {confirming && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(7,11,18,0.97)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <p style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>¿Eliminar chat con <b style={{ color: '#f1f5f9' }}>{conv.username}</b>?</p>
                            <button onClick={() => handleDelete(conv.userId)}
                              style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sí</button>
                            <button onClick={() => setConfirmDel(null)}
                              style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>No</button>
                          </div>
                        )}

                        <button onClick={() => selectUser(conv)} style={{
                          ...S.convBtn,
                          borderLeft: `2px solid ${active ? '#06b6d4' : 'transparent'}`,
                          background: active ? 'rgba(6,182,212,0.07)' : 'transparent',
                        }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Av name={conv.username} />
                            {conv.unreadCount > 0 && (
                              <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{conv.username}</span>
                            <p style={{ fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: conv.unreadCount > 0 ? '#94a3b8' : '#374151', fontWeight: conv.unreadCount > 0 ? 500 : 400 }}>
                              {conv.lastMessage
                                ? (conv.lastMessage.fromMe ? 'Tú: ' : '') + conv.lastMessage.content
                                : <span style={{ fontStyle: 'italic' }}>Sin mensajes</span>}
                            </p>
                          </div>
                          {/* Botón trash — siempre visible */}
                          <button onClick={e => { e.stopPropagation(); setConfirmDel(conv.userId); }}
                            title="Eliminar conversación"
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </button>
                      </div>
                    );
                  })
            }
          </div>
        </div>

        {/* ── Panel de chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selUser
            ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#374151' }}>
                <svg width={40} height={40} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: .15 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p style={{ fontSize: 13 }}>Selecciona un empleado</p>
                <button onClick={() => { setComposeUid(convs[0]?.userId?.toString() || ''); setShowCompose(true); }}
                  className="btn btn-primary text-xs px-4 py-2 mt-2">
                  + Nueva conversación
                </button>
              </div>
            : <>
                <div style={S.chatHeader}>
                  <Av name={selUser.username} sm />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{selUser.username}</p>
                    <p style={{ fontSize: 11, color: '#4b5563' }}>{selUser.email || 'Empleado'}</p>
                  </div>
                  <button onClick={() => setConfirmDel(selUser.userId)} title="Eliminar conversación"
                    style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} className="chat-scroll">
                  {renderMessages()}
                  <div ref={endRef} style={{ height: 4 }} />
                </div>
                <ChatInput onSend={handleSend} sending={sending} />
              </>
          }
        </div>
      </div>

      {/* Modal: eliminar conversación abierta (desde header del chat) */}
      {confirmDel && confirmDel === selUser?.userId && (
        <Modal onClose={() => setConfirmDel(null)}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Eliminar conversación</p>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Se borrarán todos los mensajes con <b style={{ color: '#f1f5f9' }}>{selUser?.username}</b>. Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmDel(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={() => handleDelete(confirmDel)} className="btn btn-danger" style={{ flex: 1 }}>Eliminar</button>
          </div>
        </Modal>
      )}

      {/* Modal: nueva conversación */}
      {showCompose && (
        <Modal onClose={() => { setShowCompose(false); setComposeTxt(''); setComposeUid(''); }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Nueva Conversación</p>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Inicia un chat con un empleado</p>
            </div>
            <button onClick={() => setShowCompose(false)}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '.04em' }}>EMPLEADO</label>
            <select value={composeUid} onChange={e => setComposeUid(e.target.value)} className="field" style={{ width: '100%' }}>
              <option value="">Seleccionar empleado…</option>
              {convs.map(c => <option key={c.userId} value={c.userId}>{c.username}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '.04em' }}>MENSAJE</label>
            <textarea
              value={composeTxt}
              onChange={e => setComposeTxt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCompose(); } }}
              rows={3} placeholder="Escribe tu mensaje…"
              className="field resize-none" style={{ width: '100%' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowCompose(false); setComposeTxt(''); setComposeUid(''); }} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={handleCompose} disabled={!composeUid || !composeTxt.trim() || composeSending} className="btn btn-primary" style={{ flex: 1 }}>
              {composeSending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </Modal>
      )}

      <style>{CSS}</style>
    </div>
  );

  // ── VISTA EMPLEADO ─────────────────────────────────────────────────────────
  return (
    <div style={S.screen}>
      <header style={S.header}>
        <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Av name={selUser?.username || 'A'} sm />
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>{selUser?.username || 'Administrador'}</p>
            <p style={{ fontSize: 11, color: '#4b5563' }}>Conversación privada</p>
          </div>
        </div>
      </header>

      {convLoading
        ? <div style={{ flex: 1, overflowY: 'auto' }} className="chat-scroll"><Shimmer /></div>
        : !selUser
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: '#4b5563' }}>No hay administrador disponible</p>
            </div>
          : <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} className="chat-scroll">
                {renderMessages()}
                <div ref={endRef} style={{ height: 4 }} />
              </div>
              <ChatInput onSend={handleSend} sending={sending} />
            </>
      }
      <style>{CSS}</style>
    </div>
  );
}

const S = {
  screen:     { display: 'flex', flexDirection: 'column', height: '100vh', background: '#070b12', color: '#f1f5f9', overflow: 'hidden' },
  header:     { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  sidebar:    { width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0b0f1a', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  convBtn:    { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background .12s', color: '#f1f5f9', fontFamily: 'inherit' },
};

const CSS = `
  .chat-scroll::-webkit-scrollbar { width: 3px; }
  .chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
  @keyframes bubbleIn {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to   { opacity: 1; transform: none; }
  }
  .chat-bubble-in { animation: bubbleIn .22s cubic-bezier(.2,.8,.2,1) both; }
`;
