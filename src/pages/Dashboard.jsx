import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import * as api from '../services/api';
import ActivityTracker from '../components/ActivityTracker';

function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [breaks, setBreaks] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [breakTimer, setBreakTimer] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ti = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(ti);
  }, []);

  useEffect(() => {
    let iv;
    if (activeBreak) {
      iv = setInterval(() => {
        setBreakTimer(Math.floor((new Date() - new Date(activeBreak.start_time)) / 1000));
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [activeBreak]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const attRes = await api.get('/attendance/today');
      const att = attRes?.data?.attendance || attRes?.attendance || attRes?.data || null;
      if (att) { setAttendance(att); setIsClockedIn(att.clock_in && !att.clock_out); }
    } catch {}
    try {
      const brksRes = await api.get('/breaks/today');
      const brks = brksRes?.data?.breaks || brksRes?.breaks || brksRes?.data || [];
      const arr = Array.isArray(brks) ? brks : [];
      setBreaks(arr);
      setActiveBreak(arr.find(b => b.start_time && !b.end_time) || null);
    } catch {}
    try {
      const annRes = await api.get('/announcements');
      const anns = annRes?.data?.announcements || annRes?.announcements || annRes?.data || [];
      setAnnouncements(Array.isArray(anns) ? anns : []);
    } catch {}
  };

  const handleClockIn  = async () => { setLoading(true); try { await api.post('/attendance/clock-in', {}); await loadData(); } catch (e) { alert(e.message); } setLoading(false); };
  const handleClockOut = async () => { setLoading(true); try { await api.post('/attendance/clock-out', {}); await loadData(); } catch (e) { alert(e.message); } setLoading(false); };
  const handleStartBreak = async (type) => { if (!isClockedIn || activeBreak) return; setLoading(true); try { await api.post('/breaks/start', { type }); await loadData(); } catch (e) { alert(e.message); } setLoading(false); };
  const handleEndBreak = async () => { if (!activeBreak) return; setLoading(true); try { await api.post('/breaks/end', { breakId: activeBreak.id }); setActiveBreak(null); setBreakTimer(0); await loadData(); } catch (e) { alert(e.message); } setLoading(false); };

  const fmt12 = (d) => d.toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const fmtDate = (d) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtTimer = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const fmtShort = (ds) => new Date(ds).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit', hour12: true });
  const timeAgo = (ds) => {
    const d = Math.floor((new Date()-new Date(ds))/(86400000));
    return d===0 ? t('common.today') : d===1 ? t('common.yesterday') : t('common.daysAgo').replace('{d}', d);
  };

  const breakStatus = (type) => {
    const b = breaks.find(b => b.type === type);
    if (b?.end_time) return 'done';
    if (b && !b.end_time) return 'active';
    return 'pending';
  };

  const navItems = [
    { name: t('nav.home'),        path: '/' },
    { name: t('nav.feed'),        path: '/feed' },
    { name: t('nav.tasks'),       path: '/tasks' },
    { name: t('nav.notes'),       path: '/notes' },
    { name: t('nav.incidents'),   path: '/incidents' },
    { name: t('nav.permissions'), path: '/permissions' },
    { name: t('nav.chat'),        path: '/chat' },
    ...((user?.role === 'admin' || user?.role === 'supervisor') ? [{ name: t('nav.panel'), path: '/admin', admin: true }] : [])
  ];

  const breakItems = [
    { type: 'break_am', label: t('dashboard.breakAm'),  time: '10 min' },
    { type: 'lunch',    label: t('dashboard.lunch'),     time: '60 min' },
    { type: 'break_pm', label: t('dashboard.breakPm'),   time: '10 min' }
  ];

  const quickActions = [
    { label: t('nav.incidents'),   sub: t('dashboard.reportIssue'),       path: '/incidents', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: '#f97316' },
    { label: t('nav.permissions'), sub: t('dashboard.requestPermission'),  path: '/permissions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#818cf8' },
    { label: t('nav.chat'),        sub: t('dashboard.privateMessages'),    path: '/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#06b6d4' },
    { label: t('nav.tasks'),       sub: t('dashboard.kanban'),             path: '/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: '#a855f7' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <ActivityTracker />

      {/* ── Header ── */}
      <header className="page-header">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ color: item.admin ? '#fbbf24' : 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color=item.admin?'#fde68a':'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=item.admin?'#fbbf24':'var(--text-muted)'; }}>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/profile/${user?.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div className={isClockedIn ? 'dot-green' : 'dot-red'} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.username}</span>
              {user?.role === 'admin' && <span className="badge badge-yellow">Admin</span>}
              {user?.role === 'supervisor' && <span className="badge badge-cyan">Grupo {user?.group}</span>}
            </button>
            <button onClick={logout} className="btn btn-danger text-xs px-3 py-1.5">Salir</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-5">

        {/* ── Banners de anuncios ── */}
        {announcements.length > 0 && (
          <div className="space-y-2">
            {announcements.map((ann, i) => {
              const S = {
                urgent:    { bg:'rgba(239,68,68,0.12)',    border:'rgba(239,68,68,0.30)',    color:'#f87171',  icon:'🚨', label:'Urgente' },
                important: { bg:'rgba(245,158,11,0.12)',   border:'rgba(245,158,11,0.30)',   color:'#fbbf24',  icon:'⚠️', label:'Importante' },
                event:     { bg:'rgba(168,85,247,0.12)',   border:'rgba(168,85,247,0.30)',   color:'#c084fc',  icon:'📅', label:'Evento' },
                general:   { bg:'rgba(6,182,212,0.10)',    border:'rgba(6,182,212,0.25)',    color:'#67e8f9',  icon:'📢', label:'General' },
                policy:    { bg:'rgba(100,116,139,0.10)',  border:'rgba(100,116,139,0.25)',  color:'#94a3b8',  icon:'📋', label:'Política' },
              }[ann.category] || { bg:'rgba(6,182,212,0.10)', border:'rgba(6,182,212,0.25)', color:'#67e8f9', icon:'📢', label:'Anuncio' };
              return (
                <div key={ann.id || i} className="rounded-2xl px-5 py-4 flex items-start gap-4 animate-fade-up" style={{ background:S.bg, border:`1px solid ${S.border}` }}>
                  <span className="text-2xl flex-shrink-0 mt-0.5">{S.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-sm" style={{ color:S.color }}>{ann.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: S.border, color:S.color }}>{S.label}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{ann.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Hero: reloj + bienvenida ── */}
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface-2))', border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--cyan)' }}>{t('dashboard.timeLabel')}</p>
              <p className="text-4xl font-bold tracking-tight tabular-nums">{fmt12(currentTime)}</p>
              <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>{fmtDate(currentTime)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{t('dashboard.greeting')}, {user?.username} 👋</p>
              <span className={`badge text-xs mt-1 ${isClockedIn ? 'badge-green' : 'badge-red'}`}>
                <span className={isClockedIn ? 'dot-green w-1.5 h-1.5' : 'dot-red w-1.5 h-1.5'} style={{ width: '6px', height: '6px', minWidth: '6px' }} />
                {isClockedIn ? t('dashboard.online') : t('dashboard.offline')}
              </span>
              {attendance?.clock_in && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.entry')} {fmtShort(attendance.clock_in)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger animate-fade-up">

          {/* Clock In/Out */}
          <div className="card card-glow p-5 animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--cyan)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">{t('dashboard.attendance')}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('dashboard.attendanceDesc')}</p>
              </div>
            </div>
            {!isClockedIn ? (
              <button onClick={handleClockIn} disabled={loading} className="btn btn-primary w-full">
                {loading ? t('dashboard.processing') : t('dashboard.clockIn')}
              </button>
            ) : (
              <button onClick={handleClockOut} disabled={loading} className="btn btn-danger w-full border-0 py-2.5">
                {loading ? t('dashboard.processing') : t('dashboard.clockOut')}
              </button>
            )}
          </div>

          {/* Breaks */}
          <div className="card card-glow p-5 animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <svg className="w-5 h-5" style={{ color: '#f97316' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">{t('dashboard.breaks')}</p>
                {activeBreak
                  ? <p className="text-xs font-mono" style={{ color: '#fb923c' }}>{t('dashboard.activeBreak')} · {fmtTimer(breakTimer)}</p>
                  : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('dashboard.breakDesc')}</p>}
              </div>
            </div>
            {activeBreak ? (
              <button onClick={handleEndBreak} disabled={loading} className="btn w-full py-2.5 text-sm font-semibold" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
                {t('dashboard.endBreak')} · {fmtTimer(breakTimer)}
              </button>
            ) : (
              <div className="space-y-2">
                {breakItems.map(({ type, label, time }) => {
                  const st = breakStatus(type);
                  return (
                    <button key={type} onClick={() => handleStartBreak(type)}
                      disabled={!isClockedIn || st !== 'pending' || loading}
                      className={`w-full px-3 py-2 rounded-xl text-xs flex justify-between items-center transition-all ${
                        st === 'done' ? 'opacity-50 cursor-not-allowed' : st === 'active' ? '' : 'hover:bg-white/5'
                      }`}
                      style={{
                        background: st === 'done' ? 'rgba(34,197,94,0.06)' : st === 'active' ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)',
                        border: st === 'done' ? '1px solid rgba(34,197,94,0.15)' : st === 'active' ? '1px solid rgba(249,115,22,0.15)' : '1px solid var(--border)',
                        color: st === 'done' ? '#86efac' : st === 'active' ? '#fb923c' : 'var(--text-muted)'
                      }}>
                      <span>{label} <span style={{ opacity: .5 }}>({time})</span></span>
                      <span>{st === 'done' ? '✓' : st === 'active' ? '⏱' : ''}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conexión */}
          <div className="card card-glow p-5 animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">{t('dashboard.connection')}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('dashboard.netStatus')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="dot-green" />
              <span className="text-sm" style={{ color: '#86efac' }}>{t('dashboard.connected')}</span>
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('dashboard.sessionAs')}</p>
              <p className="text-sm font-medium mt-0.5">{user?.username} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {user?.role}</span></p>
            </div>
          </div>
        </div>

        {/* ── Acciones rápidas ── */}
        <div>
          <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('dashboard.quickAccess')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map(({ label, sub, path, icon, color }) => (
              <button key={path} onClick={() => navigate(path)}
                className="card card-glow p-4 text-left group transition-all"
                style={{ cursor: 'pointer' }}>
                <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                  <svg className="w-4 h-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Anuncios (historial compacto) ── */}
        {announcements.length === 0 && (
          <div>
            <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('dashboard.announcements')}</p>
            <div className="card p-4 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <svg className="w-4 h-4" style={{ color: '#67e8f9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">¡Bienvenidos!</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Bienvenidos a LoVirtual. Gracias por ser parte de esta gran familia.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
