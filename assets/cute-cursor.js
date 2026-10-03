(() => {
  function init() {
    if (document.getElementById('cute-cursor')) return;
    const desktop = matchMedia('(hover: hover) and (pointer: fine)');
    const cursor = document.createElement('div');
    cursor.id = 'cute-cursor';cursor.className = 'cute-cursor';cursor.setAttribute('aria-hidden','true');
    cursor.innerHTML = '<svg class="cute-cursor-character" viewBox="0 0 36 36" aria-hidden="true"><path class="cute-cursor-star" d="M17.2 3.3C18 2.7 19 3.1 19.4 4.2L22.1 11.3C22.3 11.9 22.7 12.3 23.3 12.5L30.3 15.1C32 15.7 32 17.3 30.3 18L23.3 20.8C22.7 21 22.3 21.4 22.1 22L19.3 29.4C18.7 31 17 31 16.4 29.4L13.7 22C13.5 21.4 13.1 21 12.5 20.8L5.3 18C3.6 17.3 3.6 15.7 5.3 15.1L12.5 12.5C13.1 12.3 13.5 11.9 13.7 11.3L16.4 4.2C16.6 3.8 16.8 3.5 17.2 3.3Z"/><ellipse class="cute-cursor-cheek" cx="12.4" cy="18.6" rx="2" ry="1.2"/><ellipse class="cute-cursor-cheek" cx="23.3" cy="18.6" rx="2" ry="1.2"/><g class="cute-cursor-face"><ellipse class="cute-cursor-eye" cx="14.5" cy="16.3" rx=".9" ry="1.25"/><ellipse class="cute-cursor-eye" cx="21.2" cy="16.3" rx=".9" ry="1.25"/></g><path class="cute-cursor-smile" d="M16.2 19Q17.8 21 19.5 19"/><path class="cute-cursor-spark" d="M30.7 3L31.7 5.8L34.5 6.8L31.7 7.8L30.7 10.6L29.7 7.8L26.9 6.8L29.7 5.8Z"/></svg>';
    document.body.append(cursor);
    const nativeZone = 'input,textarea,select,[contenteditable="true"],iframe,dialog,.leaflet-container,[data-native-cursor]';
    const clickable = 'a[href],button,summary,[role="button"],[role="checkbox"],[onclick],label[for]';
    let x=0,y=0,frame=0,seen=false;
    function hide() {
      seen=false;cancelAnimationFrame(frame);frame=0;
      cursor.classList.remove('is-visible','is-hovering','is-pressed');
      document.documentElement.classList.remove('cute-cursor-active');
    }
    function render() {
      frame=0;
      if (!desktop.matches || !seen || document.hidden) return hide();
      const target = document.elementFromPoint(x,y);
      if (!target || target.closest(nativeZone)) {
        cursor.classList.remove('is-visible','is-hovering','is-pressed');
        document.documentElement.classList.remove('cute-cursor-active');
        return;
      }
      cursor.style.transform=`translate3d(${x-18}px,${y-18}px,0)`;
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-hovering',Boolean(target.closest(clickable)));
      document.documentElement.classList.add('cute-cursor-active');
    }
    function queue() {if(!frame) frame=requestAnimationFrame(render);}
    document.addEventListener('pointermove',event => {
      if (event.pointerType !== 'mouse' || !desktop.matches) return hide();
      x=event.clientX;y=event.clientY;seen=true;queue();
    },{passive:true});
    document.addEventListener('pointerover',event => {
      if(event.pointerType==='mouse' && seen){x=event.clientX;y=event.clientY;queue();}
    },{passive:true});
    document.addEventListener('pointerdown',event => {
      if(event.pointerType==='mouse' && cursor.classList.contains('is-visible')) cursor.classList.add('is-pressed');
    },{passive:true});
    document.addEventListener('pointerup',() => cursor.classList.remove('is-pressed'),{passive:true});
    document.addEventListener('pointercancel',hide,{passive:true});
    document.documentElement.addEventListener('pointerleave',hide,{passive:true});
    document.addEventListener('keydown',event => {if(event.key==='Tab') hide();});
    document.addEventListener('visibilitychange',hide);
    addEventListener('blur',hide);addEventListener('pagehide',hide);
    addEventListener('scroll',() => {if(seen) queue();},{passive:true});
    desktop.addEventListener('change',hide);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
