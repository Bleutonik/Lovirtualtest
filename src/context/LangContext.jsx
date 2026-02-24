import { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    common: {
      save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar',
      create: 'Crear', loading: 'Cargando...', sending: 'Enviando...',
      search: 'Buscar', actions: 'Acciones', optional: '(opcional)',
      today: 'Hoy', yesterday: 'Ayer', daysAgo: 'Hace {d} días',
      profile: 'Perfil', back: 'Atrás', refresh: 'Actualizar'
    },
    nav: {
      home: 'Inicio', tasks: 'Tareas', notes: 'Notas', incidents: 'Incidentes',
      permissions: 'Permisos', chat: 'Chat', panel: 'Panel'
    },
    login: {
      subtitle: 'Ingresa tus credenciales para continuar',
      username: 'Usuario', userPlaceholder: 'tu_usuario',
      password: 'Contraseña', submit: 'Iniciar Sesión', submitting: 'Ingresando...',
      error: 'Usuario o contraseña incorrectos'
    },
    dashboard: {
      timeLabel: 'HORA ACTUAL · PUERTO RICO', greeting: 'Hola',
      online: 'En línea', offline: 'Desconectado', entry: 'Entrada:',
      attendance: 'Asistencia', attendanceDesc: 'Registra entrada y salida',
      clockIn: '▶  Clock In — Entrada', clockOut: '⏹  Clock Out — Salida',
      processing: 'Procesando...', breaks: 'Breaks', breakDesc: 'Gestión de descansos',
      activeBreak: 'En break', breakAm: 'Break AM', lunch: 'Almuerzo', breakPm: 'Break PM',
      endBreak: 'Terminar Break', connection: 'Conexión', netStatus: 'Estado de red',
      connected: 'Conectado', sessionAs: 'Sesión activa como',
      quickAccess: 'ACCESO RÁPIDO', announcements: 'ANUNCIOS RECIENTES',
      reportIssue: 'Reportar un problema', requestPermission: 'Solicitar permiso',
      privateMessages: 'Mensajes privados', kanban: 'Tablero kanban'
    },
    admin: {
      title: 'Panel de Administración', subtitle: 'Control total del sistema',
      groupSubtitle: 'Vista de tu grupo',
      leaderBadge: 'Líder Grupo',
      tabs: { activity: 'Actividad', reports: 'Reportes', users: 'Usuarios', permissions: 'Permisos', incidents: 'Incidentes', announcements: 'Anuncios' },
      active: 'Activos', inactive: 'Inactivos', afk: 'AFK', disconnected: 'Desconectados',
      realtime: 'Monitoreo en Tiempo Real', noEmployees: 'No hay empleados conectados',
      lastSeen: 'Última vez:', lastActivity: 'Actividad:',
      autoUpdate: 'Actualización automática cada 30 segundos',
      todayAttendance: 'Asistencia de Hoy', noAttendance: 'Sin registros hoy',
      employee: 'Empleado', entry: 'Entrada', exit: 'Salida', hours: 'Horas',
      status: 'Estado', activeStatus: 'Activo', finished: 'Finalizado', online: 'En línea',
      todayBreaks: 'Breaks de Hoy', noBreaks: 'Sin breaks registrados hoy',
      type: 'Tipo', start: 'Inicio', end: 'Fin', duration: 'Duración',
      completed: 'Completado', onBreak: 'En break',
      createEmployee: 'Crear Nuevo Empleado', firstName: 'Nombre', lastName: 'Apellido',
      client: 'Cliente que atiende', username: 'Nombre de usuario', email: 'Email',
      password: 'Contraseña', group: 'Grupo', noGroup: 'Sin grupo', role: 'Rol',
      employeeRole: 'Empleado', leaderRole: 'Líder de Grupo',
      creatingEmployee: 'Creando...', createEmployeeBtn: 'Crear Empleado',
      registeredEmployees: 'Empleados Registrados', noUsers: 'Sin usuarios registrados',
      clientCol: 'Cliente', pendingRequests: 'Solicitudes Pendientes',
      noPending: 'Sin solicitudes pendientes', approve: 'Aprobar', reject: 'Rechazar',
      history: 'HISTORIAL', reportedIncidents: 'Incidentes Reportados',
      openCount: 'abiertos', noIncidents: 'Sin incidentes reportados',
      inReview: 'En Revisión', resolved: 'Resuelto',
      loadingPanel: 'Cargando panel...',
      deleteConfirm: '¿Eliminar usuario?', deleteWarning: 'Esta acción no se puede deshacer.',
      editUser: 'Editar Usuario'
    },
    tasks: {
      title: 'Mis Tareas', new: 'Nueva Tarea', titleField: 'Título',
      titlePlaceholder: '¿Qué hay que hacer?', description: 'Descripción',
      descPlaceholder: 'Detalles adicionales...', todo: 'Por Hacer',
      inProgress: 'En Progreso', done: 'Completado', empty: 'Sin tareas',
      moveLeft: 'Mover izquierda', moveRight: 'Mover derecha', creating: 'Crear Tarea'
    },
    notes: {
      title: 'Mis Notas', saved: 'notas guardadas', new: 'Nueva Nota',
      empty: 'Sin notas aún', emptyDesc: 'Crea tu primera nota para comenzar',
      createFirst: '+ Crear nota', editTitle: 'Editar Nota', titleField: 'Título',
      titlePlaceholder: 'Título de la nota', content: 'Contenido',
      contentPlaceholder: 'Escribe aquí...', deleteConfirm: '¿Eliminar esta nota?',
      noContent: 'Sin contenido'
    },
    incidents: {
      title: 'Reportar Incidente', subtitle: 'Documenta problemas técnicos o de sistema',
      new: 'Nuevo Incidente', type: 'Tipo de incidente',
      types: { technical: 'Técnico', system: 'Sistema', other: 'Otro' },
      priority: 'Prioridad',
      priorities: { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' },
      titleField: 'Título', titlePlaceholder: 'Resumen del incidente...',
      description: 'Descripción', descPlaceholder: 'Describe el incidente con el mayor detalle posible...',
      submit: 'Enviar Incidente', myIncidents: 'MIS INCIDENTES',
      empty: 'No has reportado incidentes',
      statuses: { open: 'Abierto', pending: 'Pendiente', in_review: 'En revisión', resolved: 'Resuelto', closed: 'Cerrado' },
      successMsg: 'Incidente reportado exitosamente',
      errorMsg: 'Error al reportar el incidente',
      validationMsg: 'Completa el título y la descripción'
    },
    permissions: {
      title: 'Solicitar Permiso', subtitle: 'Gestiona tus ausencias y permisos',
      types: { day_off: 'Día Libre', late: 'Llegada Tarde', early: 'Salida Temprana', vacation: 'Vacaciones', other: 'Otro' },
      new: 'Nueva Solicitud', date: 'Fecha', timeFrom: 'Hora inicio',
      timeTo: 'Hora fin', reason: 'Razón', reasonPlaceholder: 'Describe el motivo de tu solicitud...',
      submit: 'Enviar Solicitud', myRequests: 'MIS SOLICITUDES',
      empty: 'No has enviado solicitudes',
      statuses: { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', cancelled: 'Cancelado' },
      from: 'Desde', to: 'Hasta',
      successMsg: 'Permiso solicitado exitosamente',
      errorMsg: 'Error al solicitar el permiso',
      validationMsg: 'Completa la fecha y la razón',
      cancelBtn: 'Cancelar solicitud',
      days: 'días'
    },
    announcements: {
      tabLabel: 'Anuncios', new: 'Nuevo Anuncio',
      titleField: 'Título', content: 'Mensaje',
      category: 'Tipo', expiresAt: 'Expira el (opcional)',
      categories: { general: 'General', important: 'Importante', urgent: 'Urgente', event: 'Evento', policy: 'Política' },
      publish: 'Publicar Anuncio', publishing: 'Publicando...',
      noAnnouncements: 'Sin anuncios activos',
      deleteConfirm: '¿Eliminar este anuncio?',
      successMsg: 'Anuncio publicado exitosamente',
      errorMsg: 'Error al publicar el anuncio',
      postedBy: 'por', expires: 'Expira:'
    },
    chat: {
      title: 'Chat', employees: 'empleados', searchPlaceholder: 'Buscar empleado…',
      noResults: 'Sin resultados',
      noConversations: 'Sin conversaciones. Busca un empleado para iniciar un chat.',
      startConversation: 'Iniciar conversación', you: 'Tú:',
      imageTooLarge: 'Imagen demasiado grande. Máximo 500KB.',
      imageReady: 'Imagen lista para enviar…', messagePlaceholder: 'Escribe un mensaje…',
      image: 'imagen', online: 'En línea', idle: 'Inactivo', privateConv: 'Conversación privada',
      noAdmin: 'No hay administrador disponible',
      searchToStart: 'Busca un empleado para iniciar un chat',
      deleteConv: 'Eliminar conversación',
      deleteWarning: 'Se borrarán todos los mensajes con',
      deleteUndo: 'Esta acción no se puede deshacer.',
      startWith: 'Inicia la conversación con', firstMessage: 'Escribe tu primer mensaje'
    }
  },
  en: {
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      create: 'Create', loading: 'Loading...', sending: 'Sending...',
      search: 'Search', actions: 'Actions', optional: '(optional)',
      today: 'Today', yesterday: 'Yesterday', daysAgo: '{d} days ago',
      profile: 'Profile', back: 'Back', refresh: 'Refresh'
    },
    nav: {
      home: 'Home', tasks: 'Tasks', notes: 'Notes', incidents: 'Incidents',
      permissions: 'Permissions', chat: 'Chat', panel: 'Panel'
    },
    login: {
      subtitle: 'Enter your credentials to continue',
      username: 'Username', userPlaceholder: 'your_username',
      password: 'Password', submit: 'Sign In', submitting: 'Signing in...',
      error: 'Incorrect username or password'
    },
    dashboard: {
      timeLabel: 'CURRENT TIME · PUERTO RICO', greeting: 'Hello',
      online: 'Online', offline: 'Offline', entry: 'Entry:',
      attendance: 'Attendance', attendanceDesc: 'Record clock in and out',
      clockIn: '▶  Clock In', clockOut: '⏹  Clock Out',
      processing: 'Processing...', breaks: 'Breaks', breakDesc: 'Manage your breaks',
      activeBreak: 'On break', breakAm: 'AM Break', lunch: 'Lunch', breakPm: 'PM Break',
      endBreak: 'End Break', connection: 'Connection', netStatus: 'Network status',
      connected: 'Connected', sessionAs: 'Session as',
      quickAccess: 'QUICK ACCESS', announcements: 'RECENT ANNOUNCEMENTS',
      reportIssue: 'Report an issue', requestPermission: 'Request permission',
      privateMessages: 'Private messages', kanban: 'Kanban board'
    },
    admin: {
      title: 'Administration Panel', subtitle: 'Full system control',
      groupSubtitle: 'Your group view',
      leaderBadge: 'Group Leader',
      tabs: { activity: 'Activity', reports: 'Reports', users: 'Users', permissions: 'Permissions', incidents: 'Incidents', announcements: 'Announcements' },
      active: 'Active', inactive: 'Inactive', afk: 'AFK', disconnected: 'Disconnected',
      realtime: 'Real-Time Monitoring', noEmployees: 'No employees connected',
      lastSeen: 'Last seen:', lastActivity: 'Activity:',
      autoUpdate: 'Auto-updates every 30 seconds',
      todayAttendance: "Today's Attendance", noAttendance: 'No records today',
      employee: 'Employee', entry: 'Entry', exit: 'Exit', hours: 'Hours',
      status: 'Status', activeStatus: 'Active', finished: 'Finished', online: 'Online',
      todayBreaks: "Today's Breaks", noBreaks: 'No breaks recorded today',
      type: 'Type', start: 'Start', end: 'End', duration: 'Duration',
      completed: 'Completed', onBreak: 'On break',
      createEmployee: 'Create New Employee', firstName: 'First Name', lastName: 'Last Name',
      client: 'Client served', username: 'Username', email: 'Email',
      password: 'Password', group: 'Group', noGroup: 'No group', role: 'Role',
      employeeRole: 'Employee', leaderRole: 'Group Leader',
      creatingEmployee: 'Creating...', createEmployeeBtn: 'Create Employee',
      registeredEmployees: 'Registered Employees', noUsers: 'No registered users',
      clientCol: 'Client', pendingRequests: 'Pending Requests',
      noPending: 'No pending requests', approve: 'Approve', reject: 'Reject',
      history: 'HISTORY', reportedIncidents: 'Reported Incidents',
      openCount: 'open', noIncidents: 'No incidents reported',
      inReview: 'In Review', resolved: 'Resolved',
      loadingPanel: 'Loading panel...',
      deleteConfirm: 'Delete user?', deleteWarning: 'This action cannot be undone.',
      editUser: 'Edit User'
    },
    tasks: {
      title: 'My Tasks', new: 'New Task', titleField: 'Title',
      titlePlaceholder: 'What needs to be done?', description: 'Description',
      descPlaceholder: 'Additional details...', todo: 'To Do',
      inProgress: 'In Progress', done: 'Done', empty: 'No tasks',
      moveLeft: 'Move left', moveRight: 'Move right', creating: 'Create Task'
    },
    notes: {
      title: 'My Notes', saved: 'saved notes', new: 'New Note',
      empty: 'No notes yet', emptyDesc: 'Create your first note to get started',
      createFirst: '+ Create note', editTitle: 'Edit Note', titleField: 'Title',
      titlePlaceholder: 'Note title', content: 'Content',
      contentPlaceholder: 'Write here...', deleteConfirm: 'Delete this note?',
      noContent: 'No content'
    },
    incidents: {
      title: 'Report Incident', subtitle: 'Document technical or system issues',
      new: 'New Incident', type: 'Incident type',
      types: { technical: 'Technical', system: 'System', other: 'Other' },
      priority: 'Priority',
      priorities: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
      titleField: 'Title', titlePlaceholder: 'Incident summary...',
      description: 'Description', descPlaceholder: 'Describe the incident in as much detail as possible...',
      submit: 'Submit Incident', myIncidents: 'MY INCIDENTS',
      empty: 'You have not reported any incidents',
      statuses: { open: 'Open', pending: 'Pending', in_review: 'In Review', resolved: 'Resolved', closed: 'Closed' },
      successMsg: 'Incident reported successfully',
      errorMsg: 'Error reporting the incident',
      validationMsg: 'Please fill in the title and description'
    },
    permissions: {
      title: 'Request Permission', subtitle: 'Manage your absences and time off',
      types: { day_off: 'Day Off', late: 'Late Arrival', early: 'Early Departure', vacation: 'Vacation', other: 'Other' },
      new: 'New Request', date: 'Date', timeFrom: 'Start time',
      timeTo: 'End time', reason: 'Reason', reasonPlaceholder: 'Describe the reason for your request...',
      submit: 'Submit Request', myRequests: 'MY REQUESTS',
      empty: 'You have not submitted any requests',
      statuses: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' },
      from: 'From', to: 'To',
      successMsg: 'Permission requested successfully',
      errorMsg: 'Error requesting permission',
      validationMsg: 'Please fill in the date and reason',
      cancelBtn: 'Cancel request',
      days: 'days'
    },
    announcements: {
      tabLabel: 'Announcements', new: 'New Announcement',
      titleField: 'Title', content: 'Message',
      category: 'Type', expiresAt: 'Expires on (optional)',
      categories: { general: 'General', important: 'Important', urgent: 'Urgent', event: 'Event', policy: 'Policy' },
      publish: 'Publish Announcement', publishing: 'Publishing...',
      noAnnouncements: 'No active announcements',
      deleteConfirm: 'Delete this announcement?',
      successMsg: 'Announcement published successfully',
      errorMsg: 'Error publishing announcement',
      postedBy: 'by', expires: 'Expires:'
    },
    chat: {
      title: 'Chat', employees: 'employees', searchPlaceholder: 'Search employee…',
      noResults: 'No results',
      noConversations: 'No conversations. Search for an employee to start a chat.',
      startConversation: 'Start conversation', you: 'You:',
      imageTooLarge: 'Image too large. Max 500KB.',
      imageReady: 'Image ready to send…', messagePlaceholder: 'Write a message…',
      image: 'image', online: 'Online', idle: 'Idle', privateConv: 'Private conversation',
      noAdmin: 'No administrator available',
      searchToStart: 'Search for an employee to start a chat',
      deleteConv: 'Delete conversation',
      deleteWarning: 'All messages with',
      deleteUndo: 'This action cannot be undone.',
      startWith: 'Start the conversation with', firstMessage: 'Write your first message'
    }
  }
};

// Helper: traverse dot-path  e.g. t('nav.home')
function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'es');

  const switchLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const toggleLanguage = () => switchLanguage(language === 'es' ? 'en' : 'es');

  const t = (path) => resolve(translations[language], path);

  return (
    <LangContext.Provider value={{ language, setLanguage: switchLanguage, toggleLanguage, t, translations: translations[language] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
