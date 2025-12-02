const INPUT_AREA = document.getElementById('repo-input-area');
const ERROR_MSG_INLINE = document.getElementById('error-msg'); 

const FILE_VIEWER_WINDOW = document.getElementById('file-viewer-window');
const FILE_VIEWER_TITLE = document.getElementById('file-viewer-title');
const FILE_CONTENT = document.getElementById('file-content'); // 기존 pre 태그

const REPO_LIST_WINDOW = document.getElementById('repo-list-window');
const REPO_LIST_TITLE = document.getElementById('repo-list-title');
const FOLDER_LIST_AREA = document.getElementById('folder-list-area'); 

const ERROR_DIALOG_WINDOW = document.getElementById('error-dialog-window');
const ERROR_DIALOG_TITLE = document.getElementById('error-dialog-title');
const ERROR_MESSAGE_CONTENT = document.getElementById('error-message-content');

// HTML 구조 변경을 가정하고 요소를 찾습니다. 
const OK_BUTTON = ERROR_DIALOG_WINDOW.querySelector('.ok-button'); 
const ERROR_ICON_DISPLAY = ERROR_DIALOG_WINDOW.querySelector('.error-icon-display'); 
const ERROR_TITLE_HEADER = ERROR_DIALOG_WINDOW.querySelector('.error-title-header'); 

const GITHUB_API_BASE = 'https://api.github.com/repos/';

let currentRepoPath = '';
let currentDir = '';

