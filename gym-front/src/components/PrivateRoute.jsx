import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) return null

    return user ? children : <Navigate to="/login" />
}