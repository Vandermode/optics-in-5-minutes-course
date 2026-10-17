export const language = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const dictionary = language === 'zh' ? await import('./zh.js') : {phrases: {}, termAliases: {}};
export const termAliases = dictionary.termAliases;
const normalize = value => value.replace(/\s+/g, ' ').trim();
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(dictionary.phrases).filter(([key]) => /\{\w+\}/.test(key)).map(([key, value]) => {
  const names = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
  const pattern = key.split(/\{\w+\}/).map(escape).join('(.+?)');
  return {pattern: new RegExp('^' + pattern + '$'), names, value};
});

export function t(value, replacements = {}) {
  if (typeof value !== 'string') return value;
  let output = language === 'zh' ? dictionary.phrases[normalize(value)] : value;
  if (output === undefined) {
    for (const template of templates) {
      const match = normalize(value).match(template.pattern);
      if (!match) continue;
      output = template.value;
      replacements = {...Object.fromEntries(template.names.map((name, i) => [name, match[i + 1]])), ...replacements};
      break;
    }
  }
  return (output ?? value).replace(/\{(\w+)\}/g, (token, key) => replacements[key] ?? token);
}

export function languageLinks() {
  const nav = document.createElement('nav');
  nav.className = 'language-switch';
  nav.setAttribute('aria-label', 'Language / 语言');
  nav.setAttribute('translate', 'no');
  for (const [code, label] of [['en', 'English'], ['zh', '中文']]) {
    const link = document.createElement('a');
    link.dataset.language = code;
    link.lang = link.hreflang = code === 'zh' ? 'zh-CN' : 'en';
    link.textContent = label;
    link.href = languageURL(code).href;
    if (code === language) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  return nav;
}

function languageURL(code) {
  const url = new URL(location.href);
  url.pathname = url.pathname.replace(/index(?:\.zh)?\.html$/, '');
  url.pathname += code === 'zh' ? 'index.zh.html' : 'index.html';
  return url;
}

function remember(code) {
  try { localStorage.setItem('optics-course-language', code); } catch { /* Browsing still works when storage is unavailable. */ }
}

let preferred;
try { preferred = localStorage.getItem('optics-course-language'); } catch { /* Use the explicitly requested page language. */ }
// An explicit English file URL also works when opened in another tab while the
// saved preference is Chinese. Folder routes continue to honor that preference.
if (language === 'en' && preferred === 'zh' && !location.pathname.endsWith('/index.html')) location.replace(languageURL('zh'));
else remember(language);
document.body.classList.add('language-ready');

function selectLanguage(event) {
  const link = event.target.closest('a[data-language]');
  if (!link || ![0, 1].includes(event.button)) return;
  const code = link.dataset.language;
  const url = languageURL(code);
  const current = document.querySelector('.chapter-sections a[aria-current]');
  if (current) url.hash = current.hash;
  // Each experiment supplies the current controls, including changes not yet run.
  dispatchEvent(new CustomEvent('course:language-change', {detail: {url}}));
  link.href = url.href;
  if (event.type === 'auxclick' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (code === language) return;
  remember(code);
  location.assign(url);
}
document.addEventListener('click', selectLanguage);
document.addEventListener('auxclick', selectLanguage);

function updateLinks() {
  for (const link of document.querySelectorAll('a[data-language]')) link.href = languageURL(link.dataset.language).href;
}
addEventListener('hashchange', updateLinks);
updateLinks();
