import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ArrowLeftSmallIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const columns = [
    { id: 'pending', title: 'Por Hacer', color: 'cyan' },
    { id: 'in_progress', title: 'En Progreso', color: 'orange' },
    { id: 'completed', title: 'Completado', color: 'green' }
  ];

  const colorClasses = {
    cyan: {
      border: 'border-cyan-500',
      bg: 'bg-cyan-500',
      text: 'text-cyan-500',
      hover: 'hover:bg-cyan-600'
    },
    orange: {
      border: 'border-orange-500',
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      hover: 'hover:bg-orange-600'
    },
    green: {
      border: 'border-green-500',
      bg: 'bg-green-500',
      text: 'text-green-500',
      hover: 'hover:bg-green-600'
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      const data = res?.data || res || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await api.post('/tasks', {
        title: newTask.title,
        description: newTask.description,
        status: 'pending'
      });
      setNewTask({ title: '', description: '' });
      setShowForm(false);
      await loadTasks();
    } catch (error) {
      console.error('Error creando tarea:', error);
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Error moviendo tarea:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.del(`/tasks/${id}`);
      await loadTasks();
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const TaskCard = ({ task, columnColor }) => {
    const colors = colorClasses[columnColor];
    const columnIndex = columns.findIndex(c => c.id === task.status);
    const canMoveLeft = columnIndex > 0;
    const canMoveRight = columnIndex < columns.length - 1;

    return (
      <div className={`bg-[#111111] rounded-lg p-4 border-l-4 ${colors.border} shadow-lg`}>
        <h4 className="font-semibold text-white mb-2 text-sm">{task.title}</h4>
        {task.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">
            {formatDate(task.createdAt || task.created_at)}
          </span>
          <div className="flex items-center gap-1">
            {canMoveLeft && (
              <button
                onClick={() => handleMoveTask(task.id, columns[columnIndex - 1].id)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1f2937] rounded transition-colors"
                title={`Mover a ${columns[columnIndex - 1].title}`}
              >
                <ArrowLeftSmallIcon />
              </button>
            )}
            {canMoveRight && (
              <button
                onClick={() => handleMoveTask(task.id, columns[columnIndex + 1].id)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1f2937] rounded transition-colors"
                title={`Mover a ${columns[columnIndex + 1].title}`}
              >
                <ArrowRightIcon />
              </button>
            )}
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              title="Eliminar tarea"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Column = ({ column }) => {
    const columnTasks = getTasksByStatus(column.id);
    const colors = colorClasses[column.color];

    return (
      <div className="bg-[#1f2937] rounded-xl border border-[#374151] flex flex-col h-full min-h-[500px]">
        <div className={`p-4 border-b border-[#374151] flex items-center gap-3`}>
          <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
          <h3 className="font-semibold text-white">{column.title}</h3>
          <span className="ml-auto bg-[#111111] text-gray-400 px-2 py-0.5 rounded-full text-xs">
            {columnTasks.length}
          </span>
        </div>
        <div className="p-3 flex-1 overflow-y-auto space-y-3">
          {columnTasks.length === 0 ? (
            <p className="text-gray-500 text-center text-sm py-8">Sin tareas</p>
          ) : (
            columnTasks.map(task => (
              <TaskCard key={task.id} task={task} columnColor={column.color} />
            ))
          )}
        </div>
      </div>
    );
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
            <h1 className="text-xl font-bold">Mis Tareas</h1>
            {user && (
              <span className="text-gray-400 text-sm">- {user.name || user.username}</span>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PlusIcon />
            Nueva Tarea
          </button>
        </div>
      </header>

      {/* Modal para agregar tarea */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f2937] rounded-xl border border-[#374151] w-full max-w-md">
            <div className="p-4 border-b border-[#374151]">
              <h2 className="text-lg font-semibold">Nueva Tarea</h2>
            </div>
            <form onSubmit={handleAddTask} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titulo</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Titulo de la tarea..."
                  className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Descripcion</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descripcion (opcional)..."
                  rows={3}
                  className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNewTask({ title: '', description: '' });
                  }}
                  className="flex-1 bg-[#374151] hover:bg-[#4b5563] text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tablero Trello */}
      <main className="p-6">
        {isLoading ? (
          <div className="text-center text-gray-400 py-16">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Cargando tareas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(column => (
              <Column key={column.id} column={column} />
            ))}
          </div>
        )}

        {/* Resumen */}
        {!isLoading && tasks.length > 0 && (
          <div className="mt-8 flex justify-center gap-8 text-sm">
            <span className="text-cyan-500">
              {getTasksByStatus('pending').length} pendientes
            </span>
            <span className="text-orange-500">
              {getTasksByStatus('in_progress').length} en progreso
            </span>
            <span className="text-green-500">
              {getTasksByStatus('completed').length} completadas
            </span>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;
