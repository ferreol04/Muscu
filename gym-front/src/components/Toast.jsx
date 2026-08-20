import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all ${
            type === 'success'
                ? 'bg-[#1a1a2a] border-[#1d9e75]/40 text-[#1d9e75]'
                : 'bg-[#1a1a2a] border-[#e05c3a]/40 text-[#e05c3a]'
        }`}>
            {type === 'success'
                ? <CheckCircle size={18} />
                : <XCircle size={18} />
            }
            <span className="text-sm font-medium text-white">{message}</span>
            <button onClick={onClose} className="ml-2 text-gray-500 hover:text-white transition-colors">
                <X size={14} />
            </button>
        </div>
    )
}