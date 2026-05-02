// ============================================
// RESPONSIVE STREAMING PLATFORM - APP.JS
// Mobile-first with touch & keyboard support
// ============================================

// TROCAR PARA SUA URL DO WORKER SE NECESSÁRIO
const API_BASE = "https://SEU-WORKER.workers.dev";

// State management
let scrollBeforeOpen = 0;
let currentTmdbId = null;
let currentTitle = null;
let currentDesc = null;
let currentTrailerUrl = null;
let isTouchDevice = false;
let screenWidth = window.innerWidth;

// DOM Elements
const player = document.getElementById("tiktokPlayer");
const backBtn = document.getElementById("backBtn");
const soundBtn = document.getElementById("soundBtn");
const watchNowBtn = document.getElementById("watchNowBtn");
const detailsBtn = document.getElementById("detailsBtn");
const bgVideo = document.getElementById("bgVideo");
const mainVideo = document.getElementById("mainVideo");
const playerTitle = document.getElementById("playerTitle");
const playerDesc = document.getElementById("playerDesc");

// ============================================
// DEVICE DETECTION
// ============================================
function detectDevice() {
  isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  screenWidth = window.innerWidth;
}

detectDevice();
window.addEventListener('resize', () => {
  screenWidth = window.innerWidth;
});

// ============================================
// SCROLL LOCK UTILITIES
// ============================================
function lockScroll() {
  scrollBeforeOpen = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollBeforeOpen}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollBeforeOpen);
}

// ============================================
// TIKTOK PLAYER MODE
// ============================================
function openTikTokMode(withSound = false) {
  lockScroll();
  player.classList.add("active");
  
  playerTitle.textContent = currentTitle || "";
  playerDesc.textContent = currentDesc || "";
  
  if (currentTrailerUrl) {
    bgVideo.src = currentTrailerUrl;
    mainVideo.src = currentTrailerUrl;
  }
  
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
  
  // Focus management for accessibility
  setTimeout(() => {
    if (!isTouchDevice) {
      backBtn.focus();
    }
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

// ============================================
// PLAYER CONTROLS
// ============================================
backBtn.addEventListener("click", closeTikTokMode);

soundBtn.addEventListener("click", () => {
  mainVideo.muted = !mainVideo.muted;
  soundBtn.textContent = mainVideo.muted ? "🔇 Som" : "🔊 Som";
  if (!mainVideo.muted) {
    mainVideo.volume = 1;
  }
});

watchNowBtn.addEventListener("click", () => {
  if (currentTmdbId) {
    window.location.href = `./watch.html?tmdb=${currentTmdbId}`;
  }
});

detailsBtn.addEventListener("click", () => {
  if (currentTmdbId) {
    window.location.href = `./details.html?tmdb=${currentTmdbId}`;
  }
});

// Escape key to close player
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && player.classList.contains("active")) {
    closeTikTokMode();
  }
});

// ============================================
// CARD CREATION - Responsive sizing
// ============================================
function getCardWidth() {
  if (screenWidth < 600) return 140;
  if (screenWidth < 1024) return 160;
  if (screenWidth < 1440) return 180;
  return 200;
}

function createCategorySection(categoryName, items) {
  const section = document.createElement("section");
  section.className = "category";
  
  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = categoryName || "Sem categoria";
  
  const grid = document.createElement("div");
  grid.className = "grid";
  
  items.forEach(movie => {
    grid.appendChild(createCard(movie));
  });
  
  section.appendChild(title);
  section.appendChild(grid);
  return section;
}

