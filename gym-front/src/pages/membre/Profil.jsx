import { useState, useEffect } from 'react'
import { getProfilComplet, updateProfil, changePassword } from '../../api/membre-profile'
import Badge from '../../components/Badge'
import Toast from '../../components/Toast'
import Modal from '../../components/Modal'
import { User, Phone, Mail, Calendar, Target, Info, Eye, EyeOff, Lock, Edit2 } from 'lucide-react'

export default function MembreProfil() {
    const [data, setData]           = useState(null)
    const [loading, setLoading]     = useState(true)
    const [toast, setToast]         = useState(null)

    // Modals
    const [profilModalOpen, setProfilModalOpen] = useState(false)
    const [pwModalOpen, setPwModalOpen]         = useState(false)

    // Modifier profil
    const [telephone, setTelephone]         = useState('')
    const [profilLoading, setProfilLoading] = useState(false)

    // Changer mot de passe
    const [pwForm, setPwForm]           = useState({ current_password: '', password: '', password_confirmation: '' })
    const [pwLoading, setPwLoading]     = useState(false)
    const [pwError, setPwError]         = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew]         = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const fetchProfil = async () => {
        try {
            const res = await getProfilComplet()
            setData(res.data)
            setTelephone(res.data.membre?.telephone || '')
        } catch {
            console.error('Erreur chargement profil')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { setTimeout(() => fetchProfil(), 0) }, [])

    const openProfilModal = () => {
        setTelephone(data?.membre?.telephone || '')
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
        try {
            await updateProfil({ telephone })
            await fetchProfil()
            setProfilModalOpen(false)
            setToast({ message: 'Profil mis à jour avec succès', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur', type: 'error' })
        } finally {
            setProfilLoading(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPwLoading(true)
        setPwError('')
        try {
            await changePassword(pwForm)
            setPwModalOpen(false)
            setToast({ message: 'Mot de passe modifié avec succès', type: 'success' })
        } catch (err) {
            setPwError(err.response?.data?.message || 'Erreur')
        } finally {
            setPwLoading(false)
        }
    }

    const membre              = data?.membre
    const abonnement          = membre?.abonnement_actuel
    const abonnementEnAttente = membre?.abonnement_en_attente

    const age = membre?.date_naissance
        ? Math.floor((new Date() - new Date(membre.date_naissance)) / (365.25 * 24 * 60 * 60 * 1000))
        : null

    const joursRestants = () => {
        if (!abonnement?.date_fin) return 0
        const diff = new Date(abonnement.date_fin) - new Date()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    const progressionAbonnement = () => {
        if (!abonnement) return 0
        const debut  = new Date(abonnement.date_debut)
        const fin    = new Date(abonnement.date_fin)
        const now    = new Date()
        const total  = fin - debut
        const ecoule = now - debut
        return Math.min(100, Math.max(0, Math.round((ecoule / total) * 100)))
    }

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
                                <div className="h-4 bg-[#2d2f45] rounded w-32 mt-2" />
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <div className="h-9 bg-[#2d2f45] rounded-xl w-44" />
                                <div className="h-9 bg-[#2d2f45] rounded-xl w-44" />
                            </div>
                        </div>
                    </div>

                    {/* Squelette infos personnelles + abonnement */}
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
                            <div className="h-3 bg-[#2d2f45] rounded w-1/4 mb-5" />
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="h-2.5 bg-[#2d2f45] rounded w-20" />
                                        <div className="h-2.5 bg-[#2d2f45] rounded w-24" />
                                    </div>
                                ))}
                                <div className="h-2 bg-[#2d2f45] rounded-full w-full mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* Squelette statistiques */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center animate-pulse">
                                <div className="h-7 bg-[#2d2f45] rounded w-10 mx-auto mb-2" />
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
                        {membre?.prenom?.[0]}{membre?.nom?.[0]}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-white text-2xl font-bold">{membre?.prenom} {membre?.nom}</h1>
                        <p className="text-gray-500 text-sm mt-1">{membre?.email}</p>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge statut={membre?.statut} />
                            <span className="text-gray-500 text-xs">Membre depuis {data?.mois_depuis} mois</span>
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

            {/* Alerte en attente */}
            {abonnementEnAttente && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
                    <p className="text-blue-400 font-semibold text-sm">⏳ Renouvellement en attente</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Votre abonnement <span className="text-white capitalize">{abonnementEnAttente.type}</span> démarrera
                        le <span className="text-white">{new Date(abonnementEnAttente.date_debut).toLocaleDateString('fr-FR')}</span>.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Informations personnelles */}
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <User size={16} color="#e05c3a" />
                        Informations personnelles
                    </h2>
                    <div className="space-y-4">
                        {[
                            { icon: <Mail size={14} color="#e05c3a" />,     label: 'Email',             value: membre?.email },
                            { icon: <Phone size={14} color="#e05c3a" />,    label: 'Téléphone',         value: membre?.telephone || '—' },
                            { icon: <Calendar size={14} color="#e05c3a" />, label: 'Date de naissance', value: membre?.date_naissance ? `${new Date(membre.date_naissance).toLocaleDateString('fr-FR')} (${age} ans)` : '—' },
                            { icon: <User size={14} color="#e05c3a" />,     label: 'Sexe',              value: membre?.sexe || '—', capitalize: true },
                            { icon: <Target size={14} color="#e05c3a" />,   label: 'Objectif',          value: membre?.objectif || '—' },
                        ].map(({ icon, label, value, capitalize }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#e05c3a]/10 rounded-lg flex items-center justify-center shrink-0">
                                    {icon}
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">{label}</p>
                                    <p className={`text-white text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Abonnement actuel */}
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                        <Calendar size={16} color="#1d9e75" />
                        Mon abonnement
                    </h2>
                    {abonnement ? (
                        <div className="space-y-4">
                            {[
                                { label: 'Type',   value: <span className="capitalize">{abonnement.type}</span> },
                                { label: 'Début',  value: new Date(abonnement.date_debut).toLocaleDateString('fr-FR') },
                                { label: 'Fin',    value: new Date(abonnement.date_fin).toLocaleDateString('fr-FR') },
                                { label: 'Jours restants', value: <span style={{ color: joursRestants() <= 7 ? '#ba7517' : '#1d9e75' }} className="font-bold">{joursRestants()} jours</span> },
                                { label: 'Montant payé', value: <span className="text-[#e05c3a] font-bold">{Number(abonnement.montant).toLocaleString('fr-FR')} FCFA</span> },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">{label}</span>
                                    <span className="text-white text-sm font-medium">{value}</span>
                                </div>
                            ))}
                            <div>
                                <p className="text-gray-500 text-xs mb-2">Progression — {progressionAbonnement()}% écoulé</p>
                                <div className="w-full bg-[#2d2f45] rounded-full h-2">
                                    <div className="h-2 rounded-full transition-all" style={{
                                        width: `${progressionAbonnement()}%`,
                                        background: progressionAbonnement() >= 80 ? '#ba7517' : '#1d9e75',
                                    }} />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-gray-600 text-xs">{new Date(abonnement.date_debut).toLocaleDateString('fr-FR')}</span>
                                    <span className="text-gray-600 text-xs">{new Date(abonnement.date_fin).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">Aucun abonnement actif</p>
                            {abonnementEnAttente && (
                                <p className="text-blue-400 text-xs mt-2">
                                    Abonnement <span className="capitalize">{abonnementEnAttente.type}</span> prévu
                                    le {new Date(abonnementEnAttente.date_debut).toLocaleDateString('fr-FR')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-[#e05c3a]">{data?.mois_depuis}</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Mois membre</p>
                </div>
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-[#1d9e75]">{data?.nb_renouvellements}</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Renouvellements</p>
                </div>
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-[#534ab7]">{joursRestants()}</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Jours restants</p>
                </div>
            </div>

            {/* Message informatif */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Info size={14} color="#378add" />
                </div>
                <div>
                    <p className="text-white text-sm font-medium">Modifier d'autres informations</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Pour modifier votre nom, prénom, objectif ou date de naissance,
                        veuillez vous adresser directement à la réception de la salle.
                    </p>
                </div>
            </div>

            {/* Modal modifier profil */}
            <Modal isOpen={profilModalOpen} onClose={() => setProfilModalOpen(false)} title="Modifier mon profil">
                <form onSubmit={handleUpdateProfil} className="space-y-5">
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Téléphone</label>
                        <input
                            type="text"
                            value={telephone}
                            onChange={(e) => setTelephone(e.target.value)}
                            placeholder="Ex: 97000000"
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
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
                    {[
                        { label: 'Mot de passe actuel',   key: 'current_password', show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                        { label: 'Nouveau mot de passe',  key: 'password',         show: showNew,     toggle: () => setShowNew(!showNew),     placeholder: 'Minimum 8 caractères' },
                        { label: 'Confirmer le mot de passe', key: 'password_confirmation', show: showConfirm, toggle: () => setShowConfirm(!showConfirm), placeholder: '••••••••' },
                    ].map(({ label, key, show, toggle, placeholder }) => (
                        <div key={key}>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">{label}</label>
                            <div className="relative">
                                <input
                                    type={show ? 'text' : 'password'}
                                    value={pwForm[key]}
                                    onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                                    placeholder={placeholder}
                                    required
                                    className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#534ab7] transition-colors pr-12"
                                />
                                <button type="button" onClick={toggle}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
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