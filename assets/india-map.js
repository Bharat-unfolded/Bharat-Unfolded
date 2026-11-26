/* Bharat Unfolded — local map with direct state/UT navigation */
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
  const href = r => (r[2] === 'ut' ? 'union-territories/' : 'states/') + r[1] + '.html';
  const svgHost = document.getElementById('indiaMapSvg');
  const status = document.getElementById('indiaMapStatus');
  async function loadLocalMap() {
    try {
      const response = await fetch('assets/india-states.svg', {cache:'no-cache'});
      if (!response.ok) throw new Error('Local map request failed: ' + response.status);
      const source = await response.text();
      const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
      if (parsed.querySelector('parsererror')) throw new Error('The local SVG map is invalid.');
      const svg = document.importNode(parsed.documentElement, true);
      const mapRegions = [...svg.querySelectorAll('.map-region')];
      if (mapRegions.length !== 36) throw new Error('Expected 36 map regions; found ' + mapRegions.length);
      mapRegions.forEach(el => {
        const region = regions.find(r => r[1] === el.dataset.slug);
        if (!region) { el.setAttribute('aria-disabled','true'); return; }
        el.setAttribute('aria-label','Open ' + region[0] + ' guide');
        el.setAttribute('tabindex','0');
        el.setAttribute('role','link');
        el.addEventListener('click', () => { window.location.href = href(region); });
        el.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            window.location.href = href(region);
          }
        });
      });
      svgHost.replaceChildren(svg);
      root.classList.add('map-ready');
      root.classList.remove('map-fallback');
      status.textContent = 'Map ready — click a state or Union Territory to open its guide.';
    } catch (error) {
      console.error('[Bharat Unfolded local map]', error);
      svgHost.innerHTML = '<div class="india-map-error"><b>India map is temporarily unavailable</b><small>You can still browse all state and Union Territory guides in the sections below.</small></div>';
      status.textContent = 'The map could not be loaded. All region guides remain available below.';
      root.classList.add('map-fallback');
    }
  }
  loadLocalMap();
})();
