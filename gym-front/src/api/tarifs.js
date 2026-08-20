import api from './client'

export const getTarifs    = ()         => api.get('/tarifs')
export const updateTarif  = (id, data) => api.put(`/tarifs/${id}`, data)
