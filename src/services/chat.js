import { get, post } from './api';

/**
 * Obtiene las conversaciones (lista de empleados para admin, admin para empleado)
 * @returns {Promise<object>} - Conversaciones y si es admin
 */
export async function getConversations() {
  return get('/chat/conversations');
}

/**
 * Obtiene los mensajes con un usuario específico
 * @param {number} userId - ID del usuario
 * @param {number} limit - Límite de mensajes (default 50)
 * @returns {Promise<object>} - Mensajes y datos del otro usuario
 */
export async function getMessages(userId, limit = 50) {
  return get(`/chat/messages/${userId}?limit=${limit}`);
}

/**
 * Envía un mensaje privado a un usuario
 * @param {number} toUserId - ID del destinatario
 * @param {string} content - Contenido del mensaje
 * @returns {Promise<object>} - Mensaje enviado
 */
export async function sendMessage(toUserId, content) {
  return post('/chat/messages', { to_user_id: toUserId, content });
}

/**
 * Obtiene el conteo de mensajes no leídos
 * @returns {Promise<object>} - Conteo de no leídos
 */
export async function getUnreadCount() {
  return get('/chat/unread');
}

export default {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
};
