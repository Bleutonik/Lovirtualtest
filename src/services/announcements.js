import { get, post, put, del } from './api';

export async function getAnnouncements() {
  return get('/announcements');
}

export async function createAnnouncement(data) {
  return post('/announcements', data);
}

export async function updateAnnouncement(id, data) {
  return put(`/announcements/${id}`, data);
}

export async function deleteAnnouncement(id) {
  return del(`/announcements/${id}`);
}
