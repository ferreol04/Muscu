import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/useAuth'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [form, setForm]       = useState({ email: '', password: '' })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { saveUser }          = useAuth()
    const navigate              = useNavigate()

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await login(form)
            saveUser(res.data.user, res.data.token)
            navigate(
                res.data.role === 'admin' ? '/admin/dashboard' :
                res.data.role === 'coach' ? '/coach/dashboard' :
                '/membre/dashboard'
            )
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de connexion')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#e05c3a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Dumbbell size={28} color="white" />
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight">GymPro</h1>
                    <p className="text-gray-500 text-sm mt-1">Bienvenue, connectez-vous</p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1a2a] rounded-2xl p-8 border border-[#2d2f45]">

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
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="vous@exemple.com"
                                required
                                className="w-full bg-[#0f1117] border border-[#2d2f45] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#e05c3a] transition-colors"
                            />
                        </div>

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
                                    placeholder="••••••••"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#e05c3a] hover:bg-[#c94e2e] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Connexion...' : 'Se connecter →'}
                        </button>
                    </form>

                    <p className="text-center mt-5">
                        <Link to="/forgot-password" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                            Mot de passe oublié ?
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}