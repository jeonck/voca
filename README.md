# voca

영단어를 한국어 뜻으로 외우는 대신, **어근(root)을 분해해서 장면으로 이해**하는 어원 학습 사이트입니다.

예: `applicant(지원자) = ad-(~쪽으로) + plic-(접다, 포개다) + -ant(지금 그렇게 하고 있는 사람)` → "문에 자기를 밀착시켜 놓고 기다리는 사람"이라는 장면.

- 사이트: https://voca.metacog.co.kr
- 정적 사이트(순수 HTML/CSS/JS, 빌드 도구 없음) + GitHub Pages로 호스팅
- 새 단어는 GitHub 이슈로 요청하면 GitHub Actions가 Claude Code로 자동 생성해서 PR을 엽니다

## 구조

```
index.html          홈 (검색 + 단어 목록 + 상세 뷰, SPA)
assets/style.css     스타일
assets/app.js        데이터 로딩/검색/라우팅
data/words.json      단어 데이터 (아래 스키마)
CNAME                커스텀 도메인(voca.metacog.co.kr) 설정
.github/ISSUE_TEMPLATE/word-request.yml   "새 단어 요청" 이슈 폼
.github/workflows/generate-word.yml       요청된 단어를 자동 생성하는 워크플로
.github/workflows/pages.yml               main push 시 GitHub Pages로 배포
```

## data/words.json 스키마

```jsonc
{
  "word": "applicant",
  "korean": "지원자",
  "formula": "ad-(~쪽으로) + plic-(접다, 포개다) + -ant(지금 그렇게 하고 있는 사람)",
  "paragraphs": ["어근의 라틴어/그리스어 원형과 의미 설명 (1~3문단, **볼드**로 핵심 어근 강조)"],
  "scene": "한국어 뜻이 아니라 어원이 그리는 구체적인 장면 (1문단)",
  "closing": "사전적 번역이 놓치는 뉘앙스 (1~2문장)",
  "family": [{ "word": "apply", "note": "같은 어근을 가진 관련 단어와 그 그림" }],
  "bridge": "선택 필드 — 두 단어가 어원상 짝을 이루는 통찰이 있을 때만"
}
```

새 항목은 `word` 기준 알파벳 순으로 정렬되어 있습니다.

## 새 단어가 추가되는 과정

1. 사이트의 "새 단어 요청하기" 버튼 → GitHub 이슈 폼(`word-request.yml`)이 열립니다.
2. 이슈가 등록되면 `.github/workflows/generate-word.yml`이 실행되어, 등록된 `CLAUDE_CODE_OAUTH_TOKEN` 시크릿으로
   Claude Code가 위 스키마에 맞춰 새 단어 항목을 작성하고 `data/words.json`에 추가한 뒤 PR을 엽니다.
3. PR을 리뷰하고 머지하면 GitHub Pages가 자동으로 다시 배포되어 사이트에 반영됩니다.

**안전장치**: 자동 생성은 이슈 작성자가 저장소의 Owner/Collaborator/Member일 때만 실행됩니다(공개 저장소이므로
임의의 방문자가 이슈를 올려 토큰 사용량을 소모하는 것을 막기 위함). 다른 방문자의 요청은 직접 검토 후
`workflow_dispatch`(Actions 탭 → Generate word entry → Run workflow → word 입력)로 수동 실행하거나,
직접 PR로 추가해 주세요.

## 처음 설정 시 해야 할 일 (저장소 소유자)

1. **Settings → Actions → General → Workflow permissions**: "Read and write permissions"로 설정 (PR 생성에 필요).
2. **Settings → Secrets and variables → Actions**: `CLAUDE_CODE_OAUTH_TOKEN` 시크릿이 등록되어 있어야 합니다
   (로컬에서 `claude setup-token`으로 발급). 다른 이름으로 등록했다면 `generate-word.yml`의 시크릿 이름을 맞춰주세요.
3. **Settings → Pages**: Source를 **"GitHub Actions"** 로 설정하세요.
   배포는 `.github/workflows/pages.yml`이 담당하며, `main`에 push될 때마다 자동으로 다시 배포됩니다.
   Custom domain 칸의 `voca.metacog.co.kr`은 저장소의 `CNAME` 파일에서 자동 인식되고,
   DNS 확인이 끝나면 HTTPS 인증서가 발급됩니다.

   > 참고: 초기에는 "Deploy from a branch" 방식을 썼는데, 빌드가 한 번도 게시되지 않으면서
   > (`There isn't a GitHub Pages site here`) 아무 로그도 남지 않아 원인 추적이 불가능했습니다.
   > Actions 배포 방식은 매 배포가 Actions 탭에 기록되므로 실패해도 바로 진단할 수 있습니다.

## 로컬 확인

빌드 없이 정적 파일이므로 아무 정적 서버로 열어보면 됩니다.

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```
