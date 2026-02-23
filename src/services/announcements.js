import { get } from './api';

/**
 * Obtiene todos los anuncios
 * @returns {Promise<array>} - Lista de anuncios
 */
export async function getAnnouncements() {
  return get('/announcements');
}

export default {
  getAnnouncements,
};
