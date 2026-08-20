import api from './client'

// Admin
export const getPlanningAdmin   = (params) => api.get('/planning', { params })
export const createSeance       = (data)   => api.post('/planning', data)
export const updateSeance       = (id, data) => api.put(`/planning/${id}`, data)
export const deleteSeance       = (id)     => api.delete(`/planning/${id}`)

// Coach
export const getPlanningCoach   = ()       => api.get('/coach/planning')
export const createSeanceCoach  = (data)   => api.post('/coach/planning', data)
export const updateSeanceCoach  = (id, data) => api.put(`/coach/planning/${id}`, data)
export const deleteSeanceCoach  = (id)     => api.delete(`/coach/planning/${id}`)

// Membre
export const getPlanningMembre  = ()       => api.get('/membre/planning')
export const reserverSeance     = (data)   => api.post('/membre/reserver', data)
export const annulerSeance      = (id)     => api.put(`/membre/annuler/${id}`)
export const getCompteAnnulationsMembre = () => api.get('/membre/planning/compte-annulations')
