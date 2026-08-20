import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Toast from '../../components/Toast'
import Pagination from '../../components/Pagination'
import { getPaiements as fetchPaiementsApi } from '../../api/paiements'
import { DollarSign, Calendar, Search, TrendingUp } from 'lucide-react'

const MOIS_LABELS = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const ANNEES = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const formatMontant = (m) => Number(m).toLocaleString('fr-FR') + ' FCFA'

function BadgeType({ type }) {
    return type === 'abonnement'
        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Abonnement</span>
        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">Ponctuel</span>
}

function CardStat({ label, montant, color }) {
    return (
        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl px-6 py-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>
                {formatMontant(montant)}
            </p>
        </div>
    )
}

export default function Paiements() {
    const [searchParams]              = useSearchParams()
    const [paiements, setPaiements]   = useState([])
    const [totaux, setTotaux]         = useState({ abonnements: 0, ponctuels: 0, global: 0 })
    const [loading, setLoading]       = useState(true)
    const [search, setSearch]         = useState('')
    // Initialisés depuis l'URL (?mois=&annee=) — permet d'arriver déjà
    // filtré depuis un lien externe (ex. carte "Revenus de ce mois" du dashboard)
    const [mois, setMois]             = useState(searchParams.get('mois') || '')
    const [annee, setAnnee]           = useState(searchParams.get('annee') || new Date().getFullYear())
    const [filtre, setFiltre]         = useState('tous')
    const [toast, setToast]           = useState(null)

    // Pagination
    const [page, setPage]         = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [total, setTotal]       = useState(0)

    const fetchPaiements = async () => {
        setLoading(true)
        try {
            const res = await fetchPaiementsApi({
                search: search || undefined,
                mois: mois || undefined,
                annee,
                type: filtre !== 'tous' ? filtre : undefined,
                page,
            })
            setPaiements(res.data.paiements.data)
            setLastPage(res.data.paiements.last_page)
            setTotal(res.data.paiements.total)
            setTotaux(res.data.totaux)
        } catch {
            setToast({ message: 'Erreur lors du chargement', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPaiements() }, [search, mois, annee, filtre, page])
    useEffect(() => { setPage(1) }, [search, mois, annee, filtre])

    // Le total affiché en pied de tableau doit correspondre à l'onglet actif
    const totalFiltre = filtre === 'abonnement' ? totaux.abonnements
        : filtre === 'ponctuel' ? totaux.ponctuels
        : totaux.global

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Paiements</h1>
                <p className="text-gray-500 text-sm mt-1">Historique global des encaissements</p>
            </div>

            {/* Cards stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <CardStat label="Total global"      montant={totaux.global}       color="text-white" />
                <CardStat label="Abonnements"       montant={totaux.abonnements}  color="text-emerald-400" />
                <CardStat label="Séances ponctuelles" montant={totaux.ponctuels}  color="text-orange-400" />
            </div>

            {/* Filtres */}
            <div className="flex gap-3 mb-6 flex-wrap">

                {/* Recherche */}
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher un membre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#1a1a2a] border border-[#2d2f45] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                    />
                </div>

                {/* Mois */}
                <select
                    value={mois}
                    onChange={(e) => setMois(e.target.value)}
                    className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                >
                    <option value="">Tous les mois</option>
                    {MOIS_LABELS.slice(1).map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>

                {/* Année */}
                <select
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                    className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                >
                    {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                {/* Type */}
                {['tous', 'abonnement', 'ponctuel'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFiltre(f)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            filtre === f
                                ? 'bg-[#e05c3a] text-white'
                                : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'
                        }`}
                    >
                        {f === 'tous' ? 'Tous' : f === 'abonnement' ? 'Abonnements' : 'Ponctuels'}
                    </button>
                ))}
            </div>

            {/* Tableau */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="text-center text-gray-500 text-sm py-20">Chargement...</div>
                ) : paiements.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-gray-500">
                        <DollarSign size={32} className="opacity-20" />
                        <p className="text-sm">Aucun paiement trouvé</p>
                    </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-160">
                        <thead>
                            <tr className="border-b border-[#2d2f45]">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Membre</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Type</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Détail</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paiements.map((p) => (
                                <tr key={p.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff04] transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-white text-sm font-medium">{p.membre_nom}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <BadgeType type={p.type} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm">{p.label}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(p.date)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-[#e05c3a] font-bold text-sm">
                                            {formatMontant(p.montant)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Total — porte sur l'ensemble filtré (pas juste la page affichée) */}
                        <tfoot>
                            <tr className="border-t border-[#2d2f45]">
                                <td colSpan={4} className="px-6 py-4 text-gray-500 text-sm">
                                    {total} paiement{total > 1 ? 's' : ''}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-white font-bold text-sm">
                                        {formatMontant(totalFiltre)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                  </div>
                )}
                {!loading && paiements.length > 0 && (
                    <Pagination currentPage={page} lastPage={lastPage} total={total} onPageChange={setPage} />
                )}
            </div>
        </div>
    )
}