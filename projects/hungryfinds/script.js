/* ---------- Calamba City config ---------- */
const CALAMBA_CENTER = [14.2117, 121.1653];
const CALAMBA_BBOX = { south: 14.14, west: 121.06, north: 14.33, east: 121.24 }; // south,west,north,east

const CATEGORY_META = {
  restaurant: { label:'Restaurant', emoji:'🍽️', color:'#FF7A1A', color2:'#FF3D81' },
  fastfood:   { label:'Fast Food',  emoji:'🔥', color:'#FF3D81', color2:'#FFC93C' },
  cafe:       { label:'Café',       emoji:'☕', color:'#FFC93C', color2:'#37C6B0' },
  bakery:     { label:'Bakery',     emoji:'🥐', color:'#37C6B0', color2:'#3D6BFF' },
  market:     { label:'Market / Food Court', emoji:'🧺', color:'#C64FF2', color2:'#3D6BFF' },
  other:      { label:'Eatery',     emoji:'🍴', color:'#8A7A66', color2:'#34281E' }
};

/* ---------- Editor's picks (well-known Calamba City spots) ---------- */
const editorsPicks = [
  { name:"Buko Pie Row", area:"Calamba–Los Baños Road", desc:"The famous strip of roadside stalls Calamba is known for — fresh, hot buko pie straight off the tray.", emoji:"🥧", query:"Buko Pie stalls Calamba-Los Baños Road, Calamba City" },
  { name:"Calamba Public Market", area:"Bagong Kalsada", desc:"Wet market carinderias serving cheap, home-style Filipino cooked meals all day.", emoji:"🍲", query:"Calamba City Public Market, Bagong Kalsada, Calamba City" },
  { name:"SM City Calamba Food Court", area:"Real, National Highway", desc:"A one-stop food court mixing Filipino, Asian, and fast-food favorites under one roof.", emoji:"🍱", query:"SM City Calamba Food Court" },
  { name:"Crossing Food Strip", area:"Brgy. Real / Halang", desc:"A dense row of eateries, grill stalls, and coffee spots along the busy Crossing area.", emoji:"🔥", query:"Crossing Calamba City food eateries" }
];

/* ---------- state ---------- */
let map, markersLayer;
let allPlaces = [];       // {name, lat, lon, cat, tags}
let userLocation = null;

/* ---------- helpers ---------- */
function gmapsSearchUrl(name, lat, lon){
  const q = name ? `${name}, Calamba City, Laguna` : `${lat},${lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
function gmapsDirectionsUrl(lat, lon){
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}
function categorize(tags){
  if(!tags) return 'other';
  if(tags.amenity === 'restaurant') return 'restaurant';
  if(tags.amenity === 'fast_food') return 'fastfood';
  if(tags.amenity === 'cafe') return 'cafe';
  if(tags.shop === 'bakery') return 'bakery';
  if(tags.amenity === 'marketplace' || tags.amenity === 'food_court') return 'market';
  return 'other';
}
function haversineKm(lat1, lon1, lat2, lon2){
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function makeDivIcon(cat){
  const meta = CATEGORY_META[cat] || CATEGORY_META.other;
  return L.divIcon({
    html:`<div style="background:${meta.color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #14100E;box-shadow:0 2px 6px rgba(0,0,0,.4);"><span style="transform:rotate(45deg);font-size:14px;">${meta.emoji}</span></div>`,
    className:'', iconSize:[30,30], iconAnchor:[15,29], popupAnchor:[0,-28]
  });
}

/* ---------- map init ---------- */
function initMap(){
  map = L.map('map', { scrollWheelZoom:true }).setView(CALAMBA_CENTER, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom:19
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

/* ---------- fetch real places via free Overpass API ---------- */
async function loadPlaces(){
  const status = document.getElementById('mapStatus');
  const loading = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(restaurant|fast_food|cafe|food_court|marketplace)$"](${CALAMBA_BBOX.south},${CALAMBA_BBOX.west},${CALAMBA_BBOX.north},${CALAMBA_BBOX.east});
      node["shop"="bakery"](${CALAMBA_BBOX.south},${CALAMBA_BBOX.west},${CALAMBA_BBOX.north},${CALAMBA_BBOX.east});
    );
    out body;
  `;
  try{
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 20000);
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST',
      body:'data=' + encodeURIComponent(query),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if(!res.ok) throw new Error('Overpass request failed');
    const data = await res.json();
    allPlaces = (data.elements || [])
      .filter(el => el.tags && el.tags.name && el.lat && el.lon)
      .map(el => ({
        id: el.id,
        name: el.tags.name,
        lat: el.lat,
        lon: el.lon,
        cat: categorize(el.tags),
        cuisine: el.tags.cuisine ? el.tags.cuisine.replace(/_/g,' ').replace(/;/g,', ') : '',
        addr: [el.tags['addr:street'], el.tags['addr:suburb']].filter(Boolean).join(', ')
      }));
    loading.style.display = 'none';
    if(allPlaces.length === 0){
      status.textContent = 'No tagged food stalls found in open map data yet.';
      errorState.style.display = 'block';
    } else {
      status.textContent = `${allPlaces.length} food spots loaded from OpenStreetMap.`;
      renderAll();
    }
  }catch(err){
    loading.style.display = 'none';
    errorState.style.display = 'block';
    status.textContent = 'Live data unavailable right now.';
  }
}

