import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const Incidents = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'tecnico',
    title: '',
    description: '',
    priority: 'media'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const data = await api.get('/incidents');
      // Backend returns { success: true, data: [...] }
      const incidents = data?.data || data?.incidents || data || [];
      setIncidents(Array.isArray(incidents) ? incidents : []);
    } catch (error) {
      console.error('Error cargando incidentes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Por favor completa el titulo y la descripcion');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      // Map frontend values to backend expected values
      const categoryMap = { tecnico: 'technical', sistema: 'general', otro: 'other' };
      const priorityMap = { baja: 'low', media: 'medium', alta: 'high' };

      await api.post('/incidents', {
        title: formData.title,
        description: formData.description,
        category: categoryMap[formData.type] || 'general',
        priority: priorityMap[formData.priority] || 'medium'
      });
      setFormData({ type: 'tecnico', title: '', description: '', priority: 'media' });
      setSuccess('Incidente reportado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      await loadIncidents();
    } catch (error) {
      console.error('Error reportando incidente:', error);
      setError('Error al reportar el incidente');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmitting(false);
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

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-yellow-500/20 text-yellow-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      in_review: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-green-500/20 text-green-400',
      closed: 'bg-gray-500/20 text-gray-400'
    };
    const labels = {
      open: 'Abierto',
      pending: 'Pendiente',
      in_review: 'En revision',
      resolved: 'Resuelto',
      closed: 'Cerrado'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
        {labels[status] || 'Abierto'}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      tecnico: 'Tecnico',
      sistema: 'Sistema',
      otro: 'Otro',
      technical: 'Tecnico',
      general: 'General',
      hr: 'Recursos Humanos',
      safety: 'Seguridad',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      baja: 'bg-gray-500/20 text-gray-400',
      media: 'bg-yellow-500/20 text-yellow-400',
      alta: 'bg-red-500/20 text-red-400',
      low: 'bg-gray-500/20 text-gray-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-red-500/20 text-red-400',
      critical: 'bg-red-600/30 text-red-300'
    };
    const labels = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Critica'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.medium}`}>
        {labels[priority] || 'Media'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-[#1f2937] rounded-lg transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="text-xl font-bold">Reportar Incidente</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Mensaje de exito */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151] mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertIcon />
            <h2 className="text-lg font-semibold">Nuevo Incidente</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Incidente
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="tecnico">Tecnico</option>
                <option value="sistema">Sistema</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titulo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Titulo del incidente..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripcion
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                placeholder="Describe el incidente detalladamente..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Incidente'}
            </button>
          </form>
        </div>

        {/* Lista de incidentes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Mis Incidentes Reportados</h2>

          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Cargando incidentes...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center text-gray-400 py-8 bg-[#1f2937] rounded-xl border border-[#374151]">
              <p>No has reportado incidentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">
                        {getTypeLabel(incident.type)}
                      </span>
                      {getPriorityBadge(incident.priority)}
                    </div>
                    {getStatusBadge(incident.status)}
                  </div>
                  {incident.title && (
                    <h3 className="text-white font-medium mb-2">{incident.title}</h3>
                  )}
                  <p className="text-gray-300 mb-3">{incident.description}</p>
                  <span className="text-gray-500 text-xs">
                    {formatDate(incident.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Incidents;
