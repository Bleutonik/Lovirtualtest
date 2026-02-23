import { get, post } from './api';

/**
 * Crea un reporte diario
 * @param {object} data - Datos del reporte
 * @returns {Promise<object>} - Reporte creado
 */
export async function createDailyReport(data) {
  return post('/reports/daily', data);
}

/**
 * Obtiene todos los reportes diarios del usuario
 * @returns {Promise<array>} - Lista de reportes
 */
export async function getDailyReports() {
  return get('/reports/daily');
}

/**
 * Obtiene el reporte del día actual
 * @returns {Promise<object|null>} - Reporte de hoy
 */
export async function getTodayReport() {
  return get('/reports/daily/today');
}

export default {
  createDailyReport,
  getDailyReports,
  getTodayReport,
};
