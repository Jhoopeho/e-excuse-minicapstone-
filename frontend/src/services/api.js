import axios from 'axios'

const TOKEN_KEY = 'excuse_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// Single Axios instance: base URL + Bearer token interceptor + 401 handling.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    // Expired/invalid token: clear it and send the user to login (except on the login call itself).
    if (error.response?.status === 401 && !url.includes('/login')) {
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

/** Turn an Axios error into { message, errors } where errors maps field -> first message (Laravel 422). */
export function parseError(error) {
  const data = error.response?.data
  const errors = {}
  if (data?.errors) {
    Object.entries(data.errors).forEach(([field, msgs]) => {
      // "attachments.0" -> "attachments"
      errors[field.split('.')[0]] ||= msgs[0]
    })
  }
  return {
    status: error.response?.status,
    message: data?.message || (error.response ? 'Something went wrong.' : 'Cannot reach the server. Check your connection.'),
    errors,
  }
}

export const authApi = {
  login: (body) => api.post('/login', body),
  register: (body) => api.post('/register', body),
  logout: () => api.post('/logout'),
  me: () => api.get('/user'),
}
export const dashboardApi = { get: () => api.get('/dashboard') }
export const optionsApi = { get: () => api.get('/options') }

export const requestsApi = {
  list: (params) => api.get('/requests', { params }),
  get: (id) => api.get(`/requests/${id}`),
  create: (formData) => api.post('/requests', formData),
  // PHP cannot read multipart PUT bodies, so spoof the method with POST + _method=PUT.
  update: (id, formData) => { formData.append('_method', 'PUT'); return api.post(`/requests/${id}`, formData) },
  remove: (id) => api.delete(`/requests/${id}`),
  setStatus: (id, body) => api.patch(`/requests/${id}/status`, body),
}
export const subjectsApi = {
  list: (params) => api.get('/subjects', { params }),
  create: (body) => api.post('/subjects', body),
  update: (id, body) => api.put(`/subjects/${id}`, body),
  remove: (id) => api.delete(`/subjects/${id}`),
}
export const categoriesApi = {
  list: (params) => api.get('/categories', { params }),
  create: (body) => api.post('/categories', body),
  update: (id, body) => api.put(`/categories/${id}`, body),
  remove: (id) => api.delete(`/categories/${id}`),
}

export default api
