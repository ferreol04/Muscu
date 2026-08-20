import { useState, useEffect } from 'react'
import { getPlanningMembre,  } from '../../api/planning'
import { getTarifsPonctuels, reserverSeancePonctuelle, getMesSeancesPonctuelles } from '../../api/ponctuels'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import { useAnnulations } from '../../context/useAnnulations'
import { Calendar, Clock, Plus, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

const STATUTS_PONCTUEL = {
    en_attente: { label: 'En attente',  bg: 'bg-blue-500/10',    text: 'text-blue-400'    },
    validee:    { label: 'Validée',     bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    annulee:    { label: 'Annulée',     bg: 'bg-gray-500/10',    text: 'text-gray-400'    },
}

const HEURES = Array.from({ length: 24 }, (_, h) =>
    ['00', '30'].map(m => `${String(h).padStart(2, '0')}:${m}`)
).flat()

const calcHeureFin = (heureDebut, dureeMinutes) => {
    const [h, m] = heureDebut.split(':').map(Number)
    const total  = h * 60 + m + dureeMinutes
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function MembrePlanning() {
    const { refresh: refreshAnnulations }             = useAnnulations()
    const [seances, setSeances]                       = useState([])
    const [seancesPonctuelles, setSeancesPonctuelles] = useState([])
    const [tarifsPonctuels, setTarifsPonctuels]       = useState([])
    const [loading, setLoading]                       = useState(true)
    const [modalPonctuelOpen, setModalPonctuelOpen]   = useState(false)
    const [form, setForm]                             = useState({ tarif_ponctuel_id: '', date: '', heure_debut: '', notes: '' })
    const [formLoading, setFormLoading]               = useState(false)
    const [error, setError]                           = useState('')
    const [toast, setToast]                           = useState(null)
    const [expandedSeance, setExpandedSeance]         = useState(null)

    const fetchSeances = async () => {
        try {
            const res = await getPlanningMembre()
            setSeances(res.data)
            // Cet appel marque les annulations comme "vues" côté serveur —
            // on rafraîchit le badge du menu juste après pour qu'il retombe à 0.
            refreshAnnulations()
        } catch {
            console.error('Erreur chargement planning')
        }
    }

    const fetchPonctuelles = async () => {
        try {
            const res = await getMesSeancesPonctuelles()
            setSeancesPonctuelles(res.data)
        } catch {
            console.error('Erreur chargement séances ponctuelles')
        }
    }

    const fetchTarifs = async () => {
        try {
            const res = await getTarifsPonctuels()
            setTarifsPonctuels(res.data)
        } catch {
            console.error('Erreur chargement tarifs')
        }
    }

    useEffect(() => {
        Promise.all([fetchSeances(), fetchPonctuelles(), fetchTarifs()])
            .finally(() => setLoading(false))
    }, [])

    const openModal = () => {
        setForm({ tarif_ponctuel_id: '', date: '', heure_debut: '', notes: '' })
        setError('')
        setModalPonctuelOpen(true)
    }

    const handleDemanderPonctuelle = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        setError('')
        try {
            await reserverSeancePonctuelle({
                tarif_ponctuel_id: form.tarif_ponctuel_id,
                date:              form.date,
                heure_debut:       form.heure_debut,
                notes:             form.notes,
            })
            await fetchPonctuelles()
            setModalPonctuelOpen(false)
            setToast({ message: 'Demande envoyée, en attente de validation', type: 'success' })
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la demande')
        } finally {
            setFormLoading(false)
        }
    }

    const seancesCoach            = seances.filter(s => s.type === 'coach')
    const seancesRecurrentes      = seancesCoach.filter(s => s.recurrente)
    const seancesPonctuellesCoach = seancesCoach.filter(s => !s.recurrente && s.date)

    const seancesParJour = JOURS.reduce((acc, jour) => {
        acc[jour] = seancesRecurrentes.filter(s => s.jour === jour)
        return acc
    }, {})

    const toggleExpand     = (id) => setExpandedSeance(expandedSeance === id ? null : id)
    const tarifSelectionne = tarifsPonctuels.find(t => t.id === Number(form.tarif_ponctuel_id))

    return (
        <div className="p-6">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header — visible immédiatement, ne dépend pas du chargement du planning */}
            <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Mon planning</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {seances.length} séance{seances.length > 1 ? 's' : ''} planifiée{seances.length > 1 ? 's' : ''}
                </p>
            </div>

            {loading ? (
                <>
                    {Array.from({ length: 2 }).map((_, section) => (
                        <div key={section} className="mb-6">
                            <div className="h-4 bg-[#2d2f45] rounded w-56 mb-4 animate-pulse" />
                            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden animate-pulse">
                                <div className="divide-y divide-[#2d2f45]/50">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i} className="px-6 py-4 flex items-center justify-between">
                                            <div className="space-y-1.5">
                                                <div className="h-2.5 bg-[#2d2f45] rounded w-32" />
                                                <div className="h-2 bg-[#2d2f45] rounded w-24" />
                                            </div>
                                            <div className="h-2.5 bg-[#2d2f45] rounded w-16" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
            <>
            {/* ── Séances récurrentes avec coach ── */}
            <div className="mb-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Dumbbell size={16} color="#1d9e75" />
                    Séances récurrentes avec mon coach
                </h2>
                <div className="space-y-3">
                    {JOURS.map((jour) => {
                        const s = seancesParJour[jour]
                        if (s.length === 0) return null
                        return (
                            <div key={jour} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                                <div className="px-6 py-3 border-b border-[#2d2f45]">
                                    <h3 className="text-white font-medium capitalize">{jour}</h3>
                                </div>
                                <div className="divide-y divide-[#2d2f45]/50">
                                    {s.map((seance) => (
                                        <SeanceCoachCard
                                            key={seance.id}
                                            seance={seance}
                                            showDate={false}
                                            expanded={expandedSeance === seance.id}
                                            onToggle={() => toggleExpand(seance.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                    {seancesRecurrentes.length === 0 && (
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-8 text-center">
                            <Calendar size={32} color="#2d2f45" className="mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Aucune séance récurrente planifiée</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Séances ponctuelles avec coach ── */}
            <div className="mb-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={16} color="#534ab7" />
                    Séances ponctuelles avec mon coach
                </h2>
                {seancesPonctuellesCoach.length === 0 ? (
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-8 text-center">
                        <Calendar size={32} color="#2d2f45" className="mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Aucune séance ponctuelle planifiée</p>
                    </div>
                ) : (
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                        <div className="divide-y divide-[#2d2f45]/50">
                            {seancesPonctuellesCoach.map((seance) => (
                                <SeanceCoachCard
                                    key={seance.id}
                                    seance={seance}
                                    showDate={true}
                                    expanded={expandedSeance === seance.id}
                                    onToggle={() => toggleExpand(seance.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Mes séances ponctuelles (sans abonnement) ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Clock size={16} color="#e05c3a" />
                        Mes séances ponctuelles
                    </h2>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 bg-[#e05c3a] hover:bg-[#c94e2e] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    >
                        <Plus size={14} />
                        Demander une séance
                    </button>
                </div>

                {seancesPonctuelles.length === 0 ? (
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl p-8 text-center">
                        <Clock size={32} color="#2d2f45" className="mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Aucune séance ponctuelle demandée</p>
                        <button onClick={openModal} className="mt-3 text-[#e05c3a] hover:underline text-sm font-semibold">
                            Faire une demande →
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-160">
                            <thead>
                                <tr className="border-b border-[#2d2f45]">
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Tarif</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Horaires</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Montant</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seancesPonctuelles.map((s) => {
                                    const st = STATUTS_PONCTUEL[s.statut] ?? STATUTS_PONCTUEL.annulee
                                    return (
                                        <tr key={s.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05]">
                                            <td className="px-6 py-4 text-white text-sm font-medium">
                                                {s.tarif_ponctuel?.libelle ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                                                {s.heure_debut ? s.heure_debut.slice(0, 5) : '—'}
                                                {s.heure_fin   ? ` → ${s.heure_fin.slice(0, 5)}` : ''}
                                            </td>
                                            <td className="px-6 py-4 text-[#e05c3a] font-bold text-sm">
                                                {Number(s.montant).toLocaleString('fr-FR')}
                                                <span className="text-gray-500 font-normal text-xs ml-1">FCFA</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${st.bg} ${st.text}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                      </div>
                    </div>
                )}
            </div>

            {/* ── Modal demande séance ponctuelle ── */}
            <Modal isOpen={modalPonctuelOpen} onClose={() => setModalPonctuelOpen(false)} title="Demander une séance ponctuelle">
                <form onSubmit={handleDemanderPonctuelle} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Choix du tarif */}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Durée</label>
                        <div className="grid grid-cols-3 gap-3">
                            {tarifsPonctuels.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setForm({ ...form, tarif_ponctuel_id: t.id })}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors ${
                                        form.tarif_ponctuel_id === t.id
                                            ? 'border-[#e05c3a] bg-[#e05c3a]/10 text-white'
                                            : 'border-[#2d2f45] bg-[#0f1117] text-gray-400 hover:border-[#e05c3a]/50'
                                    }`}
                                >
                                    <span className="font-semibold">{t.libelle}</span>
                                    <span className="text-xs text-[#e05c3a] font-bold">
                                        {Number(t.montant).toLocaleString('fr-FR')} FCFA
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Date souhaitée</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        />
                    </div>

                    {/* Heure de début */}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Heure de début</label>
                        <select
                            value={form.heure_debut}
                            onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
                            required
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors"
                        >
                            <option value="">--:--</option>
                            {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        {tarifSelectionne && form.heure_debut && (
                            <p className="text-gray-500 text-xs mt-1.5">
                                Fin prévue à {calcHeureFin(form.heure_debut, tarifSelectionne.duree_minutes)}
                            </p>
                        )}
                    </div>

                    {/* Résumé */}
                    {tarifSelectionne && (
                        <div className="bg-[#e05c3a]/10 border border-[#e05c3a]/20 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-gray-400 text-sm">{tarifSelectionne.libelle} · {tarifSelectionne.duree_minutes} min</span>
                            <span className="text-[#e05c3a] font-bold text-sm">
                                {Number(tarifSelectionne.montant).toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Notes (optionnel)</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            placeholder="Précisions sur votre séance..."
                            className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e05c3a] transition-colors resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={formLoading || !form.tarif_ponctuel_id || !form.date || !form.heure_debut}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {formLoading ? 'Envoi en cours...' : 'Envoyer la demande →'}
                    </button>
                </form>
            </Modal>
            </>
            )}
        </div>
    )
}

// ── Composant carte séance coach (inchangé) ───────────────────────────────────

function SeanceCoachCard({ seance, showDate, expanded, onToggle }) {
    return (
        <div className="px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{seance.titre}</p>
                        {seance.statut === 'annulee' && (
                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                Annulée
                            </span>
                        )}
                        {seance.statut === 'effectuee' && (
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Effectuée
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {showDate && seance.date && (
                            <span className="text-blue-400 text-xs font-medium">
                                {new Date(seance.date).toLocaleDateString('fr-FR')} ·
                            </span>
                        )}
                        <Clock size={12} color="#6b7280" />
                        <span className="text-gray-500 text-xs">{seance.heure_debut} - {seance.heure_fin}</span>
                        {seance.exercices?.length > 0 && (
                            <span className="text-gray-600 text-xs">· {seance.exercices.length} exercice{seance.exercices.length > 1 ? 's' : ''}</span>
                        )}
                    </div>
                </div>
                <button onClick={onToggle} aria-label={expanded ? 'Réduire les détails' : 'Afficher les détails'} aria-expanded={expanded} className="text-gray-500 hover:text-white transition-colors">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {expanded && seance.exercices?.length > 0 && (
                <div className="mt-4 space-y-2">
                    {seance.exercices.map((ex, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#0f1117] rounded-xl px-4 py-2.5">
                            <span className="text-[#1d9e75] text-xs font-bold w-4">{i + 1}</span>
                            <span className="text-white text-sm flex-1">{ex.nom_exercice}</span>
                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                                {ex.series     && <span>{ex.series} séries</span>}
                                {ex.repetitions && <span>{ex.repetitions} reps</span>}
                                {ex.repos_secondes && <span>{ex.repos_secondes}s repos</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {expanded && seance.notes && (
                <div className="mt-3 bg-[#0f1117] rounded-xl px-4 py-2.5">
                    <p className="text-gray-400 text-xs">{seance.notes}</p>
                </div>
            )}
        </div>
    )
}