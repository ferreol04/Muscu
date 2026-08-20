import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { resendSetupLink } from '../api/setup'

export default function SetupResend() {
    const [email, setEmail]     = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError]     = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await resendSetupLink({ email })
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#e05c3a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Dumbbell size={28} color="white" />
                    </div>
                    <h1 className="text-white text-2xl font-bold">GymPro</h1>
                    <p className="text-gray-500 text-sm mt-1">Nouveau lien d'activation</p>
                </div>

                <div className="bg-[#1a1a2a] rounded-2xl p-8 border border-[#2d2f45]">
                    {success ? (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17l-5-5" stroke="#1d9e75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className="text-white font-semibold text-lg mb-2">Demande envoyée !</h2>
                            <p className="text-gray-500 text-sm">
                                Contacte l'admin ou vérifie ton email pour récupérer le nouveau lien d'activation.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-white font-semibold text-lg mb-1">Renvoyer le lien</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Entre ton email pour recevoir un nouveau lien d'activation.
                            </p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="vous@exemple.com"
                                        required
                                        className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Envoi...' : 'Envoyer le lien →'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}