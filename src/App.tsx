import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from './components/AppLayout'
import { FoundationPage, NotFoundPage } from './pages/FoundationPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatusMessage } from './components/StatusMessage'
import { AuthProvider } from './features/auth/AuthProvider'
import { RequireAuth } from './features/auth/RequireAuth'
import './App.css'

const CreateEventPage = lazy(() => import('./pages/CreateEventPage').then(module => ({ default: module.CreateEventPage })))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(module => ({ default: module.EventDetailPage })))

function App() {
  return (
    <AuthProvider><BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="map" element={<FoundationPage page="map" />} />
          <Route path="register" element={<AuthPage key="register" mode="register" />} />
          <Route path="login" element={<AuthPage key="login" mode="login" />} />
          <Route element={<RequireAuth />}>
            <Route path="events/new" element={<Suspense fallback={<StatusMessage title="Cargando formulario">Esperá un momento.</StatusMessage>}><CreateEventPage /></Suspense>} />
            <Route path="events/:id" element={<Suspense fallback={<StatusMessage title="Cargando evento">Esperá un momento.</StatusMessage>}><EventDetailPage /></Suspense>} />
            <Route path="my-events" element={<FoundationPage page="myEvents" />} />
            <Route path="me" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter></AuthProvider>
  )
}

export default App
