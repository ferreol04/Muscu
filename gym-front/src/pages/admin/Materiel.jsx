import { useState, useEffect } from 'react'
import { getMateriels, createMateriel, updateMateriel, deleteMateriel, getSignalements, traiterSignalement } from '../../api/materiel'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import { useSignalements } from '../../context/useSignalements'
import { Wrench, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const CATEGORIES = {
    cardio:                'Cardio',
    musculation:           'Musculation',
    machines_guidees:      'Machines guidées',
    accessoires:           'Accessoires',
    mobilier:              'Mobilier',
    vestiaires_sanitaires: 'Vestiaires & Sanitaires',
    electromenager:        'Électroménager',
    securite:              'Sécurité',
}

const STATUTS_MATERIEL = {
    disponible:   { label: 'Disponible',   bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    maintenance:  { label: 'Maintenance',  bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
    hors_service: { label: 'Hors service', bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400'     },
}

const STATUTS_SIGNALEMENT = {
    en_attente: { label: 'En attente',    bg: 'bg-red-500/10',     text: 'text-red-400'     },
    en_cours:   { label: 'En maintenance',bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
    resolu:     { label: 'Résolu',        bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
}

const INITIAL_FORM = { nom: '', categorie: 'cardio', quantite: 1, statut: 'disponible', description: '', caracteristiques: '' }

function BadgeStatut({ statut }) {
    const s = STATUTS_MATERIEL[statut] ?? STATUTS_MATERIEL.disponible
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    )
}

export default function Materiel() {
    const { refresh: refreshBadgeSignalements } = useSignalements()
    const [materiels, setMateriels]                 = useState([])
    const [signalements, setSignalements]           = useState([])
    const [totalSignalements, setTotalSignalements] = useState(0)
    const [loading, setLoading]                     = useState(true)
    const [onglet, setOnglet]                       = useState('materiels')
    const [filtreCategorie, setFiltreCategorie]     = useState('')
    const [filtreStatut, setFiltreStatut]           = useState('')
    const [filtreSignalement, setFiltreSignalement] = useState('en_attente')
    const [modalOpen, setModalOpen]                 = useState(false)
    const [editMateriel, setEditMateriel]           = useState(null)
    const [form, setForm]                           = useState(INITIAL_FORM)
    const [formLoading, setFormLoading]             = useState(false)
    const [formError, setFormError]                 = useState('')
    const [confirmOpen, setConfirmOpen]             = useState(false)
    const [deleteId, setDeleteId]                   = useState(null)
    const [toast, setToast]                         = useState(null)
    const [traitementId, setTraitementId]           = useState(null)
    const [detailMateriel, setDetailMateriel]       = useState(null)

    // Pagination (onglet Signalements)
    const [page, setPage]         = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [totalPage, setTotalPage] = useState(0)

    // Pagination (onglet Équipements)
    const [materielPage, setMaterielPage]         = useState(1)
    const [materielLastPage, setMaterielLastPage] = useState(1)
    const [materielTotal, setMaterielTotal]       = useState(0)

    const fetchMateriels = async () => {
        try {
            const res = await getMateriels({ categorie: filtreCategorie, statut: filtreStatut, page: materielPage })
            setMateriels(res.data.materiels.data)
            setMaterielLastPage(res.data.materiels.last_page)
            setMaterielTotal(res.data.materiels.total)
            setTotalSignalements(res.data.total_signalements)
        } catch {
            setToast({ message: 'Erreur chargement matériels', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const fetchSignalements = async () => {
        try {
            const res = await getSignalements({ statut: filtreSignalement || undefined, page })
            setSignalements(res.data.data)
            setLastPage(res.data.last_page)
            setTotalPage(res.data.total)
        } catch {
            setToast({ message: 'Erreur chargement signalements', type: 'error' })
        }
    }

    useEffect(() => { fetchMateriels() }, [filtreCategorie, filtreStatut, materielPage])
    useEffect(() => { setMaterielPage(1) }, [filtreCategorie, filtreStatut])
    useEffect(() => { fetchSignalements() }, [filtreSignalement, page])
    useEffect(() => { setPage(1) }, [filtreSignalement])

    const openCreate = () => {
        setEditMateriel(null)
        setForm(INITIAL_FORM)
        setFormError('')
        setModalOpen(true)
    }

    const openEdit = (m) => {
        setEditMateriel(m)
        setForm({
            nom: m.nom, categorie: m.categorie, quantite: m.quantite,
            statut: m.statut, description: m.description || '',
            caracteristiques: m.caracteristiques || '',
        })
        setFormError('')
        setModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        setFormError('')
        try {
            if (editMateriel) {
                await updateMateriel(editMateriel.id, form)
                setToast({ message: 'Matériel modifié avec succès', type: 'success' })
            } else {
                await createMateriel(form)
                setToast({ message: 'Matériel ajouté avec succès', type: 'success' })
            }
            await fetchMateriels()
            setModalOpen(false)
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteMateriel(deleteId)
            await fetchMateriels()
            setToast({ message: 'Matériel supprimé', type: 'success' })
        } catch {
            setToast({ message: 'Erreur lors de la suppression', type: 'error' })
        } finally {
            setConfirmOpen(false)
            setDeleteId(null)
        }
    }

    const handleTraiter = async (id, statut) => {
        setTraitementId(id)
        try {
            await traiterSignalement(id, { statut })
            await Promise.all([fetchMateriels(), fetchSignalements()])
            refreshBadgeSignalements()
            setToast({
                message: statut === 'resolu' ? 'Signalement résolu ✓' : 'Matériel mis en maintenance',
                type: 'success'
            })
        } catch {
            setToast({ message: 'Erreur lors du traitement', type: 'error' })
        } finally {
            setTraitementId(null)
        }
    }

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmModal
                isOpen={confirmOpen}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setDeleteId(null) }}
                message="Supprimer ce matériel ? Tous les signalements associés seront supprimés."
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-white text-2xl font-bold">Matériel</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestion des équipements de la salle</p>
                </div>
                {onglet === 'materiels' && (
                    <button onClick={openCreate} className="flex items-center gap-2 bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                        <Plus size={14} />
                        Nouveau matériel
                    </button>
                )}
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setOnglet('materiels')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${onglet === 'materiels' ? 'bg-[#e05c3a] text-white' : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'}`}
                >
                    Équipements
                </button>
                <button
                    onClick={() => setOnglet('signalements')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${onglet === 'signalements' ? 'bg-[#e05c3a] text-white' : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'}`}
                >
                    Signalements
                    {totalSignalements > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${onglet === 'signalements' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                            {totalSignalements}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Onglet Équipements ── */}
            {onglet === 'materiels' && (
                <>
                    <div className="flex gap-3 mb-6 flex-wrap">
                        <select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)}
                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                            <option value="">Toutes les catégories</option>
                            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}
                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                            <option value="">Tous les statuts</option>
                            <option value="disponible">Disponible</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="hors_service">Hors service</option>
                        </select>
                    </div>

                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="text-center text-gray-500 text-sm py-20">Chargement...</div>
                        ) : materiels.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-2 text-gray-500">
                                <Wrench size={32} className="opacity-20" />
                                <p className="text-sm">Aucun matériel trouvé</p>
                            </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-180">
                                <thead>
                                    <tr className="border-b border-[#2d2f45]">
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Équipement</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Catégorie</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Quantité</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Signalements</th>
                                        <th className="px-6 py-4" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiels.map((m) => (
                                        <tr
                                            key={m.id}
                                            onClick={() => setDetailMateriel(m)}
                                            className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff04] transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-white text-sm font-medium">{m.nom}</p>
                                                {m.caracteristiques && <p className="text-[#e05c3a] text-xs mt-0.5">{m.caracteristiques}</p>}
                                                {m.description && (
                                                    <p className="text-gray-500 text-xs mt-0.5 truncate max-w-48">
                                                        {m.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 text-sm">{CATEGORIES[m.categorie] ?? m.categorie}</td>
                                            <td className="px-6 py-4 text-gray-300 text-sm font-mono">{m.quantite}</td>
                                            <td className="px-6 py-4"><BadgeStatut statut={m.statut} /></td>
                                            <td className="px-6 py-4">
                                                {m.signalements_en_attente > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                                                        <AlertTriangle size={12} />
                                                        {m.signalements_en_attente} en attente
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 text-base">Aucun</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-3 justify-end">
                                                    <button onClick={() => openEdit(m)} aria-label={`Modifier ${m.nom}`} className="text-gray-500 hover:text-[#e05c3a] transition-colors">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => { setDeleteId(m.id); setConfirmOpen(true) }} aria-label={`Supprimer ${m.nom}`} className="text-gray-500 hover:text-red-400 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                        )}
                        <Pagination currentPage={materielPage} lastPage={materielLastPage} total={materielTotal} onPageChange={setMaterielPage} />
                    </div>
                </>
            )}

            {/* ── Onglet Signalements ── */}
            {onglet === 'signalements' && (
                <>
                    <div className="flex gap-2 mb-6">
                        {[  
                            { val: '',           label: 'Tous' },
                            { val: 'en_attente', label: 'En attente' },
                            { val: 'en_cours',   label: 'En maintenance' },
                            { val: 'resolu',     label: 'Résolus' },
                        ].map(({ val, label }) => (
                            <button key={val} onClick={() => setFiltreSignalement(val)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filtreSignalement === val ? 'bg-[#e05c3a] text-white' : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {signalements.length === 0 ? (
                            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl py-16 flex flex-col items-center gap-2 text-gray-500">
                                <CheckCircle size={32} className="opacity-20" />
                                <p className="text-sm">Aucun signalement</p>
                            </div>
                        ) : signalements.map((s) => {
                            const st = STATUTS_SIGNALEMENT[s.statut] ?? STATUTS_SIGNALEMENT.en_attente
                            const enTraitement = traitementId === s.id
                            return (
                                <div key={s.id} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="text-white font-semibold text-sm">{s.materiel?.nom ?? '—'}</p>
                                                {s.materiel?.caracteristiques && (
                                                    <span className="text-[#e05c3a] text-xs">{s.materiel.caracteristiques}</span>
                                                )}
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${st.bg} ${st.text}`}>
                                                    {st.label}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm mb-2">{s.description}</p>
                                            <div className="flex items-center gap-3 text-gray-500 text-xs flex-wrap">
                                                <Clock size={11} />
                                                <span>Signalé par <span className="text-gray-300">{s.user?.name ?? '—'}</span></span>
                                                <span>·</span>
                                                <span>{new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                {s.resolu_at && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="text-emerald-400">Résolu le {new Date(s.resolu_at).toLocaleDateString('fr-FR')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions admin */}
                                        {s.statut === 'en_attente' && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleTraiter(s.id, 'en_cours')}
                                                    disabled={enTraitement}
                                                    className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    <Wrench size={12} />
                                                    {enTraitement ? '...' : 'Maintenance'}
                                                </button>
                                                <button
                                                    onClick={() => handleTraiter(s.id, 'resolu')}
                                                    disabled={enTraitement}
                                                    className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle size={12} />
                                                    {enTraitement ? '...' : 'Résoudre'}
                                                </button>
                                            </div>
                                        )}
                                        {s.statut === 'en_cours' && (
                                            <button
                                                onClick={() => handleTraiter(s.id, 'resolu')}
                                                disabled={enTraitement}
                                                className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                                            >
                                                <CheckCircle size={12} />
                                                {enTraitement ? '...' : 'Marquer résolu'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {signalements.length > 0 && (
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl mt-4 overflow-hidden">
                            <Pagination currentPage={page} lastPage={lastPage} total={totalPage} onPageChange={setPage} />
                        </div>
                    )}
                </>
            )}

            {/* Modal détail matériel */}
            <Modal isOpen={!!detailMateriel} onClose={() => setDetailMateriel(null)} title={detailMateriel?.nom}>
                {detailMateriel && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <BadgeStatut statut={detailMateriel.statut} />
                            <span className="text-gray-400 text-sm">{CATEGORIES[detailMateriel.categorie] ?? detailMateriel.categorie}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl p-4">
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quantité</p>
                                <p className="text-white font-bold text-lg">{detailMateriel.quantite}</p>
                            </div>
                            <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl p-4">
                                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Signalements en attente</p>
                                <p className={`font-bold text-lg ${detailMateriel.signalements_en_attente > 0 ? 'text-red-400' : 'text-white'}`}>
                                    {detailMateriel.signalements_en_attente || 0}
                                </p>
                            </div>
                        </div>

                        {detailMateriel.caracteristiques && (
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Caractéristiques</p>
                                <p className="text-[#e05c3a] text-sm">{detailMateriel.caracteristiques}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Description</p>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {detailMateriel.description || 'Aucune description'}
                            </p>
                        </div>

                        <button
                            onClick={() => { openEdit(detailMateriel); setDetailMateriel(null) }}
                            className="w-full flex items-center justify-center gap-2 bg-[#e05c3a]/10 border border-[#e05c3a]/30 text-[#e05c3a] hover:bg-[#e05c3a]/20 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Edit2 size={14} />
                            Modifier ce matériel
                        </button>
                    </div>
                )}
            </Modal>

            {/* Modal créer/modifier */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMateriel ? 'Modifier le matériel' : 'Nouveau matériel'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{formError}</div>
                    )}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Nom</label>
                        <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required placeholder="Ex: Tapis de course"
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Caractéristiques</label>
                        <input value={form.caracteristiques} onChange={(e) => setForm({ ...form, caracteristiques: e.target.value })} placeholder="Ex: 20 kg, Vitesse max 20 km/h..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Catégorie</label>
                            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Quantité</label>
                            <input type="number" min="1" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: parseInt(e.target.value) })} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Statut</label>
                        <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                            <option value="disponible">Disponible</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="hors_service">Hors service</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Description (optionnel)</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                            placeholder="Emplacement dans la salle, marque, modèle..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors resize-none" />
                    </div>
                    <button type="submit" disabled={formLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                        {formLoading ? 'Enregistrement...' : editMateriel ? 'Modifier' : 'Ajouter le matériel'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}