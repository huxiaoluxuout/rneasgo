import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';


// 导入翻译文件
import en from './en.json';
import zh from './zh.json';


// 1. 定义翻译字典
const translations = {
    en: en,
    zh: zh,
    'zh-CN': zh, // 兼容不同的语言标签
};

// 2. 创建 i18n 实例
const i18n = new I18n(translations);

// 3. 设置默认语言（根据设备语言）
// 获取设备语言，例如 'zh-CN' 或 'en-US'
const deviceLocale = Localization.getLocales()[0].languageTag;

// 如果设备语言在字典里，就用设备的，否则默认用英文
i18n.locale = translations[deviceLocale] ? deviceLocale : 'en';

// 4. 开启回退机制 (Fallback)
// 如果当前语言缺少某个翻译，会自动回退到默认语言
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
