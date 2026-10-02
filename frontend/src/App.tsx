import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import AcceptInvite from './pages/AcceptInvite'
import AdminDashboard from './pages/AdminDashboard'
import AdminWindows from './pages/AdminWindows'
import AdminReviewers from './pages/AdminReviewers'
import AdminApplicants from './pages/AdminApplicants'
import AdminDocs from './pages/AdminDocs'
import AdminWindowApplications from './pages/AdminWindowApplications'
import ApplicantDashboard from './pages/ApplicantDashboard'
import ApplicationForm from './pages/ApplicationForm'
import ReviewerDashboard from './pages/ReviewerDashboard'
import Bootstrap from './pages/Bootstrap'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/setup" element={<Bootstrap />} />

          <Route element={<PrivateRoute roles={['admin', 'reviewer']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/windows" element={<AdminWindows />} />
            <Route path="/admin/windows/:window_id" element={<AdminWindowApplications />} />
            <Route path="/admin/applicants" element={<AdminApplicants />} />
            <Route path="/admin/reviewers" element={<AdminReviewers />} />
            <Route path="/admin/docs" element={<AdminDocs />} />
          </Route>

          <Route element={<PrivateRoute roles={['applicant']} />}>
            <Route path="/apply" element={<ApplicantDashboard />} />
            <Route path="/apply/:app_id" element={<ApplicationForm />} />
          </Route>

          <Route element={<PrivateRoute roles={['reviewer', 'admin']} />}>
            <Route path="/review" element={<ReviewerDashboard />} />
            <Route path="/admin/applications/:app_id" element={<ApplicationForm />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
