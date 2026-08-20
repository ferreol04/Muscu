import { useState, useEffect, useCallback } from 'react'
import { getMaterielsCoach, getMesSignalements, signalerPanne } from '../../api/materiel'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

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

function BoutonSignalement({ monSignalement, statutMateriel, onClick }) {
    if (statutMateriel === 'hors_service') {
        return (
            <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-default">
                <Wrench size={11} />
                Hors service
            </span>
        )
    }
    if (!monSignalement || monSignalement.statut === 'resolu') {
        return (
            <button onClick={onClick}
                className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
                <AlertTriangle size={11} />
                Signaler
            </button>
        )
    }
    if (monSignalement.statut === 'en_attente') {
        return (
            <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-default">
                <AlertTriangle size={11} />
                Équipement signalé
            </span>
        )
    }
    if (monSignalement.statut === 'en_cours') {
        return (
            <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-default">
                <Wrench size={11} />
                En maintenance
            </span>
        )
    }
    return null
}

export default function CoachMateriel() {
    const [materiels, setMateriels]               = useState([])
    const [mesSignalements, setMesSignalements]   = useState([])
    const [loading, setLoading]                   = useState(true)
    const [onglet, setOnglet]                     = useState('materiels')
    const [filtreCategorie, setFiltreCategorie]   = useState('')
    const [modalOpen, setModalOpen]               = useState(false)
    const [materielSelectionne, setMaterielSelectionne] = useState(null)
    const [description, setDescription]           = useState('')
    const [signalLoading, setSignalLoading]       = useState(false)
    const [signalError, setSignalError]           = useState('')
    const [toast, setToast]                       = useState(null)

    const fetchMateriels = useCallback(async () => {
        try {
            const res = await getMaterielsCoach({ categorie: filtreCategorie })
            setMateriels(res.data)
        } catch {
            setToast({ message: 'Erreur chargement matériels', type: 'error' })
        } finally {
            setLoading(false)
        }
    }, [filtreCategorie])

    const fetchMesSignalements = async () => {
        try {
            const res = await getMesSignalements()
            setMesSignalements(res.data)
        } catch {
            setToast({ message: 'Erreur chargement signalements', type: 'error' })
        }
    }

    useEffect(() => {
        Promise.all([fetchMateriels(), fetchMesSignalements()])
    }, [fetchMateriels])

    useEffect(() => { fetchMateriels() }, [fetchMateriels])

    const openSignaler = (m) => {
        setMaterielSelectionne(m)
        setDescription('')
        setSignalError('')
        setModalOpen(true)
    }

    const handleSignaler = async (e) => {
        e.preventDefault()
        setSignalLoading(true)
        setSignalError('')
        try {
            await signalerPanne({ materiel_id: materielSelectionne.id, description })
            await Promise.all([fetchMateriels(), fetchMesSignalements()])
            setModalOpen(false)
            setToast({ message: 'Panne signalée à l\'admin avec succès', type: 'success' })
        } catch (err) {
            setSignalError(err.response?.data?.message || 'Erreur')
        } finally {
            setSignalLoading(false)
        }
    }

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Matériel</h1>
                <p className="text-gray-500 text-sm mt-1">Consultez les équipements et signalez les pannes</p>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setOnglet('materiels')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${onglet === 'materiels' ? 'bg-[#1d9e75] text-white' : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'}`}>
                    Équipements
                </button>
                <button onClick={() => setOnglet('signalements')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${onglet === 'signalements' ? 'bg-[#1d9e75] text-white' : 'bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white'}`}>
                    Mes signalements
                    {mesSignalements.filter(s => s.statut === 'en_attente').length > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${onglet === 'signalements' ? 'bg-white/20' : 'bg-red-500 text-white'}`}>
                            {mesSignalements.filter(s => s.statut === 'en_attente').length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Onglet Équipements ── */}
            {onglet === 'materiels' && (
                <>
                    <div className="mb-6">
                        <select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)}
                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors">
                            <option value="">Toutes les catégories</option>
                            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5 animate-pulse">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="space-y-1.5">
                                            <div className="h-3 bg-[#2d2f45] rounded w-28" />
                                            <div className="h-2.5 bg-[#2d2f45] rounded w-20" />
                                        </div>
                                        <div className="h-5 bg-[#2d2f45] rounded-lg w-20" />
                                    </div>
                                    <div className="h-2.5 bg-[#2d2f45] rounded w-full mb-3" />
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="h-2.5 bg-[#2d2f45] rounded w-10" />
                                        <div className="h-7 bg-[#2d2f45] rounded-lg w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : materiels.length === 0 ? (
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl py-16 flex flex-col items-center gap-2 text-gray-500">
                            <Wrench size={32} className="opacity-20" />
                            <p className="text-sm">Aucun matériel trouvé</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materiels.map((m) => {
                                const st = STATUTS_MATERIEL[m.statut] ?? STATUTS_MATERIEL.disponible
                                const monSignalement = m.mon_signalement ?? null
                                return (
                                    <div key={m.id} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-white font-semibold text-sm">{m.nom}</p>
                                                {m.caracteristiques && (
                                                    <p className="text-[#e05c3a] text-xs mt-0.5 font-medium">{m.caracteristiques}</p>
                                                )}
                                                <p className="text-gray-500 text-xs mt-0.5">{CATEGORIES[m.categorie]}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${st.bg} ${st.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                            </span>
                                        </div>
                                        {m.description && (
                                            <p className="text-gray-500 text-xs mb-3">{m.description}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-gray-500 text-xs">Qté : <span className="text-white font-medium">{m.quantite}</span></span>
                                            <BoutonSignalement
                                                monSignalement={monSignalement}
                                                statutMateriel={m.statut}
                                                onClick={() => openSignaler(m)}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── Onglet Mes signalements ── */}
            {onglet === 'signalements' && (
                <div className="space-y-4">
                    {mesSignalements.length === 0 ? (
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl py-16 flex flex-col items-center gap-2 text-gray-500">
                            <CheckCircle size={32} className="opacity-20" />
                            <p className="text-sm">Aucun signalement envoyé</p>
                        </div>
                    ) : mesSignalements.map((s) => {
                        const st = STATUTS_SIGNALEMENT[s.statut] ?? STATUTS_SIGNALEMENT.en_attente
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
                                            <span>Signalé le {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            {s.resolu_at && (
                                                <>
                                                    <span>·</span>
                                                    <span className="text-emerald-400">Résolu le {new Date(s.resolu_at).toLocaleDateString('fr-FR')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal signalement */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Signaler une panne">
                <form onSubmit={handleSignaler} className="space-y-4">
                    {signalError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{signalError}</div>
                    )}
                    <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3">
                        <p className="text-gray-500 text-xs">Équipement</p>
                        <p className="text-white text-sm font-semibold mt-0.5">{materielSelectionne?.nom}</p>
                        {materielSelectionne?.caracteristiques && (
                            <p className="text-[#e05c3a] text-xs mt-0.5">{materielSelectionne.caracteristiques}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Description de la panne</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required
                            placeholder="Décrivez le problème observé..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors resize-none" />
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                        <p className="text-amber-400 text-xs">⚠ Ce signalement sera transmis à l'admin qui décidera des actions à entreprendre.</p>
                    </div>
                    <button type="submit" disabled={signalLoading || !description}
                        className="w-full bg-[#1d9e75] hover:bg-[#178a65] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                        {signalLoading ? 'Envoi...' : 'Envoyer le signalement →'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}