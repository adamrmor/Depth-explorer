async function load(){
  const res = await fetch('data/species.json');
  const items = await res.json();
  const grid = document.getElementById('grid');
  const q = document.getElementById('q');
  const group = document.getElementById('group');
  const reset = document.getElementById('reset');
  const bigText = document.getElementById('bigText');

  function render(){
    grid.innerHTML='';
    const query = (q.value||'').toLowerCase();
    const groupVal = group.value;
    let filtered = items.filter(i => {
      const text = (i.common_name + ' ' + (i.summary||'')).toLowerCase();
      const hit = query ? text.includes(query) : true;
      const hitGroup = groupVal ? i.group===groupVal : true;
      return hit && hitGroup;
    });
    for(const i of filtered){
      const li = document.createElement('li');
      li.className = 'card';
      li.innerHTML = `<a class="stretch" href="./item.html?id=${i.id}" aria-label="Open ${i.common_name}"></a>
      <div class="image"><img src="${i.image||'assets/placeholder.svg'}" alt="${i.common_name}"></div>
      <div class="body">
        <h2>${i.common_name}</h2>
        <div class="meta"><span class="badge">${i.group}</span>
        <span class="badge">${i.depth_min_m} to ${i.depth_max_m} m</span></div>
        <p>${i.summary||''}</p>
      </div>`;
      grid.appendChild(li);
    }
  }

  q.addEventListener('input', render);
  group.addEventListener('change', render);
  reset.addEventListener('click', () => { q.value=''; group.value=''; render(); });
  bigText.addEventListener('click', () => document.documentElement.classList.toggle('kiosk-large'));
  render();
}
document.addEventListener('DOMContentLoaded', load);
