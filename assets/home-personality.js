(() => {
  const names = { zh: 'Jiake Zhu', en: 'Jack Zhu', fr: 'Jake Zhu', es: 'Jacobo Zhu' };
  const copy = {
    zh: { title:'微信与公众号', close:'关闭', personal:'个人微信', id:'微信号', account:'公众号', search:'在微信搜索这个名称，关注我的写作。', read:'读公众号文章 ↗', copy:'复制', copyId:'复制微信号', copyAccount:'复制公众号名称', copied:'已复制', select:'请选中并复制', intro:'私信联系我，或读读我最近在想什么。' },
    en: { title:'WeChat & writing', close:'Close', personal:'Personal WeChat', id:'WeChat ID', account:'Official account', search:'Search this name in WeChat to follow my writing.', read:'Read my essays ↗', copy:'Copy', copyId:'Copy WeChat ID', copyAccount:'Copy account name', copied:'Copied', select:'Select and copy the text', intro:'Get in touch, or read what I have been thinking about.' },
    fr: { title:'WeChat & écriture', close:'Fermer', personal:'WeChat personnel', id:'Identifiant WeChat', account:'Compte officiel', search:'Recherchez ce nom sur WeChat pour suivre mes écrits.', read:'Lire mes articles ↗', copy:'Copier', copyId:'Copier l’identifiant WeChat', copyAccount:'Copier le nom du compte', copied:'Copié', select:'Sélectionnez et copiez le texte', intro:'Contactez-moi, ou découvrez mes réflexions du moment.' },
    es: { title:'WeChat y mis textos', close:'Cerrar', personal:'WeChat personal', id:'ID de WeChat', account:'Cuenta oficial', search:'Busca este nombre en WeChat para seguir mis textos.', read:'Leer mis artículos ↗', copy:'Copiar', copyId:'Copiar ID de WeChat', copyAccount:'Copiar nombre de la cuenta', copied:'Copiado', select:'Selecciona y copia el texto', intro:'Ponte en contacto o descubre mis últimas reflexiones.' }
  };
  let language = document.documentElement.lang;
  const lines = [...document.querySelectorAll('[data-hero-line]')];
  const roleBlock = document.querySelector('.hero-tagline');
  let active = 0, previous = -1, timer;
  function presentRole() {
    roleBlock.dataset.kind = lines[active].dataset.kind;
    roleBlock.dataset.tone = lines[active].dataset.tone;
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'wechat-contact';
  dialog.className = 'contact-dialog';
  dialog.setAttribute('aria-labelledby', 'contact-title');
  dialog.innerHTML = `<div class="contact-dialog-top"><h2 id="contact-title" data-contact-text="title"></h2><button class="contact-close" type="button">×</button></div>
    <p class="contact-intro" data-contact-text="intro"></p>
    <section class="contact-card"><p class="contact-card-label" data-contact-text="personal"></p>
      <label><span data-contact-text="id"></span><input id="contact-wechat-id" type="text" value="Acoolcopper" readonly></label>
      <button class="contact-copy" type="button" data-copy-from="contact-wechat-id" data-copy-label="copyId"></button>
    </section>
    <section class="contact-card contact-account"><img src="images/web/6e20cca2315e-160.webp" width="68" height="68" alt="" loading="lazy"><div><p class="contact-card-label" data-contact-text="account"></p>
      <input id="contact-account-name" class="contact-account-input" type="text" value="小朱还在想" readonly aria-label="小朱还在想"><p class="contact-signature">Start small and cast wide</p></div>
      <p class="contact-search" data-contact-text="search"></p>
      <div class="contact-account-actions"><button class="contact-copy" type="button" data-copy-from="contact-account-name" data-copy-label="copyAccount"></button><a href="story/index.html#wechat" data-contact-text="read"></a></div>
    </section><p class="contact-copy-status" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);
  let returnFocus;
  function localize() {
    const t = copy[language] || copy.en;
    dialog.querySelectorAll('[data-contact-text]').forEach(el => { el.textContent = t[el.dataset.contactText]; });
    dialog.querySelector('.contact-close').setAttribute('aria-label', t.close);
    dialog.querySelectorAll('.contact-copy').forEach(button => {
      button.textContent = t.copy;
      button.setAttribute('aria-label', t[button.dataset.copyLabel]);
    });
    const name = names[language] || names.en;
    document.querySelectorAll('[data-local-name]').forEach(el => {
      el.textContent = name;
    });
    document.querySelectorAll('a[href]').forEach(link => {
      const target = new URL(link.href);
      if(target.origin === location.origin && /\/(story|journal)\//.test(target.pathname)) {
        target.searchParams.set('lang',language);
        link.href=target.href;
      }
    });
    presentRole();
    document.title = name;
  }
  document.querySelectorAll('[data-open-wechat]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    returnFocus = link;
    dialog.querySelector('.contact-copy-status').textContent = '';
    dialog.showModal();
    document.documentElement.classList.add('contact-open');
  }));
  dialog.querySelector('.contact-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('contact-open');
    returnFocus?.focus({ preventScroll:true });
  });
  dialog.querySelectorAll('.contact-copy').forEach(button => button.addEventListener('click', async () => {
    const input = dialog.querySelector(`#${button.dataset.copyFrom}`);
    const t = copy[language] || copy.en;
    let copied = false;
    try { await navigator.clipboard.writeText(input.value); copied = true; }
    catch (_) { input.focus(); input.select(); try { copied = document.execCommand('copy'); } catch (_) {} }
    dialog.querySelector('.contact-copy-status').textContent = copied ? t.copied : t.select;
  }));
  document.addEventListener('jiake:languagechange', e => { language = e.detail.language; localize(); });
  localize();

  function displayLines() {
    lines.forEach((line, index) => {
      line.classList.toggle('is-active', index === active);
      line.classList.toggle('is-exiting', index === previous && index !== active);
      line.setAttribute('aria-hidden', String(index !== active));
    });
    presentRole();
  }
  function advance() {
    previous = active;
    active = (active + 1) % lines.length;
    displayLines();
  }
  function runCycle() {
    clearInterval(timer);
    displayLines();
    if (!document.hidden && !roleBlock.matches(':hover')) timer = setInterval(() => {
      if (document.documentElement.classList.contains('intro-playing')) return;
      advance();
    }, 3200);
  }
  roleBlock.addEventListener('pointerenter', () => clearInterval(timer));
  roleBlock.addEventListener('pointerleave', runCycle);
  document.addEventListener('visibilitychange', runCycle);
  runCycle();
})();
