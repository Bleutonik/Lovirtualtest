import { get, post, put, del } from './api';

/**
 * Obtiene todas las tareas del usuario
 * @returns {Promise<array>} - Lista de tareas
 */
export async function getTasks() {
  return get('/tasks');
}

/**
 * Crea una nueva tarea
 * @param {object} data - Datos de la tarea
 * @returns {Promise<object>} - Tarea creada
 */
export async function createTask(data) {
  return post('/tasks', data);
}

/**
 * Actualiza una tarea existente
 * @param {number} id - ID de la tarea
 * @param {object} data - Datos a actualizar
 * @returns {Promise<object>} - Tarea actualizada
 */
export async function updateTask(id, data) {
  return put(`/tasks/${id}`, data);
}

/**
 * Elimina una tarea
 * @param {number} id - ID de la tarea
 * @returns {Promise<object>} - Respuesta del servidor
 */
export async function deleteTask(id) {
  return del(`/tasks/${id}`);
}

export default {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
