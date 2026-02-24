import { get, post, del } from './api';

export async function getConversations() {
  return get('/chat/conversations');
}

export async function getMessages(userId, sinceId = null) {
  const qs = sinceId != null ? `since_id=${sinceId}` : 'limit=50';
  return get(`/chat/messages/${userId}?${qs}`);
}

export async function sendMessage(toUserId, content, contentType = 'text', imageData = null) {
  const body = { to_user_id: toUserId };
  if (contentType === 'image') {
    body.content_type = 'image';
    body.image_data = imageData;
  } else {
    body.content = content;
  }
  return post('/chat/messages', body);
}

export async function getUnreadCount() {
  return get('/chat/unread');
}

export async function deleteConversation(userId) {
  return del(`/chat/conversation/${userId}`);
}

export async function getActivityStatus() {
  return get('/activity/status');
}

export default { getConversations, getMessages, sendMessage, getUnreadCount, deleteConversation, getActivityStatus };
