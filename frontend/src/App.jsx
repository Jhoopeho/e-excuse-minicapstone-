import { Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthLoadingScreen from './components/AuthLoadingScreen'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Categories from './pages/Categories'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import RequestForm from './pages/RequestForm'
import Requests from './pages/Requests'
import Subjects from './pages/Subjects'

export default function App() {
  const { authTransition } = useAuth()
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Logged in */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="*" element={<NotFound />} />

            {/* Student-only */}
            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/requests/new" element={<RequestForm />} />
              <Route path="/requests/:id/edit" element={<RequestForm />} />
            </Route>

            {/* Teacher-only */}
            <Route element={<ProtectedRoute role="teacher" />}>
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/categories" element={<Categories />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      {authTransition && <AuthLoadingScreen title={authTransition.title} message={authTransition.message} />}
    </>
  )
}
