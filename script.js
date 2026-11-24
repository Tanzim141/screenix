const API_KEY = "5f8bbec0";
const API_URL = "https://www.omdbapi.com/";
const FALLBACK_POSTER =
  "https://via.placeholder.com/300x450/121216/71717a?text=No+Poster";

const HERO_FEATURED = [
  { imdbID: "tt15398776", rank: "#1 in movies" },
  { imdbID: "tt0468569", rank: "#2 in movies" },
  { imdbID: "tt0816692", rank: "#3 in movies" },
  { imdbID: "tt1375666", rank: "#4 in movies" },
];

let currentMovies = [];
let heroSlides = [];
let heroIndex = 0;
let heroTimer = null;

let activeTab = "home";
let activeSort = "default";
let currentQuery = "Interstellar";

let watchlist = JSON.parse(localStorage.getItem("screenix_watchlist")) || [];
let recentSearches = JSON.parse(localStorage.getItem("screenix_recent")) || [];

const navbar = document.getElementById("navbar");
const brandLogo = document.getElementById("brandLogo");
const navItems = document.querySelectorAll(".nav-item");
const searchToggleBtn = document.getElementById("searchToggleBtn");
const searchDrawer = document.getElementById("searchDrawer");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const recentWrap = document.getElementById("recentWrap");
const recentChips = document.getElementById("recentChips");

const heroSection = document.getElementById("heroSection");
const heroBackdrop = document.getElementById("heroBackdrop");
const heroContent = document.getElementById("heroContent");
const heroDots = document.getElementById("heroDots");

const mainSection = document.querySelector(".main-section");
const sectionTitle = document.getElementById("sectionTitle");
const resultCount = document.getElementById("resultCount");
const exploreControls = document.getElementById("exploreControls");
const explorePills = document.querySelectorAll("#explorePills .pill");
const sortSelect = document.getElementById("sortSelect");
const clearWatchlistBtn = document.getElementById("clearWatchlistBtn");
const watchlistCount = document.getElementById("watchlistCount");

const movieGrid = document.getElementById("movieGrid");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyMessage = document.getElementById("emptyMessage");

const movieModal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");
const toast = document.getElementById("toast");

function getHighResPoster(url) {
  if (!url || url === "N/A") return FALLBACK_POSTER;
  return url.replace("SX300", "SX1200");
}

async function loadHeroSlides() {
  if (!API_KEY || API_KEY === "YOUR_OMDB_API_KEY") return;

  try {
    const responses = await Promise.all(
      HERO_FEATURED.map(async (item) => {
        const res = await fetch(`${API_URL}?i=${item.imdbID}&apikey=${API_KEY}`);
        const data = await res.json();
        return data.Response === "True" ? { ...data, rank: item.rank } : null;
      })
    );

    heroSlides = responses.filter(Boolean);
    if (heroSlides.length > 0) {
      heroIndex = 0;
      renderHero();
      startHeroRotation();
    }
  } catch (err) {
    console.error("Failed to load hero slides:", err);
  }
}

function renderHero() {
  if (heroSlides.length === 0) return;
  const movie = heroSlides[heroIndex];
  const hdPoster = getHighResPoster(movie.Poster);
  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movie.Title} ${movie.Year} official trailer`
  )}`;

  heroBackdrop.innerHTML = `
    <div class="hero-ambient" style="background-image: url('${hdPoster}')"></div>
    <img class="hero-movie-art" src="${hdPoster}" alt="${movie.Title}" />
  `;

  heroContent.innerHTML = `
    <div class="top10-row">
      <span class="top10-badge">TOP<br/>10</span>
      <span class="top10-text">★ ${movie.rank}</span>
    </div>
    <h2 class="hero-title">${movie.Title}</h2>
    <div class="hero-meta">
      <span class="meta-pill gold">★ ${movie.imdbRating}</span>
      <span class="meta-pill">${movie.Year}</span>
      <span class="meta-pill">${movie.Genre.split(",")[0]}</span>
      <span class="meta-pill">${movie.Runtime}</span>
    </div>
    <p class="hero-plot">${movie.Plot}</p>
    <div class="hero-actions">
      <a href="${trailerUrl}" target="_blank" rel="noopener noreferrer" class="btn-white">
        ▶ Play
      </a>
      <button class="btn-glass" id="heroInfoBtn">More Info</button>
    </div>
  `;

  heroDots.innerHTML = heroSlides
    .map(
      (_, i) =>
        `<button class="hero-dot ${i === heroIndex ? "active" : ""}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`
    )
    .join("");

  document.getElementById("heroInfoBtn").addEventListener("click", () => {
    fetchMovieDetails(movie.imdbID);
  });
}

