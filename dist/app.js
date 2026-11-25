(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hero entrance */
  requestAnimationFrame(() => requestAnimationFrame(() => $('.hero').classList.add('ready')));

  /* integrity grid: scattered parts assemble into a whole */
  const grid = $('#whole');
  const N = 25, teal = [6, 12, 18], dim = [3, 10, 21];
  const tiles = Array.from({ length: N }, (_, i) => {
    const t = document.createElement('i');
    t.className = 'tile' + (teal.includes(i) ? ' t' : dim.includes(i) ? ' t2' : '');
    grid.append(t);
    return t;
  });
  const rnd = (a, b) => a + Math.random() * (b - a);
  const scatter = (k = 1) => tiles.forEach(t => {
    t.style.setProperty('--x', rnd(-90, 90) * k + '%');
    t.style.setProperty('--y', rnd(-90, 90) * k + '%');
    t.style.setProperty('--r', rnd(-45, 45) * k + 'deg');
    t.style.setProperty('--s', 1 - rnd(.1, .4) * k);
  });
  const assemble = () => tiles.forEach((t, i) => {
    t.style.transitionDelay = reduce ? '0s' : (i % 5 + Math.floor(i / 5)) * 35 + 'ms';
    ['--x', '--y', '--r', '--s'].forEach(p => t.style.removeProperty(p));
  });
  if (!reduce) {
    scatter(1.6);
    setTimeout(assemble, 350);
    let busy = false;
    grid.addEventListener('pointermove', e => {
      if (busy || e.pointerType !== 'mouse') return;
      const g = grid.getBoundingClientRect();
      grid.classList.add('loose');
      tiles.forEach(t => {
        const r = t.getBoundingClientRect();
        const dx = (r.left + r.width / 2 - e.clientX) / g.width, dy = (r.top + r.height / 2 - e.clientY) / g.height;
        const d = Math.hypot(dx, dy), f = Math.max(0, .32 - d) / .32;
        t.style.transitionDelay = '0s';
        t.style.setProperty('--x', dx / (d || 1) * f * 40 + '%');
        t.style.setProperty('--y', dy / (d || 1) * f * 40 + '%');
        t.style.setProperty('--r', dx * f * 60 + 'deg');
      });
    });
    grid.addEventListener('pointerleave', () => { grid.classList.remove('loose'); assemble(); });
    grid.addEventListener('click', () => {
      if (busy) return;
      busy = true; grid.classList.remove('loose');
      tiles.forEach(t => (t.style.transitionDelay = '0s'));
      scatter(1.1);
      setTimeout(() => { assemble(); busy = false; }, 650);
    });
  }

  /* nav: hide on scroll down, dark mode over dark sections, current link */
  const nav = $('#nav'), toggle = $('.menu-toggle'), mobile = $('#mobile-nav');
  const darks = $$('[data-nav-dark]');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    if (!mobile.hidden) { lastY = y; return; }
    nav.classList.toggle('hide', y > 240 && y > lastY + 2);
    if (y < lastY - 2 || y < 240) nav.classList.remove('hide');
    lastY = y;
    const probe = 40;
    nav.classList.toggle('on-dark', darks.some(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; }));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = $$('.nav-links a');
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('current', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.hash); s && secObs.observe(s); });

  const closeMenu = () => { mobile.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = mobile.hidden;
    mobile.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.remove('hide');
  });
  $$('a', mobile).forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mobile.hidden) { closeMenu(); toggle.focus(); } });

  /* reveal */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el, i) => {
    if (el.classList.contains('case')) el.style.transitionDelay = (i % 3) * 90 + 'ms';
    io.observe(el);
  });

  /* product tabs */
  const tabs = $$('[role="tab"]');
  const select = tab => tabs.forEach(t => {
    const on = t === tab, panel = $('#' + t.getAttribute('aria-controls'));
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    panel.hidden = !on;
    if (on) { panel.classList.add('in'); panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = tabs[(i + d + tabs.length) % tabs.length];
      select(n); n.focus();
    });
  });

  /* services: one open at a time (fallback for browsers without details[name]) */
  const services = $$('.service');
  services.forEach(s => s.addEventListener('toggle', () => {
    if (s.open) services.forEach(o => o !== s && (o.open = false));
  }));

  /* stack: highlight the same technology across groups */
  const stack = $('.stack-grid');
  const key = li => li.textContent.trim().toLowerCase();
  const items = $$('li', stack);
  const hit = li => {
    const k = key(li);
    stack.classList.add('focus');
    items.forEach(x => x.classList.toggle('hit', key(x) === k));
    $$('.stack-col', stack).forEach(c => c.classList.toggle('has', $$('li', c).some(x => key(x) === k)));
  };
  const clear = () => { stack.classList.remove('focus'); items.forEach(x => x.classList.remove('hit')); };
  items.forEach(li => {
    li.tabIndex = 0;
    li.addEventListener('pointerenter', () => hit(li));
    li.addEventListener('focus', () => hit(li));
    li.addEventListener('blur', clear);
  });
  stack.addEventListener('pointerleave', clear);

  /* project dialog */
  const cases = [
    ['p-tender', 'Public · e-commerce · tender', 'Торговая электронная площадка', 'Торговая интернет-площадка по реализации имущества банкротов на конкурсной основе. Процедуры электронной торговли осуществляются с использованием верифицированной электронной подписи участников.'],
    ['p-analytics', 'Управление · производство · аналитика', 'Интеграционная аналитическая платформа', 'Интеграционная платформа для оперативного управления организацией в веб-среде, а также на мобильной платформе в on/off-line режиме. Информация комбинируется на основе данных транзакционных систем и хранилищ данных организации.'],
    ['p-opengov', 'Открытые данные · открытое правительство · общество', 'Открытое правительство региона', 'Портал «Открытое правительство Ярославской области» объединяет знания и движущие силы государства, граждан, экспертов и бизнеса в формировании единых правовых решений по развитию региона.'],
    ['p-office', 'Электронный менеджмент · мобильный офис', 'Электронный офис руководителя', 'Система для распределённого планирования и централизованного управления в организации. Модуль мобильного приложения обеспечивает руководителя инструментами управления даже вне связи с офисом.'],
    ['p-startup', 'Акселерация стартапов · краудсорсинг знаний · инвестиции', 'Start-up акселератор', 'Система для регистрации, оценки, экспертного консультирования, рейтингования и инвестирования в эффективные стартап-проекты.'],
    ['p-secretary', 'Расписание · контроль присутствия · рабочее место', 'Электронный секретарь', 'Электронный секретарь контролирует присутствие на рабочем месте. Периоды отсутствия и присутствия динамически отображаются в инфографике. Возможен контроль от одного до нескольких сотен человек.']
  ];
  const dlg = $('#case-dialog');
  let cur = 0, opener = null;
  const show = i => {
    cur = (i + cases.length) % cases.length;
    const [img, tags, title, text] = cases[cur];
    const im = $('#cd-img');
    im.src = `assets/img/${img}.webp`; im.alt = title;
    $('#cd-tags').textContent = tags; $('#cd-title').textContent = title; $('#cd-text').textContent = text;
    $('#cd-count').textContent = `${String(cur + 1).padStart(2, '0')} / ${String(cases.length).padStart(2, '0')}`;
  };
  $$('.case').forEach(b => b.addEventListener('click', () => { opener = b; show(+b.dataset.case); dlg.showModal(); }));
  $$('[data-step]', dlg).forEach(b => b.addEventListener('click', () => show(cur + +b.dataset.step)));
  $('.cd-close', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
  dlg.addEventListener('close', () => opener && opener.focus());

  /* brief form */
  const form = $('#brief');
  const labels = { task: 'Коротко о задаче', sp: 'Что хотите узнать о SP-PublicProjects', inteldoc: 'Что хотите узнать об ИнтелДок', team: 'Какие разработчики и компетенции нужны' };
  const subjects = { task: 'Задача для Интегрити', sp: 'Вопрос о SP-PublicProjects', inteldoc: 'Вопрос об ИнтелДок', team: 'Разработчики в команду' };
  const topic = () => form.topic.value;
  const syncTopic = () => ($('#f-msg-label').textContent = labels[topic()]);
  $$('input[name="topic"]', form).forEach(r => r.addEventListener('change', syncTopic));
  $$('[data-topic]').forEach(a => a.addEventListener('click', () => {
    const r = $(`input[name="topic"][value="${a.dataset.topic}"]`, form);
    r.checked = true; syncTopic();
  }));
  const fields = [['name', 'e-name'], ['contact', 'e-contact'], ['msg', 'e-msg']];
  const valid = () => {
    let first = null;
    fields.forEach(([n, e]) => {
      const el = form[n], bad = !el.value.trim();
      el.setAttribute('aria-invalid', String(bad));
      $('#' + e).hidden = !bad;
      if (bad && !first) first = el;
    });
    first && first.focus();
    return !first;
  };
  fields.forEach(([n, e]) => form[n].addEventListener('input', () => {
    if (form[n].value.trim()) { form[n].removeAttribute('aria-invalid'); $('#' + e).hidden = true; }
  }));
  const text = () => `${subjects[topic()]}\n\nИмя и компания: ${form.name.value.trim()}\nКонтакт: ${form.contact.value.trim()}\n\n${labels[topic()]}:\n${form.msg.value.trim()}`;
  const note = $('#form-note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!valid()) return;
    location.href = `mailto:info@integrity.ru?subject=${encodeURIComponent(subjects[topic()])}&body=${encodeURIComponent(text())}`;
    note.textContent = 'Открываем почту. Если ничего не произошло — скопируйте текст и отправьте на info@integrity.ru.';
  });
  $('#copy-brief').addEventListener('click', async () => {
    if (!valid()) return;
    try { await navigator.clipboard.writeText(text()); note.textContent = 'Текст скопирован — отправьте его на info@integrity.ru или позвоните +7 (495) 363-68-80.'; }
    catch { note.textContent = 'Не удалось скопировать автоматически — выделите текст в полях вручную.'; }
  });
})();
