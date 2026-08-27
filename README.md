# voca

영단어를 한국어 뜻으로 외우는 대신, **어근(root)을 분해해서 장면으로 이해**하는 어원 학습 사이트입니다.

예: `applicant(지원자) = ad-(~쪽으로) + plic-(접다, 포개다) + -ant(지금 그렇게 하고 있는 사람)` → "문에 자기를 밀착시켜 놓고 기다리는 사람"이라는 장면.

- 사이트: https://voca.metacog.co.kr
- **Hugo** 정적 사이트 생성기 + GitHub Pages(GitHub Actions 배포)
- 단어마다 개별 페이지를 갖고, 홈에서는 카드 그리드로 훑어볼 수 있습니다
- 새 단어는 GitHub 이슈로 요청하면 GitHub Actions가 Claude Code로 자동 생성해서 PR을 엽니다

## 구조

```
hugo.toml                    Hugo 설정 (baseURL, roots 분류 체계)
content/words/<word>.md      단어 한 개 = 파일 한 개 (아래 스키마)
layouts/
  _default/baseof.html       공통 뼈대
  index.html                 홈 — 검색 + 어근 칩(2개 이상 묶인 것만) + 카드 그리드 + 어근 목록 링크
  words/single.html          단어 상세 페이지
  words/list.html            전체 단어 목록
  _default/term.html         특정 어근을 공유하는 단어들
  _default/terms.html        어근 목록
  partials/word-card.html    카드 한 장
  partials/rich.html         본문 조각 렌더링 (아래 "마크다운 주의점" 참고)
assets/css/main.css          스타일 (Hugo Pipes로 minify + fingerprint)
assets/js/filter.js          홈 카드 검색/어근 필터
static/CNAME                 커스텀 도메인
.github/ISSUE_TEMPLATE/word-request.yml   "새 단어 요청" 이슈 폼
.github/workflows/generate-word.yml       요청된 단어를 자동 생성하는 워크플로
.github/workflows/pages.yml               main push 시 Hugo 빌드 → Pages 배포
```

## 단어 파일 스키마

`content/words/<word>.md` — 모든 내용은 YAML front matter에 담고 본문은 비워 둡니다.

```yaml
---
title: "applicant"
date: 2026-08-27T16:09:51+00:00   # 입력 날짜. 목록 정렬 기준이라 반드시 필요합니다.
ipa: "/ˈæplɪkənt/"   # 미국식 발음기호. 품사별 강세가 다르면 둘 다 적습니다.
korean: "지원자"
formula: "ad-(~쪽으로) + plic-(접다, 포개다) + -ant(지금 그렇게 하고 있는 사람)"
roots:
  - "plic"            # 핵심 어근 하나(소문자). 같은 어근끼리 자동으로 묶입니다.
paragraphs:
  - "어근의 라틴어/그리스어 원형과 의미 설명 (1~3문단)"
scene: "어원이 그리는 구체적인 장면 (1문단)"
closing: "사전적 번역이 놓치는 뉘앙스 (1~2문장)"
family:
  - word: "apply"
    note: "같은 어근을 가진 단어와 그 그림"
antonyms:                 # 선택 — 반대말이 실제로 성립할 때만
  - word: "reject"
    note: "왜 반대인지, 가능하면 어원으로"
bridge: "선택 — 두 단어가 어원상 짝을 이루는 통찰이 있을 때만"
---
```

`roots` 값이 겹치는 단어들은 자동으로 `/roots/<어근>/` 페이지에 모이고, 각 단어 상세 페이지
하단에 "같은 어근을 공유하는 단어" 카드로 나타납니다.

### 정렬

목록(홈 · 전체 단어 · 어근별 페이지)의 기본 정렬은 **입력 날짜 내림차순**, 즉 최근에 추가한
단어가 앞에 옵니다. 같은 날짜끼리는 알파벳순으로 놓입니다(Hugo의 `sort`가 안정 정렬이라
`sort (sort .Pages "Title") "Date" "desc"` 로 두 단계 정렬이 유지됩니다).

오름차순으로 바꾸려면 세 템플릿(`layouts/index.html`, `layouts/words/list.html`,
`layouts/_default/term.html`)의 `"desc"` 를 `"asc"` 로 바꾸면 됩니다.

### 어근 칩

