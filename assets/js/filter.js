// 홈 화면 카드 그리드의 검색 · 어근 필터 · 페이징.
//
// 카드는 Hugo가 전부 미리 렌더링해 두었고, 여기서는 보이기/숨기기만 한다.
// 페이징은 서버가 아니라 "필터를 통과한 카드 집합"을 대상으로 하므로,
// 검색어를 넣으면 전체 단어에서 찾은 뒤 그 결과를 다시 페이지로 나눈다.
// (Hugo 기본 페이지네이션을 쓰면 현재 페이지에 있는 카드만 검색되어 버린다.)
(function () {
  var PAGE_SIZE = 12;

  var search = document.getElementById("search");
  var chipBox = document.getElementById("root-chips");
  var grid = document.getElementById("card-grid");
  var emptyNote = document.getElementById("empty-note");
  var pager = document.getElementById("pager");
  var summary = document.getElementById("pager-summary");

  // chipBox 는 없을 수 있다(묶인 어근이 없으면 칩 자체를 렌더링하지 않음).
  // 그 경우에도 검색과 페이징은 그대로 동작해야 한다.
  if (!search || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
  var state = { q: "", root: "", page: 1 };

  function matches(card) {
    var q = state.q;
    var okRoot = !state.root || card.dataset.root === state.root;
    var okQuery =
      !q ||
      card.dataset.word.indexOf(q) !== -1 ||
      card.dataset.korean.indexOf(q) !== -1 ||
      card.dataset.formula.indexOf(q) !== -1;
    return okRoot && okQuery;
  }

  // 페이지가 얼마 없으면 전부 보여주고, 많아지면 1 … 7 8 9 … 15 형태로 추린다.
  var PAGER_MAX = 7;

  function pageList(cur, total) {
    var out = [];
    if (total <= PAGER_MAX) {
      for (var n = 1; n <= total; n++) out.push(n);
      return out;
    }
    for (var i = 1; i <= total; i++) {
      var near = i === 1 || i === total || Math.abs(i - cur) <= 1;
      var item = near ? i : "…";
      if (item !== "…" || out[out.length - 1] !== "…") out.push(item);
    }
    return out;
  }

  function renderPager(total, totalPages, from, to) {
    if (summary) {
      summary.textContent = total ? total + "개 중 " + from + "–" + to : "";
    }
    if (!pager) return;

    pager.innerHTML = "";
    if (totalPages <= 1) {
      pager.hidden = true;
      return;
    }
    pager.hidden = false;

    var add = function (label, page, opts) {
      opts = opts || {};
      if (opts.gap) {
        var gap = document.createElement("span");
        gap.className = "pager-gap";
        gap.textContent = "…";
        pager.appendChild(gap);
        return;
      }
      var b = document.createElement("button");
      b.className = "pager-btn" + (opts.current ? " current" : "");
      b.textContent = label;
      b.disabled = !!opts.disabled;
      if (opts.current) b.setAttribute("aria-current", "page");
      if (opts.label) b.setAttribute("aria-label", opts.label);
      b.addEventListener("click", function () {
        state.page = page;
        render(true);
      });
      pager.appendChild(b);
    };

    add("‹", state.page - 1, {
      disabled: state.page === 1,
      label: "이전 페이지",
    });

    pageList(state.page, totalPages).forEach(function (p) {
      if (p === "…") add(null, null, { gap: true });
      else add(String(p), p, { current: p === state.page, label: p + "페이지" });
    });

    add("›", state.page + 1, {
      disabled: state.page === totalPages,
      label: "다음 페이지",
    });
  }

  function render(scroll) {
    var matched = cards.filter(matches);
    var totalPages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    var start = (state.page - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, matched.length);
    var visible = matched.slice(start, end);

    cards.forEach(function (c) {
      c.hidden = true;
    });
    visible.forEach(function (c) {
      c.hidden = false;
    });

    if (emptyNote) emptyNote.hidden = matched.length !== 0;
    renderPager(matched.length, totalPages, start + 1, end);

    if (scroll) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetToFirstPage() {
    state.page = 1;
    render(false);
  }

  search.addEventListener("input", function (e) {
    state.q = e.target.value.trim().toLowerCase();
    resetToFirstPage();
  });

  if (chipBox) chipBox.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;

    state.root = chip.dataset.root === state.root ? "" : chip.dataset.root;

    chipBox.querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("active", c.dataset.root === state.root);
    });

    resetToFirstPage();
  });

  render(false);
})();
