// 단어 발음 재생. 브라우저 내장 Web Speech API(speechSynthesis)를 쓴다.
//
// 음성 파일을 만들어 두지 않는 이유: 단어가 늘어날 때마다 오디오를 생성해 커밋해야 하고
// 저장소가 계속 무거워진다. 내장 TTS는 파일도 네트워크 요청도 없고 다어절 표제어
// ("rare earth metal")도 그대로 읽는다. 대신 음성 품질과 목록은 기기마다 다르다.
(function () {
  var synth = window.speechSynthesis;
  var supported = !!synth && typeof window.SpeechSynthesisUtterance === "function";

  if (!supported) {
    // 지원하지 않는 브라우저에서는 스피커 버튼을 감추고, 제목은 그냥 글자로 남긴다.
    document.documentElement.classList.add("no-speech");
    return;
  }

  var voice = null;

  function pickVoice() {
    var vs = synth.getVoices();
    if (!vs.length) return;
    voice =
      vs.filter(function (v) { return v.lang === "en-US" && v.localService === false; })[0] ||
      vs.filter(function (v) { return v.lang === "en-US"; })[0] ||
      vs.filter(function (v) { return v.lang && v.lang.slice(0, 2) === "en"; })[0] ||
      null;
  }

  pickVoice();
  // 목록이 비동기로 채워지는 브라우저(크롬 계열)를 위해 한 번 더 받는다.
  if (typeof synth.onvoiceschanged !== "undefined") {
    synth.addEventListener("voiceschanged", pickVoice);
  }

  var speakingBtn = null;

  function clearState() {
    if (speakingBtn) speakingBtn.classList.remove("speaking");
    speakingBtn = null;
  }

  function speak(text, btn) {
    // 연달아 누르면 앞의 발음을 끊고 새로 읽는다.
    synth.cancel();
    clearState();

    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    if (voice) u.voice = voice;
    u.rate = 0.9;

    btn.classList.add("speaking");
    speakingBtn = btn;
    u.onend = clearState;
    u.onerror = clearState;

    synth.speak(u);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-speak]");
    if (!btn) return;
    // 카드 전체가 상세 페이지 링크이므로, 스피커를 눌렀을 때는 이동을 막는다.
    e.preventDefault();
    e.stopPropagation();
    speak(btn.getAttribute("data-speak"), btn);
  });

  // 페이지를 떠날 때 읽던 것을 멈춘다(뒤로 가기 후에도 계속 읽는 것을 막음).
  window.addEventListener("pagehide", function () {
    synth.cancel();
    clearState();
  });
})();
