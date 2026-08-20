import { useState, useEffect } from 'react'
import { getProfil, getHistorique } from '../../api/membre-profile'
import Badge from '../../components/Badge'
import { CreditCard, Calendar, Clock, Dumbbell, Star, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MembreDashboard() {
    const [profil, setProfil]         = useState(null)
    const [historique, setHistorique] = useState([])
    const [loading, setLoading]       = useState(true)

    const fetchData = async () => {
        try {
            const [profilRes, historiqueRes] = await Promise.all([
                getProfil(),
                getHistorique(),
            ])
            setProfil(profilRes.data)
            setHistorique(historiqueRes.data)
        } catch {
            console.error('Erreur chargement profil')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchData(), 0)
    }, [])

    const membre              = profil?.membre
    const abonnement          = membre?.abonnement_actuel
    const abonnementEnAttente = membre?.abonnement_en_attente
    const coach               = membre?.coach

    const joursRestants = () => {
        if (!abonnement?.date_fin) return null
        const diff = new Date(abonnement.date_fin) - new Date()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return (
        <div className="p-6">

            {/* Header — visible immédiatement, ne dépend pas du chargement du profil */}
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold">
                    Bonjour, {membre?.prenom}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Voici un aperçu de votre espace membre</p>
            </div>

            {loading ? (
                <>
                    {/* Squelette cartes stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 animate-pulse">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-2/3" />
                                    <div className="w-4 h-4 bg-[#2d2f45] rounded shrink-0" />
                                </div>
                                <div className="h-6 bg-[#2d2f45] rounded w-1/2" />
                            </div>
                        ))}
                    </div>

                    {/* Squelette paiements / coach */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                            <div className="h-3 bg-[#2d2f45] rounded w-1/3 mb-5" />
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#2d2f45]/50">
                                        <div className="space-y-1.5">
                                            <div className="h-2.5 bg-[#2d2f45] rounded w-24" />
                                            <div className="h-2 bg-[#2d2f45] rounded w-32" />
                                        </div>
                                        <div className="h-2.5 bg-[#2d2f45] rounded w-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                            <div className="h-3 bg-[#2d2f45] rounded w-1/4 mb-5" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#2d2f45] shrink-0" />
                                <div className="space-y-2">
                                    <div className="h-3.5 bg-[#2d2f45] rounded w-28" />
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-20" />
                                </div>
                            </div>
                            <div className="h-2.5 bg-[#2d2f45] rounded w-full mt-3" />
                        </div>
                    </div>

                    {/* Squelette "Mes séances" */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                        <div className="h-3 bg-[#2d2f45] rounded w-1/4 mb-5" />
                        <div className="h-20 bg-[#2d2f45]/60 rounded-xl" />
                    </div>
                </>
            ) : (
            <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Statut</p>
                        <CreditCard size={16} color="#e05c3a" opacity={0.7} />
                    </div>
                    <Badge statut={membre?.statut} />
                </div>

                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Abonnement</p>
                        <Calendar size={16} color="#1d9e75" opacity={0.7} />
                    </div>
                    <p className="text-white text-lg font-bold capitalize">
                        {abonnement?.type || abonnementEnAttente?.type || '—'}
                    </p>
                </div>

                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Jours restants</p>
                        <Clock size={16} color="#ba7517" opacity={0.7} />
                    </div>
                    <p className="text-2xl font-bold" style={{
                        color: joursRestants() !== null && joursRestants() <= 7 ? '#ba7517' : '#1d9e75'
                    }}>
                        {joursRestants() ?? '—'}
                    </p>
                </div>

                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Expire le</p>
                        <Dumbbell size={16} color="#534ab7" opacity={0.7} />
                    </div>
                    <p className="text-white text-sm font-bold">
                        {abonnement?.date_fin
                            ? new Date(abonnement.date_fin).toLocaleDateString('fr-FR')
                            : '—'}
                    </p>
                </div>
            </div>

            {/* Alertes */}
            {membre?.statut === 'expire_bientot' && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6">
                    <p className="text-amber-400 font-semibold text-sm">⚠ Votre abonnement expire bientôt</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Contactez la réception pour renouveler votre abonnement.
                    </p>
                </div>
            )}

            {membre?.statut === 'expire' && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
                    <p className="text-red-400 font-semibold text-sm">✕ Votre abonnement a expiré</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Contactez la réception pour activer un nouveau plan.
                    </p>
                </div>
            )}

            {abonnementEnAttente && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
                    <p className="text-blue-400 font-semibold text-sm">⏳ Renouvellement en attente</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Votre abonnement <span className="text-white capitalize">{abonnementEnAttente.type}</span> démarrera
                        le <span className="text-white">{new Date(abonnementEnAttente.date_debut).toLocaleDateString('fr-FR')}</span>.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Derniers paiements */}
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-white font-semibold">Derniers paiements</h2>
                        <Link to="/membre/paiements" className="text-[#e05c3a] text-xs hover:underline">
                            Voir tout →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {historique.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Aucun historique</p>
                        ) : historique.map((abo) => {
                            const isAnnule    = abo.statut === 'annule'
                            const isActuel    = !isAnnule && abonnement && abo.id === abonnement.id
                            const isEnAttente = !isAnnule && abonnementEnAttente && abo.id === abonnementEnAttente.id
                            return (
                                <div key={abo.id} className="flex items-center justify-between py-2 border-b border-[#2d2f45]/50">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white text-sm font-medium capitalize">{abo.type}</p>
                                            {isActuel && (
                                                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    En cours
                                                </span>
                                            )}
                                            {isEnAttente && (
                                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                    En attente
                                                </span>
                                            )}
                                            {isAnnule && (
                                                <span className="text-xs bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/20">
                                                    Annulé
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            {new Date(abo.date_debut).toLocaleDateString('fr-FR')} →{' '}
                                            {new Date(abo.date_fin).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#e05c3a] font-bold text-sm">
                                            {Number(abo.montant).toLocaleString('fr-FR')} FCFA
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Mon coach */}
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5">Mon coach</h2>
                    {coach ? (
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#1d9e75]/20 text-[#1d9e75] flex items-center justify-center text-xl font-bold shrink-0">
                                    {coach.prenom?.[0]}{coach.nom?.[0]}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-lg">{coach.prenom} {coach.nom}</p>
                                    {coach.specialite && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Star size={11} color="#ba7517" />
                                            <span className="text-amber-400 text-xs">{coach.specialite}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 pt-3 border-t border-[#2d2f45]">
                                {coach.telephone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={13} color="#6b7280" />
                                        <span className="text-gray-400 text-sm">{coach.telephone}</span>
                                    </div>
                                )}
                                {coach.bio && (
                                    <p className="text-gray-500 text-xs leading-relaxed mt-2">{coach.bio}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-[#2d2f45] rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Star size={20} color="#444" />
                            </div>
                            <p className="text-gray-500 text-sm">Aucun coach assigné</p>
                            <p className="text-gray-600 text-xs mt-1">Contactez la réception</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Mes séances */}
<div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
    <div className="flex items-center justify-between mb-5">
        <h2 className="text-white font-semibold">Mes séances</h2>
        <Link to="/membre/planning" className="text-[#e05c3a] text-xs hover:underline">
            Voir tout →
        </Link>
    </div>
    <div className="text-center py-4">
        <Calendar size={28} color="#2d2f45" className="mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Consultez votre planning</p>
        <Link to="/membre/planning"
            className="inline-block mt-3 bg-[#e05c3a]/10 border border-[#e05c3a]/30 text-[#e05c3a] px-4 py-2 rounded-xl text-xs font-medium hover:bg-[#e05c3a]/20 transition-colors">
            Voir mon planning →
        </Link>
    </div>
</div>

            </div>
            </>
            )}
        </div>
    )
}