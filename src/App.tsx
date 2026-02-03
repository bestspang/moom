import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Promotions from "./pages/Promotions";
import Schedule from "./pages/Schedule";
import Rooms from "./pages/Rooms";
import Classes from "./pages/Classes";
import ClassCategories from "./pages/ClassCategories";
import Staff from "./pages/Staff";
import Roles from "./pages/Roles";
import Locations from "./pages/Locations";
import ActivityLog from "./pages/ActivityLog";
import Announcements from "./pages/Announcements";
import WorkoutList from "./pages/WorkoutList";
import TransferSlips from "./pages/TransferSlips";
import Finance from "./pages/Finance";
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
import NotFound from "./pages/NotFound";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile";

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
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
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
                <Route path="promotion" element={<Promotions />} />
                <Route path="calendar" element={<Schedule />} />
                <Route path="room" element={<Rooms />} />
                <Route path="class" element={<Classes />} />
                <Route path="class-category" element={<ClassCategories />} />
                <Route path="admin" element={<Staff />} />
                <Route path="roles" element={<Roles />} />
                <Route path="location" element={<Locations />} />
                <Route path="activity-log" element={<ActivityLog />} />
                <Route path="announcement" element={<Announcements />} />
                <Route path="workout-list" element={<WorkoutList />} />
                <Route path="transfer-slip" element={<TransferSlips />} />
                <Route path="finance" element={<Finance />} />
                <Route path="report" element={<Reports />} />
                <Route path="report/member/members-at-risk" element={<MembersAtRisk />} />
                <Route path="report/member/active-members" element={<ActiveMembers />} />
                <Route path="report/class/capacity-by-hour" element={<ClassCapacityByHour />} />
                <Route path="report/class/capacity-over-time" element={<ClassCapacityOverTime />} />
                <Route path="report/package/sales" element={<PackageSales />} />
                <Route path="report/package/sales-over-time" element={<PackageSalesOverTime />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="setting" element={<Settings />}>
                  <Route path="general" element={<SettingsGeneral />} />
                  <Route path="class-management" element={<SettingsClass />} />
                  <Route path="client-management" element={<SettingsClient />} />
                  <Route path="setting-package" element={<SettingsPackage />} />
                  <Route path="member-contracts" element={<SettingsContracts />} />
                </Route>
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
