window.STORY_I18N = {
  zh: {
    skip:'跳到故事', home:'个人主页', storyName:'我的故事', all:'全部', tech:'技术博客', diary:'日记', search:'搜索',
    searchPlaceholder:'项目、城市或一个想法', searchLabel:'搜索故事与日志',
    emptyTitle:'还没有找到这一篇。', emptyHint:'试试其他关键词，或切换到「全部」。', reset:'清除筛选 ↗', waiting:'等待第一篇记录',
    accountType:'公众号 · 个人写作', wechatSummary1:'从一次面试问题出发，重新思考 RSI、AI Fear 和人的控制权。',
    wechatByline:'小朱还在想 · 公众号文章', readWechat:'在微信阅读全文 ↗', writingNotes:'最近的写作记录 ↗',
    writingDesk:'写作台 ↗', backHome:'返回主页 ↑', rssLabel:'订阅更新 · RSS',
    rssHelp:'用 RSS 阅读器订阅，新的项目与日常记录会自动出现在你的阅读器里。', rssLink:'打开订阅源 ↗'
  },
  en: {
    skip:'Skip to stories', home:'Home', storyName:'My story', all:'All', tech:'Building', diary:'Life notes', search:'Search',
    searchPlaceholder:'A project, city or idea', searchLabel:'Search stories and notes',
    emptyTitle:'No matching notes yet.', emptyHint:'Try another keyword or choose All.', reset:'Clear filters ↗', waiting:'The first note is on its way',
    accountType:'WeChat · Personal essays', wechatSummary1:'An interview question opens a reflection on RSI, AI Fear and human control.',
    wechatByline:'小朱还在想 · WeChat essays', readWechat:'Read on WeChat ↗', writingNotes:'Recent writing notes ↗',
    writingDesk:'Writing desk ↗', backHome:'Back to home ↑', rssLabel:'Follow updates · RSS',
    rssHelp:'Subscribe with an RSS reader to receive new project notes and journal entries in your reader.', rssLink:'Open the feed ↗'
  },
  fr: {
    skip:'Aller aux récits', home:'Accueil', storyName:'Mon histoire', all:'Tout', tech:'Projets', diary:'Au quotidien', search:'Rechercher',
    searchPlaceholder:'Un projet, une ville, une idée', searchLabel:'Rechercher dans les récits et notes',
    emptyTitle:'Aucune note trouvée.', emptyHint:'Essayez un autre mot-clé ou choisissez Tout.', reset:'Effacer les filtres ↗', waiting:'La première note arrive bientôt',
    accountType:'WeChat · Essais personnels', wechatSummary1:'Une question d’entretien ouvre une réflexion sur le RSI, AI Fear et le contrôle humain.',
    wechatByline:'小朱还在想 · Essais WeChat', readWechat:'Lire sur WeChat ↗', writingNotes:'Notes sur mon écriture ↗',
    writingDesk:'Atelier d’écriture ↗', backHome:'Retour à l’accueil ↑', rssLabel:'Suivre les nouveautés · RSS',
    rssHelp:'Abonnez-vous avec un lecteur RSS pour y recevoir mes nouvelles notes et mes récits.', rssLink:'Ouvrir le flux ↗'
  },
  es: {
    skip:'Ir a las historias', home:'Inicio', storyName:'Mi historia', all:'Todo', tech:'Proyectos', diary:'Diario', search:'Buscar',
    searchPlaceholder:'Un proyecto, una ciudad, una idea', searchLabel:'Buscar historias y notas',
    emptyTitle:'Todavía no hay notas que coincidan.', emptyHint:'Prueba otra palabra o elige Todo.', reset:'Borrar filtros ↗', waiting:'La primera nota está en camino',
    accountType:'WeChat · Ensayos personales', wechatSummary1:'Una pregunta de entrevista lleva a reflexionar sobre RSI, AI Fear y el control humano.',
    wechatByline:'小朱还在想 · Ensayos en WeChat', readWechat:'Leer en WeChat ↗', writingNotes:'Notas recientes de escritura ↗',
    writingDesk:'Taller de escritura ↗', backHome:'Volver al inicio ↑', rssLabel:'Seguir novedades · RSS',
    rssHelp:'Suscríbete con un lector RSS para recibir allí nuevas notas de proyectos y entradas del diario.', rssLink:'Abrir el canal ↗'
  }
};

// The listing and full articles share one translation source.
window.STORY_POST_TRANSLATIONS = Object.fromEntries((window.JOURNAL_POSTS || []).map(post => [post.slug, {
  zh:[post.title,post.summary],
  ...Object.fromEntries(Object.entries(post.translations || {}).map(([language,t]) => [language,[t.title,t.summary]]))
}]));
window.STORY_TAG_TRANSLATIONS = {
  '个人网站':{en:'Personal website',fr:'Site personnel',es:'Sitio personal'},
  '版本记录':{en:'Version history',fr:'Historique des versions',es:'Historial de versiones'},
  '成长':{en:'Growth',fr:'Parcours',es:'Crecimiento'},
  'AI 构建':{en:'Building with AI',fr:'Créer avec l’IA',es:'Crear con IA'},
  '多语言':{en:'Multilingual',fr:'Multilingue',es:'Multilingüe'},
  '公众号':{en:'WeChat',fr:'WeChat',es:'WeChat'}, '哲学':{en:'Philosophy',fr:'Philosophie',es:'Filosofía'},
  '写作':{en:'Writing',fr:'Écriture',es:'Escritura'}, '项目筹备':{en:'Preparation',fr:'Préparation',es:'Preparación'},
  '英语学习':{en:'English learning',fr:'Apprendre l’anglais',es:'Aprender inglés'}, 'AI 教育':{en:'AI education',fr:'IA et éducation',es:'IA y educación'},
  '产品开发':{en:'Product development',fr:'Développement produit',es:'Desarrollo de producto'}, 'AI 算力':{en:'AI compute',fr:'Calcul IA',es:'Cómputo de IA'},
  '知识工具':{en:'Knowledge tools',fr:'Outils de connaissance',es:'Herramientas de conocimiento'}, 'AI 销售':{en:'AI sales',fr:'Vente et IA',es:'Ventas e IA'},
  '产品设计':{en:'Product design',fr:'Design produit',es:'Diseño de producto'}, '工作流':{en:'Workflow',fr:'Processus',es:'Flujo de trabajo'},
  '飞书':{en:'Feishu',fr:'Feishu',es:'Feishu'}, '知识管理':{en:'Knowledge management',fr:'Gestion des connaissances',es:'Gestión del conocimiento'},
  '巴黎':{en:'Paris',fr:'Paris',es:'París'}, '习惯':{en:'Habits',fr:'Habitudes',es:'Hábitos'}, '英语教学':{en:'English teaching',fr:'Enseigner l’anglais',es:'Enseñar inglés'},
  '备课':{en:'Lesson preparation',fr:'Préparation des cours',es:'Preparación de clases'}, '旅行':{en:'Travel',fr:'Voyage',es:'Viajes'},
  '法国':{en:'France',fr:'France',es:'Francia'}, '里昂':{en:'Lyon',fr:'Lyon',es:'Lyon'}, '法语':{en:'French',fr:'Français',es:'Francés'},
  '跨语言':{en:'Across languages',fr:'Entre les langues',es:'Entre idiomas'}
};
