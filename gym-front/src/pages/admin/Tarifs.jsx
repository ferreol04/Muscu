import { useState, useEffect } from 'react'
import { getTarifs, updateTarif } from '../../api/tarifs'
import { getTarifsPonctuelsAdmin, createTarifPonctuel, updateTarifPonctuel } from '../../api/ponctuels'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import { DollarSign, Edit2, Check, X, Clock, Plus, Power } from 'lucide-react'

const PLANS = {
    mensuel:     { label: 'Mensuel',     duree: '1 mois',    color: '#378add' },
    trimestriel: { label: 'Trimestriel', duree: '3 mois',    color: '#1d9e75' },
    semestriel:  { label: 'Semestriel',  duree: '6 mois',    color: '#534ab7' },
    annuel:      { label: 'Annuel',      duree: '12 mois',   color: '#ba7517' },
}

// ─── Section abonnements (inchangée) ─────────────────────────────────────────

function SectionAbonnements({ tarifs, onSaved, onToast }) {
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving]       = useState(false)

    const startEdit = (tarif) => { setEditingId(tarif.id); setEditValue(tarif.montant) }
    const cancelEdit = ()     => { setEditingId(null); setEditValue('') }

    const handleSave = async (tarif) => {
        if (!editValue || isNaN(editValue) || Number(editValue) <= 0) {
            onToast('Montant invalide', 'error'); return
        }
        setSaving(true)
        try {
            await updateTarif(tarif.id, { montant: Number(editValue) })
            onSaved()
            setEditingId(null)
            onToast(`Tarif ${tarif.type} mis à jour avec succès`, 'success')
        } catch {
            onToast('Erreur lors de la mise à jour', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {tarifs.map((tarif) => {
                    const plan      = PLANS[tarif.type]
                    const isEditing = editingId === tarif.id

                    return (
                        <div
                            key={tarif.id}
                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 hover:border-[#e05c3a]/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${plan.color}20` }}
                                    >
                                        <DollarSign size={18} style={{ color: plan.color }} />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{plan.label}</p>
                                        <p className="text-gray-500 text-xs">{plan.duree}</p>
                                    </div>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => startEdit(tarif)}
                                        aria-label={`Modifier le tarif ${plan.label}`}
                                        className="w-8 h-8 bg-[#2d2f45] hover:bg-[#e05c3a]/20 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Edit2 size={14} color="#9ca3af" />
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-[#0f1117] border border-[#e05c3a] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none pr-20"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                            FCFA
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(tarif)}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            <Check size={14} />
                                            {saving ? 'Enregistrement...' : 'Confirmer'}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex-1 flex items-center justify-center gap-2 bg-[#0f1117] border border-[#2d2f45] text-gray-400 hover:text-white py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <X size={14} />
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-3xl font-bold" style={{ color: plan.color }}>
                                        {Number(tarif.montant).toLocaleString('fr-FR')}
                                        <span className="text-base text-gray-500 ml-2 font-normal">FCFA</span>
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Soit {Math.round(Number(tarif.montant) / parseInt(plan.duree)).toLocaleString('fr-FR')} FCFA / mois
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 flex items-start gap-3 mb-10">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <DollarSign size={14} color="#ba7517" />
                </div>
                <div>
                    <p className="text-white text-sm font-medium">Important</p>
                    <p className="text-gray-500 text-xs mt-1">
                        La modification d'un tarif s'applique uniquement aux nouveaux abonnements créés après la modification.
                        Les abonnements en cours ne sont pas affectés — le prix payé est conservé dans l'historique.
                    </p>
                </div>
            </div> */}
        </>
    )
}

// ─── Section tarifs ponctuels ─────────────────────────────────────────────────

const PONCTUELS_COLORS = ['#e05c3a', '#1d9e75', '#534ab7']

const INITIAL_TARIF_PONCTUEL = { duree_minutes: 60, montant: '' }

// Le libellé est dérivé automatiquement de la durée choisie (ex: 180 -> "3 heures")
// plutôt que saisi à la main — les tarifs ponctuels existants suivent déjà cette
// convention ("3 heures", "6 heures", "10 heures").
const libelleDepuisDuree = (minutes) => {
    const heures = minutes / 60
    return `${heures} heure${heures > 1 ? 's' : ''}`
}

function SectionPonctuels({ tarifs, onSaved, onToast }) {
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving]       = useState(false)
    const [toggleId, setToggleId]   = useState(null)

    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [createForm, setCreateForm]           = useState(INITIAL_TARIF_PONCTUEL)
    const [createLoading, setCreateLoading]     = useState(false)
    const [createError, setCreateError]         = useState('')

    const startEdit = (t)  => { setEditingId(t.id); setEditValue(t.montant) }
    const cancelEdit = ()  => { setEditingId(null); setEditValue('') }

    const handleSave = async (t) => {
        if (!editValue || isNaN(editValue) || Number(editValue) <= 0) {
            onToast('Montant invalide', 'error'); return
        }
        setSaving(true)
        try {
            await updateTarifPonctuel(t.id, { montant: Number(editValue) })
            onSaved()
            setEditingId(null)
            onToast(`Tarif "${t.libelle}" mis à jour avec succès`, 'success')
        } catch {
            onToast('Erreur lors de la mise à jour', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActif = async (t) => {
        setToggleId(t.id)
        try {
            await updateTarifPonctuel(t.id, { actif: !t.actif })
            onSaved()
            onToast(
                t.actif
                    ? `Tarif "${t.libelle}" désactivé — il ne sera plus proposé aux membres`
                    : `Tarif "${t.libelle}" réactivé`,
                'success'
            )
        } catch {
            onToast('Erreur lors du changement de statut', 'error')
        } finally {
            setToggleId(null)
        }
    }

    const openCreateModal  = () => { setCreateForm(INITIAL_TARIF_PONCTUEL); setCreateError(''); setCreateModalOpen(true) }
    const closeCreateModal = () => setCreateModalOpen(false)

    const handleCreate = async (e) => {
        e.preventDefault()
        setCreateLoading(true)
        setCreateError('')
        try {
            await createTarifPonctuel({
                libelle:        libelleDepuisDuree(Number(createForm.duree_minutes)),
                duree_minutes:  Number(createForm.duree_minutes),
                montant:        Number(createForm.montant),
            })
            onSaved()
            closeCreateModal()
            onToast('Tarif ponctuel créé avec succès', 'success')
        } catch (err) {
            const errors = err.response?.data?.errors
            setCreateError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setCreateLoading(false)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-white text-lg font-bold flex items-center gap-2">
                        <Clock size={18} className="text-[#e05c3a]" />
                        Séances ponctuelles
                    </h2>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
                >
                    <Plus size={14} />
                    Nouveau tarif
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {tarifs.map((t, i) => {
                    const color     = PONCTUELS_COLORS[i % PONCTUELS_COLORS.length]
                    const isEditing = editingId === t.id
                    const isActif   = Boolean(t.actif)
                    const isToggling = toggleId === t.id

                    return (
                        <div
                            key={t.id}
                            className={`bg-[#1a1a2a] border rounded-2xl p-6 transition-colors ${
                                isActif ? 'border-[#2d2f45] hover:border-[#e05c3a]/30' : 'border-[#2d2f45] opacity-60'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${color}20` }}
                                    >
                                        <Clock size={18} style={{ color }} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-semibold">{t.libelle}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                                isActif
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                                {isActif ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {!isEditing && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggleActif(t)}
                                            disabled={isToggling}
                                            title={isActif ? 'Désactiver' : 'Activer'}
                                            aria-label={`${isActif ? 'Désactiver' : 'Activer'} le tarif ${t.libelle}`}
                                            className="w-8 h-8 bg-[#2d2f45] hover:bg-[#e05c3a]/20 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                                        >
                                            <Power size={14} color="#9ca3af" />
                                        </button>
                                        <button
                                            onClick={() => startEdit(t)}
                                            aria-label={`Modifier le tarif ${t.libelle}`}
                                            className="w-8 h-8 bg-[#2d2f45] hover:bg-[#e05c3a]/20 rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <Edit2 size={14} color="#9ca3af" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-[#0f1117] border border-[#e05c3a] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none pr-20"
                                            autoFocus
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                            FCFA
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(t)}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            <Check size={14} />
                                            {saving ? 'Enregistrement...' : 'Confirmer'}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex-1 flex items-center justify-center gap-2 bg-[#0f1117] border border-[#2d2f45] text-gray-400 hover:text-white py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <X size={14} />
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-3xl font-bold" style={{ color }}>
                                        {Number(t.montant).toLocaleString('fr-FR')}
                                        <span className="text-base text-gray-500 ml-2 font-normal">FCFA</span>
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Soit {Math.round(Number(t.montant) / (t.duree_minutes / 60)).toLocaleString('fr-FR')} FCFA / heure
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Modal création tarif ponctuel */}
            <Modal isOpen={createModalOpen} onClose={closeCreateModal} title="Nouveau tarif ponctuel">
                <form onSubmit={handleCreate} className="space-y-4">
                    {createError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {createError}
                        </div>
                    )}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Durée</label>
                        <select
                            value={createForm.duree_minutes}
                            onChange={(e) => setCreateForm({ ...createForm, duree_minutes: Number(e.target.value) })}
                            required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                <option key={h} value={h * 60}>{h} heure{h > 1 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Montant (FCFA)</label>
                        <input
                            type="number"
                            min="0"
                            value={createForm.montant}
                            onChange={(e) => setCreateForm({ ...createForm, montant: e.target.value })}
                            required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={createLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {createLoading ? 'Création...' : 'Créer le tarif'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Tarifs() {
    const [tarifs, setTarifs]                   = useState([])
    const [tarifsPonctuels, setTarifsPonctuels] = useState([])
    const [loading, setLoading]                 = useState(true)
    const [toast, setToast]                     = useState(null)

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3500)
    }

    const fetchTarifs = async () => {
        const res = await getTarifs()
        setTarifs(res.data)
    }

    const fetchPonctuels = async () => {
        const res = await getTarifsPonctuelsAdmin()
        setTarifsPonctuels(res.data)
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([fetchTarifs(), fetchPonctuels()])
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header — visible immédiatement, ne dépend pas du chargement des tarifs */}
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold">Tarifs</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Gérez les prix des abonnements. Les modifications s'appliquent aux nouveaux abonnements uniquement.
                </p>
            </div>

            {loading ? (
                <>
                    {/* Squelette cartes abonnements — même grille/taille que les vraies cartes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-[#2d2f45] rounded-xl shrink-0" />
                                    <div className="space-y-2">
                                        <div className="h-3 bg-[#2d2f45] rounded w-24" />
                                        <div className="h-2 bg-[#2d2f45] rounded w-16" />
                                    </div>
                                </div>
                                <div className="h-7 bg-[#2d2f45] rounded w-2/3" />
                            </div>
                        ))}
                    </div>

                    {/* Squelette cartes séances ponctuelles */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 bg-[#2d2f45] rounded w-48 animate-pulse" />
                        <div className="h-9 bg-[#2d2f45] rounded-xl w-36 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-[#2d2f45] rounded-xl shrink-0" />
                                    <div className="space-y-2">
                                        <div className="h-3 bg-[#2d2f45] rounded w-20" />
                                        <div className="h-2 bg-[#2d2f45] rounded w-14" />
                                    </div>
                                </div>
                                <div className="h-7 bg-[#2d2f45] rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <SectionAbonnements
                        tarifs={tarifs}
                        onSaved={fetchTarifs}
                        onToast={showToast}
                    />

                    <SectionPonctuels
                        tarifs={tarifsPonctuels}
                        onSaved={fetchPonctuels}
                        onToast={showToast}
                    />

                    {/* Note importante — commune aux deux sections */}
                    <div className="mt-8 bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                            <DollarSign size={14} color="#ba7517" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">Important</p>
                            <p className="text-gray-500 text-xs mt-1">
                                Les modifications de tarifs s'appliquent uniquement aux nouveaux abonnements et aux nouvelles
                                séances ponctuelles créés après la modification. Les abonnements en cours et les séances
                                déjà validées ne sont pas affectés — le prix payé est conservé dans l'historique.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}