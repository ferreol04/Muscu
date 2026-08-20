import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { logout } from '../api/auth'
import { SignalementsProvider } from '../context/SignalementsContext'
import { useSignalements } from '../context/useSignalements'
import { PonctuellesProvider } from '../context/PonctuellesContext'
import { usePonctuelles } from '../context/usePonctuelles'
import { LayoutDashboard, Users, Calendar, Dumbbell, DollarSign, LogOut, UserCheck, Clock, CreditCard, Package, Menu, X } from 'lucide-react'

const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/admin/membres',   label: 'Membres',   Icon: Users },
    { path: '/admin/coachs',    label: 'Coachs',     Icon: UserCheck },
    { path: '/admin/tarifs',    label: 'Tarifs',     Icon: DollarSign },
    { path: '/admin/planning',  label: 'Planning',   Icon: Calendar },
    { path: '/admin/seances-ponctuelles', label: 'Ponctuelles', Icon: Clock },
    { path: '/admin/paiements', label: 'Paiements', Icon: CreditCard },
    { path: '/admin/materiel', label: 'Matériel', Icon: Package },
]

// Fournit le contexte au layout et à toutes les pages admin qu'il enveloppe
// (ex: Materiel.jsx peut ainsi rafraîchir le badge dès qu'un signalement est traité).
export default function AdminLayout({ children }) {
    return (
        <SignalementsProvider>
            <PonctuellesProvider>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </PonctuellesProvider>
        </SignalementsProvider>
    )
}

function AdminLayoutContent({ children }) {
    const { user, removeUser } = useAuth()
    const location             = useLocation()
    const navigate             = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const { count: signalementsEnAttente, refresh: refreshSignalements } = useSignalements()
    const { count: ponctuellesEnAttente, refresh: refreshPonctuelles }   = usePonctuelles()

    // Rafraîchit les badges à chaque changement de page (requêtes légères, juste
    // un comptage) — en complément du rafraîchissement immédiat déclenché par
    // Materiel.jsx / SeancesPonctuelles.jsx quand une demande est traitée.
    useEffect(() => {
        refreshSignalements()
        refreshPonctuelles()
    }, [location.pathname, refreshSignalements, refreshPonctuelles])

    const handleLogout = async () => {
        await logout()
        removeUser()
        navigate('/login')
    }

    // Ferme le menu mobile avec la touche Échap
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [])

    return (
        <div className="min-h-screen bg-[#0f1117] lg:flex">

            {/* Barre du haut — visible uniquement sous le breakpoint lg (mobile/tablette portrait) */}
            <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[#1a1a2a] border-b border-[#2d2f45] px-4 h-14">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#e05c3a] rounded-lg flex items-center justify-center">
                        <Dumbbell size={14} color="white" />
                    </div>
                    <span className="text-white font-bold text-sm">GymPro</span>
                </div>
                <button
                    onClick={() => setMenuOpen(true)}
                    aria-label="Ouvrir le menu"
                    aria-expanded={menuOpen}
                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Fond semi-transparent derrière le menu mobile ouvert */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar — tiroir coulissant sous lg, fixe et toujours visible à partir de lg */}
            <aside
                className={`w-64 lg:w-60 bg-[#1a1a2a] border-r border-[#2d2f45] flex flex-col fixed inset-y-0 left-0 h-full z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                    menuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-[#2d2f45] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#e05c3a] rounded-lg flex items-center justify-center">
                            <Dumbbell size={16} color="white" />
                        </div>
                        <span className="text-white font-bold">GymPro</span>
                    </div>
                    <button
                        onClick={() => setMenuOpen(false)}
                        aria-label="Fermer le menu"
                        className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.Icon
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                                    location.pathname === item.path
                                        ? 'bg-[#e05c3a]/10 text-[#e05c3a] font-medium'
                                        : 'text-gray-400 hover:text-white hover:bg-[#ffffff08]'
                                }`}
                            >
                                <Icon size={16} />
                                {item.label}
                                {item.path === '/admin/materiel' && signalementsEnAttente > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                                        {signalementsEnAttente}
                                    </span>
                                )}
                                {item.path === '/admin/seances-ponctuelles' && ponctuellesEnAttente > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                                        {ponctuellesEnAttente}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-[#2d2f45]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-[#e05c3a]/20 text-[#e05c3a] rounded-full flex items-center justify-center text-xs font-bold">
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-gray-500 text-xs">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-gray-500 hover:text-white text-xs transition-colors py-1"
                    >
                        <LogOut size={12} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 lg:ml-60 min-h-screen">
                {children}
            </main>
        </div>
    )
}
