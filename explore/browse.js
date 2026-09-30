(() => {
  const catalog = JSON.parse(document.getElementById('catalog').textContent);
  const cards = [...document.querySelectorAll('.work')];
  const filters = [...document.querySelectorAll('.filter')];
  const input = document.getElementById('search');
  const count = document.getElementById('work-count');
  const note = document.getElementById('capability-note');
  let selected = 'all';
  function update() {
    const terms = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const work = catalog.works.find(work => work.id === card.id);
      const text = [work.title, work.creator, work.summary, ...work.demonstrates, ...work.capabilities.map(id => catalog.capabilities.find(item => item.id === id).title)].join(' ').toLocaleLowerCase();
      card.hidden = !(selected === 'all' || work.capabilities.includes(selected)) || !terms.every(term => text.includes(term));
      if (!card.hidden) visible++;
    }
    count.textContent = `${visible} ${visible === 1 ? 'work' : 'works'}`;
    document.getElementById('empty').hidden = visible !== 0;
    note.textContent = selected === 'all' ? 'A selection of public Cohub Apps, Boards and media.' : catalog.capabilities.find(item => item.id === selected).description;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.capability === selected)));
  }
  filters.forEach(button => button.addEventListener('click', () => { selected = button.dataset.capability; update(); }));
  input.addEventListener('input', update);
  document.getElementById('reset').addEventListener('click', () => { selected = 'all'; input.value = ''; update(); input.focus(); });
  const query = new URLSearchParams(location.search);
  if (catalog.capabilities.some(item => item.id === query.get('capability'))) selected = query.get('capability');
  input.value = query.get('q') || '';
  update();
})();