/* ---------- rendering ---------- */
function renderAll(){
  applyFilters();
}

function currentFilters(){
  return {
    q: document.getElementById('searchInput').value.trim().toLowerCase(),
    cat: document.getElementById('categorySelect').value
  };
}

function applyFilters(){
  const { q, cat } = currentFilters();
  let filtered = allPlaces.filter(p=>{
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.cuisine.toLowerCase().includes(q) || p.addr.toLowerCase().includes(q);
    const matchCat = cat === 'all' || p.cat === cat;
    return matchQ && matchCat;
  });
  if(userLocation){
    filtered = filtered.map(p => ({...p, dist: haversineKm(userLocation.lat, userLocation.lon, p.lat, p.lon)}))
                        .sort((a,b)=>a.dist-b.dist);
  }
  renderMarkers(filtered);
  renderCards(filtered);
}

function renderMarkers(list){
  markersLayer.clearLayers();
  list.forEach(p=>{
    const meta = CATEGORY_META[p.cat] || CATEGORY_META.other;
    const marker = L.marker([p.lat, p.lon], { icon: makeDivIcon(p.cat) });
    marker.bindPopup(`
      <div class="popup-title">${escapeHtml(p.name)}</div>
      <div class="popup-cat">${meta.emoji} ${meta.label}${p.cuisine ? ' · ' + escapeHtml(p.cuisine) : ''}</div>
      <div class="popup-links">
        <a href="${gmapsSearchUrl(p.name, p.lat, p.lon)}" target="_blank" rel="noopener">View on Maps</a>
        <a class="alt" href="${gmapsDirectionsUrl(p.lat, p.lon)}" target="_blank" rel="noopener">Directions</a>
      </div>
    `);
    marker.addTo(markersLayer);
    marker._placeId = p.id;
  });
}

/* ---------- slideshow ---------- */
let slideList = [];
let slideIndex = 0;
let autoplayTimer = null;
const AUTOPLAY_MS = 4500;
let slideObserver = null;

