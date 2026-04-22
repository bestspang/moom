export const queryKeys = {
  schedule: (dateStr: string) => ['schedule', dateStr] as const,
  scheduleStats: (dateStr: string) => ['schedule-stats', dateStr] as const,
  rooms: (status?: string, search?: string, categoryFilter?: string) => ['rooms', status, search, categoryFilter] as const,
  room: (id: string) => ['rooms', 'detail', id] as const,
  roomStats: () => ['room-stats'] as const,
  locations: (status?: string, search?: string) => ['locations', status, search] as const,
  locationStats: () => ['location-stats'] as const,
  classes: (status?: string, search?: string, typeFilter?: string, categoryFilter?: string, levelFilter?: string, page?: number, perPage?: number) => ['classes', status, search, typeFilter, categoryFilter, levelFilter, page, perPage] as const,
  classDetail: (id: string) => ['classes', 'detail', id] as const,
  classStats: () => ['class-stats'] as const,
  classPerformance: (id: string) => ['class-performance', id] as const,
  classBookings: (scheduleId?: string) => ['class-bookings', scheduleId] as const,
  classWaitlist: (scheduleId?: string) => ['class-waitlist', scheduleId] as const,
  bookingCount: (scheduleId: string) => ['booking-count', scheduleId] as const,
  memberBookings: (memberId: string, status?: string) => ['member-bookings', memberId, status] as const,
  members: (params?: object) => ['members', params] as const,
  member: (id: string) => ['member', id] as const,
  memberStats: () => ['member-stats'] as const,
  nextMemberId: () => ['next-member-id'] as const,
  leads: (search?: string, status?: string) => ['leads', search, status] as const,
  dashboardStats: () => ['dashboard-stats'] as const,
  highRiskMembers: () => ['high-risk-members'] as const,
  hotLeads: () => ['hot-leads'] as const,
  upcomingBirthdays: () => ['upcoming-birthdays'] as const,
  trainers: () => ['trainers'] as const,
  featureFlags: () => ['feature-flags'] as const,
  featureFlag: (key: string) => ['feature-flag', key] as const,
  aiSuggestions: (status?: string) => ['ai-suggestions', status] as const,
  aiRuns: () => ['ai-runs'] as const,

  // Packages
  packages: (status?: string, search?: string) => ['packages', status, search] as const,
  package: (id: string) => ['packages', id] as const,
  packageStats: () => ['package-stats'] as const,
  packageMetrics: (id: string) => ['package-metrics', id] as const,

  // Promotions
  promotions: (status?: string, search?: string) => ['promotions', status, search] as const,
  promotion: (id: string) => ['promotions', id] as const,
  promotionStats: () => ['promotion-stats'] as const,

  // Member packages & usage
  memberPackages: (memberId: string) => ['member-packages', memberId] as const,
  packageUsage: (memberPackageId: string) => ['package-usage', memberPackageId] as const,

  // Finance
  transactions: () => ['transactions'] as const,
  financeTransactions: (filters?: object) => ['finance-transactions', filters] as const,
  transferSlips: (filters?: object) => ['transfer-slips', filters] as const,
  transferSlipStats: () => ['transfer-slip-stats'] as const,
  transferSlipDetail: (id: string) => ['transfer-slip-detail', id] as const,

  // Training / Workouts
  trainingTemplates: (search?: string, filter?: string) => ['training-templates', search, filter] as const,

  // Staff
  staff: (status?: string, search?: string) => ['staff', status, search] as const,
  staffMember: (id: string) => ['staff', id] as const,
  staffStats: () => ['staff-stats'] as const,
  staffPositions: (staffId: string) => ['staff-positions', staffId] as const,

  // Roles & Permissions
  roles: (search?: string) => ['roles', search] as const,
  role: (id: string) => ['roles', id] as const,
  rolePermissions: (roleId: string) => ['role-permissions', roleId] as const,
  myPermissions: (userId?: string) => ['my-permissions', userId] as const,

  // Dashboard
  gymCheckins: (dateStr: string, search?: string) => ['gym-checkins', dateStr, search] as const,

  // Activity Log
  activityLogs: (startDate?: string, endDate?: string, eventTypes?: string[], search?: string, page?: number, perPage?: number) => ['activity-logs', startDate, endDate, eventTypes, search, page, perPage] as const,

  // Analytics
  analyticsRevenueByMonth: () => ['analytics-revenue-by-month'] as const,
  analyticsMemberGrowth: () => ['analytics-member-growth'] as const,
  analyticsClassFillRate: () => ['analytics-class-fill-rate'] as const,
  analyticsLeadFunnel: () => ['analytics-lead-funnel'] as const,

  // Announcements
  announcements: (status?: string | null, search?: string) => ['announcements', status, search] as const,
  announcementStats: () => ['announcement-stats'] as const,

  // Business Health
  businessHealth: () => ['business-health'] as const,

  // Check-in QR
  activeQrToken: (memberId: string | null, locationId?: string) => ['active-qr-token', memberId, locationId] as const,
  tokenInfo: (token: string | null) => ['token-info', token] as const,

  // Check-ins (Lobby)
  checkIns: (dateStr: string, search?: string) => ['check-ins', dateStr, search] as const,
  membersForCheckin: (search?: string) => ['members-for-checkin', search] as const,
  memberPackagesForCheckin: (memberId: string | null) => ['member-packages-for-checkin', memberId] as const,
  checkInDuplicate: (memberId: string | null, locationId: string | null, dateStr: string) => ['check-in-duplicate', memberId, locationId, dateStr] as const,

  // Churn Prediction
  churnPrediction: () => ['churn-prediction'] as const,

  // Class Categories
  classCategories: (search?: string) => ['class-categories', search] as const,
  classCategory: (id: string) => ['class-categories', id] as const,
  categoryClasses: (categoryId: string) => ['class-categories', categoryId, 'classes'] as const,

  // Cohort Retention
  cohortRetention: () => ['cohort-retention'] as const,

  // Daily Briefing
  dailyBriefing: (stats?: object, language?: string) => ['daily-briefing', stats, language] as const,

  // Economy Guardrails
  economyGuardrails: () => ['economy-guardrails'] as const,

  // Engagement Scores
  engagementScores: (memberIds: string[]) => ['engagement-scores', memberIds] as const,

  // Expenses
  expenses: (startDate?: string, endDate?: string) => ['expenses', startDate, endDate] as const,

  // Feature Flags (extended)
  featureEnabled: (key: string, locationId?: string) => ['feature-enabled', key, locationId] as const,
  flagAssignments: (flagId: string) => ['flag-assignments', flagId] as const,

  // Gamification
  gamificationAudit: (flaggedOnly?: boolean) => ['gamification-audit', flaggedOnly] as const,
  gamificationTrainerTiers: () => ['gamification-trainer-tiers'] as const,
  gamificationSeasons: () => ['gamification-seasons'] as const,
  gamificationBadges: () => ['gamification-badges'] as const,
  gamificationChallenges: (statusFilter?: string) => ['gamification-challenges', statusFilter] as const,
  gamificationCouponTemplates: () => ['gamification-coupon-templates'] as const,
  gamificationLevels: () => ['gamification-levels'] as const,
  gamificationQuestTemplates: () => ['gamification-quest-templates'] as const,
  gamificationRewards: () => ['gamification-rewards'] as const,
  gamificationRules: () => ['gamification-rules'] as const,
  gamificationShopRules: () => ['gamification-shop-rules'] as const,

  // Goals
  goals: () => ['goals'] as const,

  // Insights / Metrics
  insightsOverview: () => ['insights-overview'] as const,
  revenueDaily30d: () => ['revenue-daily-30d'] as const,

  // Leads (single)
  leadDetail: (id: string) => ['leads', id] as const,

  // LINE
  lineIdentity: (ownerType: string, ownerId?: string) => ['line-identity', ownerType, ownerId] as const,
  lineUser: (lineUserId: string) => ['line-user', lineUserId] as const,
  memberLineLink: (memberId: string) => ['member-line-link', memberId] as const,
  lineUsers: () => ['line-users'] as const,
  searchLineUsers: (searchTerm: string) => ['search-line-users', searchTerm] as const,
  lineUserStats: () => ['line-user-stats'] as const,

  // Member Details
  memberAttendance: (memberId: string) => ['member-attendance', memberId] as const,
  memberBilling: (memberId: string) => ['member-billing', memberId] as const,
  memberNotes: (memberId: string) => ['member-notes', memberId] as const,
  memberInjuries: (memberId: string) => ['member-injuries', memberId] as const,
  memberSuspensions: (memberId: string) => ['member-suspensions', memberId] as const,
  memberContracts: (memberId: string) => ['member-contracts', memberId] as const,
  memberSummaryStats: (memberId: string) => ['member-summary-stats', memberId] as const,

  // Members Enriched
  membersEnrichment: (memberIds: string[]) => ['members-enrichment', memberIds] as const,

  // Notifications
  notifications: (status?: string, types?: string[], userId?: string) => ['notifications', status, types, userId] as const,
  notificationsUnreadCount: (userId?: string) => ['notifications-unread-count', userId] as const,
  notificationsRecent: (userId?: string, limit?: number) => ['notifications-recent', userId, limit] as const,

  // Package Usage
  memberUsageHistory: (memberId: string) => ['member-usage-history', memberId] as const,
  packageUsageSummary: (memberPackageId: string) => ['package-usage-summary', memberPackageId] as const,

  // Peak Hour Revenue
  peakHourRevenue: () => ['peak-hour-revenue'] as const,

  // Promotion Packages
  promotionPackages: (promotionId: string | null) => ['promotion-packages', promotionId] as const,

  // Recent Activity (Dashboard)
  recentActivity: () => ['dashboard', 'recent-activity'] as const,

  // Reports
  membersAtRiskStats: () => ['members-at-risk-stats'] as const,
  activeMembers: (dateRange?: object, filters?: object) => ['active-members', dateRange, filters] as const,
  classCapacityByHour: (dateRange?: object, filters?: object) => ['class-capacity-by-hour', dateRange, filters] as const,
  classCapacityOverTime: (dateRange?: object, filters?: object) => ['class-capacity-over-time', dateRange, filters] as const,
  packageSales: (dateRange?: object, filters?: object) => ['package-sales', dateRange, filters] as const,
  packageSalesOverTime: (dateRange?: object, filters?: object, timePeriod?: string) => ['package-sales-over-time', dateRange, filters, timePeriod] as const,

  // Revenue Forecast
  revenueForecast: () => ['revenue-forecast'] as const,

  // Settings
  settings: (section: string) => ['settings', section] as const,

  // Transfer Slips (extended)
  slipActivityLog: (slipId: string) => ['slip-activity-log', slipId] as const,

  // Member attendance (check-in tracking)
  memberAttendanceCheckin: () => ['member-attendance'] as const,
};
