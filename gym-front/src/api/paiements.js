import api from './client'

export const getPaiements = (params) => api.get('/paiements', { params })
