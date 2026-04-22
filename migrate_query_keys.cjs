const fs = require('fs');
const path = require('path');

const hooksDir = '/Users/openClaw/moom_project/moom/src/hooks';

// Helper to add import if not already present
function addImport(content, importLine) {
  if (content.includes("from '@/lib/queryKeys'")) return content;
  // Add after last existing import from @tanstack/react-query or supabase or similar
  const firstImportEnd = content.indexOf('\n', content.indexOf("import "));
  // Find the last consecutive import line
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportIdx = i;
    else if (lastImportIdx >= 0 && !lines[i].startsWith('import ')) break;
  }
  lines.splice(lastImportIdx + 1, 0, importLine);
  return lines.join('\n');
}

const IMPORT_LINE = "import { queryKeys } from '@/lib/queryKeys';";

function migrate(filename, transformFn) {
  const filepath = path.join(hooksDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`SKIP (not found): ${filename}`);
    return;
  }
  let content = fs.readFileSync(filepath, 'utf8');
  const original = content;
  content = addImport(content, IMPORT_LINE);
  content = transformFn(content);
  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`MIGRATED: ${filename}`);
  } else {
    console.log(`NO CHANGE: ${filename}`);
  }
}

function r(content, from, to) {
  return content.split(from).join(to);
}

// useClassCategories.ts
migrate('useClassCategories.ts', (c) => {
  c = r(c, "queryKey: ['class-categories', search],", "queryKey: queryKeys.classCategories(search),");
  c = r(c, "queryKey: ['class-categories', id],", "queryKey: queryKeys.classCategory(id),");
  c = r(c, "queryKey: ['class-categories', categoryId, 'classes'],", "queryKey: queryKeys.categoryClasses(categoryId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-categories', variables.id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classCategory(variables.id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-categories'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classCategories() });");
  return c;
});

// useCohortRetention.ts
migrate('useCohortRetention.ts', (c) => {
  c = r(c, "queryKey: ['cohort-retention'],", "queryKey: queryKeys.cohortRetention(),");
  return c;
});

// useDailyBriefing.ts
migrate('useDailyBriefing.ts', (c) => {
  c = r(c, "queryKey: ['daily-briefing', stats, language],", "queryKey: queryKeys.dailyBriefing(stats, language),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['daily-briefing'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.dailyBriefing() });");
  return c;
});

// useEconomyGuardrails.ts
migrate('useEconomyGuardrails.ts', (c) => {
  c = r(c, "queryKey: ['economy-guardrails'],", "queryKey: queryKeys.economyGuardrails(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['economy-guardrails'] });", "qc.invalidateQueries({ queryKey: queryKeys.economyGuardrails() });");
  return c;
});

// useEngagementScores.ts
migrate('useEngagementScores.ts', (c) => {
  c = r(c, "queryKey: ['engagement-scores', memberIds],", "queryKey: queryKeys.engagementScores(memberIds),");
  return c;
});

// useExpenses.ts
migrate('useExpenses.ts', (c) => {
  c = r(c, "queryKey: ['expenses', filters.startDate?.toISOString(), filters.endDate?.toISOString()],", "queryKey: queryKeys.expenses(filters.startDate?.toISOString(), filters.endDate?.toISOString()),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['expenses'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });");
  return c;
});

// useFeatureFlags.ts - has queryKeys import already but some inline keys
migrate('useFeatureFlags.ts', (c) => {
  c = r(c, "queryKey: ['feature-enabled', key, locationId],", "queryKey: queryKeys.featureEnabled(key, locationId),");
  c = r(c, "queryKey: ['flag-assignments', flagId],", "queryKey: queryKeys.flagAssignments(flagId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['feature-flags'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['feature-flag'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.featureFlag('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['feature-enabled'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.featureEnabled('') });");
  return c;
});

// useGamificationAudit.ts
migrate('useGamificationAudit.ts', (c) => {
  c = r(c, "queryKey: ['gamification-audit', opts?.flaggedOnly],", "queryKey: queryKeys.gamificationAudit(opts?.flaggedOnly),");
  c = r(c, "queryKey: ['gamification-trainer-tiers'],", "queryKey: queryKeys.gamificationTrainerTiers(),");
  c = r(c, "queryKey: ['gamification-seasons'],", "queryKey: queryKeys.gamificationSeasons(),");
  return c;
});