// Base64 디코딩 유틸리티 함수
function base64Decode(encoded) {
    if (typeof window !== 'undefined' && window.atob) {
        return decodeURIComponent(atob(encoded).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }
    return 'Error: Base64 decoding not supported.';
}

// --- 창 제어 함수 ---
function closeFileViewer() {
    FILE_VIEWER_WINDOW.style.display = 'none';
    
    // iframe이 남아있지 않도록 내용 초기화
    FILE_CONTENT.innerHTML = 'Loading file contents...'; 
    FILE_CONTENT.style.display = 'block'; // pre 태그 기본 표시
    
    // iframe을 제거하기 위해 FILE_CONTENT의 부모 요소에서 모든 iframe 제거
    const contentContainer = FILE_CONTENT.parentElement;
    const existingIframe = contentContainer.querySelector('iframe');
    if (existingIframe) {
        contentContainer.removeChild(existingIframe);
    }
}

/**
 * 레포 목록 창을 닫습니다. (currentRepoPath와 currentDir은 탐색 중에는 유지)
 */
function closeRepoList() {
    REPO_LIST_WINDOW.style.display = 'none';
}

/**
 * 에러/로딩 창을 닫고 모든 스타일과 내용을 초기 상태로 되돌립니다.
 */
function closeErrorDialog() {
    ERROR_DIALOG_WINDOW.style.display = 'none';
    ERROR_MSG_INLINE.textContent = ''; 
    
    const titleBar = document.getElementById('error-dialog-title-bar');
    
    // 제목 초기화 (비워둡니다)
    ERROR_DIALOG_TITLE.textContent = ''; 
    
    // 스타일 및 요소 초기화 (숨기기)
    titleBar.style.background = '#FF0000'; // 기본적으로 에러 색상 (빨간색) 유지
    
    if (OK_BUTTON) OK_BUTTON.style.display = 'none'; // 기본적으로 OK 버튼 숨김
    if (ERROR_ICON_DISPLAY) ERROR_ICON_DISPLAY.style.display = 'none'; // 아이콘 숨김
    if (ERROR_TITLE_HEADER) ERROR_TITLE_HEADER.style.display = 'none'; // 제목 텍스트 숨김
    
    ERROR_MESSAGE_CONTENT.innerHTML = ''; // 내용 완전히 비움
    ERROR_MESSAGE_CONTENT.style.border = 'none'; // 테두리 제거 (로딩/에러 모두 처리 가능하도록)
}

/**
 * 로딩 상태 창을 띄우는 함수
 */
function displayLoadingDialog(repoName) {
    const titleBar = document.getElementById('error-dialog-title-bar');
    
    // 1. 로딩 창 스타일로 변경 (파란색 제목)
    titleBar.style.background = 'linear-gradient(to right, #000080, #0000A0)'; 
    ERROR_DIALOG_TITLE.textContent = `⏳ Loading (${repoName})...`; // 로딩 제목 설정
    
    // 2. 로딩 메시지 설정
    ERROR_MESSAGE_CONTENT.innerHTML = `<p style="text-align:center;"><span style="color:#000080; font-weight:bold; font-size:20px;">ACCESSING FILE SYSTEM...</span> <br><marquee style="width: 100%;font-size: 17px;">Fetching repository contents. Please wait...</marquee></p>`;
    
    // 3. 로딩 상태에서 숨길 요소 처리
    if (OK_BUTTON) OK_BUTTON.style.display = 'none';
    if (ERROR_ICON_DISPLAY) ERROR_ICON_DISPLAY.style.display = 'none';
    if (ERROR_TITLE_HEADER) ERROR_TITLE_HEADER.style.display = 'none'; 
    ERROR_MESSAGE_CONTENT.style.border = 'none'; // 테두리 없음
    
    ERROR_DIALOG_WINDOW.style.display = 'block';
}

/**
 * 로딩 창을 오류 메시지 창으로 변환하는 함수
 */
function displayErrorDialog(title, message) {
    // 1. 로딩 창을 오류 창 스타일로 즉시 변경 (빨간색 제목)
    const titleBar = document.getElementById('error-dialog-title-bar');
    titleBar.style.background = '#FF0000'; 
    
    ERROR_DIALOG_TITLE.textContent = `${title}`; // 에러 제목 설정
    
    // 2. 오류 상태에서 보여줄 요소 처리
    if (OK_BUTTON) OK_BUTTON.style.display = 'block'; // OK 버튼 표시
    if (ERROR_ICON_DISPLAY) ERROR_ICON_DISPLAY.style.display = 'inline'; // 아이콘 표시
    if (ERROR_TITLE_HEADER) {
        ERROR_TITLE_HEADER.style.display = 'inline'; // "Fatal Error" 텍스트 표시
        ERROR_TITLE_HEADER.textContent = '**Fatal Error**'; 
    }
    
    ERROR_MESSAGE_CONTENT.style.border = '1px solid #000'; // 테두리 추가
    
    // 3. HTML에 에러 메시지 업데이트 (pre 태그 내부)
    ERROR_MESSAGE_CONTENT.textContent = message;
    
    ERROR_DIALOG_WINDOW.style.display = 'block';
}

/**
 * GitHub Pages URL을 구성하여 iframe으로 띄우는 함수
 */
function openPagesViewer(item) {
    
    // 이전 iframe 및 뷰어 닫기
    closeFileViewer(); 

    FILE_VIEWER_TITLE.textContent = `🌐 ${item.name} (Loading Pages...)`;
    FILE_VIEWER_WINDOW.style.display = 'block';

    const [username, repoName] = currentRepoPath.split('/');
    
    // Pages URL 구성: https://[username].github.io/[repoName]/[path/to/file.html]
    const pagesUrl = `https://${username}.github.io/${repoName}/${item.path}`; 
    
    // iframe 요소를 생성
    const iframe = document.createElement('iframe');
    iframe.src = pagesUrl; 
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '1px solid #000';
    
    // 기존 pre 태그는 숨기고 iframe을 FILE_VIEWER_WINDOW에 삽입
    const contentContainer = FILE_CONTENT.parentElement;
    contentContainer.appendChild(iframe);
    FILE_CONTENT.style.display = 'none'; 

    FILE_VIEWER_TITLE.textContent = `🌐 ${item.name} (GitHub Pages Preview)`;
}

// --- Pages URL 상태 확인 함수 ---

/**
 * 주어진 URL이 404 에러를 반환하지 않는지 확인합니다.
 * @param {string} url 확인할 Pages URL
 * @returns {Promise<boolean>} 성공적으로 로드되면 true, 404 에러 시 false
 */
async function checkPagesStatus(url) {
    try {
        // HEAD 요청을 통해 콘텐츠 없이 상태 코드만 확인하여 부하를 줄임
        const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
        // 404가 아닌 200, 301, 302 등의 상태 코드는 성공으로 간주
        return response.status !== 404 && response.ok;
    } catch (error) {
        // 네트워크 에러 등도 Pages가 연결되지 않은 것으로 간주
        console.warn(`Pages status check failed for ${url}:`, error.message);
        return false;
    }
}


// --- GitHub API 호출 함수 ---

/**
 * GitHub 레포지토리 내용을 가져오는 핵심 함수 (디렉토리 탐색)
 */
async function fetchRepoContents(dirPath = '') {
    let repoPathInput = document.getElementById('repo-path').value.trim();
    
    // --- 레포지토리 경로 결정 로직 (수정됨) ---
    let repoToFetch = '';
    let isNewRepo = false; 

    console.log(repoPathInput);
    console.log(dirPath);
    // 1. repoPathInput에 값이 있다면 새로운 탐색으로 간주
    if (dirPath == '' && repoPathInput) {
        if (repoPathInput.indexOf("https://github.com/") !== -1) {
            repoPathInput = repoPathInput.split("https://github.com/")[1];
        }
        
        if (repoPathInput.indexOf('/') === -1) {
            displayErrorDialog('Input Error', '올바른 레포지토리 주소 (유저이름/레포이름)를 입력하세요.');
            return;
        }

        repoToFetch = repoPathInput;
        // 새로운 레포를 탐색하므로 디렉토리 경로는 무조건 루트
        dirPath = ''; 
        isNewRepo = true;
        
    } else if (currentRepoPath && dirPath !== undefined) {
        // 2. 현재 레포를 탐색 중이고 폴더 이동 요청(dirPath)이 있을 때
        repoToFetch = currentRepoPath;

    } else { 
        // 3. 입력도 없고, 탐색 중인 레포도 없으며, 이동 요청도 없을 때 (최초 입력 대기 상태)
        displayErrorDialog('Input Error', '레포지토리 주소 (유저이름/레포이름)를 입력하세요.');
        return;
    }
    // --- 레포지토리 경로 결정 로직 끝 ---


    const encodedPath = encodeURIComponent(dirPath); 
    const apiUrl = `${GITHUB_API_BASE}${repoToFetch}/contents/${encodedPath}`;

    console.log(apiUrl);
    
    // [1. 로딩 창 띄우기]
    displayLoadingDialog(repoToFetch);
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // [2. 오류 발생] 로딩 창 -> 오류 창으로 변환 (창 닫지 않음)
            displayErrorDialog(`Repo Error: ${repoToFetch}`, `오류 발생 코드: ${response.status}\n\n${errorData.message || '레포지토리를 찾을 수 없거나 접근 권한이 없습니다.'}`);
            
            // 새 레포 시도 실패 시 현재 레포 경로를 초기화하여 재입력 유도
            if (isNewRepo) {
                currentRepoPath = '';
                currentDir = '';
            }
            
            throw new Error('API request failed, handled error.'); 
        }

        const contents = await response.json();
        
        // [3. 성공] 로딩 창 닫고 목록 창 띄우기
        closeErrorDialog(); // 로딩 창 닫기 (내용 초기화)
        REPO_LIST_WINDOW.style.display = 'block'; // 목록 창 띄우기
        
        ERROR_MSG_INLINE.textContent = '';
        
        // 성공 시에만 currentRepoPath와 currentDir 업데이트
        currentRepoPath = repoToFetch;
        currentDir = dirPath;
        
        displayFolderStructure(repoToFetch, dirPath, contents);
        
    } catch (error) {
        // [4. 통신 오류 발생] (catch 블록) 
        if (error.message && error.message.includes('Failed to fetch')) {
             displayErrorDialog(`Network Error`, 'GitHub API 서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.');
        }
        
        // 통신 오류 시에도 새 레포 시도 실패로 간주하고 초기화
        if (isNewRepo) {
            currentRepoPath = '';
            currentDir = '';
        }
    }
}

