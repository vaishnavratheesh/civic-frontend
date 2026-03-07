
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import CompleteProfile from './pages/CompleteProfile';
import CompleteCouncillorProfile from './pages/councillor/CompleteCouncillorProfile';
import EditCouncillorProfile from './pages/councillor/EditCouncillorProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWelfareSchemes from './pages/admin/AdminWelfareSchemes';
import AdminWelfareApplications from './pages/admin/AdminWelfareApplications';
import UserManagement from './pages/admin/UserManagement';
import GrievanceManagement from './pages/admin/GrievanceManagement';
import AdminWorkerApproval from './pages/admin/AdminWorkerApproval';

import CouncillorDashboard from './pages/councillor/CouncillorDashboard';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import PresidentDashboard from './pages/president/PresidentDashboard';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import WorkerLoginRegister from './pages/worker/WorkerLoginRegister';
import WorkerVerifyOTP from './pages/worker/WorkerVerifyOTP';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerTasks from './pages/worker/WorkerTasks';
import WorkerProfile from './pages/worker/WorkerProfile';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EditProfile from './pages/citizen/EditProfile';


const AppRoutes: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div></div>; // Or a full-page loader
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
            { /* Councillor login route removed: unified login handles councillors */}
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/councillor/complete-profile" element={<ProtectedRoute allowedRoles={[Role.COUNCILLOR]}><CompleteCouncillorProfile /></ProtectedRoute>} />
            <Route path="/councillor/edit-profile" element={<ProtectedRoute allowedRoles={[Role.COUNCILLOR]}><EditCouncillorProfile /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/admin" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/welfare-schemes" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminWelfareSchemes /></ProtectedRoute>} />
            <Route path="/admin/welfare-applications" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminWelfareApplications /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/grievances" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><GrievanceManagement /></ProtectedRoute>} />
            <Route path="/admin/workers" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminWorkerApproval /></ProtectedRoute>} />

            <Route path="/councillor" element={<ProtectedRoute allowedRoles={[Role.COUNCILLOR]}><CouncillorDashboard /></ProtectedRoute>} />
            <Route path="/councillor/dashboard" element={<ProtectedRoute allowedRoles={[Role.COUNCILLOR]}><CouncillorDashboard /></ProtectedRoute>} />
            <Route path="/officer" element={<ProtectedRoute allowedRoles={[Role.OFFICER]}><OfficerDashboard /></ProtectedRoute>} />
            <Route path="/president" element={<ProtectedRoute allowedRoles={[Role.PRESIDENT]}><PresidentDashboard /></ProtectedRoute>} />
            <Route path="/citizen" element={<ProtectedRoute allowedRoles={[Role.CITIZEN]}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/citizen/edit-profile" element={<ProtectedRoute allowedRoles={[Role.CITIZEN]}><EditProfile /></ProtectedRoute>} />

            // Worker routes
            <Route path="/worker/login" element={<WorkerLoginRegister />} />
            <Route path="/worker/verify-otp" element={<WorkerVerifyOTP />} />

            <Route path="/worker" element={<WorkerLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="tasks" element={<WorkerTasks />} />
                <Route path="profile" element={<WorkerProfile />} />
            </Route>



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