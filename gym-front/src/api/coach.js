import api from './client'

export const getMonProfil  = () => api.get('/coach/profil')
export const getMesMembres = () => api.get('/coach/membres')
