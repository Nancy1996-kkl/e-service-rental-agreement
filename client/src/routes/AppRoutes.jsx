import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/client/Dashboard.jsx';
import NewAgreement from '../pages/agreement/NewAgreement.jsx';
import AgreementWizard from '../pages/agreement/AgreementWizard.jsx';
import TemplateStep from '../pages/agreement/TemplateStep.jsx';
import DetailsStep from '../pages/agreement/DetailsStep.jsx';
import UploadStep from '../pages/agreement/UploadStep.jsx';
import RulesStep from '../pages/agreement/RulesStep.jsx';
import PreviewStep from '../pages/agreement/PreviewStep.jsx';
import DownloadStep from '../pages/agreement/DownloadStep.jsx';
import NotFound from '../pages/NotFound.jsx';
import UiKit from '../pages/UiKit.jsx';

// Admin pages — admin login pannaa mattum load aagum (clients-ku download aagaadhu)
const AdminLayout = lazy(() => import('../components/admin/AdminLayout.jsx'));
const AdminOverview = lazy(() => import('../pages/admin/AdminOverview.jsx'));
const AdminClients = lazy(() => import('../pages/admin/AdminClients.jsx'));
const AdminClientDetail = lazy(() => import('../pages/admin/AdminClientDetail.jsx'));
const AdminAgreements = lazy(() => import('../pages/admin/AdminAgreements.jsx'));
const AdminAgreementDetail = lazy(() => import('../pages/admin/AdminAgreementDetail.jsx'));
const AdminTemplates = lazy(() => import('../pages/admin/AdminTemplates.jsx'));
const AdminClauses = lazy(() => import('../pages/admin/AdminClauses.jsx'));
const AdminActivity = lazy(() => import('../pages/admin/AdminActivity.jsx'));
const lazyPage = (el) => <Suspense fallback={<Loader />}>{el}</Suspense>;

// Editor periya library (TipTap) — Customize page open aagumbodhu mattum load aagum
const EditorStep = lazy(() => import('../pages/agreement/EditorStep.jsx'));

// Ellaa page URLs-um oru idathula. Pudhu page add pannumbodhu inga oru <Route> podunga.
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public — yaar venumnaalum */}
        <Route path="/" element={<Home />} />
        <Route path="/ui-kit" element={<UiKit />} />

        {/* Login pannaadhavanga mattum */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Login pannavanga mattum */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agreements/new" element={<NewAgreement />} />

          {/* Agreement wizard: /agreements/:id/details, /agreements/:id/upload ... */}
          <Route path="/agreements/:id" element={<AgreementWizard />}>
            <Route index element={<Navigate to="details" replace />} />
            <Route path="template" element={<TemplateStep />} />
            <Route path="details" element={<DetailsStep />} />
            <Route path="upload" element={<UploadStep />} />
            <Route path="rules" element={<RulesStep />} />
            <Route path="editor" element={<Suspense fallback={<Loader text="Loading editor..." />}><EditorStep /></Suspense>} />
            <Route path="preview" element={<PreviewStep />} />
            <Route path="download" element={<DownloadStep />} />
          </Route>
        </Route>

        {/* 👑 Admin mattum */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={lazyPage(<AdminLayout />)}>
            <Route index element={lazyPage(<AdminOverview />)} />
            <Route path="clients" element={lazyPage(<AdminClients />)} />
            <Route path="clients/:id" element={lazyPage(<AdminClientDetail />)} />
            <Route path="agreements" element={lazyPage(<AdminAgreements />)} />
            <Route path="agreements/:id" element={lazyPage(<AdminAgreementDetail />)} />
            <Route path="templates" element={lazyPage(<AdminTemplates />)} />
            <Route path="clauses" element={lazyPage(<AdminClauses />)} />
            <Route path="activity" element={lazyPage(<AdminActivity />)} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
