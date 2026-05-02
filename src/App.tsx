import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { SurfaceProvider } from "@/apps/shared/SurfaceContext";
import { detectSurface } from "@/apps/shared/hostname";
import SurfaceGuard from "@/apps/shared/SurfaceGuard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout";
import "@/i18n";

// Admin Pages (existing)
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
import Insights from "./pages/Insights";
import MembersAtRisk from "./pages/reports/MembersAtRisk";
import ActiveMembers from "./pages/reports/ActiveMembers";
import ClassCapacityByHour from "./pages/reports/ClassCapacityByHour";
import ClassCapacityOverTime from "./pages/reports/ClassCapacityOverTime";
import PackageSales from "./pages/reports/PackageSales";
import PackageSalesOverTime from "./pages/reports/PackageSalesOverTime";
import MemberPackageUsage from "./pages/reports/MemberPackageUsage";
import MemberPackageAtRisk from "./pages/reports/MemberPackageAtRisk";
import ClassCategoryPopularity from "./pages/reports/ClassCategoryPopularity";
import ClassPopularity from "./pages/reports/ClassPopularity";
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
import SettingsBranding from "./pages/settings/SettingsBranding";
import NotFound from "./pages/NotFound";
import Login from "./pages/Auth/Login";
import MemberLogin from "./pages/Auth/MemberLogin";
import MemberSignup from "./pages/Auth/MemberSignup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile";
import ComingSoon from "./pages/ComingSoon";
import MemberAppPreview from "./pages/MemberAppPreview";
import TrainerAppPreview from "./pages/TrainerAppPreview";
import LiffMemberApp from "./pages/liff/LiffMemberApp";
import LiffTrainerApp from "./pages/liff/LiffTrainerApp";
import LiffCallback from "./pages/liff/LiffCallback";
import DiagnosticsDataAudit from "./pages/DiagnosticsDataAudit";
import CheckinRedeem from "./pages/CheckinRedeem";
import CheckinDisplay from "./pages/CheckinDisplay";
import DiagnosticsAuthPage from "./pages/Auth/DiagnosticsAuthPage";
import GamificationStudio from "./pages/gamification/GamificationStudio";
import GamificationOverview from "./pages/gamification/GamificationOverview";
import GamificationRules from "./pages/gamification/GamificationRules";
import GamificationLevels from "./pages/gamification/GamificationLevels";
import GamificationChallenges from "./pages/gamification/GamificationChallenges";
import GamificationBadges from "./pages/gamification/GamificationBadges";
import GamificationRewards from "./pages/gamification/GamificationRewards";
import GamificationTrainers from "./pages/gamification/GamificationTrainers";
import GamificationRisk from "./pages/gamification/GamificationRisk";
import GamificationQuests from "./pages/gamification/GamificationQuests";
import GamificationCoupons from "./pages/gamification/GamificationCoupons";
import GamificationShopRules from "./pages/gamification/GamificationShopRules";
import GamificationGuardrails from "./pages/gamification/GamificationGuardrails";
import GamificationOperations from "./pages/gamification/GamificationOperations";
import GamificationPrestige from "./pages/gamification/GamificationPrestige";
import GamificationStatusTiers from "./pages/gamification/GamificationStatusTiers";

// Experience Surface Layouts
import { MemberLayout } from "@/apps/member";
import { TrainerLayout } from "@/apps/trainer";
import { StaffLayout } from "@/apps/staff";

