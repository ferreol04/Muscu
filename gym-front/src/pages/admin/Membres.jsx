import { useState, useEffect } from 'react'
import { getMembres, createMembre, deleteMembre, updateMembre } from '../../api/membres'
import { getTarifs } from '../../api/tarifs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'

const INITIAL_FORM = {
    nom: '', prenom: '', email: '', telephone: '',
    date_naissance: '', sexe: '', objectif: '',
    type_inscription: 'abonnement',
    type_abonnement: 'mensuel',
}

export default function Membres() {
    const navigate                            = useNavigate()
    const [searchParams]                      = useSearchParams()
    const [membres, setMembres]               = useState([])
    const [tarifs, setTarifs]                 = useState([])
    const [loading, setLoading]               = useState(true)
    const [search, setSearch]                 = useState('')
    // Initialisé depuis l'URL (?statut=...) — permet d'arriver déjà filtré
    // depuis un lien externe (ex. les cartes cliquables du dashboard)
    const [filtreStatut, setFiltreStatut]     = useState(searchParams.get('statut') || '')
    const [modalOpen, setModalOpen]           = useState(false)
    const [form, setForm]                     = useState(INITIAL_FORM)
    const [formLoading, setFormLoading]       = useState(false)
    const [error, setError]                   = useState('')
    const [toast, setToast]                   = useState(null)
    const [confirmOpen, setConfirmOpen]       = useState(false)
    const [membreToDelete, setMembreToDelete] = useState(null)
    const [editModalOpen, setEditModalOpen]   = useState(false)
    const [membreToEdit, setMembreToEdit]     = useState(null)
    const [editForm, setEditForm]             = useState({})
    const [editLoading, setEditLoading]       = useState(false)
    const [editError, setEditError]           = useState('')
    const [page, setPage]                     = useState(1)
    const [lastPage, setLastPage]             = useState(1)
    const [total, setTotal]                   = useState(0)

    useEffect(() => {
        fetchMembres()
        fetchTarifs()
    }, [search, filtreStatut, page])

    // Revient à la page 1 quand un filtre change
    useEffect(() => {
        setPage(1)
    }, [search, filtreStatut])

    const fetchMembres = async () => {
        setLoading(true)
        try {
            const res = await getMembres({ search, statut: filtreStatut, page })
            setMembres(res.data.data)
            setLastPage(res.data.last_page)
            setTotal(res.data.total)
        } catch {
            console.error('Erreur chargement membres')
        } finally {
            setLoading(false)
        }
    }

    const fetchTarifs = async () => {
        try {
            const res = await getTarifs()
            setTarifs(res.data)
        } catch {
            console.error('Erreur chargement tarifs')
        }
    }

    const getMontant = () => {
        const tarif = tarifs.find(t => t.type === form.type_abonnement)
        return tarif ? Number(tarif.montant).toLocaleString('fr-FR') + ' FCFA' : '...'
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        setError('')
        try {
            await createMembre(form)
            fetchMembres()
            closeModal()
            setToast({ message: 'Membre créé avec succès. Un email a été envoyé.', type: 'success' })
        } catch (err) {
            const errors = err.response?.data?.errors
            setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteMembre(membreToDelete)
            fetchMembres()
            setToast({ message: 'Membre supprimé avec succès.', type: 'success' })
        } catch {
            setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        } finally {
            setConfirmOpen(false)
            setMembreToDelete(null)
        }
    }

    const closeModal = () => {
        setModalOpen(false)
        setForm(INITIAL_FORM)
        setError('')
    }

    const openEditModal = (membre) => {
        setMembreToEdit(membre)
        setEditForm({
            nom:            membre.nom,
            prenom:         membre.prenom,
            email:          membre.email,
            telephone:      membre.telephone || '',
            date_naissance: membre.date_naissance || '',
            sexe:           membre.sexe || '',
            objectif:       membre.objectif || '',
            statut:         membre.statut,
        })
        setEditModalOpen(true)
    }

    const closeEditModal = () => {
        setEditModalOpen(false)
        setMembreToEdit(null)
        setEditForm({})
        setEditError('')
    }

    const handleEditChange   = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditLoading(true)
        setEditError('')
        try {
            await updateMembre(membreToEdit.id, editForm)
            fetchMembres()
            closeEditModal()
            setToast({ message: 'Membre modifié avec succès', type: 'success' })
        } catch (err) {
            const errors = err.response?.data?.errors
            setEditError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setEditLoading(false)
        }
    }

    return (
        <div className="p-6">

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setMembreToDelete(null) }}
                message="Voulez-vous vraiment supprimer ce membre ? Son compte et ses données seront perdus."
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-white text-2xl font-bold">Membres</h1>
                    <p className="text-gray-500 text-sm mt-1">{total} membre{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                    + Nouveau membre
                </button>
            </div>

            {/* Filtres */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <input
                    type="text"
                    placeholder="Rechercher un membre..."
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
                    <option value="expire_bientot">Expire bientôt</option>
                    <option value="expire">Expiré</option>
                    <option value="en_attente">En attente</option>
                    <option value="sans_abonnement">Sans abonnement</option>
                    <option value="suspendu">Suspendu</option>
                </select>
            </div>

            {/* Tableau */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-180">
                    <thead>
                        <tr className="border-b border-[#2d2f45]">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Membre</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Téléphone</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Abonnement</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Fin</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center text-gray-500 py-12">Chargement...</td></tr>
                        ) : membres.length === 0 ? (
                            <tr><td colSpan={6} className="text-center text-gray-500 py-12">Aucun membre trouvé</td></tr>
                        ) : membres.map((membre) => (
                            <tr
                                key={membre.id}
                                onClick={() => navigate(`/admin/membres/${membre.id}`)}
                                className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05] transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                                            {membre.prenom?.[0]}{membre.nom?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{membre.prenom} {membre.nom}</p>
                                            <p className="text-gray-500 text-xs">{membre.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">{membre.telephone || '—'}</td>
                                <td className="px-6 py-4">
                                    {membre.type_inscription === 'ponctuel' ? (
                                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/20">
                                            Ponctuel
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-sm capitalize">
                                            {membre.abonnement_actuel?.type || '—'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {membre.type_inscription === 'ponctuel' ? '—' :
                                        membre.abonnement_actuel?.date_fin
                                            ? new Date(membre.abonnement_actuel.date_fin).toLocaleDateString('fr-FR')
                                            : '—'}
                                </td>
                                <td className="px-6 py-4">
                                    <Badge statut={membre.statut} />
                                </td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => openEditModal(membre)}
                                            className="text-gray-500 hover:text-[#e05c3a] transition-colors text-sm"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => { setMembreToDelete(membre.id); setConfirmOpen(true) }}
                                            className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
                <Pagination currentPage={page} lastPage={lastPage} total={total} onPageChange={setPage} />
            </div>

            {/* ── Modal création membre ── */}
            <Modal isOpen={modalOpen} onClose={closeModal} title="Nouveau membre">
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
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Sexe</label>
                            <select name="sexe" value={form.sexe} onChange={handleChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                                <option value="">—</option>
                                <option value="homme">Homme</option>
                                <option value="femme">Femme</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Date de naissance</label>
                        <input
                            name="date_naissance"
                            type="date"
                            value={form.date_naissance}
                            onChange={handleChange}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0]}
                            required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Objectif</label>
                        <input name="objectif" value={form.objectif} onChange={handleChange}
                            placeholder="Prise de masse, perte de poids..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                    </div>

                    {/* Type d'inscription */}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                            Type d'inscription
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, type_inscription: 'abonnement' })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors ${
                                    form.type_inscription === 'abonnement'
                                        ? 'border-[#e05c3a] bg-[#e05c3a]/10 text-white'
                                        : 'border-[#2d2f45] bg-[#0f1117] text-gray-400 hover:border-[#e05c3a]/50'
                                }`}
                            >
                                <span className="font-semibold">Abonnement</span>
                                <span className="text-xs opacity-60">Mensuel, trimestriel...</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, type_inscription: 'ponctuel' })}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors ${
                                    form.type_inscription === 'ponctuel'
                                        ? 'border-[#e05c3a] bg-[#e05c3a]/10 text-white'
                                        : 'border-[#2d2f45] bg-[#0f1117] text-gray-400 hover:border-[#e05c3a]/50'
                                }`}
                            >
                                <span className="font-semibold">Ponctuel</span>
                                <span className="text-xs opacity-60">À la séance</span>
                            </button>
                        </div>
                    </div>

                    {/* Abonnement — uniquement si type = abonnement */}
                    {form.type_inscription === 'abonnement' && (
                        <>
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                                    Abonnement
                                </label>
                                <select name="type_abonnement" value={form.type_abonnement} onChange={handleChange}
                                    className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                                    <option value="mensuel">Mensuel</option>
                                    <option value="trimestriel">Trimestriel</option>
                                    <option value="semestriel">Semestriel</option>
                                    <option value="annuel">Annuel</option>
                                </select>
                            </div>
                            <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Montant automatique</span>
                                <span className="text-[#e05c3a] font-bold">{getMontant()}</span>
                            </div>
                        </>
                    )}

                    {form.type_inscription === 'ponctuel' && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                            <p className="text-blue-300 text-sm">
                                Ce membre pourra réserver des séances ponctuelles. Chaque séance sera validée et facturée individuellement.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {formLoading ? 'Création...' : 'Créer le membre'}
                    </button>
                </form>
            </Modal>

            {/* ── Modal édition membre (inchangé) ── */}
            <Modal isOpen={editModalOpen} onClose={closeEditModal} title="Modifier le membre">
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

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Email</label>
                        <input name="email" type="email" value={editForm.email || ''} onChange={handleEditChange} required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Téléphone</label>
                            <input name="telephone" value={editForm.telephone || ''} onChange={handleEditChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Sexe</label>
                            <select name="sexe" value={editForm.sexe || ''} onChange={handleEditChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors">
                                <option value="">—</option>
                                <option value="homme">Homme</option>
                                <option value="femme">Femme</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Date de naissance</label>
                        <input
                            name="date_naissance"
                            type="date"
                            value={editForm.date_naissance || ''}
                            onChange={handleEditChange}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 12)).toISOString().split('T')[0]}
                            required  // ← ajouter
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Objectif</label>
                        <input name="objectif" value={editForm.objectif || ''} onChange={handleEditChange}
                            placeholder="Prise de masse, perte de poids..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors" />
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                            Compte membre
                        </label>
                        {editForm.statut === 'suspendu' ? (
                            <button
                                type="button"
                                onClick={() => setEditForm({ ...editForm, statut: 'actif' })}
                                className="w-full py-2.5 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                                Réactiver
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setEditForm({ ...editForm, statut: 'suspendu' })}
                                className="w-full py-2.5 rounded-xl text-sm font-medium border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                                Suspendre
                            </button>
                        )}
                        {editForm.statut === 'suspendu' && (
                            <p className="text-amber-500/70 text-xs mt-2">
                                ⚠ Ce membre ne pourra plus accéder à l'application.
                            </p>
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