import { get, post } from './api';

/**
 * Obtiene todos los permisos del usuario
 * @returns {Promise<array>} - Lista de permisos
 */
export async function getPermissions() {
  return get('/permissions');
}

/**
 * Solicita un nuevo permiso
 * @param {object} data - Datos del permiso
 * @returns {Promise<object>} - Permiso creado
 */
export async function requestPermission(data) {
  return post('/permissions', data);
}

export default {
  getPermissions,
  requestPermission,
};
