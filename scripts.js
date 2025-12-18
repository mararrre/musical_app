
const audio = new Audio();
let playlist = JSON.parse(localStorage.getItem("playlist")) || [];
let currentIndex = -1;
let isPlaying = false;

const playlistContainer = document.getElementById("playlist");
const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

function updatePlayButton() {
  if (!playBtn) return;

  playBtn.classList.remove("play", "pause");
  playBtn.classList.add(isPlaying ? "pause" : "play");
}

function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;

  currentIndex = index;
  audio.src = playlist[index].preview;
  audio.play();

  isPlaying = true;
  updatePlayButton();
  highlightActiveTrack();
}

function togglePlay() {
  if (!audio.src) return;

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }

  updatePlayButton();
}

function playPrev() {
  if (currentIndex > 0) {
    playTrack(currentIndex - 1);
  }
}

function playNext() {
  if (currentIndex < playlist.length - 1) {
    playTrack(currentIndex + 1);
  }
}

function renderPlaylist() {
  if (!playlistContainer) return;

  playlistContainer.innerHTML = "";

  if (playlist.length === 0) return;

  playlist.forEach((track, index) => {
    const div = document.createElement("div");
    div.className = "track";
    div.dataset.index = index;

    div.innerHTML = `
      <div class="track-info">
        <strong>${track.title}</strong>
        <span>${track.artist}</span>
      </div>
      <img src="resources/images/heart-filled.png" alt="remove">
    `;

    // play track on card click
    div.addEventListener("click", () => playTrack(index));

    // remove from playlist
    div.querySelector("img").addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromPlaylist(track.id);
    });

    playlistContainer.appendChild(div);
  });

  highlightActiveTrack();
}

function highlightActiveTrack() {
  if (!playlistContainer) return;

  document.querySelectorAll(".track").forEach(el => {
    el.style.outline = "";
  });

  if (currentIndex >= 0) {
    const active = document.querySelector(
      `.track[data-index="${currentIndex}"]`
    );
    if (active) {
      active.style.outline = "2px solid #1e6cff";
    }
  }
}

function savePlaylist() {
  localStorage.setItem("playlist", JSON.stringify(playlist));
}

function addToPlaylist(track) {
  if (playlist.some(t => t.id === track.id)) return;

  playlist.push(track);
  savePlaylist();
  renderPlaylist();
}

function removeFromPlaylist(id) {
  playlist = playlist.filter(t => t.id !== id);

  if (currentIndex >= playlist.length) {
    currentIndex = playlist.length - 1;
  }

  savePlaylist();
  renderPlaylist();
}

async function searchTracks(query) {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15`
  );

  const data = await response.json();
  return data.results;
}

function renderSearchResults(tracks) {
  if (!resultsContainer) return;

  resultsContainer.innerHTML = "";

  tracks.forEach(track => {
    if (!track.previewUrl) return;

    const inPlaylist = playlist.some(t => t.id === track.trackId);

    const div = document.createElement("div");
    div.className = "track";

    div.innerHTML = `
      <div class="track-info">
        <strong>${track.trackName}</strong>
        <span>${track.artistName}</span>
      </div>
      <img src="resources/images/${inPlaylist ? "❤" : "💔"}.png">
    `;

    div.querySelector("img").addEventListener("click", () => {
      if (inPlaylist) {
        removeFromPlaylist(track.trackId);
      } else {
        addToPlaylist({
          id: track.trackId,
          title: track.trackName,
          artist: track.artistName,
          preview: track.previewUrl
        });
      }

      renderSearchResults(tracks);
    });

    resultsContainer.appendChild(div);
  });
}

playBtn?.addEventListener("click", togglePlay);
prevBtn?.addEventListener("click", playPrev);
nextBtn?.addEventListener("click", playNext);

searchInput?.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (!query) {
    resultsContainer.innerHTML = "";
    return;
  }

  const tracks = await searchTracks(query);
  renderSearchResults(tracks);
});

audio.addEventListener("ended", () => {
  if (currentIndex < playlist.length - 1) {
    playNext();
  } else {
    isPlaying = false;
    updatePlayButton();
  }
});

renderPlaylist();
updatePlayButton();
