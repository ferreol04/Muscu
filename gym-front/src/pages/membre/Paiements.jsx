import { useState, useEffect } from 'react'
import { getPaiements } from '../../api/membre-profile'
import { useAuth } from '../../context/useAuth'
import { CreditCard, Clock } from 'lucide-react'


export default function MembrePaiements() {
    const [data, setData]       = useState(null)
    const [loading, setLoading] = useState(true)
    const { user }              = useAuth()
    const [onglet, setOnglet] = useState('abonnements')

    const fetchPaiements = async () => {
        try {
            const res = await getPaiements()
            setData(res.data)
        } catch {
            console.error('Erreur chargement paiements')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchPaiements(), 0)
    }, [])

    const abonnementActuel    = data?.abonnement_actuel
    const abonnementEnAttente = data?.abonnement_en_attente
    const abonnements         = data?.abonnements || []
    const totalDepense        = data?.total_depense || 0
    const seancesPonctuelles = data?.seances_ponctuelles || []

    const typeColors = {
        mensuel:     { bg: '#185fa5', text: '#85b7eb' },
        trimestriel: { bg: '#3b6d11', text: '#97c459' },
        semestriel:  { bg: '#534ab7', text: '#afa9ec' },
        annuel:      { bg: '#854f0b', text: '#ef9f27' },
    }

    const getStatutAbo = (abo) => {
        if (abo.statut === 'annule') return 'annule'
        if (abonnementActuel && abo.id === abonnementActuel.id)       return 'en_cours'
        if (abonnementEnAttente && abo.id === abonnementEnAttente.id) return 'en_attente'
        return 'expire'
    }

    const abonnementCarte = abonnementActuel || abonnementEnAttente

    return (
        <div className="p-6 max-w-3xl mx-auto">

            {/* Header — visible immédiatement, ne dépend pas du chargement des paiements */}
            <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Mes paiements</h1>
            </div>

            {loading ? (
                <>
                    {/* Squelette carte membre */}
                    <div className="mb-8">
                        <div className="h-3.5 bg-[#2d2f45] rounded w-32 mb-4 animate-pulse" />
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl animate-pulse" style={{ minHeight: '180px' }} />
                    </div>

                    {/* Squelette total dépensé */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 mb-8 flex items-center justify-between animate-pulse">
                        <div className="space-y-2">
                            <div className="h-2.5 bg-[#2d2f45] rounded w-48" />
                            <div className="h-6 bg-[#2d2f45] rounded w-28" />
                        </div>
                        <div className="w-12 h-12 bg-[#2d2f45] rounded-xl shrink-0" />
                    </div>

                    {/* Squelette onglets + tableau */}
                    <div className="h-3.5 bg-[#2d2f45] rounded w-40 mb-4 animate-pulse" />
                    <div className="flex gap-2 mb-5">
                        <div className="h-9 bg-[#2d2f45] rounded-xl w-32 animate-pulse" />
                        <div className="h-9 bg-[#2d2f45] rounded-xl w-44 animate-pulse" />
                    </div>
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden animate-pulse">
                        <div className="divide-y divide-[#2d2f45]/50">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between">
                                    <div className="h-4 bg-[#2d2f45] rounded-full w-20" />
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-16" />
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-16" />
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-20" />
                                    <div className="h-4 bg-[#2d2f45] rounded-full w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
            <>
            {/* Carte abonnement style carte bancaire */}
            <div className="mb-8">
                <h2 className="text-white font-semibold mb-4">Ma carte membre</h2>
                <div
                    className="relative rounded-2xl p-6 overflow-hidden"
                    style={{
                        background: abonnementCarte
                            ? `linear-gradient(135deg, ${typeColors[abonnementCarte.type]?.bg || '#1a1a2a'}, #1a1a2a)`
                            : '#1a1a2a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minHeight: '180px',
                    }}
                >
                    {/* Cercles décoratifs */}
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
                        style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 right-16 w-32 h-32 rounded-full opacity-10"
                        style={{ background: 'white', transform: 'translate(0%, 30%)' }} />

                    {/* Logo + badge type */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#e05c3a] rounded-lg flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 4h2v16H6V4zm10 0h2v16h-2V4zm-5 6h2v4h-2v-4z" fill="white"/>
                                </svg>
                            </div>
                            <span className="text-white font-bold text-sm">GymPro</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {!abonnementActuel && abonnementEnAttente && (
                                <span className="text-xs font-bold uppercase px-2 py-1 rounded-full"
                                    style={{ background: 'rgba(55,138,221,0.2)', color: '#85b7eb' }}>
                                    En attente
                                </span>
                            )}
                            <span
                                className="text-xs font-bold uppercase px-3 py-1 rounded-full"
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    color: abonnementCarte
                                        ? typeColors[abonnementCarte.type]?.text
                                        : '#888',
                                }}
                            >
                                {abonnementCarte?.type || 'Aucun abonnement'}
                            </span>
                        </div>
                    </div>

                    {/* Nom membre */}
                    <div className="mb-4">
                        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Titulaire</p>
                        <p className="text-white text-lg font-bold tracking-wide">
                            {user?.name?.toUpperCase()}
                        </p>
                    </div>

                    {/* Dates */}
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
                                {abonnementActuel ? 'Depuis' : 'Démarre le'}
                            </p>
                            <p className="text-white text-sm font-medium">
                                {abonnementCarte?.date_debut
                                    ? new Date(abonnementCarte.date_debut).toLocaleDateString('fr-FR')
                                    : '—'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Expire le</p>
                            <p className="text-white text-sm font-medium">
                                {abonnementCarte?.date_fin
                                    ? new Date(abonnementCarte.date_fin).toLocaleDateString('fr-FR')
                                    : '—'}
                            </p>
                        </div>
                        <div className="text-right">
                            <CreditCard size={32} color="rgba(255,255,255,0.3)" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Total dépensé */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 mb-8 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total dépensé depuis l'inscription</p>
                    <p className="text-white text-2xl font-bold">
                        {Number(totalDepense).toLocaleString('fr-FR')}
                        <span className="text-[#e05c3a] text-base ml-1">FCFA</span>
                    </p>
                </div>
                <div className="w-12 h-12 bg-[#e05c3a]/10 rounded-xl flex items-center justify-center">
                    <CreditCard size={22} color="#e05c3a" />
                </div>
            </div>

            {/* Tableau des paiements */}
<div>
    <h2 className="text-white font-semibold mb-4">Historique des paiements</h2>

    {/* Onglets */}
    <div className="flex gap-2 mb-5">
        <button
            onClick={() => setOnglet('abonnements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                onglet === 'abonnements'
                    ? 'bg-[#e05c3a] text-white'
                    : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'
            }`}
        >
            <CreditCard size={14} />
            Abonnements
            {abonnements.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${onglet === 'abonnements' ? 'bg-white/20' : 'bg-[#2d2f45]'}`}>
                    {abonnements.length}
                </span>
            )}
        </button>
        <button
            onClick={() => setOnglet('ponctuels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                onglet === 'ponctuels'
                    ? 'bg-[#e05c3a] text-white'
                    : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'
            }`}
        >
            <Clock size={14} />
            Séances ponctuelles
            {seancesPonctuelles.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${onglet === 'ponctuels' ? 'bg-white/20' : 'bg-[#2d2f45]'}`}>
                    {seancesPonctuelles.length}
                </span>
            )}
        </button>
    </div>

    {/* Contenu onglet Abonnements */}
    {onglet === 'abonnements' && (
        abonnements.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aucun abonnement enregistré</p>
        ) : (
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-160">
                    <thead>
                        <tr className="border-b border-[#2d2f45]">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Type</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Début</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Fin</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Montant</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {abonnements.map((abo) => {
                            const statut      = getStatutAbo(abo)
                            const isActuel    = statut === 'en_cours'
                            const isEnAttente = statut === 'en_attente'
                            const isAnnule    = statut === 'annule'
                            const color       = typeColors[abo.type] || typeColors.mensuel
                            return (
                                <tr key={abo.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                                            style={{ background: `${color.bg}33`, color: color.text }}>
                                            {abo.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">{new Date(abo.date_debut).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">{new Date(abo.date_fin).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 text-[#e05c3a] font-bold text-sm">{Number(abo.montant).toLocaleString('fr-FR')} FCFA</td>
                                    <td className="px-6 py-4">
                                        {isActuel    && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">En cours</span>}
                                        {isEnAttente && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">En attente</span>}
                                        {isAnnule    && <span className="text-xs bg-gray-500/10 text-gray-400 px-2 py-1 rounded-full border border-gray-500/20">Annulé</span>}
                                        {!isActuel && !isEnAttente && !isAnnule && <span className="text-xs bg-gray-500/10 text-gray-400 px-2 py-1 rounded-full border border-gray-500/20">Expiré</span>}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
              </div>
            </div>
        )
    )}

    {/* Contenu onglet Séances ponctuelles */}
    {onglet === 'ponctuels' && (
        seancesPonctuelles.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aucune séance ponctuelle validée</p>
        ) : (
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-160">
                    <thead>
                        <tr className="border-b border-[#2d2f45]">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Tarif</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Horaires</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Montant</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {seancesPonctuelles.map((s) => (
                            <tr key={s.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05] transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#534ab7]/20 text-[#afa9ec]">
                                        {s.tarif_ponctuel?.libelle ?? '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {new Date(s.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                    {s.heure_debut?.slice(0,5)} → {s.heure_fin?.slice(0,5)}
                                </td>
                                <td className="px-6 py-4 text-[#e05c3a] font-bold text-sm">
                                    {Number(s.montant).toLocaleString('fr-FR')} FCFA
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                                        Validée
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
        )
    )}
</div>
            </>
            )}
        </div>
    )
}