/* Bharat Unfolded — interactive India map
   Boundary data: udit-001/india-maps-data (community-curated GeoJSON).
   Map interaction is progressive-enhancement: the 36-region directory remains usable if the map data is unavailable.
*/
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
  const norm = value => String(value || '').toLocaleLowerCase('en')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const aliases = new Map();
  regions.forEach(r => aliases.set(norm(r[0]), r));
  aliases.set('nct of delhi', regions.find(r=>r[1]==='delhi'));
  aliases.set('dadra and nagar haveli', regions.find(r=>r[1]==='dadra-nagar-haveli-and-daman-and-diu'));
  aliases.set('daman and diu', regions.find(r=>r[1]==='dadra-nagar-haveli-and-daman-and-diu'));
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
  let features = [];
  let selected = null;

  function renderList(query='') {
    const q = norm(query);
    const matches = regions.filter(r => !q || norm(r[0]).includes(q));
    list.innerHTML = matches.map(r => '<a class="india-map-list-item" href="'+href(r)+'"><span>'+r[0]+'</span><small>'+(r[2]==='ut'?'UNION TERRITORY':'STATE')+' ↗</small></a>').join('');
    list.hidden = matches.length === 0;
    document.getElementById('indiaMapNoResults').hidden = matches.length !== 0;
    if (select) select.innerHTML = '<option value="">Choose a state or UT</option>' + matches.map(r=>'<option value="'+r[1]+'">'+r[0]+'</option>').join('');
  }
  function choose(region, path) {
    if (!region) return;
    selected = region;
    nameNode.textContent = region[0];
    typeNode.textContent = region[2] === 'ut' ? 'UNION TERRITORY' : 'STATE';
    openNode.href = href(region);
    detail.hidden = false;
    svgHost.querySelectorAll('.india-map-shape').forEach(p => p.classList.toggle('is-selected', p.dataset.slug === region[1]));
    if (select) select.value = region[1];
    status.textContent = region[0] + ' selected. Open its destination guide.';
  }
  function propertyName(feature) {
    const p = feature.properties || {};
    const candidates = [p.name,p.NAME_1,p.NAME_0,p.st_nm,p.ST_NM,p.shapeName,p.shapeNameEn,p.state,p.State,p.NAME,p.NAME_UT,p.ut_name,p.NAME_ENG];
    for (const value of candidates) {
      const match = aliases.get(norm(value));
      if (match) return match;
    }
    for (const value of Object.values(p)) {
      if (typeof value === 'string') {
        const match = aliases.get(norm(value));
        if (match) return match;
      }
    }
    return null;
  }
  function draw(data) {
    if (!window.d3 || !data || !Array.isArray(data.features)) throw new Error('Map data format is not available.');
    const width = 760, height = 690;
    const collection = {type:'FeatureCollection',features:data.features};
    const projection = window.d3.geoMercator().fitExtent([[24,18],[width-24,height-18]], collection);
    const path = window.d3.geoPath(projection);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 '+width+' '+height);
    svg.setAttribute('role','group');
    svg.setAttribute('aria-label','Interactive map of Indian states and union territories. Select a region to open its guide.');
    const defs = document.createElementNS(ns,'defs');
    const filter = document.createElementNS(ns,'filter'); filter.setAttribute('id','indiaMapGlow');
    const blur = document.createElementNS(ns,'feGaussianBlur'); blur.setAttribute('stdDeviation','3'); blur.setAttribute('result','blur');
    filter.appendChild(blur); defs.appendChild(filter); svg.appendChild(defs);
    let drawn = 0;
    data.features.forEach((feature,i) => {
      const region = propertyName(feature);
      if (!region) return;
      const d = path(feature);
      if (!d) return;
      const el = document.createElementNS(ns,'path');
      el.setAttribute('d',d); el.setAttribute('class','india-map-shape');
      el.setAttribute('fill',region[2]==='ut'?'#a8a06e':(i%2?'#b88d48':'#d5b36d'));
      el.setAttribute('tabindex','0'); el.setAttribute('role','link');
      el.setAttribute('aria-label','Open '+region[0]+' guide');
      el.dataset.slug = region[1];
      el.addEventListener('click',()=>choose(region,el));
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(region,el);}});
      el.addEventListener('mouseenter',()=>{status.textContent=region[0];});
      el.addEventListener('mouseleave',()=>{status.textContent=selected?selected[0]+' selected. Open its destination guide.':'Select any highlighted region.';});
      svg.appendChild(el); drawn++;
    });
    if (drawn < 25) throw new Error('The boundary file did not contain enough recognised Indian regions.');
    svgHost.replaceChildren(svg);
    features = data.features;
    status.textContent = 'Select any highlighted region.';
    root.classList.add('map-ready');
  }
  function showFallback(message) {
    const loading = svgHost.querySelector('.india-map-loading');
    if (loading) loading.remove();
    svgHost.innerHTML = '<div class="india-map-error"><span aria-hidden="true">✦</span><b>Map could not be loaded</b><small>' +
      'The region directory is ready below. You can still open all 36 state and UT guides.' +
      '</small><button type="button" id="indiaMapRetry">Try loading the map again</button></div>';
    status.textContent = message + ' The complete region directory is available.';
    root.classList.add('map-fallback');
    const retry = document.getElementById('indiaMapRetry');
    if (retry) retry.addEventListener('click', () => {
      root.classList.remove('map-fallback');
      svgHost.innerHTML = '<div class="india-map-loading"><span class="india-map-loader"></span><b>Preparing the India map…</b><small>Loading state and Union Territory boundaries</small></div>';
      status.textContent = 'Trying to load the map…';
      loadMap();
    });
  }
  function loadScript(urls) {
    if (window.d3 && window.d3.geoMercator && window.d3.geoPath) return Promise.resolve();
    return urls.reduce((chain, url) => chain.catch(() => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => window.d3 && window.d3.geoMercator
        ? resolve() : reject(new Error('Map library loaded without the required functions.'));
      script.onerror = () => reject(new Error('Could not load ' + url));
      document.head.appendChild(script);
    })), Promise.reject());
  }
  async function fetchMapData() {
    const urls = [
      'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453/geojson/india.geojson',
      'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/india.geojson',
      'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson'
    ];
    let lastError;
    for (const url of urls) {
      try {
        const response = await fetch(url, {mode:'cors', cache:'no-cache'});
        if (!response.ok) throw new Error('HTTP ' + response.status + ' from map data source.');
        const data = await response.json();
        if (data && Array.isArray(data.features) && data.features.length) return data;
        throw new Error('The map data source returned an empty boundary file.');
      } catch (error) {
        lastError = error;
        console.warn('[Bharat Unfolded map source]', url, error);
      }
    }
    throw lastError || new Error('All map data sources failed.');
  }
  async function loadMap() {
    try {
      await loadScript([
        'https://cdn.jsdelivr.net/npm/d3-geo@3/dist/d3-geo.min.js',
        'https://unpkg.com/d3-geo@3/dist/d3-geo.min.js'
      ]);
      const data = await fetchMapData();
      draw(data);
      root.classList.remove('map-fallback');
    } catch (err) {
      console.warn('[Bharat Unfolded map]', err);
      showFallback('The map service could not be reached.');
    }
  }
  renderList();
  search.addEventListener('input',()=>renderList(search.value));
  if (select) select.addEventListener('change',()=>choose(regions.find(r=>r[1]===select.value)));
  loadMap();
})();
