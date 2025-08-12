// Depth Explore logic
let items = [];
const DEPTH_MIN = 0;
const DEPTH_MAX = 4000;
const factBands = [
  {min:0, max:50, text:"Most marine life lives in the top 50 m where light is strongest."},
  {min:200, max:400, text:"Around 200 m, daylight fades. This is the start of the twilight zone."},
  {min:800, max:1200, text:"At 800 to 1200 m, it is near freezing with very little light."},
  {min:2000, max:4000, text:"The abyss. High pressure. Few species have adapted to survive here."}
];

async function loadData(){
  const res = await fetch('data/species.json');
  items = await res.json();
}

function depthToY(depth, trackEl){
  const rect = trackEl.getBoundingClientRect();
  // usable height
  const h = rect.height;
  const t = (depth - DEPTH_MIN) / (DEPTH_MAX - DEPTH_MIN);
  return rect.top + t * h;
}
function yToDepth(y, trackEl){
  const rect = trackEl.getBoundingClientRect();
  const t = Math.min(1, Math.max(0, (y - rect.top) / rect.height));
  return Math.round(DEPTH_MIN + t * (DEPTH_MAX - DEPTH_MIN));
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
    li.innerHTML = `
      <div class="image">
        <img src="${i.image||'assets/placeholder.svg'}" alt="${i.common_name}">
      </div>
      <div class="body">
        <h2>${i.common_name}</h2>
        <div class="meta"><span class="badge">${i.group}</span><span class="badge">${i.depth_min_m} to ${i.depth_max_m} m</span></div>
        <p>${i.summary||''}</p>
        <a class="button" href="item.html?id=${i.id}">Open</a>
      </div>`;
    list.appendChild(li);
  }
}

function updateFact(depth){
  const box = document.getElementById('fact');
  const band = factBands.find(b => depth >= b.min && depth <= b.max);
  if(band){
    box.textContent = band.text;
    box.hidden = false;
  } else {
    box.hidden = true;
  }
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
  handle.style.top = y + 'px';                 // y within full-height track
  track.setAttribute('aria-valuenow', String(depth));
  renderCards(depth, q.value, group.value);
  updateFact(depth);
}

// Re-apply on resize to keep the handle in the right spot
window.addEventListener('resize', apply);

  function setDepthFromEvent(ev){
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    depth = yToDepth(clientY, track);
    apply();
  }

  // click on track
  track.addEventListener('mousedown', setDepthFromEvent);
  track.addEventListener('touchstart', setDepthFromEvent);

  // drag handle
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

  // keyboard
  handle.addEventListener('keydown', e => {
    if(e.key === 'ArrowUp'){ depth = Math.max(DEPTH_MIN, depth-50); apply(); }
    if(e.key === 'ArrowDown'){ depth = Math.min(DEPTH_MAX, depth+50); apply(); }
    if(e.key === 'Home'){ depth = DEPTH_MIN; apply(); }
    if(e.key === 'End'){ depth = DEPTH_MAX; apply(); }
  });

  // filters
  q.addEventListener('input', apply);
  group.addEventListener('change', apply);
  reset.addEventListener('click', () => { q.value=''; group.value=''; depth = 0; apply(); });
  bigText.addEventListener('click', () => document.documentElement.classList.toggle('kiosk-large'));
  randomDepth.addEventListener('click', () => { depth = Math.floor(Math.random()*DEPTH_MAX); apply(); });

  apply();
}
document.addEventListener('DOMContentLoaded', init);
