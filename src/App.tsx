import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { BrowsePage } from './pages/public/BrowsePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { AboutPage } from './pages/public/AboutPage';
import { ImpactPage } from './pages/public/ImpactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Donor Pages
import { DonorDashboard } from './pages/donor/DonorDashboard';
import { CreateListingPage } from './pages/donor/CreateListingPage';
import { MyListingsPage } from './pages/donor/MyListingsPage';
import { IncomingRequestsPage } from './pages/donor/IncomingRequestsPage';
import { PickupManagementPage } from './pages/donor/PickupManagementPage';
import { DonationHistoryPage } from './pages/donor/DonationHistoryPage';
import { DonorProfilePage } from './pages/donor/DonorProfilePage';

// Recipient Pages
import { RecipientDashboard } from './pages/recipient/RecipientDashboard';
import { MyRequestsPage } from './pages/recipient/MyRequestsPage';
import { PickupTrackingPage } from './pages/recipient/PickupTrackingPage';
import { CompletedDonationsPage } from './pages/recipient/CompletedDonationsPage';
import { RecipientProfilePage } from './pages/recipient/RecipientProfilePage';

// Volunteer Pages
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { AvailableDeliveriesPage } from './pages/volunteer/AvailableDeliveriesPage';
import { ActiveDeliveryPage } from './pages/volunteer/ActiveDeliveryPage';
import { DeliveryHistoryPage } from './pages/volunteer/DeliveryHistoryPage';
import { VolunteerProfilePage } from './pages/volunteer/VolunteerProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VerificationsPage } from './pages/admin/VerificationsPage';
import { ListingModerationPage } from './pages/admin/ListingModerationPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { ReportManagementPage } from './pages/admin/ReportManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('DONOR' | 'RECIPIENT' | 'VOLUNTEER' | 'ADMIN')[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-stone-500 font-medium">
        Verifying session authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Donor Routes */}
              <Route
                path="/donor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/create"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <CreateListingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/listings"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <MyListingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/requests"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <IncomingRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/pickups"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <PickupManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/history"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <DonationHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/profile"
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <DonorProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Recipient Routes */}
              <Route
                path="/recipient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
                    <RecipientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipient/requests"
                element={
                  <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
                    <MyRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipient/pickups"
                element={
                  <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
                    <PickupTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipient/completed"
                element={
                  <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
                    <CompletedDonationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipient/profile"
                element={
                  <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
                    <RecipientProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Volunteer Routes */}
              <Route
                path="/volunteer"
                element={<Navigate to="/volunteer/dashboard" replace />}
              />
              <Route
                path="/volunteer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/available"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                    <AvailableDeliveriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/active"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                    <ActiveDeliveryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/active/:id"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                    <ActiveDeliveryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/history"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                    <DeliveryHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/profile"
                element={
                  <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
                    <VolunteerProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <VerificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/listings"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ListingModerationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ReportManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
