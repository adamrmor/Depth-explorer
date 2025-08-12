async function load(){
  let items = [];
  try{
    const res = await fetch('data/species.json');
    if(res.ok){
      items = await res.json();
    }else{
      throw new Error('Request failed');
    }
  }catch(err){
    console.error('Failed to load species data', err);
  }
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
        li.innerHTML = `\
        <a class=\"card\" href=\"./item.html?id=${i.id}\" aria-label=\"Open ${i.common_name}\">\
          <div class=\"image\"><img src=\"${i.image||'assets/placeholder.svg'}\" alt=\"${i.common_name}\"></div>\
          <div class=\"body\">\
            <h2>${i.common_name}</h2>\
            <div class=\"meta\"><span class=\"badge\">${i.group}</span>\
            <span class=\"badge\">${i.depth_min_m} to ${i.depth_max_m} m</span></div>\
            <p>${i.summary||''}</p>\
          </div>\
        </a>`;
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
