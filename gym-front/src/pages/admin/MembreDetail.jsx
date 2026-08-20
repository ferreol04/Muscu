import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMembre, renouvelerAbonnement, annulerAbonnement, modifierAbonnement } from '../../api/membres'
import { getTarifs } from '../../api/tarifs'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import { ArrowLeft, RefreshCw, User, Phone, Mail, Calendar, Target, GraduationCap } from 'lucide-react'

export default function MembreDetail() {
    const { id }                              = useParams()
    const navigate                            = useNavigate()
    const [membre, setMembre]                 = useState(null)
    const [tarifs, setTarifs]                 = useState([])
    const [loading, setLoading]               = useState(true)
    const [modalOpen, setModalOpen]           = useState(false)
    const [typeChoisi, setTypeChoisi]         = useState('mensuel')
    const [renLoading, setRenLoading]         = useState(false)
    const [toast, setToast]                   = useState(null)
    const [modifModalOpen, setModifModalOpen] = useState(false)
    const [modifForm, setModifForm]           = useState({ type: 'mensuel' })
    const [modifLoading, setModifLoading]     = useState(false)
    const [annulerLoading, setAnnulerLoading] = useState(false)
    const [confirmAnnuler, setConfirmAnnuler] = useState(false)

    const fetchMembre = async () => {
        try {
            const [membreRes, tarifsRes] = await Promise.all([
                getMembre(id),
                getTarifs(),
            ])
            setMembre(membreRes.data)
            setTarifs(tarifsRes.data)
        } catch {
            console.error('Erreur chargement membre')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMembre()
    }, [id])

    const getMontant = () => {
        const tarif = tarifs.find(t => t.type === typeChoisi)
        return tarif ? Number(tarif.montant).toLocaleString('fr-FR') + ' FCFA' : '...'
    }

    const handleRenouveler = async () => {
        setRenLoading(true)
        try {
            await renouvelerAbonnement(id, { type: typeChoisi })
            await fetchMembre()
            setModalOpen(false)
            setToast({ message: 'Abonnement renouvelé avec succès !', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        } finally {
            setRenLoading(false)
        }
    }

    const handleAnnulerAbonnement = async () => {
        setAnnulerLoading(true)
        try {
            await annulerAbonnement(id)
            await fetchMembre()
            setConfirmAnnuler(false)
            setToast({ message: 'Abonnement en attente annulé', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        } finally {
            setAnnulerLoading(false)
        }
    }

    const openModifModal = () => {
        setModifForm({ type: abonnementActuel?.type || 'mensuel' })
        setModifModalOpen(true)
    }

    const handleModifierAbonnement = async (e) => {
        e.preventDefault()
        setModifLoading(true)
        try {
            await modifierAbonnement(id, { type: modifForm.type })
            await fetchMembre()
            setModifModalOpen(false)
            setToast({ message: 'Abonnement modifié avec succès', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        } finally {
            setModifLoading(false)
        }
    }

    const abonnementActuel    = membre?.abonnement_actuel
    const abonnementEnAttente = membre?.abonnement_en_attente
    const abonnements         = membre?.abonnements || []

    const joursRestants = () => {
        if (!abonnementActuel?.date_fin) return null
        const diff = new Date(abonnementActuel.date_fin) - new Date()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    const progressionAbonnement = () => {
        if (!abonnementActuel) return 0
        const debut  = new Date(abonnementActuel.date_debut)
        const fin    = new Date(abonnementActuel.date_fin)
        const now    = new Date()
        const total  = fin - debut
        const ecoule = now - debut
        return Math.min(100, Math.max(0, Math.round((ecoule / total) * 100)))
    }

    const joursDepuisCreationActuel = abonnementActuel
        ? Math.floor((new Date() - new Date(abonnementActuel.created_at)) / (1000 * 60 * 60 * 24))
        : null

    const joursDepuisCreationAttente = abonnementEnAttente
        ? Math.floor((new Date() - new Date(abonnementEnAttente.created_at)) / (1000 * 60 * 60 * 24))
        : null

    return (
        <div className="p-6">

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header — visible immédiatement, ne dépend pas du chargement du membre */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/membres')}
                    className="w-9 h-9 bg-[#1a1a2a] border border-[#2d2f45] rounded-xl flex items-center justify-center hover:border-[#e05c3a]/50 transition-colors"
                >
                    <ArrowLeft size={16} color="#9ca3af" />
                </button>
                <div>
                    <h1 className="text-white text-2xl font-bold">
                        {membre?.prenom} {membre?.nom}
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">{membre?.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Badge statut={membre?.statut} />
                    <button
                        onClick={() => setModalOpen(true)}
                        disabled={membre?.statut === 'en_attente' || membre?.statut === 'suspendu'}
                        title={
                            membre?.statut === 'en_attente' ? "Ce membre n'a pas encore activé son compte"
                            : membre?.statut === 'suspendu' ? 'Ce membre est suspendu'
                            : undefined
                        }
                        className="flex items-center gap-2 bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#e05c3a]"
                    >
                        <RefreshCw size={14} />
                        Renouveler abonnement
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-2 border-[#e05c3a] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
            <>
            {/* Abonnement en attente */}
            {abonnementEnAttente && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-400 font-semibold text-sm">⏳ Abonnement en attente</p>
                            <p className="text-gray-500 text-xs mt-1">
                                Démarre le {new Date(abonnementEnAttente.date_debut).toLocaleDateString('fr-FR')} —
                                Type : <span className="capitalize text-white">{abonnementEnAttente.type}</span> —
                                Montant : <span className="text-[#e05c3a] font-bold">{Number(abonnementEnAttente.montant).toLocaleString('fr-FR')} FCFA</span>
                            </p>
                        </div>
                        <div className="shrink-0 ml-4">
                            {joursDepuisCreationAttente < 7 ? (
                                <button
                                    onClick={() => setConfirmAnnuler(true)}
                                    disabled={annulerLoading}
                                    className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    {annulerLoading ? 'Annulation...' : 'Annuler'}
                                </button>
                            ) : (
                                <span className="text-gray-600 text-xs">Annulation impossible</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Infos personnelles */}
                <div className="md:col-span-1 bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <User size={15} color="#e05c3a" />
                        Informations
                    </h2>

                    <div className="w-16 h-16 rounded-2xl bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xl font-bold mx-auto mb-5">
                        {membre?.prenom?.[0]}{membre?.nom?.[0]}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">{membre?.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">{membre?.telephone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">
                                {membre?.date_naissance
                                    ? new Date(membre.date_naissance).toLocaleDateString('fr-FR')
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Target size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">{membre?.objectif || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <User size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm capitalize">{membre?.sexe || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <GraduationCap size={13} color="#6b7280" />
                            {membre?.coach ? (
                                <button
                                    onClick={() => navigate(`/admin/coachs/${membre.coach.id}`)}
                                    className="text-[#1d9e75] text-sm hover:underline"
                                >
                                    {membre.coach.prenom} {membre.coach.nom}
                                </button>
                            ) : (
                                <span className="text-gray-400 text-sm">Aucun coach assigné</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Abonnement actuel */}
                <div className="md:col-span-2 bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <Calendar size={15} color="#1d9e75" />
                        Abonnement actuel
                    </h2>

                    {abonnementActuel ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-[#0f1117] rounded-xl p-4 text-center">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Type</p>
                                    <p className="text-white font-bold capitalize">{abonnementActuel.type}</p>
                                </div>
                                <div className="bg-[#0f1117] rounded-xl p-4 text-center">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Début</p>
                                    <p className="text-white font-bold text-sm">
                                        {new Date(abonnementActuel.date_debut).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="bg-[#0f1117] rounded-xl p-4 text-center">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Fin</p>
                                    <p className="text-white font-bold text-sm">
                                        {new Date(abonnementActuel.date_fin).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="bg-[#0f1117] rounded-xl p-4 text-center">
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Jours restants</p>
                                    <p className="font-bold text-lg" style={{
                                        color: joursRestants() <= 7 ? '#ba7517' : '#1d9e75'
                                    }}>
                                        {joursRestants()}
                                    </p>
                                </div>
                            </div>

                            {/* Barre de progression */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-xs">
                                        Progression — {progressionAbonnement()}% écoulé
                                    </span>
                                    <span className="text-[#e05c3a] font-bold text-sm">
                                        {Number(abonnementActuel.montant).toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                                <div className="w-full bg-[#2d2f45] rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${progressionAbonnement()}%`,
                                            background: progressionAbonnement() >= 80 ? '#ba7517' : '#1d9e75',
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-gray-600 text-xs">
                                        {new Date(abonnementActuel.date_debut).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="text-gray-600 text-xs">
                                        {new Date(abonnementActuel.date_fin).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>

                            {/* Bouton modifier — seulement dans les 5 premiers jours */}
                            <div className="mt-4">
                                {joursDepuisCreationActuel < 5 ? (
                                    <button
                                        onClick={openModifModal}
                                        className="w-full flex items-center justify-center gap-2 bg-[#e05c3a]/10 border border-[#e05c3a]/30 text-[#e05c3a] hover:bg-[#e05c3a]/20 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Modifier cet abonnement
                                    </button>
                                ) : (
                                    <p className="text-gray-600 text-xs text-center">
                                        Modification impossible — délai de 5 jours dépassé
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-sm mb-4">Aucun abonnement actif</p>
                            <button
                                onClick={() => setModalOpen(true)}
                                disabled={membre?.statut === 'en_attente' || membre?.statut === 'suspendu'}
                                title={
                                    membre?.statut === 'en_attente' ? "Ce membre n'a pas encore activé son compte"
                                    : membre?.statut === 'suspendu' ? 'Ce membre est suspendu'
                                    : undefined
                                }
                                className="bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#e05c3a]"
                            >
                                Créer un abonnement
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Historique abonnements */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-5">Historique des abonnements</h2>
                {abonnements.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Aucun historique</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-160">
                        <thead>
                            <tr className="border-b border-[#2d2f45]">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Type</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Début</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Fin</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Montant</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {abonnements.map((abo) => {
                                const isAnnule    = abo.statut === 'annule'
                                const isActuel    = !isAnnule && abonnementActuel && abo.id === abonnementActuel.id
                                const isEnAttente = !isAnnule && abonnementEnAttente && abo.id === abonnementEnAttente.id
                                return (
                                    <tr key={abo.id} className="border-b border-[#2d2f45]/50">
                                        <td className="py-3 text-white text-sm capitalize font-medium">
                                            {abo.type}
                                            {isActuel && (
                                                <span className="ml-2 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    En cours
                                                </span>
                                            )}
                                            {isEnAttente && (
                                                <span className="ml-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                    En attente
                                                </span>
                                            )}
                                            {isAnnule && (
                                                <span className="ml-2 text-xs bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/20">
                                                    Annulé
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-gray-400 text-sm">
                                            {new Date(abo.date_debut).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="py-3 text-gray-400 text-sm">
                                            {new Date(abo.date_fin).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="py-3 text-[#e05c3a] text-sm font-bold">
                                            {Number(abo.montant).toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                isActuel
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : isEnAttente
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-gray-500/10 text-gray-400'
                                            }`}>
                                                {isActuel ? 'en cours' : isEnAttente ? 'en attente' : isAnnule ? 'annulé' : 'expiré'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                  </div>
                )}
            </div>

            {/* Modal renouvellement */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Renouveler l'abonnement">
                <div className="space-y-5">
                    <p className="text-gray-400 text-sm">
                        Membre : <span className="text-white font-medium">{membre?.prenom} {membre?.nom}</span>
                    </p>

                    {abonnementEnAttente && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                            <p className="text-amber-400 text-xs font-medium">
                                ⚠ Un abonnement est déjà en attente ({abonnementEnAttente.type}) — il démarre le {new Date(abonnementEnAttente.date_debut).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-3">
                            Choisir un plan
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['mensuel', 'trimestriel', 'semestriel', 'annuel'].map((type) => {
                                const tarif = tarifs.find(t => t.type === type)
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setTypeChoisi(type)}
                                        className={`p-4 rounded-xl border text-left transition-colors ${
                                            typeChoisi === type
                                                ? 'border-[#e05c3a] bg-[#e05c3a]/10'
                                                : 'border-[#2d2f45] bg-[#0f1117] hover:border-[#e05c3a]/50'
                                        }`}
                                    >
                                        <p className="text-white text-sm font-medium capitalize">{type}</p>
                                        <p className="text-[#e05c3a] text-xs font-bold mt-1">
                                            {tarif ? Number(tarif.montant).toLocaleString('fr-FR') + ' FCFA' : '...'}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Montant</span>
                        <span className="text-[#e05c3a] font-bold">{getMontant()}</span>
                    </div>

                    <button
                        onClick={handleRenouveler}
                        disabled={renLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {renLoading ? 'Traitement...' : 'Confirmer le renouvellement →'}
                    </button>
                </div>
            </Modal>

            {/* Confirm annuler abonnement en attente */}
            <ConfirmModal
                isOpen={confirmAnnuler}
                onConfirm={handleAnnulerAbonnement}
                onCancel={() => setConfirmAnnuler(false)}
                message="Voulez-vous vraiment annuler cet abonnement en attente ? Cette action est irréversible."
            />

            {/* Modal modifier abonnement en cours */}
            <Modal isOpen={modifModalOpen} onClose={() => setModifModalOpen(false)} title="Modifier l'abonnement en cours">
                <form onSubmit={handleModifierAbonnement} className="space-y-4">

                    <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3">
                        <p className="text-gray-400 text-xs">
                            Abonnement actuel : <span className="text-white capitalize font-medium">{abonnementActuel?.type}</span> —
                            Début : <span className="text-white">{abonnementActuel?.date_debut ? new Date(abonnementActuel.date_debut).toLocaleDateString('fr-FR') : '—'}</span>
                        </p>
                    </div>

                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-3">
                            Nouveau type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['mensuel', 'trimestriel', 'semestriel', 'annuel'].map((type) => {
                                const tarif = tarifs.find(t => t.type === type)
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setModifForm({ type })}
                                        className={`p-4 rounded-xl border text-left transition-colors ${
                                            modifForm.type === type
                                                ? 'border-[#e05c3a] bg-[#e05c3a]/10'
                                                : 'border-[#2d2f45] bg-[#0f1117] hover:border-[#e05c3a]/50'
                                        }`}
                                    >
                                        <p className="text-white text-sm font-medium capitalize">{type}</p>
                                        <p className="text-[#e05c3a] text-xs font-bold mt-1">
                                            {tarif ? Number(tarif.montant).toLocaleString('fr-FR') + ' FCFA' : '...'}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                        <p className="text-amber-400 text-xs">
                            ⚠ Le montant et la date de fin seront recalculés automatiquement selon le nouveau type choisi.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={modifLoading || modifForm.type === abonnementActuel?.type}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {modifLoading ? 'Modification...' : 'Confirmer la modification →'}
                    </button>
                </form>
            </Modal>
            </>
            )}
        </div>
    )
}