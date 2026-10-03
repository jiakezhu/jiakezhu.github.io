(() => {
  try {
    const arrival = Number(sessionStorage.getItem('story-book-arrival'));
    sessionStorage.removeItem('story-book-arrival');
    if (arrival && Date.now()-arrival < 10000 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('story-arriving');
      setTimeout(() => document.documentElement.classList.remove('story-arriving'),650);
    }
  } catch {}
  const chapters = [...document.querySelectorAll('.story-chapter')];
  const status = document.getElementById('story-selection');
  const dialog = document.getElementById('story-dialog');
  const cover = document.querySelector('.story-cover');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  cover.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches) return;
    const bounds = cover.getBoundingClientRect();
    cover.style.setProperty('--cover-x', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 6}deg`);
    cover.style.setProperty('--cover-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 6}deg`);
  });
  cover.addEventListener('pointerleave', () => {
    cover.style.removeProperty('--cover-x');
    cover.style.removeProperty('--cover-y');
  });
  const labels = {
    zh:['童年的章节','少年的章节','走向更大的世界','此刻与以后'],
    en:['The early chapters','Growing up','A wider world','Now, and what comes next'],
    fr:['Les premiers chapitres','Grandir','Un monde plus vaste','Aujourd’hui et demain'],
    es:['Los primeros capítulos','Crecer','Un mundo más amplio','Hoy y lo que viene']
  };
  const pending = {zh:'故事待写',en:'Story to come',fr:'À écrire',es:'Por escribir'};
  let selected = 0;
  function translate() {
    const lang = document.documentElement.lang;
    const names = labels[lang] || labels.en;
    chapters.forEach((chapter, index) => {
      chapter.querySelector('.story-chapter-name').textContent = names[index];
      chapter.querySelector('.story-chapter-status').textContent = pending[lang] || pending.en;
      chapter.setAttribute('aria-pressed', String(index === selected));
    });
    status.textContent = `${names[selected]} · ${pending[lang] || pending.en}`;
  }
  chapters.forEach((chapter, index) => chapter.addEventListener('click', () => { selected = index; translate(); }));
  cover.addEventListener('click', () => {
    if (!dialog.showModal) return;
    dialog.showModal();
    document.documentElement.classList.add('story-reading');
  });
  dialog.querySelector('.story-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('story-reading'));
  new MutationObserver(translate).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  translate();
})();