/**
 * 파일 내용을 가져와 다이얼로그 창에 표시하는 함수 (텍스트 뷰어)
 */
async function openFileViewer(item) {
    
    // 이전 iframe이 있다면 제거
    closeFileViewer(); 

    FILE_VIEWER_TITLE.textContent = `📄 ${item.name} (Loading...)`;
    FILE_CONTENT.textContent = `Fetching content from GitHub...`;
    FILE_VIEWER_WINDOW.style.display = 'block';
    FILE_CONTENT.style.display = 'block'; // 텍스트 뷰어(pre) 표시

    try {
        const response = await fetch(item.url); 
        
        if (!response.ok) {
            throw new Error(`Could not fetch file content. Status: ${response.status}`);
        }

        const fileData = await response.json();
        
        if (fileData.encoding === 'base64' && fileData.content) {
            const decodedContent = base64Decode(fileData.content);
            FILE_CONTENT.textContent = decodedContent;
        } else if (fileData.size > 1024 * 100) { 
            FILE_CONTENT.textContent = `[ERROR: FILE TOO LARGE] 파일 크기가 너무 커서 웹에서 직접 표시할 수 없습니다. (Size: ${Math.round(fileData.size / 1024)} KB)`;
        } else {
            FILE_CONTENT.textContent = `[ERROR] 파일을 읽을 수 없습니다. 인코딩: ${fileData.encoding || 'N/A'}`;
        }

        FILE_VIEWER_TITLE.textContent = `📄 ${item.name}`;

    } catch (error) {
        closeFileViewer();
        displayErrorDialog(`File Load Error: ${item.name}`, error.message);
    }
}

