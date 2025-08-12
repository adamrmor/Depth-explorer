async function load(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const res = await fetch('data/species.json');
  const items = await res.json();
  const item = items.find(x => x.id === id) || items[0];
  document.getElementById('title').textContent = item.common_name;

  const el = document.getElementById('content');
  el.innerHTML = `
    <figure>
      <img src="${item.image||'assets/placeholder.svg'}" alt="${item.common_name}">
      <figcaption>${item.also_known_as ? 'Also called ' + item.also_known_as + '. ' : ''}
      Depth ${item.depth_min_m} to ${item.depth_max_m} m.
      </figcaption>
    </figure>
    <section class="facts">
      <h2>About</h2>
      <p>${item.summary||''}</p>
      <ul>${(item.body||[]).map(t => `<li>${t}</li>`).join('')}</ul>
      ${item.look_for ? `<h2>Look for</h2><ul>${item.look_for.map(t=>`<li>${t}</li>`).join('')}</ul>` : ''}
      ${item.display_note ? `<p><strong>In the gallery.</strong> ${item.display_note}</p>` : ''}
      ${item.regions ? `<p><strong>Where.</strong> ${item.regions.join(', ')}</p>` : ''}
      <details>
        <summary>Credits and sources</summary>
        <p>Content draft for kiosk prototype. Replace with curatorial text and citations.</p>
      </details>
    </section>
  `;
}
document.addEventListener('DOMContentLoaded', load);