// Experience Surface Pages
import MemberHomePage from "@/apps/member/pages/MemberHomePage";
import MemberSchedulePage from "@/apps/member/pages/MemberSchedulePage";
import MemberBookingsPage from "@/apps/member/pages/MemberBookingsPage";
import MemberBookingDetailPage from "@/apps/member/pages/MemberBookingDetailPage";
import MemberClassDetailPage from "@/apps/member/pages/MemberClassDetailPage";
import MemberPackagesPage from "@/apps/member/pages/MemberPackagesPage";
import MemberPurchasePage from "@/apps/member/pages/MemberPurchasePage";
import MemberProfilePage from "@/apps/member/pages/MemberProfilePage";
import MemberEditProfilePage from "@/apps/member/pages/MemberEditProfilePage";
import MemberAttendancePage from "@/apps/member/pages/MemberAttendancePage";
import MemberUploadSlipPage from "@/apps/member/pages/MemberUploadSlipPage";
import MemberCheckInPage from "@/apps/member/pages/MemberCheckInPage";
import MemberRewardsPage from "@/apps/member/pages/MemberRewardsPage";
import MemberCouponsPage from "@/apps/member/pages/MemberCouponsPage";
import MemberBadgeGalleryPage from "@/apps/member/pages/MemberBadgeGalleryPage";
import MemberSquadPage from "@/apps/member/pages/MemberSquadPage";
import MemberLeaderboardPage from "@/apps/member/pages/MemberLeaderboardPage";
import MemberSecurityPage from "@/apps/member/pages/MemberSecurityPage";
import MemberNotificationsPage from "@/apps/member/pages/MemberNotificationsPage";
import MemberReferralPage from "@/apps/member/pages/MemberReferralPage";
import MemberMomentumPage from "@/apps/member/pages/MemberMomentumPage";
import MemberRunClubPage from "@/apps/member/pages/MemberRunClubPage";
import TrainerHomePage from "@/apps/trainer/pages/TrainerHomePage";
import TrainerImpactPage from "@/apps/trainer/pages/TrainerImpactPage";
import TrainerSchedulePage from "@/apps/trainer/pages/TrainerSchedulePage";
import TrainerRosterPage from "@/apps/trainer/pages/TrainerRosterPage";
import TrainerWorkoutsPage from "@/apps/trainer/pages/TrainerWorkoutsPage";
import TrainerProfilePage from "@/apps/trainer/pages/TrainerProfilePage";
import TrainerBadgesPage from "@/apps/trainer/pages/TrainerBadgesPage";
import TrainerNotificationsPage from "@/apps/trainer/pages/TrainerNotificationsPage";
import TrainerWorkoutDetailPage from "@/apps/trainer/pages/TrainerWorkoutDetailPage";
import StaffHomePage from "@/apps/staff/pages/StaffHomePage";
import StaffCheckinPage from "@/apps/staff/pages/StaffCheckinPage";
import StaffMembersPage from "@/apps/staff/pages/StaffMembersPage";
import StaffPaymentsPage from "@/apps/staff/pages/StaffPaymentsPage";
import StaffProfilePage from "@/apps/staff/pages/StaffProfilePage";
import StaffSchedulePage from "@/apps/staff/pages/StaffSchedulePage";
import StaffMemberDetailPage from "@/apps/staff/pages/StaffMemberDetailPage";
import DiagnosticsSurfacePage from "@/apps/shared/pages/DiagnosticsSurfacePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <AuthProvider>
      <SurfaceProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SurfaceGuard>
              <Routes>
                {/* ===== Public routes ===== */}
                <Route path="/login" element={<Login />} />
                <Route path="/member/login" element={<MemberLogin />} />
                <Route path="/member/signup" element={<MemberSignup />} />
                <Route path="/signup" element={detectSurface() === 'admin' ? <Navigate to="/login" replace /> : <MemberSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/checkin" element={<CheckinRedeem />} />
                <Route path="/checkin-display" element={<CheckinDisplay />} />

                {/* LIFF public routes */}
                <Route path="/liff/member" element={<LiffMemberApp />} />
                <Route path="/liff/trainer" element={<LiffTrainerApp />} />
                <Route path="/liff/callback" element={<LiffCallback />} />

                {/* ===== Diagnostics (dev only) ===== */}
                <Route path="/diagnostics/surface" element={<DiagnosticsSurfacePage />} />
                <Route path="/diagnostics/auth" element={<DiagnosticsAuthPage />} />

                {/* ===== Member Surface (mobile-first) ===== */}
                <Route path="/member" element={<MemberLayout />}>
                  <Route index element={<MemberHomePage />} />
                  <Route path="schedule" element={<MemberSchedulePage />} />
                  <Route path="schedule/:id" element={<MemberClassDetailPage />} />
                  <Route path="bookings" element={<MemberBookingsPage />} />
                  <Route path="bookings/:id" element={<MemberBookingDetailPage />} />
                  <Route path="packages" element={<MemberPackagesPage />} />
                  <Route path="packages/:id/purchase" element={<MemberPurchasePage />} />
                  <Route path="upload-slip" element={<MemberUploadSlipPage />} />
                  <Route path="check-in" element={<MemberCheckInPage />} />
                  <Route path="rewards" element={<MemberRewardsPage />} />
                  <Route path="badges" element={<MemberBadgeGalleryPage />} />
                  <Route path="squad" element={<MemberSquadPage />} />
                  <Route path="leaderboard" element={<MemberLeaderboardPage />} />
                  <Route path="profile" element={<MemberProfilePage />} />
                  <Route path="profile/edit" element={<MemberEditProfilePage />} />
                  <Route path="security" element={<MemberSecurityPage />} />
                  <Route path="attendance" element={<MemberAttendancePage />} />
                  <Route path="notifications" element={<MemberNotificationsPage />} />
                  <Route path="referral" element={<MemberReferralPage />} />
                  <Route path="momentum" element={<MemberMomentumPage />} />
                  <Route path="coupons" element={<MemberCouponsPage />} />
                  <Route path="run-club" element={<MemberRunClubPage />} />
                </Route>

                {/* ===== Trainer Surface (mobile-first) ===== */}
                <Route path="/trainer" element={<TrainerLayout />}>
                  <Route index element={<TrainerHomePage />} />
                  <Route path="impact" element={<TrainerImpactPage />} />
                  <Route path="schedule" element={<TrainerSchedulePage />} />
                  <Route path="roster" element={<TrainerRosterPage />} />
                  <Route path="workouts" element={<TrainerWorkoutsPage />} />
                  <Route path="workouts/:id" element={<TrainerWorkoutDetailPage />} />
                  <Route path="badges" element={<TrainerBadgesPage />} />
                  <Route path="notifications" element={<TrainerNotificationsPage />} />
                  <Route path="profile" element={<TrainerProfilePage />} />
                </Route>

                {/* ===== Staff Surface (mobile-first) ===== */}
                <Route path="/staff" element={<StaffLayout />}>
                  <Route index element={<StaffHomePage />} />
                  <Route path="checkin" element={<StaffCheckinPage />} />
                  <Route path="members" element={<StaffMembersPage />} />
                  <Route path="members/:id" element={<StaffMemberDetailPage />} />
                  <Route path="payments" element={<StaffPaymentsPage />} />
                  <Route path="schedule" element={<StaffSchedulePage />} />
                  <Route path="profile" element={<StaffProfilePage />} />
                </Route>

                {/* ===== Admin Surface (desktop-first, existing) ===== */}
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
                  <Route path="package" element={<ProtectedRoute minAccessLevel="level_2_operator"><Packages /></ProtectedRoute>} />
                  <Route path="package/create" element={<ProtectedRoute minAccessLevel="level_2_operator"><CreatePackage /></ProtectedRoute>} />
                  <Route path="package/:id/edit" element={<ProtectedRoute minAccessLevel="level_2_operator"><CreatePackage /></ProtectedRoute>} />
                  <Route path="package/:id" element={<ProtectedRoute minAccessLevel="level_2_operator"><PackageDetails /></ProtectedRoute>} />
                  <Route path="promotion" element={<ProtectedRoute minAccessLevel="level_2_operator"><Promotions /></ProtectedRoute>} />
                  <Route path="promotion/create" element={<ProtectedRoute minAccessLevel="level_2_operator"><CreatePromotion /></ProtectedRoute>} />
                  <Route path="promotion/:id" element={<ProtectedRoute minAccessLevel="level_2_operator"><PromotionDetails /></ProtectedRoute>} />
                  <Route path="calendar" element={<ProtectedRoute minAccessLevel="level_2_operator"><Schedule /></ProtectedRoute>} />
                  <Route path="room" element={<ProtectedRoute minAccessLevel="level_2_operator"><Rooms /></ProtectedRoute>} />
                  <Route path="room/:id" element={<ProtectedRoute minAccessLevel="level_2_operator"><RoomDetails /></ProtectedRoute>} />
                  <Route path="class" element={<ProtectedRoute minAccessLevel="level_2_operator"><Classes /></ProtectedRoute>} />
                  <Route path="class/create" element={<ProtectedRoute minAccessLevel="level_2_operator"><CreateClass /></ProtectedRoute>} />
                  <Route path="class/:id" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassDetails /></ProtectedRoute>} />
                  <Route path="class-category" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassCategories /></ProtectedRoute>} />
                  <Route path="class-category/:id" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassCategoryDetails /></ProtectedRoute>} />
                  <Route path="admin" element={<ProtectedRoute minAccessLevel="level_3_manager"><Staff /></ProtectedRoute>} />
                  <Route path="admin/:id" element={<ProtectedRoute minAccessLevel="level_3_manager"><StaffDetails /></ProtectedRoute>} />
                  <Route path="roles" element={<ProtectedRoute minAccessLevel="level_4_master"><Roles /></ProtectedRoute>} />
                  <Route path="roles/create" element={<ProtectedRoute minAccessLevel="level_4_master"><RoleEditor /></ProtectedRoute>} />
                  <Route path="roles/:id" element={<ProtectedRoute minAccessLevel="level_4_master"><RoleEditor /></ProtectedRoute>} />
                  <Route path="location" element={<ProtectedRoute minAccessLevel="level_3_manager"><Locations /></ProtectedRoute>} />
                  <Route path="activity-log" element={<ActivityLog />} />
                  <Route path="announcement" element={<Announcements />} />
                  <Route path="workout-list" element={<ProtectedRoute minAccessLevel="level_2_operator"><WorkoutList /></ProtectedRoute>} />
                  <Route path="transfer-slip" element={<ProtectedRoute minAccessLevel="level_3_manager"><TransferSlips /></ProtectedRoute>} />
                  <Route path="finance" element={<ProtectedRoute minAccessLevel="level_3_manager"><Finance /></ProtectedRoute>} />
                  <Route path="insights" element={<ProtectedRoute minAccessLevel="level_2_operator"><Insights /></ProtectedRoute>} />
                  <Route path="analytics" element={<Navigate to="/insights" replace />} />
                  <Route path="report" element={<Navigate to="/insights" replace />} />
                  <Route path="report/member/members-at-risk" element={<ProtectedRoute minAccessLevel="level_2_operator"><MembersAtRisk /></ProtectedRoute>} />
                  <Route path="report/member/active-members" element={<ProtectedRoute minAccessLevel="level_2_operator"><ActiveMembers /></ProtectedRoute>} />
                  <Route path="report/class/capacity-by-hour" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassCapacityByHour /></ProtectedRoute>} />
                  <Route path="report/class/capacity-over-time" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassCapacityOverTime /></ProtectedRoute>} />
                  <Route path="report/package/sales" element={<ProtectedRoute minAccessLevel="level_2_operator"><PackageSales /></ProtectedRoute>} />
                  <Route path="report/package/sales-over-time" element={<ProtectedRoute minAccessLevel="level_2_operator"><PackageSalesOverTime /></ProtectedRoute>} />
                  <Route path="report/member/package-usage" element={<ProtectedRoute minAccessLevel="level_2_operator"><MemberPackageUsage /></ProtectedRoute>} />
                  <Route path="report/member/package-at-risk" element={<ProtectedRoute minAccessLevel="level_2_operator"><MemberPackageAtRisk /></ProtectedRoute>} />
                  <Route path="report/class/category-popularity" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassCategoryPopularity /></ProtectedRoute>} />
                  <Route path="report/class/popularity" element={<ProtectedRoute minAccessLevel="level_2_operator"><ClassPopularity /></ProtectedRoute>} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="coming-soon" element={<ComingSoon />} />
                  <Route path="member-app" element={<MemberAppPreview />} />
                  <Route path="trainer-app" element={<TrainerAppPreview />} />
                  <Route path="setting" element={<ProtectedRoute minAccessLevel="level_3_manager"><Settings /></ProtectedRoute>}>
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
                  <Route path="gamification" element={<ProtectedRoute minAccessLevel="level_3_manager"><GamificationStudio /></ProtectedRoute>}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<GamificationOverview />} />
                    <Route path="rules" element={<GamificationRules />} />
                    <Route path="levels" element={<GamificationLevels />} />
                    <Route path="challenges" element={<GamificationChallenges />} />
                    <Route path="quests" element={<GamificationQuests />} />
                    <Route path="badges" element={<GamificationBadges />} />
                    <Route path="rewards" element={<GamificationRewards />} />
                    <Route path="coupons" element={<GamificationCoupons />} />
                    <Route path="shop-rules" element={<GamificationShopRules />} />
                    <Route path="trainers" element={<GamificationTrainers />} />
                    <Route path="risk" element={<GamificationRisk />} />
                    <Route path="guardrails" element={<GamificationGuardrails />} />
                    <Route path="operations" element={<GamificationOperations />} />
                    <Route path="prestige" element={<GamificationPrestige />} />
                    <Route path="status-tiers" element={<GamificationStatusTiers />} />
                  </Route>
                  <Route path="diagnostics/data-audit" element={<ProtectedRoute minAccessLevel="level_4_master"><DiagnosticsDataAudit /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </SurfaceGuard>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </SurfaceProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
