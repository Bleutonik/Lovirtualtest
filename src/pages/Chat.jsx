import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../services/chat';

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades puras (fuera del componente = estables, nunca se recrean)
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = ds =>
  new Date(ds).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const fmtDate = ds => {
  const d = new Date(ds), now = new Date(), yest = new Date();
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  if (d.toDateString() === yest.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const groupByDate = msgs => {
  const g = {};
  msgs.forEach(m => { const k = new Date(m.created_at).toDateString(); (g[k] = g[k] || []).push(m); });
  return Object.entries(g);
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes FUERA de Chat
// Si estuvieran dentro, cada re-render crearía nuevas referencias de función
// y React desmontaría/remontaría los nodos → el textarea perdería el foco
// ─────────────────────────────────────────────────────────────────────────────

const Av = ({ name = '?', sm = false }) => (
  <div style={{
    width: sm ? 30 : 38, height: sm ? 30 : 38,
    borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: sm ? 11 : 14, color: '#fff',
  }}>
    {String(name).charAt(0).toUpperCase()}
  </div>
);

const Bubble = ({ msg, otherName, myName }) => {
  const mine = msg.fromMe;
  return (
    <div className={`flex items-end gap-2 mb-1.5 ${mine ? 'justify-end' : ''} ${msg._isNew ? 'chat-bubble-in' : ''}`}>
      {!mine && <Av name={otherName} sm />}
      <div className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`} style={{ maxWidth: '70%' }}>
        <div style={{
          padding: '9px 14px', fontSize: 14, lineHeight: 1.55,
          wordBreak: 'break-word', whiteSpace: 'pre-wrap',
          ...(mine
            ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#fff', borderRadius: '18px 18px 4px 18px', opacity: msg._sending ? 0.6 : 1 }
            : { background: '#1c2537', color: '#dde6f0', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 4px' })
        }}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 ${mine ? 'flex-row-reverse' : ''}`} style={{ paddingInline: 4 }}>
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

const DateBar = ({ label }) => (
  <div className="flex items-center gap-3 my-5">
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    <span style={{ fontSize: 11, color: '#374151', padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
  </div>
);

const EmptyConv = ({ name }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={20} height={20} fill="none" stroke="currentColor" style={{ color: '#374151' }} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <p style={{ fontSize: 13, color: '#4b5563' }}>Empieza a chatear con {name}</p>
  </div>
);

const MsgShimmer = () => (
  <div style={{ padding: 16 }}>
    {[52, 80, 60, 96, 44].map((w, i) => (
      <div key={i} className={`flex items-end gap-2 mb-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
        {i % 2 !== 0 && <div className="skeleton flex-shrink-0" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
        <div className="skeleton" style={{ width: w + 40, height: 36, borderRadius: 18 }} />
        {i % 2 === 0 && <div className="skeleton flex-shrink-0" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
      </div>
    ))}
  </div>
);

// ChatInput DEBE estar fuera de Chat.
// Al estar dentro, React lo desmonta en cada re-render → el textarea pierde foco.
const ChatInput = ({ value, sending, taRef, onChange, onKeyDown, onSubmit }) => (
  <form
    onSubmit={onSubmit}
    style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#07090f', flexShrink: 0 }}
  >
    <textarea
      ref={taRef}
      rows={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder="Escribe un mensaje…"
      style={{
        flex: 1, borderRadius: 22, padding: '10px 16px', fontSize: 14,
        resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
        background: '#111827', border: '1px solid rgba(255,255,255,0.09)',
        color: '#f1f5f9', minHeight: 42, maxHeight: 120,
        transition: 'border-color .2s',
      }}
      onFocus={e => (e.target.style.borderColor = 'rgba(14,165,233,0.5)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
    />
    <button
      type="submit"
      disabled={sending || !value.trim()}
      style={{
        width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: (!sending && value.trim()) ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(255,255,255,0.05)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background .15s',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(.88)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {sending
        ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        : <svg width={16} height={16} fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
          </svg>}
    </button>
  </form>
);

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // isAdmin derivado del contexto — disponible desde el primer render, sin flash
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

  const [convs, setConvs] = useState([]);
  const [selUser, setSelUser] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [convLoading, setConvLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Refs (no causan re-renders)
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const lastIdRef = useRef(0);    // id del último mensaje conocido (para polling incremental)
  const selUidRef = useRef(null); // userId estable para el closure del setInterval

  // Mantener selUidRef sincronizado
  useEffect(() => { selUidRef.current = selUser?.userId ?? null; }, [selUser?.userId]);

  // ── Cargar conversaciones + poll cada 8s ──
  useEffect(() => {
    fetchConvs();
    const iv = setInterval(fetchConvs, 8000);
    return () => clearInterval(iv);
  }, []);

  // ── Carga inicial de mensajes + poll cada 2s cuando cambia el usuario ──
  useEffect(() => {
    if (!selUser?.userId) return;
    lastIdRef.current = 0;
    setMsgsLoading(true);
    loadAll(selUser.userId);
    const iv = setInterval(() => poll(selUidRef.current), 2000);
    return () => clearInterval(iv);
  }, [selUser?.userId]);

  // ── Auto-scroll solo si el usuario ya estaba al fondo ──
  useEffect(() => {
    if (msgs.length && isNearBottom()) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs.length]);

  const isNearBottom = () => {
    const c = scrollRef.current;
    if (!c) return true;
    return c.scrollHeight - c.scrollTop - c.clientHeight < 100;
  };

  const scrollToEnd = (instant = false) =>
    endRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });

  // ── API ──────────────────────────────────────────────────────────────────

  const fetchConvs = async () => {
    try {
      const res = await getConversations();
      const d = res?.data || res;
      if (d.isAdmin) {
        setConvs(d.conversations || []);
      } else if (d.conversation) {
        // Updater funcional: si el userId no cambió, React no re-renderiza nada
        setSelUser(prev => prev?.userId === d.conversation.userId ? prev : d.conversation);
      }
    } catch { /* silencioso */ }
    finally { setConvLoading(false); }
  };

  const loadAll = async (uid) => {
    try {
      const res = await getMessages(uid, null);
      const list = (res?.data?.messages || []).map(m => ({ ...m, _isNew: false }));
      setMsgs(list);
      lastIdRef.current = list.length ? list[list.length - 1].id : 0;
      requestAnimationFrame(() => scrollToEnd(true));
    } catch { /* silencioso */ }
    finally { setMsgsLoading(false); }
  };

  // poll: solo trae mensajes nuevos. Si no hay nada nuevo → no hay setState → no hay re-render
  const poll = async (uid) => {
    if (!uid) return;
    try {
      const res = await getMessages(uid, lastIdRef.current);
      const incoming = res?.data?.messages || [];
      if (!incoming.length) return; // ← exit temprano, sin setState
      const tagged = incoming.map(m => ({ ...m, _isNew: true }));
      setMsgs(prev => {
        const seen = new Set(prev.map(m => m.id));
        const fresh = tagged.filter(m => !seen.has(m.id));
        if (!fresh.length) return prev; // ← sin setState si ya los tenemos
        lastIdRef.current = fresh[fresh.length - 1].id;
        return [...prev, ...fresh];
      });
    } catch { /* silencioso */ }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const selectUser = (conv) => {
    if (conv.userId === selUser?.userId) return;
    setMsgs([]);
    setMsgsLoading(true);
    setSelUser(conv);
    setTimeout(() => taRef.current?.focus(), 80);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || sending || !selUser) return;
    setInput('');
    setSending(true);

    // Mensaje optimista
    const tid = `t${Date.now()}`;
    const temp = { id: tid, content, fromMe: true, created_at: new Date().toISOString(), _sending: true, _isNew: true };
    setMsgs(prev => [...prev, temp]);
    scrollToEnd(true);

    try {
      const res = await sendMessage(selUser.userId, content);
      const real = res?.data?.message;
      if (real) {
        // Reemplaza el temp con el mensaje real (mismo lugar en la lista, sin re-animar)
        setMsgs(prev => prev.map(m => m.id === tid ? { ...real, fromMe: true, _isNew: false } : m));
        lastIdRef.current = real.id;
      } else {
        // Fallback: recarga completa
        await loadAll(selUser.userId);
      }
    } catch {
      setMsgs(prev => prev.filter(m => m.id !== tid));
      setInput(content);
    } finally {
      setSending(false);
      taRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // Props para el input (objeto estable pasado como spread)
  const inputProps = { value: input, sending, taRef, onChange: onInputChange, onKeyDown, onSubmit: handleSend };

  // Área de mensajes (JSX inline — NO un componente — para evitar desmontajes)
  const msgsArea = (
    <>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} className="chat-scroll">
        {msgsLoading ? <MsgShimmer /> : msgs.length === 0
          ? <EmptyConv name={selUser?.username || 'Admin'} />
          : groupByDate(msgs).map(([dk, group]) => (
              <div key={dk}>
                <DateBar label={fmtDate(group[0].created_at)} />
                {group.map(msg => (
                  <Bubble key={msg.id} msg={msg} otherName={selUser?.username} myName={user?.username} />
                ))}
              </div>
            ))
        }
        <div ref={endRef} style={{ height: 4 }} />
      </div>
      <ChatInput {...inputProps} />
    </>
  );

  // ── VISTA ADMIN ───────────────────────────────────────────────────────────
  if (isAdmin) return (
    <div style={S.screen}>
      <header style={S.header}>
        <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Chat Privado</p>
          <p style={{ fontSize: 11, color: '#4b5563' }}>{convs.length} empleados</p>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#374151', letterSpacing: '.08em' }}>EMPLEADOS</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }} className="chat-scroll">
            {convLoading
              ? <div style={{ padding: 14 }} className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton flex-shrink-0" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <div style={{ flex: 1 }} className="space-y-1.5">
                        <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '70%' }} />
                        <div className="skeleton" style={{ height: 9, borderRadius: 6, width: '45%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              : convs.length === 0
                ? <p style={{ padding: '36px 14px', textAlign: 'center', fontSize: 12, color: '#374151' }}>Sin empleados</p>
                : convs.map(conv => {
                    const active = selUser?.userId === conv.userId;
                    return (
                      <button key={conv.userId} onClick={() => selectUser(conv)}
                        style={{
                          ...S.convBtn,
                          borderLeft: `2px solid ${active ? '#06b6d4' : 'transparent'}`,
                          background: active ? 'rgba(6,182,212,0.07)' : 'transparent',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                        <div style={{ position: 'relative' }}>
                          <Av name={conv.username} />
                          {conv.unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.username}</span>
                            {conv.lastMessage && <span style={{ fontSize: 10, color: '#374151', flexShrink: 0 }}>{fmtTime(conv.lastMessage.timestamp)}</span>}
                          </div>
                          <p style={{ fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: conv.unreadCount > 0 ? '#94a3b8' : '#374151', fontWeight: conv.unreadCount > 0 ? 500 : 400 }}>
                            {conv.lastMessage ? (conv.lastMessage.fromMe ? 'Tú: ' : '') + conv.lastMessage.content : 'Sin mensajes'}
                          </p>
                        </div>
                      </button>
                    );
                  })
            }
          </div>
        </div>

        {/* Panel de mensajes */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selUser
            ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#374151' }}>
                <svg width={36} height={36} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: .18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p style={{ fontSize: 13 }}>Selecciona un empleado</p>
              </div>
            : <>
                <div style={S.chatHeader}>
                  <Av name={selUser.username} sm />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{selUser.username}</p>
                    <p style={{ fontSize: 11, color: '#4b5563' }}>{selUser.email || 'Empleado'}</p>
                  </div>
                </div>
                {msgsArea}
              </>
          }
        </div>
      </div>
      <style>{CSS}</style>
    </div>
  );

  // ── VISTA EMPLEADO ────────────────────────────────────────────────────────
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
        ? <div style={{ flex: 1, overflowY: 'auto' }} className="chat-scroll"><MsgShimmer /></div>
        : !selUser
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: '#4b5563' }}>No hay administrador disponible</p>
            </div>
          : msgsArea
      }
      <style>{CSS}</style>
    </div>
  );
}

// ── Estilos compartidos ───────────────────────────────────────────────────────
const S = {
  screen: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#070b12', color: '#f1f5f9', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  sidebar: { width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0b0f1a', borderRight: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  convBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background .12s', color: '#f1f5f9', fontFamily: 'inherit' },
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
