import { createContext, useState, useCallback } from 'react'
import { getCompteAnnulationsMembre } from '../api/planning'

// Compte des séances ponctuelles annulées pas encore consultées par le membre,
// partagé entre le badge du menu (MembreLayout) et la page Planning membre —
// permet au badge de disparaître dès que le membre consulte son planning.
const AnnulationsContext = createContext()

export function AnnulationsProvider({ children }) {
    const [count, setCount] = useState(0)

    const refresh = useCallback(() => {
        getCompteAnnulationsMembre()
            .then(res => setCount(res.data.count))
            .catch(() => {})
    }, [])

    return (
        <AnnulationsContext.Provider value={{ count, refresh }}>
            {children}
        </AnnulationsContext.Provider>
    )
}

export default AnnulationsContext
