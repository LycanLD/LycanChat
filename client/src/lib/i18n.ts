export type Language = 'en' | 'vi' | 'ru';

export interface Translations {
  // Header
  appName: string;
  tagline: string;
  online: string;
  offline: string;
  userCount: string;
  logout: string;

  // Nickname setup
  joinPack: string;
  nicknamePrompt: string;
  nicknamePlaceholder: string;
  joinChat: string;
  joining: string;

  // Welcome message
  welcomeMessage: string;

  // Chat interface
  messagePlaceholder: string;
  send: string;
  sending: string;
  loadingMessages: string;

  // File upload
  dragDropMessage: string;
  fileTooLarge: string;
  fileUploaded: string;
  uploadFailed: string;
  uploading: string;

  // Rate limiting
  rateLimitMessage: string;

  // Join notifications
  userJoined: string;

  // Errors
  errorSendMessage: string;
  errorGeneral: string;

  // Language selector
  language: string;
  
  // Connection status
  connectedToServer: string;
  staticModeTitle: string;
  staticModeDescription: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'LycanChat',
    tagline: 'Lycanroc Spirit Chat',
    online: 'Online',
    offline: 'Offline',
    userCount: 'user online',
    logout: 'Logout',
    
    joinPack: 'Join the Pack',
    nicknamePrompt: 'Enter a nickname to unleash your Lycanroc spirit!',
    nicknamePlaceholder: 'Enter your nickname...',
    joinChat: 'Join Chat',
    joining: 'Joining...',
    
    welcomeMessage: 'Welcome to LycanChat! Join the pack and start howling! 🐺',
    
    messagePlaceholder: 'Type your message...',
    send: 'Send',
    sending: 'Sending...',
    loadingMessages: 'Loading messages...',
    
    dragDropMessage: 'Drop your file here to share',
    fileTooLarge: 'Please select a file smaller than 10MB.',
    fileUploaded: 'Your file has been shared in the chat.',
    uploadFailed: 'Failed to upload file. Please try again.',
    uploading: 'Uploading file...',
    
    rateLimitMessage: 'Please wait a moment before sending another message.',
    
    userJoined: 'joined the pack',
    
    errorSendMessage: 'Failed to send message. Please try again.',
    errorGeneral: 'An error occurred. Please try again.',
    
    language: 'Language',
    
    connectedToServer: 'Connected to live chat server',
    staticModeTitle: 'Static Mode Active',
    staticModeDescription: 'Messages are saved locally. For real-time chat, deploy on a platform that supports Node.js servers.',
  },
  
  vi: {
    appName: 'LycanChat',
    tagline: 'Chat Tinh Thần Lycanroc',
    online: 'Trực tuyến',
    offline: 'Ngoại tuyến',
    userCount: 'người dùng trực tuyến',
    logout: 'Đăng xuất',
    
    joinPack: 'Gia nhập Bầy',
    nicknamePrompt: 'Nhập biệt danh để giải phóng tinh thần Lycanroc!',
    nicknamePlaceholder: 'Nhập biệt danh của bạn...',
    joinChat: 'Tham gia Chat',
    joining: 'Đang tham gia...',
    
    welcomeMessage: 'Chào mừng đến với LycanChat! Gia nhập bầy và bắt đầu hú! 🐺',
    
    messagePlaceholder: 'Nhập tin nhắn của bạn...',
    send: 'Gửi',
    sending: 'Đang gửi...',
    loadingMessages: 'Đang tải tin nhắn...',
    
    dragDropMessage: 'Thả tệp của bạn vào đây để chia sẻ',
    fileTooLarge: 'Vui lòng chọn tệp nhỏ hơn 10MB.',
    fileUploaded: 'Tệp của bạn đã được chia sẻ trong chat.',
    uploadFailed: 'Không thể tải lên tệp. Vui lòng thử lại.',
    uploading: 'Đang tải lên tệp...',
    
    rateLimitMessage: 'Vui lòng đợi một chút trước khi gửi tin nhắn khác.',
    
    userJoined: 'đã gia nhập bầy',
    
    errorSendMessage: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
    errorGeneral: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    
    language: 'Ngôn ngữ',
    
    connectedToServer: 'Đã kết nối với máy chủ chat trực tiếp',
    staticModeTitle: 'Chế độ tĩnh đang hoạt động',
    staticModeDescription: 'Tin nhắn được lưu cục bộ. Để chat thời gian thực, triển khai trên nền tảng hỗ trợ máy chủ Node.js.',
  },
  
  ru: {
    appName: 'LycanChat',
    tagline: 'Чат Духа Ликанрока',
    online: 'Онлайн',
    offline: 'Офлайн',
    userCount: 'пользователь онлайн',
    logout: 'Выйти',
    
    joinPack: 'Присоединиться к Стае',
    nicknamePrompt: 'Введите ник, чтобы освободить дух Ликанрока!',
    nicknamePlaceholder: 'Введите ваш ник...',
    joinChat: 'Войти в Чат',
    joining: 'Входим...',
    
    welcomeMessage: 'Добро пожаловать в LycanChat! Присоединяйтесь к стае и начинайте выть! 🐺',
    
    messagePlaceholder: 'Введите ваше сообщение...',
    send: 'Отправить',
    sending: 'Отправляем...',
    loadingMessages: 'Загружаем сообщения...',
    
    dragDropMessage: 'Перетащите файл сюда для отправки',
    fileTooLarge: 'Пожалуйста, выберите файл меньше 10МБ.',
    fileUploaded: 'Ваш файл был отправлен в чат.',
    uploadFailed: 'Не удалось загрузить файл. Попробуйте снова.',
    uploading: 'Загружаем файл...',
    
    rateLimitMessage: 'Подождите немного перед отправкой следующего сообщения.',
    
    userJoined: 'присоединился к стае',
    
    errorSendMessage: 'Не удалось отправить сообщение. Попробуйте снова.',
    errorGeneral: 'Произошла ошибка. Попробуйте снова.',
    
    language: 'Язык',
    
    connectedToServer: 'Подключен к живому чат-серверу',
    staticModeTitle: 'Активен статический режим',
    staticModeDescription: 'Сообщения сохраняются локально. Для чата в реальном времени разверните на платформе с поддержкой серверов Node.js.',
  },
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ru: 'Русский',
};

// Helper functions for localStorage
export const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('lycanchat-language') as Language;
  return stored && stored in translations ? stored : 'en';
};

export const setStoredLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lycanchat-language', language);
  }
};

export const getTranslation = (language: Language): Translations => {
  return translations[language];
};