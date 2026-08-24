import { COPY, type Lang } from '../content/copy';

const STORAGE_KEY = 'myagent-lang';

function detectInitialLang(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function initOverlay(onLangChange?: (lang: Lang) => void): void {
  let lang = detectInitialLang();

  const nameEl = document.getElementById('name')!;
  const handleEl = document.getElementById('handle')!;
  const taglineEl = document.getElementById('tagline')!;
  const tagsEl = document.getElementById('tags')!;
  const linksEl = document.getElementById('links')!;
  const toggleEl = document.getElementById('lang-toggle') as HTMLButtonElement;

  function render(): void {
    const c = COPY[lang];
    document.documentElement.lang = lang;
    nameEl.textContent = c.name;
    handleEl.textContent = c.handle;
    taglineEl.textContent = c.tagline;

    tagsEl.innerHTML = '';
    for (const tag of c.tags) {
      const li = document.createElement('li');
      li.textContent = tag;
      tagsEl.appendChild(li);
    }

    linksEl.innerHTML = '';
    for (const link of c.links) {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      linksEl.appendChild(a);
    }

    toggleEl.textContent = c.langToggleLabel;
  }

  toggleEl.addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    window.localStorage.setItem(STORAGE_KEY, lang);
    render();
    onLangChange?.(lang);
  });

  render();
}
