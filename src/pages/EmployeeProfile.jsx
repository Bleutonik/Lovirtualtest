import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { get, put } from '../services/api';

const fmtDate = d => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—';
const fmtHours = h => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;

const statusColor = { active: '#22c55e', idle: '#f59e0b', offline: '#6b7280' };
const statusLabel = { active: 'En línea', idle: 'Inactivo', offline: 'Desconectado' };

const Av = ({ name, avatar, size = 80 }) => (
  avatar
    ? <img src={avatar} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}>
        {String(name || '?').charAt(0).toUpperCase()}
      </div>
);

const StatCard = ({ icon, label, value, sub }) => (
  <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', flex: 1, minWidth: 120 }}>
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: '#374151', marginTop: 1 }}>{sub}</div>}
  </div>
);

export default function EmployeeProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin' || me?.role === 'supervisor';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await get(`/users/${userId}/profile`);
      const data = res?.data || res;
      setProfile(data);
      setForm({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        client: data.user.client || '',
        email: data.user.email || '',
        avatar: data.user.avatar || '',
      });
    } catch {
      setError('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await put(`/users/${userId}`, form);
      await loadProfile();
      setEditing(false);
    } catch {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={S.screen}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(14,165,233,0.3)', borderTop: '3px solid #0ea5e9', animation: 'spin 1s linear infinite' }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error && !profile) return (
    <div style={S.screen}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Volver</button>
      </div>
    </div>
  );

  const { user, stats, recentAttendance } = profile;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
  const puntuality = stats.thisMonth.daysPresent > 0
    ? Math.round(((stats.thisMonth.daysPresent - stats.thisMonth.daysLate) / stats.thisMonth.daysPresent) * 100)
    : 100;

  return (
    <div style={S.screen}>
      {/* Header */}
      <header style={S.header}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2">
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
        <p style={{ fontWeight: 600, fontSize: 14 }}>Perfil</p>
        {isAdmin && (
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
            style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: 'none', background: editing ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Guardando…' : editing ? 'Guardar' : 'Editar'}
          </button>
        )}
        {editing && (
          <button onClick={() => setEditing(false)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
        )}
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', maxWidth: 640, margin: '0 auto', width: '100%' }}>

        {/* Tarjeta de perfil principal */}
        <div style={{ background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 16, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Av name={user.username} avatar={user.avatar} size={72} />
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 14, height: 14, borderRadius: '50%',
              background: statusColor[stats.onlineStatus],
              border: '2px solid #0b0f1a'
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="field" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="Nombre" style={{ flex: 1, fontSize: 13 }} />
                  <input className="field" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Apellido" style={{ flex: 1, fontSize: 13 }} />
                </div>
                <input className="field" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                  placeholder="Cliente / empresa que atiende" style={{ fontSize: 13 }} />
                <input className="field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Email" style={{ fontSize: 13 }} />
                <input className="field" value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                  placeholder="URL de foto de perfil" style={{ fontSize: 13 }} />
              </div>
            ) : (
              <>
                <h2 style={{ fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 4 }}>{fullName}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(14,165,233,0.1)', color: '#38bdf8', fontSize: 11, fontWeight: 600, border: '1px solid rgba(14,165,233,0.2)' }}>
                    {user.role === 'admin' ? 'Administrador' : user.role === 'supervisor' ? 'Supervisor' : 'Empleado'}
                  </span>
                  <span style={{ padding: '2px 10px', borderRadius: 20, background: `${statusColor[stats.onlineStatus]}18`, color: statusColor[stats.onlineStatus], fontSize: 11, fontWeight: 600, border: `1px solid ${statusColor[stats.onlineStatus]}30` }}>
                    {statusLabel[stats.onlineStatus]}
                  </span>
                </div>
                {user.client && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <svg width={13} height={13} fill="none" stroke="#64748b" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Cliente: <b style={{ color: '#f1f5f9' }}>{user.client}</b></span>
                  </div>
                )}
                {user.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width={13} height={13} fill="none" stroke="#64748b" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{user.email}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats del mes */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.08em', marginBottom: 10 }}>ESTADÍSTICAS DEL MES</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <StatCard icon="📅" label="Días presentes" value={stats.thisMonth.daysPresent} />
          <StatCard icon="⏰" label="Horas trabajadas" value={stats.thisMonth.totalHours > 0 ? fmtHours(stats.thisMonth.totalHours) : '0h'} />
          <StatCard icon="✅" label="Tareas completadas" value={stats.tasks.completed} sub={`${stats.tasks.pending} pendientes`} />
          <StatCard icon="⚡" label="Puntualidad" value={`${puntuality}%`} sub={stats.thisMonth.daysLate > 0 ? `${stats.thisMonth.daysLate} tarde(s)` : 'Sin tardanzas'} />
        </div>

        {/* Asistencia reciente */}
        {recentAttendance.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.08em', marginBottom: 10 }}>ASISTENCIA RECIENTE</p>
            <div style={{ background: '#0b0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {recentAttendance.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < recentAttendance.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 12, color: '#64748b', width: 64, flexShrink: 0 }}>{fmtDate(a.date)}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: a.status === 'present' ? 'rgba(34,197,94,0.1)' : a.status === 'late' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)', color: a.status === 'present' ? '#22c55e' : a.status === 'late' ? '#f59e0b' : '#6b7280', fontWeight: 600, flexShrink: 0 }}>
                    {a.status === 'present' ? 'Presente' : a.status === 'late' ? 'Tarde' : 'Ausente'}
                  </span>
                  <span style={{ fontSize: 12, color: '#374151', marginLeft: 'auto' }}>
                    {a.clock_in ? new Date(a.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {' → '}
                    {a.clock_out ? new Date(a.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Activo'}
                  </span>
                  {a.total_hours > 0 && <span style={{ fontSize: 12, color: '#475569', flexShrink: 0 }}>{fmtHours(a.total_hours)}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {recentAttendance.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#374151', fontSize: 13 }}>
            Sin registros de asistencia todavía
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const S = {
  screen: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#070b12', color: '#f1f5f9' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: '#0b0f1a', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
};
