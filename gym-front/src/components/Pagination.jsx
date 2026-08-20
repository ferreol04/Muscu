import { ChevronLeft, ChevronRight } from 'lucide-react'

// Composant de pagination réutilisable, attend le format standard Laravel
// (current_page, last_page, total). Ne s'affiche pas s'il n'y a qu'une page.
export default function Pagination({ currentPage, lastPage, total, onPageChange }) {
    if (!lastPage || lastPage <= 1) return null

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2d2f45]">
            <p className="text-gray-500 text-xs">
                Page {currentPage} / {lastPage}{typeof total === 'number' ? ` — ${total} résultat${total > 1 ? 's' : ''}` : ''}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                >
                    <ChevronLeft size={13} />
                    Précédent
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                    className="flex items-center gap-1 bg-[#1a1a2a] border border-[#2d2f45] text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                >
                    Suivant
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    )
}
