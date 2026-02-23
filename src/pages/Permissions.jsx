import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const Permissions = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'dia_libre', date: '', start_time: '', end_time: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async () => {
    try {
      const data = await api.get('/permissions');
      const perms = data?.data?.permissions || data?.permissions || data?.data || data || [];
      setPermissions(Array.isArray(perms) ? perms : []);
    } catch {} finally { setIsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason.trim()) {
      setError('Completa la fecha y la razón'); setTimeout(() => setError(''), 3000); return;
    }
    setIsSubmitting(true); setError('');
    try {
      const typeMap = { dia_libre: 'personal', llegada_tarde: 'personal', salida_temprana: 'personal', vacaciones: 'vacation', otro: 'other' };
      await api.post('/permissions', { type: typeMap[formData.type] || 'personal', date_from: formData.date, date_to: formData.date, reason: formData.reason });
      setFormData({ type: 'dia_libre', date: '', start_time: '', end_time: '', reason: '' });
      setSuccess('Permiso solicitado exitosamente'); setTimeout(() => setSuccess(''), 3000);
      await loadPermissions();
    } catch { setError('Error al solicitar el permiso'); setTimeout(() => setError(''), 3000); }
    finally { setIsSubmitting(false); }
  };

  const fmtDate = (ds) => new Date(ds).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  const STATUS = {
    pending:  { cls: 'badge-yellow', label: 'Pendiente', icon: '⏳' },
    approved: { cls: 'badge-green',  label: 'Aprobado',  icon: '✓' },
    rejected: { cls: 'badge-red',    label: 'Rechazado', icon: '✕' },
  };

  const TYPE_LABELS = {
    dia_libre: 'Día Libre', llegada_tarde: 'Llegada Tarde', salida_temprana: 'Salida Temprana',
    vacaciones: 'Vacaciones', otro: 'Otro', vacation: 'Vacaciones', sick_leave: 'Licencia Médica',
    personal: 'Permiso Personal', maternity: 'Maternidad', paternity: 'Paternidad',
    bereavement: 'Duelo', other: 'Otro'
  };

  const TYPE_OPTS = [
    { value: 'dia_libre',       label: 'Día Libre',       icon: '🏖️' },
    { value: 'llegada_tarde',   label: 'Llegada Tarde',   icon: '⏰' },
    { value: 'salida_temprana', label: 'Salida Temprana', icon: '🚪' },
    { value: 'vacaciones',      label: 'Vacaciones',      icon: '✈️' },
    { value: 'otro',            label: 'Otro',            icon: '📋' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#070b12', color: '#f1f5f9' }}>

      <header className="page-header">
        <div className="px-5 py-3.5 flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold">Solicitar Permiso</h1>
            <p className="text-xs" style={{ color: '#475569' }}>Gestiona tus ausencias y permisos</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-6">

        {success && <div className="alert-success flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{success}</div>}
        {error   && <div className="alert-error   flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}

        {/* Tipos rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TYPE_OPTS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setFormData({...formData, type: opt.value})}
              className="rounded-xl py-3 px-2 text-center text-xs font-medium transition-all"
              style={{
                background: formData.type === opt.value ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                border: formData.type === opt.value ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: formData.type === opt.value ? '#67e8f9' : '#64748b'
              }}>
              <div className="text-lg mb-1">{opt.icon}</div>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <svg className="w-5 h-5" style={{ color: '#06b6d4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Nueva Solicitud</h2>
              <p className="text-xs" style={{ color: '#475569' }}>{TYPE_LABELS[formData.type]}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Fecha</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                className="field" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Hora inicio <span style={{ color: '#334155' }}>(opcional)</span></label>
                <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="field" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Hora fin <span style={{ color: '#334155' }}>(opcional)</span></label>
                <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="field" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Razón</label>
              <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}
                rows={3} className="field resize-none" placeholder="Describe el motivo de tu solicitud..." required />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-2.5">
              {isSubmitting ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Enviando...</>
              ) : 'Enviar Solicitud'}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div>
          <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: '#475569' }}>MIS SOLICITUDES</p>
          {isLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
          ) : permissions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: '#475569' }}>No has enviado solicitudes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.map(p => {
                const st = STATUS[p.status] || STATUS.pending;
                return (
                  <div key={p.id} className="card p-5 animate-fade-up">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm" style={{ color: '#67e8f9' }}>{TYPE_LABELS[p.type] || p.type}</p>
                          <span className="text-xs" style={{ color: '#475569' }}>
                            · {fmtDate(p.date_from || p.date)}
                            {p.date_to && p.date_to !== p.date_from && ` → ${fmtDate(p.date_to)}`}
                          </span>
                        </div>
                        {(p.start_time || p.end_time) && (
                          <p className="text-xs mb-1" style={{ color: '#475569' }}>
                            {p.start_time && `Desde ${p.start_time}`}{p.start_time && p.end_time && ' · '}{p.end_time && `Hasta ${p.end_time}`}
                          </p>
                        )}
                        <p className="text-sm" style={{ color: '#94a3b8' }}>{p.reason}</p>
                      </div>
                      <span className={`badge ${st.cls} flex-shrink-0`}>{st.icon} {st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Permissions;