// useGamificationBadges.ts
migrate('useGamificationBadges.ts', (c) => {
  c = r(c, "queryKey: ['gamification-badges'],", "queryKey: queryKeys.gamificationBadges(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-badges'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationBadges() });");
  return c;
});

// useGamificationChallenges.ts
migrate('useGamificationChallenges.ts', (c) => {
  c = r(c, "queryKey: ['gamification-challenges', statusFilter],", "queryKey: queryKeys.gamificationChallenges(statusFilter),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-challenges'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationChallenges() });");
  return c;
});

// useGamificationCoupons.ts
migrate('useGamificationCoupons.ts', (c) => {
  c = r(c, "queryKey: ['gamification-coupon-templates'],", "queryKey: queryKeys.gamificationCouponTemplates(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-coupon-templates'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationCouponTemplates() });");
  return c;
});

// useGamificationLevels.ts
migrate('useGamificationLevels.ts', (c) => {
  c = r(c, "queryKey: ['gamification-levels'],", "queryKey: queryKeys.gamificationLevels(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-levels'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationLevels() });");
  return c;
});

// useGamificationQuests.ts
migrate('useGamificationQuests.ts', (c) => {
  c = r(c, "queryKey: ['gamification-quest-templates'],", "queryKey: queryKeys.gamificationQuestTemplates(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-quest-templates'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationQuestTemplates() });");
  return c;
});

// useGamificationRewards.ts
migrate('useGamificationRewards.ts', (c) => {
  c = r(c, "queryKey: ['gamification-rewards'],", "queryKey: queryKeys.gamificationRewards(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-rewards'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationRewards() });");
  return c;
});

// useGamificationRules.ts
migrate('useGamificationRules.ts', (c) => {
  c = r(c, "queryKey: ['gamification-rules'],", "queryKey: queryKeys.gamificationRules(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-rules'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationRules() });");
  return c;
});

// useGamificationShopRules.ts
migrate('useGamificationShopRules.ts', (c) => {
  c = r(c, "queryKey: ['gamification-shop-rules'],", "queryKey: queryKeys.gamificationShopRules(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['gamification-shop-rules'] });", "qc.invalidateQueries({ queryKey: queryKeys.gamificationShopRules() });");
  return c;
});

// useGoals.ts
migrate('useGoals.ts', (c) => {
  c = r(c, "queryKey: ['goals'],", "queryKey: queryKeys.goals(),");
  c = r(c, "qc.invalidateQueries({ queryKey: ['goals'] });", "qc.invalidateQueries({ queryKey: queryKeys.goals() });");
  return c;
});

// useInsightsMetrics.ts
migrate('useInsightsMetrics.ts', (c) => {
  c = r(c, "queryKey: ['insights-overview'],", "queryKey: queryKeys.insightsOverview(),");
  c = r(c, "queryKey: ['revenue-daily-30d'],", "queryKey: queryKeys.revenueDaily30d(),");
  return c;
});

// useLeads.ts - already has queryKeys but some inline
migrate('useLeads.ts', (c) => {
  c = r(c, "queryKey: ['leads', id],", "queryKey: queryKeys.leadDetail(id),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['leads'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.leads() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['members'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.members() });");
  return c;
});

// useLineIdentity.ts
migrate('useLineIdentity.ts', (c) => {
  c = r(c, "queryKey: ['line-identity', ownerType, ownerId],", "queryKey: queryKeys.lineIdentity(ownerType, ownerId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['line-identity', variables.ownerType, variables.ownerId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.lineIdentity(variables.ownerType, variables.ownerId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['line-users'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.lineUsers() });");
  return c;
});

