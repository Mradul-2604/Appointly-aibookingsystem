import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import SSOCallback from './components/SSOCallback';
import AuthRedirect from './components/AuthRedirect';
import History from './components/History';
import Landing from './components/Landing';
import AdminLayout from './components/admin/AdminLayout';
import DashboardPage from './components/admin/DashboardPage';
import SchedulePage from './components/admin/SchedulePage';
import AnalyticsPage from './components/admin/AnalyticsPage';
import ClientsPage from './components/admin/ClientsPage';

function ProtectedRoute({ children }) {
    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />

                <Route path="/login" element={<SignedOut><Login /></SignedOut>} />
                <Route path="/sso-callback" element={<SSOCallback />} />
                <Route path="/auth-redirect" element={<AuthRedirect />} />
                <Route path="/signup" element={<SignedOut><Signup /></SignedOut>} />

                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

                {/* Admin section with shared layout */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<DashboardPage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="clients" element={<ClientsPage />} />
                </Route>

                {/* Legacy calendar route redirect */}
                <Route path="/calendar" element={<Navigate to="/admin/schedule" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
