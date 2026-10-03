(() => {
  let language = 'zh';
  try { language = localStorage.getItem('jiake-language') || 'zh'; } catch {}
  if (!['en','zh','fr','es'].includes(language)) language = 'zh';
  document.documentElement.lang = language;
  document.querySelectorAll('[data-lang]').forEach(element => element.classList.toggle('show',element.dataset.lang === language));
  document.querySelectorAll('.il').forEach(element => element.classList.toggle('show',element.classList.contains(language)));
})();
