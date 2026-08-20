import api from './client'

export const getCoachProfil    = ()     => api.get('/coach/profil')
export const updateCoachProfil = (data) => api.post('/coach/update-profil', data)
export const changeCoachPassword = (data) => api.post('/coach/change-password', data)
