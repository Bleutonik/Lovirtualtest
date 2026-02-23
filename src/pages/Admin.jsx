import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

// Iconos
const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', role: '' });

  // Estados para permisos
  const [permissions, setPermissions] = useState([]);

  // Estados para incidentes
  const [incidents, setIncidents] = useState([]);

  // Estados para reportes
  const [attendance, setAttendance] = useState([]);
  const [breaks, setBreaks] = useState([]);

  // Estados para monitoreo de actividad
  const [activityStatus, setActivityStatus] = useState([]);
  const [activitySummary, setActivitySummary] = useState({ active: 0, idle: 0, afk: 0, offline: 0 });

  // Verificar rol de admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();

    // Actualizar actividad cada 30 segundos
    const activityInterval = setInterval(() => {
      loadActivity();
    }, 30000);

    return () => clearInterval(activityInterval);
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadPermissions(),
        loadIncidents(),
        loadAttendance(),
        loadBreaks(),
        loadActivity()
      ]);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const data = await api.get('/attendance/all');
      const att = data?.data?.attendance || data?.attendance || [];
      setAttendance(Array.isArray(att) ? att : []);
    } catch (err) {
      console.error('Error cargando asistencia:', err);
    }
  };

  const loadBreaks = async () => {
    try {
      const data = await api.get('/breaks/all');
      const brks = data?.data?.breaks || data?.breaks || [];
      setBreaks(Array.isArray(brks) ? brks : []);
    } catch (err) {
      console.error('Error cargando breaks:', err);
    }
  };

  const loadActivity = async () => {
    try {
      const data = await api.get('/activity/status');
      const statuses = data?.data?.statuses || [];
      const summary = data?.data?.summary || { active: 0, idle: 0, afk: 0, offline: 0 };
      setActivityStatus(Array.isArray(statuses) ? statuses : []);
      setActivitySummary(summary);
    } catch (err) {
      console.error('Error cargando actividad:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.get('/users');
      // Backend returns { success: true, data: { users: [...] } }
      const users = data?.data?.users || data?.users || data?.data || [];
      setUsers(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await api.get('/permissions/all');
      // Backend returns { success: true, data: { permissions: [...], types: {...} } }
      const perms = data?.data?.permissions || data?.permissions || data?.data || [];
      setPermissions(Array.isArray(perms) ? perms : []);
    } catch (err) {
      console.error('Error cargando permisos:', err);
    }
  };

  const loadIncidents = async () => {
    try {
      const data = await api.get('/incidents');
      // Backend returns { success: true, data: [...] }
      const incidents = data?.data || data?.incidents || data || [];
      setIncidents(Array.isArray(incidents) ? incidents : []);
    } catch (err) {
      console.error('Error cargando incidentes:', err);
    }
  };

  // Funciones de usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.password.trim()) {
      setError('Usuario y contrasena son obligatorios');
      return;
    }

    setIsCreatingUser(true);
    setError('');
    try {
      await api.post('/users', {
        username: userForm.username,
        email: userForm.email || null,
        password: userForm.password,
        role: 'employee'
      });
      setSuccess('Usuario creado exitosamente');
      setUserForm({ username: '', email: '', password: '' });
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Editar usuario
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({ email: user.email || '', role: user.role });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setSuccess('Usuario actualizado');
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar usuario');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (user) => {
    if (user.role === 'admin') {
      setError('No puedes eliminar un administrador');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!confirm(`¿Estas seguro de eliminar a ${user.username}?`)) return;

    try {
      await api.del(`/users/${user.id}`);
      setSuccess('Usuario eliminado');
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al eliminar usuario');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Funciones de permisos
  const handleApprovePermission = async (id) => {
    try {
      await api.put(`/permissions/${id}/approve`);
      setSuccess('Permiso aprobado');
      await loadPermissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al aprobar permiso');
    }
  };

  const handleRejectPermission = async (id) => {
    try {
      await api.put(`/permissions/${id}/reject`);
      setSuccess('Permiso rechazado');
      await loadPermissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al rechazar permiso');
    }
  };

  // Funciones de incidentes
  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      await api.put(`/incidents/${id}/status`, { status });
      setSuccess(`Incidente marcado como ${status === 'in_review' ? 'en revision' : 'resuelto'}`);
      await loadIncidents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar incidente');
    }
  };

  // Utilidades de formato
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPermissionTypeLabel = (type) => {
    const labels = {
      personal: 'Personal',
      medical: 'Medico',
      vacation: 'Vacaciones',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  const getIncidentTypeLabel = (type) => {
    const labels = {
      technical: 'Tecnico',
      connectivity: 'Conectividad',
      schedule: 'Horario',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status, type = 'permission') => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      in_review: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-green-500/20 text-green-400'
    };
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      in_review: 'En Revision',
      resolved: 'Resuelto'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || 'Pendiente'}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-500/20 text-gray-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-orange-500/20 text-orange-400',
      critical: 'bg-red-500/20 text-red-400'
    };
    const labels = {
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

  // Filtrar permisos pendientes
  const pendingPermissions = permissions.filter(p => p.status === 'pending');

  const tabs = [
    { id: 'activity', label: 'Actividad', icon: <EyeIcon />, count: activitySummary.afk, highlight: activitySummary.afk > 0 },
    { id: 'reports', label: 'Reportes Hoy', icon: <ClockIcon />, count: attendance.length },
    { id: 'users', label: 'Crear Usuario', icon: <UsersIcon /> },
    { id: 'permissions', label: 'Permisos', icon: <ShieldIcon />, count: pendingPermissions.length },
    { id: 'incidents', label: 'Incidentes', icon: <AlertIcon />, count: incidents.filter(i => i.status === 'open' || i.status === 'pending').length }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando panel de administracion...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Panel de Administracion</h1>
        </div>
      </header>

      {/* Mensajes */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
            <button onClick={() => setError('')} className="float-right">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex gap-2 border-b border-gray-800 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : tab.highlight
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 animate-pulse'
                  : 'bg-[#1f2937] text-gray-300 hover:bg-[#374151]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-white text-xs px-2 py-0.5 rounded-full ${
                  tab.highlight ? 'bg-red-600' : 'bg-red-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-6 pb-8">
        {/* Tab: Actividad/AFK */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Resumen de actividad */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{activitySummary.active}</p>
                <p className="text-sm text-gray-400">Activos</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{activitySummary.idle}</p>
                <p className="text-sm text-gray-400">Inactivos</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{activitySummary.afk}</p>
                <p className="text-sm text-gray-400">AFK</p>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-400">{activitySummary.offline}</p>
                <p className="text-sm text-gray-400">Desconectados</p>
              </div>
            </div>

            {/* Lista de empleados */}
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <EyeIcon />
                  <h2 className="text-lg font-semibold">Monitoreo en Tiempo Real</h2>
                </div>
                <button
                  onClick={loadActivity}
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </button>
              </div>

              {activityStatus.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay empleados conectados</p>
              ) : (
                <div className="space-y-3">
                  {activityStatus.map((emp) => (
                    <div
                      key={emp.userId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        emp.status === 'afk'
                          ? 'bg-red-500/10 border-red-500/30'
                          : emp.status === 'idle'
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : emp.status === 'active'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-gray-500/10 border-gray-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          emp.status === 'afk'
                            ? 'bg-red-500 animate-pulse'
                            : emp.status === 'idle'
                            ? 'bg-yellow-500'
                            : emp.status === 'active'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="text-white font-medium">{emp.username}</p>
                          <p className="text-sm text-gray-400">
                            {emp.status === 'offline' && emp.lastSeen
                              ? `Ultima vez: ${new Date(emp.lastSeen).toLocaleTimeString()}`
                              : emp.lastActivity
                              ? `Ultima actividad: ${new Date(emp.lastActivity).toLocaleTimeString()}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          emp.status === 'afk'
                            ? 'bg-red-500/20 text-red-400'
                            : emp.status === 'idle'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : emp.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {emp.statusLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4 text-center">
                Se actualiza automaticamente cada 30 segundos
              </p>
            </div>
          </div>
        )}

        {/* Tab: Reportes */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Asistencia de Hoy */}
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <div className="flex items-center gap-3 mb-6">
                <ClockIcon />
                <h2 className="text-lg font-semibold">Asistencia de Hoy</h2>
                <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm">
                  {attendance.length} empleados
                </span>
              </div>

              {attendance.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay registros de asistencia hoy</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#374151]">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Empleado</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Entrada</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Salida</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Horas</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((att) => (
                        <tr key={att.id} className="border-b border-[#374151]/50 hover:bg-[#374151]/20">
                          <td className="py-3 px-4 text-white font-medium">{att.username}</td>
                          <td className="py-3 px-4 text-cyan-400">
                            {att.clock_in ? new Date(att.clock_in).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-orange-400">
                            {att.clock_out ? new Date(att.clock_out).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' }) : 'Activo'}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {att.total_hours ? `${att.total_hours.toFixed(1)}h` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              att.clock_out ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {att.clock_out ? 'Finalizado' : 'En linea'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Breaks de Hoy */}
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold">Breaks de Hoy</h2>
                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                  {breaks.length} breaks
                </span>
              </div>

              {breaks.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay breaks registrados hoy</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#374151]">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Empleado</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Inicio</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Fin</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Duracion</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaks.map((brk) => (
                        <tr key={brk.id} className="border-b border-[#374151]/50 hover:bg-[#374151]/20">
                          <td className="py-3 px-4 text-white font-medium">{brk.username}</td>
                          <td className="py-3 px-4 text-cyan-400">{brk.break_type_name || brk.type}</td>
                          <td className="py-3 px-4 text-gray-300">
                            {brk.start_time ? new Date(brk.start_time).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {brk.end_time ? new Date(brk.end_time).toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {brk.duration_minutes ? `${brk.duration_minutes} min` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              brk.end_time ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {brk.end_time ? 'Completado' : 'En break'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Crear Usuario */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Formulario de creacion */}
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <div className="flex items-center gap-3 mb-6">
                <UsersIcon />
                <h2 className="text-lg font-semibold">Crear Nuevo Usuario</h2>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="usuario123"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Correo Electronico (opcional)
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="usuario@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="********"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </form>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151]">
              <h2 className="text-lg font-semibold mb-4">Usuarios Existentes</h2>
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay usuarios registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#374151]">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Usuario</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Rol</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Creado</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-[#374151]/50 hover:bg-[#374151]/20">
                          <td className="py-3 px-4 text-white font-medium">{user.username}</td>
                          <td className="py-3 px-4 text-gray-300">{user.email || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : 'Empleado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{formatDate(user.created_at)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded transition-colors"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal de Edicion */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-[#1f2937] rounded-xl p-6 border border-[#374151] w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Editar Usuario: {editingUser.username}</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Rol
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full bg-[#111111] border border-[#374151] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="employee">Empleado</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Permisos */}
        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <ShieldIcon />
              <h2 className="text-lg font-semibold">Solicitudes de Permisos Pendientes</h2>
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                {pendingPermissions.length} pendientes
              </span>
            </div>

            {pendingPermissions.length === 0 ? (
              <div className="bg-[#1f2937] rounded-xl p-8 border border-[#374151] text-center">
                <ShieldIcon />
                <p className="text-gray-400 mt-4">No hay solicitudes de permisos pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">
                            {permission.username || permission.user?.username || 'Usuario'}
                          </span>
                          <span className="text-cyan-400 text-sm">
                            {getPermissionTypeLabel(permission.type)}
                          </span>
                          {getStatusBadge(permission.status)}
                        </div>
                        <p className="text-gray-300 mb-2">{permission.reason}</p>
                        <p className="text-gray-500 text-sm">
                          Fecha: {formatDate(permission.date_from || permission.date)}
                          {permission.date_to && permission.date_to !== permission.date_from && ` - ${formatDate(permission.date_to)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovePermission(permission.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <CheckIcon />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRejectPermission(permission.id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <XIcon />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Historial de permisos */}
            {permissions.filter(p => p.status !== 'pending').length > 0 && (
              <div className="mt-8">
                <h3 className="text-md font-semibold text-gray-400 mb-4">Historial de Permisos</h3>
                <div className="space-y-2">
                  {permissions.filter(p => p.status !== 'pending').map((permission) => (
                    <div
                      key={permission.id}
                      className="bg-[#1f2937]/50 rounded-lg p-4 border border-[#374151]/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">
                            {permission.username || permission.user?.username || 'Usuario'}
                          </span>
                          <span className="text-gray-400 text-sm ml-2">
                            - {getPermissionTypeLabel(permission.type)}
                          </span>
                        </div>
                        {getStatusBadge(permission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Incidentes */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertIcon />
              <h2 className="text-lg font-semibold">Incidentes Reportados</h2>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                {incidents.filter(i => i.status === 'open' || i.status === 'pending').length} pendientes
              </span>
            </div>

            {incidents.length === 0 ? (
              <div className="bg-[#1f2937] rounded-xl p-8 border border-[#374151] text-center">
                <AlertIcon />
                <p className="text-gray-400 mt-4">No hay incidentes reportados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-white font-medium">
                            {incident.username || incident.user?.username || 'Usuario'}
                          </span>
                          <span className="text-cyan-400 text-sm">
                            {getIncidentTypeLabel(incident.type)}
                          </span>
                          {getStatusBadge(incident.status, 'incident')}
                          {incident.priority && getPriorityBadge(incident.priority)}
                        </div>
                        {incident.title && (
                          <h3 className="text-white font-semibold mb-1">{incident.title}</h3>
                        )}
                        <p className="text-gray-300 mb-2">{incident.description}</p>
                        <p className="text-gray-500 text-sm">
                          Reportado: {formatDate(incident.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(incident.status === 'open' || incident.status === 'pending') && (
                          <button
                            onClick={() => handleUpdateIncidentStatus(incident.id, 'in_review')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            En Revision
                          </button>
                        )}
                        {incident.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateIncidentStatus(incident.id, 'resolved')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            <CheckIcon />
                            Resuelto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
