export const queryKeys = {
  schedule: (dateStr: string) => ['schedule', dateStr] as const,
  scheduleStats: (dateStr: string) => ['schedule-stats', dateStr] as const,
  rooms: (status?: string, search?: string) => ['rooms', status, search] as const,
  roomStats: () => ['room-stats'] as const,
  locations: (status?: string, search?: string) => ['locations', status, search] as const,
  locationStats: () => ['location-stats'] as const,
  classes: (status?: string, search?: string) => ['classes', status, search] as const,
  classStats: () => ['class-stats'] as const,
  classBookings: (scheduleId?: string) => ['class-bookings', scheduleId] as const,
  classWaitlist: (scheduleId?: string) => ['class-waitlist', scheduleId] as const,
  bookingCount: (scheduleId: string) => ['booking-count', scheduleId] as const,
  memberBookings: (memberId: string, status?: string) => ['member-bookings', memberId, status] as const,
  members: (params?: object) => ['members', params] as const,
  member: (id: string) => ['member', id] as const,
  memberStats: () => ['member-stats'] as const,
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
};
