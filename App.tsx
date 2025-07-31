
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import CouncillorDashboard from './pages/councillor/CouncillorDashboard';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';
import Landing from './pages/Landing';

const AppRoutes: React.FC = () => {
    const { user, isLoading } = useAuth();

    if(isLoading) {
        return <div></div>; // Or a full-page loader
    }
    
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/admin" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/councillor" element={<ProtectedRoute allowedRoles={[Role.COUNCILLOR]}><CouncillorDashboard /></ProtectedRoute>} />
            <Route path="/officer" element={<ProtectedRoute allowedRoles={[Role.OFFICER]}><OfficerDashboard /></ProtectedRoute>} />
            <Route path="/citizen" element={<ProtectedRoute allowedRoles={[Role.CITIZEN]}><CitizenDashboard /></ProtectedRoute>} />
            
            <Route path="/" element={
                user ? <Navigate to={`/${user.role}`} replace /> : <Landing />
            } />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AuthProvider>
  );
};

export default App;