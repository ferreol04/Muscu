import { useState, useEffect } from 'react'
import { getPlanningAdmin, updateSeance, deleteSeance } from '../../api/planning'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import { Trash2, XCircle, Filter, Search } from 'lucide-react'

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export default function AdminPlanning() {
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [seanceToDelete, setSeanceToDelete] = useState(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [seanceToCancel, setSeanceToCancel] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Filtres
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreJour, setFiltreJour] = useState('')
  const [filtreDate, setFiltreDate] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Recherche débouncée — évite un appel API à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchData = async () => {
    setLoading(true)
    try {
      const seancesRes = await getPlanningAdmin({ search, statut: filtreStatut, jour: filtreJour, date: filtreDate, page })
      setSeances(seancesRes.data.data)
      setLastPage(seancesRes.data.last_page)
      setTotal(seancesRes.data.total)
    } catch {
      console.error('Erreur chargement planning')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [search, filtreStatut, filtreJour, filtreDate, page])

  // Revient à la page 1 quand un filtre change
  useEffect(() => {
    setPage(1)
  }, [search, filtreStatut, filtreJour, filtreDate])

  const handleDelete = async () => {
    try {
      await deleteSeance(seanceToDelete)
      fetchData()
      setToast({ message: 'Séance supprimée', type: 'success' })
    } catch {
      setToast({ message: 'Erreur suppression', type: 'error' })
    } finally {
      setConfirmOpen(false)
      setSeanceToDelete(null)
    }
  }

  // Pour une séance ponctuelle, la seule modification possible côté admin est
  // l'annulation — action directe, pas de formulaire.
  const handleCancelSeance = async () => {
    setCancelLoading(true)
    try {
      await updateSeance(seanceToCancel, { statut: 'annulee' })
      fetchData()
      setToast({ message: 'Séance annulée', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Erreur lors de l'annulation", type: 'error' })
    } finally {
      setCancelLoading(false)
      setCancelConfirmOpen(false)
      setSeanceToCancel(null)
    }
  }


  const typeLabel = (type) => {
    if (type === 'coach') return { label: 'Coach', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    if (type === 'libre') return { label: 'Libre', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    return { label: type, className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
  }

  const statutColor = (statut) => {
    if (statut === 'planifiee') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (statut === 'effectuee') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (statut === 'annulee') return 'bg-red-500/10 text-red-400 border-red-500/20'
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
        title="Annuler la séance"
        message="Annuler cette séance ? Le membre en sera informé."
        confirmLabel="Annuler la séance"
        loading={cancelLoading}
      />

      <h1 className="text-white text-2xl font-bold mb-4 py-5">Planning global</h1>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un membre ou un coach..."
            className="w-full bg-[#1a1a2a] border border-[#2d2f45] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
          />
        </div>

        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm">
          <option value="">Tous les statuts</option>
          <option value="planifiee">Planifiée</option>
          <option value="effectuee">Effectuée</option>
          <option value="annulee">Annulée</option>
        </select>

        {/* Jour et date filtrent la même chose (le jour de la séance) : les
            activer ensemble donnerait un résultat vide dès qu'ils ne
            coïncident pas, donc un seul est utilisable à la fois. */}
        <select
          value={filtreJour}
          onChange={(e) => setFiltreJour(e.target.value)}
          disabled={!!filtreDate}
          title={filtreDate ? 'Effacez la date pour filtrer par jour de la semaine' : undefined}
          className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="">Tous les jours</option>
          {JOURS.map(j => (
            <option key={j} value={j} className="capitalize">{j.charAt(0).toUpperCase() + j.slice(1)}</option>
          ))}
        </select>

        <input
          type="date"
          value={filtreDate}
          onChange={(e) => setFiltreDate(e.target.value)}
          disabled={!!filtreJour}
          title={filtreJour ? 'Effacez le jour de la semaine pour filtrer par date' : undefined}
          className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      {(searchInput || filtreStatut || filtreJour || filtreDate) && (
        <button onClick={() => { setSearchInput(''); setFiltreStatut(''); setFiltreJour(''); setFiltreDate('') }}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-xs mb-4 transition-colors">
          <Filter size={12} /> Réinitialiser les filtres
        </button>
      )}

      {/* Tableau — la carte s'affiche immédiatement, le tableau n'apparaît qu'une fois les données prêtes */}
      <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Chargement...</div>
        ) : seances.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">Aucune séance trouvée</div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b border-[#2d2f45]">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Membre</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Coach</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Séance</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Jour / Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Heure</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {seances.map(seance => {
                  const type = typeLabel(seance.type)
                  return (
                    <tr key={seance.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05] transition-colors">
                      <td className="px-6 py-4 text-white text-sm font-medium">{seance.membre?.prenom} {seance.membre?.nom}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{seance.coach ? `${seance.coach.prenom} ${seance.coach.nom}` : '—'}</td>
                      <td className="px-6 py-4 text-white text-sm">{seance.titre}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${type.className}`}>{type.label}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {seance.recurrente ? `Tous les ${seance.jour}s` : (seance.date ? new Date(seance.date).toLocaleDateString('fr-FR') : '—')}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{seance.heure_debut} - {seance.heure_fin}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${statutColor(seance.statut)}`}>{seance.statut}</span>
                      </td>
                      <td className="px-6 py-4">
                        {seance.recurrente ? (
                          <span className="text-gray-600 text-xs" title="Une séance récurrente ne peut être modifiée ou supprimée que par le coach qui l'a créée">
                            Géré par le coach
                          </span>
                        ) : seance.statut === 'effectuee' ? (
                          <span className="text-gray-600 text-xs" title="Une séance déjà effectuée ne peut plus être modifiée">
                            Séance effectuée
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            {seance.statut === 'planifiee' && (
                              <button onClick={() => { setSeanceToCancel(seance.id); setCancelConfirmOpen(true) }} aria-label={`Annuler la séance ${seance.titre}`} title="Annuler la séance" className="text-gray-500 hover:text-red-400 transition-colors">
                                <XCircle size={14} />
                              </button>
                            )}
                            <button onClick={() => { setSeanceToDelete(seance.id); setConfirmOpen(true) }} aria-label={`Supprimer la séance ${seance.titre}`} className="text-gray-500 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
            <Pagination currentPage={page} lastPage={lastPage} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}