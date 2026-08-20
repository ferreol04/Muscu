import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCoach, getMembres, assignerMembre, retirerMembre, renvoyerInvitationCoach } from '../../api/membres'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import { ArrowLeft, UserCheck, Phone, Mail, Star, UserPlus, UserMinus, Calendar, Send } from 'lucide-react'

export default function CoachDetail() {
    const { id }                              = useParams()
    const navigate                            = useNavigate()
    const [coach, setCoach]                   = useState(null)
    const [membres, setMembres]               = useState([])
    const [loading, setLoading]               = useState(true)
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [membreSearch, setMembreSearch]     = useState('')
    const [membresDispos, setMembresDispos]   = useState([])
    const [assignLoading, setAssignLoading]   = useState(false)
    const [toast, setToast]                   = useState(null)
    const [confirmOpen, setConfirmOpen]       = useState(false)
    const [membreToRetirer, setMembreToRetirer] = useState(null)
    const [renvoiLoading, setRenvoiLoading]   = useState(false)

    const fetchCoach = async () => {
        try {
            const res = await getCoach(id)
            setCoach(res.data)
            setMembres(res.data.membres || [])
        } catch {
            console.error('Erreur chargement coach')
        } finally {
            setLoading(false)
        }
    }

    const fetchMembresDispos = async () => {
        try {
            const res = await getMembres({ search: membreSearch })
            // Filtre les membres qui n'ont pas encore de coach, qui ont activé leur compte,
            // et qui ne sont pas suspendus — même règle que côté backend (assignerMembre)
            setMembresDispos(res.data.data.filter(m => !m.coach_id && m.statut !== 'en_attente' && m.statut !== 'suspendu'))
        } catch {
            console.error('Erreur chargement membres')
        }
    }

    useEffect(() => {
        setTimeout(() => fetchCoach(), 0)
    }, [id])

    useEffect(() => {
        if (assignModalOpen) fetchMembresDispos()
    }, [assignModalOpen, membreSearch])

    const handleAssigner = async (membreId) => {
        setAssignLoading(true)
        try {
            await assignerMembre(id, { membre_id: membreId })
            await fetchCoach()
            setAssignModalOpen(false)
            setMembreSearch('')
            setToast({ message: 'Membre assigné avec succès', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        } finally {
            setAssignLoading(false)
        }
    }

    const handleRetirer = async () => {
        try {
            await retirerMembre(id, { membre_id: membreToRetirer })
            await fetchCoach()
            setConfirmOpen(false)
            setMembreToRetirer(null)
            setToast({ message: 'Membre retiré avec succès', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        }
    }

    const handleRenvoyerInvitation = async () => {
        setRenvoiLoading(true)
        try {
            await renvoyerInvitationCoach(id)
            setToast({ message: 'Lien d\'activation renvoyé avec succès', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        } finally {
            setRenvoiLoading(false)
        }
    }

    return (
        <div className="p-6">

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                onConfirm={handleRetirer}
                onCancel={() => { setConfirmOpen(false); setMembreToRetirer(null) }}
                message="Voulez-vous vraiment retirer ce membre du coach ?"
            />

            {/* Header — visible immédiatement, ne dépend pas du chargement du coach */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/coachs')}
                    className="w-9 h-9 bg-[#1a1a2a] border border-[#2d2f45] rounded-xl flex items-center justify-center hover:border-[#e05c3a]/50 transition-colors"
                >
                    <ArrowLeft size={16} color="#9ca3af" />
                </button>
                <div>
                    <h1 className="text-white text-2xl font-bold">
                        {coach?.prenom} {coach?.nom}
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">{coach?.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {coach?.user && !coach.user.password_changed && (
                        <button
                            onClick={handleRenvoyerInvitation}
                            disabled={renvoiLoading}
                            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            <Send size={13} />
                            {renvoiLoading ? 'Envoi...' : 'Renvoyer le lien d\'activation'}
                        </button>
                    )}
                    {coach?.statut && <Badge statut={coach.statut} />}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-2 border-[#e05c3a] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Infos coach */}
                <div className="md:col-span-1 bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <UserCheck size={15} color="#1d9e75" />
                        Informations
                    </h2>

                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-[#1d9e75]/20 text-[#1d9e75] flex items-center justify-center text-xl font-bold mx-auto mb-5">
                        {coach?.prenom?.[0]}{coach?.nom?.[0]}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Mail size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">{coach?.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">{coach?.telephone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar size={13} color="#6b7280" />
                            <span className="text-gray-400 text-sm">
                                {coach?.date_naissance
                                    ? new Date(coach.date_naissance).toLocaleDateString('fr-FR')
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Star size={13} color="#ba7517" />
                            <span className="text-amber-400 text-sm">{coach?.specialite || '—'}</span>
                        </div>
                    </div>

                    {coach?.bio && (
                        <div className="mt-4 pt-4 border-t border-[#2d2f45]">
                            <p className="text-gray-500 text-xs leading-relaxed">{coach.bio}</p>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="mt-4 pt-4 border-t border-[#2d2f45] text-center">
                        <p className="text-3xl font-bold text-[#1d9e75]">{membres.length}</p>
                        <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Membres assignés</p>
                    </div>
                </div>

                {/* Membres assignés */}
                <div className="md:col-span-2 bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-white font-semibold">Membres assignés</h2>
                        <button
                            onClick={() => setAssignModalOpen(true)}
                            disabled={coach?.statut !== 'actif'}
                            title={coach?.statut !== 'actif' ? 'Le coach doit avoir activé son compte et ne pas être suspendu' : undefined}
                            className="flex items-center gap-2 bg-[#e05c3a]/10 border border-[#e05c3a]/30 text-[#e05c3a] hover:bg-[#e05c3a]/20 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#e05c3a]/10"
                        >
                            <UserPlus size={13} />
                            Assigner un membre
                        </button>
                    </div>

                    {coach?.statut !== 'actif' && (
                        <p className="text-gray-500 text-xs mb-4 -mt-2">
                            {coach?.statut === 'en_attente'
                                ? "Ce coach n'a pas encore activé son compte — l'assignation de membres sera possible une fois son compte activé."
                                : 'Ce coach est suspendu — réactivez-le pour pouvoir lui assigner des membres.'}
                        </p>
                    )}

                    {membres.length === 0 ? (
                        <div className="text-center py-10">
                            <UserCheck size={36} color="#2d2f45" className="mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Aucun membre assigné</p>
                            {coach?.statut === 'actif' && (
                                <p className="text-gray-600 text-xs mt-1">Cliquez sur "Assigner un membre" pour commencer</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {membres.map((membre) => (
                                <div
                                    key={membre.id}
                                    className="flex items-center justify-between p-3 bg-[#0f1117] rounded-xl border border-[#2d2f45] hover:border-[#e05c3a]/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                                            {membre.prenom?.[0]}{membre.nom?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{membre.prenom} {membre.nom}</p>
                                            <p className="text-gray-500 text-xs">{membre.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge statut={membre.statut} />
                                        <button
                                            onClick={() => { setMembreToRetirer(membre.id); setConfirmOpen(true) }}
                                            aria-label={`Retirer ${membre.prenom} ${membre.nom}`}
                                            className="w-7 h-7 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                        >
                                            <UserMinus size={13} color="#e24b4a" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal assigner un membre */}
            <Modal isOpen={assignModalOpen} onClose={() => { setAssignModalOpen(false); setMembreSearch('') }} title="Assigner un membre">
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Rechercher un membre..."
                        value={membreSearch}
                        onChange={(e) => setMembreSearch(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                    />

                    <p className="text-gray-500 text-xs">
                        Seuls les membres sans coach sont affichés.
                    </p>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {membresDispos.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-6">
                                Aucun membre disponible
                            </p>
                        ) : membresDispos.map((membre) => (
                            <div
                                key={membre.id}
                                className="flex items-center justify-between p-3 bg-[#0f1117] rounded-xl border border-[#2d2f45] hover:border-[#e05c3a]/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                                        {membre.prenom?.[0]}{membre.nom?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{membre.prenom} {membre.nom}</p>
                                        <p className="text-gray-500 text-xs">{membre.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAssigner(membre.id)}
                                    disabled={assignLoading}
                                    className="flex items-center gap-1.5 bg-[#e05c3a]/10 border border-[#e05c3a]/30 text-[#e05c3a] hover:bg-[#e05c3a]/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    <UserPlus size={12} />
                                    Assigner
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
            </>
            )}
        </div>
    )
}