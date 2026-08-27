// 홈 화면 카드 그리드의 검색/어근 필터. 카드는 Hugo가 미리 렌더링해 두었고,
// 여기서는 data-* 속성을 읽어 보이기/숨기기만 한다.
(function () {
  var search = document.getElementById("search");
  var chipBox = document.getElementById("root-chips");
  var grid = document.getElementById("card-grid");
  var emptyNote = document.getElementById("empty-note");

  if (!search || !chipBox || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
  var activeRoot = "";

  function apply() {
    var q = search.value.trim().toLowerCase();
    var shown = 0;

    cards.forEach(function (card) {
      var matchesRoot = !activeRoot || card.dataset.root === activeRoot;
      var matchesQuery =
        !q ||
        card.dataset.word.indexOf(q) !== -1 ||
        card.dataset.korean.indexOf(q) !== -1 ||
        card.dataset.formula.indexOf(q) !== -1;

      var visible = matchesRoot && matchesQuery;
      card.hidden = !visible;
      if (visible) shown++;
    });

    if (emptyNote) emptyNote.hidden = shown !== 0;
  }

  search.addEventListener("input", apply);

  chipBox.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;

    activeRoot = chip.dataset.root === activeRoot ? "" : chip.dataset.root;

    chipBox.querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("active", c.dataset.root === activeRoot);
    });

    apply();
  });

  apply();
})();
