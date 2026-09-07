import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PageLayout, PrivateRoute } from './components/layout';

// Lazy loaded components for code splitting
const LandingPage = React.lazy(() => import('./pages/Landing/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = React.lazy(() => import('./pages/Auth/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Auth/Register').then(m => ({ default: m.Register })));
const TestsDashboard = React.lazy(() => import('./pages/Test/TestsDashboard').then(m => ({ default: m.TestsDashboard })));
const CandidateList = React.lazy(() => import('./pages/Candidate/CandidateList').then(m => ({ default: m.CandidateList })));
const CandidateDetailReport = React.lazy(() => import('./pages/Candidate/CandidateDetailReport').then(m => ({ default: m.CandidateDetailReport })));
const CandidatePortal = React.lazy(() => import('./pages/Candidate/CandidatePortal').then(m => ({ default: m.CandidatePortal })));
const CandidateWelcome = React.lazy(() => import('./pages/CandidatePortal/CandidateWelcome').then(m => ({ default: m.CandidateWelcome })));
const CandidateTestRunner = React.lazy(() => import('./pages/CandidatePortal/CandidateTestRunner').then(m => ({ default: m.CandidateTestRunner })));
const CandidateSubmitted = React.lazy(() => import('./pages/CandidatePortal/CandidateSubmitted').then(m => ({ default: m.CandidateSubmitted })));
const QuestionLibrary = React.lazy(() => import('./pages/Question/QuestionLibrary').then(m => ({ default: m.QuestionLibrary })));
const MultipleChoiceEditor = React.lazy(() => import('./pages/Question/editors/MultipleChoiceEditor').then(m => ({ default: m.MultipleChoiceEditor })));
const FreeTextEditor = React.lazy(() => import('./pages/Question/editors/FreeTextEditor').then(m => ({ default: m.FreeTextEditor })));
const CodingEditor = React.lazy(() => import('./pages/Question/editors/CodingEditor').then(m => ({ default: m.CodingEditor })));
const TestDetail = React.lazy(() => import('./pages/Test/TestDetail').then(m => ({ default: m.TestDetail })));
const TestSettings = React.lazy(() => import('./pages/Test/TestSettings').then(m => ({ default: m.TestSettings })));
const TestCreate = React.lazy(() => import('./pages/Test/TestCreate').then(m => ({ default: m.TestCreate })));
const Settings = React.lazy(() => import('./pages/Settings/Settings').then(m => ({ default: m.Settings })));

import { GlobalLoader } from './components/ui/GlobalLoader';

// A simple fallback spinner for lazy loaded routes
const RouteFallback = () => (
  <GlobalLoader fullScreen text="Loading..." />
);

// Wrapper to force light mode for the candidate portal
const ForceLightMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    const prevTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      if (prevTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
      }
    };
  }, []);
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Marketing */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Candidate Portal */}
          <Route path="/assessment/:id/portal" element={<ForceLightMode><CandidatePortal /></ForceLightMode>} />
          <Route path="/take/:token" element={<ForceLightMode><CandidateWelcome /></ForceLightMode>} />
          <Route path="/take/:token/runner" element={<ForceLightMode><CandidateTestRunner /></ForceLightMode>} />
          <Route path="/take/:token/submitted" element={<ForceLightMode><CandidateSubmitted /></ForceLightMode>} />

          {/* Recruiter / Internal Pages (Protected) — mounted at /dashboard */}
          <Route path="/dashboard" element={<PrivateRoute><PageLayout /></PrivateRoute>}>
            <Route index element={<TestsDashboard />} />
            <Route path="candidates" element={<CandidateList />} />
            <Route path="candidates/:id" element={<CandidateDetailReport />} />
            <Route path="questions" element={<QuestionLibrary />} />
            <Route path="questions/create/multiple-choice" element={<MultipleChoiceEditor />} />
            <Route path="questions/create/free-text" element={<FreeTextEditor />} />
            <Route path="questions/create/coding" element={<CodingEditor />} />
            <Route path="questions/edit/multiple-choice/:id" element={<MultipleChoiceEditor />} />
            <Route path="questions/edit/free-text/:id" element={<FreeTextEditor />} />
            <Route path="questions/edit/coding/:id" element={<CodingEditor />} />
            <Route path="tests/detail/:id" element={<TestDetail />} />
            <Route path="tests/create" element={<TestCreate />} />
            <Route path="tests/settings/:id" element={<TestSettings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
