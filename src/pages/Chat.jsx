import { useState, useEffect, useRef, useCallback, memo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getConversations, getMessages, sendMessage, deleteConversation, getActivityStatus } from '../services/chat';
import { get } from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtTime = ds =>
  new Date(ds).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

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
  const isImg = msg.content_type === 'image';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6, justifyContent: mine ? 'flex-end' : 'flex-start', animation: msg._isNew ? 'bubbleIn .2s ease both' : 'none' }}>
      {!mine && <Av name={otherName} sm />}
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 3 }}>
        {isImg
          ? <img src={msg.content} alt="img" style={{ maxWidth: 220, borderRadius: 14, opacity: msg._sending ? 0.6 : 1, cursor: 'pointer' }}
              onClick={() => window.open(msg.content, '_blank')} />
          : <div style={{
              padding: '9px 14px', fontSize: 14, lineHeight: 1.55,
              wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              ...(mine
                ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#fff', borderRadius: '18px 18px 4px 18px', opacity: msg._sending ? 0.6 : 1 }
                : { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px' })
            }}>
              {msg.content}
            </div>
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingInline: 4, flexDirection: mine ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{fmtTime(msg.created_at)}</span>
          {mine && (
            <span style={{ fontSize: 10, color: msg._sending ? 'var(--text-dim)' : msg.read_at ? 'var(--cyan)' : 'var(--text-muted)' }}>
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
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    <span style={{ fontSize: 11, color: 'var(--text-dim)', padding: '3px 12px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
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

// ── ChatInput con soporte de imágenes ─────────────────────────────────────────
const ChatInput = memo(({ onSend, sending }) => {
  const { t } = useLang();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [imgData, setImgData] = useState(null);
  const taRef  = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!sending) taRef.current?.focus();
  }, [sending]);

  const handleChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { alert(t('chat.imageTooLarge')); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setImgData(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearImage = () => { setPreview(null); setImgData(null); };

  const submit = () => {
    if (sending) return;
    if (imgData) {
      onSend('', 'image', imgData);
      clearImage();
    } else {
      const val = text.trim();
      if (!val) return;
      setText('');
      if (taRef.current) taRef.current.style.height = 'auto';
      onSend(val, 'text', null);
    }
  };

  const canSend = (text.trim().length > 0 || imgData) && !sending;

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
      {preview && (
        <div style={{ padding: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={preview} alt="preview" style={{ height: 60, borderRadius: 8, objectFit: 'cover' }} />
          <button onClick={clearImage} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.8)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
      <form onSubmit={e => { e.preventDefault(); submit(); }}
        style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px' }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => fileRef.current?.click()}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <textarea
          ref={taRef}
          value={text}
          onChange={handleChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={imgData ? t('chat.imageReady') : t('chat.messagePlaceholder')}
          disabled={sending || !!imgData}
          rows={1}
          style={{
            flex: 1, borderRadius: 22, padding: '10px 16px', fontSize: 14,
            resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
            background: 'var(--surface)', border: '1px solid rgba(14,165,233,0.3)',
            color: 'var(--text)', minHeight: 42, maxHeight: 120,
          }}
        />
        <button type="submit" disabled={!canSend}
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none', color: '#fff', flexShrink: 0,
            background: canSend ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'var(--surface-2)',
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
    </div>
  );
});

// ── Modal genérico ─────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 }}>
      {children}
    </div>
  </div>
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const isAdmin  = user?.role === 'admin' || user?.role === 'supervisor';

  const [convs,        setConvs]        = useState([]);
  const [selUser,      setSelUser]      = useState(null);
  const [msgs,         setMsgs]         = useState([]);
  const [convLoading,  setConvLoading]  = useState(true);
  const [msgsLoading,  setMsgsLoading]  = useState(false);
  const [sending,      setSending]      = useState(false);

  const [activityMap,  setActivityMap]  = useState({});

  const [allEmployees, setAllEmployees] = useState([]);
  const [search,       setSearch]       = useState('');
  const [confirmDel,   setConfirmDel]   = useState(null);

  const endRef    = useRef(null);
  const scrollRef = useRef(null);
  const lastIdRef = useRef(0);
  const selUidRef = useRef(null);

  // fmtDate inside component to access t()
  const fmtDate = (ds) => {
    const d = new Date(ds), now = new Date(), yest = new Date();
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString())  return t('common.today');
    if (d.toDateString() === yest.toDateString()) return t('common.yesterday');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  useEffect(() => { selUidRef.current = selUser?.userId ?? null; }, [selUser?.userId]);

  useEffect(() => {
    fetchConvs();
    fetchActivity();
    if (isAdmin) fetchEmployees();
    const iv1 = setInterval(fetchConvs, 8000);
    const iv2 = setInterval(fetchActivity, 30000);
    return () => { clearInterval(iv1); clearInterval(iv2); };
  }, []);

  useEffect(() => {
    if (!selUser?.userId) return;
    lastIdRef.current = 0;
    setMsgsLoading(true);
    loadAll(selUser.userId);
    const iv = setInterval(() => poll(selUidRef.current), 3000);
    return () => clearInterval(iv);
  }, [selUser?.userId]);

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

  const fetchEmployees = async () => {
    try {
      const res = await get('/users');
      const users = res?.data?.users || [];
      setAllEmployees(users.filter(u => u.role !== 'admin' && u.role !== 'supervisor'));
    } catch {}
  };

  const fetchActivity = async () => {
    try {
      const res = await getActivityStatus();
      const users = res?.data?.users || res?.data || [];
      const map = {};
      users.forEach(u => {
        const mins = u.lastActivity ? (Date.now() - new Date(u.lastActivity)) / 60000 : 999;
        map[u.userId || u.id] = mins < 5 ? 'active' : mins < 20 ? 'idle' : 'offline';
      });
      startTransition(() => setActivityMap(map));
    } catch { }
  };

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

  const handleSend = useCallback(async (content, contentType = 'text', imageData = null) => {
    if (!selUidRef.current) return;
    if (contentType === 'text' && !content) return;
    setSending(true);
    const tid  = `t${Date.now()}`;
    const displayContent = contentType === 'image' ? imageData : content;
    const temp = { id: tid, content: displayContent, content_type: contentType, fromMe: true, created_at: new Date().toISOString(), _sending: true, _isNew: true };
    setMsgs(prev => [...prev, temp]);
    scrollToEnd(true);
    try {
      const res  = await sendMessage(selUidRef.current, content, contentType, imageData);
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

  const selectUser = (conv) => {
    if (conv.userId === selUser?.userId) return;
    setMsgs([]);
    setMsgsLoading(true);
    setSelUser(conv);
  };

  const renderMessages = () => {
    if (msgsLoading) return <Shimmer />;
    if (!msgs.length) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={20} height={20} fill="none" stroke="currentColor" style={{ color: 'var(--text-dim)' }} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {isAdmin ? `${t('chat.startWith')} ${selUser?.username}` : t('chat.firstMessage')}
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
        <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{t('chat.title')}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{convs.length} {t('chat.employees')}</p>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={S.sidebar}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', marginBottom: 8 }}>CHATS</p>
            <div style={{ position: 'relative' }}>
              <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('chat.searchPlaceholder')}
                style={{
                  width: '100%', paddingLeft: 28, paddingRight: search ? 28 : 10,
                  paddingTop: 7, paddingBottom: 7,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="chat-scroll">
            {convLoading
              ? [1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '70%' }} />
                      <div className="skeleton" style={{ height: 9, borderRadius: 6, width: '45%' }} />
                    </div>
                  </div>
                ))
              : (() => {
                  const sl = search.trim().toLowerCase();
                  const list = sl
                    ? allEmployees.filter(emp =>
                        (emp.username || '').toLowerCase().includes(sl) ||
                        (emp.first_name || '').toLowerCase().includes(sl) ||
                        (emp.last_name || '').toLowerCase().includes(sl)
                      ).map(emp => {
                        const existing = convs.find(c => c.userId === emp.id);
                        return existing || { userId: emp.id, username: emp.username, email: emp.email, lastMessage: null, unreadCount: 0 };
                      })
                    : convs.filter(c => c.lastMessage !== null);

                  if (list.length === 0) return (
                    <p style={{ padding: '36px 14px', textAlign: 'center', fontSize: 12, color: 'var(--text-dim)' }}>
                      {sl ? t('chat.noResults') : t('chat.noConversations')}
                    </p>
                  );

                  return list.map(conv => {
                    const active = selUser?.userId === conv.userId;
                    return (
                      <div key={conv.userId} style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          borderLeft: `2px solid ${active ? '#06b6d4' : 'transparent'}`,
                          background: active ? 'rgba(6,182,212,0.07)' : 'transparent',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <button onClick={() => { setSearch(''); selectUser(conv); }} style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                            padding: '11px 8px 11px 14px', textAlign: 'left', border: 'none',
                            background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit', minWidth: 0,
                          }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <Av name={conv.username} />
                              {(() => {
                                const st = activityMap[conv.userId];
                                const c = st === 'active' ? '#22c55e' : st === 'idle' ? '#f59e0b' : null;
                                return c ? <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: c, border: '2px solid var(--surface)' }} /> : null;
                              })()}
                              {conv.unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{conv.username}</span>
                              <p style={{ fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: conv.unreadCount > 0 ? 'var(--text-muted)' : 'var(--text-dim)', fontWeight: conv.unreadCount > 0 ? 500 : 400 }}>
                                {conv.lastMessage
                                  ? (conv.lastMessage.content_type === 'image' ? `📷 ${t('chat.image')}` : (conv.lastMessage.fromMe ? t('chat.you') : '') + conv.lastMessage.content)
                                  : <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>{t('chat.startConversation')}</span>}
                              </p>
                            </div>
                          </button>
                          <button onClick={() => navigate(`/profile/${conv.userId}`)} title="Ver perfil"
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', marginRight: 4 }}>
                            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </button>
                          {conv.lastMessage && (
                            <button onClick={() => { selectUser(conv); setConfirmDel(conv.userId); }}
                              title={t('chat.deleteConv')}
                              style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', marginRight: 8 }}>
                              <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
            }
          </div>
        </div>

        {/* ── Panel de chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          {!selUser
            ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-dim)' }}>
                <svg width={40} height={40} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: .15 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p style={{ fontSize: 13 }}>{t('chat.searchToStart')}</p>
              </div>
            : <>
                <div style={S.chatHeader}>
                  <Av name={selUser.username} sm />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{selUser.username}</p>
                    <p style={{ fontSize: 11, color: activityMap[selUser.userId] === 'active' ? '#22c55e' : activityMap[selUser.userId] === 'idle' ? '#f59e0b' : 'var(--text-muted)' }}>
                      {activityMap[selUser.userId] === 'active' ? t('chat.online') : activityMap[selUser.userId] === 'idle' ? t('chat.idle') : (selUser.email || 'Empleado')}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button onClick={() => navigate(`/profile/${selUser.userId}`)} title="Ver perfil"
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    <button onClick={() => setConfirmDel(selUser.userId)} title={t('chat.deleteConv')}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: 'var(--bg)' }} className="chat-scroll">
                  {renderMessages()}
                  <div ref={endRef} style={{ height: 4 }} />
                </div>
                <ChatInput onSend={handleSend} sending={sending} />
              </>
          }
        </div>
      </div>

      {/* Modal: confirmar eliminación */}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--text)' }}>{t('chat.deleteConv')}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {t('chat.deleteWarning')} <b style={{ color: 'var(--text)' }}>{convs.find(c => c.userId === confirmDel)?.username || selUser?.username}</b>. {t('chat.deleteUndo')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmDel(null)} className="btn btn-ghost" style={{ flex: 1 }}>{t('common.cancel')}</button>
            <button onClick={() => handleDelete(confirmDel)} className="btn btn-danger" style={{ flex: 1 }}>{t('common.delete')}</button>
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
        <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Av name={selUser?.username || 'A'} sm />
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>{selUser?.username || 'Administrador'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('chat.privateConv')}</p>
          </div>
        </div>
      </header>

      {convLoading
        ? <div style={{ flex: 1, overflowY: 'auto' }} className="chat-scroll"><Shimmer /></div>
        : !selUser
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('chat.noAdmin')}</p>
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
  screen:     { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' },
  header:     { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  sidebar:    { width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRight: '1px solid var(--border)', overflow: 'hidden' },
  convBtn:    { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background .12s', color: 'var(--text)', fontFamily: 'inherit' },
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