function createCard(movie) {
  const card = document.createElement("div");
  card.className = "card focusable";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Ver ${movie.titulo || 'conteúdo'}`);
  
  // Data attributes
  card.dataset.tmdb = movie.tmdb_id || "";
  card.dataset.title = movie.titulo || "";
  card.dataset.desc = movie.description || "Sem descrição disponível.";
  card.dataset.trailer = movie.trailer || "";
  card.dataset.poster = movie.poster || "";
  card.dataset.year = movie.year || "";
  card.dataset.genre = movie.genre || "";
  
  // HTML content
  card.innerHTML = `
    <img class="poster" src="${movie.poster || ''}" alt="${movie.titulo || 'Poster'}" loading="lazy">
    <video class="trailer" muted playsinline preload="metadata" aria-hidden="true"></video>
    <div class="glass-action" tabindex="-1">▶ Ver trailer com som</div>
    <div class="overlay-info">
      <p class="title">${movie.titulo || ''}</p>
      <p class="subtitle">${movie.year || ''} • ${movie.genre || ''}</p>
    </div>
  `;
  
  setupPreviewSystem(card);
  return card;
}

// ============================================
// PREVIEW SYSTEM - Mouse & Touch
// ============================================
function setupPreviewSystem(card) {
  let timer;
  let placeholder = null;
  const video = card.querySelector(".trailer");
  const glassBtn = card.querySelector(".glass-action");
  
  // Calculate position to keep card on screen
  function adjustPositionToScreen(rect) {
    const cardWidth = getCardWidth();
    const expandedWidth = screenWidth < 600 ? 200 : (screenWidth < 1024 ? 230 : 260);
    const previewHeight = Math.round((expandedWidth * 16) / 9);
    
    let left = rect.left;
    let top = rect.top;
    
    // Horizontal bounds
    if (left + expandedWidth > window.innerWidth - 10) {
      left = window.innerWidth - expandedWidth - 10;
    }
    if (left < 10) left = 10;
    
    // Vertical bounds
    if (top + previewHeight > window.innerHeight - 10) {
      top = window.innerHeight - previewHeight - 10;
    }
    if (top < 10) top = 10;
    
    return { left, top };
  }
  
  function makeFloating() {
    const rect = card.getBoundingClientRect();
    const fixedPos = adjustPositionToScreen(rect);
    
    placeholder = document.createElement("div");
    placeholder.className = "placeholder";
    placeholder.style.width = rect.width + "px";
    placeholder.style.height = rect.height + "px";
    
    card.parentNode.insertBefore(placeholder, card);
    card.style.position = "fixed";
    card.style.top = fixedPos.top + "px";
    card.style.left = fixedPos.left + "px";
  }
  
  function restoreFromFloating() {
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(card, placeholder);
      placeholder.remove();
      placeholder = null;
    }
    card.style.position = "";
    card.style.top = "";
    card.style.left = "";
  }
  
  function startPreview() {
    timer = setTimeout(() => {
      makeFloating();
      card.classList.add("focused");
      
      const trailerUrl = card.dataset.trailer;
      if (trailerUrl && !video.src) {
        video.src = trailerUrl;
      }
      
      video.currentTime = 0;
      video.muted = true;
      video.play().catch(() => {});
    }, 250);
  }
  
  function stopPreview() {
    clearTimeout(timer);
    card.classList.remove("focused");
    video.pause();
    video.currentTime = 0;
    restoreFromFloating();
  }
  
  // Desktop: hover/focus
  if (!isTouchDevice) {
    card.addEventListener("mouseenter", startPreview);
    card.addEventListener("mouseleave", stopPreview);
    card.addEventListener("focus", startPreview);
    card.addEventListener("blur", stopPreview);
  }
  
  // Open overlay function
  function openFromCard(withSound) {
    currentTmdbId = card.dataset.tmdb;
    currentTitle = card.dataset.title;
    currentDesc = card.dataset.desc;
    currentTrailerUrl = card.dataset.trailer;
    openTikTokMode(withSound);
  }
  
  // Touch: tap to open
  card.addEventListener("click", (e) => {
    if (!glassBtn.contains(e.target)) {
      openFromCard(false);
    }
  });
  
  // Glass button: open with sound
  glassBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openFromCard(true);
  });
  
  // Keyboard: Enter to open
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      openFromCard(false);
    }
  });
}

// ============================================
// TV/DIRECTIONAL NAVIGATION
// ============================================
function getFocusableElements() {
  if (player.classList.contains("active")) {
    return Array.from(player.querySelectorAll(".focusable, button"));
  }
  return Array.from(document.querySelectorAll(".card.focusable, .top-header button"));
}

function findClosestElement(current, direction) {
  const focusables = getFocusableElements();
  const currentRect = current.getBoundingClientRect();
  const currentCenterX = currentRect.left + currentRect.width / 2;
  const currentCenterY = currentRect.top + currentRect.height / 2;
  
  let best = null;
  let bestScore = Infinity;
  
  focusables.forEach(el => {
    if (el === current) return;
    
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = centerX - currentCenterX;
    const dy = centerY - currentCenterY;
    
    // Direction filtering
    if (direction === "right" && dx <= 0) return;
    if (direction === "left" && dx >= 0) return;
    if (direction === "down" && dy <= 0) return;
    if (direction === "up" && dy >= 0) return;
    
    // Weighted distance (prefer aligned elements)
    const distance = Math.sqrt(dx * dx + dy * dy);
    const alignment = direction === "left" || direction === "right" 
      ? Math.abs(dy) 
      : Math.abs(dx);
    
    const score = distance + alignment * 0.5;
    
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  });
  
  return best;
}

// Arrow key navigation
document.addEventListener("keydown", (e) => {
  // Skip if typing in input
  if (document.activeElement?.tagName === "INPUT") return;
  
  const active = document.activeElement;
  
  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      if (!active || !active.classList.contains("focusable")) {
        const firstCard = document.querySelector(".card");
        if (firstCard) firstCard.focus();
        return;
      }
      const nextRight = findClosestElement(active, "right");
      if (nextRight) nextRight.focus();
      break;
      
    case "ArrowLeft":
      e.preventDefault();
      if (!active || !active.classList.contains("focusable")) return;
      const nextLeft = findClosestElement(active, "left");
      if (nextLeft) nextLeft.focus();
      break;
      
    case "ArrowDown":
      e.preventDefault();
      if (!active || !active.classList.contains("focusable")) {
        const firstCard = document.querySelector(".card");
        if (firstCard) firstCard.focus();
        return;
      }
      const nextDown = findClosestElement(active, "down");
      if (nextDown) nextDown.focus();
      break;
      
    case "ArrowUp":
      e.preventDefault();
      if (!active || !active.classList.contains("focusable")) return;
      const nextUp = findClosestElement(active, "up");
      if (nextUp) nextUp.focus();
      break;
      
    case "Enter":
      if (active) {
        e.preventDefault();
        active.click();
      }
      break;
  }
});

// ============================================
// CATALOG LOADING
// ============================================
async function loadCatalog() {
  const main = document.getElementById("catalog");
  if (!main) return;
  
  try {
    const res = await fetch(`${API_BASE}/catalog`);
    if (!res.ok) throw new Error("Failed to load catalog");
    
    const data = await res.json();
    
    // Group by category
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
    
    // Focus first card on TV/desktop
    if (!isTouchDevice) {
      setTimeout(() => {
        const firstCard = document.querySelector(".card");
        if (firstCard) firstCard.focus();
      }, 100);
    }
    
  } catch (error) {
    console.error("Error loading catalog:", error);
    main.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #888;">
        <p>Erro ao carregar catálogo. Tente novamente mais tarde.</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;">Recarregar</button>
      </div>
    `;
  }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  detectDevice();
  loadCatalog();
});

// Handle resize
window.addEventListener("resize", () => {
  screenWidth = window.innerWidth;
});
