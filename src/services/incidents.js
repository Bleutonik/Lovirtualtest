import { get, post } from './api';

/**
 * Obtiene todos los incidentes del usuario
 * @returns {Promise<array>} - Lista de incidentes
 */
export async function getIncidents() {
  return get('/incidents');
}

/**
 * Reporta un nuevo incidente
 * @param {object} data - Datos del incidente
 * @returns {Promise<object>} - Incidente creado
 */
export async function reportIncident(data) {
  return post('/incidents', data);
}

export default {
  getIncidents,
  reportIncident,
};
