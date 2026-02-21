const folderInput = document.getElementById("folderInput");
const videoInput = document.getElementById("videoInput");
const videoList = document.getElementById("videoList");
const videoPlayer = document.getElementById("videoPlayer");
const statusEl = document.getElementById("status");
const shuffleButton = document.getElementById("shuffleButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

/** @type {{name:string,url:string}[]} */
let videos = [];
/** @type {number[]} */
let playOrder = [];
let currentOrderIndex = -1;

function enableControls(enabled) {
  shuffleButton.disabled = !enabled;
  prevButton.disabled = !enabled;
  nextButton.disabled = !enabled;
}

function shuffleOrder(order) {
  const arr = [...order];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderList() {
  videoList.innerHTML = "";

  videos.forEach((video, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = video.name;
    button.type = "button";
    button.classList.toggle("active", playOrder[currentOrderIndex] === index);
    button.addEventListener("click", () => {
      const orderIndex = playOrder.indexOf(index);
      if (orderIndex >= 0) {
        loadVideoByOrderIndex(orderIndex);
      }
    });
    item.appendChild(button);
    videoList.appendChild(item);
  });
}

function loadVideoByOrderIndex(orderIndex) {
  if (orderIndex < 0 || orderIndex >= playOrder.length) return;
  currentOrderIndex = orderIndex;

  const videoIndex = playOrder[currentOrderIndex];
  const selected = videos[videoIndex];
  videoPlayer.src = selected.url;
  videoPlayer.play().catch(() => {
    // Interação do usuário pode ser necessária.
  });
  statusEl.textContent = `Reproduzindo: ${selected.name} (${currentOrderIndex + 1}/${playOrder.length})`;
  renderList();
}

function setVideos(items) {
  videos = [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (videos.length === 0) {
    playOrder = [];
    currentOrderIndex = -1;
    videoPlayer.removeAttribute("src");
    videoPlayer.load();
    statusEl.textContent = "Nenhum vídeo salvo ainda. Adicione arquivos para começar.";
    renderList();
    enableControls(false);
    return;
  }

  playOrder = videos.map((_, index) => index);
  currentOrderIndex = 0;
  enableControls(true);
  renderList();
  loadVideoByOrderIndex(currentOrderIndex);
}

async function fetchLibrary() {
  try {
    const response = await fetch("/api/videos");
    if (!response.ok) throw new Error("Falha ao carregar vídeos salvos.");
    const payload = await response.json();
    setVideos(payload.videos ?? []);
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : "Erro ao carregar a biblioteca.";
  }
}

async function uploadFiles(files) {
  if (!files.length) return;

  const formData = new FormData();
  files.forEach((file) => {
    const relativeName = file.webkitRelativePath || file.name;
    formData.append("videos", file, relativeName);
  });

  statusEl.textContent = "Enviando vídeos para salvar no aplicativo...";

  try {
    const response = await fetch("/api/videos/upload", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Falha ao salvar os vídeos.");
    }

    setVideos(payload.videos ?? []);
    statusEl.textContent = payload.message || "Vídeos salvos com sucesso.";
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : "Erro ao enviar os arquivos.";
  }
}

videoInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files ?? []);
  await uploadFiles(files);
  event.target.value = "";
});

folderInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files ?? []);
  await uploadFiles(files);
  event.target.value = "";
});

shuffleButton.addEventListener("click", () => {
  if (videos.length === 0) return;

  const currentVideo = playOrder[currentOrderIndex];
  playOrder = shuffleOrder(playOrder);
  currentOrderIndex = Math.max(0, playOrder.indexOf(currentVideo));

  statusEl.textContent = "Ordem embaralhada com sucesso.";
  loadVideoByOrderIndex(currentOrderIndex);
});

nextButton.addEventListener("click", () => {
  if (playOrder.length === 0) return;
  const next = (currentOrderIndex + 1) % playOrder.length;
  loadVideoByOrderIndex(next);
});

prevButton.addEventListener("click", () => {
  if (playOrder.length === 0) return;
  const prev = (currentOrderIndex - 1 + playOrder.length) % playOrder.length;
  loadVideoByOrderIndex(prev);
});

videoPlayer.addEventListener("ended", () => {
  if (playOrder.length > 0) {
    const next = (currentOrderIndex + 1) % playOrder.length;
    loadVideoByOrderIndex(next);
  }
});

fetchLibrary();
