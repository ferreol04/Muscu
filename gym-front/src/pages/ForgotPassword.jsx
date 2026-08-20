import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/membre-profile'
import { Dumbbell } from 'lucide-react'

export default function ForgotPassword() {
    const [email, setEmail]     = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError]     = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await forgotPassword({ email })
            setSuccess(true)
        } catch {
            setError('Une erreur est survenue. Réessayez.')
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
                    <p className="text-gray-500 text-sm mt-1">Réinitialisation du mot de passe</p>
                </div>

                <div className="bg-[#1a1a2a] rounded-2xl p-8 border border-[#2d2f45]">
                    {success ? (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17l-5-5" stroke="#1d9e75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className="text-white font-semibold text-lg mb-2">Email envoyé !</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Vous recevrez un lien de réinitialisation dans quelques minutes, vérifiez votre boîte de réception.
                            </p>
                            <Link to="/login" className="text-[#e05c3a] text-sm hover:underline">
                                Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-white font-semibold text-lg mb-1">Mot de passe oublié ?</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            Le lien expire dans <span className="text-white">1 heure</span>.
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

                            <p className="text-center text-gray-500 text-sm mt-6">
                                <Link to="/login" className="text-[#e05c3a] hover:underline">
                                    ← Retour à la connexion
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}