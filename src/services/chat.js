import { get, post } from './api';

export async function getConversations() {
  return get('/chat/conversations');
}

// sinceId: si se pasa, solo devuelve mensajes con id > sinceId (polling incremental)
export async function getMessages(userId, sinceId = null) {
  const qs = sinceId != null ? `since_id=${sinceId}` : 'limit=50';
  return get(`/chat/messages/${userId}?${qs}`);
}

export async function sendMessage(toUserId, content) {
  return post('/chat/messages', { to_user_id: toUserId, content });
}

export async function getUnreadCount() {
  return get('/chat/unread');
}

export default { getConversations, getMessages, sendMessage, getUnreadCount };