function renderCards(list){
  const viewport = document.getElementById('slideViewport');
  const noResults = document.getElementById('noResults');
  const wrap = document.getElementById('slideshowWrap');
  const dotsEl = document.getElementById('slideDots');
  const barsEl = document.getElementById('storyBars');
  viewport.innerHTML = '';
  dotsEl.innerHTML = '';
  barsEl.innerHTML = '';
  stopAutoplay();
  if(slideObserver) slideObserver.disconnect();

  slideList = list.slice(0, 24);
  if(slideList.length === 0){
    wrap.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';
  wrap.style.display = 'block';

  slideObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      entry.target.classList.toggle('in-view', entry.isIntersecting && entry.intersectionRatio >= 0.6);
    });
  }, { root: viewport, threshold: [0, 0.6, 1] });

  slideList.forEach((p, i)=>{
    const meta = CATEGORY_META[p.cat] || CATEGORY_META.other;
    const card = document.createElement('div');
    card.className = 'slide-card';
    card.innerHTML = `
      <div class="slide-photo" style="background:linear-gradient(135deg,${meta.color},${meta.color2},#14100E)">
        <span class="slide-emoji">${meta.emoji}</span>
      </div>
      <span class="slide-badge" style="background:${meta.color}">${meta.label}</span>
      <span class="slide-count">${String(i+1).padStart(2,'0')} / ${String(slideList.length).padStart(2,'0')}</span>
      <div class="slide-info">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="slide-meta">
          <span>${p.cuisine ? escapeHtml(p.cuisine) : (p.addr ? escapeHtml(p.addr) : 'Calamba City')}</span>
          ${p.dist !== undefined ? `<span class="dist">${p.dist.toFixed(1)} km away</span>` : ''}
        </div>
        <div class="slide-links">
          <a class="slide-tag" target="_blank" rel="noopener" href="${gmapsSearchUrl(p.name, p.lat, p.lon)}">View on Maps</a>
          <a class="slide-tag alt" target="_blank" rel="noopener" href="${gmapsDirectionsUrl(p.lat, p.lon)}">Directions</a>
        </div>
      </div>`;
    card.addEventListener('click', (e)=>{
      if(e.target.tagName === 'A') return;
      map.setView([p.lat, p.lon], 17);
      markersLayer.eachLayer(m=>{ if(m._placeId === p.id) m.openPopup(); });
      document.getElementById('map-section').scrollIntoView({ behavior:'smooth', block:'center' });
    });
    viewport.appendChild(card);
    slideObserver.observe(card);

    const dot = document.createElement('button');
    dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i+1}`);
    dot.addEventListener('click', ()=>{ dismissHint(); goToSlide(i); startAutoplay(); });
    dotsEl.appendChild(dot);

    const seg = document.createElement('div');
    seg.className = 'story-segment';
    seg.innerHTML = '<span class="story-fill"></span>';
    seg.addEventListener('click', ()=>{ dismissHint(); goToSlide(i); startAutoplay(); });
    barsEl.appendChild(seg);
  });

  slideList[0] && requestAnimationFrame(()=> viewport.querySelector('.slide-card').classList.add('in-view'));
  slideIndex = 0;
  updateProgress();
  viewport.addEventListener('scroll', onSlideScroll, { passive:true });
  startAutoplay();
}

function dismissHint(){
  const hint = document.getElementById('swipeHint');
  if(hint) hint.style.display = 'none';
}

function onSlideScroll(){
  dismissHint();
  const viewport = document.getElementById('slideViewport');
  clearTimeout(viewport._scrollTimer);
  viewport._scrollTimer = setTimeout(()=>{
    const cards = viewport.querySelectorAll('.slide-card');
    let closest = 0, minDist = Infinity;
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    cards.forEach((c, i)=>{
      const cCenter = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(cCenter - center);
      if(d < minDist){ minDist = d; closest = i; }
    });
    slideIndex = closest;
    updateProgress();
  }, 100);
}

function goToSlide(i){
  const viewport = document.getElementById('slideViewport');
  const cards = viewport.querySelectorAll('.slide-card');
  if(!cards[i]) return;
  slideIndex = ((i % cards.length) + cards.length) % cards.length;
  const card = cards[slideIndex];
  viewport.scrollTo({ left: card.offsetLeft, behavior:'smooth' });
  updateProgress();
}

function updateProgress(){
  const total = slideList.length;
  if(total === 0) return;
  document.querySelectorAll('#slideDots .slide-dot').forEach((d, i)=> d.classList.toggle('active', i === slideIndex));
  document.querySelectorAll('#storyBars .story-segment').forEach((seg, i)=>{
    seg.classList.remove('completed', 'active');
    const fill = seg.querySelector('.story-fill');
    fill.style.animation = 'none';
    fill.style.width = '0%';
    if(i < slideIndex){ seg.classList.add('completed'); }
    else if(i === slideIndex){
      seg.classList.add('active');
      fill.style.setProperty('--dur', `${AUTOPLAY_MS}ms`);
      void fill.offsetWidth; // restart animation
      fill.style.animation = '';
    }
  });
}

function startAutoplay(){
  stopAutoplay();
  if(slideList.length <= 1) return;
  autoplayTimer = setInterval(()=> goToSlide(slideIndex + 1), AUTOPLAY_MS);
}
function stopAutoplay(){
  if(autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer = null; }
}

document.getElementById('prevSlide').addEventListener('click', ()=>{ dismissHint(); goToSlide(slideIndex - 1); startAutoplay(); });
document.getElementById('nextSlide').addEventListener('click', ()=>{ dismissHint(); goToSlide(slideIndex + 1); startAutoplay(); });
document.getElementById('slideshowWrap').addEventListener('mouseenter', ()=>{ document.getElementById('slideshowWrap').classList.add('is-paused'); stopAutoplay(); });
document.getElementById('slideshowWrap').addEventListener('mouseleave', ()=>{ document.getElementById('slideshowWrap').classList.remove('is-paused'); startAutoplay(); });
document.getElementById('slideshowWrap').addEventListener('touchstart', ()=>{ dismissHint(); stopAutoplay(); }, { passive:true });

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- editor's picks ---------- */
function renderPicks(){
  const grid = document.getElementById('pickGrid');
  grid.innerHTML = '';
  editorsPicks.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `
      <div class="pick-emoji">${p.emoji}</div>
      <h4>${p.name}</h4>
      <p>${p.area} — ${p.desc}</p>
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}" target="_blank" rel="noopener">Open in Google Maps →</a>
    `;
    grid.appendChild(card);
  });
}

/* ---------- locate me ---------- */
function locateMe(){
  const status = document.getElementById('mapStatus');
  if(!navigator.geolocation){
    status.textContent = 'Location isn\'t supported on this browser.';
    return;
  }
  status.textContent = 'Getting your location…';
  navigator.geolocation.getCurrentPosition(pos=>{
    userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    const inCalamba = userLocation.lat >= CALAMBA_BBOX.south && userLocation.lat <= CALAMBA_BBOX.north
                    && userLocation.lon >= CALAMBA_BBOX.west && userLocation.lon <= CALAMBA_BBOX.east;
    map.setView([userLocation.lat, userLocation.lon], 15);
    L.marker([userLocation.lat, userLocation.lon], {
      icon: L.divIcon({ html:'<div style="width:16px;height:16px;border-radius:50%;background:var(--blue,#3D6BFF);border:3px solid #fff;box-shadow:0 0 0 4px rgba(61,107,255,.3);"></div>', className:'', iconSize:[16,16], iconAnchor:[8,8] })
    }).addTo(markersLayer);
    status.textContent = inCalamba
      ? 'Showing food stalls sorted by distance from you.'
      : 'You look like you\'re outside Calamba City — showing stalls sorted by distance anyway.';
    applyFilters();
  }, err=>{
    status.textContent = 'Couldn\'t get your location — showing citywide results instead.';
  });
}

/* ---------- events ---------- */
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('categorySelect').addEventListener('change', ()=>{
  const val = document.getElementById('categorySelect').value;
  document.querySelectorAll('#chipRow .chip').forEach(c=>c.classList.toggle('active', c.dataset.cat === val));
  applyFilters();
});
document.getElementById('searchBtn').addEventListener('click', applyFilters);
document.getElementById('locateBtn').addEventListener('click', locateMe);

document.getElementById('chipRow').querySelectorAll('.chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('#chipRow .chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('categorySelect').value = chip.dataset.cat;
    applyFilters();
  });
});

document.querySelectorAll('.cat-tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const cat = tile.dataset.cat;
    document.getElementById('categorySelect').value = cat;
    document.querySelectorAll('#chipRow .chip').forEach(c=>c.classList.toggle('active', c.dataset.cat === cat));
    applyFilters();
    document.getElementById('map-section').scrollIntoView({ behavior:'smooth' });
  });
});

/* ---------- boot ---------- */
try{ initMap(); }catch(e){ console.error('Map init failed:', e); document.getElementById('mapStatus').textContent = 'Map unavailable in this preview — try opening the file directly in a browser.'; }
renderPicks();
loadPlaces();