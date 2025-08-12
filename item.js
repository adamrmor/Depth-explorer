// Detail page with Wikipedia/Wikidata/iNaturalist fetch + cache
async function load(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
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
  const item = items.find(x => x.id === id) || items[0];
  if(!item){
    document.getElementById('content').textContent = 'Species data unavailable.';
    return;
  }
  document.getElementById('title').textContent = item.common_name;

  const cacheKey = 'species_cache:' + id;
  const cached = localStorage.getItem(cacheKey);
  if(cached){
    try{
      const data = JSON.parse(cached);
      render(item, data);
      hydrateOnline(item).then(newData => { if(newData){ localStorage.setItem(cacheKey, JSON.stringify(newData)); } });
      return;
    }catch{}
  }

  const data = await hydrateOnline(item);
  if(data){
    localStorage.setItem(cacheKey, JSON.stringify(data));
    render(item, data);
  }else{
    render(item, null);
  }
}

async function hydrateOnline(item){
  let wikiTitle = item.wikipedia || null;
  let wikidataId = item.wikidata || null;
  let inatId = item.inat_id || item.inatId || null;

  if(!wikiTitle){ wikiTitle = await wikipediaSearch(item.common_name); }
  if(!wikidataId && wikiTitle){ wikidataId = await wikidataFromWikipedia(wikiTitle); }
  if(!inatId){ inatId = await inatSearch(item.common_name); }

  const [wikiSummary, wikidataObj, inatObj] = await Promise.all([
    wikiTitle ? wikipediaSummary(wikiTitle) : null,
    wikidataId ? wikidataEntity(wikidataId) : null,
    inatId ? inatTaxon(inatId) : null
  ]);

  return { wikiTitle, wikidataId, inatId, wikiSummary, wikidataObj, inatObj };
}

/* Wikipedia */
async function wikipediaSearch(q){
  try{
    const url = 'https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&origin=*&search=' + encodeURIComponent(q);
    const r = await fetch(url);
    const d = await r.json();
    return d && d[1] && d[1][0] ? d[1][0] : null;
  }catch{return null;}
}
async function wikipediaSummary(title){
  try{
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title);
    const r = await fetch(url);
    if(!r.ok) return null;
    return await r.json();
  }catch{return null;}
}

/* Wikidata */
async function wikidataFromWikipedia(title){
  try{
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=' + encodeURIComponent(title) + '&format=json&origin=*';
    const r = await fetch(url);
    const d = await r.json();
    const ids = d && d.entities ? Object.keys(d.entities) : [];
    return ids && ids[0] ? ids[0] : null;
  }catch{return null;}
}
async function wikidataEntity(id){
  try{
    const url = 'https://www.wikidata.org/wiki/Special:EntityData/' + encodeURIComponent(id) + '.json';
    const r = await fetch(url);
    if(!r.ok) return null;
    const d = await r.json();
    return d.entities ? d.entities[id] : null;
  }catch{return null;}
}

/* iNaturalist */
async function inatSearch(q){
  try{
    const url = 'https://api.inaturalist.org/v1/taxa?q=' + encodeURIComponent(q) + '&per_page=1';
    const r = await fetch(url);
    const d = await r.json();
    return d.results && d.results[0] ? d.results[0].id : null;
  }catch{return null;}
}
async function inatTaxon(id){
  try{
    const url = 'https://api.inaturalist.org/v1/taxa/' + encodeURIComponent(id);
    const r = await fetch(url);
    if(!r.ok) return null;
    const d = await r.json();
    return d.results && d.results[0] ? d.results[0] : null;
  }catch{return null;}
}

function render(localItem, external){
  const el = document.getElementById('content');
  let hero = localItem.image || 'assets/placeholder.svg';
  if(external && external.inatObj && external.inatObj.default_photo && external.inatObj.default_photo.medium_url){
    hero = external.inatObj.default_photo.medium_url;
  }

  let sourceBadges = '';
  if(external && external.wikiTitle){
    sourceBadges += `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(external.wikiTitle)}" target="_blank" rel="noopener">Wikipedia</a>`;
  }
  if(external && external.wikidataId){
    sourceBadges += `<a href="https://www.wikidata.org/wiki/${encodeURIComponent(external.wikidataId)}" target="_blank" rel="noopener">Wikidata</a>`;
  }
  if(external && external.inatId){
    sourceBadges += `<a href="https://www.inaturalist.org/taxa/${encodeURIComponent(external.inatId)}" target="_blank" rel="noopener">iNaturalist</a>`;
  }

  const summaryText = external && external.wikiSummary && external.wikiSummary.extract ? external.wikiSummary.extract : (localItem.summary||'');
  const aka = localItem.also_known_as ? 'Also called ' + localItem.also_known_as + '. ' : '';

  el.innerHTML = `
    <figure>
      <img src="${hero}" alt="${localItem.common_name}">
      <figcaption>${aka}Depth ${localItem.depth_min_m} to ${localItem.depth_max_m} m.</figcaption>
    </figure>
    <section class="facts">
      <div class="source-badges">${sourceBadges}</div>
      <h2>About</h2>
      <p>${summaryText}</p>
      ${localItem.body && localItem.body.length ? `<ul>${localItem.body.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      ${localItem.look_for ? `<h2>Look for</h2><ul>${localItem.look_for.map(t=>`<li>${t}</li>`).join('')}</ul>` : ''}
      ${localItem.display_note ? `<p><strong>In the gallery.</strong> ${localItem.display_note}</p>` : ''}
      ${localItem.regions ? `<p><strong>Where.</strong> ${localItem.regions.join(', ')}</p>` : ''}
    </section>
  `;
}

document.addEventListener('DOMContentLoaded', load);