// useLineUsers.ts
migrate('useLineUsers.ts', (c) => {
  c = r(c, "queryKey: ['line-user', lineUserId],", "queryKey: queryKeys.lineUser(lineUserId),");
  c = r(c, "queryKey: ['member-line-link', memberId],", "queryKey: queryKeys.memberLineLink(memberId),");
  c = r(c, "queryKey: ['line-users'],", "queryKey: queryKeys.lineUsers(),");
  c = r(c, "queryKey: ['search-line-users', searchTerm],", "queryKey: queryKeys.searchLineUsers(searchTerm),");
  c = r(c, "queryKey: ['line-user-stats'],", "queryKey: queryKeys.lineUserStats(),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['line-user', variables.lineUserId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.lineUser(variables.lineUserId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-line-link', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberLineLink(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['line-users'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.lineUsers() });");
  return c;
});

// useLobby.ts (useCheckIns, useMembersForCheckIn, useMemberPackages, useCheckDuplicate)
migrate('useLobby.ts', (c) => {
  c = r(c, "queryKey: ['check-ins', dateStr, search],", "queryKey: queryKeys.checkIns(dateStr, search),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['check-ins'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.checkIns('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });");
  c = r(c, "queryKey: ['members-for-checkin', search],", "queryKey: queryKeys.membersForCheckin(search),");
  c = r(c, "queryKey: ['member-packages-for-checkin', memberId],", "queryKey: queryKeys.memberPackagesForCheckin(memberId),");
  c = r(c, "queryKey: ['check-in-duplicate', memberId, locationId, dateStr],", "queryKey: queryKeys.checkInDuplicate(memberId, locationId, dateStr),");
  return c;
});

// useLocations.ts - check if it has inline keys
migrate('useLocations.ts', (c) => {
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['locations'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.locations() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['location-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.locationStats() });");
  return c;
});

// useMemberDetails.ts
migrate('useMemberDetails.ts', (c) => {
  c = r(c, "queryKey: ['member', id],", "queryKey: queryKeys.member(id),");
  c = r(c, "queryKey: ['member-packages', memberId],", "queryKey: queryKeys.memberPackages(memberId),");
  c = r(c, "queryKey: ['member-attendance', memberId],", "queryKey: queryKeys.memberAttendance(memberId),");
  c = r(c, "queryKey: ['member-billing', memberId],", "queryKey: queryKeys.memberBilling(memberId),");
  c = r(c, "queryKey: ['member-notes', memberId],", "queryKey: queryKeys.memberNotes(memberId),");
  c = r(c, "queryKey: ['member-injuries', memberId],", "queryKey: queryKeys.memberInjuries(memberId),");
  c = r(c, "queryKey: ['member-suspensions', memberId],", "queryKey: queryKeys.memberSuspensions(memberId),");
  c = r(c, "queryKey: ['member-contracts', memberId],", "queryKey: queryKeys.memberContracts(memberId),");
  c = r(c, "queryKey: ['member-summary-stats', memberId],", "queryKey: queryKeys.memberSummaryStats(memberId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-notes', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberNotes(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member', variables.id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.member(variables.id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['members'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.members() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-injuries', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberInjuries(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-suspensions', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberSuspensions(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.member(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-contracts', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberContracts(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-packages', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.financeTransactions() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['package-metrics'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.packageMetrics('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-billing', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberBilling(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-summary-stats', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberSummaryStats(variables.memberId) });");
  return c;
});

// useMembersEnriched.ts
migrate('useMembersEnriched.ts', (c) => {
  c = r(c, "queryKey: ['members-enrichment', memberIds],", "queryKey: queryKeys.membersEnrichment(memberIds),");
  return c;
});

// useNotifications.ts
migrate('useNotifications.ts', (c) => {
  c = r(c, "queryKey: ['notifications', status, types, user?.id],", "queryKey: queryKeys.notifications(status, types, user?.id),");
  c = r(c, "queryKey: ['notifications-unread-count', user?.id],", "queryKey: queryKeys.notificationsUnreadCount(user?.id),");
  c = r(c, "queryKey: ['notifications-recent', user?.id, limit],", "queryKey: queryKeys.notificationsRecent(user?.id, limit),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['notifications'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRecent() });");
  return c;
});

// usePackageMetrics.ts
migrate('usePackageMetrics.ts', (c) => {
  c = r(c, "queryKey: ['package-metrics', packageId],", "queryKey: queryKeys.packageMetrics(packageId),");
  return c;
});

// usePackageUsage.ts
migrate('usePackageUsage.ts', (c) => {
  c = r(c, "queryKey: ['package-usage', memberPackageId],", "queryKey: queryKeys.packageUsage(memberPackageId),");
  c = r(c, "queryKey: ['member-usage-history', memberId],", "queryKey: queryKeys.memberUsageHistory(memberId),");
  c = r(c, "queryKey: ['package-usage-summary', memberPackageId],", "queryKey: queryKeys.packageUsageSummary(memberPackageId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['package-usage', variables.memberPackageId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.packageUsage(variables.memberPackageId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-packages'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages('') });");
  return c;
});

// usePeakHourRevenue.ts
migrate('usePeakHourRevenue.ts', (c) => {
  c = r(c, "queryKey: ['peak-hour-revenue'],", "queryKey: queryKeys.peakHourRevenue(),");
  return c;
});

// usePermissions.ts
migrate('usePermissions.ts', (c) => {
  c = r(c, "queryKey: ['my-permissions', user?.id],", "queryKey: queryKeys.myPermissions(user?.id),");
  return c;
});

// usePromotionPackages.ts
migrate('usePromotionPackages.ts', (c) => {
  c = r(c, "queryKey: ['promotion-packages', promotionId],", "queryKey: queryKeys.promotionPackages(promotionId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['promotion-packages', vars.promotionId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.promotionPackages(vars.promotionId) });");
  return c;
});

// usePromotions.ts - check which keys are inline
migrate('usePromotions.ts', (c) => {
  c = r(c, "queryKey: ['promotions', status, search],", "queryKey: queryKeys.promotions(status, search),");
  c = r(c, "queryKey: ['promotion-stats'],", "queryKey: queryKeys.promotionStats(),");
  c = r(c, "queryKey: ['promotions', id],", "queryKey: queryKeys.promotion(id),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['promotions'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.promotions() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['promotions', variables.id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.promotion(variables.id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.promotionStats() });");
  return c;
});

// useRealtimeSync.ts
migrate('useRealtimeSync.ts', (c) => {
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['schedule', scheduledDate] });", "queryClient.invalidateQueries({ queryKey: queryKeys.schedule(scheduledDate) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['schedule-stats', scheduledDate] });", "queryClient.invalidateQueries({ queryKey: queryKeys.scheduleStats(scheduledDate) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });");
  return c;
});