function startHeroRotation() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    if (activeTab !== "watchlist" && heroSlides.length > 1) {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      renderHero();
    }
  }, 6500);
}

async function fetchMovies(query, typeFilter = "") {
  if (!API_KEY || API_KEY === "YOUR_OMDB_API_KEY") {
    showError("Paste your OMDb API Key on line 1 of script.js to load titles.");
    return;
  }

  currentQuery = query;
  setUIState("loading");

  try {
    const typeParam = typeFilter ? `&type=${typeFilter}` : "";
    const response = await fetch(
      `${API_URL}?s=${encodeURIComponent(query)}${typeParam}&apikey=${API_KEY}`
    );

    if (response.status === 401) {
      throw new Error("API Key not activated (401). Please click the activation link in your email.");
    }
    if (!response.ok) {
      throw new Error(`Server error (${response.status}). Please try again.`);
    }

    const data = await response.json();

    if (data.Response === "False") {
      currentMovies = [];
      showEmpty(
        "No matching titles found",
        `We couldn't find anything for "${query}". Try a different keyword.`
      );
      return;
    }

    currentMovies = data.Search;
    applySortAndRender();
  } catch (err) {
    showError(err.message || "Network error. Please check your internet connection.");
  }
}

async function fetchMovieDetails(imdbID) {
  movieModal.classList.remove("hidden");
  modalBody.innerHTML = `
    <div style="padding: 64px; text-align: center; color: #a1a1aa;">
      Loading details...
    </div>
  `;

  try {
    const response = await fetch(
      `${API_URL}?i=${encodeURIComponent(imdbID)}&plot=full&apikey=${API_KEY}`
    );
    if (!response.ok) throw new Error("Failed to load details.");

    const movie = await response.json();
    if (movie.Response === "False") throw new Error(movie.Error);

    renderModal(movie);
  } catch (err) {
    modalBody.innerHTML = `
      <div style="padding: 48px; text-align: center; color: #eab308;">
        ${err.message}
      </div>
    `;
  }
}

function applySortAndRender() {
  if (activeTab === "watchlist") {
    renderWatchlistView();
    return;
  }

  let list = [...currentMovies];

  if (activeSort === "newest") {
    list.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
  } else if (activeSort === "oldest") {
    list.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
  } else if (activeSort === "az") {
    list.sort((a, b) => a.Title.localeCompare(b.Title));
  }

  renderMovieGrid(list);
}

function renderWatchlistView() {
  sectionTitle.textContent = "My Watchlist";
  clearWatchlistBtn.classList.toggle("hidden", watchlist.length === 0);

  if (watchlist.length === 0) {
    showEmpty(
      "Your Watchlist is empty",
      "Click the star button on any movie card to save it here."
    );
    return;
  }

  renderMovieGrid(watchlist);
}

