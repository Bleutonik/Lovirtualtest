import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const Incidents = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'tecnico', title: '', description: '', priority: 'media' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadIncidents(); }, []);

  const loadIncidents = async () => {
    try {
      const data = await api.get('/incidents');
      const inc = data?.data || data?.incidents || data || [];
      setIncidents(Array.isArray(inc) ? inc : []);
    } catch {} finally { setIsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Completa el título y la descripción'); setTimeout(() => setError(''), 3000); return;
    }
    setIsSubmitting(true); setError('');
    try {
      const catMap = { tecnico: 'technical', sistema: 'general', otro: 'other' };
      const priMap = { baja: 'low', media: 'medium', alta: 'high' };
      await api.post('/incidents', {
        title: formData.title, description: formData.description,
        category: catMap[formData.type] || 'general', priority: priMap[formData.priority] || 'medium'
      });
      setFormData({ type: 'tecnico', title: '', description: '', priority: 'media' });
      setSuccess('Incidente reportado exitosamente'); setTimeout(() => setSuccess(''), 3000);
      await loadIncidents();
    } catch { setError('Error al reportar el incidente'); setTimeout(() => setError(''), 3000); }
    finally { setIsSubmitting(false); }
  };

  const fmtDate = (ds) => new Date(ds).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const STATUS = {
    open:      { cls: 'badge-yellow', label: 'Abierto' },
    pending:   { cls: 'badge-yellow', label: 'Pendiente' },
    in_review: { cls: 'badge-blue',   label: 'En revisión' },
    resolved:  { cls: 'badge-green',  label: 'Resuelto' },
    closed:    { cls: 'badge-gray',   label: 'Cerrado' },
  };

  const PRIORITY = {
    baja:     { cls: 'badge-gray',   label: 'Baja' },
    media:    { cls: 'badge-yellow', label: 'Media' },
    alta:     { cls: 'badge-red',    label: 'Alta' },
    low:      { cls: 'badge-gray',   label: 'Baja' },
    medium:   { cls: 'badge-yellow', label: 'Media' },
    high:     { cls: 'badge-red',    label: 'Alta' },
    critical: { cls: 'badge-red',    label: 'Crítica' },
  };

  const TYPE_LABELS = {
    tecnico: 'Técnico', sistema: 'Sistema', otro: 'Otro',
    technical: 'Técnico', general: 'General', hr: 'RRHH', safety: 'Seguridad', other: 'Otro'
  };

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
            <h1 className="font-bold">Reportar Incidente</h1>
            <p className="text-xs" style={{ color: '#475569' }}>Documenta problemas técnicos o de sistema</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-6">

        {success && <div className="alert-success flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{success}</div>}
        {error   && <div className="alert-error   flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}

        {/* Formulario */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-5 h-5" style={{ color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-semibold">Nuevo Incidente</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Tipo de incidente</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="field">
                  <option value="tecnico">Técnico</option>
                  <option value="sistema">Sistema</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Prioridad</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="field">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Título</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                className="field" placeholder="Resumen del incidente..." required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Descripción</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                rows={4} className="field resize-none" placeholder="Describe el incidente con el mayor detalle posible..." required />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-2.5">
              {isSubmitting ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Enviando...</>
              ) : 'Enviar Incidente'}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div>
          <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: '#475569' }}>MIS INCIDENTES</p>
          {isLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
          ) : incidents.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: '#475569' }}>No has reportado incidentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => {
                const st = STATUS[inc.status] || STATUS.open;
                const pr = PRIORITY[inc.priority] || PRIORITY.media;
                return (
                  <div key={inc.id} className="card p-5 animate-fade-up">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs" style={{ color: '#475569' }}>{TYPE_LABELS[inc.type || inc.category] || 'Otro'}</span>
                        <span className={`badge ${pr.cls}`}>{pr.label}</span>
                      </div>
                      <span className={`badge ${st.cls} flex-shrink-0`}>{st.label}</span>
                    </div>
                    {inc.title && <h3 className="font-semibold text-sm mb-1">{inc.title}</h3>}
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{inc.description}</p>
                    <p className="text-xs mt-3" style={{ color: '#334155' }}>{fmtDate(inc.created_at)}</p>
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

export default Incidents;
