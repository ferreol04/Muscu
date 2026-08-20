import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dumbbell, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { verifySetupToken, setupPassword } from '../api/setup'

export default function SetupPassword() {
    const [searchParams]                      = useSearchParams()
    const token                               = searchParams.get('token')
    const navigate                            = useNavigate()

    const [step, setStep]                     = useState('loading')
    const [memberInfo, setMemberInfo]         = useState(null)
    const [form, setForm]                     = useState({ password: '', password_confirmation: '' })
    const [showPassword, setShowPassword]     = useState(false)
    const [showConfirm, setShowConfirm]       = useState(false)
    const [error, setError]                   = useState('')
    const [loading, setLoading]               = useState(false)

    const verifyToken = async () => {
        try {
            const res = await verifySetupToken(token)
            setMemberInfo(res.data)
            setStep('valid')
        } catch {
            setStep('invalid')
        }
    }

    useEffect(() => {
        if (!token) {
            setStep('invalid')
            return
        }
        setTimeout(() => verifyToken(), 0)
    }, [token])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.password_confirmation) {
            setError('Les mots de passe ne correspondent pas')
            return
        }
        setLoading(true)
        setError('')
        try {
            await setupPassword({ token, ...form })
            setStep('success')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            const errors = err.response?.data?.errors
            setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Erreur')
        } finally {
            setLoading(false)
        }
    }

    // Loading
    if (step === 'loading') {
        return (
            <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[#e05c3a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Vérification du lien...</p>
                </div>
            </div>
        )
    }

    // Lien invalide ou expiré
    if (step === 'invalid') {
        return (
            <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                stroke="#e24b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="text-white text-2xl font-bold mb-2">Lien invalide ou expiré</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        Ce lien n'est plus valide. Il a peut-être expiré (48h) ou déjà été utilisé.
                    </p>
                    <button
                        onClick={() => navigate('/setup/resend')}
                        className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                    >
                        Demander un nouveau lien
                    </button>
                </div>
            </div>
        )
    }

    // Succès
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} color="#1d9e75" />
                    </div>
                    <h1 className="text-white text-2xl font-bold mb-2">Mot de passe créé !</h1>
                    <p className="text-gray-500 text-sm">
                        Redirection vers la page de connexion...
                    </p>
                </div>
            </div>
        )
    }

    // Formulaire
    return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#e05c3a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Dumbbell size={28} color="white" />
                    </div>
                    <h1 className="text-white text-2xl font-bold">GymPro</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Bienvenue, <span className="text-white font-medium">{memberInfo?.nom}</span> !
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1a2a] rounded-2xl p-8 border border-[#2d2f45]">
                    <h2 className="text-white font-semibold text-lg mb-1">Choisissez votre mot de passe</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Compte : <span className="text-gray-300">{memberInfo?.email}</span>
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 8 caractères"
                                    required
                                    className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Indicateur force mot de passe */}
                        {form.password && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${
                                                form.password.length >= i * 2
                                                    ? i <= 1 ? 'bg-red-500'
                                                    : i <= 2 ? 'bg-amber-500'
                                                    : i <= 3 ? 'bg-blue-500'
                                                    : 'bg-emerald-500'
                                                    : 'bg-[#2d2f45]'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {form.password.length < 4 ? 'Trop court' :
                                     form.password.length < 6 ? 'Faible' :
                                     form.password.length < 8 ? 'Moyen' : 'Fort'}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enregistrement...' : 'Confirmer mon mot de passe →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}