import { useState, useEffect } from 'react'
import { getMonProfil, getMesMembres } from '../../api/coach'
import { getPlanningCoach } from '../../api/planning'
import Badge from '../../components/Badge'
import { Users, UserCheck, UserX, Calendar, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export default function CoachDashboard() {
    const [profil, setProfil]     = useState(null)
    const [membres, setMembres]   = useState([])
    const [seances, setSeances]   = useState([])
    const [loading, setLoading]   = useState(true)

    const fetchData = async () => {
        try {
            const [profilRes, membresRes, seancesRes] = await Promise.all([
                getMonProfil(),
                getMesMembres(),
                getPlanningCoach(),
            ])
            setProfil(profilRes.data)
            setMembres(membresRes.data)
            setSeances(seancesRes.data)
        } catch {
            console.error('Erreur chargement dashboard coach')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchData(), 0)
    }, [])

    const coach         = profil?.coach
    const actifs        = membres.filter(m => m.statut === 'actif').length
    const expires       = membres.filter(m => m.statut === 'expire').length
    const expirantBientot = membres.filter(m => m.statut === 'expire_bientot').length

    // Séances du jour : récurrentes dont le jour correspond à aujourd'hui,
    // ou séances datées dont la date est celle du jour.
    // On construit la date à partir des composants locaux (getFullYear/getMonth/getDate)
    // plutôt que toISOString(), qui convertit en UTC et peut décaler la date d'un jour
    // selon le fuseau horaire de l'utilisateur.
    const today       = new Date()
    const jourActuel  = JOURS_SEMAINE[today.getDay()]
    const pad2        = (n) => String(n).padStart(2, '0')
    const dateActuelle = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`

    const seancesDuJour = seances
        .filter(s => (s.recurrente && s.jour === jourActuel) || (!s.recurrente && s.date?.slice(0, 10) === dateActuelle))
        .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))

    return (
        <div className="p-6">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold">
                    Bonjour, {coach?.prenom} 
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {coach?.specialite && (
                        <span className="text-[#1d9e75]">{coach.specialite} · </span>
                    )}
                    Voici un aperçu de vos membres
                </p>
            </div>

            {loading ? (
                <>
                    {/* Squelette cartes stats — même grille/taille que les vraies cartes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 animate-pulse">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-2/3" />
                                    <div className="w-4 h-4 bg-[#2d2f45] rounded shrink-0" />
                                </div>
                                <div className="h-6 bg-[#2d2f45] rounded w-1/3" />
                            </div>
                        ))}
                    </div>

                    {/* Squelette panneaux membres / planning du jour */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                                <div className="h-3 bg-[#2d2f45] rounded w-1/3 mb-5" />
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, j) => (
                                        <div key={j} className="flex items-center justify-between py-2 border-b border-[#2d2f45]/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#2d2f45] shrink-0" />
                                                <div className="h-2.5 bg-[#2d2f45] rounded w-28" />
                                            </div>
                                            <div className="h-2.5 bg-[#2d2f45] rounded w-12" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Link to="/coach/membres" className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 transition-colors hover:border-[#1d9e75]/40">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total membres</p>
                                <Users size={16} color="#1d9e75" opacity={0.7} />
                            </div>
                            <p className="text-2xl font-bold text-[#1d9e75]">{membres.length}</p>
                        </Link>
                        <Link to="/coach/membres?statut=actif" className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 transition-colors hover:border-[#1d9e75]/40">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Actifs</p>
                                <UserCheck size={16} color="#1d9e75" opacity={0.7} />
                            </div>
                            <p className="text-2xl font-bold text-[#1d9e75]">{actifs}</p>
                        </Link>
                        <Link to="/coach/membres?statut=expire_bientot" className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 transition-colors hover:border-[#1d9e75]/40">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Expirent bientôt</p>
                                <Calendar size={16} color="#ba7517" opacity={0.7} />
                            </div>
                            <p className="text-2xl font-bold text-amber-400">{expirantBientot}</p>
                        </Link>
                        <Link to="/coach/membres?statut=expire" className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 transition-colors hover:border-[#1d9e75]/40">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Expirés</p>
                                <UserX size={16} color="#e24b4a" opacity={0.7} />
                            </div>
                            <p className="text-2xl font-bold text-red-400">{expires}</p>
                        </Link>
                    </div>

                    {/* Alerte membres expirant bientôt */}
                    {expirantBientot > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-8">
                            <p className="text-amber-400 font-semibold text-sm">
                                ⚠ {expirantBientot} membre{expirantBientot > 1 ? 's' : ''} expire{expirantBientot > 1 ? 'nt' : ''} bientôt
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Informez l'administration pour renouveler leurs abonnements.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Mes membres récents */}
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                            <h2 className="text-white font-semibold mb-5">Mes membres</h2>
                            {membres.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users size={32} color="#2d2f45" className="mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Aucun membre assigné</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {membres.slice(0, 5).map((membre) => (
                                        <div key={membre.id} className="flex items-center justify-between py-2 border-b border-[#2d2f45]/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                                                    {membre.prenom?.[0]}{membre.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{membre.prenom} {membre.nom}</p>
                                                    <p className="text-gray-500 text-xs">{membre.objectif || '—'}</p>
                                                </div>
                                            </div>
                                            <Badge statut={membre.statut} />
                                        </div>
                                    ))}
                                    {membres.length > 5 && (
                                        <p className="text-gray-500 text-xs text-center pt-2">
                                            + {membres.length - 5} autres membres
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Planning du jour */}
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-white font-semibold">Planning du jour</h2>
                                <Link to="/coach/planning" className="text-[#1d9e75] text-xs hover:underline">
                                    Voir tout →
                                </Link>
                            </div>
                            {seancesDuJour.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar size={32} color="#2d2f45" className="mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Aucune séance aujourd'hui</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {seancesDuJour.map((seance) => (
                                        <div key={seance.id} className="flex items-center justify-between py-2 border-b border-[#2d2f45]/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#1d9e75]/20 text-[#1d9e75] flex items-center justify-center text-xs font-bold shrink-0">
                                                    {seance.membre?.prenom?.[0]}{seance.membre?.nom?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{seance.titre}</p>
                                                    <p className="text-gray-500 text-xs">{seance.membre?.prenom} {seance.membre?.nom}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                                <Clock size={12} />
                                                {seance.heure_debut} - {seance.heure_fin}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}