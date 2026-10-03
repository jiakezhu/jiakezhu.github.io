(() => {
  const posts = window.JOURNAL_POSTS || [];
  const list = document.getElementById('journal-list');
  const search = document.getElementById('journal-search');
  if (!list || !search) return;
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let category = 'all';
  function update() {
    const language = document.documentElement.lang;
    const copy = window.STORY_I18N?.[language] || {tech:'技术博客',diary:'日记'};
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    posts.forEach(post => {
      const card = document.getElementById(`post-${post.slug}`);
      const matches = (category === 'all' || category === post.category) &&
        [post.title, post.summary, ...post.tags, post.searchText, card?.textContent || ''].join(' ').toLocaleLowerCase().includes(query);
      if (card) card.hidden = !matches;
      if (card) {
        const metadata = card.querySelectorAll('.journal-meta span');
        metadata[0].textContent = copy[post.category];
        metadata[1].textContent = {zh:`${post.minutes} 分钟阅读`,en:`${post.minutes} min read`,fr:`${post.minutes} min de lecture`,es:`${post.minutes} min de lectura`}[language] || `${post.minutes} 分钟阅读`;
      }
      if (matches) count++;
    });
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === category)));
    document.getElementById('journal-results').textContent = posts.length ? ({zh:`${count} 篇记录`,en:`${count} ${count === 1 ? 'entry' : 'entries'}`,fr:`${count} notes`,es:`${count} entradas`}[language] || `${count} 篇记录`) : (copy.waiting || '等待第一篇记录');
    document.getElementById('journal-no-results').hidden = count > 0 || posts.length === 0;
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (query) params.set('q', search.value.trim());
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
  }
  buttons.forEach(b => b.addEventListener('click', () => { category = b.dataset.filter; update(); }));
  search.addEventListener('input', update);
  document.addEventListener('jiake:languagechange',update);
  document.getElementById('journal-reset').addEventListener('click', () => { category = 'all'; search.value = ''; update(); search.focus(); });
  const params = new URLSearchParams(location.search);
  category = ['tech','diary'].includes(params.get('category')) ? params.get('category') : 'all';
  search.value = params.get('q') || '';
  update();
})();
