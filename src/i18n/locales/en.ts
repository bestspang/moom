export default {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    export: 'Export to CSV',
    loading: 'Loading...',
    noData: 'No data to show',
    actions: 'Actions',
    status: 'Status',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    updated: 'Updated',
    viewAll: 'View all',
    goTo: 'Go to',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    support: 'Support',
    version: 'Version',
    termsAndConditions: 'Terms and Conditions',
    privacyPolicy: 'Privacy Policy',
    success: 'Success',
    error: 'Error',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    lobby: 'Lobby',
    class: 'Class',
    schedule: 'Schedule',
    roomLayouts: 'Room layouts',
    classList: 'Class list',
    classCategories: 'Class categories',
    client: 'Client',
    members: 'Members',
    leads: 'Leads',
    package: 'Package',
    packages: 'Packages',
    promotions: 'Promotions',
    yourGym: 'Your gym',
    staff: 'Staff',
    roles: 'Roles',
    locations: 'Locations',
    activityLog: 'Activity log',
    announcements: 'Announcements',
    workoutList: 'Workout list',
    finance: 'Finance',
    transferSlips: 'Transfer slips',
    reports: 'Reports',
    settings: 'Settings',
    notifications: 'Notifications',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    allCheckinsToday: 'All check-ins today',
    currentlyInClass: 'Currently in class',
    classesScheduledToday: 'Classes scheduled today',
    goToSchedule: 'Go to Schedule',
    todaySchedule: "Today's schedule",
    classes: 'Classes',
    gymCheckin: 'Gym check-in',
    highRiskMembers: 'High risk members',
    hotLeads: 'Hot leads',
    upcomingBirthdays: 'Upcoming birthdays',
    comparedToYesterday: 'compared to yesterday',
  },

  // Lobby
  lobby: {
    title: 'Lobby',
    checkIn: 'Check in',
    searchName: 'Search name',
    time: 'Time',
    name: 'Name',
    packageUsed: 'Package used',
    usage: 'Usage',
    location: 'Location',
    checkedIn: 'Checked in',
  },

  // Members
  members: {
    title: 'Members',
    searchPlaceholder: 'Search ID, name, nickname or contact...',
    createMember: 'Create member',
    suspended: 'Suspended',
    onHold: 'On hold',
    memberDetails: 'Member details',
    memberSince: 'Member since',
    daysUntilAnniversary: 'Days Until 1-year anniversary',
    mostAttendedCategory: 'Most attended category',
    amountSpent: 'Amount spent since joined',
    daysUntilExpiry: 'Days until all packages expire',
    memberCreated: 'Member created successfully',
    memberUpdated: 'Member updated successfully',
    editMember: 'Edit Member',
    tabs: {
      home: 'Home',
      profile: 'Profile',
      attendance: 'Attendance',
      packages: 'Packages',
      billing: 'Billing',
      injuries: 'Injuries',
      notes: 'Notes',
      suspensions: 'Suspensions',
      contract: 'Contract',
    },
    accountDetails: 'Account details',
    purchasePackage: 'Purchase package for this member',
    addBilling: 'Add billing',
    frontDeskNotes: 'Front desk notes',
  },

  // Leads
  leads: {
    title: 'Leads',
    searchPlaceholder: 'Search name or contact number',
    createLead: 'Create lead',
    contactNumber: 'Contact number',
    email: 'Email',
    timesContacted: 'Times contacted',
    lastContacted: 'Last contacted',
    lastAttended: 'Last attended',
  },

  // Packages
  packages: {
    title: 'Packages',
    searchPlaceholder: 'Search name',
    createPackage: 'Create package',
    onSale: 'On sale',
    scheduled: 'Scheduled',
    drafts: 'Drafts',
    archive: 'Archive',
    type: 'Type',
    term: 'Term (D)',
    sessions: 'Sessions',
    priceInclVat: 'Price incl. VAT (฿)',
    categories: 'Categories',
    access: 'Access',
    popular: 'Popular',
    unlimited: 'Unlimited',
    session: 'Session',
    pt: 'PT',
    create: {
      title: 'Create package',
      selectType: 'Select package type',
      unlimitedDesc: 'Unlimited access within the term period',
      sessionDesc: 'Fixed number of sessions',
      ptDesc: 'Personal training sessions',
      packageDetails: 'Package details',
      packageName: 'Package name',
      packageNameEn: 'Package name (EN)',
      packageNameTh: 'Package name (TH)',
      price: 'Price',
      priceInclVat: 'Price including VAT',
      termSettings: 'Term',
      packageDuration: 'Package duration',
      daysAfterActivation: 'Days after activation',
      packageExpiration: 'Package expiration',
      daysAfterSale: 'Days after sale date',
      recurringPayment: 'Recurring payment',
      activate: 'Activate',
      quantity: 'Quantity',
      infinite: 'Infinite',
      specificAmount: 'Specific amount',
      userPurchaseLimit: 'User purchase limit',
      accessSettings: 'Access',
      usageType: 'Package usage type',
      classOnly: 'Class only',
      gymCheckinOnly: 'Gym check-in only',
      both: 'Both',
      classCategories: 'Class categories',
      allCategories: 'All class categories',
      specificCategories: 'Specific class categories',
      accessDays: 'Access days and times',
      anyDayAnyTime: 'Any day and any time, during opening hours',
      specificDays: 'Set specific access days and times',
      description: 'Description',
      descriptionEn: 'Package description (EN)',
      descriptionTh: 'Package description (TH)',
      preview: 'Package Preview',
      discard: 'Discard',
      saveAsDraft: 'Save as draft',
      createPackage: 'Create package',
      packageNamePlaceholder: 'Package name',
      descriptionPlaceholder: 'Package description...',
      descriptionThPlaceholder: 'คำอธิบายแพ็คเกจ...',
      completeRequired: 'Please complete all required fields to create this package.',
    },
  },

  // Promotions
  promotions: {
    title: 'Promotions',
    searchPlaceholder: 'Search name',
    createPromotion: 'Create promotion',
    promoCode: 'Promo code',
    discount: 'Discount',
    startedOn: 'Started on',
    endingOn: 'Ending on',
  },

  // Schedule
  schedule: {
    title: 'Schedule',
    scheduleClass: 'Schedule',
    allTrainers: 'All trainers',
    classes: 'Classes',
    personalTraining: 'Personal training classes',
    avgCapacity: 'Average capacity %',
    cancellations: 'Cancellations',
    time: 'Time',
    class: 'Class',
    category: 'Category',
    trainer: 'Trainer',
    room: 'Room',
    availability: 'Availability',
    qr: 'QR',
  },

  // Rooms
  rooms: {
    title: 'Room layouts',
    searchPlaceholder: "Search room's name",
    createRoom: 'Create room',
    open: 'Open',
    closed: 'Closed',
    roomName: "Room's name",
    categoriesAvailability: 'Categories availability',
    maxCapacity: 'Max capacity',
    totalRooms: 'Total {count} rooms',
    layoutType: 'Layout',
    openSpace: 'Open space',
    fixedPositions: 'Fixed positions',
    create: {
      title: 'Create room',
      information: 'Information',
      roomNameEn: 'Room name (EN)',
      roomNameTh: 'Room name (TH)',
      roomNamePlaceholder: 'Enter room name',
      location: 'Location',
      selectLocation: 'Select location',
      access: 'Access',
      categoriesCanUse: 'Class categories that can use this room',
      allCategories: 'All class categories',
      specificCategories: 'Specific class categories',
      roomLayout: 'Room layout',
      openSpaceDesc: 'Open space area',
      fixedPositionsDesc: 'Fixed positions area',
      maxCapacity: 'Maximum capacity',
      maxCapacityPlaceholder: 'Enter maximum capacity',
      helperText: 'Please complete room creation',
      discard: 'Discard',
    },
  },

  // Classes
  classes: {
    title: 'Class list',
    searchPlaceholder: 'Search class',
    createClass: 'Create class or PT',
    allClasses: 'All classes',
    className: 'Class name',
    level: 'Level',
    duration: 'Duration (mins)',
    dateModified: 'Date modified',
  },

  // Categories
  categories: {
    title: 'Class categories',
    searchPlaceholder: 'Search class category',
    classesInCategory: 'Classes in this category',
  },

  // Staff
  staff: {
    title: 'Staff',
    searchPlaceholder: 'Search name or contact number',
    createStaff: 'Create staff',
    terminated: 'Terminated',
    contactNumber: 'Contact number',
  },

  // Roles
  roles: {
    title: 'Roles',
    searchPlaceholder: 'Search role name',
    createRole: 'Create role',
    roleName: 'Role name',
    accessLevel: 'Access level',
    accountsAssigned: 'Accounts assigned',
    levels: {
      master: 'Level 4: Master',
      manager: 'Level 3: Manager',
      operator: 'Level 2: Operator',
      minimum: 'Level 1: Minimum',
    },
  },

  // Locations
  locations: {
    title: 'Locations',
    searchPlaceholder: 'Search location name',
    id: 'ID',
    locationName: 'Location name',
  },

  // Activity Log
  activityLog: {
    title: 'Activity log',
    dateTime: 'Date & time',
    event: 'Event',
    activity: 'Activity',
    staffMember: 'Staff',
  },

  // Announcements
  announcements: {
    title: 'Announcements',
    searchPlaceholder: 'Search message',
    publishing: 'Publishing',
    message: 'Message',
    completed: 'Completed',
  },

  // Workouts
  workouts: {
    title: 'Workout list',
    searchPlaceholder: 'Search training, workout, or description',
    allTraining: 'All training',
    workout: 'Workout',
    trackMetric: 'Track metric',
    unit: 'Unit',
  },

  // Transfer Slips
  transferSlips: {
    title: 'Transfer slips',
    searchPlaceholder: 'Search transaction no. or name',
    needsReview: 'Needs review',
    paid: 'Paid',
    voided: 'Voided',
    transactionNo: 'Transaction no.',
    packageName: 'Package name',
    packageType: 'Package type',
    soldTo: 'Sold to',
    soldAt: 'Sold at',
    amount: 'Amount',
  },

  // Finance
  finance: {
    title: 'Finance',
    searchPlaceholder: 'Search transaction no. or member name...',
    transactions: 'Transactions',
    totalSales: 'Total sales',
    netIncome: 'Net income',
    refundsGiven: 'Refunds given',
    orderName: 'Order name',
    receipt: 'Receipt',
    dateTime: 'Date & time',
    transactionNo: 'Transaction no.',
    soldTo: 'Sold to',
    amount: 'Amount',
  },

  // Reports
  reports: {
    title: 'Reports',
    member: 'Member',
    class: 'Class',
    package: 'Package',
    activeMembersOverTime: 'Active members over time',
    membersAtRisk: 'Members at risk',
    membersPackageUsage: 'Members package usage',
    membersPackageAtRisk: 'Members package at risk',
    classCapacityByHour: 'Class capacity by hour of day',
    classCapacityOverTime: 'Class capacity over time',
    classCategoryPopularity: 'Class category popularity',
    classPopularity: 'Class popularity',
    packageSales: 'Package sales',
    packageSalesOverTime: 'Package sales over time',
    riskLevels: {
      high: 'High risk',
      medium: 'Medium risk',
      low: 'Low risk',
    },
    manage: 'Manage',
    atRiskPackage: 'At-risk package',
    expiresIn: 'Expires In',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    unread: 'unread',
    noUnread: "You don't have unread notifications.",
    types: {
      bookingConfirmed: 'Booking confirmed',
      classCancellation: 'Class cancellation',
      paymentReceived: 'Payment received',
      memberRegistration: 'Member registration',
      packageExpiring: 'Package expiring soon',
    },
  },

  // Settings
  settings: {
    title: 'Settings',
    tabs: {
      general: 'General',
      class: 'Class',
      client: 'Client',
      package: 'Package',
      memberContracts: 'Member contracts',
    },
    general: {
      // Sidebar menu
      payment: 'Payment methods',
      themeColorMenu: 'Theme color',
      timezoneMenu: 'Timezone',
      workoutMenu: 'Workout',
      gymCheckinMenu: 'Gym check-in',
      
      // Payment section
      paymentMethods: 'Payment methods',
      paymentDescription: 'Payment methods can be enabled and disabled depending on your preference.',
      bankTransfer: 'Bank transfer',
      bankTransferDesc: 'Bank account information will be displayed when members make purchases through the Member App.',
      specifyBankAccount: 'Specify bank account',
      creditCard: 'Credit card (Stripe)',
      creditCardDesc: 'Payments via credit card through Stripe. Domestic: 3.65% + ฿10 per transaction. International: 4.75% + ฿10 per transaction.',
      setupStripe: 'Setup Stripe',
      qrPromptPay: 'QR PromptPay',
      qrPromptPayDesc: 'PromptPay payments via QR code through Stripe. Fee: 1.65% + ฿10 per refund.',
      stripeFee: '3.65% + 10 THB domestic, 4.75% + 10 THB international',
      promptPayFee: '1.65% + ฿10 per refund',
      taxInvoice: 'Tax invoice',
      taxInvoiceDesc: 'Company information for tax invoice generation.',
      
      // Theme section
      appearance: 'Appearance',
      themeColor: 'Theme color',
      selectColor: 'Select color',
      defaultColor: 'Default',
      otherColors: 'Other colors',
      
      // Timezone section
      timezone: 'Timezone',
      selectTimezone: 'Select timezone',
      
      // Workout section
      workout: 'Workout',
      workoutList: 'Workout list',
      enableWorkoutLogging: 'Enable workout logging via Gymmo app',
      workoutDesc: 'When using workout list, members can log their exercises through the Gymmo app. To log workout activities, go to: Gymmo app → Profile → My Workout',
      
      // Gym check-in section
      gymCheckin: 'Gym check-in',
      enableGymCheckin: 'Enable gym check-in',
      gymCheckinDesc: 'Allow members to check-in via QR code at the gym entrance.',
      specifyCheckinTime: 'Specify check-in time for members',
      anytime: 'Anytime',
      checkinConfigurations: 'Check-in configurations',
      set: 'Set',
    },
    class: {
      // Sidebar
      booking: 'Class Booking',
      checkin: 'Check-in',
      waitlist: 'Waitlist',
      cancellation: 'Cancellation',
      noshow: 'No-show',
      
      // Booking section
      bookingAdvanceDesc: 'Specify the period of time in advance that members can start booking a class',
      bookingLastDesc: 'Specify the last period of time that members can book a class in advance',
      maxSpotsDesc: 'Specify the maximum number of spots a member can book per class',
      daysBeforeClass: '{n} days before class begins',
      minsBeforeClass: '{n} mins before class begins',
      hoursBeforeClass: '{n} hour before class begins',
      minsAfterClass: '{n} mins after class begins',
      seatsOnly: '{n} seat only',
      
      // Check-in section
      checkinBeforeDesc: 'Specify the period of time members can check-in with QR code before class starts',
      checkinAfterDesc: 'Specify the latest time members can check-in with QR code after class starts',
      
      // Waitlist section
      waitlistCapacityDesc: 'Default capacity for waitlist',
      sameAsRoomCapacity: 'Same as selected room capacity',
      waitlistPromoteDesc: 'Latest time members can be automatically promoted from waitlist to available booking',
      
      // Cancellation section
      cancellationPenaltyDesc: 'Time period when penalty will apply for booking cancellations',
      lateCancelDeadlineDesc: 'Latest time members can cancel a booking before penalty period applies',
      unlimitedCancelTitle: 'Cancellation for unlimited package bookings',
      unlimitedCancelDesc: 'Maximum number of late cancellations for unlimited package bookings before automatic suspension',
      sessionCancelTitle: 'Cancellation for session package bookings',
      sessionCancelDesc: 'Maximum number of late cancellations for session package bookings before automatic suspension',
      sessionRefundDesc: 'Session refund for late cancellations on session package bookings',
      none: 'None',
      noRefund: 'No session refund',
      
      // No-show section
      noshowPenaltyTitle: 'Penalty for no-show with unlimited package',
      noshowPenaltyDesc: 'Maximum no-shows for unlimited package bookings before automatic suspension',
      noshowLimit: '{n} times in {days} days, auto-suspend for {suspend} days',
    },
    client: {
      // Sidebar
      injuredMembers: 'Injured Members',
      suspendedMembers: 'Suspended Members',
      pausedMembers: 'Paused Members',
      
      // Injured section
      injuredDesc: 'Configure whether injured members are allowed to book classes',
      allowAllInjured: 'Allow all bookings for injured members',
      bookOnGymmoApp: 'Book on Gymmo mobile app',
      bookOnGymmoAppDesc: 'Injured members can book classes on Gymmo mobile app',
      bookOnGymmoConsole: 'Book on Gymmo Console',
      bookOnGymmoConsoleDesc: 'Allow staff to book classes for injured members on Gymmo Console',
      
      // Suspended section
      suspendedDesc: 'Configure whether suspended members are allowed to book classes',
      allowAllSuspended: 'Allow all bookings for suspended members',
      suspendedBookOnAppDesc: 'Suspended members can book classes on Gymmo mobile app',
      suspendedBookOnConsoleDesc: 'Allow staff to book classes for suspended members on Gymmo Console',
      
      // Paused section
      pausedDesc: 'Configure whether members can reactivate paused packages',
      allowReactivate: 'Members can reactivate paused packages on Gymmo mobile app',
      pausedReactivateDesc: 'Members can reactivate paused packages on Gymmo mobile app without contacting the gym. Once reactivated, members can continue booking classes.',
    },
    package: {
      expirationTitle: 'Expiration Date',
      expirationDesc: 'Set the conditions for package activation to start the expiration countdown',
      whenBooking: 'When booking a class',
    },
    memberContracts: {
      title: 'Member Contracts',
      description: 'Member contracts can be enabled for members to sign via the app, or disabled based on your settings.',
      allowSigning: 'Allow members to sign contracts via the member application',
      signingDescription: 'When enabled, members will be notified to sign contracts via the member application.',
      setupContracts: 'Setup Member Contracts',
    },
  },

  // User Profile
  profile: {
    title: 'Profile',
    editProfile: 'Edit profile',
    logout: 'Logout',
    accountInfo: 'Account information',
    profileUpdated: 'Profile updated successfully',
    emailCannotChange: 'Email cannot be changed',
  },

  // Date/Time
  dateTime: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    pickDate: 'Pick a date',
    pickDateRange: 'Pick a date range',
  },

  // Time relative
  time: {
    justNow: 'just now',
    minutesAgo: '{n}m ago',
    hoursAgo: '{n}h ago',
    daysAgo: '{n}d ago',
  },

  // Validation
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    passwordMinLength: 'Password must be at least {n} characters',
    passwordUppercase: 'Password must contain at least one uppercase letter',
    passwordLowercase: 'Password must contain at least one lowercase letter',
    passwordNumber: 'Password must contain at least one number',
    passwordSpecial: 'Password must contain at least one special character',
    passwordsNotMatch: 'Passwords do not match',
    confirmPassword: 'Please confirm your password',
  },

  // Auth
  auth: {
    login: 'Login',
    signUp: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    forgotPasswordTitle: 'Forgot password',
    forgotPasswordDescription: 'Enter your email and we\'ll send you a reset link',
    sendResetLink: 'Send reset link',
    backToLogin: 'Back to login',
    resetEmailSent: 'Reset email sent! Check your inbox.',
    checkEmailForReset: 'We sent a password reset link to your email. Please check your inbox and follow the instructions.',
    loginDescription: 'Sign in to your account to continue',
    signupDescription: 'Create an account to get started',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginFailed: 'Login failed',
    signupFailed: 'Sign up failed',
    loginSuccess: 'Welcome back!',
    welcomeBack: 'You have been logged in successfully.',
    signupSuccess: 'Account created!',
    checkEmail: 'Please check your email to verify your account.',
  },

  // Members form fields
  form: {
    nickname: 'Nickname',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    address: 'Address',
    selectGender: 'Select gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    requiredFieldsNote: '* Required fields',
  },

  // Dashboard
  dashboardExtra: {
    attendees: 'attendees',
    mainLocation: 'MOOM CLUB Main',
  },

  // Error pages
  errors: {
    pageNotFound: 'Page not found',
    pageNotFoundDescription: 'Oops! The page you\'re looking for doesn\'t exist.',
    returnHome: 'Return to home',
  },

  // Reports
  reportsExtra: {
    comingSoon: 'Coming soon',
    comingSoonDescription: 'This report is under development',
  },
};
