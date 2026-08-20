import { createContext, useState, useEffect, useRef } from 'react'
import { me } from '../api/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null)
    const [loading, setLoading] = useState(true)
    const hasFetched            = useRef(false)

    useEffect(() => {
        if (hasFetched.current) return
        hasFetched.current = true

        const token = localStorage.getItem('token')
        if (!token) {
            Promise.resolve().then(() => setLoading(false))
        return
        }

        me()
            .then(res => setUser(res.data))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false))
    }, [])

    const saveUser = (user, token) => {
        localStorage.setItem('token', token)
        setUser(user)
    }

    const removeUser = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, saveUser, removeUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext