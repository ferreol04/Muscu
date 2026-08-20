import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMesMembres } from '../../api/coach'
import Badge from '../../components/Badge'
import { Users } from 'lucide-react'

export default function CoachMembres() {
    const [searchParams]          = useSearchParams()
    const [membres, setMembres]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [search, setSearch]     = useState('')
    // Initialisé depuis l'URL (?statut=...) — permet d'arriver déjà filtré
    // depuis un lien externe (ex. les cartes cliquables du dashboard coach)
    const [filtreStatut, setFiltreStatut] = useState(searchParams.get('statut') || '')

    const fetchMembres = async () => {
        try {
            const res = await getMesMembres()
            setMembres(res.data)
        } catch {
            console.error('Erreur chargement membres')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setTimeout(() => fetchMembres(), 0)
    }, [])

    const membresFiltres = membres.filter(m =>
        (`${m.prenom} ${m.nom}`.toLowerCase().includes(search.toLowerCase()) ||
            m.email.toLowerCase().includes(search.toLowerCase())) &&
        (!filtreStatut || m.statut === filtreStatut)
    )

    return (
        <div className="p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-white text-2xl font-bold">Mes membres</h1>
                    <p className="text-gray-500 text-sm mt-1">{membres.length} membre{membres.length > 1 ? 's' : ''} assigné{membres.length > 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Recherche + filtre statut */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <input
                    type="text"
                    placeholder="Rechercher un membre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#1d9e75] transition-colors"
                />
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="bg-[#1a1a2a] border border-[#2d2f45] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1d9e75] transition-colors"
                >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="expire_bientot">Expire bientôt</option>
                    <option value="expire">Expiré</option>
                    <option value="suspendu">Suspendu</option>
                </select>
            </div>

            {/* Tableau */}
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-160">
                    <thead>
                        <tr className="border-b border-[#2d2f45]">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Membre</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Téléphone</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Objectif</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Abonnement</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center text-gray-500 py-12">
                                    Chargement...
                                </td>
                            </tr>
                        ) : membresFiltres.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center text-gray-500 py-12">
                                    {search || filtreStatut ? 'Aucun résultat' : 'Aucun membre assigné'}
                                </td>
                            </tr>
                        ) : membresFiltres.map((membre) => (
                            <tr key={membre.id} className="border-b border-[#2d2f45]/50 hover:bg-[#ffffff05] transition-colors">
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
                                <td className="px-6 py-4 text-gray-400 text-sm">{membre.objectif || '—'}</td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-300 text-sm capitalize">
                                        {membre.abonnement_actuel?.type || '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge statut={membre.statut} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
        </div>
    )
}
