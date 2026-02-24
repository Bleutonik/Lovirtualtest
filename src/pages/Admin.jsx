import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import * as api from '../services/api';
import { createAnnouncement, deleteAnnouncement } from '../services/announcements';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ─── Helpers ──────────────────────────────────────────── */
const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
const fmtTime = (ds) => ds ? new Date(ds).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' }) : '-';

/* ─── Small components ──────────────────────────────────── */
const Bdg = ({ pair }) => <span className={`badge ${pair[0]}`}>{pair[1]}</span>;
const Th  = ({ children }) => <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{children}</th>;
const Td  = ({ children, muted }) => <td className="py-3 px-4 text-sm" style={{ color: muted ? 'var(--text-muted)' : 'var(--text)', borderBottom: '1px solid var(--border)' }}>{children}</td>;

/* ─── Main ──────────────────────────────────────────────── */
const Admin = () => {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { t } = useLang();
  const isMainAdmin = me?.role === 'admin';

  const [activeTab, setActiveTab]   = useState('activity');
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const [users,          setUsers]          = useState([]);
  const [userForm,       setUserForm]       = useState({ username:'', email:'', password:'', first_name:'', last_name:'', client:'', group:'', role:'employee' });
  const [isCreating,     setIsCreating]     = useState(false);
  const [editingUser,    setEditingUser]    = useState(null);
  const [editForm,       setEditForm]       = useState({ email:'', role:'', first_name:'', last_name:'', client:'', group:'' });

  const [permissions,    setPermissions]    = useState([]);
  const [incidents,      setIncidents]      = useState([]);
  const [attendance,     setAttendance]     = useState([]);
  const [breaks,         setBreaks]         = useState([]);
  const [activityStatus, setActivityStatus] = useState([]);
  const [summary,        setSummary]        = useState({ active:0, idle:0, afk:0, offline:0 });
  const [announcements,  setAnnouncements]  = useState([]);
  const [annForm,        setAnnForm]        = useState({ title: '', content: '', category: 'general', expires_at: '' });
  const [isPublishing,   setIsPublishing]   = useState(false);

  // Translated lookup tables (inside component so they respond to language changes)
  const PERM_TYPE  = { personal:'Personal', medical:'Médico', vacation: t('permissions.types.vacation'), other: t('permissions.types.other'), dia_libre: t('permissions.types.day_off'), llegada_tarde: t('permissions.types.late'), salida_temprana: t('permissions.types.early') };
  const INC_TYPE   = { technical: t('incidents.types.technical'), connectivity:'Conectividad', schedule:'Horario', general:'General', other: t('incidents.types.other') };
  const INC_PRI    = { low:['badge-gray', t('incidents.priorities.low')], medium:['badge-yellow', t('incidents.priorities.medium')], high:['badge-orange', t('incidents.priorities.high')], critical:['badge-red', t('incidents.priorities.critical')] };
  const INC_STATUS = { open:['badge-yellow', t('incidents.statuses.open')], pending:['badge-yellow', t('incidents.statuses.pending')], in_review:['badge-blue', t('admin.inReview')], resolved:['badge-green', t('admin.resolved')], closed:['badge-gray', t('incidents.statuses.closed')] };
  const PERM_STATUS= { pending:['badge-yellow', t('permissions.statuses.pending')], approved:['badge-green', t('permissions.statuses.approved')], rejected:['badge-red', t('permissions.statuses.rejected')] };
  const ACT_CFG    = { active:{ dot:'dot-green', badge:'badge-green', bg:'rgba(34,197,94,0.06)',   border:'rgba(34,197,94,0.15)',   label: t('admin.activeStatus') },
                       idle:  { dot:'dot-yellow',badge:'badge-yellow',bg:'rgba(234,179,8,0.06)',   border:'rgba(234,179,8,0.15)',   label: t('admin.inactive') },
                       afk:   { dot:'dot-red',   badge:'badge-red',   bg:'rgba(239,68,68,0.06)',   border:'rgba(239,68,68,0.15)',   label: t('admin.afk') },
                       offline:{ dot:'dot-gray', badge:'badge-gray',  bg:'rgba(100,116,139,0.04)', border:'rgba(100,116,139,0.1)',  label: t('admin.disconnected') } };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.role !== 'admin' && u.role !== 'supervisor') { navigate('/'); return; }
    loadAll();
    const iv = setInterval(loadActivity, 30000);
    return () => clearInterval(iv);
  }, [navigate]);

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.allSettled([ loadUsers(), loadPermissions(), loadIncidents(), loadAttendance(), loadBreaks(), loadActivity(), loadAnnouncements() ]);
    setIsLoading(false);
  };

  const loadActivity    = async () => { try { const d = await api.get('/activity/status'); setActivityStatus(d?.data?.statuses||[]); setSummary(d?.data?.summary||{active:0,idle:0,afk:0,offline:0}); } catch {} };
  const loadAttendance  = async () => { try { const d = await api.get('/attendance/all');  setAttendance(d?.data?.attendance||d?.attendance||[]); } catch {} };
  const loadBreaks      = async () => { try { const d = await api.get('/breaks/all');       setBreaks(d?.data?.breaks||d?.breaks||[]); } catch {} };
  const loadUsers       = async () => { try { const d = await api.get('/users');            setUsers(d?.data?.users||d?.users||d?.data||[]); } catch {} };
  const loadPermissions = async () => { try { const d = await api.get('/permissions/all'); setPermissions(d?.data?.permissions||d?.permissions||d?.data||[]); } catch {} };
  const loadIncidents      = async () => { try { const d = await api.get('/incidents');        setIncidents(d?.data||d?.incidents||[]); } catch {} };
  const loadAnnouncements  = async () => { try { const d = await api.get('/announcements');  const anns = d?.data?.announcements||d?.announcements||d?.data||[]; setAnnouncements(Array.isArray(anns)?anns:[]); } catch {} };

  const flash = (msg, type='success') => {
    if (type==='success') { setSuccess(msg); setTimeout(()=>setSuccess(''),3000); }
    else { setError(msg); setTimeout(()=>setError(''),4000); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try { await api.post('/users', { username:userForm.username, email:userForm.email||null, password:userForm.password, role:isMainAdmin?userForm.role:'employee', first_name:userForm.first_name||null, last_name:userForm.last_name||null, client:userForm.client||null, group:userForm.group||null }); setUserForm({username:'',email:'',password:'',first_name:'',last_name:'',client:'',group:me?.group||'',role:'employee'}); flash('Usuario creado'); await loadUsers(); }
    catch (err) { flash(err.message||'Error al crear usuario','error'); }
    finally { setIsCreating(false); }
  };

  const handleSaveEdit = async () => {
    try { await api.put(`/users/${editingUser.id}`, { ...editForm, group: isMainAdmin ? editForm.group : undefined }); setEditingUser(null); flash('Usuario actualizado'); await loadUsers(); }
    catch (err) { flash(err.message||'Error','error'); }
  };

  const handleDeleteUser = async (u) => {
    if (u.role==='admin') { flash('No puedes eliminar un admin','error'); return; }
    if (!confirm(`¿Eliminar a ${u.username}?`)) return;
    try { await api.del(`/users/${u.id}`); flash('Usuario eliminado'); await loadUsers(); }
    catch (err) { flash(err.message||'Error','error'); }
  };

  const approvePerm = async (id) => { try { await api.put(`/permissions/${id}/approve`); flash('Permiso aprobado'); await loadPermissions(); } catch (err) { flash(err.message,'error'); } };
  const rejectPerm  = async (id) => { try { await api.put(`/permissions/${id}/reject`);  flash('Permiso rechazado'); await loadPermissions(); } catch (err) { flash(err.message,'error'); } };
  const updateInc   = async (id, status) => { try { await api.put(`/incidents/${id}/status`, { status }); flash(`Marcado: ${status}`); await loadIncidents(); } catch (err) { flash(err.message,'error'); } };

  const handlePublish = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      await createAnnouncement({ title: annForm.title, content: annForm.content, category: annForm.category, expires_at: annForm.expires_at || null });
      setAnnForm({ title: '', content: '', category: 'general', expires_at: '' });
      flash(t('announcements.successMsg'));
      await loadAnnouncements();
    } catch { flash(t('announcements.errorMsg'), 'error'); }
    finally { setIsPublishing(false); }
  };

  const handleDeleteAnn = async (id) => {
    if (!confirm(t('announcements.deleteConfirm'))) return;
    try { await deleteAnnouncement(id); flash(t('common.delete') + ' OK'); await loadAnnouncements(); }
    catch (err) { flash(err.message || 'Error', 'error'); }
  };

  const pendingPerms = permissions.filter(p => p.status==='pending');
  const openIncs     = incidents.filter(i => i.status==='open'||i.status==='pending').length;

  const TABS = [
    { id:'activity',    label: t('admin.tabs.activity'),    badge: summary.afk>0?summary.afk:null, danger:summary.afk>0,
      icon:'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id:'reports',     label: t('admin.tabs.reports'),     badge:null,
      icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id:'users',       label: t('admin.tabs.users'),       badge:null,
      icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id:'permissions', label: t('admin.tabs.permissions'), badge:pendingPerms.length||null,
      icon:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id:'incidents',   label: t('admin.tabs.incidents'),   badge:openIncs||null,
      icon:'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ...(isMainAdmin ? [{ id:'announcements', label: t('admin.tabs.announcements'), badge: announcements.length || null,
      icon:'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' }] : []),
  ];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full mx-auto animate-spin" style={{ borderColor:'rgba(6,182,212,0.3)', borderTopColor:'#06b6d4' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ── */}
      <header className="page-header">
        <div className="px-5 py-3.5 flex items-center gap-4 max-w-6xl mx-auto">
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
          <div>
            <h1 className="font-bold">{isMainAdmin ? t('admin.title') : `Panel — Grupo ${me?.group || ''}`}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isMainAdmin ? t('admin.subtitle') : t('admin.groupSubtitle')}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isMainAdmin
              ? <span className="badge badge-yellow">Admin</span>
              : <span className="badge badge-cyan">Líder Grupo {me?.group}</span>
            }
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5">

        {/* Alertas */}
        {(error || success) && (
          <div className="pt-4">
            {error   && <div className="alert-error   mb-2 flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{error}</div>}
            {success && <div className="alert-success mb-2 flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>{success}</div>}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 py-4 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeTab===tab.id ? 'linear-gradient(135deg,rgba(14,165,233,.18),rgba(6,182,212,.12))' : tab.danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                border: activeTab===tab.id ? '1px solid rgba(6,182,212,0.3)' : tab.danger ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border)',
                color: activeTab===tab.id ? 'var(--cyan)' : tab.danger ? '#f87171' : 'var(--text-muted)'
              }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
              {tab.badge && (
                <span className="text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
                  style={{ background: tab.danger ? '#ef4444' : '#f97316', fontSize:'10px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ TAB: ACTIVIDAD ══ */}
        {activeTab === 'activity' && (
          <div className="py-5 space-y-5 animate-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('admin.active'),      val: summary.active,  color:'#22c55e', bg:'rgba(34,197,94,0.08)',   border:'rgba(34,197,94,0.2)' },
                { label: t('admin.inactive'),     val: summary.idle,    color:'#eab308', bg:'rgba(234,179,8,0.08)',   border:'rgba(234,179,8,0.2)' },
                { label: t('admin.afk'),          val: summary.afk,     color:'#ef4444', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.2)' },
                { label: t('admin.disconnected'), val: summary.offline, color:'#64748b', bg:'rgba(100,116,139,0.06)', border:'rgba(100,116,139,0.15)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background:s.bg, border:`1px solid ${s.border}` }}>
                  <p className="text-3xl font-bold" style={{ color:s.color }}>{s.val}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">{t('admin.realtime')}</p>
                <button onClick={loadActivity} className="btn btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('common.refresh')}
                </button>
              </div>

              {activityStatus.length === 0 ? (
                <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-sm">{t('admin.noEmployees')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activityStatus.map(emp => {
                    const cfg = ACT_CFG[emp.status] || ACT_CFG.offline;
                    return (
                      <div key={emp.userId} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                        <div className="flex items-center gap-3">
                          <div className={cfg.dot} />
                          <div>
                            <p className="font-medium text-sm">{emp.username}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {emp.status === 'offline' && emp.lastSeen ? `${t('admin.lastSeen')} ${fmtTime(emp.lastSeen)}` : emp.lastActivity ? `${t('admin.lastActivity')} ${fmtTime(emp.lastActivity)}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${cfg.badge}`}>{emp.statusLabel || cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-dim)' }}>{t('admin.autoUpdate')}</p>
            </div>
          </div>
        )}

        {/* ══ TAB: REPORTES ══ */}
        {activeTab === 'reports' && (
          <div className="py-5 space-y-5 animate-fade-up">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.2)' }}>
                  <svg className="w-4 h-4" style={{ color:'#06b6d4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold">{t('admin.todayAttendance')}</p>
                <span className="badge badge-cyan ml-auto">{attendance.length} {t('admin.employee').toLowerCase()}</span>
              </div>
              {attendance.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>{t('admin.noAttendance')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><Th>{t('admin.employee')}</Th><Th>{t('admin.entry')}</Th><Th>{t('admin.exit')}</Th><Th>{t('admin.hours')}</Th><Th>{t('admin.status')}</Th></tr></thead>
                    <tbody>
                      {attendance.map(a => (
                        <tr key={a.id} className="transition-colors hover:bg-white/[0.02]">
                          <Td><span className="font-medium">{a.username}</span></Td>
                          <Td><span style={{ color:'#67e8f9' }}>{fmtTime(a.clock_in)}</span></Td>
                          <Td><span style={{ color: a.clock_out ? '#fb923c' : '#86efac' }}>{a.clock_out ? fmtTime(a.clock_out) : t('admin.activeStatus')}</span></Td>
                          <Td muted>{a.total_hours ? `${a.total_hours.toFixed(1)}h` : '-'}</Td>
                          <Td><span className={`badge ${a.clock_out ? 'badge-gray' : 'badge-green'}`}>{a.clock_out ? t('admin.finished') : t('admin.online')}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)' }}>
                  <svg className="w-4 h-4" style={{ color:'#f97316' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold">{t('admin.todayBreaks')}</p>
                <span className="badge badge-orange ml-auto">{breaks.length} breaks</span>
              </div>
              {breaks.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>{t('admin.noBreaks')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><Th>{t('admin.employee')}</Th><Th>{t('admin.type')}</Th><Th>{t('admin.start')}</Th><Th>{t('admin.end')}</Th><Th>{t('admin.duration')}</Th><Th>{t('admin.status')}</Th></tr></thead>
                    <tbody>
                      {breaks.map(b => (
                        <tr key={b.id} className="transition-colors hover:bg-white/[0.02]">
                          <Td><span className="font-medium">{b.username}</span></Td>
                          <Td><span style={{ color:'#67e8f9' }}>{b.break_type_name || b.type}</span></Td>
                          <Td muted>{fmtTime(b.start_time)}</Td>
                          <Td muted>{fmtTime(b.end_time)}</Td>
                          <Td muted>{b.duration_minutes ? `${b.duration_minutes} min` : '-'}</Td>
                          <Td><span className={`badge ${b.end_time ? 'badge-green' : 'badge-orange'}`}>{b.end_time ? t('admin.completed') : t('admin.onBreak')}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB: USUARIOS ══ */}
        {activeTab === 'users' && (
          <div className="py-5 space-y-5 animate-fade-up">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.2)' }}>
                  <svg className="w-4 h-4" style={{ color:'#06b6d4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <p className="font-semibold">{t('admin.createEmployee')}</p>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.firstName')}</label>
                    <input type="text" value={userForm.first_name} onChange={e=>setUserForm({...userForm,first_name:e.target.value})} className="field" placeholder="Juan" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.lastName')}</label>
                    <input type="text" value={userForm.last_name} onChange={e=>setUserForm({...userForm,last_name:e.target.value})} className="field" placeholder="Pérez" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.client')}</label>
                    <input type="text" value={userForm.client} onChange={e=>setUserForm({...userForm,client:e.target.value})} className="field" placeholder="Empresa XYZ" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.username')}</label>
                    <input type="text" value={userForm.username} onChange={e=>setUserForm({...userForm,username:e.target.value})} className="field" placeholder="empleado123" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.email')} <span style={{ color: 'var(--text-dim)' }}>{t('common.optional')}</span></label>
                    <input type="email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} className="field" placeholder="correo@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.password')}</label>
                    <input type="password" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} className="field" placeholder="••••••••" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.group')}</label>
                    {isMainAdmin
                      ? <select value={userForm.group} onChange={e=>setUserForm({...userForm,group:e.target.value})} className="field">
                          <option value="">{t('admin.noGroup')}</option>
                          {GROUPS.map(g=><option key={g} value={g}>Grupo {g}</option>)}
                        </select>
                      : <input className="field" value={`Grupo ${me?.group || ''}`} disabled style={{ opacity:0.5 }} />
                    }
                  </div>
                  {isMainAdmin && (
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.role')}</label>
                      <select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})} className="field">
                        <option value="employee">{t('admin.employeeRole')}</option>
                        <option value="supervisor">{t('admin.leaderRole')}</option>
                      </select>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isCreating} className="btn btn-primary">
                  {isCreating ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{t('admin.creatingEmployee')}</> : t('admin.createEmployeeBtn')}
                </button>
              </form>
            </div>

            <div className="card p-5">
              <p className="font-semibold mb-4">{t('admin.registeredEmployees')} <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({users.length})</span></p>
              {users.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>{t('admin.noUsers')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><Th>{t('admin.username')}</Th><Th>{t('admin.group')}</Th><Th>{t('admin.clientCol')}</Th><Th>{t('admin.email')}</Th><Th>{t('admin.role')}</Th><Th>{t('common.actions')}</Th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background:`${u.role==='admin'?'rgba(168,85,247,0.15)':'rgba(6,182,212,0.1)'}`, border:`1px solid ${u.role==='admin'?'rgba(168,85,247,0.25)':'rgba(6,182,212,0.2)'}`, color:u.role==='admin'?'#c084fc':'#67e8f9' }}>
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium">{u.username}</span>
                                {(u.first_name || u.last_name) && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[u.first_name,u.last_name].filter(Boolean).join(' ')}</p>}
                              </div>
                            </div>
                          </Td>
                          <Td><span style={{ padding:'2px 8px', borderRadius:6, background:`rgba(6,182,212,0.1)`, color:'#67e8f9', fontSize:11, fontWeight:700 }}>{u.group ? `Grupo ${u.group}` : '—'}</span></Td>
                          <Td muted>{u.client || '—'}</Td>
                          <Td muted>{u.email || '—'}</Td>
                          <Td><span className={`badge ${u.role==='admin'?'badge-blue':u.role==='supervisor'?'badge-yellow':'badge-cyan'}`}>{u.role==='admin'?'Admin':u.role==='supervisor'? t('admin.leaderRole') : t('admin.employeeRole')}</span></Td>
                          <Td>
                            <div className="flex items-center gap-1.5">
                              <button onClick={()=>navigate(`/profile/${u.id}`)} className="btn btn-ghost px-2.5 py-1.5 text-xs">
                                {t('common.profile')}
                              </button>
                              <button onClick={()=>{ setEditingUser(u); setEditForm({email:u.email||'',role:u.role,first_name:u.first_name||'',last_name:u.last_name||'',client:u.client||'',group:u.group||''}); }} className="btn btn-ghost px-2.5 py-1.5 text-xs">
                                {t('common.edit')}
                              </button>
                              {u.role !== 'admin' && (
                                <button onClick={()=>handleDeleteUser(u)} className="btn btn-danger px-2.5 py-1.5 text-xs">
                                  {t('common.delete')}
                                </button>
                              )}
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {editingUser && (
              <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setEditingUser(null)}>
                <div className="modal p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold">{t('common.edit')} Usuario</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{editingUser.username}</p>
                    </div>
                    <button onClick={()=>setEditingUser(null)} className="btn btn-ghost p-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.firstName')}</label>
                        <input type="text" value={editForm.first_name} onChange={e=>setEditForm({...editForm,first_name:e.target.value})} className="field" placeholder="Juan" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.lastName')}</label>
                        <input type="text" value={editForm.last_name} onChange={e=>setEditForm({...editForm,last_name:e.target.value})} className="field" placeholder="Pérez" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.client')}</label>
                      <input type="text" value={editForm.client} onChange={e=>setEditForm({...editForm,client:e.target.value})} className="field" placeholder="Empresa XYZ" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.email')}</label>
                      <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} className="field" placeholder="correo@empresa.com" />
                    </div>
                    {isMainAdmin && (
                      <>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.group')}</label>
                          <select value={editForm.group} onChange={e=>setEditForm({...editForm,group:e.target.value})} className="field">
                            <option value="">{t('admin.noGroup')}</option>
                            {GROUPS.map(g=><option key={g} value={g}>Grupo {g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('admin.role')}</label>
                          <select value={editForm.role} onChange={e=>setEditForm({...editForm,role:e.target.value})} className="field">
                            <option value="employee">{t('admin.employeeRole')}</option>
                            <option value="supervisor">{t('admin.leaderRole')}</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={()=>setEditingUser(null)} className="btn btn-ghost flex-1">{t('common.cancel')}</button>
                    <button onClick={handleSaveEdit} className="btn btn-primary flex-1">{t('common.save')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: PERMISOS ══ */}
        {activeTab === 'permissions' && (
          <div className="py-5 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
              <p className="font-semibold">{t('admin.pendingRequests')}</p>
              {pendingPerms.length > 0 && <span className="badge badge-yellow">{pendingPerms.length}</span>}
            </div>

            {pendingPerms.length === 0 ? (
              <div className="card p-10 text-center">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('admin.noPending')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPerms.map(p => (
                  <div key={p.id} className="card p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{p.username || p.user?.username || 'Usuario'}</span>
                          <span className="badge badge-cyan">{PERM_TYPE[p.type]||p.type}</span>
                          <Bdg pair={PERM_STATUS[p.status]||PERM_STATUS.pending} />
                        </div>
                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{p.reason}</p>
                        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          {fmtDate(p.date_from||p.date)}
                          {p.date_to && p.date_to !== p.date_from && ` → ${fmtDate(p.date_to)}`}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={()=>approvePerm(p.id)} className="btn text-sm px-4 py-2" style={{ background:'rgba(34,197,94,0.12)', color:'#86efac', border:'1px solid rgba(34,197,94,0.2)' }}>
                          ✓ {t('admin.approve')}
                        </button>
                        <button onClick={()=>rejectPerm(p.id)} className="btn btn-danger text-sm px-4 py-2">
                          ✕ {t('admin.reject')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {permissions.filter(p=>p.status!=='pending').length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--text-dim)' }}>{t('admin.history')}</p>
                <div className="space-y-2">
                  {permissions.filter(p=>p.status!=='pending').map(p => {
                    const st = PERM_STATUS[p.status]||PERM_STATUS.pending;
                    return (
                      <div key={p.id} className="card px-4 py-3 flex items-center justify-between" style={{ opacity:.75 }}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{p.username||'Usuario'}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {PERM_TYPE[p.type]||p.type}</span>
                        </div>
                        <Bdg pair={st} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: ANUNCIOS ══ */}
        {activeTab === 'announcements' && isMainAdmin && (
          <div className="py-5 space-y-5 animate-fade-up">

            {/* Formulario nuevo anuncio */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.2)' }}>
                  <svg className="w-4 h-4" style={{ color:'#06b6d4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <p className="font-semibold">{t('announcements.new')}</p>
              </div>
              <form onSubmit={handlePublish} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('announcements.titleField')}</label>
                    <input type="text" value={annForm.title} onChange={e=>setAnnForm({...annForm,title:e.target.value})} className="field" placeholder="Mañana es feriado..." required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('announcements.category')}</label>
                    <select value={annForm.category} onChange={e=>setAnnForm({...annForm,category:e.target.value})} className="field">
                      {['general','important','urgent','event','policy'].map(c => (
                        <option key={c} value={c}>{t(`announcements.categories.${c}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('announcements.content')}</label>
                  <textarea value={annForm.content} onChange={e=>setAnnForm({...annForm,content:e.target.value})} rows={3} className="field resize-none" placeholder="Escribe el mensaje para todos los empleados..." required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('announcements.expiresAt')}</label>
                  <input type="datetime-local" value={annForm.expires_at} onChange={e=>setAnnForm({...annForm,expires_at:e.target.value})} className="field" />
                </div>
                <button type="submit" disabled={isPublishing} className="btn btn-primary">
                  {isPublishing
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{t('announcements.publishing')}</>
                    : t('announcements.publish')}
                </button>
              </form>
            </div>

            {/* Lista de anuncios activos */}
            {announcements.length === 0 ? (
              <div className="card p-10 text-center">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('announcements.noAnnouncements')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(ann => {
                  const ANN_STYLE = {
                    urgent:    { bg:'rgba(239,68,68,0.1)',    border:'rgba(239,68,68,0.22)',    color:'#f87171',  icon:'🚨' },
                    important: { bg:'rgba(245,158,11,0.1)',   border:'rgba(245,158,11,0.22)',   color:'#fbbf24',  icon:'⚠️' },
                    event:     { bg:'rgba(168,85,247,0.1)',   border:'rgba(168,85,247,0.22)',   color:'#c084fc',  icon:'📅' },
                    general:   { bg:'rgba(6,182,212,0.08)',   border:'rgba(6,182,212,0.2)',     color:'#67e8f9',  icon:'📢' },
                    policy:    { bg:'rgba(100,116,139,0.08)', border:'rgba(100,116,139,0.2)',   color:'#94a3b8',  icon:'📋' },
                  }[ann.category] || { bg:'rgba(6,182,212,0.08)', border:'rgba(6,182,212,0.2)', color:'#67e8f9', icon:'📢' };
                  return (
                    <div key={ann.id} className="rounded-2xl p-4 flex gap-4 items-start" style={{ background:ANN_STYLE.bg, border:`1px solid ${ANN_STYLE.border}` }}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{ANN_STYLE.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm" style={{ color:ANN_STYLE.color }}>{ann.title}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background:ANN_STYLE.border, color:ANN_STYLE.color }}>{t(`announcements.categories.${ann.category}`) || ann.category}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ann.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                          <span>{t('announcements.postedBy')} {ann.created_by_username || 'admin'}</span>
                          {ann.expires_at && <span>{t('announcements.expires')} {fmtDate(ann.expires_at)}</span>}
                        </div>
                      </div>
                      <button onClick={()=>handleDeleteAnn(ann.id)} className="btn btn-danger px-2.5 py-1.5 text-xs flex-shrink-0">
                        {t('common.delete')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: INCIDENTES ══ */}
        {activeTab === 'incidents' && (
          <div className="py-5 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
              <p className="font-semibold">{t('admin.reportedIncidents')}</p>
              {openIncs > 0 && <span className="badge badge-red">{openIncs} {t('admin.openCount')}</span>}
            </div>

            {incidents.length === 0 ? (
              <div className="card p-10 text-center">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('admin.noIncidents')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map(inc => {
                  const st = INC_STATUS[inc.status]||INC_STATUS.open;
                  const pr = INC_PRI[inc.priority]||INC_PRI.medium;
                  return (
                    <div key={inc.id} className="card p-5">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{inc.username||inc.user?.username||'Usuario'}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{INC_TYPE[inc.type||inc.category]||t('incidents.types.other')}</span>
                            <Bdg pair={st} />
                            <Bdg pair={pr} />
                          </div>
                          {inc.title && <p className="font-medium text-sm mb-1">{inc.title}</p>}
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{inc.description}</p>
                          <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>{fmtDate(inc.created_at)}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 flex-wrap">
                          {(inc.status==='open'||inc.status==='pending') && (
                            <button onClick={()=>updateInc(inc.id,'in_review')} className="btn text-xs px-3 py-2" style={{ background:'rgba(59,130,246,0.12)', color:'#93c5fd', border:'1px solid rgba(59,130,246,0.2)' }}>
                              {t('admin.inReview')}
                            </button>
                          )}
                          {inc.status !== 'resolved' && (
                            <button onClick={()=>updateInc(inc.id,'resolved')} className="btn text-xs px-3 py-2" style={{ background:'rgba(34,197,94,0.12)', color:'#86efac', border:'1px solid rgba(34,197,94,0.2)' }}>
                              ✓ {t('admin.resolved')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
