(() => {
  const tabs = [...document.querySelectorAll('[data-story-tab]')];
  const panels = [...document.querySelectorAll('.story-panel')];
  const tabList = document.getElementById('story-tabs');
  if (tabs.length) {
    function activate(id, {navigate=false, focus=false}={}) {
      if (!tabs.some(tab => tab.dataset.storyTab === id)) id = 'journal';
      // Keep the tab controls in view if the previous panel was scrolled deeply.
      const tabsTop = document.querySelector('.story-hub-header').getBoundingClientRect().bottom + window.scrollY;
      const returnToTabs = navigate && window.scrollY > tabsTop;
      tabs.forEach(tab => {
        const selected = tab.dataset.storyTab === id;
        tab.setAttribute('aria-selected',String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus({preventScroll:true});
      });
      panels.forEach(panel => { panel.hidden = panel.id !== id; });
      if (navigate) {
        const next = new URL(location.href);
        next.hash = id;
        if (next.href !== location.href) history.pushState(null,'',next);
      }
      if (returnToTabs) window.scrollTo({top:tabsTop-12,behavior:'instant'});
    }
    tabs.forEach((tab,index) => {
      tab.addEventListener('click',() => activate(tab.dataset.storyTab,{navigate:true}));
      tab.addEventListener('keydown',event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        let next;
        if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
        if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length-1;
        if (next === undefined) return;
        event.preventDefault();
        activate(tabs[next].dataset.storyTab,{navigate:true,focus:true});
      });
    });
    const restore = () => activate(location.hash.slice(1));
    window.addEventListener('popstate',restore);
    window.addEventListener('hashchange',restore);
    restore();
  }
  try {
    const arrival = Number(sessionStorage.getItem('story-book-arrival'));
    sessionStorage.removeItem('story-book-arrival');
    if (arrival && Date.now()-arrival < 10000 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('story-arriving');
      setTimeout(() => document.documentElement.classList.remove('story-arriving'),650);
    }
  } catch {}
  const cover = document.querySelector('.story-cover');
  if (!cover) return;
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
})();
