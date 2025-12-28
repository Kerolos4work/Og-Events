/**
 * Translation management utilities
 */

// Define the supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
};

// Define the languages that use RTL layout
export const RTL_LANGUAGES = ['ar'];

// Translation keys and values
export const translations = {
  // Common translations
  en: {
    // Navigation
    home: 'Home',
    tickets: 'Tickets',
    payment: 'Payment',
    confirmation: 'Confirmation',

    // General
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    back: 'Back',
    next: 'Next',
    bookingHoldMessage:
      'Seats held for 60 minutes. Please upload payment proof to complete your booking.',

    // Seat Map
    selectSeats: 'Select Seats',
    seatMap: 'Seat Map',
    available: 'Available',
    selected: 'Selected',
    occupied: 'Occupied',
    totalPrice: 'Total Price',
    continue: 'Continue',
    seatMapLegend: 'Seat Map Legend',
    selection: 'Selection',
    seatsSelection: 'seats',
    clearAll: 'Clear All',
    currency: 'EGP',
    name: 'Name',
    email: 'Email',
    phone: 'Whatsapp Phone',
    bookingProgress: 'Booking...',
    bookNow: 'Book Now',
    zone: 'Zone',
    row: 'Row',
    seat: 'Seat',
    booked: 'Booked',
    hold: 'Hold',

    // Payment
    paymentMethod: 'Payment Method',
    cardPayment: 'Card Payment',
    bankTransfer: 'Bank Transfer',
    cashOnDelivery: 'Cash on Delivery',
    cardNumber: 'Card Number',
    expiryDate: 'Expiry Date',
    cvv: 'CVV',
    cardholderName: 'Cardholder Name',
    payNow: 'Pay Now',
    paymentSuccessful: 'Payment Successful',
    paymentFailed: 'Payment Failed',
    uploadPaymentProof: 'Upload Payment Proof',
    selectPaymentOptions: 'Select Payment Options',
    transferTo: 'Transfer to',
    accountNumber: 'Account Number',
    accountName: 'Account Name',
    uploadPaymentConfirmation:
      'After completing your transfer, please upload a clear screenshot of your payment confirmation',
    convertingImage: 'Converting image...',
    clickToUpload: 'Click to upload',
    orDragAndDrop: 'or drag and drop',
    supportedFormats: 'PNG, JPG, GIF, HEIC or PDF (MAX. 10MB)',
    uploading: 'Uploading...',
    upload: 'Upload',
    processing: 'Processing...',
    payOnline: 'Pay Online',
    invalidAmount: 'Invalid payment amount',
    paymentHashError: 'Failed to generate payment hash',
    paymentProcessingError: 'An error occurred while processing your payment',

    // Booking Confirmation
    bookingConfirmed: 'Booking Confirmed',
    bookingReference: 'Booking Reference',
    eventDetails: 'Event Details',
    ticketDetails: 'Ticket Details',
    downloadTicket: 'Download Ticket',
    emailTicket: 'Email Ticket',

    // Orders Page
    myOrders: 'My Orders',
    myOrdersDescription: 'View and manage your ticket orders',
    backToHome: 'Back to Home',
    errorLoadingOrders: 'Error loading orders',
    noOrders: 'No orders found',
    noOrdersDescription: 'You have no orders yet. Make a booking to see it here.',
    yourOrders: 'Your Orders',
    ordersDescription: 'View and manage your ticket orders',
    idAndDate: 'ID & Date',
    customerInfo: 'Customer Info',
    seats: 'Seats',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    timeout: 'Timeout',
    downloadTickets: 'Download Tickets',
    downloadSeparateTickets: 'Download Separate Tickets',
    loadingYourOrders: 'Loading your orders...',
    failedToGenerateTickets: 'Failed to generate tickets',
    failedToDownloadTickets: 'Failed to download tickets',
    failedToDownloadSeparateTickets: 'Failed to download separate tickets',

    // Payment Page
    bookingExpired: 'Time expired. Your booking has been released.',
    cancelBookingConfirm:
      'Are you sure you want to cancel this booking? This action cannot be undone.',
    cancelBookingFailed: 'Failed to cancel booking. Please try again.',
    cancelBookingError: 'An error occurred while cancelling the booking.',
    cancelling: 'Cancelling...',
    cancelBooking: 'Cancel Booking',
    noPhoneNumber: 'No phone number',
    guestUser: 'Guest User',
    timeLeft: 'Time Left',
    paymentProofSubmitted: 'Payment Proof Submitted',
    paymentProofSubmittedMessage:
      'Your payment proof has been submitted successfully. Your booking is now pending admin approval.',
    redirectingToConfirmation: 'Redirecting to confirmation page...',

    // Seat Names List
    ticketHolderNames: 'Ticket Names',
    allNamesRequired: 'All names are required',
    enterName: 'Enter full name',
    namesRequiredInfo: 'Please enter the full name for each ticket holder below.',
  },

  // Arabic translations
  ar: {
    // Navigation
    home: 'الرئيسية',
    tickets: 'التذاكر',
    payment: 'الدفع',
    confirmation: 'التأكيد',

    // General
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    back: 'رجوع',
    next: 'التالي',
    bookingHoldMessage: 'تم حجز المقاعد لمدة 60 دقيقة. يرجى تحميل إثبات الدفع لإكمال حجزك.',

    // Seat Map
    selectSeats: 'اختر المقاعد',
    seatMap: 'خريطة المقاعد',
    available: 'متاح',
    selected: 'محدد',
    occupied: 'محجوز',
    totalPrice: 'الإجمالي',
    continue: 'متابعة',
    seatMapLegend: 'مفتاح الخريطة',
    selection: 'الاختيار',
    seatsSelection: 'مقاعد',
    clearAll: 'مسح الكل',
    currency: 'ج . م',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'رقم الواتساب',
    bookingProgress: 'جاري الحجز...',
    bookNow: 'احجز الآن',
    zone: 'المنطقة',
    row: 'الصف',
    seat: 'المقعد',
    booked: 'محجوز',
    hold: 'محجوز مؤقتاً',

    // Payment
    paymentMethod: 'طريقة الدفع',
    cardPayment: 'الدفع بالبطاقة',
    bankTransfer: 'التحويل البنكي',
    cashOnDelivery: 'الدفع عند الاستلام',
    cardNumber: 'رقم البطاقة',
    expiryDate: 'تاريخ الانتهاء',
    cvv: 'CVV',
    cardholderName: 'اسم حامل البطاقة',
    payNow: 'ادفع الآن',
    paymentSuccessful: 'تم الدفع بنجاح',
    paymentFailed: 'فشل الدفع',
    uploadPaymentProof: 'تحميل إثبات الدفع',
    selectPaymentOptions: 'اختر خيارات الدفع',
    transferTo: 'تحويل إلى',
    accountNumber: 'رقم الحساب',
    accountName: 'اسم الحساب',
    uploadPaymentConfirmation: 'بعد إتمام التحويل، يرجى تحميل لقطة شاشة واضحة لتأكيد الدفع',
    convertingImage: 'جاري تحويل الصورة...',
    clickToUpload: 'انقر للرفع',
    orDragAndDrop: 'أو اسحب وأفلت',
    supportedFormats: 'PNG، JPG، GIF، HEIC أو PDF (الحد الأقصى 10 ميجابايت)',
    uploading: 'جاري الرفع...',
    upload: 'رفع',
    processing: 'جاري المعالجة...',
    payOnline: 'الدفع عبر الإنترنت',
    invalidAmount: 'مبلغ الدفع غير صالح',
    paymentHashError: 'فشل في إنشاء تجزئة الدفع',
    paymentProcessingError: 'حدث خطأ أثناء معالجة الدفع',

    // Booking Confirmation
    bookingConfirmed: 'تم تأكيد الحجز',
    bookingReference: 'مرجع الحجز',
    eventDetails: 'تفاصيل الفعالية',
    ticketDetails: 'تفاصيل التذكرة',
    downloadTicket: 'تحميل التذكرة',
    emailTicket: 'إرسال التذكرة بالبريد',

    // Orders Page
    myOrders: 'طلباتي',
    myOrdersDescription: 'عرض وإدارة طلبات التذاكر الخاصة بك',
    backToHome: 'العودة للرئيسية',
    errorLoadingOrders: 'خطأ في تحميل الطلبات',
    noOrders: 'لا توجد طلبات',
    noOrdersDescription: 'ليس لديك طلبات حتى الآن. قم بعمل حجز لرؤيته هنا.',
    yourOrders: 'طلباتك',
    ordersDescription: 'عرض وإدارة طلبات التذاكر الخاصة بك',
    idAndDate: 'الرقم والتاريخ',
    customerInfo: 'معلومات العميل',
    seats: 'المقاعد',
    amount: 'المبلغ',
    status: 'الحالة',
    actions: 'الإجراءات',
    approved: 'مقبول',
    pending: 'قيد الانتظار',
    rejected: 'مرفوض',
    timeout: 'انتهى الوقت',
    downloadTickets: 'تحميل التذاكر',
    downloadSeparateTickets: 'تحميل التذاكر بشكل منفصل',
    loadingYourOrders: 'جاري تحميل طلباتك...',
    failedToGenerateTickets: 'فشل في إنشاء التذاكر',
    failedToDownloadTickets: 'فشل في تحميل التذاكر',
    failedToDownloadSeparateTickets: 'فشل في تحميل التذاكر بشكل منفصل',

    // Payment Page
    bookingExpired: 'انتهى الوقت. تم إلغاء حجزك.',
    cancelBookingConfirm: 'هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.',
    cancelBookingFailed: 'فشل في إلغاء الحجز. يرجى المحاولة مرة أخرى.',
    cancelBookingError: 'حدث خطأ أثناء إلغاء الحجز.',
    cancelling: 'جاري الإلغاء...',
    cancelBooking: 'إلغاء الحجز',
    noPhoneNumber: 'لا يوجد رقم هاتف',
    guestUser: 'ضيف',
    timeLeft: 'الوقت المتبقي',
    paymentProofSubmitted: 'تم تقديم إثبات الدفع',
    paymentProofSubmittedMessage: 'تم تقديم إثبات الدفع بنجاح. حجزك الآن في انتظار موافقة الإدارة.',
    redirectingToConfirmation: 'جاري التوجيه إلى صفحة التأكيد...',

    // Seat Names List
    ticketHolderNames: 'أسماء حاملي التذاكر',
    allNamesRequired: 'جميع الأسماء مطلوبة',
    enterName: 'أدخل الاسم بالكامل',
    namesRequiredInfo: 'يرجى إدخال الاسم بالكامل لكل حامل تذكرة أدناه.',
  },

  // Add more languages as needed
};

/**
 * Get translation for a specific key in the given language
 * @param key The translation key
 * @param language The language code (e.g., 'en', 'ar')
 * @returns The translated text or the key if not found
 */
export const getTranslation = (key: string, language: string): string => {
  // Check if the language is supported
  if (!translations[language as keyof typeof translations]) {
    console.warn(`Language ${language} is not supported. Falling back to English.`);
    language = 'en';
  }

  // Get the translation object for the language
  const langTranslations = translations[language as keyof typeof translations];

  // Get the translation for the key
  const translation = langTranslations[key as keyof typeof langTranslations];

  // Return the translation or the key if not found
  return translation || key;
};

/**
 * Check if the language uses RTL layout
 * @param language The language code
 * @returns True if the language uses RTL layout
 */
export const isRTL = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language);
};
