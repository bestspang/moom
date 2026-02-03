export default {
  // Common
  common: {
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    create: 'สร้าง',
    search: 'ค้นหา',
    filter: 'กรอง',
    export: 'ส่งออก CSV',
    loading: 'กำลังโหลด...',
    noData: 'ไม่มีข้อมูล',
    actions: 'การดำเนินการ',
    status: 'สถานะ',
    all: 'ทั้งหมด',
    active: 'ใช้งาน',
    inactive: 'ไม่ใช้งาน',
    pending: 'รอดำเนินการ',
    updated: 'อัปเดตล่าสุด',
    viewAll: 'ดูทั้งหมด',
    goTo: 'ไปที่',
    back: 'กลับ',
    next: 'ถัดไป',
    previous: 'ก่อนหน้า',
    support: 'ติดต่อ',
    version: 'เวอร์ชัน',
    termsAndConditions: 'ข้อกำหนดและเงื่อนไข',
    privacyPolicy: 'นโยบายความเป็นส่วนตัว',
    success: 'สำเร็จ',
    error: 'ผิดพลาด',
    thb: 'บาท',
  },

  // Navigation
  nav: {
    dashboard: 'แดชบอร์ด',
    lobby: 'ล็อบบี้',
    class: 'คลาส',
    schedule: 'ตารางเรียน',
    roomLayouts: 'ผังห้อง',
    classList: 'รายการคลาส',
    classCategories: 'หมวดหมู่คลาส',
    client: 'ลูกค้า',
    members: 'สมาชิก',
    leads: 'ลีด',
    package: 'แพ็คเกจ',
    packages: 'แพ็คเกจ',
    promotions: 'โปรโมชัน',
    yourGym: 'ยิมของคุณ',
    staff: 'พนักงาน',
    roles: 'บทบาท',
    locations: 'สาขา',
    activityLog: 'บันทึกกิจกรรม',
    announcements: 'ประกาศ',
    workoutList: 'รายการออกกำลังกาย',
    finance: 'การเงิน',
    transferSlips: 'สลิปโอนเงิน',
    reports: 'รายงาน',
    settings: 'ตั้งค่า',
    notifications: 'การแจ้งเตือน',
    comingSoon: 'เร็วๆ นี้',
  },

  // Roadmap
  roadmap: {
    title: 'แผนพัฒนา',
    comingSoon: 'เร็วๆ นี้',
    inProgress: 'กำลังพัฒนา',
    completed: 'เสร็จสิ้น',
    planned: 'วางแผนไว้',
    preview: 'ดูตัวอย่าง',
    heroSubtitle: 'สร้างอนาคตของการจัดการยิม',
    currentlyBuilding: 'กำลังพัฒนา',
    footerNote: 'แผนพัฒนาอาจเปลี่ยนแปลงตามความคิดเห็นของผู้ใช้และลำดับความสำคัญ',

    // Versions
    v001: {
      title: 'Console Foundation',
      description: '24+ หน้าจัดการครบถ้วน CRUD, RBAC และ i18n',
    },
    v002: {
      title: 'LINE Shell + Mobile MVP',
      description: 'LIFF login, แอปสมาชิก/เทรนเนอร์, การแจ้งเตือน LINE',
    },
    v003: {
      title: 'Payments & Check-in',
      description: 'PromptPay, QR check-in, usage ledger, anti-fraud',
    },
    v010: {
      title: 'Retention Engine',
      description: 'ระบบอัตโนมัติสำหรับกลุ่มเสี่ยง, แคมเปญ LINE, CRM timeline',
    },

    // Console
    console: {
      title: 'Admin Console',
      description: 'แดชบอร์ดจัดการครบทุกฟังก์ชัน',
      features: {
        dashboard: 'แดชบอร์ดสถิติแบบ real-time',
        members: 'จัดการสมาชิกและโปรไฟล์',
        packages: 'จัดการแพ็กเกจและโปรโมชัน',
        schedule: 'ตารางคลาสและห้อง',
        finance: 'การเงินและธุรกรรม',
        reports: 'รายงานและการวิเคราะห์',
      },
    },

    // Member App
    memberApp: {
      title: 'แอปสมาชิก',
      description: 'แอปมือถือสำหรับสมาชิกผ่าน LINE',
      fullDescription: 'แอปพลิเคชัน LIFF ที่ออกแบบมาเพื่อให้สมาชิกจองคลาส ดูแพ็กเกจ เช็คอินด้วย QR Code ชำระเงิน และเซ็นสัญญา - ทั้งหมดภายใน LINE',
      keyFeatures: 'ฟีเจอร์หลัก',
      lineNote: 'แอปนี้จะเข้าถึงได้ผ่าน Rich Menu ของ LINE Official Account',
      comingSoonText: 'แอปสมาชิกกำลังอยู่ในระหว่างการพัฒนา รอติดตามนะ!',
      features: {
        booking: 'จองคลาส / ยกเลิกการจอง',
        packages: 'ดูแพ็กเกจของฉัน',
        qrCheckin: 'เช็คอินด้วย QR Code',
        payments: 'ชำระเงิน / อัปโหลดสลิป',
        contracts: 'เซ็นสัญญาออนไลน์',
      },
      menu: {
        schedule: 'ตารางคลาส',
        scheduleDesc: 'ดูและจองคลาส',
        packages: 'แพ็กเกจของฉัน',
        packagesDesc: 'เซสชันที่เหลือ',
        checkin: 'เช็คอิน',
        checkinDesc: 'QR Code สำหรับเช็คอิน',
        payments: 'การชำระเงิน',
        paymentsDesc: 'ชำระหรืออัปโหลดสลิป',
        contracts: 'สัญญา',
        contractsDesc: 'ดูและเซ็นสัญญา',
      },
      nav: {
        home: 'หน้าแรก',
        book: 'จอง',
        checkin: 'เช็คอิน',
        notifications: 'แจ้งเตือน',
        profile: 'โปรไฟล์',
      },
      mockup: {
        welcome: 'ยินดีต้อนรับกลับ!',
      },
    },

    // Trainer App
    trainerApp: {
      title: 'แอปเทรนเนอร์',
      description: 'แอปมือถือสำหรับเทรนเนอร์ผ่าน LINE',
      fullDescription: 'แอปพลิเคชัน LIFF ที่ออกแบบมาเพื่อให้เทรนเนอร์จัดการตารางประจำวัน เช็คชื่อ บันทึก PT session และดูข้อมูลสมาชิกได้อย่างรวดเร็ว',
      keyFeatures: 'ฟีเจอร์หลัก',
      lineNote: 'แอปนี้จะเข้าถึงได้ผ่าน Rich Menu ของ LINE Official Account สำหรับเทรนเนอร์',
      comingSoonText: 'แอปเทรนเนอร์กำลังอยู่ในระหว่างการพัฒนา รอติดตามนะ!',
      designPrinciple: 'หลักการออกแบบ',
      designPrincipleDesc: 'ทุก action ต้องทำได้โดยไม่ต้องพิมพ์มาก ใช้ตัวเลือกที่เตรียมไว้และ quick actions เป็นหลัก',
      features: {
        todaySchedule: 'ตารางคลาสวันนี้',
        attendance: 'เช็คชื่อผู้เข้าเรียน',
        ptLog: 'บันทึก PT session',
        memberView: 'ดูข้อมูลสมาชิกแบบด่วน',
        noShow: 'รายงานผู้ไม่มาเรียน',
      },
      menu: {
        todaySchedule: 'ตารางวันนี้',
        todayScheduleDesc: 'คลาสที่คุณสอนวันนี้',
        attendance: 'เช็คชื่อ',
        attendanceDesc: 'เช็คอินสมาชิก',
        ptLog: 'บันทึก PT',
        ptLogDesc: 'บันทึก PT session',
        memberView: 'ค้นหาสมาชิก',
        memberViewDesc: 'ข้อมูลสมาชิกแบบด่วน',
        incidents: 'รายงานปัญหา',
        incidentsDesc: 'รายงานเหตุการณ์',
      },
      nav: {
        home: 'หน้าแรก',
        schedule: 'ตาราง',
        checkin: 'เช็คอิน',
        alerts: 'แจ้งเตือน',
        profile: 'โปรไฟล์',
      },
      mockup: {
        title: 'Trainer Portal',
        welcome: 'สวัสดีตอนเช้า เทรนเนอร์!',
        todayClasses: '5 คลาสวันนี้',
        classes: 'คลาส',
        members: 'สมาชิก',
        pt: 'PT',
      },
    },

    // Notifications
    notifications: {
      title: 'การแจ้งเตือน',
      description: 'ระบบแจ้งเตือนผ่าน LINE และ In-app',
      features: {
        bookingConfirm: 'แจ้งเตือนการจองสำเร็จ',
        classReminder: 'เตือนก่อนคลาสเริ่ม',
        packageExpiry: 'แจ้งเตือนแพ็กเกจใกล้หมด',
        promotions: 'ข่าวสารและโปรโมชัน',
      },
    },

    // Payments (v0.0.3)
    payments: {
      title: 'Smart Payments',
      description: 'ระบบชำระเงินแบบบูรณาการ',
      features: {
        promptpay: 'PromptPay / โอนเงิน',
        slipUpload: 'อัปโหลดสลิปและตรวจสอบ',
        autoVerify: 'ตรวจสอบอัตโนมัติ',
        receipts: 'ใบเสร็จดิจิทัล',
      },
    },

    // QR Check-in (v0.0.3)
    qrCheckin: {
      title: 'QR Check-in',
      description: 'ระบบเช็คอิน QR Code ที่ปลอดภัย',
      features: {
        dynamicQr: 'QR Code แบบ dynamic',
        antiFraud: 'ป้องกันการโกง',
        usageLedger: 'ติดตามการใช้งาน',
        realtime: 'ตรวจสอบแบบ real-time',
      },
    },

    // Security (v0.0.3)
    security: {
      title: 'ความปลอดภัยและการปฏิบัติตามกฎหมาย',
      description: 'ปฏิบัติตาม PDPA และปกป้องข้อมูล',
      features: {
        pdpa: 'ปฏิบัติตาม PDPA',
        consent: 'จัดการความยินยอม',
        dataRetention: 'นโยบายการเก็บข้อมูล',
        auditLog: 'บันทึก audit ครบถ้วน',
      },
    },

    // Retention (v0.1.0)
    retention: {
      title: 'Retention Engine',
      description: 'ระบบรักษาสมาชิกอัตโนมัติ',
      features: {
        riskAlert: 'แจ้งเตือนสมาชิกกลุ่มเสี่ยง',
        oneClick: 'ติดต่อด้วยคลิกเดียว',
        autoMessage: 'ข้อความอัตโนมัติ',
        winback: 'แคมเปญดึงลูกค้ากลับ',
      },
    },

    // Campaigns (v0.1.0)
    campaigns: {
      title: 'LINE Campaigns',
      description: 'แคมเปญการตลาดผ่าน LINE',
      features: {
        birthday: 'ข้อความวันเกิด',
        renewal: 'เตือนต่ออายุ',
        promo: 'แคมเปญโปรโมชัน',
        targeting: 'การกำหนดเป้าหมายอัจฉริยะ',
      },
    },

    // CRM (v0.1.0)
    crm: {
      title: 'CRM Timeline',
      description: 'ติดตามเส้นทางของสมาชิกครบวงจร',
      features: {
        timeline: 'ไทม์ไลน์กิจกรรม',
        interactions: 'ประวัติการติดต่อ',
        notes: 'บันทึกจากพนักงาน',
        insights: 'ข้อมูลเชิงลึกของสมาชิก',
      },
    },
  },

  // Dashboard
  dashboard: {
    title: 'แดชบอร์ด',
    allCheckinsToday: 'เช็คอินทั้งหมดวันนี้',
    currentlyInClass: 'กำลังเรียนอยู่',
    classesScheduledToday: 'คลาสที่จัดไว้วันนี้',
    goToSchedule: 'ไปที่ตารางเรียน',
    todaySchedule: 'ตารางวันนี้',
    classes: 'คลาส',
    gymCheckin: 'เช็คอินยิม',
    highRiskMembers: 'สมาชิกเสี่ยงสูง',
    hotLeads: 'ลีดร้อน',
    upcomingBirthdays: 'วันเกิดที่จะมาถึง',
    comparedToYesterday: 'เทียบกับเมื่อวาน',
  },

  // Lobby
  lobby: {
    title: 'ล็อบบี้',
    checkIn: 'เช็คอิน',
    searchName: 'ค้นหาชื่อ',
    time: 'เวลา',
    name: 'ชื่อ',
    packageUsed: 'แพ็คเกจที่ใช้',
    usage: 'การใช้งาน',
    location: 'สาขา',
    checkedIn: 'เช็คอินแล้ว',
  },

  // Members
  members: {
    title: 'สมาชิก',
    searchPlaceholder: 'ค้นหา ID, ชื่อ, ชื่อเล่น หรือเบอร์โทร...',
    createMember: 'สร้างสมาชิก',
    suspended: 'ระงับ',
    onHold: 'พักไว้',
    memberDetails: 'รายละเอียดสมาชิก',
    memberSince: 'เป็นสมาชิกตั้งแต่',
    daysUntilAnniversary: 'วันจนถึงครบรอบ 1 ปี',
    mostAttendedCategory: 'หมวดหมู่ที่เข้าร่วมมากที่สุด',
    amountSpent: 'ยอดใช้จ่ายตั้งแต่เข้าร่วม',
    daysUntilExpiry: 'วันจนกว่าแพ็คเกจหมดอายุ',
    memberCreated: 'สร้างสมาชิกสำเร็จ',
    memberUpdated: 'อัปเดตสมาชิกสำเร็จ',
    editMember: 'แก้ไขสมาชิก',
    tabs: {
      home: 'หน้าแรก',
      profile: 'โปรไฟล์',
      attendance: 'การเข้าร่วม',
      packages: 'แพ็คเกจ',
      billing: 'การเรียกเก็บเงิน',
      injuries: 'การบาดเจ็บ',
      notes: 'บันทึก',
      suspensions: 'การระงับ',
      contract: 'สัญญา',
    },
    accountDetails: 'รายละเอียดบัญชี',
    purchasePackage: 'ซื้อแพ็คเกจสำหรับสมาชิกนี้',
    addBilling: 'เพิ่มการเรียกเก็บเงิน',
    frontDeskNotes: 'บันทึกจากพนักงานต้อนรับ',
  },

  // Leads
  leads: {
    title: 'ลีด',
    searchPlaceholder: 'ค้นหาชื่อหรือเบอร์โทร',
    createLead: 'สร้างลีด',
    contactNumber: 'เบอร์โทรศัพท์',
    email: 'อีเมล',
    timesContacted: 'จำนวนครั้งที่ติดต่อ',
    lastContacted: 'ติดต่อล่าสุด',
    lastAttended: 'เข้าร่วมล่าสุด',
  },

  // Packages
  packages: {
    title: 'แพ็คเกจ',
    searchPlaceholder: 'ค้นหาชื่อ',
    createPackage: 'สร้างแพ็คเกจ',
    onSale: 'กำลังขาย',
    scheduled: 'กำหนดการ',
    drafts: 'แบบร่าง',
    archive: 'เก็บถาวร',
    type: 'ประเภท',
    term: 'ระยะเวลา (วัน)',
    sessions: 'เซสชัน',
    priceInclVat: 'ราคารวม VAT (฿)',
    categories: 'หมวดหมู่',
    access: 'การเข้าถึง',
    popular: 'ยอดนิยม',
    unlimited: 'ไม่จำกัด',
    session: 'เซสชัน',
    pt: 'PT',
    create: {
      title: 'สร้างแพ็คเกจ',
      selectType: 'เลือกประเภทแพ็คเกจ',
      unlimitedDesc: 'เข้าใช้บริการได้ไม่จำกัดภายในระยะเวลาที่กำหนด',
      sessionDesc: 'จำนวนเซสชันที่กำหนดไว้',
      ptDesc: 'เซสชันการฝึกส่วนบุคคล',
      packageDetails: 'รายละเอียดแพ็คเกจ',
      packageName: 'ชื่อแพ็คเกจ',
      packageNameEn: 'ชื่อแพ็คเกจ (EN)',
      packageNameTh: 'ชื่อแพ็คเกจ (TH)',
      price: 'ราคา',
      priceInclVat: 'ราคารวม VAT',
      termSettings: 'ระยะเวลา',
      packageDuration: 'ระยะเวลาแพ็คเกจ',
      daysAfterActivation: 'วันหลังจากเปิดใช้งาน',
      packageExpiration: 'วันหมดอายุแพ็คเกจ',
      daysAfterSale: 'วันหลังจากวันที่ขาย',
      recurringPayment: 'การชำระเงินซ้ำ',
      activate: 'เปิดใช้งาน',
      quantity: 'จำนวน',
      infinite: 'ไม่จำกัด',
      specificAmount: 'จำนวนเฉพาะ',
      userPurchaseLimit: 'จำกัดการซื้อต่อผู้ใช้',
      accessSettings: 'การเข้าถึง',
      usageType: 'ประเภทการใช้งานแพ็คเกจ',
      classOnly: 'คลาสเท่านั้น',
      gymCheckinOnly: 'เช็คอินยิมเท่านั้น',
      both: 'ทั้งสอง',
      classCategories: 'หมวดหมู่คลาส',
      allCategories: 'หมวดหมู่คลาสทั้งหมด',
      specificCategories: 'หมวดหมู่คลาสเฉพาะ',
      accessDays: 'วันและเวลาเข้าใช้บริการ',
      anyDayAnyTime: 'วันใดก็ได้และเวลาใดก็ได้ ในช่วงเวลาเปิดทำการ',
      specificDays: 'กำหนดวันและเวลาเข้าใช้บริการเฉพาะ',
      description: 'คำอธิบาย',
      descriptionEn: 'คำอธิบายแพ็คเกจ (EN)',
      descriptionTh: 'คำอธิบายแพ็คเกจ (TH)',
      preview: 'ตัวอย่างแพ็คเกจ',
      discard: 'ยกเลิก',
      saveAsDraft: 'บันทึกเป็นแบบร่าง',
      createPackage: 'สร้างแพ็คเกจ',
      packageNamePlaceholder: 'ชื่อแพ็คเกจ',
      descriptionPlaceholder: 'คำอธิบายแพ็คเกจ...',
      descriptionThPlaceholder: 'คำอธิบายแพ็คเกจ...',
      completeRequired: 'กรุณากรอกข้อมูลที่จำเป็นทั้งหมดเพื่อสร้างแพ็คเกจ',
    },
  },

  // Promotions
  promotions: {
    title: 'โปรโมชัน',
    searchPlaceholder: 'ค้นหาชื่อ',
    createPromotion: 'สร้างโปรโมชัน',
    promoCode: 'รหัสโปรโม',
    discount: 'ส่วนลด',
    startedOn: 'เริ่มเมื่อ',
    endingOn: 'สิ้นสุดเมื่อ',
  },

  // Schedule
  schedule: {
    title: 'ตารางเรียน',
    scheduleClass: 'จัดตาราง',
    allTrainers: 'เทรนเนอร์ทั้งหมด',
    classes: 'คลาส',
    personalTraining: 'คลาสฝึกส่วนบุคคล',
    avgCapacity: 'ความจุเฉลี่ย %',
    cancellations: 'การยกเลิก',
    time: 'เวลา',
    class: 'คลาส',
    category: 'หมวดหมู่',
    trainer: 'เทรนเนอร์',
    room: 'ห้อง',
    availability: 'ที่ว่าง',
    qr: 'QR',
  },

  // Rooms
  rooms: {
    title: 'ผังห้อง',
    searchPlaceholder: 'ค้นหาชื่อห้อง',
    createRoom: 'สร้างห้อง',
    open: 'เปิด',
    closed: 'ปิด',
    roomName: 'ชื่อห้อง',
    categoriesAvailability: 'หมวดหมู่ที่เปิดให้บริการ',
    maxCapacity: 'ความจุสูงสุด',
    totalRooms: 'ทั้งหมด {count} ห้อง',
    layoutType: 'รูปแบบ',
    openSpace: 'เปิดโล่ง',
    fixedPositions: 'ตำแหน่งคงที่',
    create: {
      title: 'สร้างห้อง',
      information: 'ข้อมูล',
      roomNameEn: 'ชื่อห้อง (EN)',
      roomNameTh: 'ชื่อห้อง (TH)',
      roomNamePlaceholder: 'ระบุชื่อห้อง',
      location: 'สาขา',
      selectLocation: 'เลือกสาขา',
      access: 'สิทธิ์เข้าถึง',
      categoriesCanUse: 'หมวดหมู่คลาสที่ใช้งานห้องนี้ได้',
      allCategories: 'ทุกหมวดหมู่คลาส',
      specificCategories: 'ระบุหมวดหมู่คลาส',
      roomLayout: 'รูปแบบห้อง',
      openSpaceDesc: 'พื้นที่แบบเปิดโล่ง',
      fixedPositionsDesc: 'พื้นที่แบบตำแหน่งคงที่',
      maxCapacity: 'ความจุสูงสุด',
      maxCapacityPlaceholder: 'ระบุความจุสูงสุด',
      helperText: 'โปรดดำเนินการสร้างห้อง',
      discard: 'ละทิ้ง',
    },
  },

  // Classes
  classes: {
    title: 'รายการคลาส',
    searchPlaceholder: 'ค้นหาคลาส',
    createClass: 'สร้างคลาสหรือ PT',
    allClasses: 'คลาสทั้งหมด',
    className: 'ชื่อคลาส',
    level: 'ระดับ',
    duration: 'ระยะเวลา (นาที)',
    dateModified: 'วันที่แก้ไข',
  },

  // Categories
  categories: {
    title: 'หมวดหมู่คลาส',
    searchPlaceholder: 'ค้นหาหมวดหมู่คลาส',
    classesInCategory: 'คลาสในหมวดหมู่นี้',
  },

  // Staff
  staff: {
    title: 'พนักงาน',
    searchPlaceholder: 'ค้นหาชื่อหรือเบอร์โทร',
    createStaff: 'สร้างพนักงาน',
    terminated: 'สิ้นสุดการจ้าง',
    contactNumber: 'เบอร์โทรศัพท์',
  },

  // Roles
  roles: {
    title: 'บทบาท',
    searchPlaceholder: 'ค้นหาชื่อบทบาท',
    createRole: 'สร้างบทบาท',
    roleName: 'ชื่อบทบาท',
    accessLevel: 'ระดับการเข้าถึง',
    accountsAssigned: 'บัญชีที่กำหนด',
    levels: {
      master: 'ระดับ 4: มาสเตอร์',
      manager: 'ระดับ 3: ผู้จัดการ',
      operator: 'ระดับ 2: ผู้ปฏิบัติการ',
      minimum: 'ระดับ 1: ขั้นต่ำ',
    },
  },

  // Locations
  locations: {
    title: 'สาขา',
    searchPlaceholder: 'ค้นหาชื่อสาขา',
    id: 'รหัส',
    locationName: 'ชื่อสาขา',
  },

  // Activity Log
  activityLog: {
    title: 'บันทึกกิจกรรม',
    dateTime: 'วันที่และเวลา',
    event: 'เหตุการณ์',
    activity: 'กิจกรรม',
    staffMember: 'พนักงาน',
  },

  // Announcements
  announcements: {
    title: 'ประกาศ',
    searchPlaceholder: 'ค้นหาข้อความ',
    publishing: 'เผยแพร่',
    message: 'ข้อความ',
    completed: 'เสร็จสิ้น',
  },

  // Workouts
  workouts: {
    title: 'รายการออกกำลังกาย',
    searchPlaceholder: 'ค้นหาการฝึก, ออกกำลังกาย, หรือคำอธิบาย',
    allTraining: 'การฝึกทั้งหมด',
    workout: 'ออกกำลังกาย',
    trackMetric: 'ตัวชี้วัด',
    unit: 'หน่วย',
  },

  // Transfer Slips
  transferSlips: {
    title: 'สลิปโอนเงิน',
    searchPlaceholder: 'ค้นหาเลขที่รายการหรือชื่อ',
    needsReview: 'รอตรวจสอบ',
    paid: 'ชำระแล้ว',
    voided: 'ยกเลิก',
    transactionNo: 'เลขที่รายการ',
    packageName: 'ชื่อแพ็คเกจ',
    packageType: 'ประเภทแพ็คเกจ',
    soldTo: 'ขายให้',
    soldAt: 'ขายที่',
    amount: 'จำนวนเงิน',
  },

  // Finance
  finance: {
    title: 'การเงิน',
    searchPlaceholder: 'ค้นหาเลขที่รายการหรือชื่อสมาชิก...',
    transactions: 'รายการธุรกรรม',
    totalSales: 'ยอดขายรวม',
    netIncome: 'รายได้สุทธิ',
    refundsGiven: 'คืนเงิน',
    orderName: 'ชื่อคำสั่งซื้อ',
    receipt: 'ใบเสร็จ',
    dateTime: 'วันที่และเวลา',
    transactionNo: 'เลขที่รายการ',
    soldTo: 'ขายให้',
    amount: 'จำนวนเงิน',
  },

  // Reports
  reports: {
    title: 'รายงาน',
    member: 'สมาชิก',
    class: 'คลาส',
    package: 'แพ็คเกจ',
    activeMembersOverTime: 'สมาชิกที่ใช้งานตามเวลา',
    membersAtRisk: 'สมาชิกกลุ่มเสี่ยง',
    membersPackageUsage: 'การใช้แพ็คเกจ',
    membersPackageAtRisk: 'แพ็คเกจกลุ่มเสี่ยง',
    classCapacityByHour: 'ความจุคลาสตามชั่วโมง',
    classCapacityOverTime: 'ความจุคลาสตามเวลา',
    classCategoryPopularity: 'ความนิยมหมวดหมู่',
    classPopularity: 'ความนิยมคลาส',
    packageSales: 'ยอดขายแพ็คเกจ',
    packageSalesOverTime: 'ยอดขายแพ็คเกจตามเวลา',
    riskLevels: {
      high: 'เสี่ยงสูง',
      medium: 'เสี่ยงปานกลาง',
      low: 'เสี่ยงต่ำ',
    },
    manage: 'จัดการ',
    atRiskPackage: 'แพ็คเกจที่มีความเสี่ยง',
    expiresIn: 'หมดอายุใน',
    riskLevel: 'ระดับความเสี่ยง',
    // New report titles
    activeMembersTitle: 'สมาชิกที่ใช้งาน',
    activeMembersDesc: 'ดูแนวโน้มการใช้งานของสมาชิกตลอดช่วงเวลา',
    membersAtRiskDesc: 'สมาชิกที่เสี่ยงจากจำนวนครั้งคงเหลือและวันหมดอายุแพ็คเกจ',
    packageUsageDesc: 'ภาพรวมการใช้แพ็คเกจในช่วงเวลาที่เลือก',
    packageAtRiskDesc: 'แพ็คเกจที่เสี่ยงจากจำนวนครั้งคงเหลือและวันหมดอายุ',
    classCapacityByHourTitle: 'ความจุตามชั่วโมง',
    classCapacityByHourDesc: 'วิเคราะห์การกระจายความจุคลาสตลอดทั้งวัน',
    classCapacityTitle: 'ความจุตามช่วงเวลา',
    classCapacityDesc: 'ดูแนวโน้มความจุคลาสตลอดช่วงเวลา',
    classCategoryPopularityDesc: 'จัดอันดับหมวดหมู่ตามความจุคลาส',
    classPopularityDesc: 'จัดอันดับคลาสตามจำนวนผู้เข้าร่วมและความจุ',
    packageSalesTitle: 'ยอดขายแพ็คเกจ',
    packageSalesDesc: 'เปรียบเทียบยอดขายตามจำนวนและรายได้',
    packageSalesOverTimeTitle: 'แนวโน้มยอดขาย',
    packageSalesOverTimeDesc: 'ดูแนวโน้มยอดขายแพ็คเกจตลอดช่วงเวลา',
    // Buttons
    viewFullReport: 'ดูรายงานฉบับเต็ม',
    exportReport: 'ส่งออกรายงาน',
    exportCSV: 'ส่งออก CSV',
    exportPDF: 'ส่งออก PDF',
    print: 'พิมพ์',
    // Filters
    dateRange: 'วันที่',
    trainer: 'เทรนเนอร์',
    allTrainers: 'เทรนเนอร์ทั้งหมด',
    allLocations: 'สาขาทั้งหมด',
    allPackages: 'แพ็กเกจทั้งหมด',
    allTypes: 'ประเภทแพ็กเกจทั้งหมด',
    allCategories: 'หมวดหมู่ทั้งหมด',
    age: 'อายุ',
    allAges: 'ทุกอายุ',
    gender: 'เพศ',
    allGenders: 'ทุกเพศ',
    // Stats
    mostActiveDay: 'สมาชิกที่มีการใช้งานมากที่สุดในหนึ่งวัน',
    leastActiveDay: 'สมาชิกที่มีการใช้งานน้อยที่สุดในหนึ่งวัน',
    avgActivePerDay: 'จำนวนสมาชิกที่มีการใช้งานโดยเฉลี่ยต่อวัน',
    newActivePerDay: 'จำนวนสมาชิกใหม่ที่มีการใช้งานโดยเฉลี่ยต่อวัน',
    avgCapacity: 'ความจุของคลาสโดยเฉลี่ย',
    classesWithBookings: 'คลาสที่มีการจอง',
    avgClassesPerDay: 'จำนวนคลาสโดยเฉลี่ยต่อวัน',
    peakCapacityTime: 'วันและเวลาที่มีความจุคลาสสูงสุด',
    totalPackagesSold: 'จำนวนรวมของแพ็กเกจที่ขายได้',
    avgPackagesPerDay: 'ยอดขายแพ็กเกจโดยเฉลี่ยต่อวัน',
    revenue: 'รายได้',
    avgRevenuePerDay: 'รายได้เฉลี่ยต่อวัน',
    maxUnitsSold: 'จำนวนหน่วยสูงสุดที่ขายได้จากแพ็กเกจ',
    minUnitsSold: 'จำนวนหน่วยต่ำสุดที่ขายได้จากแพ็กเกจ',
    maxRevenue: 'รายได้สูงสุดที่เกิดจากการขายแพ็กเกจ',
    minRevenue: 'รายได้ต่ำสุดที่เกิดจากการขายแพ็กเกจ',
    highRiskInfo: '≤30 วันที่เหลือ หรือ ≤33% การใช้งาน และ ≤3 เซสชัน',
    mediumRiskInfo: '≤60 วันที่เหลือ หรือ ≤60% การใช้งาน และ ≤15 เซสชัน',
    lowRiskInfo: '>60 วัน และ >60% การใช้งาน และ >15 เซสชัน',
    // Table columns
    date: 'วันที่',
    activeMembers: 'จำนวนสมาชิกที่มีการใช้งานอยู่',
    classesBooked: 'คลาสที่มีการจองเวลาไว้',
    unitsSold: 'จำนวนหน่วยที่ขายแล้ว',
    // Time period toggle
    day: 'วัน',
    week: 'สัปดาห์',
    month: 'เดือน',
    year: 'ปี',
    // Updated timestamp
    updatedAt: 'อัปเดตเมื่อ',
    // Heatmap
    lessCapacity: 'น้อย',
    moreCapacity: 'มาก',
  },

  // Notifications
  notifications: {
    title: 'การแจ้งเตือน',
    unread: 'ยังไม่ได้อ่าน',
    noUnread: 'คุณไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน',
    types: {
      bookingConfirmed: 'ยืนยันการจอง',
      classCancellation: 'ยกเลิกคลาส',
      paymentReceived: 'ได้รับการชำระเงิน',
      memberRegistration: 'สมัครสมาชิก',
      packageExpiring: 'แพ็คเกจใกล้หมดอายุ',
    },
  },

  // Settings
  settings: {
    title: 'ตั้งค่า',
    tabs: {
      general: 'ทั่วไป',
      class: 'คลาส',
      client: 'ลูกค้า',
      package: 'แพ็คเกจ',
      memberContracts: 'สัญญาสมาชิก',
    },
    general: {
      // Sidebar menu
      payment: 'วิธีการชำระเงิน',
      themeColorMenu: 'สีธีม',
      timezoneMenu: 'เขตเวลา',
      workoutMenu: 'ท่าออกกำลังกาย',
      gymCheckinMenu: 'ยิมเช็คอิน',
      
      // Payment section
      paymentMethods: 'วิธีการชำระเงิน',
      paymentDescription: 'วิธีการชำระเงินสามารถเปิดใช้และปิดใช้ได้ ขึ้นอยู่กับความต้องการของคุณ',
      bankTransfer: 'โอนผ่านบัญชีธนาคาร',
      bankTransferDesc: 'ข้อมูลบัญชีธนาคารจะแสดงเมื่อสมาชิกทำการซื้อผ่านแอพสมาชิก',
      specifyBankAccount: 'ระบุบัญชีธนาคาร',
      creditCard: 'บัตรเครดิต (Stripe)',
      creditCardDesc: 'ชำระเงินผ่านบัตรเครดิตผ่าน Stripe ในประเทศ: 3.65% + ฿10 ต่อธุรกรรม ต่างประเทศ: 4.75% + ฿10 ต่อธุรกรรม',
      setupStripe: 'ตั้งค่า Stripe',
      qrPromptPay: 'QR พร้อมเพย์',
      qrPromptPayDesc: 'ชำระเงินผ่าน QR Code พร้อมเพย์ผ่าน Stripe ค่าธรรมเนียม: 1.65% + ฿10 ต่อการคืนเงิน',
      stripeFee: '3.65% + 10 บาท ในประเทศ, 4.75% + 10 บาท ต่างประเทศ',
      promptPayFee: '1.65% + ฿10 ต่อการคืนเงิน',
      taxInvoice: 'ใบกำกับภาษี',
      taxInvoiceDesc: 'ข้อมูลบริษัทสำหรับออกใบกำกับภาษี',
      
      // Empty state
      noLocations: 'ยังไม่มีสาขา',
      noLocationsDesc: 'กรุณาเพิ่มสาขาก่อนตั้งค่าวิธีการชำระเงิน',
      addLocation: 'เพิ่มสาขา',
      
      // Theme section
      appearance: 'รูปลักษณ์',
      themeColor: 'สีธีม',
      selectColor: 'เลือกสี',
      defaultColor: 'สีเริ่มต้น',
      otherColors: 'สีธีมอื่นๆ',
      
      // Timezone section
      timezone: 'เขตเวลา',
      selectTimezone: 'เลือกเขตเวลา',
      
      // Workout section
      workout: 'ท่าออกกำลังกาย',
      workoutList: 'รายการท่าออกกำลังกาย',
      enableWorkoutLogging: 'เปิดใช้งานการบันทึกออกกำลังกายผ่านแอพ Gymmo',
      workoutDesc: 'เมื่อใช้รายการท่าออกกำลังกาย เพื่อให้สมาชิกสามารถบันทึกการออกกำลังกายผ่านแอพ Gymmo ได้ หากต้องการบันทึกกิจกรรมออกกำลังกาย ให้ไปที่: Gymmo app → Profile → My Workout',
      
      // Gym check-in section
      gymCheckin: 'ยิมเช็คอิน',
      enableGymCheckin: 'เปิดใช้งานยิมเช็คอิน',
      gymCheckinDesc: 'อนุญาตให้สมาชิกเช็คอินผ่าน QR Code ที่ทางเข้ายิม',
      specifyCheckinTime: 'ระบุช่วงเวลาให้สมาชิกเช็คอินยิม',
      anytime: 'เวลาใดก็ได้',
      checkinConfigurations: 'การตั้งค่าเช็คอิน',
      set: 'ตั้งค่า',
    },
    class: {
      // Sidebar
      booking: 'การจองคลาส',
      checkin: 'การเช็คอิน',
      waitlist: 'รายชื่อผู้รอเรียก',
      cancellation: 'การยกเลิก',
      noshow: 'การไม่เข้าคลาส',
      
      // Booking section
      bookingAdvanceDesc: 'กำหนดระยะเวลาที่สมาชิกสามารถเริ่มจองคลาสล่วงหน้าได้',
      bookingLastDesc: 'กำหนดระยะเวลาสุดท้ายที่สมาชิกสามารถจองคลาสล่วงหน้าได้',
      maxSpotsDesc: 'กำหนดจำนวนที่นั่งสูงสุดที่สมาชิกสามารถจองได้ต่อคลาส',
      daysBeforeClass: '{n} วัน ก่อนเริ่มคลาส',
      minsBeforeClass: '{n} นาที ก่อนเริ่มคลาส',
      hoursBeforeClass: '{n} ชั่วโมง ก่อนเริ่มคลาส',
      minsAfterClass: '{n} นาที หลังจากเริ่มคลาส',
      seatsOnly: '{n} ที่นั่งเท่านั้น',
      
      // Check-in section
      checkinBeforeDesc: 'กำหนดระยะเวลาที่สมาชิกสามารถเช็คอินด้วย QR code ได้ก่อนเวลาเริ่มของคลาส',
      checkinAfterDesc: 'กำหนดระยะเวลาที่สมาชิกสามารถเช็คอินได้สายที่สุดด้วย QR code',
      
      // Waitlist section
      waitlistCapacityDesc: 'ค่าเริ่มต้นสำหรับความจุรายชื่อผู้รอเรียก',
      sameAsRoomCapacity: 'จำนวนเดียวกับความจุของห้องที่เลือก',
      waitlistPromoteDesc: 'ระยะเวลาที่ช้าที่สุดที่สมาชิกสามารถเลื่อนจากรายชื่อผู้รอเรียกไปเป็นการจองที่ว่างโดยอัตโนมัติได้',
      
      // Cancellation section
      cancellationPenaltyDesc: 'ช่วงเวลาที่บทลงโทษจะมีผลบังคับใช้สำหรับการยกเลิกการจอง',
      lateCancelDeadlineDesc: 'ระยะเวลาที่ช้าที่สุดที่สมาชิกสามารถยกเลิกการจองได้ก่อนที่จะถึงช่วงเวลาที่มีบทลงโทษ',
      unlimitedCancelTitle: 'การยกเลิกการจองที่ใช้แพ็กเกจแบบไม่จำกัด',
      unlimitedCancelDesc: 'จำนวนครั้งสูงสุดที่สมาชิกสามารถยกเลิกคลาสล่าช้าที่จองโดยใช้แพ็กเกจแบบไม่จำกัดได้ก่อนจะถูกระงับอัตโนมัติ',
      sessionCancelTitle: 'การยกเลิกการจองที่ใช้แพ็กเกจแบบเซสชัน',
      sessionCancelDesc: 'จำนวนครั้งสูงสุดที่สมาชิกสามารถยกเลิกคลาสล่าช้าที่จองโดยใช้แพ็กเกจแบบเซสชันได้ก่อนจะถูกระงับอัตโนมัติ',
      sessionRefundDesc: 'การคืนเซสชันในกรณีที่ยกเลิกล่าช้าสำหรับการจองที่ใช้แพ็กเกจแบบเซสชัน',
      none: 'ไม่มี',
      noRefund: 'ไม่คืนเซสชัน',
      
      // No-show section
      noshowPenaltyTitle: 'บทลงโทษสำหรับการไม่เข้าคลาสด้วยแพ็กเกจแบบไม่จำกัด',
      noshowPenaltyDesc: 'จำนวนครั้งสูงสุดที่สมาชิกสามารถไม่เข้าคลาสที่จองโดยใช้แพ็กเกจแบบไม่จำกัดได้ก่อนจะถูกระงับอัตโนมัติ',
      noshowLimit: '{n} ครั้ง ใน {days} วัน, ดำเนินการระงับโดยอัตโนมัติเป็นเวลา {suspend} วัน',
    },
    client: {
      // Sidebar
      injuredMembers: 'สมาชิกที่มีอาการบาดเจ็บ',
      suspendedMembers: 'สมาชิกที่ถูกระงับ',
      pausedMembers: 'สมาชิกที่พักการใช้งาน',
      
      // Injured section
      injuredDesc: 'กำหนดว่าจะอนุญาตให้สมาชิกที่มีอาการบาดเจ็บจองคลาสหรือไม่',
      allowAllInjured: 'อนุญาตการจองทั้งหมดสำหรับสมาชิกที่มีอาการบาดเจ็บ',
      bookOnGymmoApp: 'การจองผ่านแอป Gymmo บนมือถือ',
      bookOnGymmoAppDesc: 'สมาชิกที่มีอาการบาดเจ็บสามารถจองคลาสบนแอป Gymmo บนมือถือได้',
      bookOnGymmoConsole: 'การจองบน Gymmo Console',
      bookOnGymmoConsoleDesc: 'อนุญาตให้พนักงานจองคลาสให้กับสมาชิกที่มีอาการบาดเจ็บบน Gymmo Console ได้',
      
      // Suspended section
      suspendedDesc: 'กำหนดว่าจะอนุญาตให้สมาชิกที่ถูกระงับจองคลาสหรือไม่',
      allowAllSuspended: 'อนุญาตการจองทั้งหมดสำหรับสมาชิกที่ถูกระงับ',
      suspendedBookOnAppDesc: 'สมาชิกที่ถูกระงับสามารถจองคลาสบนแอป Gymmo บนมือถือได้',
      suspendedBookOnConsoleDesc: 'อนุญาตให้พนักงานจองคลาสให้กับสมาชิกที่ถูกระงับบน Gymmo Console ได้',
      
      // Paused section
      pausedDesc: 'กำหนดว่าจะอนุญาตให้สมาชิกเปิดใช้งานแพ็กเกจที่พักการใช้งานอีกครั้งหรือไม่',
      allowReactivate: 'สมาชิกสามารถเปิดใช้งานแพ็กเกจที่พักการใช้งานไว้อีกครั้งได้บนแอป Gymmo บนมือถือ',
      pausedReactivateDesc: 'สมาชิกสามารถเปิดใช้งานแพ็กเกจที่พักการใช้งานไว้อีกครั้งได้บนแอป Gymmo บนมือถือ โดยไม่ต้องติดต่อฟิตเนส เมื่อเปิดใช้งานแพ็กเกจอีกครั้งแล้ว สมาชิกจะสามารถดำเนินการจองคลาสต่อได้',
    },
    package: {
      expirationTitle: 'วันหมดอายุ',
      expirationDesc: 'กำหนดเงื่อนไขการเปิดใช้งานแพ็กเกจเพื่อเริ่มนับถอยหลังวันหมดอายุ',
      whenBooking: 'เมื่อจองคลาส',
    },
    memberContracts: {
      title: 'สัญญาสมาชิก',
      description: 'สัญญาสมาชิกสามารถเปิดให้สมาชิกเซ็นผ่านแอปพลิเคชันหรือปิดได้ ขึ้นอยู่กับการตั้งค่าที่คุณเลือก',
      allowSigning: 'อนุญาตให้สมาชิกเซ็นสัญญาผ่านแอปพลิเคชันสำหรับสมาชิก',
      signingDescription: 'เมื่อเปิดใช้งาน สมาชิกจะได้รับการแจ้งเตือนให้เซ็นสัญญาผ่านแอปพลิเคชันสำหรับสมาชิก',
      setupContracts: 'ตั้งค่าสัญญาสมาชิก',
    },
  },

  // User Profile
  profile: {
    title: 'โปรไฟล์',
    editProfile: 'แก้ไขโปรไฟล์',
    logout: 'ออกจากระบบ',
    accountInfo: 'ข้อมูลบัญชี',
    profileUpdated: 'อัปเดตโปรไฟล์สำเร็จ',
    emailCannotChange: 'ไม่สามารถเปลี่ยนอีเมลได้',
  },

  // Date/Time
  dateTime: {
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
    tomorrow: 'พรุ่งนี้',
    pickDate: 'เลือกวันที่',
    pickDateRange: 'เลือกช่วงวันที่',
  },

  // Time relative
  time: {
    justNow: 'เมื่อสักครู่',
    minutesAgo: '{n} นาทีที่แล้ว',
    hoursAgo: '{n} ชม.ที่แล้ว',
    daysAgo: '{n} วันที่แล้ว',
  },

  // Validation
  validation: {
    required: 'กรุณากรอกข้อมูล',
    invalidEmail: 'กรุณากรอกอีเมลที่ถูกต้อง',
    invalidPhone: 'กรุณากรอกเบอร์โทรที่ถูกต้อง',
    firstNameRequired: 'กรุณากรอกชื่อจริง',
    lastNameRequired: 'กรุณากรอกนามสกุล',
    passwordMinLength: 'รหัสผ่านต้องมีอย่างน้อย {n} ตัวอักษร',
    passwordUppercase: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว',
    passwordLowercase: 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว',
    passwordNumber: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว',
    passwordSpecial: 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว',
    passwordsNotMatch: 'รหัสผ่านไม่ตรงกัน',
    confirmPassword: 'กรุณายืนยันรหัสผ่าน',
  },

  // Auth
  auth: {
    login: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    logout: 'ออกจากระบบ',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    confirmPassword: 'ยืนยันรหัสผ่าน',
    firstName: 'ชื่อจริง',
    lastName: 'นามสกุล',
    rememberMe: 'จดจำฉัน',
    forgotPassword: 'ลืมรหัสผ่าน?',
    forgotPasswordTitle: 'ลืมรหัสผ่าน',
    forgotPasswordDescription: 'กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์รีเซ็ตให้',
    sendResetLink: 'ส่งลิงก์รีเซ็ต',
    backToLogin: 'กลับไปเข้าสู่ระบบ',
    resetEmailSent: 'ส่งอีเมลรีเซ็ตแล้ว! ตรวจสอบกล่องข้อความของคุณ',
    checkEmailForReset: 'เราส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องข้อความและทำตามคำแนะนำ',
    loginDescription: 'เข้าสู่ระบบเพื่อดำเนินการต่อ',
    signupDescription: 'สร้างบัญชีเพื่อเริ่มต้นใช้งาน',
    noAccount: 'ยังไม่มีบัญชี?',
    hasAccount: 'มีบัญชีอยู่แล้ว?',
    loginFailed: 'เข้าสู่ระบบไม่สำเร็จ',
    signupFailed: 'สมัครสมาชิกไม่สำเร็จ',
    loginSuccess: 'ยินดีต้อนรับกลับ!',
    welcomeBack: 'เข้าสู่ระบบสำเร็จแล้ว',
    signupSuccess: 'สร้างบัญชีสำเร็จ!',
    checkEmail: 'กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีของคุณ',
  },

  // Members form fields
  form: {
    nickname: 'ชื่อเล่น',
    dateOfBirth: 'วันเกิด',
    gender: 'เพศ',
    address: 'ที่อยู่',
    selectGender: 'เลือกเพศ',
    male: 'ชาย',
    female: 'หญิง',
    other: 'อื่นๆ',
    requiredFieldsNote: '* ข้อมูลที่จำเป็น',
  },

  // Dashboard
  dashboardExtra: {
    attendees: 'ผู้เข้าร่วม',
    mainLocation: 'MOOM CLUB สาขาหลัก',
  },

  // Error pages
  errors: {
    pageNotFound: 'ไม่พบหน้านี้',
    pageNotFoundDescription: 'ขออภัย! หน้าที่คุณกำลังมองหาไม่มีอยู่',
    returnHome: 'กลับหน้าหลัก',
  },

  // Reports
  reportsExtra: {
    comingSoon: 'เร็วๆ นี้',
    comingSoonDescription: 'รายงานนี้กำลังพัฒนาอยู่',
  },
};
