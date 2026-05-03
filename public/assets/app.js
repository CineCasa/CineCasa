// TROCAR PARA SUA URL DO WORKER SE NECESSÁRIO
const API_BASE = "https://SEU-WORKER.workers.dev";

// Detectar tipo de página do atributo data do script
const currentScript = document.currentScript || document.querySelector('script[src*="app.js"]');
const PAGE_TYPE = currentScript?.dataset?.pageType || 'home';

let scrollBeforeOpen = 0;
let currentTmdbId = null;
let currentTitle = null;
let currentDesc = null;
let currentTrailerUrl = null;

// =====================
// HERO BANNER SYSTEM
// =====================
const heroBanner = document.getElementById("heroBanner");
const heroTitle = document.getElementById("heroTitle");
const heroFlag = document.getElementById("heroFlag");
const heroYear = document.getElementById("heroYear");
const heroGenre = document.getElementById("heroGenre");
const heroRating = document.getElementById("heroRating");
const heroDesc = document.getElementById("heroDesc");
const heroWatchBtn = document.getElementById("heroWatchBtn");
const heroListBtn = document.getElementById("heroListBtn");

// Estado do banner
let bannerItems = [];
let bannerQueue = [];
let currentBannerIndex = -1;
let bannerRotationInterval = null;
const BANNER_ROTATION_TIME = 12000; // 12 segundos

// Cache de países (flagcdn)
const countryCache = new Map();

