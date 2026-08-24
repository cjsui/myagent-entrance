export type Lang = 'en' | 'zh';

export interface SiteCopy {
  name: string;
  handle: string;
  tagline: string;
  tags: string[];
  links: { label: string; url: string }[];
  langToggleLabel: string;
}

export const LINK_URLS = {
  ronsui: 'https://ronsui.tw',
  aisi: 'https://aisi.tw',
  github: 'https://github.com/cjsui',
} as const;

export const COPY: Record<Lang, SiteCopy> = {
  en: {
    name: 'Chi-Jung Sui',
    handle: 'Ron',
    tagline: 'Educator and builder at the edge of AI agents in education.',
    tags: ['Assistant Professor', 'EdTech Founder', 'Research PI', 'Systems Builder'],
    links: [
      { label: 'Academic Site', url: LINK_URLS.ronsui },
      { label: 'AISI Platform', url: LINK_URLS.aisi },
      { label: 'GitHub', url: LINK_URLS.github },
    ],
    langToggleLabel: '中',
  },
  zh: {
    name: '隋奇融',
    handle: 'Ron',
    tagline: '教學、研究，也打造 AI agent 的人。',
    tags: ['助理教授', 'AISI 創辦人', '研究計畫主持人', '系統建構者'],
    links: [
      { label: '學術網站', url: LINK_URLS.ronsui },
      { label: 'AISI 平台', url: LINK_URLS.aisi },
      { label: 'GitHub', url: LINK_URLS.github },
    ],
    langToggleLabel: 'EN',
  },
};
