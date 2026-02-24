import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getNotes, createNote, updateNote, deleteNote } from '../services/notes';

const NOTE_COLORS = [
  { bg: 'rgba(6,182,212,0.07)',   border: 'rgba(6,182,212,0.18)',   dot: '#06b6d4' },
  { bg: 'rgba(129,140,248,0.07)', border: 'rgba(129,140,248,0.18)', dot: '#818cf8' },
  { bg: 'rgba(249,115,22,0.07)',  border: 'rgba(249,115,22,0.18)',  dot: '#f97316' },
  { bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.18)',   dot: '#22c55e' },
  { bg: 'rgba(234,179,8,0.07)',   border: 'rgba(234,179,8,0.18)',   dot: '#eab308' },
  { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.18)',   dot: '#ef4444' },
];

const Notes = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data.notes || data || []);
    } catch {} finally { setIsLoading(false); }
  };

  const openCreate = () => { setEditingNote(null); setNoteForm({ title: '', content: '' }); setShowModal(true); };
  const openEdit = (n) => { setEditingNote(n); setNoteForm({ title: n.title, content: n.content }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingNote(null); setNoteForm({ title: '', content: '' }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;
    try {
      if (editingNote) await updateNote(editingNote.id, noteForm);
      else await createNote(noteForm);
      closeModal();
      await loadNotes();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('notes.deleteConfirm'))) return;
    try { await deleteNote(id); await loadNotes(); } catch {}
  };

  const fmtDate = (ds) => new Date(ds).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const getColor = (id) => NOTE_COLORS[(id || 0) % NOTE_COLORS.length];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      <header className="page-header">
        <div className="px-5 py-3.5 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold">{t('notes.title')}</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{notes.length} {t('notes.saved')}</p>
            </div>
          </div>
          <button onClick={openCreate} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('notes.new')}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.15)' }}>
              <svg className="w-7 h-7" style={{ color: '#06b6d4', opacity: .7 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>{t('notes.empty')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{t('notes.emptyDesc')}</p>
            <button onClick={openCreate} className="btn btn-primary mt-5 text-sm">{t('notes.createFirst')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {notes.map((note) => {
              const c = getColor(note.id);
              return (
                <div key={note.id} className="rounded-2xl p-5 group animate-fade-up flex flex-col" style={{ background: c.bg, border: `1px solid ${c.border}`, minHeight: '160px' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                      <h3 className="font-semibold text-sm leading-snug">{note.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <button onClick={() => openEdit(note)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed flex-1 line-clamp-4" style={{ color: 'var(--text-muted)' }}>
                    {note.content || t('notes.noContent')}
                  </p>
                  <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>{fmtDate(note.created_at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal p-6" style={{ maxWidth: '520px' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{editingNote ? t('notes.editTitle') : t('notes.new')}</h2>
              <button onClick={closeModal} className="btn btn-ghost p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('notes.titleField')}</label>
                <input type="text" value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                  className="field" placeholder={t('notes.titlePlaceholder')} required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('notes.content')}</label>
                <textarea value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                  rows={7} className="field resize-none" placeholder={t('notes.contentPlaceholder')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn btn-ghost flex-1">{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary flex-1">{editingNote ? t('common.save') : t('notes.new')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
