/* Bharat Unfolded — locally hosted clickable India state/UT map */
(() => {
  'use strict';
  const root = document.getElementById('indiaMapExplorer');
  if (!root) return;
  const regions = [
    ['Andhra Pradesh','andhra-pradesh','state'],['Arunachal Pradesh','arunachal-pradesh','state'],
    ['Assam','assam','state'],['Bihar','bihar','state'],['Chhattisgarh','chhattisgarh','state'],
    ['Goa','goa','state'],['Gujarat','gujarat','state'],['Haryana','haryana','state'],
    ['Himachal Pradesh','himachal-pradesh','state'],['Jharkhand','jharkhand','state'],
    ['Karnataka','karnataka','state'],['Kerala','kerala','state'],
    ['Madhya Pradesh','madhya-pradesh','state'],['Maharashtra','maharashtra','state'],
    ['Manipur','manipur','state'],['Meghalaya','meghalaya','state'],['Mizoram','mizoram','state'],
    ['Nagaland','nagaland','state'],['Odisha','odisha','state'],['Punjab','punjab','state'],
    ['Rajasthan','rajasthan','state'],['Sikkim','sikkim','state'],['Tamil Nadu','tamil-nadu','state'],
    ['Telangana','telangana','state'],['Tripura','tripura','state'],
    ['Uttar Pradesh','uttar-pradesh','state'],['Uttarakhand','uttarakhand','state'],
    ['West Bengal','west-bengal','state'],
    ['Andaman and Nicobar Islands','andaman-and-nicobar-islands','ut'],
    ['Chandigarh','chandigarh','ut'],
    ['Dadra and Nagar Haveli and Daman and Diu','dadra-nagar-haveli-and-daman-and-diu','ut'],
    ['Delhi','delhi','ut'],['Jammu and Kashmir','jammu-and-kashmir','ut'],
    ['Ladakh','ladakh','ut'],['Lakshadweep','lakshadweep','ut'],['Puducherry','puducherry','ut']
  ];
  const norm = value => String(value || '').toLocaleLowerCase('en').normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim().replace(/\\s+/g,' ');
  const href = r => (r[2] === 'ut' ? 'union-territories/' : 'states/') + r[1] + '.html';
  const select = document.getElementById('indiaMapSelect');
  const status = document.getElementById('indiaMapStatus');
  const svgHost = document.getElementById('indiaMapSvg');
  const search = document.getElementById('indiaMapSearch');
  const list = document.getElementById('indiaMapList');
  const detail = document.getElementById('indiaMapDetail');
  const nameNode = document.getElementById('indiaMapSelectedName');
  const typeNode = document.getElementById('indiaMapSelectedType');
  const openNode = document.getElementById('indiaMapOpen');
  let selected = null;
  function renderList(query='') {
    const q = norm(query);
    const matches = regions.filter(r => !q || norm(r[0]).includes(q));
    list.innerHTML = matches.map(r => '<a class="india-map-list-item" href="'+href(r)+'"><span>'+r[0]+'</span><small>'+(r[2]==='ut'?'UNION TERRITORY':'STATE')+' ↗</small></a>').join('');
    list.hidden = matches.length === 0;
    document.getElementById('indiaMapNoResults').hidden = matches.length !== 0;
    if (select) select.innerHTML = '<option value="">Choose a state or UT</option>' + matches.map(r=>'<option value="'+r[1]+'">'+r[0]+'</option>').join('');
  }
  function choose(region) {
    if (!region) return;
    selected = region;
    nameNode.textContent = region[0];
    typeNode.textContent = region[2] === 'ut' ? 'UNION TERRITORY' : 'STATE';
    openNode.href = href(region);
    detail.hidden = false;
    svgHost.querySelectorAll('.map-region').forEach(el => {
      const active = el.dataset.slug === region[1];
      el.classList.toggle('is-selected', active);
      if (active) el.setAttribute('aria-current','true');
      else el.removeAttribute('aria-current');
    });
    if (select) select.value = region[1];
    status.textContent = region[0] + ' selected. Click “Open destination guide” to visit its page.';
  }
  function showFallback() {
    svgHost.innerHTML = '<div class="india-map-error"><b>India map is temporarily unavailable</b><small>The complete state and UT directory is ready beside the map.</small></div>';
    status.textContent = 'Local map file could not be loaded. The complete region directory is available.';
    root.classList.add('map-fallback');
  }
  async function loadLocalMap() {
    try {
      const response = await fetch('assets/india-states.svg', {cache:'no-cache'});
      if (!response.ok) throw new Error('Local map request failed: ' + response.status);
      const source = await response.text();
      const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      if (parsed.querySelector('parsererror')) throw new Error('The local SVG map is invalid.');
      const svg = document.importNode(parsed.documentElement, true);
      const mapRegions = [...svg.querySelectorAll('.map-region')];
      if (mapRegions.length !== 36) throw new Error('Expected 36 clickable regions; found ' + mapRegions.length);
      mapRegions.forEach(el => {
        const region = regions.find(r => r[1] === el.dataset.slug);
        if (!region) { el.setAttribute('aria-disabled','true'); return; }
        el.setAttribute('aria-label','Select ' + region[0]);
        el.setAttribute('tabindex','0');
        el.setAttribute('role','link');
        el.addEventListener('click', () => choose(region));
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(region); }
        });
      });
      svgHost.replaceChildren(svg);
      root.classList.add('map-ready');
      root.classList.remove('map-fallback');
      status.textContent = 'Map ready — click any state or Union Territory.';
    } catch (error) {
      console.error('[Bharat Unfolded local map]', error);
      showFallback();
    }
  }
  renderList();
  search.addEventListener('input', () => renderList(search.value));
  if (select) select.addEventListener('change', () => choose(regions.find(r => r[1] === select.value)));
  loadLocalMap();
})();
