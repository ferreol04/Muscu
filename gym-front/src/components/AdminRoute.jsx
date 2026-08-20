import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { roleHome } from '../utils/roleHome'

export default function AdminRoute({ children }) {
    const { user } = useAuth()

    if (!user) return <Navigate to="/login" />
    if (user.role !== 'admin') return <Navigate to={roleHome(user.role)} />

    return children
}