/**
 * GitHub API 결과를 폴더 리스트 형태로 출력하는 함수
 */
function displayFolderStructure(repoPath, dirPath, contents) {
    FOLDER_LIST_AREA.innerHTML = ''; 
    
    const displayPath = dirPath ? `/${dirPath}` : '/ (Root)';
    REPO_LIST_TITLE.textContent = `📁 ${repoPath}${displayPath} - Explorer`; 

    // 1. "Go Up" (상위 디렉토리로 이동) 항목
    if (dirPath) {
        const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
        // 폴더 이동 클릭 이벤트에 dirPath가 아닌 parentPath가 정확히 전달되어야 합니다.
        const upDiv = document.createElement('div');
        upDiv.className = 'folder-item';
        upDiv.innerHTML = '<span class="folder-icon">📁</span><span class="folder-text"> ..</span>'; 
        upDiv.onclick = () => fetchRepoContents(parentPath);
        FOLDER_LIST_AREA.appendChild(upDiv);
    }
    
    // 2. 디렉토리와 파일 정렬
    contents.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    // 3. 파일 및 폴더 항목 추가
    contents.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'folder-item';
        
        // 아이콘 정렬을 위해 flexbox 사용
        itemDiv.style.display = 'flex';
        itemDiv.style.justifyContent = 'space-between';
        itemDiv.style.alignItems = 'center';
        
        let icon = '';
        let name = item.name;

        if (item.type === 'dir') {
            icon = '📂'; 
            const newPath = dirPath ? `${dirPath}/${name}` : name;
            
            // 🚨 수정: 폴더 클릭 시 새로운 경로(newPath)를 정확히 전달합니다.
            itemDiv.onclick = () => fetchRepoContents(newPath); 
            
            // 폴더는 왼쪽 정렬만
            itemDiv.style.justifyContent = 'flex-start';
            itemDiv.innerHTML = `<span class="folder-icon">${icon}</span><span class="folder-text">${name}</span>`;
            
        } else if (item.type === 'file') {
            icon = '📄'; 
            
            // 파일 이름 및 아이콘을 담는 왼쪽 콘텐츠 래퍼
            const leftContent = document.createElement('div');
            leftContent.style.display = 'flex';
            leftContent.style.alignItems = 'center';
            leftContent.style.flexGrow = '1'; // 이 영역이 공간을 최대한 차지하여 오른쪽을 밂

            leftContent.innerHTML = `<span class="folder-icon">${icon}</span><span class="folder-text">${name}</span>`;
            
            // **전체 항목 클릭 시 텍스트 뷰어**
            itemDiv.onclick = () => { openFileViewer(item); }; 
            
            itemDiv.appendChild(leftContent);
            
            // .html 파일인 경우: Pages 상태를 확인하고 🌐 아이콘을 추가
            if (item.name.toLowerCase().endsWith('.html')) {
                const [username, repoName] = repoPath.split('/');
                const pagesUrl = `https://${username}.github.io/${repoName}/${item.path}`;

                // 비동기로 Pages 상태 확인
                checkPagesStatus(pagesUrl).then(isLive => {
                    if (isLive) {
                        const pagesIcon = document.createElement('span');
                        pagesIcon.className = 'pages-icon'; 
                        pagesIcon.textContent = '🌐';
                        pagesIcon.style.cursor = 'pointer';
                        pagesIcon.title = 'View as GitHub Page (iframe)';
                        pagesIcon.style.fontSize = '1.5em'; 
                        pagesIcon.style.marginRight = '5px'; 
                        pagesIcon.style.flexShrink = '0'; 
                        
                        // 🌐 클릭 시 Pages Viewer 호출 (이벤트 전파 방지 필수)
                        pagesIcon.onclick = (e) => {
                            e.stopPropagation(); 
                            openPagesViewer(item); 
                        };
                        
                        itemDiv.appendChild(pagesIcon);
                    }
                });
            }
        } else {
            icon = '❓'; 
            // 기타 파일은 왼쪽 정렬만
            itemDiv.style.justifyContent = 'flex-start';
            itemDiv.innerHTML = `<span class="folder-icon">${icon}</span><span class="folder-text">${name}</span>`;
        }

        FOLDER_LIST_AREA.appendChild(itemDiv);
    });
}