홈의 어근 칩은 **단어가 2개 이상 묶인 어근만** 보여줍니다. 어근 대부분은 아직 단어가 하나뿐이라
전부 늘어놓으면 정작 묶인 어근이 파묻히기 때문입니다. 나머지 어근은 `/roots/` 목록에서 볼 수 있고,
칩에 없는 어근도 검색창에서는 그대로 찾을 수 있습니다(`formula` 문자열까지 검색 대상).

묶인 어근이 하나도 없으면 칩 영역 자체가 렌더링되지 않습니다. 이때도 검색과 페이징은 그대로
동작하도록 `filter.js`가 칩 영역의 부재를 허용합니다.

### 페이징

홈의 카드 그리드는 한 페이지에 12개씩 보여줍니다(`assets/js/filter.js`의 `PAGE_SIZE`).
페이지가 7개 이하면 번호를 전부 보여주고, 그보다 많아지면 `1 … 7 8 9 … 15` 형태로 접습니다(`PAGER_MAX`).

페이징은 Hugo의 `.Paginate`가 아니라 **클라이언트에서** 처리합니다. Hugo 페이지네이션을 쓰면
카드가 페이지별 HTML로 쪼개지면서 검색·어근 필터가 "현재 페이지에 있는 카드"만 훑게 되어,
2페이지에 있는 단어를 검색해도 찾지 못합니다. 그래서 Hugo는 전체 카드를 한 번에 렌더링하고,
JS가 **검색·필터를 통과한 집합을 페이지로 나눕니다**. 덕분에 검색은 늘 전체 단어를 대상으로 하고,
그 결과가 다시 페이징됩니다. 검색어나 어근을 바꾸면 1페이지로 돌아갑니다.

JS가 동작하지 않는 환경에서는 카드 전체가 그대로 보입니다(페이저만 비어 있음).

### 반대말

`antonyms`는 선택 항목입니다. 반대말이 실제로 성립하는 단어에만 넣고, 억지로 만들지 않습니다.
현재 58개 중 45개에 있고, applicant·photograph·molecule처럼 마땅한 반대말이 없는 13개는 비워
두었습니다. 값이 없으면 상세 페이지에 섹션 자체가 나오지 않습니다.

가능하면 반대인 이유를 어원으로 설명합니다 — `persist ↔ desist`(같은 sist- 뿌리에 de-가 붙어
"서기를 그만두다"), `involve ↔ evolve`(같은 volv- 뿌리에 방향만 반대), `symphony ↔ cacophony`
(같은 phon- 뿌리에 "나쁜 소리")처럼요.

### 마크다운 주의점

본문에는 `**plic**` 같은 볼드 표기를 쓸 수 있습니다. 다만 `**ad-**가` 처럼 **볼드 안쪽이
하이픈으로 끝나고 곧바로 한글이 이어지면** CommonMark의 flanking 규칙상 닫는 `**`가 강조
종료로 인정되지 않아 리터럴 그대로 남습니다. 이 사이트는 `layouts/partials/rich.html`에서
마크다운에 넘기기 전에 볼드를 먼저 `<strong>`으로 치환하므로 그런 표기도 정상 렌더링됩니다.

## 새 단어가 추가되는 과정

1. 사이트의 "새 단어 요청하기" 버튼 → GitHub 이슈 폼(`word-request.yml`)이 열립니다.
2. 이슈가 등록되면 `.github/workflows/generate-word.yml`이 실행되어, 등록된 `CLAUDE_CODE_OAUTH_TOKEN`
   시크릿으로 Claude Code가 위 스키마에 맞춰 `content/words/<word>.md`를 만들고,
   `hugo` 빌드가 통과하는지 확인한 뒤 PR을 엽니다.
3. PR을 리뷰하고 머지하면 `pages.yml`이 다시 빌드·배포하여 사이트에 반영됩니다.

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
   Custom domain 칸의 `voca.metacog.co.kr`은 `static/CNAME`에서 자동 인식되고,
   DNS 확인이 끝나면 HTTPS 인증서가 발급됩니다.

   > 참고: 초기에는 "Deploy from a branch" 방식을 썼는데, 빌드가 한 번도 게시되지 않으면서
   > (`There isn't a GitHub Pages site here`) 아무 로그도 남지 않아 원인 추적이 불가능했습니다.
   > Actions 배포 방식은 매 배포가 Actions 탭에 기록되므로 실패해도 바로 진단할 수 있습니다.

## 로컬에서 실행

[Hugo extended](https://gohugo.io/installation/) 0.140 이상이 필요합니다.

```bash
hugo server -D
# http://localhost:1313 접속

hugo --gc --minify   # 프로덕션 빌드 (public/ 에 생성)
```