function renderMovieGrid(movies) {
  setUIState("grid");
  resultCount.textContent = `${movies.length} ${movies.length === 1 ? "title" : "titles"}`;

  movieGrid.innerHTML = movies
    .map((movie, idx) => {
      const poster = movie.Poster !== "N/A" ? movie.Poster : FALLBACK_POSTER;
      const isSaved = Boolean(watchlist.find((item) => item.imdbID === movie.imdbID));

      return `
        <article class="movie-card" data-id="${movie.imdbID}" style="animation-delay: ${idx * 45}ms">
          <div class="poster-box">
            <img
              src="${poster}"
              alt="${movie.Title}"
              loading="lazy"
              onerror="this.src='${FALLBACK_POSTER}'"
            />
            <div class="poster-gradient"></div>
            <span class="year-badge">${movie.Year}</span>
            <button
              class="fav-btn ${isSaved ? "saved" : ""}"
              data-fav-id="${movie.imdbID}"
              title="${isSaved ? "Remove from Watchlist" : "Add to Watchlist"}"
            >
              ${isSaved ? "★" : "☆"}
            </button>
            <div class="center-play">▶</div>
            <div class="card-caption">
              <h3 class="card-title" title="${movie.Title}">${movie.Title}</h3>
              <span class="card-type">${movie.Type}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderModal(movie) {
  const poster = movie.Poster !== "N/A" ? movie.Poster : FALLBACK_POSTER;
  const isSaved = Boolean(watchlist.find((item) => item.imdbID === movie.imdbID));
  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${movie.Title} ${movie.Year} official trailer`
  )}`;

  modalBody.innerHTML = `
    <div class="modal-inner">
      <img
        class="modal-poster"
        src="${poster}"
        alt="${movie.Title}"
        onerror="this.src='${FALLBACK_POSTER}'"
      />
      <div class="modal-info">
        <h2>${movie.Title}</h2>
        <div class="modal-badges">
          <span class="meta-pill gold">★ ${movie.imdbRating} IMDb</span>
          <span class="meta-pill">${movie.Year}</span>
          <span class="meta-pill">${movie.Runtime}</span>
          <span class="meta-pill">${movie.Rated}</span>
        </div>
        <p class="modal-plot">${movie.Plot}</p>
        <ul class="modal-meta">
          <li><strong>Genre:</strong> ${movie.Genre}</li>
          <li><strong>Director:</strong> ${movie.Director}</li>
          <li><strong>Cast:</strong> ${movie.Actors}</li>
          <li><strong>Awards:</strong> ${movie.Awards}</li>
        </ul>
        <div class="modal-actions">
          <a href="${trailerUrl}" target="_blank" rel="noopener noreferrer" class="btn-white">
            ▶ Play Trailer
          </a>
          <button class="btn-glass" id="modalFavBtn">
            ${isSaved ? "★ In Watchlist" : "+ Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modalFavBtn").addEventListener("click", () => {
    toggleWatchlist(movie.imdbID, movie);
    renderModal(movie);
  });
}

function toggleWatchlist(imdbID, fallbackObj = null) {
  const existing = watchlist.find((item) => item.imdbID === imdbID);

  if (existing) {
    watchlist = watchlist.filter((item) => item.imdbID !== imdbID);
    showToast(`Removed "${existing.Title}" from Watchlist`);
  } else {
    const target = currentMovies.find((m) => m.imdbID === imdbID) || fallbackObj;
    if (target) {
      watchlist.push({
        imdbID: target.imdbID,
        Title: target.Title,
        Year: target.Year,
        Type: target.Type,
        Poster: target.Poster,
      });
      showToast(`Saved "${target.Title}" to Watchlist`);
    }
  }

  localStorage.setItem("screenix_watchlist", JSON.stringify(watchlist));
  updateWatchlistCount();
  applySortAndRender();
}

function saveRecentSearch(term) {
  const clean = term.trim();
  if (!clean) return;

  recentSearches = [
    clean,
    ...recentSearches.filter((q) => q.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, 5);

  localStorage.setItem("screenix_recent", JSON.stringify(recentSearches));
  renderRecentChips();
}

function renderRecentChips() {
  if (recentSearches.length === 0) {
    recentWrap.classList.add("hidden");
    return;
  }

  recentWrap.classList.remove("hidden");
  recentChips.innerHTML = recentSearches
    .map((q) => `<button class="recent-chip" data-query="${q}">${q}</button>`)
    .join("");
}

function updateWatchlistCount() {
  watchlistCount.textContent = watchlist.length;
}

function setUIState(state) {
  loadingState.classList.toggle("hidden", state !== "loading");
  errorState.classList.toggle("hidden", state !== "error");
  emptyState.classList.toggle("hidden", state !== "empty");
  movieGrid.classList.toggle("hidden", state !== "grid");
  if (state !== "grid") resultCount.textContent = "";
}

function showError(msg) {
  errorMessage.textContent = msg;
  setUIState("error");
}

function showEmpty(title, msg) {
  emptyTitle.textContent = title;
  emptyMessage.textContent = msg;
  setUIState("empty");
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2400);
}

