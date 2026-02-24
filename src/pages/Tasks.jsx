import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import * as api from '../services/api';

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const columns = [
    { id: 'pending',     accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   dot: '#06b6d4' },
    { id: 'in_progress', accent: '#f97316', bg: 'rgba(249,115,22,0.08)',  dot: '#f97316' },
    { id: 'completed',   accent: '#22c55e', bg: 'rgba(34,197,94,0.08)',   dot: '#22c55e' },
  ];

  const colTitle = (id) => {
    if (id === 'pending')     return t('tasks.todo');
    if (id === 'in_progress') return t('tasks.inProgress');
    if (id === 'completed')   return t('tasks.done');
    return id;
  };

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(Array.isArray(res?.data || res) ? (res?.data || res) : []);
    } catch { setTasks([]); } finally { setIsLoading(false); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await api.post('/tasks', { title: newTask.title, description: newTask.description, status: 'pending' });
      setNewTask({ title: '', description: '' });
      setShowForm(false);
      await loadTasks();
    } catch {}
  };

  const moveTask = async (taskId, newStatus) => {
    try { await api.put(`/tasks/${taskId}`, { status: newStatus }); await loadTasks(); } catch {}
  };

  const deleteTask = async (id) => {
    try { await api.del(`/tasks/${id}`); await loadTasks(); } catch {}
  };

  const byStatus = (s) => tasks.filter(t => t.status === s);
  const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header className="page-header">
        <div className="px-5 py-3.5 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <img src="http://www.lovirtual.com/wp-content/uploads/2023/09/cropped-LOGO-LOVIRTUAL-SIN-FONDO-1.png" alt="LoVirtual" className="lv-logo" />
            <div>
              <h1 className="font-bold">{t('tasks.title')}</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.username}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('tasks.new')}
          </button>
        </div>
      </header>

      {/* Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{t('tasks.new')}</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('tasks.titleField')}</label>
                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="field" placeholder={t('tasks.titlePlaceholder')} autoFocus required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('tasks.description')} <span style={{ color: 'var(--text-dim)' }}>{t('common.optional')}</span></label>
                <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                  rows={3} className="field resize-none" placeholder={t('tasks.descPlaceholder')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost flex-1">{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary flex-1">{t('tasks.creating')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tablero */}
      <main className="p-5 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-4 space-y-3">
                <div className="skeleton h-4 w-28" />
                {[1,2].map(j => <div key={j} className="skeleton h-20 w-full rounded-xl" />)}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns.map(col => {
                const colTasks = byStatus(col.id);
                return (
                  <div key={col.id} className="card flex flex-col" style={{ minHeight: '420px' }}>
                    {/* Column header */}
                    <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.accent, boxShadow: `0 0 6px ${col.accent}60` }} />
                      <span className="font-semibold text-sm">{colTitle(col.id)}</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="p-3 flex-1 space-y-2 overflow-y-auto">
                      {colTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ background: col.bg, border: `1px solid ${col.accent}25` }}>
                            <svg className="w-4 h-4" style={{ color: col.accent, opacity: .6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{t('tasks.empty')}</p>
                        </div>
                      ) : colTasks.map(task => {
                        const ci = columns.findIndex(c => c.id === task.status);
                        return (
                          <div key={task.id} className="rounded-xl p-3.5 group animate-fade-up"
                            style={{ background: 'var(--surface-2)', border: `1px solid var(--border)`, borderLeft: `3px solid ${col.accent}` }}>
                            <h4 className="font-semibold text-sm leading-snug mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{fmtDate(task.createdAt || task.created_at)}</span>
                              <div className="flex items-center gap-1">
                                {ci > 0 && (
                                  <button onClick={() => moveTask(task.id, columns[ci-1].id)}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5"
                                    style={{ color: 'var(--text-muted)' }} title={t('tasks.moveLeft')}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                )}
                                {ci < columns.length - 1 && (
                                  <button onClick={() => moveTask(task.id, columns[ci+1].id)}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5"
                                    style={{ color: 'var(--text-muted)' }} title={t('tasks.moveRight')}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                )}
                                <button onClick={() => deleteTask(task.id)}
                                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                                  style={{ color: 'var(--text-muted)' }}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {tasks.length > 0 && (
              <div className="flex justify-center gap-6 mt-6">
                {columns.map(col => (
                  <div key={col.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
                    <span>{byStatus(col.id).length} {colTitle(col.id).toLowerCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Tasks;
