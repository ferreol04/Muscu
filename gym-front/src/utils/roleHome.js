// Route du tableau de bord correspondant à chaque rôle applicatif.
// Centralisé pour que les gardes de route (AdminRoute/CoachRoute/MembreRoute)
// redirigent toujours vers un écran réel et cohérent avec le rôle réel de
// l'utilisateur connecté, plutôt que vers une route fixe ou inexistante.
export function roleHome(role) {
    switch (role) {
        case 'admin':  return '/admin/dashboard'
        case 'coach':  return '/coach/dashboard'
        case 'membre': return '/membre/dashboard'
        default:       return '/login'
    }
}
