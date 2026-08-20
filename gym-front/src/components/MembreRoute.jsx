import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { roleHome } from '../utils/roleHome'

export default function MembreRoute({ children }) {
    const { user } = useAuth()

    if (!user) return <Navigate to="/login" />
    if (user.role !== 'membre') return <Navigate to={roleHome(user.role)} />

    return children
}
