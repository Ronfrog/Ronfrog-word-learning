/**
 * 語言定義檔 — 核心擴展點
 * 
 * 新增語言只需在 LANGUAGES 物件中加入一個新的定義即可。
 * 前端語言切換器會自動顯示新語言選項。
 */

export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    displayName: 'EN',
    icon: '🇺🇸',
    // 單字表單的欄位定義
    fields: {
      word:       { label: '英文單字',   placeholder: '輸入英文單字' },
      phonetic:   { label: '音標',       placeholder: '例：/həˈloʊ/' },
      pos:        { label: '詞性',       placeholder: 'n., v., adj...' },
      definition: { label: '中文釋義',   placeholder: '繁體中文釋義' },
      example:    { label: '例句與翻譯', placeholder: '英文例句（附中文翻譯）' },
    },
    // 單字卡片上的發音顯示格式
    formatReading: (word) => word.phonetic ? `/${word.phonetic}/` : '',
    // AI 分析的 Prompt 模板
    aiPrompt: (word, categories) =>
      `分析英文單字 "${word}"。請以繁體中文回答。提供 JSON 格式: ` +
      `{"phonetic":"音標","pos":"詞性縮寫(如 n., v.)","definition":"精確的繁體中文釋義",` +
      `"example":"英文例句 (附上繁體中文翻譯)","cat1":"...","cat2":"..."}。` +
      `類別從 [${categories}] 挑選或自擬。`,
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    displayName: '日本語',
    icon: '🇯🇵',
    fields: {
      word:       { label: '日文單字',   placeholder: '輸入日文（漢字或假名）' },
      phonetic:   { label: '假名讀音',   placeholder: '例：ありがとう' },
      pos:        { label: '詞性',       placeholder: '名詞, 動詞, い形容詞...' },
      definition: { label: '中文釋義',   placeholder: '繁體中文釋義' },
      example:    { label: '例句與翻譯', placeholder: '日文例句（附中文翻譯）' },
    },
    formatReading: (word) => word.phonetic ? `（${word.phonetic}）` : '',
    aiPrompt: (word, categories) =>
      `分析日文單字 "${word}"。請以繁體中文回答。提供 JSON 格式: ` +
      `{"phonetic":"假名讀音","pos":"詞性(如 名詞, 動詞, い形容詞)","definition":"精確的繁體中文釋義",` +
      `"example":"日文例句 (附上繁體中文翻譯)","cat1":"...","cat2":"..."}。` +
      `類別從 [${categories}] 挑選或自擬。`,
  },
  // 未來擴展範例：
  // ko: { code: 'ko', name: 'Korean', displayName: '한국어', icon: '🇰🇷', ... },
};

export const DEFAULT_LANG = 'en';
export const SUPPORTED_LANGS = Object.keys(LANGUAGES);
