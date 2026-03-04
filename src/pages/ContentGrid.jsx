import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import * as api from '../services/api';
import ActivityTracker from '../components/ActivityTracker';

/* ── Constantes ─────────────────────────────────────── */
const REDES = ['Instagram', 'Facebook', 'TikTok', 'Twitter/X', 'LinkedIn', 'YouTube', 'Pinterest'];
const TIPOS = ['Post', 'Reel', 'Story', 'Carrusel', 'Video', 'Live', 'Blog', 'Newsletter'];
const ESTADOS = ['En planeación', 'En diseño', 'En revisión', 'Programado', 'Publicado'];
const OBJETIVOS = ['Engagement', 'Humanización', 'Venta', 'Educación', 'Reconocimiento'];
const PILARES = ['Comunidad', 'Experiencia', 'Beneficios', 'Testimonios', 'Autoridad', 'Entretenimiento'];
const FUNNELS = ['Descubrimiento', 'Consideración', 'Conversión', 'Fidelización'];
const PAUTAS = ['Orgánico', 'Pauta', 'Mixto'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const COLORES = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

const estadoColor = (e) => ({
  'En planeación': { bg: 'rgba(100,116,139,0.18)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  'En diseño':     { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  'En revisión':   { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  'Programado':    { bg: 'rgba(168,85,247,0.15)',  color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  'Publicado':     { bg: 'rgba(34,197,94,0.15)',   color: '#86efac', border: 'rgba(34,197,94,0.3)'  },
}[e] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: 'rgba(100,116,139,0.2)' });

const redIcon = (r) => ({
  Instagram: '📸', Facebook: '📘', TikTok: '🎵', 'Twitter/X': '🐦',
  LinkedIn: '💼', YouTube: '▶️', Pinterest: '📌',
}[r] || '📣');

const emptyForm = (fecha = '') => ({
  titulo: '', descripcion: '', fecha: fecha || new Date().toISOString().split('T')[0],
  red_social: 'Instagram', tipo_contenido: 'Post', estado: 'En planeación',
  color: '#3B82F6', cuenta_cliente: '', campana: '', objetivo_post: 'Engagement',
  pilar_contenido: 'Comunidad', etapa_funnel: 'Descubrimiento', hook: '',
  cta_texto: '', tipo_pauta: 'Orgánico', copy_arte: '', copy_caption: '',
  indicaciones_arte: '', link_referencia: '', referencia_visual: '',
  hashtags: '', duracion: '', presupuesto: '', segmentacion: '',
});

/* ── Modal Form ─────────────────────────────────────── */
function PublicacionModal({ open, onClose, editData, defaultDate, onSaved }) {
  const [form, setForm] = useState(emptyForm(defaultDate));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('plan');

  useEffect(() => {
    if (open) {
      setTab('plan');
      setForm(editData ? {
        titulo: editData.titulo || '',
        descripcion: editData.descripcion || '',
        fecha: editData.fecha || '',
        red_social: editData.red_social || 'Instagram',
        tipo_contenido: editData.tipo_contenido || 'Post',
        estado: editData.estado || 'En planeación',
        color: editData.color || '#3B82F6',
        cuenta_cliente: editData.cuenta_cliente || '',
        campana: editData.campana || '',
        objetivo_post: editData.objetivo_post || 'Engagement',
        pilar_contenido: editData.pilar_contenido || 'Comunidad',
        etapa_funnel: editData.etapa_funnel || 'Descubrimiento',
        hook: editData.hook || '',
        cta_texto: editData.cta_texto || '',
        tipo_pauta: editData.tipo_pauta || 'Orgánico',
        copy_arte: editData.copy_arte || '',
        copy_caption: editData.copy_caption || '',
        indicaciones_arte: editData.indicaciones_arte || '',
        link_referencia: editData.link_referencia || '',
        referencia_visual: editData.referencia_visual || '',
        hashtags: editData.hashtags || '',
        duracion: editData.duracion || '',
        presupuesto: editData.presupuesto != null ? String(editData.presupuesto) : '',
        segmentacion: editData.segmentacion || '',
      } : emptyForm(defaultDate));
    }
  }, [open, editData, defaultDate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.fecha) return;
    setSaving(true);
    try {
      const payload = { ...form, presupuesto: form.presupuesto ? Number(form.presupuesto) : null };
      if (editData) {
        await api.put(`/content/${editData.id}`, payload);
      } else {
        await api.post('/content', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  if (!open) return null;

  const inputClass = 'w-full px-3 py-2 rounded-xl text-sm outline-none transition-all';
  const inputStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' };
  const selectStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="font-semibold">{editData ? 'Editar publicación' : 'Nueva publicación'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {form.red_social && <>{redIcon(form.red_social)} {form.red_social}</>}
              {form.fecha && <> · {form.fecha}</>}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
          {[['plan', '📋 Planificación'], ['exec', '🎨 Ejecución']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="px-4 py-2 text-xs font-semibold rounded-t-lg transition-all"
              style={{
                color: tab === v ? 'var(--cyan)' : 'var(--text-muted)',
                borderBottom: tab === v ? '2px solid var(--cyan)' : '2px solid transparent',
                background: 'transparent',
              }}>{l}</button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'plan' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Fecha *</label>
                  <input type="date" className={inputClass} style={inputStyle} value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Cliente / Cuenta</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.cuenta_cliente} onChange={e => set('cuenta_cliente', e.target.value)} placeholder="Nombre del cliente..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Título *</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.titulo} onChange={e => set('titulo', e.target.value)} required placeholder="Título de la publicación..." />
                </div>
                <div>
                  <label style={labelStyle}>Campaña</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.campana} onChange={e => set('campana', e.target.value)} placeholder="Nombre de la campaña..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Canal', 'red_social', REDES],
                  ['Formato', 'tipo_contenido', TIPOS],
                  ['Tipo pauta', 'tipo_pauta', PAUTAS],
                ].map(([label, field, opts]) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <select className={inputClass} style={selectStyle} value={form[field]} onChange={e => set(field, e.target.value)}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Objetivo', 'objetivo_post', OBJETIVOS],
                  ['Pilar de contenido', 'pilar_contenido', PILARES],
                  ['Etapa del funnel', 'etapa_funnel', FUNNELS],
                ].map(([label, field, opts]) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <select className={inputClass} style={selectStyle} value={form[field]} onChange={e => set(field, e.target.value)}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Hook</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.hook} onChange={e => set('hook', e.target.value)} placeholder="Idea central de atracción..." />
                </div>
                <div>
                  <label style={labelStyle}>CTA</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.cta_texto} onChange={e => set('cta_texto', e.target.value)} placeholder="Acción del usuario..." />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Estado</label>
                <select className={inputClass} style={selectStyle} value={form.estado} onChange={e => set('estado', e.target.value)}>
                  {ESTADOS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Color */}
              <div>
                <label style={labelStyle}>Color de tarjeta</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {COLORES.map(c => (
                    <button key={c} type="button" onClick={() => set('color', c)}
                      className="rounded-full transition-all"
                      style={{
                        width: 28, height: 28, background: c,
                        border: form.color === c ? '3px solid #fff' : '3px solid transparent',
                        outline: form.color === c ? '2px solid var(--cyan)' : '2px solid transparent',
                        transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      }} />
                  ))}
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                    className="rounded-full cursor-pointer" style={{ width: 28, height: 28, border: 0, padding: 0, background: 'transparent' }} />
                </div>
              </div>
            </>
          )}

          {tab === 'exec' && (
            <>
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea rows={2} className={inputClass} style={inputStyle} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción general..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Copy Arte</label>
                  <textarea rows={3} className={inputClass} style={inputStyle} value={form.copy_arte} onChange={e => set('copy_arte', e.target.value)} placeholder="Texto en el arte..." />
                </div>
                <div>
                  <label style={labelStyle}>Copy Caption</label>
                  <textarea rows={3} className={inputClass} style={inputStyle} value={form.copy_caption} onChange={e => set('copy_caption', e.target.value)} placeholder="Caption de la publicación..." />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Indicaciones para el arte</label>
                <textarea rows={2} className={inputClass} style={inputStyle} value={form.indicaciones_arte} onChange={e => set('indicaciones_arte', e.target.value)} placeholder="Instrucciones para el diseñador..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Referencia visual</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.referencia_visual} onChange={e => set('referencia_visual', e.target.value)} placeholder="URL o descripción..." />
                </div>
                <div>
                  <label style={labelStyle}>Link de referencia</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.link_referencia} onChange={e => set('link_referencia', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={labelStyle}>Hashtags</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.hashtags} onChange={e => set('hashtags', e.target.value)} placeholder="#hashtag1..." />
                </div>
                <div>
                  <label style={labelStyle}>Duración</label>
                  <input type="text" className={inputClass} style={inputStyle} value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="30s, 1min..." />
                </div>
                <div>
                  <label style={labelStyle}>Presupuesto ($)</label>
                  <input type="number" className={inputClass} style={inputStyle} value={form.presupuesto} onChange={e => set('presupuesto', e.target.value)} placeholder="0" min="0" step="0.01" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Segmentación</label>
                <input type="text" className={inputClass} style={inputStyle} value={form.segmentacion} onChange={e => set('segmentacion', e.target.value)} placeholder="Descripción de la segmentación..." />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} className="btn flex-1" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary flex-1">
            {saving ? 'Guardando...' : editData ? 'Guardar cambios' : 'Crear publicación'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Vista Semanal ──────────────────────────────────── */
function WeeklyView({ publicaciones, weekOffset, setWeekOffset, onDayClick, onEditPub }) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const byDate = useMemo(() => {
    const map = {};
    publicaciones.forEach(p => {
      if (!map[p.fecha]) map[p.fecha] = [];
      map[p.fecha].push(p);
    });
    return map;
  }, [publicaciones]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(w => w - 1)} className="btn text-xs px-3 py-1.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>← Anterior</button>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="btn text-xs px-3 py-1.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Siguiente →</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayPubs = byDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={i}
              onClick={() => onDayClick(dateStr)}
              className="rounded-xl p-3 cursor-pointer transition-all"
              style={{
                background: isToday ? 'rgba(6,182,212,0.06)' : 'var(--surface)',
                border: isToday ? '1px solid rgba(6,182,212,0.35)' : '1px solid var(--border)',
                minHeight: 140,
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.borderColor = 'rgba(6,182,212,0.2)'; }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{DIAS_LARGO[i]}</div>
              <div className="text-xl font-bold mb-2" style={{ color: isToday ? 'var(--cyan)' : 'var(--text)' }}>{date.getDate()}</div>
              <div className="space-y-1.5">
                {dayPubs.map(p => (
                  <div key={p.id}
                    onClick={e => { e.stopPropagation(); onEditPub(p); }}
                    className="rounded-lg px-2 py-1.5 text-xs cursor-pointer transition-all"
                    style={{ background: p.color || '#3B82F6', color: '#fff', opacity: 0.92 }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <div className="font-semibold truncate">{p.titulo}</div>
                    <div className="opacity-80 text-[10px] mt-0.5">{redIcon(p.red_social)} {p.red_social} · {p.tipo_contenido}</div>
                    {p.campana && <div className="opacity-70 text-[10px] truncate">{p.campana}</div>}
                    <div className="mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: 'rgba(255,255,255,0.2)' }}>{p.estado}</span>
                    </div>
                  </div>
                ))}
                {dayPubs.length === 0 && (
                  <div className="text-center py-3 rounded-lg transition-all" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    <span style={{ opacity: 0.4 }}>＋</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Vista Calendario ───────────────────────────────── */
function CalendarView({ publicaciones, month, year, onDayClick, onEditPub }) {
  const { days, startOffset } = useMemo(() => {
    const d = new Date(year, month + 1, 0).getDate();
    const first = new Date(year, month, 1).getDay();
    return { days: d, startOffset: first === 0 ? 6 : first - 1 };
  }, [month, year]);

  const byDay = useMemo(() => {
    const map = {};
    publicaciones.forEach(p => {
      const day = parseInt(p.fecha.split('-')[2]);
      if (!map[day]) map[day] = [];
      map[day].push(p);
    });
    return map;
  }, [publicaciones]);

  const todayStr = new Date().toISOString().split('T')[0];
  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={`e${i}`} className="rounded-xl" style={{ minHeight: 90, background: 'rgba(255,255,255,0.01)' }} />);
  }

  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPubs = byDay[d] || [];
    const isToday = dateStr === todayStr;
    cells.push(
      <div key={d}
        onClick={() => onDayClick(dateStr)}
        className="rounded-xl p-2 cursor-pointer transition-all"
        style={{
          background: isToday ? 'rgba(6,182,212,0.06)' : 'var(--surface)',
          border: isToday ? '1px solid rgba(6,182,212,0.35)' : '1px solid var(--border)',
          minHeight: 90,
        }}
        onMouseEnter={e => { if (!isToday) e.currentTarget.style.borderColor = 'rgba(6,182,212,0.2)'; }}
        onMouseLeave={e => { if (!isToday) e.currentTarget.style.borderColor = isToday ? 'rgba(6,182,212,0.35)' : 'var(--border)'; }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold" style={{ color: isToday ? 'var(--cyan)' : 'var(--text)' }}>{d}</span>
          {dayPubs.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>{dayPubs.length}</span>}
        </div>
        <div className="space-y-1">
          {dayPubs.slice(0, 3).map(p => (
            <div key={p.id}
              onClick={e => { e.stopPropagation(); onEditPub(p); }}
              className="rounded px-1.5 py-1 text-[10px] font-medium truncate text-white cursor-pointer transition-all"
              style={{ background: p.color || '#3B82F6' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              {redIcon(p.red_social)} {p.titulo}
            </div>
          ))}
          {dayPubs.length > 3 && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{dayPubs.length - 3} más</div>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_CORTO.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}

/* ── Vista Tabla ────────────────────────────────────── */
function TableView({ publicaciones, onEdit, onDelete }) {
  const [filterRed, setFilterRed] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [sortField, setSortField] = useState('fecha');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let r = publicaciones.filter(p => {
      if (filterRed !== 'all' && p.red_social !== filterRed) return false;
      if (filterEstado !== 'all' && p.estado !== filterEstado) return false;
      return true;
    });
    r.sort((a, b) => {
      const av = (a[sortField] || '');
      const bv = (b[sortField] || '');
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [publicaciones, filterRed, filterEstado, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const selStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 10, fontSize: 12, outline: 'none' };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select value={filterRed} onChange={e => setFilterRed(e.target.value)} style={selStyle}>
          <option value="all">Todos los canales</option>
          {REDES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={selStyle}>
          <option value="all">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>{filtered.length} publicación{filtered.length !== 1 ? 'es' : ''}</span>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th className="px-3 py-3 text-left w-8"></th>
                {[['fecha', 'Fecha'], ['cuenta_cliente', 'Cliente'], ['campana', 'Campaña'], ['titulo', 'Título'], ['red_social', 'Canal'], ['tipo_contenido', 'Formato'], ['objetivo_post', 'Objetivo'], ['estado', 'Estado']].map(([field, label]) => (
                  <th key={field} className="px-3 py-3 text-left cursor-pointer select-none whitespace-nowrap"
                    style={{ color: 'var(--text-muted)', fontWeight: 600 }}
                    onClick={() => toggleSort(field)}>
                    {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
                <th className="px-3 py-3 text-left" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin publicaciones</td></tr>
              ) : filtered.map((p, i) => {
                const ec = estadoColor(p.estado);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                    <td className="px-3 py-2.5">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: p.color || '#3B82F6' }} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{p.fecha}</td>
                    <td className="px-3 py-2.5 max-w-[120px] truncate" style={{ color: 'var(--text)' }}>{p.cuenta_cliente || '—'}</td>
                    <td className="px-3 py-2.5 max-w-[120px] truncate" style={{ color: 'var(--text-muted)' }}>{p.campana || '—'}</td>
                    <td className="px-3 py-2.5 max-w-[160px] truncate font-medium" style={{ color: 'var(--text)' }} title={p.titulo}>{p.titulo}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{redIcon(p.red_social)} <span style={{ color: 'var(--text-muted)' }}>{p.red_social}</span></td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{p.tipo_contenido}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{p.objetivo_post || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap" style={{ background: ec.bg, color: ec.color, border: `1px solid ${ec.border}` }}>{p.estado}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => onEdit(p)} className="btn text-xs px-2 py-1" style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid rgba(6,182,212,0.2)' }}>Editar</button>
                        <button onClick={() => onDelete(p)} className="btn text-xs px-2 py-1" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Página Principal ───────────────────────────────── */
export default function ContentGrid() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState('semanal');
  const [weekOffset, setWeekOffset] = useState(0);

  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [defaultDate, setDefaultDate] = useState('');

  const navItems = [
    { name: t('nav.home'),        path: '/' },
    { name: t('nav.feed'),        path: '/feed' },
    { name: t('nav.tasks'),       path: '/tasks' },
    { name: t('nav.notes'),       path: '/notes' },
    { name: t('nav.incidents'),   path: '/incidents' },
    { name: t('nav.permissions'), path: '/permissions' },
    { name: t('nav.chat'),        path: '/chat' },
    { name: 'Parrilla',           path: '/content', active: true },
    ...((user?.role === 'admin' || user?.role === 'supervisor') ? [{ name: t('nav.panel'), path: '/admin', admin: true }] : [])
  ];

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/content?month=${month}&year=${year}`);
      setPublicaciones(res?.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [month, year]);

  const openNew = (date = '') => { setEditData(null); setDefaultDate(date); setFormOpen(true); };
  const openEdit = (pub) => { setEditData(pub); setDefaultDate(''); setFormOpen(true); };

  const handleDelete = async (pub) => {
    if (!confirm(`¿Eliminar "${pub.titulo}"?`)) return;
    try {
      await api.delete(`/content/${pub.id}`);
      load();
    } catch (err) { alert(err.message); }
  };

  // Stats
  const stats = useMemo(() => {
    const total = publicaciones.length;
    const byEstado = {};
    ESTADOS.forEach(e => { byEstado[e] = publicaciones.filter(p => p.estado === e).length; });
    const byRed = {};
    REDES.forEach(r => { const n = publicaciones.filter(p => p.red_social === r).length; if (n) byRed[r] = n; });
    return { total, byEstado, byRed };
  }, [publicaciones]);

  const selStyle = { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 10, fontSize: 13, outline: 'none' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <ActivityTracker />

      {/* ── Header ── */}
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map(item => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    color: item.active ? 'var(--cyan)' : item.admin ? '#fbbf24' : 'var(--text-muted)',
                    background: item.active ? 'var(--cyan-dim)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = item.admin ? '#fde68a' : 'var(--text)'; } }}
                  onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.admin ? '#fbbf24' : 'var(--text-muted)'; } }}>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/profile/${user?.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.username}</span>
              {user?.role === 'admin' && <span className="badge badge-yellow">Admin</span>}
            </button>
            <button onClick={logout} className="btn btn-danger text-xs px-3 py-1.5">Salir</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-6 space-y-5">

        {/* ── Título + controles ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">📅 Parrilla de Contenido</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Planifica y gestiona tus publicaciones</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={String(month)} onChange={e => setMonth(Number(e.target.value))} style={selStyle}>
              {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={String(year)} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => openNew()} className="btn btn-primary text-sm px-4 py-2">+ Nueva publicación</button>
          </div>
        </div>

        {/* ── Stats rápidas ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card p-4 col-span-2 md:col-span-1 flex flex-col gap-1">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total del mes</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--cyan)' }}>{stats.total}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>publicaciones</p>
          </div>
          {ESTADOS.map(e => {
            const ec = estadoColor(e);
            const n = stats.byEstado[e] || 0;
            return (
              <div key={e} className="card p-3 flex flex-col gap-1">
                <p className="text-xs truncate" style={{ color: ec.color }}>{e}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{n}</p>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: 'var(--surface-2)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: stats.total ? `${(n / stats.total) * 100}%` : '0%', background: ec.color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {[['semanal', '🗓 Semanal'], ['calendario', '📆 Calendario'], ['tabla', '📋 Tabla']].map(([v, l]) => (
            <button key={v} onClick={() => setActiveTab(v)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === v ? 'var(--cyan-dim)' : 'transparent',
                color: activeTab === v ? 'var(--cyan)' : 'var(--text-muted)',
                border: activeTab === v ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
              }}>{l}</button>
          ))}
        </div>

        {/* ── Contenido ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card p-4">
            {activeTab === 'semanal' && (
              <WeeklyView
                publicaciones={publicaciones}
                weekOffset={weekOffset}
                setWeekOffset={setWeekOffset}
                onDayClick={openNew}
                onEditPub={openEdit}
              />
            )}
            {activeTab === 'calendario' && (
              <CalendarView
                publicaciones={publicaciones}
                month={month}
                year={year}
                onDayClick={openNew}
                onEditPub={openEdit}
              />
            )}
            {activeTab === 'tabla' && (
              <TableView
                publicaciones={publicaciones}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </main>

      <PublicacionModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editData={editData}
        defaultDate={defaultDate}
        onSaved={load}
      />
    </div>
  );
}
