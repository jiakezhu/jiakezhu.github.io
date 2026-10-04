(() => {
  const copy=window.COMIC_LANGUAGE;
  const text=key=>copy.text(key);
  const pages = [...document.querySelectorAll('[data-comic-page]')];
  if (!pages.length) return;
  const select = document.getElementById('comic-page-select');
  const counter = document.getElementById('comic-counter');
  const progress = document.querySelector('.comic-progress>span');
  const chapterLinks = [...document.querySelectorAll('[data-comic-chapter]')];
  const arrows = [...document.querySelectorAll('[data-comic-direction]')];
  const resume = document.getElementById('comic-resume');
  const status = document.getElementById('comic-status');
  const lastPageKey = 'jiake-comic-last-page';
  let current = 1;
  const fromHash = () => {
    const match = /^#page-(\d{1,2})$/.exec(location.hash);
    return match ? Math.max(1,Math.min(pages.length,Number(match[1]))) : 1;
  };
  function unloadArtwork(page) {
    page.querySelectorAll('source[srcset]').forEach(source => {
      source.dataset.srcset = source.getAttribute('srcset');
      source.removeAttribute('srcset');
    });
    page.querySelectorAll('img[src]').forEach(image => {
      image.dataset.src = image.getAttribute('src');
      image.removeAttribute('src');
    });
  }
  function loadArtwork(page) {
    page.querySelectorAll('source[data-srcset]').forEach(source => {
      source.srcset = source.dataset.srcset;
      source.removeAttribute('data-srcset');
    });
    page.querySelectorAll('img[data-src]').forEach(image => {
      // All visible frames share one atlas, so load that selected page together.
      image.loading = 'eager';
      if (!image.dataset.errorWatched) {
        image.addEventListener('error',() => {
          if (!page.hidden) status.textContent = text('loadError');
        });
        image.dataset.errorWatched = 'true';
      }
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    });
  }
  function showPage(number,{navigate=false,focus=false}={}) {
    current = Math.max(1,Math.min(pages.length,Number(number)||1));
    pages.forEach(page => {
      page.hidden = Number(page.dataset.comicPage) !== current;
      if (page.hidden) unloadArtwork(page);
    });
    const page = pages[current-1];
    loadArtwork(page);
    select.value = String(current);
    counter.textContent = `${String(current).padStart(2,'0')} / ${pages.length}`;
    progress.style.width = `${current/pages.length*100}%`;
    arrows.forEach(button => { button.disabled = button.dataset.comicDirection === 'previous' ? current === 1 : current === pages.length; });
    chapterLinks.forEach(link => {
      const active = current >= Number(link.dataset.start) && current <= Number(link.dataset.end);
      if (active) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current');
    });
    if (navigate) {
      const next = new URL(location.href);
      next.hash = `page-${String(current).padStart(2,'0')}`;
      if (next.href !== location.href) history.pushState(null,'',next);
    }
    try { localStorage.setItem(lastPageKey,String(current)); } catch {}
    refreshStatus();
    if (focus) {
      const heading = page.querySelector('h2');
      heading.focus({preventScroll:true});
      page.scrollIntoView({block:'start',behavior:'instant'});
    }
    if (resume && navigate) resume.hidden = true;
  }
  document.querySelectorAll('[data-comic-go]').forEach(link => link.addEventListener('click',event => {
    event.preventDefault();
    showPage(link.dataset.comicGo,{navigate:true,focus:true});
  }));
  select.addEventListener('change',() => showPage(select.value,{navigate:true,focus:true}));
  arrows.forEach(button => button.addEventListener('click',() => showPage(current+(button.dataset.comicDirection === 'next'?1:-1),{navigate:true,focus:true})));
  document.addEventListener('keydown',event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.key === 'ArrowRight' && current < pages.length) { event.preventDefault(); showPage(current+1,{navigate:true,focus:true}); }
    if (event.key === 'ArrowLeft' && current > 1) { event.preventDefault(); showPage(current-1,{navigate:true,focus:true}); }
  });
  window.addEventListener('popstate',() => showPage(fromHash(),{focus:true}));
  window.addEventListener('hashchange',() => showPage(fromHash(),{focus:true}));
  let saved = 1;
  try { saved = Number(localStorage.getItem(lastPageKey)) || 1; } catch {}
  function refreshStatus() {
    status.textContent=copy.format('pageStatus',{page:current,total:pages.length,title:pages[current-1].querySelector('h2').textContent});
  }
  function refreshResume() {
    if(resume&&!resume.hidden) resume.textContent=copy.format('resume',{page:String(saved).padStart(2,'0')});
  }
  if (resume && !location.hash && saved > 1 && saved <= pages.length) {
    resume.hidden = false;
    refreshResume();
    resume.addEventListener('click',() => showPage(saved,{navigate:true,focus:true}));
  }
  showPage(fromHash());
  document.addEventListener('jiake:languagechange',()=>{refreshStatus();refreshResume();});
})();
