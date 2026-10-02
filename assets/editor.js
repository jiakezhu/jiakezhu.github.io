(() => {
  const form = document.getElementById('editor-form');
  const status = document.getElementById('editor-status');
  const fields = ['title','category','date','summary','tags','slug','content'];
  const key = 'jiake-journal-draft-v1';
  const md = window.markdownit({html:false,linkify:true,typographer:true});
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let timer;
  const data = () => Object.fromEntries(fields.map(f => [f,form.elements[f].value]));
  function preview() { document.getElementById('preview-title').textContent = form.elements.title.value || '一个想法的开始'; document.getElementById('preview-body').innerHTML = md.render(form.elements.content.value || '你的文字，会出现在这里。'); }
  function save() { try {localStorage.setItem(key,JSON.stringify(data()));status.textContent='已保存到当前浏览器 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});} catch {status.textContent='浏览器存储不可用，请导出文件保存。';} }
  function fill(values) { fields.forEach(f=>form.elements[f].value = typeof values[f] === 'string' ? values[f] : '');form.elements.category.value = values.category === 'diary' ? 'diary' : 'tech';form.elements.date.value ||= today;preview(); }
  try { fill(JSON.parse(localStorage.getItem(key) || '{}')); } catch { fill({});status.textContent='无法读取本机草稿，请导出文件保存。'; }
  form.addEventListener('input',()=>{preview();clearTimeout(timer);timer=setTimeout(save,600);});
  document.getElementById('save-draft').addEventListener('click',()=>{clearTimeout(timer);save();});
  document.getElementById('new-draft').addEventListener('click',()=>{if ((form.elements.title.value || form.elements.content.value) && !confirm('新建会覆盖当前本机草稿。请先导出需要保留的文字，继续吗？')) return;fill({});save();form.elements.title.focus();});
  form.addEventListener('submit',e=>{
    e.preventDefault();if (!form.reportValidity()) return;
    const p = data(); const tags = p.tags.split(/[,，]/).map(t=>t.trim()).filter(Boolean);
    const source = ['---',`title: ${JSON.stringify(p.title)}`,`date: ${JSON.stringify(p.date)}`,`category: ${p.category}`,`tags: ${JSON.stringify(tags)}`,`summary: ${JSON.stringify(p.summary)}`,`slug: ${p.slug}`,'draft: true','---','',p.content,''].join('\n');
    const url=URL.createObjectURL(new Blob([source],{type:'text/markdown;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`${p.slug}.md`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);save();status.textContent='已导出草稿 · 发布前将 draft 改为 false';
  });
  document.getElementById('import-post').addEventListener('change',async e=>{
    const file = e.target.files[0];if (!file) return;
    try {
      if (file.size > 1024*1024) throw new Error('文件超过 1 MB');
      const source = await file.text();const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) throw new Error('需要带有 YAML 文件头的 Markdown');
      const values={content:match[2].trim(),slug:file.name.replace(/\.md$/,'')};
      for (const line of match[1].split(/\r?\n/)) {
        const m=line.match(/^(title|date|category|summary|tags|slug):\s*(.*)$/);if (!m) continue;
        let value=m[2].trim();
        if (value.startsWith('"') || value.startsWith('[')) value=JSON.parse(value);
        else if (value.startsWith("'") && value.endsWith("'")) value=value.slice(1,-1).replaceAll("''", "'");
        if (m[1]==='tags' && Array.isArray(value)) value=value.join(', ');
        if (typeof value !== 'string') throw new Error('此写作台支持单行字段及数组标签');
        values[m[1]]=value;
      }
      if ((form.elements.title.value || form.elements.content.value) && !confirm('导入会覆盖当前本机草稿。请先导出需要保留的文字，继续吗？')) return;
      fill(values);save();status.textContent='已导入 · '+file.name;
    } catch(error) { status.textContent='导入失败：'+error.message; } finally {e.target.value='';}
  });
})();
