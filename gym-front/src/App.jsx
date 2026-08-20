import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import MembreRoute from './components/MembreRoute'
import CoachRoute from './components/CoachRoute'
import AdminLayout from './layouts/AdminLayout'
import MembreLayout from './layouts/MembreLayout'
import CoachLayout from './layouts/CoachLayout'
import Login from './pages/Login'

// Chargées à la demande : chaque espace (admin/coach/membre) ne charge que
// son propre code, au lieu d'un seul bundle de ~900 Ko contenant les trois.
// Login reste en import direct — c'est la première page vue par tout le monde.
const SetupPassword     = lazy(() => import('./pages/SetupPassword'))
const SetupResend       = lazy(() => import('./pages/SetupResend'))
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'))

const AdminDashboard      = lazy(() => import('./pages/admin/Dashboard'))
const Membres             = lazy(() => import('./pages/admin/Membres'))
const MembreDetail        = lazy(() => import('./pages/admin/MembreDetail'))
const Coachs               = lazy(() => import('./pages/admin/Coachs'))
const CoachDetail          = lazy(() => import('./pages/admin/CoachDetail'))
const Tarifs               = lazy(() => import('./pages/admin/Tarifs'))
const AdminPlanning        = lazy(() => import('./pages/admin/Planning'))
const SeancesPonctuelles   = lazy(() => import('./pages/admin/SeancesPonctuelles'))
const Paiements            = lazy(() => import('./pages/admin/Paiements'))
const AdminMateriel        = lazy(() => import('./pages/admin/Materiel'))

const MembreDashboard = lazy(() => import('./pages/membre/Dashboard'))
const MembreProfil    = lazy(() => import('./pages/membre/Profil'))
const MembrePaiements = lazy(() => import('./pages/membre/Paiements'))
const MembrePlanning  = lazy(() => import('./pages/membre/Planning'))

const CoachDashboard = lazy(() => import('./pages/coach/Dashboard'))
const CoachMembres   = lazy(() => import('./pages/coach/Membres'))
const CoachPlanning  = lazy(() => import('./pages/coach/Planning'))
const CoachProfil    = lazy(() => import('./pages/coach/Profil'))
const CoachMateriel  = lazy(() => import('./pages/coach/Materiel'))

// Fallback minimal pendant le chargement d'un chunk — le contenu réel de
// chaque page affiche déjà son propre squelette une fois son code chargé,
// ce écran n'apparaît donc que très brièvement (le temps de télécharger le
// chunk JS, pas les données).
function PageFallback() {
    return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#e05c3a] border-t-transparent rounded-full animate-spin" />
        </div>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        {/* Routes publiques */}
                        <Route path="/login"          element={<Login />} />
                        <Route path="/setup-password" element={<SetupPassword />} />
                        <Route path="/setup/resend"   element={<SetupResend />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password"  element={<SetupPassword />} />

                        {/* Routes admin */}
                        <Route path="/admin/*" element={
                            <PrivateRoute>
                                <AdminRoute>
                                    <AdminLayout>
                                        <Routes>
                                            <Route path="dashboard" element={<AdminDashboard />} />
                                            <Route path="membres"   element={<Membres />} />
                                            <Route path="membres/:id"    element={<MembreDetail />} />
                                            <Route path="coachs"      element={<Coachs />} />
                                            <Route path="coachs/:id"  element={<CoachDetail />} />
                                            <Route path="tarifs"    element={<Tarifs />} />
                                            <Route path="planning" element={<AdminPlanning />} />
                                            <Route path="seances-ponctuelles"  element={<SeancesPonctuelles />} />
                                            <Route path="paiements" element={<Paiements />} />
                                            <Route path="materiel" element={<AdminMateriel />} />
                                        </Routes>
                                    </AdminLayout>
                                </AdminRoute>
                            </PrivateRoute>
                        } />

                        {/* Routes membre */}
                        <Route path="/membre/*" element={
                            <PrivateRoute>
                                <MembreRoute>
                                    <MembreLayout>
                                        <Routes>
                                            <Route path="dashboard" element={<MembreDashboard />} />
                                            <Route path="profil"    element={<MembreProfil />} />
                                            <Route path="paiements"  element={<MembrePaiements />} />
                                            <Route path="planning"  element={<MembrePlanning />} />
                                        </Routes>
                                    </MembreLayout>
                                </MembreRoute>
                            </PrivateRoute>
                        } />

                        {/* Routes coach */}
                        <Route path="/coach/*" element={
                            <PrivateRoute>
                                <CoachRoute>
                                    <CoachLayout>
                                        <Routes>
                                            <Route path="dashboard" element={<CoachDashboard />} />
                                            <Route path="membres"   element={<CoachMembres />} />
                                            <Route path="planning"  element={<CoachPlanning />} />
                                            <Route path="profil" element={<CoachProfil />} />
                                            <Route path="materiel" element={<CoachMateriel />} />
                                        </Routes>
                                    </CoachLayout>
                                </CoachRoute>
                            </PrivateRoute>
                        } />

                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    )
}
