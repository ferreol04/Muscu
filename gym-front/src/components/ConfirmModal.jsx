import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ isOpen, onConfirm, onCancel, message, title, confirmLabel, loading }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-[#1a1a2a] border border-[#2d2f45] rounded-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                        <AlertTriangle size={22} color="#e24b4a" />
                    </div>
                </div>
                <h3 className="text-white font-semibold text-center text-lg mb-2">
                    {title || 'Confirmer la suppression'}
                </h3>
                <p className="text-gray-400 text-sm text-center mb-6">
                    {message || 'Cette action est irréversible.'}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-[#0f1117] border border-[#2d2f45] text-gray-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? '...' : (confirmLabel || 'Supprimer')}
                    </button>
                </div>
            </div>
        </div>
    )
}