import api from './client'

// Tarifs ponctuels
export const getTarifsPonctuels      = ()         => api.get('/tarifs-ponctuels')          // publique, actifs uniquement
export const getTarifsPonctuelsAdmin = ()         => api.get('/tarifs-ponctuels/admin')     // admin, tous (actifs + inactifs)
export const createTarifPonctuel     = (data)     => api.post('/tarifs-ponctuels', data)
export const updateTarifPonctuel     = (id, data) => api.put(`/tarifs-ponctuels/${id}`, data)
// Pas de suppression : un tarif ponctuel se désactive (updateTarifPonctuel avec { actif: false }),
// il ne se supprime jamais — il peut être référencé par des séances déjà validées/payées.

// Séances ponctuelles — admin
export const getSeancesPonctuelles = (params)     => api.get('/seances-ponctuelles', { params })
export const validerSeance         = (id)         => api.post(`/seances-ponctuelles/${id}/valider`)
export const annulerSeanceAdmin    = (id)         => api.post(`/seances-ponctuelles/${id}/annuler`)
export const modifierHeureSeance   = (id, data)   => api.put(`/seances-ponctuelles/${id}/heure`, data)
export const getComptePonctuellesEnAttente = ()   => api.get('/seances-ponctuelles/compte-en-attente')

// Séances ponctuelles — membre
export const getMesSeancesPonctuelles = ()        => api.get('/membre/seances-ponctuelles')
export const reserverSeancePonctuelle = (data)    => api.post('/membre/seances-ponctuelles', data)
