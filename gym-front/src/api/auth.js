import api from './client'

export const login    = (data) => api.post('/login', data)
export const logout   = ()     => api.post('/logout')
export const me       = ()     => api.get('/me')
