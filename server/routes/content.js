const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET / - Listar publicaciones (admin/supervisor ven todas, employee ve las suyas)
router.get('/', (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const role = req.user.role;
    const { month, year } = req.query;

    let items = (role === 'admin' || role === 'supervisor')
      ? db.getAll('publicaciones')
      : db.find('publicaciones', p => p.user_id === userId);

    if (month !== undefined && year !== undefined) {
      const m = String(Number(month) + 1).padStart(2, '0');
      const startDate = `${year}-${m}-01`;
      const endDay = new Date(Number(year), Number(month) + 1, 0).getDate();
      const endDate = `${year}-${m}-${String(endDay).padStart(2, '0')}`;
      items = items.filter(p => p.fecha >= startDate && p.fecha <= endDate);
    }

    items.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));

    res.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
  }
});

// POST / - Crear publicación
router.post('/', (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const {
      titulo, fecha, red_social, tipo_contenido, estado, color,
      cuenta_cliente, campana, objetivo_post, pilar_contenido, etapa_funnel,
      hook, cta_texto, tipo_pauta, descripcion, copy_arte, copy_caption,
      indicaciones_arte, link_referencia, referencia_visual, hashtags,
      duracion, presupuesto, segmentacion
    } = req.body;

    if (!titulo || !fecha) {
      return res.status(400).json({ success: false, message: 'Título y fecha son requeridos' });
    }

    const newItem = db.insert('publicaciones', {
      user_id: userId,
      titulo, fecha,
      red_social: red_social || 'Instagram',
      tipo_contenido: tipo_contenido || 'Post',
      estado: estado || 'En planeación',
      color: color || '#3B82F6',
      cuenta_cliente: cuenta_cliente || null,
      campana: campana || null,
      objetivo_post: objetivo_post || 'Engagement',
      pilar_contenido: pilar_contenido || 'Comunidad',
      etapa_funnel: etapa_funnel || 'Descubrimiento',
      hook: hook || null,
      cta_texto: cta_texto || null,
      tipo_pauta: tipo_pauta || 'Orgánico',
      descripcion: descripcion || null,
      copy_arte: copy_arte || null,
      copy_caption: copy_caption || null,
      indicaciones_arte: indicaciones_arte || null,
      link_referencia: link_referencia || null,
      referencia_visual: referencia_visual || null,
      hashtags: hashtags || null,
      duracion: duracion || null,
      presupuesto: presupuesto ? Number(presupuesto) : null,
      segmentacion: segmentacion || null,
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al crear publicación' });
  }
});

// PUT /:id - Actualizar publicación
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id || req.user.userId;
    const role = req.user.role;

    const existing = db.findOne('publicaciones', p => p.id === id);
    if (!existing) return res.status(404).json({ success: false, message: 'No encontrada' });

    if (role === 'employee' && existing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Sin permiso' });
    }

    const updates = { ...req.body };
    if (updates.presupuesto !== undefined) {
      updates.presupuesto = updates.presupuesto ? Number(updates.presupuesto) : null;
    }

    const updated = db.update('publicaciones', id, updates);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
});

// DELETE /:id - Eliminar publicación
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id || req.user.userId;
    const role = req.user.role;

    const existing = db.findOne('publicaciones', p => p.id === id);
    if (!existing) return res.status(404).json({ success: false, message: 'No encontrada' });

    if (role === 'employee' && existing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Sin permiso' });
    }

    db.delete('publicaciones', id);
    res.json({ success: true, message: 'Eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
});

module.exports = router;
