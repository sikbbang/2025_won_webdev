const INPUT_AREA = document.getElementById('repo-input-area');
const ERROR_MSG_INLINE = document.getElementById('error-msg'); 

const FILE_VIEWER_WINDOW = document.getElementById('file-viewer-window');
const FILE_VIEWER_TITLE = document.getElementById('file-viewer-title');
const FILE_CONTENT = document.getElementById('file-content');

const REPO_LIST_WINDOW = document.getElementById('repo-list-window');
const REPO_LIST_TITLE = document.getElementById('repo-list-title');
const FOLDER_LIST_AREA = document.getElementById('folder-list-area'); 

const ERROR_DIALOG_WINDOW = document.getElementById('error-dialog-window');
const ERROR_DIALOG_TITLE = document.getElementById('error-dialog-title');
const ERROR_MESSAGE_CONTENT = document.getElementById('error-message-content');

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
}

function closeRepoList() {
    REPO_LIST_WINDOW.style.display = 'none';
}

function closeErrorDialog() {
    ERROR_DIALOG_WINDOW.style.display = 'none';
    ERROR_MSG_INLINE.textContent = ''; 
    // 오류 창 닫을 때 로딩/오류 상태에서 기본 오류 창으로 복구
    document.getElementById('error-dialog-title-bar').style.background = '#FF0000';
    ERROR_DIALOG_WINDOW.querySelector('.ok-button').style.display = 'block';
    ERROR_DIALOG_WINDOW.querySelector('.error-icon').style.display = 'inline';
    ERROR_MESSAGE_CONTENT.style.border = '1px solid #000';
}

/**
 * 로딩 상태 창을 띄우는 함수 (ERROR_DIALOG_WINDOW를 로딩 용도로 사용)
 */
function displayLoadingDialog(repoName) {
    const titleBar = document.getElementById('error-dialog-title-bar');
    
    // 로딩 창 스타일로 변경 (파란색 제목, 숨겨진 요소)
    titleBar.style.background = 'linear-gradient(to right, #000080, #0000A0)'; 
    ERROR_DIALOG_TITLE.textContent = `⏳ Loading (${repoName})...`;
    
    ERROR_MESSAGE_CONTENT.innerHTML = `<p style="text-align:center;"><span style="color:#000080; font-weight:bold; font-size:16px;">ACCESSING FILE SYSTEM...</span> <br><marquee style="width: 100%;">Fetching repository contents. Please wait...</marquee></p>`;
    
    // 로딩 상태에서 숨길 요소 처리
    ERROR_DIALOG_WINDOW.querySelector('.ok-button').style.display = 'none';
    ERROR_DIALOG_WINDOW.querySelector('.error-icon').style.display = 'none';
    ERROR_MESSAGE_CONTENT.style.border = 'none';
    
    ERROR_DIALOG_WINDOW.style.display = 'block';
}

/**
 * 로딩 창을 오류 메시지 창으로 변환하는 함수
 */
function displayErrorDialog(title, message) {
    // 로딩 창을 오류 창 스타일로 즉시 변경
    const titleBar = document.getElementById('error-dialog-title-bar');
    titleBar.style.background = '#FF0000'; // 빨간색
    
    ERROR_DIALOG_TITLE.textContent = `🚨 ${title}`;
    
    // 오류 상태에서 보여줄 요소 처리
    ERROR_DIALOG_WINDOW.querySelector('.ok-button').style.display = 'block';
    ERROR_DIALOG_WINDOW.querySelector('.error-icon').style.display = 'inline';
    ERROR_MESSAGE_CONTENT.style.border = '1px solid #000';
    
    // HTML에 에러 메시지 업데이트 (pre 태그 내부)
    ERROR_MESSAGE_CONTENT.textContent = message;
    
    // 메인 창의 인라인 메시지를 통해 사용자에게 오류 창 확인을 유도
    ERROR_MSG_INLINE.textContent = '시스템 오류 발생! 오류 창을 확인하세요.'; 
}


// --- GitHub API 호출 함수 ---

/**
 * GitHub 레포지토리 내용을 가져오는 핵심 함수 (디렉토리 탐색)
 */
async function fetchRepoContents(dirPath = '') {
    const repoPathInput = document.getElementById('repo-path').value.trim();
    
    if (!currentRepoPath && (!repoPathInput || repoPathInput.indexOf('/') === -1)) {
        displayErrorDialog('Input Error', '올바른 레포지토리 주소 (유저이름/레포이름)를 입력하세요.');
        return;
    }

    const repoToFetch = currentRepoPath || repoPathInput;
    const encodedPath = encodeURIComponent(dirPath); 
    const apiUrl = `${GITHUB_API_BASE}${repoToFetch}/contents/${encodedPath}`;
    
    // [1. 로딩 창 띄우기]
    displayLoadingDialog(repoToFetch);
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // [2. 오류 발생] 로딩 창 -> 오류 창으로 변환 (창 닫지 않음)
            displayErrorDialog(`Repo Error: ${repoToFetch}`, `오류 발생 코드: ${response.status}\n\n${errorData.message || '레포지토리를 찾을 수 없거나 접근 권한이 없습니다.'}`);
            
            throw new Error('API request failed, handled error.'); 
        }

        const contents = await response.json();
        
        // [3. 성공] 로딩 창 닫고 목록 창 띄우기
        closeErrorDialog(); // 로딩 창 닫기
        REPO_LIST_WINDOW.style.display = 'block'; // 목록 창 띄우기
        
        ERROR_MSG_INLINE.textContent = '';
        
        currentRepoPath = repoToFetch;
        currentDir = dirPath;
        
        displayFolderStructure(repoToFetch, dirPath, contents);
        
    } catch (error) {
        // [4. 통신 오류 발생] (catch 블록) 
        // fetch 자체 실패 (네트워크)의 경우 에러 다이얼로그로 변환 처리
        if (error.message && error.message.includes('Failed to fetch')) {
             displayErrorDialog(`Network Error`, 'GitHub API 서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.');
        }
        
        currentRepoPath = '';
        currentDir = '';
    }
}

/**
 * 파일 내용을 가져와 다이얼로그 창에 표시하는 함수
 */
async function openFileViewer(item) {
    FILE_VIEWER_TITLE.textContent = `📄 ${item.name} (Loading...)`;
    FILE_CONTENT.textContent = `Fetching content from GitHub...`;
    FILE_VIEWER_WINDOW.style.display = 'block';

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
            FILE_CONTENT.textContent = `[ERROR] 파일을 읽을 수 없습니다. 인코딩: ${fileData.encoding}`;
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
        const upDiv = document.createElement('div');
        upDiv.className = 'folder-item';
        upDiv.innerHTML = '<span class="folder-icon">📁</span> **..**'; 
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
        
        let icon = '';
        let name = item.name;

        if (item.type === 'dir') {
            icon = '📂'; 
            const newPath = dirPath ? `${dirPath}/${name}` : name;
            itemDiv.onclick = () => fetchRepoContents(newPath);
        } else if (item.type === 'file') {
            icon = '📄'; 
            itemDiv.onclick = () => { 
                openFileViewer(item); 
            };
        } else {
            icon = '❓'; 
        }

        itemDiv.innerHTML = `<span class="folder-icon">${icon}</span> ${name}`;
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