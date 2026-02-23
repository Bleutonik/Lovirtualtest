const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Realiza una petición HTTP con autenticación
 * @param {string} endpoint - Endpoint de la API
 * @param {object} options - Opciones de fetch
 * @returns {Promise<any>} - Respuesta de la API
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Si el token expiró o es inválido
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    // Si la respuesta no es exitosa
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Intentar parsear como JSON, si falla retornar respuesta vacía
    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    // Si es un error de red
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }
    throw error;
  }
}

/**
 * Petición GET
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise<any>}
 */
export async function get(endpoint) {
  return fetchWithAuth(endpoint, {
    method: 'GET',
  });
}

/**
 * Petición POST
 * @param {string} endpoint - Endpoint de la API
 * @param {object} data - Datos a enviar
 * @returns {Promise<any>}
 */
export async function post(endpoint, data) {
  return fetchWithAuth(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Petición PUT
 * @param {string} endpoint - Endpoint de la API
 * @param {object} data - Datos a enviar
 * @returns {Promise<any>}
 */
export async function put(endpoint, data) {
  return fetchWithAuth(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Petición DELETE
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise<any>}
 */
export async function del(endpoint) {
  return fetchWithAuth(endpoint, {
    method: 'DELETE',
  });
}

export default {
  get,
  post,
  put,
  delete: del,
};
