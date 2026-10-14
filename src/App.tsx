import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from './components/AppLayout'
import { NotFoundPage } from './pages/FoundationPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatusMessage } from './components/StatusMessage'
import { AuthProvider } from './features/auth/AuthProvider'
import { RequireAuth } from './features/auth/RequireAuth'
import './App.css'

const EditProfilePage = lazy(() => import('./pages/EditProfilePage').then(module => ({ default: module.EditProfilePage })))
const CreateEventPage = lazy(() => import('./pages/CreateEventPage').then(module => ({ default: module.CreateEventPage })))
const EditEventPage = lazy(() => import('./pages/EditEventPage').then(module => ({ default: module.EditEventPage })))
const EventGalleryPage = lazy(() => import('./pages/EventGalleryPage').then(module => ({ default: module.EventGalleryPage })))
const EventAttendeesPage = lazy(() => import('./pages/EventAttendeesPage').then(module => ({ default: module.EventAttendeesPage })))
const SocialIdentityPage = lazy(() => import('./pages/SocialIdentityPage').then(module => ({ default: module.SocialIdentityPage })))
const SocialFollowsPage = lazy(() => import('./pages/SocialFollowsPage').then(module => ({ default: module.SocialFollowsPage })))
const EventAccessPage = lazy(() => import('./pages/EventAccessPage').then(module => ({ default: module.EventAccessPage })))
const EventRejoinRequestsPage = lazy(() => import('./pages/EventRejoinRequestsPage').then(module => ({ default: module.EventRejoinRequestsPage })))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(module => ({ default: module.EventDetailPage })))
const MapPage = lazy(() => import('./pages/MapPage').then(module => ({ default: module.MapPage })))
const MyEventsPage = lazy(() => import('./pages/MyEventsPage').then(module => ({ default: module.MyEventsPage })))
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))
const EventChatPage = lazy(() => import('./pages/EventChatPage').then(module => ({ default: module.EventChatPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })))
const InvitePage = lazy(() => import('./pages/InvitePage').then(module => ({ default: module.InvitePage })))
const InterestsPage = lazy(() => import('./pages/InterestsPage').then(module => ({ default: module.InterestsPage })))

const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<AppLayout />}>
    <Route index element={<Navigate to="/map" replace />} />
    <Route path="register" element={<AuthPage key="register" mode="register" />} />
    <Route path="login" element={<AuthPage key="login" mode="login" />} />
    <Route path="invite" element={<Suspense fallback={<StatusMessage title="Cargando invitación">Esperá un momento.</StatusMessage>}><InvitePage /></Suspense>} />
    <Route element={<RequireAuth />}>
      <Route path="notifications" element={<Suspense fallback={<StatusMessage title="Cargando notificaciones">Esperá un momento.</StatusMessage>}><NotificationsPage /></Suspense>} />
      <Route path="events/:id/chat" element={<Suspense fallback={<StatusMessage title="Cargando chat">Esperá un momento.</StatusMessage>}><EventChatPage /></Suspense>} />
      <Route path="home" element={<Suspense fallback={<StatusMessage title="Cargando Inicio">Esperá un momento.</StatusMessage>}><HomePage /></Suspense>} />
      <Route path="map" element={<Suspense fallback={<StatusMessage title="Cargando mapa">Esperá un momento.</StatusMessage>}><MapPage /></Suspense>} />
      <Route path="events/new" element={<Suspense fallback={<StatusMessage title="Cargando formulario">Esperá un momento.</StatusMessage>}><CreateEventPage /></Suspense>} />
      <Route path="events/:id/edit" element={<Suspense fallback={<StatusMessage title="Cargando formulario">Esperá un momento.</StatusMessage>}><EditEventPage /></Suspense>} />
      <Route path="events/:id/gallery" element={<Suspense fallback={<StatusMessage title="Cargando galería">Esperá un momento.</StatusMessage>}><EventGalleryPage /></Suspense>} />
      <Route path="events/:id/attendees" element={<Suspense fallback={<StatusMessage title="Cargando asistentes">Esperá un momento.</StatusMessage>}><EventAttendeesPage /></Suspense>} />
      <Route path="events/:id/access" element={<Suspense fallback={<StatusMessage title="Cargando accesos">Esperá un momento.</StatusMessage>}><EventAccessPage /></Suspense>} />
      <Route path="events/:id/rejoin-requests" element={<Suspense fallback={<StatusMessage title="Cargando solicitudes">Esperá un momento.</StatusMessage>}><EventRejoinRequestsPage /></Suspense>} />
      <Route path="events/:id" element={<Suspense fallback={<StatusMessage title="Cargando evento">Esperá un momento.</StatusMessage>}><EventDetailPage /></Suspense>} />
      <Route path="my-events" element={<Suspense fallback={<StatusMessage title="Cargando Mis eventos">Esperá un momento.</StatusMessage>}><MyEventsPage /></Suspense>} />
      <Route path="me" element={<ProfilePage />} />
      <Route path="me/edit" element={<Suspense fallback={<StatusMessage title="Cargando edición de perfil">Esperá un momento.</StatusMessage>}><EditProfilePage /></Suspense>} />
      <Route path="users/:id" element={<Suspense fallback={<StatusMessage title="Consultando perfil">Esperá un momento.</StatusMessage>}><SocialIdentityPage /></Suspense>} />
      <Route path="users/:id/followers" element={<Suspense fallback={<StatusMessage title="Consultando seguidores">Esperá un momento.</StatusMessage>}><SocialFollowsPage direction="followers" /></Suspense>} />
      <Route path="users/:id/following" element={<Suspense fallback={<StatusMessage title="Consultando seguimientos">Esperá un momento.</StatusMessage>}><SocialFollowsPage direction="following" /></Suspense>} />
      <Route path="me/interests" element={<Suspense fallback={<StatusMessage title="Cargando intereses">Esperá un momento.</StatusMessage>}><InterestsPage /></Suspense>} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route>
))
function App() {
  return <AuthProvider><RouterProvider router={router} /></AuthProvider>
}

export default App
