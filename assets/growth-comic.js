(() => {
  const edition=Number(document.body.dataset.comicEdition)||1;
  const pages=[...document.querySelectorAll('[data-comic-page]')];
  const total=pages.length || Number(document.body.dataset.comicTotal)||1;
  const legacyPages=[2,2,2,3,3,4,4,5,4,5,5,8,6,6,7,8];
  const restoredPages=[13,1,4,6,8,14,15,16];
  const lastPageKey=edition===2 ? 'jiake-comic-v2-last-page' : 'jiake-comic-last-page';
  const bound=value=>Math.max(1,Math.min(total,Number(value)||1));
  const pageHash=number=>`page-${String(number).padStart(2,'0')}`;
  function fromLocation() {
    const url=new URL(location.href);
    const match=/^#page-?(\d+)$/.exec(url.hash);
    const original=match ? Number(match[1]) : 1;
    const legacy=edition===2 && url.searchParams.get('edition')!=='2';
    const restored=edition===1 && url.searchParams.get('edition')==='2';
    const number=bound(restored && match && original>=1 && original<=restoredPages.length ? restoredPages[original-1] : legacy && match && original>=1 && original<=legacyPages.length ? legacyPages[original-1] : original);
    if(edition===2) {
      url.searchParams.set('edition','2');
      if(match) url.hash=pageHash(number);
      if(url.href!==location.href) history.replaceState(null,'',url);
    } else if(restored) {
      url.searchParams.delete('edition');
      if(match) url.hash=pageHash(number);
      history.replaceState(null,'',url);
    }
    return number;
  }
  const initial=fromLocation();
  if(!pages.length) {
    if(location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
    return;
  }
  const copy=window.COMIC_LANGUAGE;
  const select=document.getElementById('comic-page-select');
  const counter=document.getElementById('comic-counter');
  const progress=document.querySelector('.comic-progress>span');
  const chapterLinks=[...document.querySelectorAll('[data-comic-chapter]')];
  const arrows=[...document.querySelectorAll('[data-comic-direction]')];
  const resume=document.getElementById('comic-resume');
  const status=document.getElementById('comic-status');
  let current=1;
  function unloadArtwork(page) {
    page.querySelectorAll('source[srcset]').forEach(source=>{
      source.dataset.srcset=source.getAttribute('srcset');
      source.removeAttribute('srcset');
    });
    page.querySelectorAll('img[src]').forEach(image=>{
      image.dataset.src=image.getAttribute('src');
      image.removeAttribute('src');
    });
  }
  function loadArtwork(page) {
    page.querySelectorAll('source[data-srcset]').forEach(source=>{
      source.srcset=source.dataset.srcset;
      source.removeAttribute('data-srcset');
    });
    page.querySelectorAll('img[data-src]').forEach(image=>{
      image.loading='eager';
      if(!image.dataset.errorWatched) {
        image.addEventListener('error',()=>{if(!page.hidden) status.textContent=copy.text('loadError');});
        image.dataset.errorWatched='true';
      }
      image.src=image.dataset.src;
      image.removeAttribute('data-src');
    });
  }
  function refreshStatus() {
    status.textContent=copy.format('pageStatus',{page:current,total,title:pages[current-1].querySelector('h2').textContent});
  }
  function showPage(number,{navigate=false,focus=false,persist=true}={}) {
    current=bound(number);
    pages.forEach(page=>{
      page.hidden=Number(page.dataset.comicPage)!==current;
      if(page.hidden) unloadArtwork(page);
    });
    const page=pages[current-1];
    loadArtwork(page);
    select.value=String(current);
    counter.textContent=`${String(current).padStart(2,'0')} / ${total}`;
    progress.style.width=`${current/total*100}%`;
    arrows.forEach(button=>{button.disabled=button.dataset.comicDirection==='previous' ? current===1 : current===total;});
    chapterLinks.forEach(link=>{
      if(current>=Number(link.dataset.start) && current<=Number(link.dataset.end)) link.setAttribute('aria-current','true');
      else link.removeAttribute('aria-current');
    });
    if(navigate) {
      const next=new URL(location.href);
      if(edition===2) next.searchParams.set('edition','2');
      next.hash=pageHash(current);
      if(next.href!==location.href) history.pushState(null,'',next);
    }
    if(persist) {try {localStorage.setItem(lastPageKey,String(current));} catch {}}
    refreshStatus();
    if(focus) {
      page.querySelector('h2').focus({preventScroll:true});
      page.scrollIntoView({block:'start',behavior:'instant'});
    }
    if(resume && navigate) resume.hidden=true;
  }
  document.querySelectorAll('[data-comic-go]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();showPage(link.dataset.comicGo,{navigate:true,focus:true});
  }));
  select.addEventListener('change',()=>showPage(select.value,{navigate:true,focus:true}));
  arrows.forEach(button=>button.addEventListener('click',()=>showPage(current+(button.dataset.comicDirection==='next'?1:-1),{navigate:true,focus:true})));
  document.addEventListener('keydown',event=>{
    if(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if(event.key==='ArrowRight' && current<total) {event.preventDefault();showPage(current+1,{navigate:true,focus:true});}
    if(event.key==='ArrowLeft' && current>1) {event.preventDefault();showPage(current-1,{navigate:true,focus:true});}
  });
  function followLocation() {
    // Skip links and other document anchors must not reset the reader's page.
    if(location.hash && !/^#page-?\d+$/.test(location.hash)) return;
    showPage(fromLocation(),{focus:true});
  }
  window.addEventListener('popstate',followLocation);
  window.addEventListener('hashchange',followLocation);
  let saved=1;
  try {
    const stored=Number(localStorage.getItem(lastPageKey));
    if(Number.isInteger(stored) && stored>=1 && stored<=total) saved=stored;
    else if(edition===2 && !location.hash) {
      const legacy=Number(localStorage.getItem('jiake-comic-last-page'));
      if(Number.isInteger(legacy) && legacy>=1 && legacy<=legacyPages.length) {
        saved=bound(legacyPages[legacy-1]);
        localStorage.setItem(lastPageKey,String(saved));
      }
    }
  } catch {}
  function refreshResume() {
    if(resume && !resume.hidden) resume.textContent=copy.format('resume',{page:String(saved).padStart(2,'0')});
  }
  if(resume && !location.hash && saved>1) {
    resume.hidden=false;refreshResume();
    resume.addEventListener('click',()=>showPage(saved,{navigate:true,focus:true}));
  }
  showPage(initial,{persist:Boolean(location.hash)});
  document.addEventListener('jiake:languagechange',()=>{refreshStatus();refreshResume();});
})();
