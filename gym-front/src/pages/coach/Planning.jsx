import { useState, useEffect } from 'react'
import { getPlanningCoach, createSeanceCoach, updateSeanceCoach, deleteSeanceCoach } from '../../api/planning'
import { getMesMembres } from '../../api/coach'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import { Plus, Trash2, Edit2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

// Jour de la semaine d'une date "YYYY-MM-DD" (ou avec suffixe horaire/Z), à
// partir des composants locaux plutôt que d'un parsing UTC direct — évite un
// décalage d'un jour selon le fuseau horaire de l'utilisateur.
const JOURS_PAR_GETDAY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const dateVersJour = (dateStr) => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
    return JOURS_PAR_GETDAY[new Date(y, m - 1, d).getDay()]
}

const INITIAL_FORM = {
    membre_id: '', titre: '', type: 'coach',
    jour: '', date: '', heure_debut: '', heure_fin: '',
    recurrente: false, notes: '', exercices: [],
}

const INITIAL_EXERCICE = {
    nom_exercice: '', series: '', repetitions: '', repos_secondes: '', notes: '',
}

export default function CoachPlanning() {
    const [seances, setSeances]               = useState([])
    const [membres, setMembres]               = useState([])
    const [loading, setLoading]               = useState(true)
    const [modalOpen, setModalOpen]           = useState(false)
    const [form, setForm]                     = useState(INITIAL_FORM)
    const [formLoading, setFormLoading]       = useState(false)
    const [error, setError]                   = useState('')
    const [toast, setToast]                   = useState(null)
    const [confirmOpen, setConfirmOpen]       = useState(false)
    const [seanceToDelete, setSeanceToDelete] = useState(null)
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
    const [seanceToCancel, setSeanceToCancel] = useState(null)
    const [expandedSeance, setExpandedSeance] = useState(null)
    const [editMode, setEditMode]             = useState(false)
    const [seanceToEdit, setSeanceToEdit]     = useState(null)
    const [vue, setVue]                       = useState('semaine')
    const [filtreJour, setFiltreJour]         = useState('')

    const fetchData = async () => {
        try {
            const [seancesRes, membresRes] = await Promise.all([
                getPlanningCoach(),
                getMesMembres(),
            ])
            setSeances(seancesRes.data)
            setMembres(membresRes.data)
        } catch {
            console.error('Erreur chargement planning')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchData(), 0)
    }, [])

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm({ ...form, [e.target.name]: val })
    }

    const addExercice    = () => setForm({ ...form, exercices: [...form.exercices, { ...INITIAL_EXERCICE }] })
    const removeExercice = (i) => setForm({ ...form, exercices: form.exercices.filter((_, idx) => idx !== i) })
    const updateExercice = (i, field, value) => {
        const exercices = [...form.exercices]
        exercices[i] = { ...exercices[i], [field]: value }
        setForm({ ...form, exercices })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        setError('')
        try {
            if (editMode) {
                // Une séance ponctuelle ne peut être modifiée que sur la date, les
                // horaires et les exercices — on n'envoie que ces champs pour
                // rester conforme à la restriction appliquée côté serveur.
                const payload = form.recurrente
                    ? form
                    : { date: form.date, heure_debut: form.heure_debut, heure_fin: form.heure_fin, exercices: form.exercices }
                await updateSeanceCoach(seanceToEdit.id, payload)
                setToast({ message: 'Séance modifiée avec succès', type: 'success' })
            } else {
                await createSeanceCoach(form)
                setToast({ message: 'Séance créée avec succès', type: 'success' })
            }
            await fetchData()
            closeModal()
        } catch (err) {
            const errors = err.response?.data?.errors
            setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteSeanceCoach(seanceToDelete)
            await fetchData()
            setToast({ message: 'Séance supprimée', type: 'success' })
        } catch {
            setToast({ message: 'Erreur suppression', type: 'error' })
        } finally {
            setConfirmOpen(false)
            setSeanceToDelete(null)
        }
    }

    // Pour une séance ponctuelle, la seule modification possible côté coach
    // est l'annulation — pas d'accès au formulaire complet.
    const handleCancelSeance = async () => {
        try {
            await updateSeanceCoach(seanceToCancel, { statut: 'annulee' })
            await fetchData()
            setToast({ message: 'Séance annulée', type: 'success' })
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Erreur lors de l\'annulation', type: 'error' })
        } finally {
            setCancelConfirmOpen(false)
            setSeanceToCancel(null)
        }
    }

    const openEditModal = (seance) => {
        setEditMode(true)
        setSeanceToEdit(seance)
        setForm({
            membre_id:   seance.membre_id || '',
            titre:       seance.titre,
            type:        seance.type,
            jour:        seance.jour || '',
            date:        seance.date || '',
            heure_debut: seance.heure_debut,
            heure_fin:   seance.heure_fin,
            recurrente:  seance.recurrente,
            notes:       seance.notes || '',
            exercices:   seance.exercices || [],
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setForm(INITIAL_FORM)
        setError('')
        setEditMode(false)
        setSeanceToEdit(null)
    }

    const seancesParJour     = JOURS.reduce((acc, jour) => {
        acc[jour] = seances.filter(s => s.recurrente && s.jour === jour)
        return acc
    }, {})
    const seancesSpecifiques = seances.filter(s => !s.recurrente && s.date)

    // Filtre par jour de la semaine — utilisé uniquement en vue Liste. Pour une
    // séance récurrente, on compare directement son "jour" ; pour une séance
    // ponctuelle (datée), on dérive le jour à partir de sa date.
    const seancesListe = seances.filter(s => {
        if (!filtreJour) return true
        return s.recurrente ? s.jour === filtreJour : dateVersJour(s.date) === filtreJour
    })

    const statutColor = (statut) => {
        if (statut === 'planifiee') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        if (statut === 'effectuee') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        if (statut === 'annulee')   return 'bg-red-500/10 text-red-400 border-red-500/20'
        return ''
    }

    return (
        <div className="p-6">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmModal
                isOpen={confirmOpen}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setSeanceToDelete(null) }}
                message="Supprimer cette séance ?"
            />
            <ConfirmModal
                isOpen={cancelConfirmOpen}
                onConfirm={handleCancelSeance}
                onCancel={() => { setCancelConfirmOpen(false); setSeanceToCancel(null) }}
                message="Annuler cette séance ? Le membre sera notifié."
            />

            {/* Header — visible immédiatement, ne dépend pas du chargement du planning */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-white text-2xl font-bold">Mon planning</h1>
                    <p className="text-gray-500 text-sm mt-1">{seances.length} séance{seances.length > 1 ? 's' : ''} planifiée{seances.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex bg-[#1a1a2a] border border-[#2d2f45] rounded-xl overflow-hidden">
                        <button onClick={() => setVue('semaine')}
                            className={`px-4 py-2 text-sm transition-colors ${vue === 'semaine' ? 'bg-[#1d9e75]/10 text-[#1d9e75]' : 'text-gray-400 hover:text-white'}`}>
                            Semaine
                        </button>
                        <button onClick={() => setVue('liste')}
                            className={`px-4 py-2 text-sm transition-colors ${vue === 'liste' ? 'bg-[#1d9e75]/10 text-[#1d9e75]' : 'text-gray-400 hover:text-white'}`}>
                            Liste
                        </button>
                    </div>
                    <button onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1d9e75] hover:bg-[#0f6e56] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                        <Plus size={14} />
                        Nouvelle séance
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden animate-pulse">
                            <div className="flex items-center justify-between px-6 py-3 border-b border-[#2d2f45]">
                                <div className="h-3 bg-[#2d2f45] rounded w-20" />
                                <div className="h-2.5 bg-[#2d2f45] rounded w-16" />
                            </div>
                            <div className="px-6 py-4 space-y-3">
                                {Array.from({ length: 2 }).map((_, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2d2f45] shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-2.5 bg-[#2d2f45] rounded w-1/3" />
                                            <div className="h-2 bg-[#2d2f45] rounded w-1/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
            <>
            {/* Vue semaine */}
            {vue === 'semaine' && (
                <div className="space-y-4">
                    {JOURS.map((jour) => (
                        <div key={jour} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-3 border-b border-[#2d2f45]">
                                <h3 className="text-white font-semibold capitalize">{jour}</h3>
                                <span className="text-gray-500 text-xs">
                                    {seancesParJour[jour].length} séance{seancesParJour[jour].length > 1 ? 's' : ''}
                                </span>
                            </div>
                            {seancesParJour[jour].length === 0 ? (
                                <div className="px-6 py-4 text-gray-600 text-sm">Aucune séance</div>
                            ) : (
                                <div className="divide-y divide-[#2d2f45]/50">
                                    {seancesParJour[jour].map((seance) => (
                                        <SeanceCard
                                            key={seance.id}
                                            seance={seance}
                                            showDate={false}
                                            expanded={expandedSeance === seance.id}
                                            onToggle={() => setExpandedSeance(expandedSeance === seance.id ? null : seance.id)}
                                            onEdit={() => openEditModal(seance)}
                                            onDelete={() => { setSeanceToDelete(seance.id); setConfirmOpen(true) }}
                                            statutColor={statutColor}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {seancesSpecifiques.length > 0 && (
                        <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                            <div className="px-6 py-3 border-b border-[#2d2f45]">
                                <h3 className="text-white font-semibold">Séances ponctuelles</h3>
                            </div>
                            <div className="divide-y divide-[#2d2f45]/50">
                                {seancesSpecifiques.map((seance) => (
                                    <SeanceCard
                                        key={seance.id}
                                        seance={seance}
                                        showDate={true}
                                        expanded={expandedSeance === seance.id}
                                        onToggle={() => setExpandedSeance(expandedSeance === seance.id ? null : seance.id)}
                                        onEdit={seance.statut === 'planifiee' ? () => openEditModal(seance) : null}
                                        onCancel={() => { setSeanceToCancel(seance.id); setCancelConfirmOpen(true) }}
                                        onDelete={() => { setSeanceToDelete(seance.id); setConfirmOpen(true) }}
                                        statutColor={statutColor}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Vue liste */}
            {vue === 'liste' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                    <select
                        value={filtreJour}
                        onChange={(e) => setFiltreJour(e.target.value)}
                        className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors"
                    >
                        <option value="">Tous les jours</option>
                        {JOURS.map(j => (
                            <option key={j} value={j} className="capitalize">{j.charAt(0).toUpperCase() + j.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-180">
                        <thead>
                            <tr className="border-b border-[#2d2f45]">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Membre</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Séance</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Jour / Date</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Heure</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {seancesListe.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-500 py-12">
                                    {filtreJour ? 'Aucune séance ce jour-là' : 'Aucune séance planifiée'}
                                </td></tr>
                            ) : seancesListe.map((seance) => (
                                <tr key={seance.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                                                {seance.membre?.prenom?.[0]}{seance.membre?.nom?.[0]}
                                            </div>
                                            <span className="text-white text-sm">{seance.membre?.prenom} {seance.membre?.nom}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white text-sm">{seance.titre}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm capitalize">
                                        {seance.recurrente
                                            ? `Tous les ${seance.jour}s`
                                            : seance.date
                                                ? new Date(seance.date).toLocaleDateString('fr-FR')
                                                : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {seance.heure_debut} - {seance.heure_fin}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full border ${statutColor(seance.statut)}`}>
                                            {seance.statut}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {seance.recurrente ? (
                                                <button onClick={() => openEditModal(seance)} aria-label={`Modifier la séance ${seance.titre}`} className="text-gray-500 hover:text-[#1d9e75] transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                            ) : seance.statut === 'planifiee' && (
                                                <>
                                                    <button onClick={() => openEditModal(seance)} aria-label={`Modifier la séance ${seance.titre}`} className="text-gray-500 hover:text-[#1d9e75] transition-colors">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => { setSeanceToCancel(seance.id); setCancelConfirmOpen(true) }} aria-label={`Annuler la séance ${seance.titre}`} title="Annuler la séance" className="text-gray-500 hover:text-red-400 transition-colors">
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => { setSeanceToDelete(seance.id); setConfirmOpen(true) }} aria-label={`Supprimer la séance ${seance.titre}`} className="text-gray-500 hover:text-red-400 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={closeModal} title={editMode ? 'Modifier la séance' : 'Nouvelle séance'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {editMode && !form.recurrente ? (
                        // Séance ponctuelle : seules la date, les horaires et les
                        // exercices restent modifiables — membre/titre/type figés.
                        <div className="bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3">
                            <p className="text-white text-sm font-medium">{form.titre}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {membres.find(m => m.id === form.membre_id)?.prenom} {membres.find(m => m.id === form.membre_id)?.nom}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Membre</label>
                                <select name="membre_id" value={form.membre_id} onChange={handleChange} required
                                    className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors">
                                    <option value="">Sélectionner un membre</option>
                                    {membres.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Titre</label>
                                <input name="titre" value={form.titre} onChange={handleChange} required
                                    placeholder="Ex: Séance jambes, Cardio..."
                                    className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors" />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Type</label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="recurrente" checked={form.recurrente} onChange={handleChange} className="rounded" />
                                    <span className="text-white text-sm">Récurrente (hebdomadaire)</span>
                                </label>
                            </div>
                        </>
                    )}

                    {form.recurrente ? (
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Jour</label>
                            <select name="jour" value={form.jour} onChange={handleChange}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors">
                                <option value="">Choisir un jour</option>
                                {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Date</label>
                            <input name="date" type="date" value={form.date} onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Heure début</label>
                            <select name="heure_debut" value={form.heure_debut} onChange={handleChange} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors">
                                <option value="">--:--</option>
                                {Array.from({ length: 24 }, (_, h) =>
                                    ['00', '30'].map(m => {
                                        const val = `${String(h).padStart(2, '0')}:${m}`
                                        return <option key={val} value={val}>{val}</option>
                                    })
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Heure fin</label>
                            <select name="heure_fin" value={form.heure_fin} onChange={handleChange} required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors">
                                <option value="">--:--</option>
                                {Array.from({ length: 24 }, (_, h) =>
                                    ['00', '30'].map(m => {
                                        const val = `${String(h).padStart(2, '0')}:${m}`
                                        return <option key={val} value={val}>{val}</option>
                                    })
                                )}
                            </select>
                        </div>
                    </div>

                    {!(editMode && !form.recurrente) && (
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Notes</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors resize-none" />
                        </div>
                    )}

                    {/* Exercices */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Exercices</label>
                            <button type="button" onClick={addExercice}
                                className="flex items-center gap-1 text-[#1d9e75] text-xs hover:underline">
                                <Plus size={12} /> Ajouter
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.exercices.map((ex, index) => (
                                <div key={index} className="bg-[#0f1117] border border-[#2d2f45] rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 text-xs">Exercice {index + 1}</span>
                                        <button type="button" onClick={() => removeExercice(index)}
                                            aria-label={`Supprimer l'exercice ${index + 1}`}
                                            className="text-gray-600 hover:text-red-400 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <input placeholder="Nom de l'exercice"
                                        value={ex.nom_exercice}
                                        onChange={(e) => updateExercice(index, 'nom_exercice', e.target.value)}
                                        className="w-full bg-[#1a1a2a] border border-[#2d2f45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1d9e75]" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="number" placeholder="Séries"
                                            value={ex.series}
                                            onChange={(e) => updateExercice(index, 'series', e.target.value)}
                                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1d9e75]" />
                                        <input type="number" placeholder="Reps"
                                            value={ex.repetitions}
                                            onChange={(e) => updateExercice(index, 'repetitions', e.target.value)}
                                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1d9e75]" />
                                        <input type="number" placeholder="Repos (s)"
                                            value={ex.repos_secondes}
                                            onChange={(e) => updateExercice(index, 'repos_secondes', e.target.value)}
                                            className="bg-[#1a1a2a] border border-[#2d2f45] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#1d9e75]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={formLoading}
                        className="w-full bg-[#1d9e75] hover:bg-[#0f6e56] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                        {formLoading ? 'Enregistrement...' : editMode ? 'Modifier la séance' : 'Créer la séance'}
                    </button>
                </form>
            </Modal>
            </>
            )}
        </div>
    )
}

function SeanceCard({ seance, expanded, onToggle, onEdit, onCancel, onDelete, statutColor, showDate }) {
    return (
        <div className="px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-[#e05c3a]/20 text-[#e05c3a] flex items-center justify-center text-xs font-bold shrink-0">
                        {seance.membre?.prenom?.[0]}{seance.membre?.nom?.[0]}
                    </div>
                    <div>
                        <p className="text-white text-sm font-medium">{seance.titre}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-gray-500 text-xs">{seance.membre?.prenom} {seance.membre?.nom}</span>
                            <span className="text-gray-600 text-xs">·</span>
                            {showDate && seance.date && (
                                <>
                                    <span className="text-blue-400 text-xs font-medium">
                                        {new Date(seance.date).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="text-gray-600 text-xs">·</span>
                                </>
                            )}
                            <span className="text-gray-500 text-xs">{seance.heure_debut} - {seance.heure_fin}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statutColor(seance.statut)}`}>
                        {seance.statut}
                    </span>
                    {onEdit && (
                        <button onClick={onEdit} aria-label={`Modifier la séance ${seance.titre}`} className="text-gray-500 hover:text-[#1d9e75] transition-colors">
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onCancel && seance.statut === 'planifiee' && (
                        <button onClick={onCancel} aria-label={`Annuler la séance ${seance.titre}`} title="Annuler la séance" className="text-gray-500 hover:text-red-400 transition-colors">
                            <XCircle size={14} />
                        </button>
                    )}
                    <button onClick={onDelete} aria-label={`Supprimer la séance ${seance.titre}`} className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                    </button>
                    <button onClick={onToggle} aria-label={expanded ? 'Réduire les détails' : 'Afficher les détails'} aria-expanded={expanded} className="text-gray-500 hover:text-white transition-colors">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {expanded && seance.exercices?.length > 0 && (
                <div className="mt-4 ml-11 space-y-2">
                    {seance.exercices.map((ex, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#0f1117] rounded-xl px-4 py-2.5">
                            <span className="text-[#1d9e75] text-xs font-bold w-4">{i + 1}</span>
                            <span className="text-white text-sm flex-1">{ex.nom_exercice}</span>
                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                                {ex.series && <span>{ex.series} séries</span>}
                                {ex.repetitions && <span>{ex.repetitions} reps</span>}
                                {ex.repos_secondes && <span>{ex.repos_secondes}s repos</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {expanded && seance.notes && (
                <div className="mt-3 ml-11 bg-[#0f1117] rounded-xl px-4 py-2.5">
                    <p className="text-gray-400 text-xs">{seance.notes}</p>
                </div>
            )}
        </div>
    )
}