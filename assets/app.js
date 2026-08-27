const REPO = "jeonck/voca";

const state = {
  words: [],
  filterRoot: null,
  query: "",
};

const el = (sel) => document.querySelector(sel);

function inline(text) {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function rootOf(entry) {
  const match = entry.formula.match(/([a-zA-Zāēīōū]{2,})-\s*\(/g) || [];
  if (!match.length) return null;
  const parts = match.map((m) => m.replace(/-.*/, "").trim());
  return parts.sort((a, b) => b.length - a.length)[0] || null;
}

function renderList() {
  const list = el("#word-list");
  list.innerHTML = "";
  const q = state.query.trim().toLowerCase();

  const filtered = state.words.filter((w) => {
    const matchesQuery =
      !q ||
      w.word.toLowerCase().includes(q) ||
      w.korean.toLowerCase().includes(q) ||
      w.formula.toLowerCase().includes(q);
    const matchesRoot = !state.filterRoot || rootOf(w) === state.filterRoot;
    return matchesQuery && matchesRoot;
  });

  if (!filtered.length) {
    const div = document.createElement("div");
    div.className = "empty-note";
    div.textContent = "일치하는 단어가 없어요. 아래에서 새 단어를 요청해 보세요.";
    list.appendChild(div);
    return;
  }

  filtered.forEach((w) => {
    const btn = document.createElement("button");
    btn.className = "word-card";
    btn.innerHTML = `<span class="w">${w.word}</span><span class="k">${w.korean}</span>`;
    btn.addEventListener("click", () => {
      location.hash = `#/${encodeURIComponent(w.word)}`;
    });
    list.appendChild(btn);
  });
}

function renderChips() {
  const chips = el("#root-chips");
  chips.innerHTML = "";
  const roots = [...new Set(state.words.map(rootOf).filter(Boolean))].sort();

  const allChip = document.createElement("button");
  allChip.className = "chip" + (state.filterRoot ? "" : " active");
  allChip.textContent = "전체";
  allChip.addEventListener("click", () => {
    state.filterRoot = null;
    renderChips();
    renderList();
  });
  chips.appendChild(allChip);

  roots.forEach((r) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (state.filterRoot === r ? " active" : "");
    chip.textContent = r;
    chip.addEventListener("click", () => {
      state.filterRoot = state.filterRoot === r ? null : r;
      renderChips();
      renderList();
    });
    chips.appendChild(chip);
  });
}

function renderDetail(word) {
  const entry = state.words.find(
    (w) => w.word.toLowerCase() === word.toLowerCase()
  );
  const container = el("#detail-body");

  if (!entry) {
    container.innerHTML = `
      <p>“${inline(word)}”는 아직 사전에 없어요.</p>
      <p><a class="btn" href="${requestUrl(word)}" target="_blank" rel="noopener">이 단어 요청하기</a></p>
    `;
    return;
  }

  const paragraphs = (entry.paragraphs || []).map((p) => `<p>${inline(p)}</p>`).join("");
  const family = (entry.family || [])
    .map((f) => `<li><span class="fw">${inline(f.word)}</span>${inline(f.note)}</li>`)
    .join("");
  const bridge = entry.bridge ? `<p class="bridge">${inline(entry.bridge)}</p>` : "";

  container.innerHTML = `
    <h2 class="detail-title">${entry.word}</h2>
    <p class="detail-korean">${entry.korean}</p>
    <div class="formula">${inline(entry.word)}(${entry.korean}) = ${inline(entry.formula)}</div>
    ${paragraphs}
    <div class="scene-box">
      <span class="label">장면으로 보면</span>
      <p style="margin:0">${inline(entry.scene)}</p>
    </div>
    <p class="closing">${inline(entry.closing)}</p>
    ${
      family.length
        ? `<h3 class="family-title">같은 뿌리를 가진 친척들</h3><ul class="family-list">${family}</ul>`
        : ""
    }
    ${bridge}
  `;
}

function requestUrl(prefillWord) {
  const base = `https://github.com/${REPO}/issues/new`;
  const params = new URLSearchParams({ template: "word-request.yml" });
  if (prefillWord) params.set("title", `[word] ${prefillWord}`);
  return `${base}?${params.toString()}`;
}

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const listView = el("#list-view");
  const detailView = el("#detail-view");

  if (hash) {
    const word = decodeURIComponent(hash);
    listView.classList.remove("active");
    detailView.classList.add("active");
    renderDetail(word);
    window.scrollTo(0, 0);
  } else {
    detailView.classList.remove("active");
    listView.classList.add("active");
  }
}

async function init() {
  const res = await fetch("data/words.json");
  state.words = await res.json();
  state.words.sort((a, b) => a.word.localeCompare(b.word));

  renderChips();
  renderList();

  el("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderList();
  });

  el("#back-btn").addEventListener("click", () => {
    location.hash = "";
  });

  el("#request-link").href = requestUrl();

  window.addEventListener("hashchange", route);
  route();
}

init();
