import { get, post, put } from './api';

/**
 * Inicia un descanso
 * @param {string} type - Tipo de descanso: 'break_am', 'lunch', 'break_pm'
 * @returns {Promise<object>} - Registro del descanso
 */
export async function startBreak(type) {
  return post('/breaks/start', { type });
}

/**
 * Finaliza un descanso
 * @param {number} breakId - ID del descanso
 * @returns {Promise<object>} - Registro del descanso actualizado
 */
export async function endBreak(breakId) {
  return post('/breaks/end', { breakId });
}

/**
 * Obtiene los descansos del día actual
 * @returns {Promise<array>} - Lista de descansos de hoy
 */
export async function getTodayBreaks() {
  return get('/breaks/today');
}

export default {
  startBreak,
  endBreak,
  getTodayBreaks,
};
