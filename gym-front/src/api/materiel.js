import api from './client'

// Admin
export const getMateriels       = (params)   => api.get('/materiels', { params })
export const createMateriel     = (data)     => api.post('/materiels', data)
export const updateMateriel     = (id, data) => api.put(`/materiels/${id}`, data)
export const deleteMateriel     = (id)       => api.delete(`/materiels/${id}`)
export const getSignalements    = (params)   => api.get('/signalements', { params })
export const traiterSignalement = (id, data) => api.put(`/signalements/${id}/traiter`, data)
export const getCompteSignalementsEnAttente = () => api.get('/signalements/compte-en-attente')

// Coach
export const getMaterielsCoach  = (params)  => api.get('/coach/materiels', { params })
export const getMesSignalements = ()        => api.get('/coach/mes-signalements')
export const signalerPanne      = (data)    => api.post('/coach/signalements', data)
