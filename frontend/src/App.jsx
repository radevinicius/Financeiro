import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import ExpenseScreen from './screens/ExpenseScreen';
import IncomeScreen from './screens/IncomeScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import ProfileScreen from './screens/ProfileScreen';
import GoalsScreen from './screens/GoalsScreen';
import SearchScreen from './screens/SearchScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import FixedExpensesScreen from './screens/FixedExpensesScreen';

// Protected Route component
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div className="ios-spinner"></div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Route component (redirect to dashboard if already authenticated)
function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div className="ios-spinner"></div>
            </div>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

// Layout with bottom navigation
function AppLayout({ children }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginScreen />
                            </PublicRoute>
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <RegisterScreen />
                            </PublicRoute>
                        }
                    />

                    {/* Protected routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <DashboardScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/despesas"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <ExpenseScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/receitas"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <IncomeScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/categorias"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <CategoriesScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/despesas-fixas"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <FixedExpensesScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/busca"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <SearchScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <AdminDashboardScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/perfil"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <ProfileScreen />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
