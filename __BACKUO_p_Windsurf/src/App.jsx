import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecurringPaymentsPage from './pages/RecurringPaymentsPage';
import IncomesPage from './pages/IncomesPage';
import CategoriesPage from './pages/CategoriesPage';
import DataManagementPage from './pages/DataManagementPage';

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="w-full h-screen flex justify-center items-center">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute user={user}>
              <Layout user={user}>
                <Routes>
                  <Route path="/" element={<DashboardPage user={user} />} />
                  <Route path="/pagos-recurrentes" element={<RecurringPaymentsPage user={user} />} />
                  <Route path="/ingresos" element={<IncomesPage user={user} />} />
                  <Route path="/categorias" element={<CategoriesPage user={user} />} />
                  <Route path="/gestion-de-datos" element={<DataManagementPage user={user} />} />
                  {/* Aquí irán el resto de rutas protegidas */}
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