// useRecentActivity.ts
migrate('useRecentActivity.ts', (c) => {
  c = r(c, "queryKey: ['dashboard', 'recent-activity'],", "queryKey: queryKeys.recentActivity(),");
  return c;
});

// useReports.ts
migrate('useReports.ts', (c) => {
  c = r(c, "queryKey: ['members-at-risk-stats'],", "queryKey: queryKeys.membersAtRiskStats(),");
  c = r(c, "queryKey: ['active-members', dateRange, filters],", "queryKey: queryKeys.activeMembers(dateRange, filters),");
  c = r(c, "queryKey: ['class-capacity-by-hour', dateRange, filters],", "queryKey: queryKeys.classCapacityByHour(dateRange, filters),");
  c = r(c, "queryKey: ['class-capacity-over-time', dateRange, filters],", "queryKey: queryKeys.classCapacityOverTime(dateRange, filters),");
  c = r(c, "queryKey: ['package-sales', dateRange, filters],", "queryKey: queryKeys.packageSales(dateRange, filters),");
  c = r(c, "queryKey: ['package-sales-over-time', dateRange, filters, timePeriod],", "queryKey: queryKeys.packageSalesOverTime(dateRange, filters, timePeriod),");
  return c;
});

// useRevenueForecast.ts
migrate('useRevenueForecast.ts', (c) => {
  c = r(c, "queryKey: ['revenue-forecast'],", "queryKey: queryKeys.revenueForecast(),");
  return c;
});

