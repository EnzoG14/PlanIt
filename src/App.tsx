import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { FoundationPage, NotFoundPage } from './pages/FoundationPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="map" element={<FoundationPage page="map" />} />
          <Route path="register" element={<FoundationPage page="register" />} />
          <Route path="login" element={<FoundationPage page="login" />} />
          <Route path="events/new" element={<FoundationPage page="create" />} />
          <Route path="my-events" element={<FoundationPage page="myEvents" />} />
          <Route path="events/:id" element={<FoundationPage page="detail" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