// Função para obter URL da bandeira
function getFlagUrl(countryCode) {
  if (!countryCode) return "";
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`;
}

// Shuffle array (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Carregar banners do endpoint
async function loadBanners() {
  try {
    let endpoint = "";
    switch (PAGE_TYPE) {
      case "movies":
        endpoint = "/banners/filmes";
        break;
      case "series":
        endpoint = "/banners/series";
        break;
      case "home":
      default:
        endpoint = "/banners/home";
        break;
    }

    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error("Failed to load banners");

    const data = await res.json();
    
    // Filtrar apenas itens com imagem válida
    bannerItems = data.filter(item => {
      const imgUrl = item.backdrop || item.banner;
      return imgUrl && imgUrl.trim() !== "";
    });

    if (bannerItems.length === 0) {
      console.log("No banners available");
      return;
    }

    // Inicializar fila embaralhada
    bannerQueue = shuffleArray(bannerItems);
    currentBannerIndex = 0;

    // Mostrar primeiro banner
    showBanner(bannerQueue[0]);

    // Iniciar rotação automática
    startBannerRotation();

  } catch (err) {
    console.error("Error loading banners:", err);
  }
}

// Mostrar banner específico
function showBanner(item) {
  if (!item || !heroBanner) return;

  const imgUrl = item.backdrop || item.banner;
  if (!imgUrl) return;

  // Atualizar background com fade suave
  heroBanner.style.opacity = "0.8";
  
  setTimeout(() => {
    heroBanner.style.backgroundImage = `url(${imgUrl})`;
    heroBanner.style.opacity = "1";
  }, 100);

  // Atualizar metadados
  if (heroTitle) heroTitle.textContent = item.titulo || item.title || "";
  if (heroYear) heroYear.textContent = item.year || "";
  if (heroGenre) heroGenre.textContent = item.genre || "";
  if (heroRating) heroRating.textContent = item.rating ? `⭐ ${item.rating}` : "";
  if (heroDesc) heroDesc.textContent = item.description || item.overview || "";

  // Atualizar bandeira
  if (heroFlag) {
    const country = item.country;
    if (country) {
      heroFlag.src = getFlagUrl(country);
      heroFlag.style.display = "block";
    } else {
      heroFlag.style.display = "none";
    }
  }

  // Atualizar dados dos botões
  currentTmdbId = item.tmdb_id || item.tmdbId || null;
  currentTitle = item.titulo || item.title || "";
  currentDesc = item.description || item.overview || "";
}

// Próximo banner
function nextBanner() {
  if (bannerQueue.length === 0) return;

  currentBannerIndex++;

  // Se acabou a fila, reembaralhar
  if (currentBannerIndex >= bannerQueue.length) {
    const lastItem = bannerQueue[bannerQueue.length - 1];
    bannerQueue = shuffleArray(bannerItems);
    
    // Evitar repetir o último item
    if (bannerQueue[0]?.tmdb_id === lastItem?.tmdb_id && bannerQueue.length > 1) {
      [bannerQueue[0], bannerQueue[1]] = [bannerQueue[1], bannerQueue[0]];
    }
    
    currentBannerIndex = 0;
  }

  showBanner(bannerQueue[currentBannerIndex]);
}

// Iniciar rotação automática
function startBannerRotation() {
  if (bannerRotationInterval) {
    clearInterval(bannerRotationInterval);
  }

  bannerRotationInterval = setInterval(() => {
    nextBanner();
  }, BANNER_ROTATION_TIME);
}

// Parar rotação
function stopBannerRotation() {
  if (bannerRotationInterval) {
    clearInterval(bannerRotationInterval);
    bannerRotationInterval = null;
  }
}

// Eventos dos botões do banner
if (heroWatchBtn) {
  heroWatchBtn.addEventListener("click", () => {
    if (currentTmdbId) {
      window.location.href = `./watch.html?tmdb=${currentTmdbId}`;
    }
  });
}

if (heroListBtn) {
  heroListBtn.addEventListener("click", async () => {
    if (!currentTmdbId) return;
    
    try {
      const res = await fetch(`${API_BASE}/list/watchlater`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id: currentTmdbId })
      });
      
      if (res.ok) {
        heroListBtn.textContent = "✓ Adicionado";
        setTimeout(() => {
          heroListBtn.textContent = "+ Minha lista";
        }, 2000);
      }
    } catch (err) {
      console.error("Error adding to list:", err);
    }
  });
}

// =====================
// OVERLAY TIKTOK (EXISTENTE)
// =====================
const player = document.getElementById("tiktokPlayer");
const backBtn = document.getElementById("backBtn");
const soundBtn = document.getElementById("soundBtn");
const watchNowBtn = document.getElementById("watchNowBtn");
const detailsBtn = document.getElementById("detailsBtn");
const bgVideo = document.getElementById("bgVideo");
const mainVideo = document.getElementById("mainVideo");
const playerTitle = document.getElementById("playerTitle");
const playerDesc = document.getElementById("playerDesc");

function lockScroll() {
  scrollBeforeOpen = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollBeforeOpen}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
}

function unlockScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  window.scrollTo(0, scrollBeforeOpen);
}

function openTikTokMode(withSound = false) {
  lockScroll();
  player.classList.add("active");
  playerTitle.textContent = currentTitle || "";
  playerDesc.textContent = currentDesc || "";
  bgVideo.src = currentTrailerUrl;
  mainVideo.src = currentTrailerUrl;
  bgVideo.muted = true;
  
  if (withSound) {
    mainVideo.muted = false;
    mainVideo.volume = 1;
    soundBtn.textContent = "🔊 Som";
  } else {
    mainVideo.muted = true;
    soundBtn.textContent = "🔇 Som";
  }
  
  bgVideo.play().catch(() => {});
  mainVideo.play().catch(() => {});
  
  setTimeout(() => {
    backBtn.focus();
  }, 100);
}

function closeTikTokMode() {
  player.classList.remove("active");
  bgVideo.pause();
  mainVideo.pause();
  bgVideo.src = "";
  mainVideo.src = "";
  unlockScroll();
}

// Overlay buttons
if (backBtn) {
  backBtn.addEventListener("click", closeTikTokMode);
}

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    mainVideo.muted = !mainVideo.muted;
    soundBtn.textContent = mainVideo.muted ? "🔇 Som" : "🔊 Som";
  });
}

if (watchNowBtn) {
  watchNowBtn.addEventListener("click", () => {
    window.location.href = `./watch.html?tmdb=${currentTmdbId}`;
  });
}

if (detailsBtn) {
  detailsBtn.addEventListener("click", () => {
    window.location.href = `./details.html?tmdb=${currentTmdbId}`;
  });
}

// =====================
// CARD CREATION (EXISTENTE)
// =====================
function isMobile() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "card focusable";
  card.tabIndex = 0;
  card.dataset.tmdb = item.tmdb_id || "";
  card.dataset.title = item.title || item.titulo || "";
  card.dataset.desc = item.overview || item.description || "";
  card.dataset.trailer = item.trailer_url || "";

  card.innerHTML = `
    <img class="poster" src="${item.poster || item.poster_url || ''}" alt="${item.title || item.titulo || ''}" loading="lazy">
    <video class="trailer" muted playsinline loop preload="none"></video>
    <div class="overlay-info">
      <p class="title">${item.title || item.titulo || ''}</p>
      <p class="subtitle">${item.year || ''} • ${item.genre || ''}</p>
    </div>
    <button class="glass-action focusable" tabindex="0">▶ Assistir</button>
  `;

  const poster = card.querySelector(".poster");
  const trailer = card.querySelector(".trailer");
  const glassBtn = card.querySelector(".glass-action");

  // Hover desktop: expandir e tocar trailer
  card.addEventListener("mouseenter", () => {
    if (!isMobile()) {
      card.classList.add("focused");
      if (item.trailer_url) {
        trailer.src = item.trailer_url;
        trailer.play().catch(() => {});
      }
    }
  });

  card.addEventListener("mouseleave", () => {
    card.classList.remove("focused");
    trailer.pause();
    trailer.src = "";
  });

  // Abrir overlay
  function openFromCard(withSound) {
    currentTmdbId = card.dataset.tmdb;
    currentTitle = card.dataset.title;
    currentDesc = card.dataset.desc;
    currentTrailerUrl = card.dataset.trailer;
    openTikTokMode(withSound);
  }

  // Mobile: primeiro toque abre overlay
  card.addEventListener("click", () => {
    if (isMobile()) {
      openFromCard(false);
      return;
    }
    openFromCard(false);
  });

  // Botão vidro abre overlay com som
  if (glassBtn) {
    glassBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFromCard(true);
    });
  }

  // Enter abre overlay (TV/desktop)
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      openFromCard(false);
    }
  });

  return card;
}

function createCategorySection(name, items) {
  const section = document.createElement("section");
  section.className = "category";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = name;
  section.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "grid";

  items.forEach(item => {
    grid.appendChild(createCard(item));
  });

  // Placeholder para alinhar última linha
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  grid.appendChild(placeholder);

  section.appendChild(grid);
  return section;
}

// =====================
// Navegação TV por setas (foco direcional)
// =====================
function getFocusableElements() {
  if (player && player.classList.contains("active")) {
    return Array.from(player.querySelectorAll(".focusable"));
  }
  const elements = Array.from(document.querySelectorAll(".focusable"));
  return elements;
}

function findClosestElement(current, direction) {
  const focusables = getFocusableElements();
  const currentRect = current.getBoundingClientRect();
  let best = null;
  let bestScore = Infinity;

  focusables.forEach(el => {
    if (el === current) return;
    const rect = el.getBoundingClientRect();
    const dx = rect.left - currentRect.left;
    const dy = rect.top - currentRect.top;

    // Filtrar por direção
    if (direction === "right" && rect.left <= currentRect.left) return;
    if (direction === "left" && rect.left >= currentRect.left) return;
    if (direction === "down" && rect.top <= currentRect.top) return;
    if (direction === "up" && rect.top >= currentRect.top) return;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestScore) {
      bestScore = distance;
      best = el;
    }
  });

  return best;
}

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (!active || !active.classList.contains("focusable")) return;

  if (e.key === "ArrowRight") {
    const next = findClosestElement(active, "right");
    if (next) next.focus();
    e.preventDefault();
  }
  if (e.key === "ArrowLeft") {
    const next = findClosestElement(active, "left");
    if (next) next.focus();
    e.preventDefault();
  }
  if (e.key === "ArrowDown") {
    const next = findClosestElement(active, "down");
    if (next) next.focus();
    e.preventDefault();
  }
  if (e.key === "ArrowUp") {
    const next = findClosestElement(active, "up");
    if (next) next.focus();
    e.preventDefault();
  }
  if (e.key === "Enter") {
    active.click();
    e.preventDefault();
  }
});

// =====================
// Load catalog
// =====================
async function loadCatalog() {
  const main = document.getElementById("catalog");
  if (!main) return;

  try {
    let endpoint = "/catalog";
    
    // Filtrar por tipo se necessário
    if (PAGE_TYPE === "movies") {
      // Para filmes, usa o catalog normal e filtra ou usa endpoint específico
    } else if (PAGE_TYPE === "series") {
      // Para séries, precisaria de endpoint específico
      endpoint = "/series"; // Se existir
    }

    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error("Failed to load catalog");
    
    const data = await res.json();
    const grouped = {};

    data.forEach(item => {
      const cat = item.category || "Sem categoria";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    main.innerHTML = "";
    Object.keys(grouped).forEach(catName => {
      main.appendChild(createCategorySection(catName, grouped[catName]));
    });

    // Focar primeiro card automaticamente em smart tv
    const firstCard = document.querySelector(".card");
    if (firstCard && !isMobile()) {
      firstCard.focus();
    }
  } catch (err) {
    console.error("Error loading catalog:", err);
  }
}

// =====================
// INITIALIZATION
// =====================
document.addEventListener("DOMContentLoaded", () => {
  // Carregar banners apenas se hero banner existir na página
  if (heroBanner) {
    loadBanners();
  }
  
  // Carregar catálogo
  loadCatalog();
});

// Pause banner rotation when tab is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopBannerRotation();
  } else {
    startBannerRotation();
  }
});
