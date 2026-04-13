import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar, AdminMobileNav } from '@/components/layout/sidebar'

import LoginPage from '@/pages/login'
import GuardDashboard from '@/pages/guard/dashboard'
import GuardAttendance from '@/pages/guard/attendance'
import AdminDashboard from '@/pages/admin/dashboard'
import AdminGuards from '@/pages/admin/guards'
import AdminAttendancePage from '@/pages/admin/attendance'
import AdminMap from '@/pages/admin/map'
import AdminInsights from '@/pages/admin/insights'

function AuthGuard({ requiredRole }: { requiredRole?: 'guard' | 'admin' }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Profile failed to load — use JWT metadata as fallback for routing
  // This prevents infinite spinner if profiles table is unreachable
  const role = profile?.role || (user as any).user_metadata?.role || 'guard'

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/guard/dashboard'} replace />
  }

  return <Outlet />
}

function GuardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <AdminMobileNav />
      <main className="md:pl-64">
        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Guard routes */}
        <Route element={<AuthGuard requiredRole="guard" />}>
          <Route element={<GuardLayout />}>
            <Route path="/guard/dashboard" element={<GuardDashboard />} />
            <Route path="/guard/attendance" element={<GuardAttendance />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<AuthGuard requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/guards" element={<AdminGuards />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/map" element={<AdminMap />} />
            <Route path="/admin/insights" element={<AdminInsights />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
