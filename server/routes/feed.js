const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const ALLOWED_REACTIONS = ['👍','❤️','🎉','🔥','💪'];

// ── GET / ── listar posts ─────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { id: userId, role, group } = req.user;
    let posts = db.getAll('posts');

    // Empleado solo ve su propio grupo + sus propios posts
    if (role === 'employee') {
      posts = posts.filter(p => p.user_id === userId || (group && p.group === group));
    } else if (role === 'supervisor') {
      // Supervisor ve su grupo + todos los empleados
      posts = posts.filter(p => !group || p.group === group || p.role === 'admin' || p.role === 'supervisor');
    }
    // admin ve todo

    // Enriquecer con comentarios y conteo de reacciones
    posts = posts.map(p => ({
      ...p,
      comments: db.find('post_comments', c => c.post_id === p.id)
                   .sort((a,b) => new Date(a.created_at) - new Date(b.created_at)),
      reaction_counts: Object.fromEntries(
        ALLOWED_REACTIONS.map(e => [e, (p.reactions?.[e] || []).length])
      ),
      my_reaction: ALLOWED_REACTIONS.find(e => (p.reactions?.[e] || []).includes(userId)) || null
    }));

    posts.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: posts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST / ── crear post ──────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { id: userId, role, username, group } = req.user;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'El contenido es requerido' });

    // Obtener info del usuario (cliente)
    const userRecord = db.findOne('users', u => u.id === userId);

    const post = db.insert('posts', {
      user_id: userId,
      username,
      role,
      group: group || null,
      client: userRecord?.client || null,
      content: content.trim(),
      reactions: {}
    });

    res.status(201).json({ success: true, data: post });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DELETE /:id ── eliminar post ──────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const postId = parseInt(req.params.id);
    const post = db.findOne('posts', p => p.id === postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post no encontrado' });
    if (post.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Sin permiso' });
    }
    db.delete('posts', postId);
    db.deleteWhere('post_comments', c => c.post_id === postId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /:id/react ── reaccionar (toggle) ─────────────────
router.post('/:id/react', (req, res) => {
  try {
    const { id: userId } = req.user;
    const postId = parseInt(req.params.id);
    const { emoji } = req.body;
    if (!ALLOWED_REACTIONS.includes(emoji)) {
      return res.status(400).json({ success: false, message: 'Reacción no válida' });
    }
    const post = db.findOne('posts', p => p.id === postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post no encontrado' });

    const reactions = { ...post.reactions };
    ALLOWED_REACTIONS.forEach(e => { if (!reactions[e]) reactions[e] = []; });

    // Quitar reacción anterior del usuario si existe
    ALLOWED_REACTIONS.forEach(e => {
      reactions[e] = reactions[e].filter(id => id !== userId);
    });

    // Toggle: si ya tenía ese emoji, queda sin reacción; si no, agregar
    const hadReaction = post.reactions?.[emoji]?.includes(userId);
    if (!hadReaction) reactions[emoji].push(userId);

    db.update('posts', postId, { reactions });

    res.json({
      success: true,
      reaction_counts: Object.fromEntries(ALLOWED_REACTIONS.map(e => [e, reactions[e].length])),
      my_reaction: hadReaction ? null : emoji
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /:id/comment ── agregar comentario ────────────────
router.post('/:id/comment', (req, res) => {
  try {
    const { id: userId, username, role } = req.user;
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'El comentario no puede estar vacío' });

    const post = db.findOne('posts', p => p.id === postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post no encontrado' });

    const comment = db.insert('post_comments', {
      post_id: postId,
      user_id: userId,
      username,
      role,
      content: content.trim()
    });

    res.status(201).json({ success: true, data: comment });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DELETE /:id/comment/:cid ── eliminar comentario ────────
router.delete('/:id/comment/:cid', (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const commentId = parseInt(req.params.cid);
    const comment = db.findOne('post_comments', c => c.id === commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
    if (comment.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Sin permiso' });
    }
    db.delete('post_comments', commentId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
