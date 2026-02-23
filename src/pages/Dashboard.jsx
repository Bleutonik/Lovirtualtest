import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import ActivityTracker from '../components/ActivityTracker';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [breaks, setBreaks] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [breakTimer, setBreakTimer] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer para break activo
  useEffect(() => {
    let interval;
    if (activeBreak) {
      interval = setInterval(() => {
        const start = new Date(activeBreak.start_time);
        const now = new Date();
        setBreakTimer(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBreak]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const attRes = await api.get('/attendance/today');
      const att = attRes?.data?.attendance || attRes?.attendance || attRes?.data || null;
      if (att) {
        setAttendance(att);
        setIsClockedIn(att.clock_in && !att.clock_out);
      }
    } catch (e) {
      console.log('No hay asistencia hoy');
    }

    try {
      const breaksRes = await api.get('/breaks/today');
      const brks = breaksRes?.data?.breaks || breaksRes?.breaks || breaksRes?.data || [];
      setBreaks(Array.isArray(brks) ? brks : []);
      const active = (Array.isArray(brks) ? brks : []).find(b => b.start_time && !b.end_time);
      setActiveBreak(active || null);
    } catch (e) {
      console.log('Error cargando breaks');
    }

    try {
      const annRes = await api.get('/announcements');
      const anns = annRes?.data?.announcements || annRes?.announcements || annRes?.data || [];
      setAnnouncements(Array.isArray(anns) ? anns : []);
    } catch (e) {
      console.log('Error cargando anuncios');
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/clock-in', {});
      await loadData();
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/clock-out', {});
      await loadData();
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleStartBreak = async (type) => {
    if (!isClockedIn || activeBreak) return;
    setLoading(true);
    try {
      await api.post('/breaks/start', { type });
      await loadData();
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleEndBreak = async () => {
    if (!activeBreak) return;
    setLoading(true);
    try {
      await api.post('/breaks/end', { breakId: activeBreak.id });
      setActiveBreak(null);
      setBreakTimer(0);
      await loadData();
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const formatTime = (date) => date.toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formatDate = (date) => date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTimer = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  const getBreakStatus = (type) => {
    const brk = breaks.find(b => b.type === type);
    if (brk?.end_time) return 'done';
    if (brk && !brk.end_time) return 'active';
    return 'pending';
  };

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return `Hace ${diff} días`;
  };

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Tareas', path: '/tasks' },
    { name: 'Incidentes', path: '/incidents' },
    { name: 'Permisos', path: '/permissions' },
    { name: 'Chat', path: '/chat' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Rastreador de actividad AFK */}
      <ActivityTracker />

      {/* Header */}
      <header className="bg-[#111111] border-b border-[#374151] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <img
              src="/logo.png"
              alt="LoVirtual"
              className="h-8 w-auto"
              style={{ filter: 'invert(1) brightness(1.2)' }}
            />
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className={`px-3 py-2 text-sm rounded transition-all ${item.name === 'Admin' ? 'text-yellow-400 hover:bg-yellow-900/30' : 'text-gray-300 hover:text-cyan-400 hover:bg-[#1f2937]'}`}>
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm text-gray-400">{user?.username}</span>
                {user?.role === 'admin' && <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">Admin</span>}
              </div>
              <button onClick={logout} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-sm transition-all">
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Banner con Logo */}
        <div className="relative bg-gradient-to-r from-[#1f2937] to-[#111111] rounded-xl p-8 mb-6 overflow-hidden border border-[#374151]">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(8,145,178,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
          <div className="relative flex items-center gap-4">
            <img
              src="/logo.png"
              alt="LoVirtual"
              className="h-16 w-auto"
              style={{ filter: 'invert(1) brightness(1.2)' }}
            />
          </div>
        </div>

        {/* Reloj */}
        <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151] mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cyan-600/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Hora PR</p>
              <p className="text-4xl font-bold">{formatTime(currentTime)}</p>
              <p className="text-gray-400 capitalize">{formatDate(currentTime)}</p>
            </div>
          </div>
        </div>

        {/* Bienvenida */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">¡Bienvenido, {user?.username}! 👋</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isClockedIn ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {isClockedIn ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Grid Control */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Clock In/Out */}
          <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Control de Asistencia</p>
                <p className="text-gray-500 text-xs">Registra entrada y salida</p>
              </div>
            </div>
            {!isClockedIn ? (
              <button onClick={handleClockIn} disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white py-3 rounded-lg font-medium transition-all">
                {loading ? 'Procesando...' : '▶ Clock In - Entrada'}
              </button>
            ) : (
              <button onClick={handleClockOut} disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-medium transition-all">
                {loading ? 'Procesando...' : '⏹ Clock Out - Salida'}
              </button>
            )}
            {attendance?.clock_in && (
              <p className="text-xs text-gray-500 mt-2 text-center">Entrada: {new Date(attendance.clock_in).toLocaleTimeString()}</p>
            )}
          </div>

          {/* Breaks */}
          <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Breaks</p>
                {activeBreak && <p className="text-orange-400 text-xs">En break: {formatTimer(breakTimer)}</p>}
              </div>
            </div>

            {activeBreak ? (
              <button onClick={handleEndBreak} disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm mb-2">
                Terminar Break ({formatTimer(breakTimer)})
              </button>
            ) : (
              <div className="space-y-2">
                {[{ type: 'break_am', label: 'Break AM', time: '10 min' },
                  { type: 'lunch', label: 'Almuerzo', time: '60 min' },
                  { type: 'break_pm', label: 'Break PM', time: '10 min' }].map(({ type, label, time }) => {
                  const status = getBreakStatus(type);
                  return (
                    <button key={type} onClick={() => handleStartBreak(type)}
                      disabled={!isClockedIn || status !== 'pending' || loading}
                      className={`w-full py-2 px-3 rounded-lg text-sm flex justify-between items-center transition-all
                        ${status === 'done' ? 'bg-green-900/30 text-green-400' : status === 'active' ? 'bg-orange-900/30 text-orange-400' : 'bg-[#111111] hover:bg-[#374151] text-gray-400'}
                        ${(!isClockedIn || status !== 'pending') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span>{label} ({time})</span>
                      {status === 'done' && <span className="text-xs">✓</span>}
                      {status === 'active' && <span className="text-xs">⏱</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conexión */}
          <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Conexión</p>
                <p className="text-gray-500 text-xs">Estado de red</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Conectado</span>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button onClick={() => navigate('/incidents')} className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] hover:border-cyan-600 rounded-xl p-4 text-left transition-all flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Reportar Incidencia</span>
          </button>
          <button onClick={() => navigate('/permissions')} className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] hover:border-cyan-600 rounded-xl p-4 text-left transition-all flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Solicitar Permiso</span>
          </button>
        </div>

        {/* Chat y Tareas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button onClick={() => navigate('/chat')} className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] hover:border-cyan-600 rounded-xl p-4 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="text-left">
                <p className="font-medium">Chat Interno</p>
                <p className="text-gray-500 text-xs">Mensajes del equipo</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button onClick={() => navigate('/tasks')} className="bg-[#1f2937] hover:bg-[#374151] border border-[#374151] hover:border-cyan-600 rounded-xl p-4 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div className="text-left">
                <p className="font-medium">Mis Tareas</p>
                <p className="text-gray-500 text-xs">Tablero estilo Trello</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Anuncios */}
        <div className="bg-[#1f2937] rounded-xl p-5 border border-[#374151]">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Anuncios Recientes
          </h4>
          {(announcements.length > 0 ? announcements : [{ title: '¡Bienvenidos!', content: 'Bienvenidos a LoVirtual! Gracias por ser parte de esta gran familia.', created_at: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString() }]).map((ann, i) => (
            <div key={i} className="bg-[#111111] p-4 rounded-lg border border-[#374151] mb-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h5 className="font-bold">{ann.title}</h5>
                  <p className="text-gray-400 text-sm">{ann.content}</p>
                  <p className="text-gray-500 text-xs mt-2">{getTimeAgo(ann.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
