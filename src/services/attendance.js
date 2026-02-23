import { get, post } from './api';

/**
 * Registra entrada (clock in)
 * @returns {Promise<object>} - Registro de asistencia
 */
export async function clockIn() {
  return post('/attendance/clock-in', {});
}

/**
 * Registra salida (clock out)
 * @returns {Promise<object>} - Registro de asistencia actualizado
 */
export async function clockOut() {
  return post('/attendance/clock-out', {});
}

/**
 * Obtiene la asistencia del día actual
 * @returns {Promise<object|null>} - Registro de asistencia de hoy
 */
export async function getTodayAttendance() {
  return get('/attendance/today');
}

/**
 * Obtiene el historial de asistencia
 * @returns {Promise<array>} - Lista de registros de asistencia
 */
export async function getHistory() {
  return get('/attendance/history');
}

export default {
  clockIn,
  clockOut,
  getTodayAttendance,
  getHistory,
};
