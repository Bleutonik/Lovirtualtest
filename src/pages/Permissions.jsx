import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Permissions = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'dia_libre',
    date: '',
    start_time: '',
    end_time: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const data = await api.get('/permissions');
      // Backend returns { success: true, data: { permissions: [...], types: {...} } }
      const perms = data?.data?.permissions || data?.permissions || data?.data || data || [];
      setPermissions(Array.isArray(perms) ? perms : []);
    } catch (error) {
      console.error('Error cargando permisos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason.trim()) {
      setError('Por favor completa la fecha y la razon');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      // Map frontend type to backend type
      const typeMap = {
        dia_libre: 'personal',
        llegada_tarde: 'personal',
        salida_temprana: 'personal',
        vacaciones: 'vacation',
        otro: 'other'
      };

      // Backend expects date_from and date_to
      await api.post('/permissions', {
        type: typeMap[formData.type] || 'personal',
        date_from: formData.date,
        date_to: formData.date, // Same day for single-day requests
        reason: formData.reason
      });
      setFormData({
        type: 'dia_libre',
        date: '',
        start_time: '',
        end_time: '',
        reason: ''
      });
      setSuccess('Permiso solicitado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      await loadPermissions();
    } catch (error) {
      console.error('Error solicitando permiso:', error);
      setError('Error al solicitar el permiso');
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
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || 'Pendiente'}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      dia_libre: 'Dia Libre',
      llegada_tarde: 'Llegada Tarde',
      salida_temprana: 'Salida Temprana',
      vacaciones: 'Vacaciones',
      otro: 'Otro',
      vacation: 'Vacaciones',
      sick_leave: 'Licencia Enfermedad',
      personal: 'Permiso Personal',
      maternity: 'Licencia Maternidad',
      paternity: 'Licencia Paternidad',
      bereavement: 'Licencia Duelo',
      other: 'Otro'
    };
    return labels[type] || type;
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
          <h1 className="text-xl font-bold">Solicitar Permiso</h1>
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
            <CalendarIcon />
            <h2 className="text-lg font-semibold">Nueva Solicitud de Permiso</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Permiso
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="dia_libre">Dia Libre</option>
                <option value="llegada_tarde">Llegada Tarde</option>
                <option value="salida_temprana">Salida Temprana</option>
                <option value="vacaciones">Vacaciones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hora Inicio (opcional)
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hora Fin (opcional)
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Razon
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                placeholder="Describe la razon de tu solicitud..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>

        {/* Lista de permisos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Mis Permisos Solicitados</h2>

          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Cargando permisos...</div>
          ) : permissions.length === 0 ? (
            <div className="text-center text-gray-400 py-8 bg-[#1f2937] rounded-xl border border-[#374151]">
              <p>No has solicitado permisos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-cyan-400 font-medium">
                        {getTypeLabel(permission.type)}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        - {formatDate(permission.date_from || permission.date)}
                        {permission.date_to && permission.date_to !== permission.date_from && ` a ${formatDate(permission.date_to)}`}
                      </span>
                    </div>
                    {getStatusBadge(permission.status)}
                  </div>
                  {(permission.start_time || permission.end_time) && (
                    <p className="text-gray-400 text-sm mb-2">
                      {permission.start_time && `Desde: ${permission.start_time}`}
                      {permission.start_time && permission.end_time && ' - '}
                      {permission.end_time && `Hasta: ${permission.end_time}`}
                    </p>
                  )}
                  <p className="text-white">{permission.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Permissions;