// 이벤트 리스너: Enter 키로 검색
document.getElementById('repo-path').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        fetchRepoContents();
    }
});

// --- 창 이동 기능 (Drag and Drop) ---
(function() {
    const windows = [
        { id: 'file-viewer-window', headerId: 'file-viewer-title-bar' },
        { id: 'repo-list-window', headerId: 'repo-list-title-bar' },
        { id: 'error-dialog-window', headerId: 'error-dialog-title-bar' }
    ];

    windows.forEach(({ id, headerId }) => {
        const dialog = document.getElementById(id);
        const header = document.getElementById(headerId);
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        if (header) { 
            header.addEventListener('mousedown', function(e) {
                isDragging = true;
                if (dialog.style.transform) {
                    dialog.style.transform = 'none'; 
                    dialog.style.left = (dialog.offsetLeft) + 'px';
                    dialog.style.top = (dialog.offsetTop) + 'px';
                }

                offset.x = e.clientX - dialog.offsetLeft;
                offset.y = e.clientY - dialog.offsetTop;
                dialog.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none'; 
                e.preventDefault(); 
            });
        }

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            dialog.style.left = (e.clientX - offset.x) + 'px';
            dialog.style.top = (e.clientY - offset.y) + 'px';
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
            dialog.style.cursor = 'move';
            document.body.style.userSelect = 'auto'; 
        });
    });
})();


function updateTime() {
    const now = new Date();
    
    // 1. 오전/오후 판별 및 12시간제 변환
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    
    hours = hours % 12;
    hours = hours ? hours : 12;

    // 2. 분을 두 자리로 포맷
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    // 3. 최종 문자열 생성 (예: "오후 12:00")
    const timeString = `${ampm} ${hours}:${formattedMinutes}`;

    // 4. HTML 요소에 시간 업데이트 (겹쳐진 텍스트 요소)
    const timeElement = document.getElementById('current-time-overlay');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 1초마다 업데이트
setInterval(updateTime, 1000);

// 페이지 로드 시 즉시 시간을 표시
updateTime();