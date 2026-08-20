import { useState, useEffect } from 'react'
import {
    getSeancesPonctuelles,
    validerSeance,
    annulerSeanceAdmin,
    modifierHeureSeance,
} from '../../api/ponctuels'
import Toast from '../../components/Toast'
import Pagination from '../../components/Pagination'
import { usePonctuelles } from '../../context/usePonctuelles'
import { Clock, Check, X, Edit2 } from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUTS = {
    en_attente: { label: 'En attente', bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
    validee:    { label: 'Validée',    bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    annulee:    { label: 'Annulée',    bg: 'bg-gray-500/10',    text: 'text-gray-400',    dot: 'bg-gray-400'    },
}

const FILTRES       = ['tous', 'en_attente', 'validee', 'annulee']
const FILTRE_LABELS = { tous: 'Tous', en_attente: 'En attente', validee: 'Validées', annulee: 'Annulées' }

const formatDate  = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatHeure = (h) => (h ? h.slice(0, 5) : '—')

// ─── Badge statut ─────────────────────────────────────────────────────────────

function BadgeStatut({ statut }) {
    const s = STATUTS[statut] ?? STATUTS.annulee
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    )
}

// ─── Modal modifier heure ─────────────────────────────────────────────────────

function ModalModifierHeure({ seance, onClose, onSaved, onToast }) {
    const [heure, setHeure]   = useState(seance.heure_debut?.slice(0, 5) ?? '')
    const [saving, setSaving] = useState(false)


    const handleSave = async () => {
        if (!heure) return
        setSaving(true)
        try {
            await modifierHeureSeance(seance.id, { heure_debut: heure })
            onToast('Heure modifiée avec succès', 'success')
            onSaved()
            onClose()
        } catch {
            onToast('Erreur lors de la modification', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold">Modifier l'heure de début</h3>
                    <button onClick={onClose} aria-label="Fermer" className="p-1.5 text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="mb-2">
                    <p className="text-gray-400 text-xs mb-1">
                        Membre : <span className="text-white">{seance.membre?.user?.name ?? '—'}</span>
                    </p>
                    <p className="text-gray-400 text-xs mb-4">
                        Date : <span className="text-white">{formatDate(seance.date)}</span>
                    </p>
                </div>

                <label className="block text-gray-400 text-xs mb-1.5">Nouvelle heure de début</label>
                <input
                    type="time"
                    value={heure}
                    onChange={(e) => setHeure(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2d2f45] focus:border-[#e05c3a] rounded-xl px-4 py-3 text-white outline-none transition-colors mb-1"
                    autoFocus
                />
                <p className="text-gray-500 text-xs mb-5">
                    L'heure de fin sera recalculée automatiquement.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !heure}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#e05c3a] hover:bg-[#c94e2e] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        <Check size={14} />
                        {saving ? 'Enregistrement...' : 'Confirmer'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0f1117] border border-[#2d2f45] text-gray-400 hover:text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Ligne séance ─────────────────────────────────────────────────────────────

function LigneSeance({ seance, onAction, onModifierHeure }) {
    const [loading, setLoading] = useState(null)
    

    const handleValider = async () => {
        setLoading('valider')
        await onAction(() => validerSeance(seance.id), 'Séance validée ✓', 'Erreur lors de la validation')
        setLoading(null)
    }

    // Remplace handleAnnuler dans LigneSeance par :
const handleAnnuler = async () => {
    setLoading('annuler')
    await onAction(
        () => annulerSeanceAdmin(seance.id),
        'Séance annulée',
        "Erreur lors de l'annulation"
    )
    setLoading(null)
}

    const peutAgir = seance.statut === 'en_attente'

    return (
        <tr className="border-b border-[#2d2f45] hover:bg-[#ffffff04] transition-colors">
            <td className="px-5 py-4">
                <p className="text-white font-medium text-sm">{seance.membre?.user?.name ?? '—'}</p>
                <p className="text-gray-500 text-xs">{seance.membre?.user?.email ?? ''}</p>
            </td>
            <td className="px-5 py-4 text-gray-300 text-sm">{formatDate(seance.date)}</td>
            <td className="px-5 py-4 text-gray-300 text-sm">{seance.tarif_ponctuel?.libelle ?? '—'}</td>
            <td className="px-5 py-4">
                <span className="text-gray-300 text-sm font-mono">
                    {formatHeure(seance.heure_debut)} → {formatHeure(seance.heure_fin)}
                </span>
            </td>
            <td className="px-5 py-4 text-[#e05c3a] font-bold text-sm">
                {Number(seance.montant).toLocaleString('fr-FR')}
                <span className="text-gray-500 font-normal text-xs ml-1">FCFA</span>
            </td>
            <td className="px-5 py-4">
                <BadgeStatut statut={seance.statut} />
            </td>
            <td className="px-5 py-4">
                {peutAgir && (
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={() => onModifierHeure(seance)}
                            className="w-7 h-7 bg-[#2d2f45] hover:bg-[#e05c3a]/20 rounded-lg flex items-center justify-center transition-colors"
                            title="Modifier l'heure"
                            aria-label="Modifier l'heure"
                        >
                            <Edit2 size={12} color="#9ca3af" />
                        </button>
                        <button
                            onClick={handleValider}
                            disabled={!!loading}
                            className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            <Check size={12} />
                            {loading === 'valider' ? '...' : 'Valider'}
                        </button>
                        <button
                            onClick={handleAnnuler}
                            disabled={!!loading}
                            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            <X size={12} />
                            {loading === 'annuler' ? '...' : 'Annuler'}
                        </button>
                    </div>
                )}
            </td>
        </tr>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SeancesPonctuelles() {
    const { refresh: refreshBadgePonctuelles } = usePonctuelles()
    const [seances, setSeances]         = useState([])
    const [counts, setCounts]           = useState({})
    const [loading, setLoading]         = useState(true)
    const [filtre, setFiltre]           = useState('tous')
    const [modalSeance, setModalSeance] = useState(null)
    const [toast, setToast]             = useState(null)

    // Pagination
    const [page, setPage]         = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [total, setTotal]       = useState(0)

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchSeances = async () => {
        try {
            const params = { page, ...(filtre !== 'tous' ? { statut: filtre } : {}) }
            const res    = await getSeancesPonctuelles(params)
            setSeances(res.data.seances.data)
            setLastPage(res.data.seances.last_page)
            setTotal(res.data.seances.total)
            setCounts(res.data.counts)
        } catch {
            showToast('Erreur lors du chargement', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { setLoading(true); fetchSeances() }, [filtre, page])
    useEffect(() => { setPage(1) }, [filtre])

    const handleAction = async (apiFn, successMsg, errorMsg) => {
        try {
            await apiFn()
            showToast(successMsg, 'success')
            fetchSeances()
            refreshBadgePonctuelles()
        } catch {
            showToast(errorMsg, 'error')
        }
    }

    const totalEnAttente = counts['en_attente'] ?? 0

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {modalSeance && (
                <ModalModifierHeure
                    seance={modalSeance}
                    onClose={() => setModalSeance(null)}
                    onSaved={fetchSeances}
                    onToast={showToast}
                />
            )}

            <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Séances ponctuelles</h1>
                <p className="text-gray-500 text-sm mt-1">Gérez les demandes de séances ponctuelles des membres.</p>
            </div>

            {totalEnAttente > 0 && (
                <div className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3.5">
                    <Clock size={16} className="text-blue-400 shrink-0" />
                    <p className="text-blue-300 text-sm">
                        <span className="font-bold">{totalEnAttente}</span> demande{totalEnAttente > 1 ? 's' : ''} en attente de validation.
                    </p>
                </div>
            )}

            <div className="flex gap-2 mb-6 flex-wrap">
                {FILTRES.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFiltre(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            filtre === f
                                ? 'bg-[#e05c3a] text-white'
                                : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'
                        }`}
                    >
                        {FILTRE_LABELS[f]}
                        {f !== 'tous' && counts[f] ? (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${filtre === f ? 'bg-white/20' : 'bg-[#2d2f45]'}`}>
                                {counts[f]}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="text-center text-gray-500 text-sm py-20">Chargement...</div>
                ) : seances.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-gray-500">
                        <Clock size={32} className="opacity-20" />
                        <p className="text-sm">Aucune séance {filtre !== 'tous' ? FILTRE_LABELS[filtre].toLowerCase() : ''}</p>
                    </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-180 text-sm">
                        <thead>
                            <tr className="border-b border-[#2d2f45]">
                                <th className="text-left px-5 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Membre</th>
                                <th className="text-left px-5 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Date</th>
                                <th className="text-left px-5 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Durée</th>
                                <th className="text-left px-5 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Horaires</th>
                                <th className="text-left px-5 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Montant</th>
                                <th className="text-left px-5 py-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Statut</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {seances.map((s) => (
                                <LigneSeance
                                    key={s.id}
                                    seance={s}
                                    onAction={handleAction}
                                    onModifierHeure={setModalSeance}
                                />
                            ))}
                        </tbody>
                    </table>
                  </div>
                )}
                {!loading && seances.length > 0 && (
                    <Pagination currentPage={page} lastPage={lastPage} total={total} onPageChange={setPage} />
                )}
            </div>
        </div>
    )
}