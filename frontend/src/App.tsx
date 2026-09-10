import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Layout components
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';

// Route guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Auth utilities
import { getCurrentAuthState, getDashboardForRole } from './components/auth/authRouteUtils';

// PUBLIC pages (login)
import LoginSelection from './pages/LoginSelection';
import GovernmentLogin from './pages/GovernmentLogin';
import AgencyLogin from './pages/AgencyLogin';
import PersonalLogin from './pages/PersonalLogin';
import LoginGateway from './pages/LoginGateway'; // preserved legacy

// AUTHENTICATED pages
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import GISExplorer from './pages/GISExplorer';
import CadastralTracker from './pages/CadastralTracker';
import About from './pages/About';

// AGENCY & PERSONAL DASHBOARDS
import { AgencyDashboard } from './pages/AgencyDashboard';
import { PersonalDashboard } from './pages/PersonalDashboard';

// GOVERNMENT VERIFICATION PORTAL PAGES (3 DISTINCT STAGES)
import { GovernmentDashboard } from './pages/GovernmentDashboard';
import { DistrictVerificationPage } from './pages/government/DistrictVerificationPage';
import { StateVerificationPage } from './pages/government/StateVerificationPage';
import { CentralVerificationPage } from './pages/government/CentralVerificationPage';
import { getCaseById } from './mock/governmentMockData';

// LANDOWNER DOCUMENT UPLOAD
import { DocumentUploadPage } from './pages/DocumentUploadPage';

// GOVERNMENT COMPENSATION & PFMS DISBURSEMENT
import GovernmentCompensationPage from './pages/GovernmentCompensationPage';

/** Redirects / to the user's dashboard if authenticated, else to /login */
const RootRedirect: React.FC = () => {
  const { token, user } = getCurrentAuthState();
  if (token && user) {
    return <Navigate to={getDashboardForRole(user)} replace />;
  }

  return <Navigate to="/login" replace />;
};

/** Intelligent case forwarder to active stage page */
const CaseStageRedirector: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  if (!caseId) return <Navigate to="/government/dashboard" replace />;
  const found = getCaseById(caseId);
  if (found?.currentStage === 'STATE_GOVERNMENT') {
    return <Navigate to={`/government/verification/state/${caseId}`} replace />;
  }
  if (found?.currentStage === 'CENTRAL_MINISTRY') {
    return <Navigate to={`/government/verification/central/${caseId}`} replace />;
  }
  return <Navigate to={`/government/verification/district/${caseId}`} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ══════════════════════════════════════════════
            PUBLIC ROUTES — NO Header / TopNav / Footer
            Authenticated users are bounced to their dashboard.
            ══════════════════════════════════════════════ */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginSelection />} />
          <Route path="/login/government" element={<GovernmentLogin />} />
          <Route path="/login/agency" element={<AgencyLogin />} />
          <Route path="/login/personal" element={<PersonalLogin />} />
          {/* Legacy gateway — kept for backward compat, also public */}
          <Route path="/login/gateway" element={<LoginGateway />} />
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: DISTRICT GOVERNMENT only
            Strictly: /government/district/* and /government/verification/district/*
            ══════════════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['GOVERNMENT']}
              allowedAuthorities={['DISTRICT']}
              redirectTo="/login/government"
            />
          }
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/government/district/dashboard" element={<GovernmentDashboard tier="DISTRICT" />} />
            <Route path="/government/verification/district/:caseId" element={<DistrictVerificationPage />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: STATE GOVERNMENT only
            Strictly: /government/state/* and /government/verification/state/*
            ══════════════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['GOVERNMENT']}
              allowedAuthorities={['STATE']}
              redirectTo="/login/government"
            />
          }
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/government/state/dashboard" element={<GovernmentDashboard tier="STATE" />} />
            <Route path="/government/verification/state/:caseId" element={<StateVerificationPage />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: CENTRAL MINISTRY only
            Strictly: /government/central/* and /government/verification/central/*
            ══════════════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['GOVERNMENT']}
              allowedAuthorities={['CENTRAL']}
              redirectTo="/login/government"
            />
          }
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/government/central/dashboard" element={<GovernmentDashboard tier="CENTRAL" />} />
            <Route path="/government/verification/central/:caseId" element={<CentralVerificationPage />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: ANY GOVERNMENT OFFICER (Shared Tools)
            ══════════════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['GOVERNMENT']}
              redirectTo="/login/government"
            />
          }
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/government/dashboard" element={<RootRedirect />} />
            <Route path="/government/verification" element={<RootRedirect />} />
            <Route path="/government/compensation" element={<GovernmentCompensationPage />} />
            <Route path="/government/gis" element={<GISExplorer />} />
            {/* Intelligent Case Stage Redirector */}
            <Route path="/government/verification/case/:caseId" element={<CaseStageRedirector />} />
            <Route path="/government/verification/case/:caseId/document/:documentId" element={<CaseStageRedirector />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: AGENCY only
            Unauthenticated → /login/agency
            ══════════════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['AGENCY']}
              redirectTo="/login/agency"
            />
          }
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: PERSONAL (Landowner) only
            Unauthenticated → /login/personal
            ══════════════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['PERSONAL']}
              redirectTo="/login/personal"
            />
          }
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/personal/dashboard" element={<PersonalDashboard />} />
            <Route path="/personal/documents/upload" element={<DocumentUploadPage />} />
          </Route>
        </Route>

        {/* ══════════════════════════════════════════════
            PROTECTED: Any authenticated role (GIS Explorer, About)
            ══════════════════════════════════════════════ */}
        <Route
          element={<ProtectedRoute redirectTo="/login" />}
        >
          <Route element={<AuthenticatedLayout />}>
            <Route path="/gis" element={<GISExplorer />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<ExecutiveDashboard />} />
            <Route path="/tracker" element={<CadastralTracker />} />
          </Route>
        </Route>


        {/* ══════════════════════════════════════════════
            ROOT & FALLBACK
            ══════════════════════════════════════════════ */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
