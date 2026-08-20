import axios from 'axios'

// Instance Axios unique, partagée par tous les modules `api/*.js` de l'application.
// Ne créez pas de nouvelle instance ailleurs : toute évolution (baseURL, gestion
// du token, gestion des erreurs) doit rester centralisée ici.

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

// Injecte automatiquement le token Bearer sur chaque requête sortante
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Déconnexion propre en cas de token expiré/révoqué (401) : on nettoie le
// stockage local et on redirige vers /login, sauf si on y est déjà ou si
// l'appel concerné est lui-même une tentative de connexion.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status
        const url = error.config?.url || ''
        const isAuthEndpoint = url.includes('/login') || url.includes('/setup/') || url.includes('/forgot-password')

        if (status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token')
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.assign('/login')
            }
        }

        return Promise.reject(error)
    }
)

export default api