// useRoles.ts - check if it has inline keys
migrate('useRoles.ts', (c) => {
  c = r(c, "queryKey: ['roles', search],", "queryKey: queryKeys.roles(search),");
  c = r(c, "queryKey: ['roles', id],", "queryKey: queryKeys.role(id),");
  c = r(c, "queryKey: ['role-permissions', roleId],", "queryKey: queryKeys.rolePermissions(roleId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['roles'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.roles() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['role-permissions'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.rolePermissions('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['my-permissions'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.myPermissions() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['roles', variables.id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.role(variables.id) });");
  return c;
});

// useRooms.ts
migrate('useRooms.ts', (c) => {
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['rooms'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.rooms() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['room-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.roomStats() });");
  return c;
});

// useSchedule.ts
migrate('useSchedule.ts', (c) => {
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['schedule'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.schedule('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['schedule-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.scheduleStats('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-bookings'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classBookings() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-packages'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['package-usage'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.packageUsage('') });");
  return c;
});

// useSettings.ts
migrate('useSettings.ts', (c) => {
  c = r(c, "queryKey: ['settings', section],", "queryKey: queryKeys.settings(section),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['settings', variables.section] });", "queryClient.invalidateQueries({ queryKey: queryKeys.settings(variables.section) });");
  return c;
});

// useStaff.ts
migrate('useStaff.ts', (c) => {
  c = r(c, "queryKey: ['staff', status, search],", "queryKey: queryKeys.staff(status, search),");
  c = r(c, "queryKey: ['staff-stats'],", "queryKey: queryKeys.staffStats(),");
  c = r(c, "queryKey: ['staff', id],", "queryKey: queryKeys.staffMember(id),");
  c = r(c, "queryKey: ['staff-positions', staffId],", "queryKey: queryKeys.staffPositions(staffId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['staff'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.staff() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['staff-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.staffStats() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['staff', variables.id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.staffMember(variables.id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['staff-positions', variables.staff_id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.staffPositions(variables.staff_id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['staff-positions', result.staff_id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.staffPositions(result.staff_id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['roles'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.roles() });");
  return c;
});

// useTrainingTemplates.ts
migrate('useTrainingTemplates.ts', (c) => {
  c = r(c, "qc.invalidateQueries({ queryKey: ['training-templates'] });", "qc.invalidateQueries({ queryKey: queryKeys.trainingTemplates() });");
  return c;
});

// useTransferSlips.ts
migrate('useTransferSlips.ts', (c) => {
  c = r(c, "queryKey: ['transfer-slips', filters],", "queryKey: queryKeys.transferSlips(filters),");
  c = r(c, "queryKey: ['transfer-slip-stats'],", "queryKey: queryKeys.transferSlipStats(),");
  c = r(c, "queryKey: ['transfer-slip-detail', id],", "queryKey: queryKeys.transferSlipDetail(id),");
  c = r(c, "queryKey: ['slip-activity-log', slipId],", "queryKey: queryKeys.slipActivityLog(slipId),");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['transfer-slips'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.transferSlips() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['transfer-slip-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.transferSlipStats() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['transfer-slip-detail'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.transferSlipDetail('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['slip-activity-log'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.slipActivityLog('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.financeTransactions() });");
  return c;
});

// useClassBookings.ts
migrate('useClassBookings.ts', (c) => {
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-bookings', variables.scheduleId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classBookings(variables.scheduleId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-bookings', variables.memberId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberBookings(variables.memberId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-bookings'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classBookings() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-bookings'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberBookings('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-attendance'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberAttendanceCheckin() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['package-usage'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.packageUsage('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['member-packages'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.memberPackages('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['gym-checkins'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.gymCheckins('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['schedule'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.schedule('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-waitlist', variables.scheduleId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classWaitlist(variables.scheduleId) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-waitlist', data.schedule_id] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classWaitlist(data.schedule_id) });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-bookings', variables.scheduleId] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classBookings(variables.scheduleId) });");
  return c;
});

// useClasses.ts
migrate('useClasses.ts', (c) => {
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['class-performance'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.classPerformance('') });");
  c = r(c, "queryClient.invalidateQueries({ queryKey: ['schedule'] });", "queryClient.invalidateQueries({ queryKey: queryKeys.schedule('') });");
  return c;
});

console.log('Migration script complete!');
