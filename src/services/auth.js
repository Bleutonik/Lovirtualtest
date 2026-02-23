import { post } from './api';

/**
 * Inicia sesión del usuario
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<object>} - Datos del usuario y token
 */
export async function login(username, password) {
  const response = await post('/auth/login', { username, password });

  // Los datos vienen en response.data
  const token = response.data?.token || response.token;
  const user = response.data?.user || response.user;

  if (token) {
    localStorage.setItem('token', token);
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  return { token, user, success: response.success };
}

/**
 * Registra un nuevo usuario
 * @param {object} data - Datos del usuario
 * @returns {Promise<object>} - Respuesta del servidor
 */
export async function register(data) {
  return post('/auth/register', data);
}

/**
 * Cierra la sesión del usuario
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Obtiene el token de autenticación
 * @returns {string|null} - Token de autenticación
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Obtiene el usuario actual
 * @returns {object|null} - Datos del usuario
 */
export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - True si está autenticado
 */
export function isAuthenticated() {
  return !!getToken();
}

export default {
  login,
  register,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
};
