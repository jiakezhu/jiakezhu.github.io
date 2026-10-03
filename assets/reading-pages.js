(() => {
  const supported = ['en','zh','fr','es'];
  const buttons = [...document.querySelectorAll('[data-language]')];
  const copy = window.STORY_I18N || {};
  function setLanguage(language) {
    if (!supported.includes(language)) language = 'zh';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-lang]').forEach(element => element.classList.toggle('show',element.dataset.lang === language));
    document.querySelectorAll('.il').forEach(element => element.classList.toggle('show',element.classList.contains(language)));
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.language === language)));
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = copy[language]?.[element.dataset.i18n];
      if (value) element.textContent = value;
    });
    const search = document.getElementById('journal-search');
    if (search && copy[language]) {
      search.placeholder = copy[language].searchPlaceholder;
      search.setAttribute('aria-label',copy[language].searchLabel);
    }
    const posts = window.STORY_POST_TRANSLATIONS || {};
    document.querySelectorAll('.journal-card').forEach(card => {
      const original = posts[card.id.replace('post-','')];
      const translation = original?.[language] || original?.zh;
      if (!translation) return;
      card.querySelector('h3').textContent = translation[0];
      card.querySelector('p').textContent = translation[1];
      card.querySelectorAll('.journal-tags span').forEach(tag => {
        if (!tag.dataset.original) tag.dataset.original = tag.textContent.replace(/^#\s*/, '');
        tag.textContent = '# ' + (window.STORY_TAG_TRANSLATIONS?.[tag.dataset.original]?.[language] || tag.dataset.original);
      });
    });
    try { localStorage.setItem('jiake-language',language); } catch {}
    document.dispatchEvent(new CustomEvent('jiake:languagechange',{detail:{language}}));
  }
  buttons.forEach(button => button.addEventListener('click',() => setLanguage(button.dataset.language)));
  window.addEventListener('storage',event => { if (event.key === 'jiake-language') setLanguage(event.newValue); });
  let language = navigator.language.startsWith('zh') ? 'zh' : 'en';
  try { language = localStorage.getItem('jiake-language') || language; } catch {}
  setLanguage(language);
})();
