import { createContext, useState, useCallback } from 'react'
import { getComptePonctuellesEnAttente } from '../api/ponctuels'

// Compte de séances ponctuelles en attente de validation, partagé entre le
// badge du menu admin (AdminLayout) et la page Ponctuelles — permet au badge
// de se mettre à jour immédiatement quand une demande est traitée, sans
// recharger la page. Même principe que SignalementsContext.
const PonctuellesContext = createContext()

export function PonctuellesProvider({ children }) {
    const [count, setCount] = useState(0)

    const refresh = useCallback(() => {
        getComptePonctuellesEnAttente()
            .then(res => setCount(res.data.count))
            .catch(() => {})
    }, [])

    return (
        <PonctuellesContext.Provider value={{ count, refresh }}>
            {children}
        </PonctuellesContext.Provider>
    )
}

export default PonctuellesContext
