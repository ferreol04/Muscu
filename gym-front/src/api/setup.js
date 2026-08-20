import api from './client'

export const verifySetupToken = (token) => api.get('/setup/verify', { params: { token } })
export const setupPassword    = (data)  => api.post('/setup/password', data)
export const resendSetupLink  = (data)  => api.post('/setup/resend', data)
