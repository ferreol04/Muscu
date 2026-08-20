import api from './client'

export const getProfil     = () => api.get('/membre/profil')
export const getHistorique = () => api.get('/membre/historique')
export const getTarifs     = () => api.get('/tarifs')
export const getProfilComplet = () => api.get('/membre/profil-complet')
export const getPaiements = () => api.get('/membre/paiements')
export const updateProfil    = (data) => api.post('/membre/update-profil', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const changePassword  = (data) => api.post('/membre/change-password', data)
export const forgotPassword  = (data) => api.post('/forgot-password', data)
