let items = [];
const DEPTH_MIN = 0;
const DEPTH_MAX = 4000;
const factBands = [
  {min:0, max:50, text:"Most marine life lives in the top 50 m where light is strongest."},
  {min:200, max:400, text:"Around 200 m, daylight fades. This is the start of the twilight zone."},
  {min:800, max:1200, text:"At 800 to 1200 m, it is near freezing with very little light."},
  {min:2000, max:4000, text:"The abyss. High pressure. Few species have adapted to survive here."}
];

// Museum lift and reference markers
const LIFT = {
  height_m: 12,
  floors: [
    { label: 'G', depth: 0 },
    { label: '1', depth: 4 },
    { label: '2', depth: 8 },
    { label: '3', depth: 12 }
  ]
};

const REFERENCES = [
  { label: 'Blue whale ~30 m', depth: 30, type: 'animal' },
  { label: 'Scuba limit ~40 m', depth: 40, type: 'human' },
  { label: 'Eiffel Tower 324 m', depth: 324, type: 'structure' },
  { label: 'Burj Khalifa 828 m', depth: 828, type: 'structure' },
  { label: 'Sperm whale dive ~2000 m', depth: 2000, type: 'animal' },
  { label: 'Titanic wreck ~3800 m', depth: 3800, type: 'ship' }
];

async function loadData(){
  const res = await fetch('data/species.json');
  items = await res.json();
}

function yToDepth(y, trackEl){
  const rect = trackEl.getBoundingClientRect();
  const t = Math.min(1, Math.max(0, (y - rect.top) / rect.height));
  return Math.round(DEPTH_MIN + t * (DEPTH_MAX - DEPTH_MIN));
}

function renderRefs(){
  const liftRail = document.getElementById('liftRail');
  const refRail = document.getElementById('refRail');
  const track = document.getElementById('track');
  const rect = track.getBoundingClientRect();
  const h = rect.height;
  liftRail.innerHTML = '';
  refRail.innerHTML = '';

  for(const f of LIFT.floors){
    const y = (f.depth-DEPTH_MIN)/(DEPTH_MAX-DEPTH_MIN) * h;
    const el = document.createElement('div');
    el.className = 'lift-marker';
    el.style.top = y + 'px';
    el.innerHTML = `<span class="tick"></span><span class="label">${f.label}</span>`;
    liftRail.appendChild(el);
  }
  for(const r of REFERENCES){
    if(r.depth < DEPTH_MIN || r.depth > DEPTH_MAX) continue;
    const y = (r.depth-DEPTH_MIN)/(DEPTH_MAX-DEPTH_MIN) * h;
    const el = document.createElement('div');
    el.className = 'ref-marker';
    el.style.top = y + 'px';
    el.innerHTML = `<div class="rule"></div><span class="tag">${r.label}</span>`;
    refRail.appendChild(el);
  }
}

function renderCards(depth, q, group){
  const list = document.getElementById('cards');
  list.innerHTML = '';
  const query = (q||'').toLowerCase();
  let filtered = items.filter(i => {
    const hitDepth = i.depth_min_m <= depth && i.depth_max_m >= depth;
    const hitGroup = group ? i.group === group : true;
    const text = (i.common_name + ' ' + (i.summary||'')).toLowerCase();
    const hitQuery = query ? text.includes(query) || (''+i.depth_min_m).includes(query) || (''+i.depth_max_m).includes(query) : true;
    return hitDepth && hitGroup && hitQuery;
  });
  for(const i of filtered){
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `\
      <a class=\"card\" href=\"./item.html?id=${i.id}\" aria-label=\"Open ${i.common_name}\">\
        <div class=\"image\"><img src=\"${i.image||'assets/placeholder.svg'}\" alt=\"${i.common_name}\"></div>\
        <div class=\"body\">\
          <h2>${i.common_name}</h2>\
          <div class=\"meta\"><span class=\"badge\">${i.group}</span><span class=\"badge\">${i.depth_min_m} to ${i.depth_max_m} m</span></div>\
          <p>${i.summary||''}</p>\
        </div>\
      </a>`;\
    list.appendChild(li);
  }
}

function updateFact(depth){
  const box = document.getElementById('fact');
  const band = factBands.find(b => depth >= b.min && depth <= b.max);
  if(band){ box.textContent = band.text; box.hidden = false; }
  else { box.hidden = true; }
}

async function init(){
  await loadData();
  const handle = document.getElementById('handle');
  const track = document.getElementById('track');
  const readout = document.getElementById('depthReadout');
  const q = document.getElementById('q');
  const group = document.getElementById('group');
  const reset = document.getElementById('reset');
  const bigText = document.getElementById('bigText');
  const randomDepth = document.getElementById('randomDepth');

  let depth = 0;

  function apply(){
    readout.textContent = depth + ' m';
    const rect = track.getBoundingClientRect();
    const y = (depth-DEPTH_MIN)/(DEPTH_MAX-DEPTH_MIN) * rect.height;
    handle.style.top = y + 'px';
    track.setAttribute('aria-valuenow', String(depth));
    renderRefs();
    renderCards(depth, q.value, group.value);
    updateFact(depth);
  }

  function setDepthFromEvent(ev){
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    depth = yToDepth(clientY, track);
    apply();
  }

  track.addEventListener('mousedown', setDepthFromEvent);
  track.addEventListener('touchstart', setDepthFromEvent);
  function startDrag(ev){
    ev.preventDefault();
    const move = e => setDepthFromEvent(e);
    const stop = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
  }
  handle.addEventListener('mousedown', startDrag);
  handle.addEventListener('touchstart', startDrag, {passive:false});

  handle.addEventListener('keydown', e => {
    if(e.key === 'ArrowUp'){ depth = Math.max(DEPTH_MIN, depth-50); apply(); }
    if(e.key === 'ArrowDown'){ depth = Math.min(DEPTH_MAX, depth+50); apply(); }
    if(e.key === 'Home'){ depth = DEPTH_MIN; apply(); }
    if(e.key === 'End'){ depth = DEPTH_MAX; apply(); }
  });

  q.addEventListener('input', apply);
  group.addEventListener('change', apply);
  reset.addEventListener('click', () => { q.value=''; group.value=''; depth = 0; apply(); });
  bigText.addEventListener('click', () => document.documentElement.classList.toggle('kiosk-large'));
  randomDepth.addEventListener('click', () => { depth = Math.floor(Math.random()*DEPTH_MAX); apply(); });

  window.addEventListener('resize', apply);
  apply();
}
document.addEventListener('DOMContentLoaded', init);
