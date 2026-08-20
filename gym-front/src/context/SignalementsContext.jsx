import { createContext, useState, useCallback } from 'react'
import { getCompteSignalementsEnAttente } from '../api/materiel'

// Compte de signalements de matériel en attente, partagé entre le badge du
// menu admin (AdminLayout) et la page Matériel — permet au badge de se mettre
// à jour immédiatement quand un signalement est traité, sans recharger la page.
const SignalementsContext = createContext()

export function SignalementsProvider({ children }) {
    const [count, setCount] = useState(0)

    const refresh = useCallback(() => {
        getCompteSignalementsEnAttente()
            .then(res => setCount(res.data.count))
            .catch(() => {})
    }, [])

    return (
        <SignalementsContext.Provider value={{ count, refresh }}>
            {children}
        </SignalementsContext.Provider>
    )
}

export default SignalementsContext
