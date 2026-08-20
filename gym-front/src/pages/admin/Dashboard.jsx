import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getDashboardStats } from '../../api/dashboard'
import {
    Users, UserCheck, UserX, UserMinus,
    DollarSign, TrendingUp, AlertTriangle, GraduationCap
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts'

export default function AdminDashboard() {
    const { user }              = useAuth()
    const navigate              = useNavigate()
    const [stats, setStats]     = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            const statsRes = await getDashboardStats()
            setStats(statsRes.data)
        } catch {
            console.error('Erreur chargement dashboard')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchData(), 0)
    }, [])

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-3">
                    <p className="text-gray-400 text-xs mb-1">{label}</p>
                    <p className="text-[#e05c3a] font-bold text-sm">
                        {Number(payload[0].value).toLocaleString('fr-FR')} FCFA
                    </p>
                </div>
            )
        }
        return null
    }

    const statCards = stats ? [
        {
            label: 'Total membres',
            value: stats.membres.total,
            icon:  Users,
            color: '#e05c3a',
            bg:    'bg-[#e05c3a]/10',
            link:  '/admin/membres',
        },
        {
            label: 'Membres actifs',
            value: stats.membres.actifs,
            icon:  UserCheck,
            color: '#1d9e75',
            bg:    'bg-emerald-500/10',
            link:  '/admin/membres?statut=actif',
        },
        {
            label: 'Membres expirés',
            value: stats.membres.expires,
            icon:  UserX,
            color: '#e24b4a',
            bg:    'bg-red-500/10',
            link:  '/admin/membres?statut=expire',
        },
        {
            label: 'Membres suspendus',
            value: stats.membres.suspendus,
            icon:  UserMinus,
            color: '#6b7280',
            bg:    'bg-gray-500/10',
            link:  '/admin/membres?statut=suspendu',
        },
        {
            label: 'Coachs actifs',
            value: stats.coachs.actifs,
            icon:  GraduationCap,
            color: '#534ab7',
            bg:    'bg-[#534ab7]/10',
            link:  '/admin/coachs?statut=actif',
        },
        {
            label: 'Coachs suspendus',
            value: stats.coachs.suspendus,
            icon:  UserX,
            color: '#e24b4a',
            bg:    'bg-red-500/10',
            link:  '/admin/coachs?statut=suspendu',
        },
        {
            label: 'Revenus de ce mois',
            value: Number(stats.revenus.mois_en_cours).toLocaleString('fr-FR') + ' FCFA',
            icon:  DollarSign,
            color: '#ba7517',
            bg:    'bg-amber-500/10',
            link:  `/admin/paiements?mois=${new Date().getMonth() + 1}&annee=${new Date().getFullYear()}`,
        },
        {
            label: 'Revenus - année en cours',
            value: Number(stats.revenus.annee_en_cours).toLocaleString('fr-FR') + ' FCFA',
            icon:  TrendingUp,
            color: '#1d9e75',
            bg:    'bg-emerald-500/10',
        },
        {
            label: 'Revenus total',
            value: Number(stats.revenus.total).toLocaleString('fr-FR') + ' FCFA',
            icon:  DollarSign,
            color: '#534ab7',
            bg:    'bg-[#534ab7]/10',
        },
    ] : []

    return (
        <div className="p-6">

            {/* Header — visible immédiatement, ne dépend pas du chargement des stats */}
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold">
                    Bonjour, {user?.name?.split(' ')[0]}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Voici un aperçu de votre salle</p>
            </div>

            {loading ? (
                <>
                    {/* Squelette cartes stats — même grille/taille que les vraies cartes */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-2/3" />
                                    <div className="w-9 h-9 bg-[#2d2f45] rounded-xl shrink-0" />
                                </div>
                                <div className="h-6 bg-[#2d2f45] rounded w-1/2" />
                            </div>
                        ))}
                    </div>

                    {/* Squelette graphique revenus */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 mb-6 animate-pulse">
                        <div className="h-3 bg-[#2d2f45] rounded w-1/4 mb-6" />
                        <div className="h-56 bg-[#2d2f45]/60 rounded-xl" />
                    </div>

                    {/* Squelette liste membres expirant bientôt */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                        <div className="h-3 bg-[#2d2f45] rounded w-1/3 mb-5" />
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-[#0f1117] rounded-xl border border-[#2d2f45]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2d2f45] shrink-0" />
                                        <div className="h-2.5 bg-[#2d2f45] rounded w-32" />
                                    </div>
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Cards stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {statCards.map((card) => {
                            const Icon = card.icon
                            return (
                                <div
                                    key={card.label}
                                    onClick={() => card.link && navigate(card.link)}
                                    className={`bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 transition-colors ${
                                        card.link ? 'cursor-pointer hover:border-[#e05c3a]/40' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                            {card.label}
                                        </p>
                                        <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                                            <Icon size={16} color={card.color} />
                                        </div>
                                    </div>
                                    <p className="text-white text-2xl font-bold">{card.value}</p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Graphique revenus */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp size={16} color="#e05c3a" />
                            <h2 className="text-white font-semibold">Revenus des 6 derniers mois</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats?.revenus.graphique} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d2f45" vertical={false} />
                                <XAxis
                                    dataKey="mois"
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="total" fill="#e05c3a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Alertes expiration */}
                    {stats?.membres.expirant_bientot?.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
                            <h2 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle size={16} color="#ba7517" />
                                {stats.membres.expirant_bientot.length} membre{stats.membres.expirant_bientot.length > 1 ? 's' : ''} expire{stats.membres.expirant_bientot.length > 1 ? 'nt' : ''} dans moins de 7 jours
                            </h2>
                            <div className="space-y-3">
                                {stats.membres.expirant_bientot.map((membre) => (
                                    <div
                                        key={membre.id}
                                        onClick={() => navigate(`/admin/membres/${membre.id}`)}
                                        className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                {membre.prenom?.[0]}{membre.nom?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{membre.prenom} {membre.nom}</p>
                                                <p className="text-gray-500 text-xs">{membre.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-amber-400 text-xs">
                                            Expire le {membre.date_fin
                                                ? new Date(membre.date_fin).toLocaleDateString('fr-FR')
                                                : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Membres expirant bientôt — liste détaillée */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <AlertTriangle size={16} color="#ba7517" />
                                Membres expirant bientôt
                                {stats?.membres.expirant_bientot?.length > 0 && (
                                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 ml-1">
                                        {stats.membres.expirant_bientot.length}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => navigate('/admin/membres')}
                                className="text-[#e05c3a] text-xs hover:underline"
                            >
                                Voir tous →
                            </button>
                        </div>

                        {!stats?.membres.expirant_bientot?.length ? (
                            <p className="text-gray-500 text-sm text-center py-6">
                                Aucun membre n'expire dans les 7 prochains jours
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {stats.membres.expirant_bientot.map((membre) => {
                                    const joursRestants = membre.date_fin
                                        ? Math.max(0, Math.ceil(
                                            (new Date(membre.date_fin) - new Date()) / (1000 * 60 * 60 * 24)
                                        ))
                                        : null
                                    return (
                                        <div
                                            key={membre.id}
                                            onClick={() => navigate(`/admin/membres/${membre.id}`)}
                                            className="flex items-center justify-between p-3 bg-[#0f1117] rounded-xl border border-[#2d2f45] hover:border-amber-500/30 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {membre.prenom?.[0]}{membre.nom?.[0]}
                                                </div>
                                                <p className="text-white text-sm font-medium">{membre.prenom} {membre.nom}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {membre.date_fin && (
                                                    <p className="text-gray-500 text-xs">
                                                        Expire le {new Date(membre.date_fin).toLocaleDateString('fr-FR')}
                                                    </p>
                                                )}
                                                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">
                                                    {joursRestants !== null ? `J-${joursRestants}` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
