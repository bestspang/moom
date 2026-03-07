import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout";
import "@/i18n";

// Pages
import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby";
import Members from "./pages/Members";
import MemberDetails from "./pages/MemberDetails";
import Leads from "./pages/Leads";
import Packages from "./pages/Packages";
import CreatePackage from "./pages/CreatePackage";
import PackageDetails from "./pages/PackageDetails";
import Promotions from "./pages/Promotions";
import PromotionDetails from "./pages/PromotionDetails";
import CreatePromotion from "./pages/CreatePromotion";
import Schedule from "./pages/Schedule";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Classes from "./pages/Classes";
import CreateClass from "./pages/CreateClass";
import ClassDetails from "./pages/ClassDetails";
import ClassCategories from "./pages/ClassCategories";
import ClassCategoryDetails from "./pages/ClassCategoryDetails";
import Staff from "./pages/Staff";
import StaffDetails from "./pages/StaffDetails";
import Roles from "./pages/Roles";
import RoleEditor from "./pages/RoleEditor";
import Locations from "./pages/Locations";
import ActivityLog from "./pages/ActivityLog";
import Announcements from "./pages/Announcements";
import WorkoutList from "./pages/WorkoutList";
import TransferSlips from "./pages/TransferSlips";
import Finance from "./pages/Finance";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import MembersAtRisk from "./pages/reports/MembersAtRisk";
import ActiveMembers from "./pages/reports/ActiveMembers";
import ClassCapacityByHour from "./pages/reports/ClassCapacityByHour";
import ClassCapacityOverTime from "./pages/reports/ClassCapacityOverTime";
import PackageSales from "./pages/reports/PackageSales";
import PackageSalesOverTime from "./pages/reports/PackageSalesOverTime";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import SettingsGeneral from "./pages/settings/SettingsGeneral";
import SettingsClass from "./pages/settings/SettingsClass";
import SettingsClient from "./pages/settings/SettingsClient";
import SettingsPackage from "./pages/settings/SettingsPackage";
import SettingsContracts from "./pages/settings/SettingsContracts";
import SettingsFeatureFlags from "./pages/settings/SettingsFeatureFlags";
import SettingsImportExport from "./pages/settings/SettingsImportExport";
import SettingsIntegrations from "./pages/settings/SettingsIntegrations";
import NotFound from "./pages/NotFound";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile";
import ComingSoon from "./pages/ComingSoon";
import MemberAppPreview from "./pages/MemberAppPreview";
import TrainerAppPreview from "./pages/TrainerAppPreview";
import LiffMemberApp from "./pages/liff/LiffMemberApp";
import LiffTrainerApp from "./pages/liff/LiffTrainerApp";
import LiffCallback from "./pages/liff/LiffCallback";
import DiagnosticsDataAudit from "./pages/DiagnosticsDataAudit";
import CheckinRedeem from "./pages/CheckinRedeem";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              {/* Signup disabled for security — staff must be invited by a manager */}
              {/* <Route path="/signup" element={<Signup />} /> */}
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* QR Check-in redemption (public) */}
              <Route path="/checkin" element={<CheckinRedeem />} />
              
              {/* LIFF public routes */}
              <Route path="/liff/member" element={<LiffMemberApp />} />
              <Route path="/liff/trainer" element={<LiffTrainerApp />} />
              <Route path="/liff/callback" element={<LiffCallback />} />
              
              {/* Protected routes - wrap with ProtectedRoute which handles auth check before rendering MainLayout */}
              <Route 
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="lobby" element={<Lobby />} />
                <Route path="members" element={<Members />} />
                <Route path="members/:id/detail" element={<MemberDetails />} />
                <Route path="leads" element={<Leads />} />
                <Route path="package" element={<Packages />} />
                <Route path="package/create" element={<CreatePackage />} />
                <Route path="package/:id/edit" element={<CreatePackage />} />
                <Route path="package/:id" element={<PackageDetails />} />
                <Route path="promotion" element={<Promotions />} />
                <Route path="promotion/create" element={<CreatePromotion />} />
                <Route path="promotion/:id" element={<PromotionDetails />} />
                <Route path="calendar" element={<Schedule />} />
                <Route path="room" element={<Rooms />} />
                <Route path="room/:id" element={<RoomDetails />} />
                <Route path="class" element={<Classes />} />
                <Route path="class/create" element={<CreateClass />} />
                <Route path="class/:id" element={<ClassDetails />} />
                <Route path="class-category" element={<ClassCategories />} />
                <Route path="class-category/:id" element={<ClassCategoryDetails />} />
                <Route path="admin" element={<ProtectedRoute minAccessLevel="level_3_manager"><Staff /></ProtectedRoute>} />
                <Route path="admin/:id" element={<ProtectedRoute minAccessLevel="level_3_manager"><StaffDetails /></ProtectedRoute>} />
                <Route path="roles" element={<ProtectedRoute minAccessLevel="level_4_master"><Roles /></ProtectedRoute>} />
                <Route path="roles/create" element={<ProtectedRoute minAccessLevel="level_4_master"><RoleEditor /></ProtectedRoute>} />
                <Route path="roles/:id" element={<ProtectedRoute minAccessLevel="level_4_master"><RoleEditor /></ProtectedRoute>} />
                <Route path="location" element={<Locations />} />
                <Route path="activity-log" element={<ActivityLog />} />
                <Route path="announcement" element={<Announcements />} />
                <Route path="workout-list" element={<WorkoutList />} />
                <Route path="transfer-slip" element={<ProtectedRoute minAccessLevel="level_3_manager"><TransferSlips /></ProtectedRoute>} />
                <Route path="finance" element={<ProtectedRoute minAccessLevel="level_3_manager"><Finance /></ProtectedRoute>} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="report" element={<Reports />} />
                <Route path="report/member/members-at-risk" element={<MembersAtRisk />} />
                <Route path="report/member/active-members" element={<ActiveMembers />} />
                <Route path="report/class/capacity-by-hour" element={<ClassCapacityByHour />} />
                <Route path="report/class/capacity-over-time" element={<ClassCapacityOverTime />} />
                <Route path="report/package/sales" element={<PackageSales />} />
                <Route path="report/package/sales-over-time" element={<PackageSalesOverTime />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="coming-soon" element={<ComingSoon />} />
                <Route path="member-app" element={<MemberAppPreview />} />
                <Route path="trainer-app" element={<TrainerAppPreview />} />
                <Route path="setting" element={<Settings />}>
                  <Route index element={<Navigate to="general" replace />} />
                  <Route path="general" element={<SettingsGeneral />} />
                  <Route path="class-management" element={<SettingsClass />} />
                  <Route path="client-management" element={<SettingsClient />} />
                  <Route path="setting-package" element={<SettingsPackage />} />
                  <Route path="member-contracts" element={<SettingsContracts />} />
                  <Route path="feature-flags" element={<SettingsFeatureFlags />} />
                  <Route path="import-export" element={<SettingsImportExport />} />
                  <Route path="integrations" element={<SettingsIntegrations />} />
                </Route>
                <Route path="diagnostics/data-audit" element={<ProtectedRoute minAccessLevel="level_4_master"><DiagnosticsDataAudit /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
