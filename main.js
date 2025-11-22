
const gallery = document.getElementById('gallery');
const favGrid = document.getElementById('fav-grid');
const favoritesSection = document.getElementById('favorites');
const btnFavorites = document.getElementById('btn-favorites');
const btnExplore = document.getElementById('btn-explore');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const loadMoreBtn = document.getElementById('load-more');

let page = 1;
const perPage = 25;
let currentQuery = ''; 
function createCard(item) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = item.id;

  const img = document.createElement("img");
  img.src = item.src;
  img.alt = item.title || "";

  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn";
  likeBtn.innerHTML = isFavorited(item.id) ? "♥" : "♡";

  likeBtn.onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(item);
    likeBtn.innerHTML = isFavorited(item.id) ? "♥" : "♡";
  };

  div.appendChild(img);
  div.appendChild(likeBtn);

  return div;
}

function getFavorites(){ return JSON.parse(localStorage.getItem('cp_favs')||'[]'); }
function saveFavorites(list){ localStorage.setItem('cp_favs', JSON.stringify(list)); }
function isFavorited(id){ return getFavorites().some(x=>x.id===id); }
function toggleFavorite(item){
  const favs = getFavorites();
  if(isFavorited(item.id)){
    saveFavorites(favs.filter(x=>x.id!==item.id));
  } else {
    favs.unshift(item);
    saveFavorites(favs);
  }
  renderFavs();
}

async function fetchFromUnsplash(page = 1, query = ''){
  const key = window.UNSPLASH_KEY; 
  if(!key){
    throw new Error('Cle API Unsplash manquante : definissez window.UNSPLASH_KEY dans config.js');
  }

  const per = perPage;
  let url;
  if(query && query.length>0){
    url = `https://api.unsplash.com/search/photos?page=${page}&per_page=${per}&query=${encodeURIComponent(query)}`;
  } else {
    url = `https://api.unsplash.com/photos?page=${page}&per_page=${per}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: 'Client-ID ' + key,
      'Accept-Version': 'v1'
    }
  });

  if(!res.ok){
    throw new Error('Erreur fetch Unsplash: ' + res.status);
  }
  const data = await res.json();
  const items = query ? data.results : data;

  return items.map(p => ({
    id: p.id,
    title: p.description || p.alt_description || (p.user && p.user.name) || 'Untitled',
    src: (p.urls && (p.urls.regular || p.urls.small)) || '',
    author: (p.user && p.user.name) || 'Unknown',
    palette: p.color ? [p.color] : ['#e9e3d5']
  }));
}


async function renderPage(pageToRender = 1){
  try{
    const items = await fetchFromUnsplash(pageToRender, currentQuery);
    if(pageToRender === 1 && !currentQuery){
    }
    items.forEach(it => gallery.appendChild(createCard(it)));
  } catch(err){
    console.error(err);
    if(pageToRender===1) gallery.innerHTML = '<p style="color:#6b7280">Erreur lors du chargement des images.</p>';
  }
}

function renderFavs(){
  if(!favGrid) return;
  favGrid.innerHTML = '';
  const favs = getFavorites();
  if(favs.length===0){
    favGrid.innerHTML = '<p style="color:#6b7280">Aucun favori pour le moment.</p>';
    return;
  }
  favs.forEach(it => {
    favGrid.appendChild(createCard(it));
  });
}

gallery.innerHTML = '';
renderPage(page);
renderFavs();

loadMoreBtn?.addEventListener('click', ()=> {
  page++;
  renderPage(page);
});

btnFavorites?.addEventListener('click', ()=> {
  document.querySelector('.gallery-section').classList.toggle('hidden');
  favoritesSection.classList.toggle('hidden');
});

btnExplore?.addEventListener('click', ()=> {
  favoritesSection.classList.add('hidden');
  document.querySelector('.gallery-section').classList.remove('hidden');
  
  currentQuery = '';
  gallery.innerHTML = '';
  page = 1;
  renderPage(page);
});

searchForm?.addEventListener('submit', async (e)=> {
  e.preventDefault();
  const q = searchInput.value.trim();
  currentQuery = q;
  page = 1;
  gallery.innerHTML = '';
  try {
    const items = await fetchFromUnsplash(page, currentQuery);
    if(items.length===0){
      gallery.innerHTML = '<p style="color:#6b7280">Aucun résultat trouvé.</p>';
      return;
    }
    items.forEach(it => gallery.appendChild(createCard(it)));
  } catch(err){
    console.error(err);
    gallery.innerHTML = '<p style="color:#6b7280">Erreur lors de la recherche.</p>';
  }
});