function switchTab(tab) {
  activeTab = tab;
  navItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));

  const isWatchlist = tab === "watchlist";
  heroSection.classList.toggle("hidden", isWatchlist);
  exploreControls.classList.toggle("hidden", isWatchlist);
  clearWatchlistBtn.classList.toggle("hidden", !isWatchlist || watchlist.length === 0);
  mainSection.classList.toggle("watchlist-mode", isWatchlist);

  if (isWatchlist) {
    renderWatchlistView();
    return;
  }

  if (tab === "home") {
    sectionTitle.textContent = "Trending Now";
    fetchMovies("Interstellar");
  } else if (tab === "movie") {
    sectionTitle.textContent = "Popular Movies";
    fetchMovies("Mission", "movie");
  } else if (tab === "series") {
    sectionTitle.textContent = "Top TV Shows";
    fetchMovies("Breaking", "series");
  } else if (tab === "anime") {
    sectionTitle.textContent = "Popular Anime";
    fetchMovies("Naruto");
  }
}

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 30);
});

navItems.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

brandLogo.addEventListener("click", () => switchTab("home"));

searchToggleBtn.addEventListener("click", () => {
  const isOpen = !searchDrawer.classList.contains("hidden");
  searchDrawer.classList.toggle("hidden", isOpen);
  searchToggleBtn.classList.toggle("active", !isOpen);
  if (!isOpen) searchInput.focus();
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    showToast("Type a movie or show name to search");
    return;
  }
  activeTab = "home";
  navItems.forEach((b) => b.classList.toggle("active", b.dataset.tab === "home"));
  heroSection.classList.remove("hidden");
  exploreControls.classList.remove("hidden");
  mainSection.classList.remove("watchlist-mode");
  explorePills.forEach((p) => p.classList.remove("active"));

  sectionTitle.textContent = `Results for "${query}"`;
  saveRecentSearch(query);
  fetchMovies(query);
  searchDrawer.classList.add("hidden");
  searchToggleBtn.classList.remove("active");
});

recentChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".recent-chip");
  if (!chip) return;
  searchInput.value = chip.dataset.query;
  sectionTitle.textContent = `Results for "${chip.dataset.query}"`;
  fetchMovies(chip.dataset.query);
  searchDrawer.classList.add("hidden");
  searchToggleBtn.classList.remove("active");
});

explorePills.forEach((pill) => {
  pill.addEventListener("click", () => {
    explorePills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    sectionTitle.textContent =
      pill.textContent === "All" ? "Trending Now" : `${pill.textContent} Picks`;
    fetchMovies(pill.dataset.query);
  });
});

sortSelect.addEventListener("change", (e) => {
  activeSort = e.target.value;
  applySortAndRender();
});

heroDots.addEventListener("click", (e) => {
  const dot = e.target.closest(".hero-dot");
  if (!dot) return;
  heroIndex = Number(dot.dataset.slide);
  renderHero();
  startHeroRotation();
});

clearWatchlistBtn.addEventListener("click", () => {
  watchlist = [];
  localStorage.setItem("screenix_watchlist", JSON.stringify(watchlist));
  updateWatchlistCount();
  renderWatchlistView();
  showToast("Watchlist cleared");
});

retryBtn.addEventListener("click", () => fetchMovies(currentQuery));

movieGrid.addEventListener("click", (e) => {
  const favBtn = e.target.closest(".fav-btn");
  if (favBtn) {
    e.stopPropagation();
    toggleWatchlist(favBtn.dataset.favId);
    return;
  }

  const card = e.target.closest(".movie-card");
  if (card) {
    fetchMovieDetails(card.dataset.id);
  }
});

closeModalBtn.addEventListener("click", () => movieModal.classList.add("hidden"));
movieModal.addEventListener("click", (e) => {
  if (e.target === movieModal) movieModal.classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") movieModal.classList.add("hidden");
});

updateWatchlistCount();
renderRecentChips();
loadHeroSlides();
fetchMovies(currentQuery);