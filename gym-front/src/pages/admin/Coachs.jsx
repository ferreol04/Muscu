import { useState, useEffect } from 'react'
import { getCoachs, createCoach, updateCoach, deleteCoach } from '../../api/membres'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import Badge from '../../components/Badge'
import Pagination from '../../components/Pagination'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { UserCheck, Mail, Phone, Star } from 'lucide-react'

const INITIAL_FORM = {
    nom: '', prenom: '', email: '', telephone: '', specialite: '', bio: '',
}

export default function Coachs() {
    const navigate                            = useNavigate()
    const [searchParams]                      = useSearchParams()
    const [coachs, setCoachs]                 = useState([])
    const [loading, setLoading]               = useState(true)
    const [modalOpen, setModalOpen]           = useState(false)
    const [form, setForm]                     = useState(INITIAL_FORM)
    const [formLoading, setFormLoading]       = useState(false)
    const [error, setError]                   = useState('')
    const [toast, setToast]                   = useState(null)
    const [confirmOpen, setConfirmOpen]       = useState(false)
    const [coachToDelete, setCoachToDelete]   = useState(null)
    const [editModalOpen, setEditModalOpen]   = useState(false)
    const [coachToEdit, setCoachToEdit]       = useState(null)
    const [editForm, setEditForm]             = useState({})
    const [editLoading, setEditLoading]       = useState(false)
    const [editError, setEditError]           = useState('')
    const [search, setSearch]                 = useState('')
    // Initialisé depuis l'URL (?statut=...) — permet d'arriver déjà filtré
    // depuis un lien externe (ex. les cartes cliquables du dashboard admin)
    const [filtreStatut, setFiltreStatut]     = useState(searchParams.get('statut') || '')
    const [page, setPage]                     = useState(1)
    const [lastPage, setLastPage]             = useState(1)
    const [total, setTotal]                   = useState(0)

    const fetchCoachs = async () => {
        setLoading(true)
        try {
            const res = await getCoachs({ search, statut: filtreStatut, page })
            setCoachs(res.data.data)
            setLastPage(res.data.last_page)
            setTotal(res.data.total)
        } catch {
            console.error('Erreur chargement coachs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchCoachs(), 0)
    }, [search, filtreStatut, page])

    // Revient à la page 1 quand un filtre change
    useEffect(() => {
        setPage(1)
    }, [search, filtreStatut])

    const handleChange      = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleEditChange  = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        setError('')
        try {
            await createCoach(form)
            fetchCoachs()
            closeModal()
            setToast({ message: 'Coach créé avec succès. Un email a été envoyé.', type: 'success' })
        } catch (err) {
            const errors = err.response?.data?.errors
            setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteCoach(coachToDelete)
            fetchCoachs()
            setToast({ message: 'Coach supprimé avec succès.', type: 'success' })
        } catch {
            setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        } finally {
            setConfirmOpen(false)
            setCoachToDelete(null)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditLoading(true)
        setEditError('')
        try {
            await updateCoach(coachToEdit.id, editForm)
            fetchCoachs()
            closeEditModal()
            setToast({ message: 'Coach modifié avec succès', type: 'success' })
        } catch (err) {
            const errors = err.response?.data?.errors
            setEditError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setEditLoading(false)
        }
    }

    const closeModal = () => {
        setModalOpen(false)
        setForm(INITIAL_FORM)
        setError('')
    }

    const openEditModal = (coach) => {
        setCoachToEdit(coach)
        setEditForm({
            nom:        coach.nom,
            prenom:     coach.prenom,
            telephone:  coach.telephone || '',
            specialite: coach.specialite || '',
            bio:        coach.bio || '',
            statut:     coach.statut,
            date_naissance: coach.date_naissance || '',
        })
        setEditModalOpen(true)
    }

    const closeEditModal = () => {
        setEditModalOpen(false)
        setCoachToEdit(null)
        setEditForm({})
        setEditError('')
    }

    return (
        <div className="p-6">

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setCoachToDelete(null) }}
                message="Voulez-vous vraiment supprimer ce coach ? Son compte sera supprimé."
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-white text-2xl font-bold">Coachs</h1>
                    <p className="text-gray-500 text-sm mt-1">{total} coach{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                    + Nouveau coach
                </button>
            </div>

            {/* Recherche + filtre statut */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <input
                    type="text"
                    placeholder="Rechercher un coach..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                />
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="en_attente">En attente</option>
                    <option value="suspendu">Suspendu</option>
                </select>
            </div>

            {/* Grille des coachs — pendant le chargement, des cartes vides de même taille que les vraies évitent tout saut de mise en page */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#2d2f45] shrink-0" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-3 bg-[#2d2f45] rounded w-2/3" />
                                    <div className="h-2 bg-[#2d2f45] rounded w-1/2" />
                                </div>
                                <div className="h-5 w-14 bg-[#2d2f45] rounded-full shrink-0" />
                            </div>
                            <div className="h-2 bg-[#2d2f45] rounded w-1/3 mb-4" />
                            <div className="flex items-center justify-between pt-3 border-t border-[#2d2f45]">
                                <div className="h-2 bg-[#2d2f45] rounded w-1/4" />
                                <div className="h-2 bg-[#2d2f45] rounded w-1/5" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : coachs.length === 0 ? (
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-12 text-center">
                    <UserCheck size={40} color="#2d2f45" className="mx-auto mb-4" />
                    <p className="text-gray-500">{search || filtreStatut ? 'Aucun résultat' : 'Aucun coach enregistré'}</p>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coachs.map((coach) => (
                        <div
                            key={coach.id}
                            onClick={() => navigate(`/admin/coachs/${coach.id}`)}
                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 hover:border-[#e05c3a]/30 transition-colors cursor-pointer"
                        >
                            {/* Avatar + infos */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#1d9e75]/20 text-[#1d9e75] flex items-center justify-center text-lg font-bold shrink-0">
                                    {coach.prenom?.[0]}{coach.nom?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold truncate">{coach.prenom} {coach.nom}</p>
                                    <p className="text-gray-500 text-xs truncate">{coach.email}</p>
                                </div>
                                <div className="shrink-0">
                                    <Badge statut={coach.statut} />
                                </div>
                            </div>

                            {/* Spécialité */}
                            {coach.specialite && (
                                <div className="flex items-center gap-2 mb-3">
                                    <Star size={12} color="#ba7517" />
                                    <span className="text-amber-400 text-xs font-medium">{coach.specialite}</span>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-between pt-3 border-t border-[#2d2f45]">
                                <div className="flex items-center gap-2">
                                    <UserCheck size={13} color="#6b7280" />
                                    <span className="text-gray-400 text-xs">
                                        {coach.membres_count} membre{coach.membres_count > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => openEditModal(coach)}
                                        className="text-gray-500 hover:text-[#e05c3a] transition-colors text-xs"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => { setCoachToDelete(coach.id); setConfirmOpen(true) }}
                                        className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Pagination currentPage={page} lastPage={lastPage} total={total} onPageChange={setPage} />
                </>
            )}

            {/* Modal création coach */}
            <Modal isOpen={modalOpen} onClose={closeModal} title="Nouveau coach">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Prénom</label>
                            <input name="prenom" value={form.prenom} onChange={handleChange} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Nom</label>
                            <input name="nom" value={form.nom} onChange={handleChange} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Téléphone</label>
                            <input name="telephone" value={form.telephone} onChange={handleChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Spécialité</label>
                            <input name="specialite" value={form.specialite} onChange={handleChange}
                                placeholder="Musculation, Cardio..."
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                            Date de naissance
                        </label>
                        <input
                            name="date_naissance"
                            type="date"
                            value={form.date_naissance || ''}
                            onChange={handleChange}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Bio</label>
                        <textarea name="bio" value={form.bio} onChange={handleChange}
                            placeholder="Présentation du coach..."
                            rows={3}
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors resize-none" />
                    </div>

                    <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {formLoading ? 'Création...' : 'Créer le coach'}
                    </button>
                </form>
            </Modal>

            {/* Modal édition coach */}
            <Modal isOpen={editModalOpen} onClose={closeEditModal} title="Modifier le coach">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    {editError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {editError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Prénom</label>
                            <input name="prenom" value={editForm.prenom || ''} onChange={handleEditChange} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Nom</label>
                            <input name="nom" value={editForm.nom || ''} onChange={handleEditChange} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Téléphone</label>
                            <input name="telephone" value={editForm.telephone || ''} onChange={handleEditChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                        
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Spécialité</label>
                            <input name="specialite" value={editForm.specialite || ''} onChange={handleEditChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                    </div>

                    <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                                Date de naissance
                            </label>
                            <input
                                name="date_naissance"
                                type="date"
                                value={editForm.date_naissance || ''}
                                onChange={handleEditChange}
                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                            />
                        </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Bio</label>
                        <textarea name="bio" value={editForm.bio || ''} onChange={handleEditChange}
                            rows={3}
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors resize-none" />
                    </div>

                    {/* Statut — action contextuelle, pas un choix binaire */}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Statut</label>
                        {editForm.statut === 'en_attente' ? (
                            <div className="flex items-center justify-between bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5">
                                <Badge statut="en_attente" />
                                <span className="text-gray-500 text-xs">Activation par le coach requise</span>
                            </div>
                        ) : editForm.statut === 'actif' ? (
                            <button type="button"
                                onClick={() => setEditForm({ ...editForm, statut: 'suspendu' })}
                                className="w-full py-2.5 rounded-xl text-sm font-medium border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
                                Suspendre
                            </button>
                        ) : (
                            <button type="button"
                                onClick={() => setEditForm({ ...editForm, statut: 'actif' })}
                                className="w-full py-2.5 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                Réactiver
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={editLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {editLoading ? 'Modification...' : 'Enregistrer les modifications'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}