import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BedGrid from './pages/BedGrid'
import PatientManagement from './pages/PatientManagement'
import BillingManagement from './pages/BillingManagement'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import Profile from './pages/Profile'
import AdminPatient from './pages/AdmitPatient'
import BillingPage from './pages/BillingPage'
import BedManagement from './pages/BedManagement '
import ManageUsers from './pages/ManageUsers'
import PatientProfile from './pages/PatientProfile'
import Register from './pages/Register'


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/billings" element={<BillingPage />} />
                <Route path="/developer/users" element={<ManageUsers/>} />
                <Route path="/developer/register" element={<Register/>} />
                <Route path="/bed-management/:departmentId" element={<BedManagement />} />
                 <Route path="/patients/:id" element={<PatientProfile />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/beds/:departmentId"
                  element={<BedGrid />}
                />
                <Route
                  path="/patients"
                  element={
                    <ProtectedRoute>
                      <PatientManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <BillingManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile/>
                    </ProtectedRoute>
                  }
                />
                <Route
  path="/patients/admit"
  element={
    <ProtectedRoute>
      <AdminPatient/>
    </ProtectedRoute>
  }
/>

              </Routes>
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App

