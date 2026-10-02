(() => {
  const button = document.getElementById('nav-menu');
  const links = document.getElementById('nav-links');
  function close() {links.classList.remove('is-open');button.setAttribute('aria-expanded','false');}
  button.addEventListener('click',()=>{const open=links.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));});
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&links.classList.contains('is-open')){close();button.focus();}});
  document.addEventListener('click',e=>{if(!document.getElementById('nav').contains(e.target))close();});
  window.addEventListener('resize',()=>{if(window.innerWidth>1120)close();});
})();
