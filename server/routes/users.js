const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Listar usuarios (admin/supervisor)
router.get('/', authenticateToken, requireRole('admin', 'supervisor'), (req, res) => {
  try {
    let users = db.getAll('users');

    // Remover passwords de la respuesta
    users = users.map(({ password, ...user }) => user);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const targetId = parseInt(req.params.id);

    // Solo admin/supervisor puede ver otros usuarios
    if (userId !== targetId && !['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este usuario'
      });
    }

    const user = db.getById('users', targetId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Remover password
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/users/:id/profile - Perfil completo con stats
router.get('/:id/profile', authenticateToken, (req, res) => {
  try {
    const requesterId = req.user.id || req.user.userId;
    const targetId = parseInt(req.params.id);
    const isAdmin = ['admin', 'supervisor'].includes(req.user.role);

    if (requesterId !== targetId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Sin permisos' });
    }

    const user = db.getById('users', targetId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const { password, ...userClean } = user;

    // Stats del mes actual
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const attendance = db.getAll('attendance') || [];
    const myAttendance = attendance.filter(a => a.user_id === targetId && a.date?.startsWith(monthStr));
    const daysPresent = myAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const daysLate = myAttendance.filter(a => a.status === 'late').length;
    const totalHours = myAttendance.reduce((sum, a) => sum + (parseFloat(a.total_hours) || 0), 0);

    const tasks = db.getAll('tasks') || [];
    const myTasks = tasks.filter(t => t.user_id === targetId);
    const tasksCompleted = myTasks.filter(t => t.status === 'completed').length;
    const tasksPending = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

    // Activity status
    const activityLogs = db.getAll('activity_logs') || [];
    const lastLog = activityLogs.filter(l => l.user_id === targetId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    let onlineStatus = 'offline';
    if (lastLog) {
      const minsSince = (Date.now() - new Date(lastLog.timestamp)) / 60000;
      if (minsSince < 5) onlineStatus = 'active';
      else if (minsSince < 20) onlineStatus = 'idle';
    }

    // Asistencia reciente (últimos 10 registros)
    const recentAttendance = attendance
      .filter(a => a.user_id === targetId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        user: userClean,
        stats: {
          thisMonth: { daysPresent, daysLate, totalHours: Math.round(totalHours * 10) / 10 },
          tasks: { completed: tasksCompleted, pending: tasksPending },
          onlineStatus
        },
        recentAttendance
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/users - Crear usuario (solo admin)
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name, department, client } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contrasena son requeridos'
      });
    }

    // Verificar si existe
    const existingUser = db.findOne('users', u => u.username === username || (email && u.email === email));

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El usuario o email ya existe'
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const validRoles = ['admin', 'supervisor', 'employee'];
    const userRole = validRoles.includes(role) ? role : 'employee';

    const newUser = db.insert('users', {
      username,
      email: email || null,
      password: hashedPassword,
      role: userRole,
      first_name: first_name || null,
      last_name: last_name || null,
      department: department || null,
      client: client || null,
      avatar: null
    });

    // Remover password de la respuesta
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { user: userWithoutPassword }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { first_name, last_name, email, department, role, avatar, client } = req.body;
    const targetId = parseInt(req.params.id);
    const userId = req.user.id || req.user.userId;

    const isSelf = userId === targetId;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este usuario'
      });
    }

    const existing = db.getById('users', targetId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar email duplicado
    if (email) {
      const emailExists = db.findOne('users', u => u.email === email && u.id !== targetId);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'El email ya esta en uso'
        });
      }
    }

    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (email !== undefined) updates.email = email;
    if (department !== undefined) updates.department = department;
    if (avatar !== undefined) updates.avatar = avatar;
    if (client !== undefined) updates.client = client;
    if (role !== undefined && isAdmin) updates.role = role;

    const updatedUser = db.update('users', targetId, updates);
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Usuario actualizado',
      data: { user: userWithoutPassword }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const userId = req.user.id || req.user.userId;

    if (userId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
    }

    const deleted = db.delete('users', targetId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
