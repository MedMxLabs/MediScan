import axios from 'axios'

import { logout } from '../store/slices/authSlice'
import { store } from '../store/store'

const rawBase = import.meta.env.VITE_API_URL || ''
const baseURL = typeof rawBase === 'string' ? rawBase.replace(/\/+$/, '') : ''

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null

export function setToken(token) {
  if (token) localStorage.setItem('medscan_token', token)
  else localStorage.removeItem('medscan_token')
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('medscan_refresh')
  if (!refresh) return null
  if (refreshPromise) return refreshPromise

  const refreshHeaders = { Authorization: `Bearer ${refresh}` }
  if (clientApiKey) refreshHeaders['X-Medscan-Api-Key'] = clientApiKey

  refreshPromise = axios
    .post(`${baseURL}/api/auth/refresh`, null, { headers: refreshHeaders })
    .then((res) => {
      const token = res.data?.access_token
      if (token) setToken(token)
      return token || null
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

const clientApiKey = (import.meta.env.VITE_MEDSCAN_API_KEY || '').trim()

if (!clientApiKey && import.meta.env.DEV) {
  console.warn(
    '[MedScan] VITE_MEDSCAN_API_KEY is not set. If the backend enforces client API keys you will get 403 errors. ' +
    'Add it to frontend/.env and restart the dev server.',
  )
}

client.interceptors.request.use((config) => {
  if (clientApiKey) config.headers['X-Medscan-Api-Key'] = clientApiKey
  const t = localStorage.getItem('medscan_token')
  if (t && !config.headers.Authorization) config.headers.Authorization = `Bearer ${t}`
  return config
})

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config
    if (!cfg || cfg._medscanAuthRetry) return Promise.reject(error)
    if (error.response?.status !== 401) return Promise.reject(error)

    const hadToken = Boolean(localStorage.getItem('medscan_token'))
    const isRefreshRoute = cfg.url?.includes('/api/auth/refresh')

    if (hadToken && !isRefreshRoute && !cfg._medscanRefreshAttempt) {
      cfg._medscanRefreshAttempt = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        cfg.headers = cfg.headers || {}
        cfg.headers.Authorization = `Bearer ${newToken}`
        return client.request(cfg)
      }
    }

    if (hadToken) {
      localStorage.removeItem('medscan_token')
      localStorage.removeItem('medscan_refresh')
      localStorage.removeItem('medscan_user')
      store.dispatch(logout())
    }

    cfg._medscanAuthRetry = true
    if (cfg.headers) {
      if (typeof cfg.headers.delete === 'function') cfg.headers.delete('Authorization')
      else delete cfg.headers.Authorization
    }
    return client.request(cfg)
  },
)

export default client
