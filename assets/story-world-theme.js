// Story-only reading palette. The homepage's theme loader remains unchanged.
(() => {
  try{document.documentElement.dataset.theme=localStorage.getItem('jiake-theme')==='light'?'light':'dark';}catch{document.documentElement.dataset.theme='dark';}
  document.addEventListener('DOMContentLoaded',()=>{
    const nav=document.querySelector('.story-nav');if(!nav)return;
    const button=document.createElement('button');button.type='button';button.className='theme-toggle';
    const refresh=()=>{const light=document.documentElement.dataset.theme==='light';button.textContent=light?'☾':'☀';button.setAttribute('aria-label',light?'深色阅读 / Dark reading':'浅色阅读 / Light reading');};
    button.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;try{localStorage.setItem('jiake-theme',theme);}catch{}refresh();});nav.append(button);refresh();
  });
})();
