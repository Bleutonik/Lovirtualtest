import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotes, createNote, updateNote, deleteNote } from '../services/notes';

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Notes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data.notes || data || []);
    } catch (error) {
      console.error('Error cargando notas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setNoteForm({ title: '', content: '' });
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setNoteForm({ title: '', content: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;

    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteForm);
      } else {
        await createNote(noteForm);
      }
      closeModal();
      await loadNotes();
    } catch (error) {
      console.error('Error guardando nota:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Estas seguro de eliminar esta nota?')) return;
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (error) {
      console.error('Error eliminando nota:', error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-[#1f2937] rounded-lg transition-colors"
            >
              <ArrowLeftIcon />
            </button>
            <h1 className="text-xl font-bold">Mis Notas</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PlusIcon />
            Nueva Nota
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Lista de notas */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Cargando notas...</div>
        ) : notes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg">No tienes notas</p>
            <p className="text-sm mt-2">Crea una nueva nota para comenzar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-[#1f2937] rounded-xl p-5 border border-[#374151] hover:border-cyan-500/50 transition-colors"
              >
                <h3 className="font-semibold text-lg mb-2 text-white">{note.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {note.content || 'Sin contenido'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">
                    {formatDate(note.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(note)}
                      className="p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1f2937] rounded-xl p-6 w-full max-w-lg border border-[#374151]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titulo
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Titulo de la nota"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contenido
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={6}
                  className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  placeholder="Escribe tu nota aqui..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-[#374151] hover:bg-[#4b5563] text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {editingNote ? 'Guardar Cambios' : 'Crear Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
