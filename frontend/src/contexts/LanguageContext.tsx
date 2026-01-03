import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.name': 'IndieHub',
    'nav.home': 'Home',
    'nav.games': 'Games',
    'nav.library': 'My Library',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'home.title': 'Discover Independent Games',
    'home.subtitle': 'Supporting developers from underrepresented communities',
    'home.featured': 'Featured Game',
    'home.popular': 'Most Popular',
    'home.newReleases': 'New Releases',
    'game.download': 'Download',
    'game.addToLibrary': 'Add to Library',
    'game.removeFromLibrary': 'Remove from Library',
    'game.reviews': 'Reviews',
    'game.writeReview': 'Write a Review',
    'game.categories': 'Categories',
    'game.status': 'Status',
    'game.developer': 'Developer',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.username': 'Username',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.role': 'Role',
    'auth.role.user': 'User',
    'auth.role.developer': 'Developer',
    'dashboard.submitGame': 'Submit New Game',
    'dashboard.myGames': 'My Games',
    'dashboard.pending': 'Pending',
    'dashboard.approved': 'Approved',
    'dashboard.rejected': 'Rejected',
    'gameForm.title': 'Title',
    'gameForm.description': 'Description',
    'gameForm.file': 'Game File',
    'gameForm.categories': 'Select Categories',
    'search.placeholder': 'Search games...',
    'filter.categories': 'Filter by Category',
    'library.empty': 'Your library is empty',
    'library.addGames': 'Add games to your library to access them quickly',
  },
  ar: {
    'app.name': 'إندي هاب',
    'nav.home': 'الرئيسية',
    'nav.games': 'الألعاب',
    'nav.library': 'مكتبتي',
    'nav.dashboard': 'لوحة التحكم',
    'nav.admin': 'المسؤول',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'التسجيل',
    'nav.logout': 'تسجيل الخروج',
    'home.title': 'اكتشف الألعاب المستقلة',
    'home.subtitle': 'دعم المطورين من المجتمعات الممثلة تمثيلاً ناقصاً',
    'home.featured': 'اللعبة المميزة',
    'home.popular': 'الأكثر شعبية',
    'home.newReleases': 'أحدث الإصدارات',
    'game.download': 'تحميل',
    'game.addToLibrary': 'إضافة إلى المكتبة',
    'game.removeFromLibrary': 'إزالة من المكتبة',
    'game.reviews': 'التقييمات',
    'game.writeReview': 'اكتب تقييماً',
    'game.categories': 'الفئات',
    'game.status': 'الحالة',
    'game.developer': 'المطور',
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'التسجيل',
    'auth.username': 'اسم المستخدم',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.role': 'الدور',
    'auth.role.user': 'مستخدم',
    'auth.role.developer': 'مطور',
    'dashboard.submitGame': 'إرسال لعبة جديدة',
    'dashboard.myGames': 'ألعابي',
    'dashboard.pending': 'قيد الانتظار',
    'dashboard.approved': 'موافق عليه',
    'dashboard.rejected': 'مرفوض',
    'gameForm.title': 'العنوان',
    'gameForm.description': 'الوصف',
    'gameForm.file': 'ملف اللعبة',
    'gameForm.categories': 'اختر الفئات',
    'search.placeholder': 'ابحث عن الألعاب...',
    'filter.categories': 'تصفية حسب الفئة',
    'library.empty': 'مكتبتك فارغة',
    'library.addGames': 'أضف الألعاب إلى مكتبتك للوصول إليها بسرعة',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language') as Language;
    return stored || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

