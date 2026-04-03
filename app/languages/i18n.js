// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// 导入 JSON 语言包
import enTranslation from '@languages/en.json';
import zhTranslation from '@languages/zh.json';

// 定义翻译资源
const resources = {
    en: {
        translation: enTranslation
    },
    zh: {
        translation: zhTranslation
    }
};
// 安全地获取设备语言
const getDeviceLanguage = () => {
    try {
        // 检查 Localization.locale 是否存在
        if (Localization.locale && typeof Localization.locale === 'string') {
            const deviceLanguage = Localization.locale.split('-')[0];
            return deviceLanguage === 'zh' ? 'zh' : 'en';
        }
    } catch (error) {
        console.warn('Failed to get device language:', error);
    }
    return 'zh'; // 默认返回
};

// 初始化 i18n
const initI18n = () => {
    const initialLanguage = getDeviceLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: initialLanguage,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false, // 禁用 Suspense，避免错误
            },
        })
        .then(() => {
            console.log('i18n initialized successfully with language:', initialLanguage);
        })
        .catch((error) => {
            console.error('i18n initialization failed:', error);
        });
};

// 立即初始化
initI18n();

export default i18n;
