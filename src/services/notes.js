import { get, post, put, del } from './api';

/**
 * Obtiene todas las notas del usuario
 * @returns {Promise<array>} - Lista de notas
 */
export async function getNotes() {
  return get('/notes');
}

/**
 * Crea una nueva nota
 * @param {object} data - Datos de la nota
 * @returns {Promise<object>} - Nota creada
 */
export async function createNote(data) {
  return post('/notes', data);
}

/**
 * Actualiza una nota existente
 * @param {number} id - ID de la nota
 * @param {object} data - Datos a actualizar
 * @returns {Promise<object>} - Nota actualizada
 */
export async function updateNote(id, data) {
  return put(`/notes/${id}`, data);
}

/**
 * Elimina una nota
 * @param {number} id - ID de la nota
 * @returns {Promise<object>} - Respuesta del servidor
 */
export async function deleteNote(id) {
  return del(`/notes/${id}`);
}

export default {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
