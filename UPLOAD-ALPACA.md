# ALPACA STUDIO 업데이트 안내

기존 GitHub Pages 저장소에 아래 파일을 올립니다. ZIP의 music-classroom 폴더 안에 있는 파일을 기존 index.html과 같은 위치에 올려주세요. music-classroom 폴더 자체를 한 단계 더 만드는 것이 아닙니다.

## 교체할 파일 (8개)
- index.html
- app.js
- motive.js
- style.css
- classroom.css
- admin.html
- student.html
- student.js

## 새로 추가할 파일 (3개)
- alpaca-theme.css
- motive-lessons.js
- resources.js

## 폴더 업로드
- assets 폴더: 알파카 대표 이미지와 얼굴 아이콘
- pdf 폴더: 악보 및 기존 기초 교재 원본 PDF (파일명을 변경하지 마세요)
- scores 폴더: 기존 폴더를 유지하면서 ZIP 안의 내용으로 병합 업로드

scores에 새로 추가된 파일:
- autumn-original.svg / autumn-higgins.svg
- intervallic-annotated.svg
- displacement-a.svg / displacement-b.svg
- mozart-theme.svg / mozart-variation-a.svg / mozart-variation-b.svg

## 기존 설정과 데이터
firebase-config.js, firestore.rules, storage.rules, admin.js, classroom-data.js는 변경하지 않았습니다. 이번 업데이트 때문에 Firebase 규칙을 다시 게시할 필요는 없습니다. 학생/수업/결제 데이터에 쓰기 또는 삭제 작업을 하지 않았습니다. 코드 찾기, 템포 계산, 음정 문제, 피아노 샘플 및 단축키 로직도 유지했습니다.

## 배포 후 확인
1. GitHub Pages 배포가 완료되면 홈페이지를 새로고침합니다.
2. ALPACA STUDIO 이름과 알파카 이미지가 보이는지 확인합니다.
3. 모티브 메뉴가 주요 6개 / 보조 5개인지 확인합니다.
4. 악보의 PDF 미리보기와 다운로드를 각각 눌러 봅니다.
5. 모바일에서 메뉴를 열고 악보를 좌우로 스크롤해 봅니다.
6. 관리자/학생 페이지에서 기존 수업 기록을 확인합니다.

스크립트와 스타일의 캐시 버전은 35입니다. 보이지 않으면 강력 새로고침을 해 주세요. 파일명 자체에 버전을 붙이지 않습니다.

## PDF 자료 추가하기
resources.js 맨 위의 ALPACA_PDF_CATALOG가 기법별 PDF 연결 목록입니다. pdf 폴더에 원본을 추가한 뒤 해당 기법 배열에 파일명을 추가하면, 기법 아래 버튼과 자료실 목록에 함께 나타납니다. title/description을 더 구체적으로 표시하려면 같은 파일의 titles/descriptions를 수정하세요. 일반 공개 자료는 기존 관리자 자료 업로드를 그대로 사용할 수 있습니다.

기존 MUSIC_ATELIER_Motive_Workbook.pdf는 당시 만든 기초 교재 원본입니다. 현재 11개 기법으로 새로 개정한 교재는 아니며, 원본 표지와 이름을 유지합니다. 최신 분류와 신규 분석은 홈페이지에 있습니다.

## 분석 기준
- Autumn Leaves: PDF 첫 단과 9–12마디를 비교하며, 가운데 빈 단은 웹 미리보기에서 생략했습니다. 두 예시는 조가 다릅니다. 마지막 마디에는 꾸밈음과 재타격도 있어 완전히 같은 음 목록이라고 설명하지 않았습니다.
- The Very Thought of You: C–E♭–C 이후 E♭ 대신 F로 이동하여 해당 상행이 단3도에서 완전4도로 달라지는 부분을 표시했습니다.
- Straight, No Chaser: 첫 완전한 마디를 1마디로 세고, 첫 8분음표는 못갖춘마디 4&로 읽습니다. 첫 C의 진입은 못갖춘마디 4&, 1마디 3&, 2마디 4&, 3마디 3&, 5마디 1&입니다.
- Mozart K.265: PDF 13–20마디를 변주 1–8마디로 설명합니다. 확인한 App., N.T., P.T.만 표시하고 Ant./Esc.는 용어 사전에만 두었습니다.
- 신규 감상 링크는 감상용으로 연결했으며, 첨부 악보와 일치하는 연주 시각을 임의로 지정하지 않았습니다. 기존 확장/축약 영상의 0:10 및 6:25는 그대로입니다.

## 검증 범위
11개 기법 전환, 그룹 구성, PDF 경로/파일 존재와 원본 일치, 미리보기 생성, 자료실 렌더링, 코드 찾기 예제와 모바일 메뉴 상태를 DOM 기반으로 검사했습니다. 악보 이미지의 겹침도 시각적으로 확인했습니다. Firebase 설정/보안 규칙/관리자 로직은 이전 버전과 해시가 같습니다.
이 환경에는 지원되는 브라우저 검사 기능이 없어 실제 모바일·데스크톱 브라우저 화면, 실계정 로그인, YouTube 재생 및 배포 후 다운로드는 실행 검증하지 못했습니다. 반응형 스타일은 포함되어 있습니다.
