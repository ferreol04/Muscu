import { useState, useEffect } from 'react'
import { getCoachProfil, updateCoachProfil, changeCoachPassword } from '../../api/coach-profile'
import Toast from '../../components/Toast'
import Modal from '../../components/Modal'
import { User, Phone, Mail, Dumbbell, FileText, Lock, Edit2, Eye, EyeOff, Calendar } from 'lucide-react'

export default function CoachProfil() {
    const [data, setData]           = useState(null)
    const [loading, setLoading]     = useState(true)
    const [toast, setToast]         = useState(null)

    // Modals
    const [profilModalOpen, setProfilModalOpen] = useState(false)
    const [pwModalOpen, setPwModalOpen]         = useState(false)

    // Modifier profil
    const [profilForm, setProfilForm]       = useState({ telephone: '', bio: '', specialite: '' })
    const [profilLoading, setProfilLoading] = useState(false)
    const [profilError, setProfilError]     = useState('')

    // Changer mot de passe
    const [pwForm, setPwForm]           = useState({ current_password: '', password: '', password_confirmation: '' })
    const [pwLoading, setPwLoading]     = useState(false)
    const [pwError, setPwError]         = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew]         = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const fetchProfil = async () => {
        try {
            const res = await getCoachProfil()
            setData(res.data)
        } catch {
            console.error('Erreur chargement profil coach')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchProfil() }, [])

    const openProfilModal = () => {
        setProfilForm({
            telephone:  data?.coach?.telephone  || '',
            bio:        data?.coach?.bio        || '',
            specialite: data?.coach?.specialite || '',
        })
        setProfilError('')
        setProfilModalOpen(true)
    }

    const openPwModal = () => {
        setPwForm({ current_password: '', password: '', password_confirmation: '' })
        setPwError('')
        setShowCurrent(false)
        setShowNew(false)
        setShowConfirm(false)
        setPwModalOpen(true)
    }

    const handleUpdateProfil = async (e) => {
        e.preventDefault()
        setProfilLoading(true)
        setProfilError('')
        try {
            await updateCoachProfil(profilForm)
            await fetchProfil()
            setProfilModalOpen(false)
            setToast({ message: 'Profil mis à jour avec succès', type: 'success' })
        } catch (err) {
            setProfilError(err.response?.data?.message || 'Erreur')
        } finally {
            setProfilLoading(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPwLoading(true)
        setPwError('')
        try {
            await changeCoachPassword(pwForm)
            setPwModalOpen(false)
            setToast({ message: 'Mot de passe modifié avec succès', type: 'success' })
        } catch (err) {
            setPwError(err.response?.data?.message || 'Erreur')
        } finally {
            setPwLoading(false)
        }
    }

    const coach = data?.coach

    return (
        <div className="p-6 max-w-4xl mx-auto">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading ? (
                <>
                    {/* Squelette header profil */}
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-8 mb-6 animate-pulse">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-[#2d2f45] shrink-0" />
                            <div className="flex-1 space-y-2.5">
                                <div className="h-5 bg-[#2d2f45] rounded w-1/3" />
                                <div className="h-3 bg-[#2d2f45] rounded w-1/4" />
                                <div className="h-4 bg-[#2d2f45] rounded w-20 mt-2" />
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <div className="h-9 bg-[#2d2f45] rounded-xl w-44" />
                                <div className="h-9 bg-[#2d2f45] rounded-xl w-44" />
                            </div>
                        </div>
                    </div>

                    {/* Squelette infos personnelles + membres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                            <div className="h-3 bg-[#2d2f45] rounded w-1/3 mb-5" />
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#2d2f45] rounded-lg shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-2 bg-[#2d2f45] rounded w-1/4" />
                                            <div className="h-2.5 bg-[#2d2f45] rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6 animate-pulse">
                            <div className="h-3 bg-[#2d2f45] rounded w-1/3 mb-5" />
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2d2f45] shrink-0" />
                                        <div className="h-2.5 bg-[#2d2f45] rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Squelette cards stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center animate-pulse">
                                <div className="h-7 bg-[#2d2f45] rounded w-12 mx-auto mb-2" />
                                <div className="h-2.5 bg-[#2d2f45] rounded w-24 mx-auto" />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
            <>
            {/* Header profil */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-8 mb-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-2xl font-bold shrink-0">
                        {coach?.prenom?.[0]}{coach?.nom?.[0]}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-white text-2xl font-bold">
                            {coach?.prenom} {coach?.nom}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">{coach?.email}</p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Coach
                            </span>
                            {coach?.specialite && (
                                <span className="text-gray-500 text-xs">{coach.specialite}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <button
                            onClick={openProfilModal}
                            className="flex items-center gap-2 bg-[#e05c3a]/10 border border-[#e05c3a]/30 text-[#e05c3a] hover:bg-[#e05c3a]/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Edit2 size={14} />
                            Modifier mon profil
                        </button>
                        <button
                            onClick={openPwModal}
                            className="flex items-center gap-2 bg-[#534ab7]/10 border border-[#534ab7]/30 text-[#afa9ec] hover:bg-[#534ab7]/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            <Lock size={14} />
                            Changer mon mot de passe
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Informations personnelles */}
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <User size={16} color="#e05c3a" />
                        Informations personnelles
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#e05c3a]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Mail size={14} color="#e05c3a" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Email</p>
                                <p className="text-white text-sm font-medium">{coach?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#e05c3a]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Phone size={14} color="#e05c3a" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Téléphone</p>
                                <p className="text-white text-sm font-medium">{coach?.telephone || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#e05c3a]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Calendar size={14} color="#e05c3a" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Date de naissance</p>
                                <p className="text-white text-sm font-medium">
                                    {coach?.date_naissance
                                        ? new Date(coach.date_naissance).toLocaleDateString('fr-FR')
                                        : '—'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#e05c3a]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Dumbbell size={14} color="#e05c3a" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Spécialité</p>
                                <p className="text-white text-sm font-medium">{coach?.specialite || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#e05c3a]/10 rounded-lg flex items-center justify-center shrink-0">
                                <FileText size={14} color="#e05c3a" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Bio</p>
                                <p className="text-white text-sm font-medium">{coach?.bio || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats membres */}
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <User size={16} color="#1d9e75" />
                        Mes membres
                    </h2>
                    {coach?.membres?.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-gray-500 text-sm">Aucun membre assigné</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {coach?.membres?.slice(0, 5).map((m) => (
                                <div key={m.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                                        {m.prenom?.[0]}{m.nom?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {m.prenom} {m.nom}
                                        </p>
                                        <p className="text-gray-500 text-xs capitalize">
                                            {m.abonnement_actuel?.type || 'Sans abonnement'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {coach?.membres?.length > 5 && (
                                <p className="text-gray-500 text-xs text-center pt-1">
                                    +{coach.membres.length - 5} autres membres
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cards stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-[#e05c3a]">{coach?.membres?.length ?? 0}</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Membres assignés</p>
                </div>
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-[#1d9e75]">
                        {coach?.membres?.filter(m => m.abonnement_actuel?.statut === 'actif').length ?? 0}
                    </p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Membres actifs</p>
                </div>
            </div>

            {/* Modal modifier profil */}
            <Modal isOpen={profilModalOpen} onClose={() => setProfilModalOpen(false)} title="Modifier mon profil">
                <form onSubmit={handleUpdateProfil} className="space-y-4">
                    {profilError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {profilError}
                        </div>
                    )}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Téléphone</label>
                        <input
                            type="text"
                            value={profilForm.telephone}
                            onChange={(e) => setProfilForm({ ...profilForm, telephone: e.target.value })}
                            placeholder="Ex: 97000000"
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Spécialité</label>
                        <input
                            type="text"
                            value={profilForm.specialite}
                            onChange={(e) => setProfilForm({ ...profilForm, specialite: e.target.value })}
                            placeholder="Ex: Musculation, Cardio..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Bio</label>
                        <textarea
                            value={profilForm.bio}
                            onChange={(e) => setProfilForm({ ...profilForm, bio: e.target.value })}
                            rows={3}
                            placeholder="Décrivez votre parcours..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={profilLoading}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {profilLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </form>
            </Modal>

            {/* Modal changer mot de passe */}
            <Modal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Changer mon mot de passe">
                {pwError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
                        {pwError}
                    </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Mot de passe actuel</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={pwForm.current_password}
                                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                                required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#534ab7] transition-colors pr-12"
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Nouveau mot de passe</label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={pwForm.password}
                                onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                                placeholder="Minimum 8 caractères"
                                required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#534ab7] transition-colors pr-12"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Confirmer le mot de passe</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                value={pwForm.password_confirmation}
                                onChange={(e) => setPwForm({ ...pwForm, password_confirmation: e.target.value })}
                                placeholder="••••••••"
                                required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#534ab7] transition-colors pr-12"
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="w-full bg-[#534ab7] hover:bg-[#3c3489] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {pwLoading ? 'Modification...' : 'Changer mon mot de passe'}
                    </button>
                </form>
            </Modal>
            </>
            )}
        </div>
    )
}