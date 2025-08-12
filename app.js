// Depth Explore logic with full-height track and clickable cards (no 'Open' button)
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

  // For each species, try to pull a richer specimen image from
  // iNaturalist.  This lets the main page cards display a photo of
  // the actual organism rather than the simple vector placeholder.
  // Failures are ignored so the local SVG falls back gracefully.
  await Promise.all(items.map(async i => {
    const inatId = i.inat_id || i.inatId;
    if(!inatId) return;
    try{
      const r = await fetch('https://api.inaturalist.org/v1/taxa/' + encodeURIComponent(inatId));
      const d = await r.json();
      const photo = d && d.results && d.results[0] && d.results[0].default_photo;
      if(photo && photo.medium_url){
        i.image = photo.medium_url;
      }
    }catch{
      // Network errors fall back to local image
    }
  }));
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
      <a class="stretch" href="item.html?id=${i.id}" aria-label="Open ${i.common_name}"></a>
      <div class="image">
        <img src="${i.image||'assets/placeholder.svg'}" alt="${i.common_name}">
      </div>
      <div class="body">
        <h2>${i.common_name}</h2>
        <div class="meta"><span class="badge">${i.group}</span><span class="badge">${i.depth_min_m} to ${i.depth_max_m} m</span></div>
        <p>${i.summary||''}</p>
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
    handle.style.top = y + 'px';
    track.setAttribute('aria-valuenow', String(depth));
    renderCards(depth, q.value, group.value);
    updateFact(depth);
  }

  function setDepthFromEvent(ev){
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    depth = yToDepth(clientY, track);
    apply();
  }

  // click/drag on track
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

  window.addEventListener('resize', apply);
  apply();
}
document.addEventListener('DOMContentLoaded', init);
