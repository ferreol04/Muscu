export default function Badge({ statut }) {
    const config = {
        actif:           { label: 'Actif',           className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
        expire_bientot:  { label: 'Expire bientôt',  className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
        expire:          { label: 'Expiré',           className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
        suspendu:        { label: 'Suspendu',         className: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' },
        en_attente:      { label: 'En attente',       className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
        sans_abonnement: { label: 'Sans abonnement',  className: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' },
        aucun:           { label: 'Sans abonnement',  className: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' },
    }

    const { label, className } = config[statut] || config.aucun

    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
            {label}
        </span>
    )
}