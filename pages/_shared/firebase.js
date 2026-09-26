import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, query, where, orderBy, getDoc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
apiKey: "AIzaSyAyhSEWtN-y6o9Myt-cDe9193QWv11rbTU",
authDomain: "turtless-web.firebaseapp.com",
projectId: "turtless-web",
storageBucket: "turtless-web.firebasestorage.app",
messagingSenderId: "794305996729",
appId: "1:794305996729:web:cf7132e77cc5621c5bb868"
};

const app = initializeApp(firebaseConfig); 
window.db = getFirestore(app);
window.auth = getAuth(app); 
window.addDoc = addDoc;
window.collection = collection;
window.query = query;
window.orderBy = orderBy;
window.getDocs = getDocs;
window.doc = doc;
window.deleteDoc = deleteDoc;


let currentUserId = sessionStorage.getItem('turtlessUserId');
let currentUserData = null;
let isEditMode = false; let cachedGallery = [];
let sliderData = []; let sponsorData = []; let allMembers = [];
let savedEditorRange = null;

// --- 번역 제어 (글로벌 윈도우 함수) ---
window.changeLanguage = function(val) {
var gtCombo = document.querySelector('.goog-te-combo');
if (gtCombo == null) {
alert("번역기를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
return false;
}
gtCombo.value = val;
gtCombo.dispatchEvent(new Event('change'));
};

// --- 에디터 서식 ---
window.saveEditorSelection = () => {
const sel = window.getSelection();
if (sel.getRangeAt && sel.rangeCount) { savedEditorRange = sel.getRangeAt(0); }
};

window.applyCustomFontSize = (size) => {
if (!size) return;
const selection = window.getSelection();
if (!selection.rangeCount) return;
const range = selection.getRangeAt(0);
if (range.collapsed) return;
const span = document.createElement('span');
span.style.fontSize = size; span.style.display = 'inline-block'; span.style.lineHeight = '1.4';
try { range.surroundContents(span); } catch(e) {
document.execCommand('styleWithCSS', false, true);
document.execCommand('fontSize', false, '3');
const fontElements = range.commonAncestorContainer.parentElement.querySelectorAll('font');
fontElements.forEach(el => { if (el.getAttribute('size') === '3') { el.removeAttribute('size'); el.style.fontSize = size; } });
}
};

window.insertEditorImage = async (input) => {
    if (!input.files || !input.files[0]) return;
    try {
        const formData = new FormData();
        // Cloudinary는 'key' 대신 'upload_preset'을 사용합니다.
        formData.append("upload_preset", "ml_default"); 
        formData.append("file", input.files[0]);

        const response = await fetch("https://api.cloudinary.com/v1_1/k8m3zaye/image/upload", { 
            method: 'POST', 
            body: formData 
        });
        const data = await response.json();

        if (data.secure_url) { // ImgBB의 data.success 대신 secure_url 확인
            const imageHtml = `
                       <div class="resizable-img-box" style="display:inline-block; position:relative; resize:both; overflow:hidden; width:200px; max-width:100%;">
                           <img src="${data.secure_url}" referrerpolicy="no-referrer" style="width:100%; height:100%; object-fit:contain; pointer-events:none;" />
                       </div><p>&nbsp;</p>
                   `;
            document.execCommand('insertHTML', false, imageHtml);
            input.value = ''; 
            alert("이미지 삽입 완료!");
        } else { alert("업로드 실패: " + data.error.message); }
    } catch(e) { alert("업로드 에러: " + e.message); }
};

// --- 팀원 기능 ---
async function loadMembers() {
const list = document.getElementById('member-list');
if(!list) return;
try {
const snap = await getDocs(collection(db, "users"));
const uniqueMembersMap = new Map(); 

snap.forEach(d => { 
    const data = d.data();

  //[디버깅 코드 추가] 불러오는 모든 문서의 ID와 이름을 콘솔에 출력합니다.
    //console.log("DB에서 불러온 문서 ID:", d.id, " | 이름:", data.name);(임시로 주석처리 나중에 다시 활성화 가능)
  
  //  [추가된 부분] 이름(name) 데이터가 아예 없는 빈 껍데기 문서는 건너뜁니다
    if (!data.name) return; 

    const uniqueKey = `${data.school}_${data.grade}_${data.name}`; 
    if (!uniqueMembersMap.has(uniqueKey)) { 
        uniqueMembersMap.set(uniqueKey, { id: d.id, ...data }); 
    }
});

allMembers = Array.from(uniqueMembersMap.values());
allMembers.sort((a,b) => a.school === b.school ? a.name.localeCompare(b.name) : a.school.localeCompare(b.school));

let mentorHtml = '';
let leaderHtml = ''; 
let memberHtml = '';

const mentorSpecs = [
  { name: "김정한" },
  { name: "천강숙" },
  { name: "김도윤" },
  { name: "장동준" }
];

mentorSpecs.forEach(spec => {
  const found = allMembers.find(m => m.name === spec.name);
  if (found) {
    const imgDefault = found.profileImage || "https://dummyimage.com/400x400/000000/ffffff&text=Default";
    const imgHover = found.profileHoverImage || "https://dummyimage.com/400x400/ffffff/000000&text=Hover";
    const newBadge = found.isNew ? '<span class="member-badge-new">NEW</span>' : '';
    const roleBadge = '<span style="position:absolute; top:10px; left:10px; background:#007bff; color:white; font-size:11px; padding:4px 8px; border-radius:4px; font-weight:900; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.2);">멘토</span>';

    mentorHtml += `<div class="member-card" onclick="window.openMemberModal('${found.id}')">
                       ${newBadge}
                       ${roleBadge}
                       <div class="photo-area">
                           <img src="${imgDefault}" class="img-default">
                           <img src="${imgHover}" class="img-hover">
                       </div>
                       <div class="info-area"><div class="school">${found.school || ''}</div><div class="name">${found.name}</div></div>
                   </div>`;
  }
});

  
const leaderSpecs = [
    { name: "정지우", school: "용산철도고", grade: "2학년", title: "팀 리더" },
    { name: "김승혁", school: "용산철도고", grade: "2학년", title: "빌드 팀장" },
    { name: "김아인", school: "서울매그넷고", grade: "1학년", title: "마케팅 팀장" },
    { name: "송주원", school: "용산철도고", grade: "2학년", title: "회계 팀장" },
    { name: "김윤상", school: "선린인터넷고", grade: "1학년", title: "전략 팀장" }
];

leaderSpecs.forEach(spec => {
    const found = allMembers.find(m => m.name === spec.name && m.school === spec.school && m.grade === spec.grade);
    if (found) {
        const imgDefault = found.profileImage || "https://dummyimage.com/400x400/000000/ffffff&text=Default";
        const imgHover = found.profileHoverImage || "https://dummyimage.com/400x400/ffffff/000000&text=Hover";
        const newBadge = found.isNew ? '<span class="member-badge-new">NEW</span>' : '';
        const roleBadge = `<span style="position:absolute; top:10px; left:10px; background:#2c91f9; color:#ffffff; font-size:11px; padding:4px 8px; border-radius:4px; font-weight:900; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.2);">${spec.title}</span>`;

        leaderHtml += `<div class="member-card" onclick="window.openMemberModal('${found.id}')">
                           ${newBadge}
                           ${roleBadge}
                           <div class="photo-area">
                               <img src="${imgDefault}" class="img-default">
                               <img src="${imgHover}" class="img-hover">
                           </div>
                           <div class="info-area"><div class="school">${found.school}</div><div class="name">${found.name}</div></div>
                       </div>`;
    }
});

allMembers.forEach(m => {
    const isLeader = leaderSpecs.some(spec => m.name === spec.name && m.school === spec.school && m.grade === spec.grade);
    const isMentor = mentorSpecs.some(spec => m.name === spec.name);
    
    if (isLeader || isMentor) return; 

    const imgDefault = m.profileImage || "https://dummyimage.com/400x400/000000/ffffff&text=Default";
    const imgHover = m.profileHoverImage || "https://dummyimage.com/400x400/ffffff/000000&text=Hover";
    const newBadge = m.isNew ? '<span class="member-badge-new">NEW</span>' : '';
    const roleBadge = `<span style="position:absolute; top:10px; left:10px; background:#6c757d; color:white; font-size:11px; padding:4px 8px; border-radius:4px; font-weight:900; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.2);">팀원</span>`;

    const cardHtml = `<div class="member-card" onclick="window.openMemberModal('${m.id}')">
                           ${newBadge}
                           ${roleBadge}
                           <div class="photo-area">
                               <img src="${imgDefault}" class="img-default">
                               <img src="${imgHover}" class="img-hover">
                           </div>
                           <div class="info-area"><div class="school">${m.school}</div><div class="name">${m.name}</div></div>
                   </div>`;

    memberHtml += cardHtml;
});

list.innerHTML = `
                   <h3 style="margin-bottom:15px; color:var(--text-main); font-weight:900; border-left:4px solid #007bff; padding-left:10px;">Mentors (멘토)</h3>
                   <div class="member-grid" style="margin-top:0; margin-bottom:40px;">
                       ${mentorHtml || '<p style="color:#777; font-size:14px; grid-column:1/-1;">등록된 멘토가 없습니다.</p>'}
                   </div>

                   <h3 style="margin-bottom:15px; color:var(--text-main); font-weight:900; border-left:4px solid var(--primary-color); padding-left:10px;">Leaders (팀장)</h3>
                   <div class="member-grid" style="margin-top:0; margin-bottom:40px;">
                       ${leaderHtml || '<p style="color:#777; font-size:14px; grid-column:1/-1;">등록된 팀장이 없습니다.</p>'}
                   </div>
                   
                   <h3 style="margin-bottom:15px; color:var(--text-main); font-weight:900; border-left:4px solid #6c757d; padding-left:10px;">Members (팀원)</h3>
                   <div class="member-grid" style="margin-top:0;">
                       ${memberHtml || '<p style="color:#777; font-size:14px; grid-column:1/-1;">등록된 팀원이 없습니다.</p>'}
                   </div>
               `;
} catch(e){}
}
function getShortSchoolName(school) {
    if (!school) return '';
    if (school === '용산고') return '용고';
    if (school === '선린인터넷고') return '선린인고';

    // 학교명 뒤의 불필요한 표현 제거
    let name = school
        .replace(/\s+/g, '')
        .replace(/고등학교$/, '')
        .replace(/고등$/, '')
        .replace(/학교$/, '');

    // 이미 2글자 이하라면 그대로 사용
    if (name.length <= 2) {
        return name + '고';
    }

    // 3글자 이상이면 첫 글자 + 핵심 단어의 첫 글자
    // 예:
    // 용산철도 → 용철
    // 서울공업 → 서공
    // 서울매그넷 → 서매
    return name[0] + name[2] + '고';
}
  
window.editingMemberId = null; 

window.openMemberModal = (id) => {
window.editingMemberId = id; 
const m = allMembers.find(x => x.id === id);
if(!m) return;

const img = m.profileImage || "https://dummyimage.com/400x400/000000/ffffff&text=Profile";
const bio = m.bio || "아직 등록된 소개가 없습니다.";
const contact = m.contact || "없음";

let html = `
    <div class="member-detail-header">
        <span>${m.name}</span>
    </div>

    <div class="member-detail-body">
        <div class="member-detail-profile">
            <img src="${img}" alt="${m.name}">
            <h2>
                ${m.name}
                <span>${getShortSchoolName(m.school)} ${m.grade}</span>
            </h2>
        </div>

        <div class="member-detail-box">
            <strong>학교 · 학년</strong>
            <p>${m.school} ${m.grade}</p>
        </div>

        <div class="member-detail-box">
            <strong>소개글</strong>
            <p>${bio.replace(/\n/g, '<br>')}</p>
        </div>

        <div class="member-detail-box">
            <strong>연락처/SNS</strong>
            <p>${contact}</p>
        </div>
    </div>
`;

document.getElementById('member-detail-view').innerHTML = html;

const editSection = document.getElementById('member-detail-edit');

if(currentUserId === id || (currentUserData && currentUserData.role === 'admin')) {
editSection.style.display = 'block';
document.getElementById('edit-bio').value = m.bio || '';
document.getElementById('edit-contact').value = m.contact || '';
document.getElementById('edit-isnew').checked = !!m.isNew;
} else { 
editSection.style.display = 'none'; 
}

document.getElementById('member-detail-modal').style.display = 'flex';
};

window.closeMemberModal = () => document.getElementById('member-detail-modal').style.display = 'none';

window.saveMemberDetails = async () => {
const targetId = window.editingMemberId || currentUserId;
if(!targetId) return;

const bio = document.getElementById('edit-bio').value;
const contact = document.getElementById('edit-contact').value;
const isNew = document.getElementById('edit-isnew').checked;

try {
await updateDoc(doc(db, "users", targetId), { bio, contact, isNew });
alert("정보가 저장되었습니다!"); 
loadMembers(); 
window.closeMemberModal();
} catch(e) { 
alert("저장 실패: " + e.message); 
}
};

window.uploadProfileImage = async (input, fieldName) => {
    if (!input || !input.files || !input.files[0]) return;

    if (!currentUserId) {
        alert("로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        input.value = '';
        return;
    }

    if (fieldName !== 'profileImage' && fieldName !== 'profileHoverImage') {
        console.error('[TURTLESS] 잘못된 프로필 이미지 필드:', fieldName);
        alert('프로필 이미지 저장 항목을 확인할 수 없습니다.');
        input.value = '';
        return;
    }

    try {
        alert("업로드 중...");

        const file = input.files[0];

        const formData = new FormData();
        formData.append("upload_preset", "ml_default");
        formData.append("file", file);

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok || !data.secure_url) {
            console.error("[TURTLESS] Cloudinary 업로드 실패:", data);
            throw new Error(
                data?.error?.message ||
                "Cloudinary 업로드에 실패했습니다."
            );
        }

        const imageUrl = data.secure_url;

        const userRef = doc(db, "users", currentUserId);

        // 현재 로그인한 본인의 Firebase 문서 확인
        const beforeSnap = await getDoc(userRef);

        if (!beforeSnap.exists()) {
            throw new Error(
                "현재 로그인한 팀원의 Firebase 문서를 찾을 수 없습니다. 다시 로그인해주세요."
            );
        }

        console.log("[TURTLESS] 프로필 이미지 저장:", {
            userId: currentUserId,
            fieldName: fieldName,
            imageUrl: imageUrl
        });

        // 본인 문서에만 이미지 URL 저장
        await updateDoc(userRef, {
            [fieldName]: imageUrl
        });

        // 실제 Firebase에 저장됐는지 다시 확인
        const afterSnap = await getDoc(userRef);

        if (!afterSnap.exists()) {
            throw new Error(
                "Firebase 사용자 문서를 다시 불러오지 못했습니다."
            );
        }

        const afterData = afterSnap.data();

        if (afterData[fieldName] !== imageUrl) {
            console.error("[TURTLESS] Firebase 저장 검증 실패:", {
                userId: currentUserId,
                fieldName: fieldName,
                expected: imageUrl,
                actual: afterData[fieldName]
            });

            throw new Error(
                "Firebase에 사진 주소가 정상적으로 저장되지 않았습니다."
            );
        }

        // 현재 세션 데이터도 최신값으로 갱신
        currentUserData = afterData;

        input.value = "";

        alert("성공적으로 변경되었습니다!");

        await loadMembers();

    } catch (e) {
        console.error(
            "[TURTLESS] 프로필 이미지 업로드 오류:",
            e
        );

        input.value = "";

        alert("오류: " + e.message);
    }
};

window.resetProfileImage = async () => {
if(!currentUserId) return;
if(confirm("프로필 사진을 삭제하고 기본 이미지로 초기화하시겠습니까?")) {
try {
await updateDoc(doc(db, "users", currentUserId), { profileImage: null, profileHoverImage: null });
alert("초기화가 완료되었습니다.");
loadMembers();
} catch(e) { alert("초기화 실패: " + e.message); }
}
};

// --- 주요 활동 ---
window.uploadActivity = async () => {
if(!currentUserData) return;
const title = document.getElementById('new-act-title').value.trim();
const content = document.getElementById('new-act-content').value.trim();
const fileInput = document.getElementById('new-act-file');
if(!title || !content) { alert("제목과 내용을 입력하세요."); return; }

let imageUrl = null;
if(fileInput.files && fileInput.files[0]) {
alert("사진을 업로드하는 중입니다...");
const formData = new FormData(); 
// 1. ImgBB 대신 Cloudinary 세팅 적용 (key -> upload_preset, image -> file)
formData.append("upload_preset", "ml_default"); 
formData.append("file", fileInput.files[0]);

// 2. Cloudinary API 주소로 전송
const response = await fetch("https://api.cloudinary.com/v1_1/k8m3zaye/image/upload", { method: 'POST', body: formData });
const data = await response.json();

// 3. 반환값에서 secure_url 추출
if(data.secure_url) { imageUrl = data.secure_url; } 
else { alert("사진 업로드 실패. 텍스트만 등록됩니다."); }
}
try {
await addDoc(collection(db, "activities"), { title, content, imageUrl, author: currentUserData.name, createdAt: Date.now(), socialContribution: false });
alert("등록 완료!"); 
document.getElementById('new-act-title').value=''; document.getElementById('new-act-content').value=''; fileInput.value='';
loadActivities();
} catch(e){}
};

async function loadActivities() {
const notice = document.getElementById('home-notice-board');
const ticker = document.getElementById('latest-ticker');
const actPageContent = document.getElementById('activity-page-content');
const socialPageContent = document.getElementById('social-activity-list');
try {
const snap = await getDocs(collection(db, "activities"));
let items = []; snap.forEach(d => items.push({id:d.id, ...d.data()}));
items.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

if(items.length > 0 && ticker) ticker.innerText = items[0].title;
if(notice) {
let nh = ''; items.slice(0,4).forEach(i => { nh += `<div class="notice-item" onclick="window.goAct('${i.id}')"><span class="notice-badge">소식</span><p>${i.title}</p></div>`; });
notice.innerHTML = nh || '<p>최신 소식 없음</p>';
}
if(actPageContent) {
let ah = ''; const isAdmin = currentUserData?.role === 'admin';
const now = Date.now(); 
items.forEach(i => { 
const delBtn = isAdmin ? `<button class="delete-btn" style="display:block" onclick="window.deleteActivity('${i.id}')">🗑️ 삭제</button>` : '';
const socialBtn = isAdmin ? `<button class="social-toggle-btn" onclick="window.toggleSocialContribution('${i.id}', ${i.socialContribution === true})">${i.socialContribution === true ? '🌊 사회공헌 ON' : '🌊 사회공헌 OFF'}</button>` : '';
const adminBtns = isAdmin ? `<div class="activity-admin-controls">${delBtn}${socialBtn}</div>` : '';
const isNew = (now - (i.createdAt || 0)) <= 86400000;
const newBadge = isNew ? `<span style="background:var(--primary-color); color:white; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:8px; vertical-align:middle; font-weight:900;">최신</span>` : '';
const imgTag = i.imageUrl ? `<div class="resizable-img-box" style="margin-top:15px; width:100%; max-width:400px;"><img src="${i.imageUrl}" style="width:100%; display:block; pointer-events:none;"></div>` : '';

ah += `<div class="act-list-item" id="act-${i.id}">
                           ${adminBtns}
                           <h3>${i.title} <span class="date" style="font-size:13px; color:#777; margin-left:10px; font-weight:500;">${new Date(i.createdAt).toLocaleDateString()}</span>${newBadge}</h3>
                           <p style="white-space:pre-wrap;">${i.content}</p>
                           ${imgTag}
                       </div>`; 
});
actPageContent.innerHTML = ah || '<p>등록된 활동 없음</p>';
  }

if (socialPageContent) {
  let sh = '';
  const socialItems = items.filter(i => i.socialContribution === true);

  socialItems.forEach(i => {
    const imgTag = i.imageUrl ? `<div class="resizable-img-box" style="margin-top:15px; width:100%; max-width:400px;"><img src="${i.imageUrl}" style="width:100%; display:block; pointer-events:none;"></div>` : '';
    sh += `<div class="act-list-item" id="social-act-${i.id}">
      <h3>${i.title} <span class="date" style="font-size:13px; color:#777; margin-left:10px; font-weight:500;">${new Date(i.createdAt).toLocaleDateString()}</span></h3>
      <p style="white-space:pre-wrap;">${i.content}</p>
      ${imgTag}
    </div>`;
  });

  socialPageContent.innerHTML = sh;
  socialPageContent.style.display = socialItems.length ? 'block' : 'none';
if (location.hash.startsWith('#act-')) { const targetEl = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (targetEl) setTimeout(() => targetEl.scrollIntoView({behavior:'smooth', block:'center'}), 50); }
}
loadYoutubeFallback();
} catch(e){ loadYoutubeFallback(); }
}
window.loadActivities = loadActivities;
window.toggleSocialContribution = async (id, current) => {
    try {
        await updateDoc(doc(db, "activities", id), {
            socialContribution: !current
        });
        await loadActivities();
    } catch (e) {
        console.error("사회공헌 표시 변경 실패:", e);
        alert("사회공헌 표시 변경에 실패했습니다.");
    }
};

window.deleteActivity = async (id) => { if(confirm("삭제하시겠습니까?")) { await deleteDoc(doc(db, "activities", id)); loadActivities(); } };
window.goAct = (id) => {
  const el = document.getElementById('act-' + id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const isHome = !!document.getElementById('page-home');
  const activityPath = isHome ? './pages/activity/' : '../activity/';
  location.href = activityPath + '#act-' + encodeURIComponent(id);
};

// --- 갤러리 ---
window.uploadGalleryImage = async () => {
if(!currentUserData) return;
const fileInput = document.getElementById('new-gal-file');
const categorySelect = document.getElementById('new-gal-category').value;
const dateInput = document.getElementById('new-gal-date').value;

if(!fileInput.files || !fileInput.files[0]) return;

const selectedTimestamp = dateInput ? new Date(dateInput).getTime() : Date.now();

try {
alert("업로드 중...");
const formData = new FormData(); 
// Cloudinary 세팅으로 변경
formData.append("upload_preset", "ml_default"); 
formData.append("file", fileInput.files[0]);

// Cloudinary API로 전송
const response = await fetch("https://api.cloudinary.com/v1_1/k8m3zaye/image/upload", { method: 'POST', body: formData });
const data = await response.json();

if (data.secure_url) {
await addDoc(collection(db, "gallery"), { 
url: data.secure_url, // ImgBB URL 대신 Cloudinary URL 저장
category: categorySelect, 
uploader: currentUserData.name, 
createdAt: Date.now(),
selectedDate: selectedTimestamp 
});
alert("사진 추가 완료!"); fileInput.value=''; loadGallery();
} else { alert("업로드 실패: " + (data.error ? data.error.message : "알 수 없는 오류")); }
} catch(e){ alert("오류: " + e.message); }
};

async function loadGallery() {
try {
const snap = await getDocs(collection(db, "gallery"));
cachedGallery = []; snap.forEach(d => cachedGallery.push({ id: d.id, ...d.data() }));

cachedGallery.sort((a,b) => (b.selectedDate || b.createdAt || 0) - (a.selectedDate || a.createdAt || 0));

const homeGrid = document.getElementById('home-gallery-4grid');
if(homeGrid) {
let gh = ''; 
for(let i=0; i<6; i++) { 
const imgUrl = cachedGallery[i] ? cachedGallery[i].url : "https://dummyimage.com/300x300/f0f0f0/999999&text=TURTLESS";
gh += `<div class="home-photo-item"><img src="${imgUrl}"></div>`; 
}
homeGrid.innerHTML = gh;
}
window.filterGallery('종합');
} catch(e){}
}

window.filterGallery = (category) => {
document.querySelectorAll('#gallery-filters .filter-btn').forEach(btn => { btn.classList.toggle('active', btn.innerText === category); });
const galleryPage = document.getElementById('gallery-page-content');
if(!galleryPage) return;

let filtered = category !== '종합' ? cachedGallery.filter(g => g.category === category) : cachedGallery;
const isAdmin = currentUserData?.role === 'admin';

let ph = '<div class="gallery-grid">'; 
filtered.forEach(g => { 
const displayDate = g.selectedDate ? g.selectedDate : g.createdAt;
const dateStr = displayDate ? new Date(displayDate).toLocaleDateString() : '';

const delBtn = isAdmin ? `<button class="delete-btn" style="display:block; position:absolute; top:10px; right:10px; background:rgba(220, 53, 69, 0.9); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; z-index:10;" onclick="window.deleteGallery('${g.id}')">🗑️ 삭제</button>` : '';
const editBtn = isAdmin ? `<button class="edit-btn" style="display:block; position:absolute; top:10px; right:70px; background:rgba(0, 123, 255, 0.9); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; z-index:10;" onclick="window.updateGalleryDate('${g.id}', ${displayDate})">📅 수정</button>` : '';

ph += `<div class="gallery-grid-item">
                       ${delBtn}
                       ${editBtn}
                       <img src="${g.url}" style="pointer-events:none;">
                       <div style="text-align:center; font-size:12.5px; color:#777; margin-top:8px; font-weight:500;">${dateStr}</div>
                      </div>`; 
}); 
ph += '</div>';
galleryPage.innerHTML = ph === '<div class="gallery-grid"></div>' ? '<p>등록된 이미지가 없습니다.</p>' : ph;
};

window.deleteGallery = async (id) => { if(confirm("삭제하시겠습니까?")) { await deleteDoc(doc(db, "gallery", id)); loadGallery(); } };

window.updateGalleryDate = async (id, currentTimestamp) => {
const currentStr = currentTimestamp ? new Date(currentTimestamp).toISOString().split('T')[0] : '';
const newDate = prompt("수정할 날짜를 입력하세요 (형식: YYYY-MM-DD)", currentStr);

if (newDate) {
const selectedTimestamp = new Date(newDate).getTime();
if (isNaN(selectedTimestamp)) {
alert("올바른 날짜 형식이 아닙니다. (예: 2026-07-01)");
return;
}
try {
await updateDoc(doc(db, "gallery", id), { selectedDate: selectedTimestamp });
alert("사진 날짜가 성공적으로 수정되었습니다!");
loadGallery(); 
} catch(e) {
alert("날짜 수정 실패: " + e.message);
}
}
};

// --- 유튜브 ---
function loadYoutubeFallback() {
  const ytList = document.getElementById('youtube-auto-list');
  if(!ytList) return;

  const channelId = 'UC8QwTy46OaCGdTauiPYkeow';
  const cacheKey = 'turtless_youtube_latest_v3';
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  ytList.innerHTML = '<div class="youtube-auto-loading">최근 영상을 불러오는 중…</div>';

  const escapeHtml = (v) => String(v || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const render = (items) => {
    if(!Array.isArray(items) || !items.length) throw new Error('No videos');
    ytList.innerHTML = '<h2 class="section-subtitle">Youtube Media</h2>';
    items.slice(0,3).forEach(item => {
      const videoId = item.videoId || '';
      const href = item.link || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/channel/${channelId}`);
      const thumb = item.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
      const title = escapeHtml(item.title || 'YouTube 영상');
      ytList.innerHTML += `<a href="${href}" target="_blank" rel="noopener" class="unified-card"><div class="card-top"><img src="${thumb}" alt="${title}" loading="lazy"></div><div class="card-bottom"><h4>${title}</h4></div></a>`;
    });
    try { localStorage.setItem(cacheKey, JSON.stringify({time:Date.now(),items:items.slice(0,3)})); } catch(e){}
  };

  const getCache = () => {
    try {
      const c = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if(c && Array.isArray(c.items) && c.items.length) return c.items;
    } catch(e){}
    return null;
  };

  // 1) rss2json — 기존에 실제로 사용하던 방식
  const rss2json = () => fetch(
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=3`,
    {cache:'no-store'}
  ).then(r => { if(!r.ok) throw new Error('rss2json failed'); return r.json(); })
   .then(data => {
     if(data.status !== 'ok' || !Array.isArray(data.items) || !data.items.length) throw new Error('rss2json empty');
     return data.items.slice(0,3).map(item => {
       let videoId = '';
       if(item.link && item.link.includes('v=')) videoId = item.link.split('v=')[1].split('&')[0].substring(0,11);
       else if(item.link && item.link.includes('youtu.be/')) videoId = item.link.split('youtu.be/')[1].split('?')[0].substring(0,11);
       return {videoId,title:item.title,thumbnail:item.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),link:item.link};
     });
   });

  // 2) YouTube RSS를 직접 읽을 수 있는 경우
  const directRss = () => fetch(feedUrl,{cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error('direct RSS failed'); return r.text(); })
    .then(parseRss);

  // 3) CORS 프록시를 통한 RSS — rss2json이 막혔을 때 보조
  const proxyRss = () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,{cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error('proxy RSS failed'); return r.text(); })
    .then(parseRss);

  function parseRss(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText,'text/xml');
    if(xml.querySelector('parsererror')) throw new Error('RSS parse failed');
    const entries = Array.from(xml.querySelectorAll('entry')).slice(0,3);
    if(!entries.length) throw new Error('RSS has no entries');
    return entries.map(entry => {
      const videoId = entry.getElementsByTagNameNS('*','videoId')[0]?.textContent || '';
      const title = entry.getElementsByTagName('title')[0]?.textContent || 'YouTube 영상';
      const links = Array.from(entry.querySelectorAll('link'));
      const linkNode = links.find(n => n.getAttribute('rel') === 'alternate') || links[0];
      return {videoId,title,thumbnail:videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',link:linkNode?.getAttribute('href') || `https://www.youtube.com/watch?v=${videoId}`};
    });
  }

  // GitHub Actions가 갱신하는 로컬 JSON을 1순위로 사용
  const latestJson = () => fetch('./youtube-latest.json', { cache: 'no-store' })
    .then(r => { if(!r.ok) throw new Error('youtube-latest.json failed'); return r.json(); })
    .then(data => {
      if(data && Array.isArray(data.items) && data.items.length) return data.items;
      throw new Error('youtube json empty');
    });

  // 실패하더라도 이전에 한 번이라도 받아둔 영상은 계속 보여줌
  const cached = getCache();
  if(cached) {
    try { render(cached); } catch(e){}
  }

  latestJson()
    .catch(() => rss2json())
    .catch(() => directRss())
    .catch(() => proxyRss())
    .then(items => render(items))
    .catch(() => {
      if(!cached) {
        ytList.innerHTML = '<div class="youtube-auto-empty">최근 영상을 불러오지 못했습니다. <a href="https://www.youtube.com/channel/UC8QwTy46OaCGdTauiPYkeow" target="_blank" rel="noopener">채널에서 확인하기 →</a></div>';
      }
    });
}


// --- Firebase Authentication 계정 전환 ---
function getAuthEmail(userId, userData = currentUserData) {
  const emailMap = {
    "박우영": "parkwooyoung02@turtless.com",
    "장혜나": "janghyena02@turtless.com",
    "송주원": "songjuwon02@turtless.com",
    "김아인": "kimain02@turtless.com",
    "강윤아": "kangyoona02@turtless.com",
    "장동준": "jangdongjun02@turtless.com",
    "류경원": "ryukyungwon02@turtless.com",
    "김태균": "kimtaegyun02@turtless.com",
    "이영진": "leeyoungjin02@turtless.com",
    "김정한": "kimjunghan02@turtless.com",
    "김승혁": "kimseunghyuk02@turtless.com",
    "김시우": "kimsiwoo02@turtless.com",
    "권우진": "kwonwoojin02@turtless.com",
    "이재민": "leejaemin02@turtless.com",
    "정지우": "jungjiwoo02@turtless.com",
    "최원정": "choiwonjeong02@turtless.com",
    "천강숙": "cheongangsuk02@turtless.com",
    "홍우진": "hongwoojin02@turtless.com",
    "채준현": "chaejunhyun02@turtless.com"
  };

  if (userData?.authEmail) {
    return userData.authEmail;
  }

  if (userData?.name && emailMap[userData.name]) {
    return emailMap[userData.name];
  }

  return `${userId}@turtless-web.firebaseapp.com`;
}

async function migrateUserToFirebaseAuth(userId, userData, oldPassword) {
  if (!window.auth || !userId || !userData) return false;

  const authEmail = getAuthEmail(userId);

  // 이미 Auth UID가 연결되어 있으면 그대로 사용
  if (userData.authUid) {
    try {
      await signInWithEmailAndPassword(window.auth, authEmail, oldPassword);
      return true;
    } catch (e) {
      console.warn("[TURTLESS] 기존 Auth 로그인 실패:", e.code);
      return false;
    }
  }

  let authPassword = oldPassword;
  let passwordChanged = false;

  // Firebase Auth 최소 6자 정책 때문에 4~5자리만 새 비밀번호 설정
  if (oldPassword.length < 6) {
    const newPassword = prompt(
      "보안 전환이 필요합니다.\n새 비밀번호를 6자 이상으로 설정해주세요."
    );

    if (newPassword === null) {
      alert("보안 전환을 취소했습니다. 기존 방식으로 로그인합니다.");
      return false;
    }

    if (newPassword.length < 6) {
      alert("새 비밀번호는 6자 이상이어야 합니다.");
      return false;
    }

    const confirmPassword = prompt("새 비밀번호를 한 번 더 입력해주세요.");

    if (confirmPassword !== newPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return false;
    }

    authPassword = newPassword;
    passwordChanged = true;
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      window.auth,
      authEmail,
      authPassword
    );

    const authUid = credential.user.uid;

    const updateData = {
      authUid,
      authMigrated: true,
      authMigratedAt: Date.now()
    };

    // 4~5자리 사용자는 새 비밀번호를 임시로 기존 pass에도 반영
    if (passwordChanged) {
      updateData.pass = authPassword;
    }

    await updateDoc(doc(db, "users", userId), updateData);

    currentUserData = {
      ...userData,
      ...updateData
    };

    alert(
      passwordChanged
        ? "보안 전환이 완료되었습니다. 새 비밀번호로 로그인하게 됩니다."
        : "보안 전환이 완료되었습니다."
    );

    return true;

  } catch (error) {
    // 이미 같은 Auth 계정이 존재하는 경우
    if (error.code === "auth/email-already-in-use") {
      try {
        const credential = await signInWithEmailAndPassword(
          window.auth,
          authEmail,
          authPassword
        );

        await updateDoc(doc(db, "users", userId), {
          authUid: credential.user.uid,
          authMigrated: true,
          authMigratedAt: Date.now(),
          ...(passwordChanged ? { pass: authPassword } : {})
        });

        currentUserData = {
          ...userData,
          authUid: credential.user.uid,
          authMigrated: true,
          ...(passwordChanged ? { pass: authPassword } : {})
        };

        return true;
      } catch (signInError) {
        console.error("[TURTLESS] 기존 Auth 계정 연결 실패:", signInError);
        alert(
          "Firebase 계정 연결에 실패했습니다.\n\n" +
          "오류 코드: " + (signInError?.code || "없음") + "\n" +
          "오류 내용: " + (signInError?.message || "없음")
        );
        return false;
      }
    }

    console.error("[TURTLESS] Auth 계정 생성 실패:", error);
    alert("보안 전환에 실패했습니다. 기존 로그인은 유지됩니다.");
    return false;
  }
}


// ============================================================
// Firebase Auth 비밀번호 변경
// ============================================================
window.changeFirebasePassword = async () => {
  try {
    const authUser = window.auth?.currentUser;

    if (!authUser) {
      alert("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    const newPassword = prompt(
      "새 비밀번호를 입력해주세요.\n\n" +
      "6자 이상으로 설정해주세요."
    );

    if (newPassword === null) return;

    if (newPassword.length < 6) {
      alert("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    const confirmPassword = prompt("새 비밀번호를 한 번 더 입력해주세요.");

    if (confirmPassword === null) return;

    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword === authUser.email) {
      alert("이메일 주소와 다른 비밀번호를 사용해주세요.");
      return;
    }

    try {
      await updatePassword(authUser, newPassword);

      alert("비밀번호가 변경되었습니다.");
      return;
    } catch (error) {
      // Firebase는 최근 로그인하지 않은 계정의 비밀번호 변경을
      // 보안상 막을 수 있음. 이 경우 현재 비밀번호로 재인증한다.
      if (error.code !== "auth/requires-recent-login") {
        console.error("[TURTLESS] 비밀번호 변경 실패:", error);
        alert(
          "비밀번호 변경에 실패했습니다.\n\n" +
          "오류 코드: " + (error?.code || "없음")
        );
        return;
      }
    }

    const currentPassword = prompt(
      "보안을 위해 현재 비밀번호를 입력해주세요."
    );

    if (currentPassword === null) return;

    if (!currentPassword) {
      alert("현재 비밀번호를 입력해주세요.");
      return;
    }

    const credential = EmailAuthProvider.credential(
      authUser.email,
      currentPassword
    );

    await reauthenticateWithCredential(authUser, credential);
    await updatePassword(authUser, newPassword);

    alert("비밀번호가 변경되었습니다.");
  } catch (error) {
    console.error("[TURTLESS] 비밀번호 변경 처리 실패:", error);

    let message = "비밀번호 변경에 실패했습니다.";

    if (error?.code === "auth/wrong-password") {
      message = "현재 비밀번호가 올바르지 않습니다.";
    } else if (error?.code === "auth/invalid-credential") {
      message = "현재 비밀번호가 올바르지 않습니다.";
    } else if (error?.code === "auth/weak-password") {
      message = "비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.";
    } else if (error?.code === "auth/requires-recent-login") {
      message = "보안을 위해 다시 로그인한 후 비밀번호를 변경해주세요.";
    }

    alert(message);
  }
};

// --- 로그인/로그아웃 및 기타 권한 ---

window.firebaseLogin = async () => {
  try {
    const s = document.getElementById('school').value;
    const g = document.getElementById('grade').value;
    const loginInput = document.getElementById('username').value.trim();

let n = loginInput;

// 이름 대신 TURTLESS ID를 입력해도 기존 로그인 로직을 그대로 사용할 수 있도록
// ID → 이름으로 먼저 변환한다.
const loginIdMap = {
    "parkwooyoung02": "박우영",
    "janghyena02": "장혜나",
    "songjuwon02": "송주원",
    "kimain02": "김아인",
    "kangyoona02": "강윤아",
    "jangdongjun02": "장동준",
    "ryukyungwon02": "류경원",
    "kimtaegyun02": "김태균",
    "leeyoungjin02": "이영진",
    "kimjunghan02": "김정한",
    "kimseunghyuk02": "김승혁",
    "kimsiwoo02": "김시우",
    "kwonwoojin02": "권우진",
    "leejaemin02": "이재민",
    "jungjiwoo02": "정지우",
    "choiwonjeong02": "최원정",
    "cheongangsuk02": "천강숙",
    "hongwoojin02": "홍우진",
    "chaejunhyun02": "채준현"
};

const normalizedLoginId = loginInput
    .toLowerCase()
    .replace(/@turtless\.com$/i, "");

if (loginIdMap[normalizedLoginId]) {
    n = loginIdMap[normalizedLoginId];
}
    const p = document.getElementById('password').value.trim();

    // 1. 학교 + 학년 + 이름만으로 사용자 확인
    const userSnap = await getDocs(
      query(
        collection(db, "users"),
        where("school", "==", s),
        where("grade", "==", g),
        where("name", "==", n)
      )
    );

    if (userSnap.empty) {
      alert("인증 실패");
      return;
    }

    const userDoc = userSnap.docs[0];
    currentUserId = userDoc.id;
    currentUserData = userDoc.data();

    // 2. 이미 Firebase Authentication으로 전환된 계정
    if (currentUserData.authUid) {
      try {
        await signInWithEmailAndPassword(
          window.auth,
          getAuthEmail(currentUserId, currentUserData),
          p
        );
      } catch (authError) {
        console.error("[TURTLESS] Firebase Auth 로그인 실패:", authError);
        alert("비밀번호가 올바르지 않습니다.");
        return;
      }
    }

    // 3. 아직 전환되지 않은 기존 계정
    else {
      if (currentUserData.pass !== p) {
        alert("인증 실패");
        return;
      }

      const migrated = await migrateUserToFirebaseAuth(
        currentUserId,
        currentUserData,
        p
      );

      // 마이그레이션이 실패하거나 취소되면 로그인도 완료하지 않는다.
      // 각 팀원이 자신의 새 비밀번호를 설정해야 Auth 전환이 완료된다.
      if (!migrated) {
        return;
      }

      // 마이그레이션이 성공하면 최신 데이터 다시 반영
      const refreshed = await getDoc(doc(db, "users", currentUserId));

      if (refreshed.exists()) {
        currentUserData = refreshed.data();
      }
    }

    window.isAdmin = currentUserData?.role === 'admin';

    // 기존 로그인 상태 저장
    sessionStorage.setItem('turtlessUserId', currentUserId);

    alert(n + "님 인증 성공");
    closeLoginModal();

    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) {
      welcomeMsg.innerText = `${s} ${g} [${n}]`;
    }

    const memberActions = document.getElementById('member-actions');
    if (memberActions) {
      memberActions.style.display = 'block';
    }

    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && currentUserData?.role === 'admin') {
      adminPanel.style.display = 'block';
    }

    const loginBtn = document.getElementById('main-login-btn');
    if (loginBtn) {
      loginBtn.innerText = '로그아웃';
      loginBtn.onclick = window.firebaseLogout;
    }

    const dateInput = document.getElementById('new-gal-date');
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }

    loadActivities();
    loadGallery();
    loadMembers();

  } catch (error) {
    console.error("[TURTLESS] 로그인 오류:", error);
    alert("로그인 중 오류가 발생했습니다.");
  }
};

// ★ 페이지 이동 후 저장된 로그인 상태 복구
async function restoreLoginSession() {
  try {
    // Firebase Authentication 세션이 완전히 초기화될 때까지 기다림
    const authUser = await new Promise((resolve) => {
      let unsubscribe = null;

      unsubscribe = onAuthStateChanged(window.auth, (user) => {
        if (unsubscribe) unsubscribe();
        resolve(user);
      });
    });

    // Firebase Auth에 로그인되어 있지 않으면 기존 세션도 제거
    if (!authUser) {
      sessionStorage.removeItem('turtlessUserId');
      currentUserId = null;
      currentUserData = null;
      window.isAdmin = false;
      return;
    }

    // Auth UID로 실제 팀원 데이터 확인
    const userSnap = await getDocs(
      query(
        collection(db, "users"),
        where("authUid", "==", authUser.uid)
      )
    );

    if (userSnap.empty) {
      sessionStorage.removeItem('turtlessUserId');
      currentUserId = null;
      currentUserData = null;
      window.isAdmin = false;
      await signOut(window.auth);
      return;
    }

    const userDoc = userSnap.docs[0];

    currentUserId = userDoc.id;
    currentUserData = userDoc.data();

    // 기존 세션 ID는 UI/페이지 이동 호환용으로만 유지
    sessionStorage.setItem('turtlessUserId', currentUserId);

    window.isAdmin = currentUserData?.role === 'admin';

    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) {
      welcomeMsg.innerText =
        `${currentUserData.school || ''} ${currentUserData.grade || ''} [${currentUserData.name || ''}]`;
    }

    const memberActions = document.getElementById('member-actions');
    if (memberActions) {
      memberActions.style.display = 'block';
    }

    const adminPanel = document.getElementById('admin-panel');

    if (adminPanel && currentUserData?.role === 'admin') {
      adminPanel.style.display = 'block';
    }

    const loginBtn = document.getElementById('main-login-btn');

    if (loginBtn) {
      loginBtn.innerText = '로그아웃';
      loginBtn.onclick = window.firebaseLogout;
    }

    const dateInput = document.getElementById('new-gal-date');
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }

    loadActivities();
    loadGallery();
    loadMembers();

    // 페이지 이동 후에도 관리자 직접 편집 모드 복구
    setTimeout(() => {
      if (typeof window.restoreEditMode === 'function') {
        window.restoreEditMode();
      }
    }, 0);

  } catch (error) {
    console.error('[TURTLESS] 로그인 세션 복구 실패:', error);

    sessionStorage.removeItem('turtlessUserId');
    currentUserId = null;
    currentUserData = null;
    window.isAdmin = false;
  }
}


window.firebaseLogout = async () => {

if(confirm("로그아웃 하시겠습니까?")) {

try {
  if (window.auth?.currentUser) {
    await signOut(window.auth);
  }
} catch (error) {
  console.error('[TURTLESS] Firebase Auth 로그아웃 실패:', error);
}

// ★ 실제 로그아웃할 때만 저장된 로그인 정보 삭제
sessionStorage.removeItem('turtlessUserId');

currentUserId = null;
currentUserData = null;
window.isAdmin = false;

const memberActions = document.getElementById('member-actions');
if(memberActions) {
    memberActions.style.display = 'none';
}

const adminPanel = document.getElementById('admin-panel');
if(adminPanel) {
    adminPanel.style.display = 'none';
}

const loginBtn = document.getElementById('main-login-btn');

if(loginBtn) {
    loginBtn.innerText = '팀원 로그인';
    loginBtn.onclick = openLoginModal;
}

// 로그아웃하면 직접 편집 모드도 완전히 종료
isEditMode = false;
sessionStorage.removeItem('turtlessEditMode');

if (typeof applyEditModeState === 'function') {
    applyEditModeState(false);
}

alert("로그아웃 되었습니다.");

loadActivities();
loadGallery();
loadMembers();

}
};

function ensureEditSaveButton() {
const oldBtn = document.getElementById('save-float-btn');
if (oldBtn) return oldBtn;

const btn = document.createElement('button');
btn.id = 'save-float-btn';
btn.type = 'button';
btn.textContent = '💾 전체 변경사항 저장';
btn.onclick = () => window.savePageContent();
document.body.appendChild(btn);
return btn;
}

function applyEditModeState(enabled) {
isEditMode = !!enabled;

document.body.classList.toggle('edit-mode', isEditMode);

const toolbar = document.getElementById('edit-toolbar');
if (toolbar) {
    toolbar.classList.toggle('active', isEditMode);
}

document.querySelectorAll('.editable-content').forEach(el => {
    el.contentEditable = isEditMode ? 'true' : 'false';
});

const saveBtn = ensureEditSaveButton();
saveBtn.style.display = isEditMode ? 'block' : 'none';

const toggleBtn = document.getElementById('toggle-edit-btn');
if (toggleBtn) {
    toggleBtn.textContent = isEditMode
        ? '✏️ 직접 텍스트 수정 끄기'
        : '📝 직접 텍스트 수정 켜기';
}

if (isEditMode) {
    sessionStorage.setItem('turtlessEditMode', 'true');
} else {
    sessionStorage.removeItem('turtlessEditMode');
}
}

window.toggleEditMode = () => {
applyEditModeState(!isEditMode);
};

window.restoreEditMode = () => {
if (
    sessionStorage.getItem('turtlessEditMode') === 'true' &&
    currentUserData?.role === 'admin'
) {
    applyEditModeState(true);
} else {
    applyEditModeState(false);
}
};

window.savePageContent = async () => {
try {
    let data = {};

    document.querySelectorAll('.editable-content').forEach(el => {
        if (el.id) data[el.id] = el.innerHTML;
    });

    document.querySelectorAll('.team-color-hex').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });

    await setDoc(
        doc(db, "settings", "page_content"),
        data,
        { merge: true }
    );

    alert("전체 변경사항 저장 완료");

    // 저장 후에도 편집모드는 유지
    applyEditModeState(true);

} catch (error) {
    console.error("[TURTLESS] 전체 변경사항 저장 실패:", error);
    alert("저장 실패: " + error.message);
}
};

// --- 메인 슬라이더 ---
let slideInt = null; let isMainSliderPaused = false;
async function loadSlider() {
try { 
const s = await getDoc(doc(db, "settings", "main_slider")); 
if(s.exists() && s.data().slides && s.data().slides.length === 5) { sliderData = s.data().slides; } 
else {
sliderData = Array(5).fill({title:"TURTLESS", sub:"Future Engineering", img:"#111111"});
await setDoc(doc(db, "settings", "main_slider"), { slides: sliderData });
}
} catch(e){ sliderData = Array(5).fill({title:"TURTLESS", sub:"", img:"#2c91f9"}); }

const c = document.getElementById('slider-content'); const d = document.getElementById('slider-dots');
if(!c || !d) return;

let sliderHtml = ''; 
let dotsHtml = `<button class="slider-control-btn" onclick="prevS()"><i class="fa-solid fa-chevron-left"></i></button>`;

sliderData.forEach((s, i) => {
const bgStyle = s.img.startsWith('#') || s.img.startsWith('rgb') ? `background-color: ${s.img};` : `background-image: url('${s.img}');`;
sliderHtml += `<div class="slide ${i===0?'active':''}" style="${bgStyle}"><h1>${s.title}</h1><p>${s.sub}</p></div>`;
dotsHtml += `<div class="slider-dot ${i===0?'active':''}" onclick="showS(${i})"></div>`;
});
dotsHtml += `<button class="slider-control-btn" onclick="togglePauseS()" id="main-pause-btn"><i class="fa-solid fa-pause"></i></button>
                        <button class="slider-control-btn" onclick="nextS()"><i class="fa-solid fa-chevron-right"></i></button>`;
c.innerHTML = sliderHtml; d.innerHTML = dotsHtml;
startS();
}

window.showS = (n) => { 
const sls = document.querySelectorAll('.slide'); const dots = document.querySelectorAll('#slider-dots .slider-dot'); 
if(!sls.length) return; 
sls.forEach((s,i) => s.classList.toggle('active', i===n)); 
dots.forEach((s,i) => dots[i].classList.toggle('active', i===n)); 
if(!isMainSliderPaused) startS();
};
window.nextS = () => { const sls = document.querySelectorAll('.slide'); let curr = Array.from(sls).findIndex(s => s.classList.contains('active')); showS((curr + 1) % sls.length); };
window.prevS = () => { const sls = document.querySelectorAll('.slide'); let curr = Array.from(sls).findIndex(s => s.classList.contains('active')); showS((curr - 1 + sls.length) % sls.length); };
window.togglePauseS = () => {
isMainSliderPaused = !isMainSliderPaused;
document.getElementById('main-pause-btn').innerHTML = isMainSliderPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
if(isMainSliderPaused) clearInterval(slideInt); else startS();
};
function startS() { if(slideInt) clearInterval(slideInt); slideInt = setInterval(() => { if(!isMainSliderPaused) window.nextS(); }, 5000); }

window.uploadSliderImg = async (input, idx) => {
if(!input.files || !input.files[0]) return;
try {
alert("배경 이미지를 업로드하는 중입니다...");
const formData = new FormData();
// 1. ImgBB 세팅 제거 후 Cloudinary 세팅 추가
formData.append("upload_preset", "ml_default");
formData.append("file", input.files[0]);

// 2. Cloudinary API 주소로 전송
const response = await fetch("https://api.cloudinary.com/v1_1/k8m3zaye/image/upload", {
method: 'POST',
body: formData
});
const data = await response.json();

// 3. ImgBB의 data.success 대신 Cloudinary의 data.secure_url 사용
if(data.secure_url) {
const targetInput = document.getElementById(`s-img-${idx}`);
if(targetInput) {
targetInput.value = data.secure_url; // data.data.url 대신 secure_url 입력
alert("배경 사진 업로드 완료! 아래 '변경사항 최종 저장' 버튼을 눌러주세요.");
} else {
alert("입력창을 찾을 수 없습니다.");
}
} else {
alert("업로드 실패: " + (data.error ? data.error.message : "알 수 없는 오류"));
}
} catch(e){ 
alert("업로드 에러: " + e.message); 
}
};

window.openSliderEditModal = () => {
let h = ''; 
for(let i=0; i<5; i++) {
const s = sliderData[i] || {title:"", sub:"", img:"#111111"};
h += `<div style="background:#f5f5f5; padding:15px; margin-bottom:15px; border-radius:10px;">
                   <strong>📍 슬라이드 ${i+1}</strong>
                   <div style="margin: 8px 0;">
                       <label style="font-size:11px; color:#555; display:block; margin-bottom:4px;">배경 (헥사코드 #000000 혹은 이미지 링크 주소 입력)</label>
                       <div style="display:flex; gap:10px;">
                           <input id="s-img-${i}" value="${s.img}" placeholder="예: #2c91f9 또는 https://주소" style="width:100%; padding:5px; background:white;">
                           <button class="dash-btn-sm" onclick="document.getElementById('s-file-${i}').click()">파일 업로드</button>
                           <input type="file" id="s-file-${i}" style="display:none" accept="image/*" onchange="window.uploadSliderImg(this, ${i})">
                       </div>
                   </div>
                   <input id="s-t-${i}" value="${s.title}" placeholder="메인 대제목" style="width:100%; padding:5px; margin-bottom:5px; background:white;">
                   <input id="s-s-${i}" value="${s.sub}" placeholder="서브 소제목" style="width:100%; padding:5px; background:white;">
               </div>`; 
}
document.getElementById('slider-inputs-container').innerHTML = h;
document.getElementById('slider-edit-modal').style.display = 'flex';
};

window.closeSliderEditModal = () => document.getElementById('slider-edit-modal').style.display='none';

window.saveSliderData = async () => { 
let news = []; 
for(let i=0; i<5; i++) { news.push({ img: document.getElementById(`s-img-${i}`).value.trim(), title: document.getElementById(`s-t-${i}`).value.trim(), sub: document.getElementById(`s-s-${i}`).value.trim() }); }
await setDoc(doc(db, "settings", "main_slider"), { slides:news }); alert("업데이트됨!"); location.reload(); 
};

// --- 후원사 슬라이더 ---
let spInt = null; let isSpPaused = false;
async function loadSponsors() {
try {
const s = await getDoc(doc(db, "settings", "sponsors"));
if(s.exists() && s.data().list) { sponsorData = s.data().list; } else { sponsorData = []; }
} catch(e) { sponsorData = []; }
renderSponsorSliders();
}

function renderSponsorSliders() {
const html = sponsorData.length > 0 ? buildSpHtml() : '<div style="padding:40px; text-align:center; color:#777;">등록된 후원사가 없습니다.</div>';
const homeSp = document.getElementById('home-sponsor-slider');
const pageSp = document.getElementById('page-sponsor-slider');
if(homeSp) homeSp.innerHTML = html;
if(pageSp) pageSp.innerHTML = html;

if(sponsorData.length > 0) {
document.querySelectorAll('#home-sponsor-slider .sp-slide, #page-sponsor-slider .sp-slide').forEach(el => el.classList.remove('active'));
document.querySelectorAll('#home-sponsor-slider .sp-nav .slider-dot, #page-sponsor-slider .sp-nav .slider-dot').forEach(el => el.classList.remove('active'));
showSp(0);
startSp();
}
}

function buildSpHtml() {
let slides = ''; 
let dots = `<button class="slider-control-btn" onclick="prevSp()"><i class="fa-solid fa-chevron-left"></i></button>`;

sponsorData.forEach((sp, i) => {
const logo = sp.logo || 'https://dummyimage.com/300x200/fff/000&text=LOGO';
slides += `
               <div class="sp-slide ${i===0?'active':''}" data-index="${i}">
                   <div class="sp-left"><img src="${logo}" alt="${sp.name}"></div>
                   <div class="sp-right"><h3>${sp.name}</h3><p>${sp.desc.replace(/\n/g, '<br>')}</p></div>
               </div>`;
dots += `<div class="slider-dot ${i===0?'active':''}" onclick="showSp(${i})"></div>`;
});
dots += `<button class="slider-control-btn sp-pause-btn" onclick="togglePauseSp()"><i class="fa-solid fa-pause"></i></button>
                    <button class="slider-control-btn" onclick="nextSp()"><i class="fa-solid fa-chevron-right"></i></button>`;
return slides + `<div class="sp-nav">${dots}</div>`;
}

window.showSp = (n) => {
document.querySelectorAll('#home-sponsor-slider .sp-slide, #page-sponsor-slider .sp-slide').forEach(s => s.classList.remove('active'));
document.querySelectorAll('#home-sponsor-slider .sp-nav .slider-dot, #page-sponsor-slider .sp-nav .slider-dot').forEach(d => d.classList.remove('active'));
document.querySelectorAll(`#home-sponsor-slider .sp-slide[data-index="${n}"], #page-sponsor-slider .sp-slide[data-index="${n}"]`).forEach(s => s.classList.add('active'));
const dotContainers = document.querySelectorAll('#home-sponsor-slider .sp-nav, #page-sponsor-slider .sp-nav');
dotContainers.forEach(container => {
const dots = container.querySelectorAll('.slider-dot');
if(dots[n]) dots[n].classList.add('active');
});
if(!isSpPaused) startSp();
};
window.nextSp = () => { if(sponsorData.length===0) return; let curr = parseInt(document.querySelector('#home-sponsor-slider .sp-slide.active, #page-sponsor-slider .sp-slide.active')?.getAttribute('data-index') || 0); showSp((curr + 1) % sponsorData.length); };
window.prevSp = () => { if(sponsorData.length===0) return; let curr = parseInt(document.querySelector('#home-sponsor-slider .sp-slide.active, #page-sponsor-slider .sp-slide.active')?.getAttribute('data-index') || 0); showSp((curr - 1 + sponsorData.length) % sponsorData.length); };
window.togglePauseSp = () => {
isSpPaused = !isSpPaused;
document.querySelectorAll('.sp-pause-btn').forEach(btn => {
btn.innerHTML = isSpPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
});
if(isSpPaused) clearInterval(spInt); else startSp();
};
function startSp() { if(spInt) clearInterval(spInt); spInt = setInterval(() => { if(!isSpPaused) window.nextSp(); }, 6000); }

window.openSponsorAdminModal = () => {
let h = '';
sponsorData.forEach((sp, i) => {
h += `<div style="background:#f9f9f9; padding:10px; border:1px solid #ddd; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                   <div><strong>${sp.name}</strong></div>
                   <div style="display:flex; gap:5px;">
                     <button class="dash-btn-sm" style="background:#555; padding:4px 8px;" onclick="moveSponsorUp(${i})">▲</button>
                     <button class="dash-btn-sm" style="background:#555; padding:4px 8px;" onclick="moveSponsorDown(${i})">▼</button>
                     <button class="dash-btn-sm" style="background:#dc3545;" onclick="deleteSponsor(${i})">삭제</button>
                   </div>
               </div>`;
});
document.getElementById('sponsor-admin-list').innerHTML = h;
document.getElementById('sponsor-admin-modal').style.display = 'flex';
};
window.closeSponsorAdminModal = () => document.getElementById('sponsor-admin-modal').style.display = 'none';

// 로봇 관리자 모달은 공통 관리자 대시보드에서도 사용되므로
// robot 페이지가 아닌 곳에서도 열고 닫을 수 있도록 공통 JS에서 연결한다.
window.openRobotModal = () => {
    const modal = document.getElementById('robot-admin-modal');
    if (modal) modal.style.display = 'flex';
};
window.closeRobotModal = () => {
    const modal = document.getElementById('robot-admin-modal');
    if (modal) modal.style.display = 'none';
};

window.addSponsor = async () => {
const name = document.getElementById('sp-new-name').value.trim();
const desc = document.getElementById('sp-new-desc').value.trim();
const fileInput = document.getElementById('sp-new-logo');
if(!name) return alert("이름을 입력하세요.");

let logoUrl = '';
if(fileInput.files && fileInput.files[0]) {
alert("로고 업로드 중...");
const formData = new FormData(); 
// 1. ImgBB 대신 Cloudinary 세팅 적용 (key -> upload_preset, image -> file)
formData.append("upload_preset", "ml_default"); 
formData.append("file", fileInput.files[0]);

// 2. Cloudinary API 주소로 전송
const response = await fetch("https://api.cloudinary.com/v1_1/k8m3zaye/image/upload", { method: 'POST', body: formData });
const data = await response.json();

// 3. 반환값에서 secure_url 추출
if(data.secure_url) { 
logoUrl = data.secure_url; 
} else { 
return alert("업로드 실패: " + (data.error ? data.error.message : "알 수 없는 오류")); 
}
}

sponsorData.push({ name, desc, logo: logoUrl });
await setDoc(doc(db, "settings", "sponsors"), { list: sponsorData });
alert("후원사 추가 완료!");
document.getElementById('sp-new-name').value=''; document.getElementById('sp-new-desc').value=''; fileInput.value='';
renderSponsorSliders();
openSponsorAdminModal(); 
};

window.deleteSponsor = async (index) => {
if(!confirm("삭제하시겠습니까?")) return;
sponsorData.splice(index, 1);
await setDoc(doc(db, "settings", "sponsors"), { list: sponsorData });
renderSponsorSliders();
openSponsorAdminModal();
};

window.moveSponsorUp = async (index) => {
  if(index <= 0) return;
  [sponsorData[index - 1], sponsorData[index]] = [sponsorData[index], sponsorData[index - 1]];
  try {
    await setDoc(doc(db, "settings", "sponsors"), { list: sponsorData });
    renderSponsorSliders();
    openSponsorAdminModal();
  } catch(e) {
    [sponsorData[index - 1], sponsorData[index]] = [sponsorData[index], sponsorData[index - 1]];
    alert("순서 변경 실패: " + e.message);
  }
};

window.moveSponsorDown = async (index) => {
  if(index >= sponsorData.length - 1) return;
  [sponsorData[index], sponsorData[index + 1]] = [sponsorData[index + 1], sponsorData[index]];
  try {
    await setDoc(doc(db, "settings", "sponsors"), { list: sponsorData });
    renderSponsorSliders();
    openSponsorAdminModal();
  } catch(e) {
    [sponsorData[index], sponsorData[index + 1]] = [sponsorData[index + 1], sponsorData[index]];
    alert("순서 변경 실패: " + e.message);
  }
};

// ==========================================
// 💼 [추가] 경력 관리: 조회, 추가, 수정, 순서변경
// ==========================================
window.cachedCareers = [];
window.editingCareerId = null;

window.openCareerAdminModal = async () => {
    const modal = document.getElementById('career-admin-modal');
    const list = document.getElementById('career-admin-list');
    if (!modal) return;
    modal.style.display = 'flex';
    if (list) {
        list.style.maxHeight = 'none';
        list.style.overflowY = 'visible';
        list.style.paddingRight = '0';
    }
    window.renderCareerAdminList();
};
window.closeCareerAdminModal = () => {
    document.getElementById('career-admin-modal').style.display = 'none';
    window.cancelEditCareer();
};

window.renderCareerAdminList = () => {
    let html = '';
    window.cachedCareers.forEach((c, index) => {
        html += `<div style="background:#f9f9f9; padding:10px; border:1px solid #ddd; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:14px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0;">
                        <span style="color:#005a9c; margin-right:5px;">[${c.period || '기간없음'}]</span> ${c.title || '제목 없음'}
                    </div>
                    <div style="display:flex; gap:5px; flex-shrink:0;">
                        <button class="dash-btn-sm" style="background:#555; padding:4px 8px;" onclick="window.moveCareerUp(${index})" title="위로 올리기">▲</button>
                        <button class="dash-btn-sm" style="background:#555; padding:4px 8px;" onclick="window.moveCareerDown(${index})" title="아래로 내리기">▼</button>
                        <button class="dash-btn-sm" style="background:#007bff;" onclick="window.editCareer('${c.id}')">수정</button>
                        <button class="dash-btn-sm" style="background:#dc3545;" onclick="window.deleteCareer('${c.id}')">삭제</button>
                    </div>
                 </div>`;
    });
    document.getElementById('career-admin-list').innerHTML = html || '<p style="font-size:12px; color:#777;">등록된 경력이 없습니다.</p>';
};

window.loadCareers = async () => {
    const container = document.getElementById("career-container");
    if (!container) return;
    
    try {
        const querySnapshot = await getDocs(collection(db, "careers"));
        window.cachedCareers = [];
        
        querySnapshot.forEach((docSnap) => {
            window.cachedCareers.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // 생성된 시간 내림차순(최신순) 정렬
        window.cachedCareers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (window.cachedCareers.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#777;">등록된 경력 사항이 없습니다.</div>';
            return;
        }

        let html = '';
        window.cachedCareers.forEach((c, index) => {
            const layoutClass = index % 2 === 0 ? "normal" : "reverse";
            const imgUrl = c.imageUrl || "https://dummyimage.com/600x400/f0f0f0/999999&text=No+Image";
            
            html += `
                <div class="career-row ${layoutClass}">
                    <div class="career-dot"></div>
                    <div class="career-col-text">
                        <div class="career-year">${c.period || ''}</div>
                        <div class="career-details">
                            <h3>${c.title || '제목 없음'}</h3>
                            <p>${(c.desc || '').replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                    <div class="career-col-img">
                        <div class="career-img-box">
                            <img src="${imgUrl}" alt="경력 증빙 사진">
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        if (document.getElementById('career-admin-modal').style.display === 'flex') {
            window.renderCareerAdminList();
        }
    } catch (error) {
        console.error(error);
    }
};

window.addOrUpdateCareer = async () => {
    const period = document.getElementById('c-new-period').value.trim();
    const title = document.getElementById('c-new-title').value.trim();
    const desc = document.getElementById('c-new-desc').value.trim();
    const fileInput = document.getElementById('c-new-img');
    
    if(!title || !desc) return alert("제목과 내용을 모두 입력하세요.");

    let imageUrl = null;
    if(fileInput.files && fileInput.files[0]) {
        alert("사진 업로드 중...");
        const formData = new FormData(); 
        // 1. ImgBB 대신 Cloudinary 세팅 적용
        formData.append("upload_preset", "ml_default"); 
        formData.append("file", fileInput.files[0]);

        // 2. Cloudinary API 전송
        const response = await fetch("https://api.cloudinary.com/v1_1/k8m3zaye/image/upload", { method: 'POST', body: formData });
        const data = await response.json();

        // 3. 반환값 추출
        if(data.secure_url) { 
            imageUrl = data.secure_url; 
        } else { 
            return alert("업로드 실패: " + (data.error ? data.error.message : "알 수 없는 오류")); 
        }
    }

    try {
        if (window.editingCareerId) {
            let updateData = { period, title, desc };
            if (imageUrl) updateData.imageUrl = imageUrl;
            await updateDoc(doc(db, "careers", window.editingCareerId), updateData);
            alert("수정 완료되었습니다.");
            window.cancelEditCareer();
        } else {
            await addDoc(collection(db, "careers"), { 
                period, title, desc, imageUrl: imageUrl || '', createdAt: Date.now() 
            });
            alert("새 경력이 추가되었습니다!");
            document.getElementById('c-new-period').value = '';
            document.getElementById('c-new-title').value = ''; 
            document.getElementById('c-new-desc').value = ''; 
            fileInput.value = '';
        }
        window.loadCareers();
    } catch(e) {
        alert("오류 발생: " + e.message);
    }
};

window.editCareer = (id) => {
    const c = window.cachedCareers.find(x => x.id === id);
    if(!c) return;
    
    window.editingCareerId = id;
    document.getElementById('c-form-title').innerText = "✏️ 경력 수정 모드";
    document.getElementById('c-new-period').value = c.period || '';
    document.getElementById('c-new-title').value = c.title || '';
    document.getElementById('c-new-desc').value = c.desc || '';
    document.getElementById('c-submit-btn').innerText = "수정 내용 저장";
    document.getElementById('c-cancel-btn').style.display = 'block';
};

window.cancelEditCareer = () => {
    window.editingCareerId = null;
    document.getElementById('c-form-title').innerText = "새 경력 추가";
    document.getElementById('c-new-period').value = '';
    document.getElementById('c-new-title').value = '';
    document.getElementById('c-new-desc').value = '';
    document.getElementById('c-new-img').value = '';
    document.getElementById('c-submit-btn').innerText = "경력 등록하기";
    document.getElementById('c-cancel-btn').style.display = 'none';
};

window.moveCareerUp = async (index) => {
    if(index === 0) return; 
    const current = window.cachedCareers[index];
    const prev = window.cachedCareers[index - 1]; 
    const tempTime = current.createdAt;
    await updateDoc(doc(db, "careers", current.id), { createdAt: prev.createdAt });
    await updateDoc(doc(db, "careers", prev.id), { createdAt: tempTime });
    await window.loadCareers();
    window.renderCareerAdminList();
};

window.moveCareerDown = async (index) => {
    if(index === window.cachedCareers.length - 1) return; 
    const current = window.cachedCareers[index];
    const next = window.cachedCareers[index + 1]; 
    const tempTime = current.createdAt;
    await updateDoc(doc(db, "careers", current.id), { createdAt: next.createdAt });
    await updateDoc(doc(db, "careers", next.id), { createdAt: tempTime });
    await window.loadCareers();
    window.renderCareerAdminList();
};

window.deleteCareer = async (id) => {
    if(!confirm("이 경력을 정말 삭제하시겠습니까?")) return;
    try {
        await deleteDoc(doc(db, "careers", id));
        alert("삭제되었습니다.");
        window.loadCareers();
    } catch(e) {
        alert("삭제 실패: " + e.message);
    }
};


// ============================================================
// TURTLESS 팀 로고 관리
// ============================================================

window.loadSiteLogos = async () => {
    const logo1 = document.getElementById('team-logo-1');
    const logo2 = document.getElementById('team-logo-2');

    if (!logo1 && !logo2) return;

    try {
        const snap = await getDoc(doc(db, "settings", "site_logos"));

        if (!snap.exists()) {
            if (logo1) logo1.style.display = 'none';
            if (logo2) logo2.style.display = 'none';
            return;
        }

        const data = snap.data() || {};

        if (logo1) {
            if (data.logo1) {
                logo1.src = data.logo1;
                logo1.style.display = 'block';
            } else {
                logo1.style.display = 'none';
            }
        }

        if (logo2) {
            if (data.logo2) {
                logo2.src = data.logo2;
                logo2.style.display = 'block';
            } else {
                logo2.style.display = 'none';
            }
        }

    } catch (e) {
        console.error("[TURTLESS] 로고 불러오기 실패:", e);
    }
};


window.uploadSiteLogo = async (file) => {

    if (!file) return '';

    const formData = new FormData();

    // 현재 TURTLESS에서 실제 사용 중인 Cloudinary 설정
    formData.append("upload_preset", "ml_default");
    formData.append("file", file);

    const response = await fetch(
        "https://api.cloudinary.com/v1_1/k8m3zaye/image/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!data.secure_url) {
        throw new Error(
            data.error?.message || "Cloudinary 업로드에 실패했습니다."
        );
    }

    return data.secure_url;
};


window.openLogoAdminModal = () => {

    if (currentUserData?.role !== 'admin') {
        alert("관리자만 사용할 수 있습니다.");
        return;
    }

    const modal = document.getElementById('logo-admin-modal');

    if (modal) {
        modal.style.display = 'flex';
    }
};


window.closeLogoAdminModal = () => {

    const modal = document.getElementById('logo-admin-modal');

    if (modal) {
        modal.style.display = 'none';
    }
};


window.saveSiteLogos = async () => {

    if (currentUserData?.role !== 'admin') {
        alert("관리자만 사용할 수 있습니다.");
        return;
    }

    const file1 = document.getElementById('site-logo-file-1');
    const file2 = document.getElementById('site-logo-file-2');

    try {

        const oldSnap = await getDoc(
            doc(db, "settings", "site_logos")
        );

        const oldData = oldSnap.exists()
            ? oldSnap.data()
            : {};

        let logo1 = oldData.logo1 || '';
        let logo2 = oldData.logo2 || '';

        if (file1?.files?.[0]) {
            alert("로고 1을 업로드하는 중입니다...");
            logo1 = await window.uploadSiteLogo(file1.files[0]);
        }

        if (file2?.files?.[0]) {
            alert("로고 2를 업로드하는 중입니다...");
            logo2 = await window.uploadSiteLogo(file2.files[0]);
        }

        await setDoc(
            doc(db, "settings", "site_logos"),
            {
                logo1: logo1,
                logo2: logo2,
                updatedAt: new Date().toISOString()
            },
            { merge: true }
        );

        await window.loadSiteLogos();

        if (file1) file1.value = '';
        if (file2) file2.value = '';

        alert("팀 로고가 저장되었습니다.");

        window.closeLogoAdminModal();

    } catch (e) {

        console.error("[TURTLESS] 팀 로고 저장 실패:", e);
        alert("로고 저장 실패: " + e.message);

    }
};


// --- 기타 네비게이션 ---
window.toggleDrop = (id) => { document.querySelectorAll('.dropdown-content').forEach(d => { if(d.id !== id) d.classList.remove('show'); }); document.getElementById(id).classList.toggle('show'); };
window.openLoginModal = () => document.getElementById('login-modal').style.display='flex';
window.closeLoginModal = () => document.getElementById('login-modal').style.display='none';

// SPA navigate/history code removed during multi-page split.

window.addEventListener('DOMContentLoaded', async () => {

  // ★ 페이지가 열릴 때 가장 먼저 로그인 상태 복구
  await restoreLoginSession();

  // 팀 로고 불러오기
  if (typeof window.loadSiteLogos === 'function') {
    await window.loadSiteLogos();
  }

// 페이지를 새로 열거나 다른 페이지로 이동해도 편집모드 유지
if (
    sessionStorage.getItem('turtlessEditMode') === 'true' &&
    currentUserData?.role === 'admin'
) {
    setTimeout(() => {
        if (typeof window.restoreEditMode === 'function') {
            window.restoreEditMode();
        }
    }, 50);
}

  loadSlider().then(() => {
    loadMembers(); loadActivities(); loadGallery(); loadSponsors(); window.loadCareers();

    getDoc(doc(db, "settings", "page_content")).then(s => { 
      if(s.exists()){ 
        let d = s.data(); 

        document.querySelectorAll('.editable-content').forEach(el => { 
          if(d[el.id]) el.innerHTML = d[el.id]; 
        });

        document.querySelectorAll('.team-color-hex').forEach(el => {
          if(d[el.id]) {
            el.value = d[el.id];
            updateTeamColor(Number(el.id.replace('team-color-hex-', '')));
          }
        });
      } 
    });
  });
});

/* =========================================================
   팀원 계정·프로필 관리자
   ========================================================= */

let teamAccountAdminMembers = [];
let teamAccountAdminFiltered = [];

function getTeamAccountAdminId(member) {
    /*
     * 기존 로그인 구조와 동일하게 TURTLESS ID를 계산합니다.
     * authEmail이 있으면 @turtless.com 앞부분을 사용합니다.
     */
    if (member.authEmail) {
        return String(member.authEmail)
            .replace(/@turtless\.com$/i, '')
            .trim();
    }

    const emailMap = {
        "박우영": "parkwooyoung02",
        "장혜나": "janghyena02",
        "송주원": "songjuwon02",
        "김아인": "kimain02",
        "강윤아": "kangyoona02",
        "장동준": "jangdongjun02",
        "류경원": "ryukyungwon02",
        "김태균": "kimtaegyun02",
        "이영진": "leeyoungjin02",
        "김정한": "kimjunghan02",
        "김승혁": "kimseunghyuk02",
        "김시우": "kimsiwoo02",
        "권우진": "kwonwoojin02",
        "이재민": "leejaemin02",
        "정지우": "jungjiwoo02",
        "최원정": "choiwonjeong02",
        "천강숙": "cheongangsuk02",
        "홍우진": "hongwoojin02",
        "채준현": "chaejunhyun02"
    };

    if (member.name && emailMap[member.name]) {
        return emailMap[member.name];
    }

    return member.id || "-";
}

function escapeTeamAccountAdminHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.openTeamAccountAdminModal = async () => {
    if (!currentUserData || currentUserData.role !== "admin") {
        alert("관리자만 사용할 수 있습니다.");
        return;
    }

    const modal = document.getElementById("team-account-admin-modal");
    if (!modal) return;

    modal.style.display = "flex";

    const search = document.getElementById("team-account-admin-search");
    if (search) search.value = "";

    await window.loadTeamAccountAdmin();
};

window.closeTeamAccountAdminModal = () => {
    const modal = document.getElementById("team-account-admin-modal");
    if (modal) modal.style.display = "none";
};

window.loadTeamAccountAdmin = async () => {
    const list = document.getElementById("team-account-admin-list");
    const summary = document.getElementById("team-account-admin-summary");

    if (!list) return;

    list.innerHTML = `
        <div style="padding:40px;text-align:center;color:#777;">
            팀원 정보를 불러오는 중...
        </div>
    `;

    try {
        const snap = await getDocs(collection(db, "users"));

        const uniqueMap = new Map();

        snap.forEach(d => {
            const data = d.data();

            if (!data.name) return;

            const key = `${data.school || ""}_${data.grade || ""}_${data.name || ""}`;

            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, {
                    id: d.id,
                    ...data
                });
            }
        });

        teamAccountAdminMembers = Array.from(uniqueMap.values());

        teamAccountAdminMembers.sort((a, b) => {
            const schoolA = String(a.school || "");
            const schoolB = String(b.school || "");

            if (schoolA !== schoolB) {
                return schoolA.localeCompare(schoolB, "ko");
            }

            return String(a.name || "").localeCompare(
                String(b.name || ""),
                "ko"
            );
        });

        teamAccountAdminFiltered = [...teamAccountAdminMembers];

        window.renderTeamAccountAdmin();

    } catch (e) {
        console.error("[TURTLESS] 팀원 계정 목록 로딩 실패:", e);

        list.innerHTML = `
            <div style="padding:35px;text-align:center;color:#dc3545;">
                팀원 정보를 불러오지 못했습니다.<br>
                <small>${escapeTeamAccountAdminHtml(e.message)}</small>
            </div>
        `;
    }
};

window.filterTeamAccountAdmin = () => {
    const input = document.getElementById("team-account-admin-search");
    const keyword = String(input?.value || "").trim().toLowerCase();

    if (!keyword) {
        teamAccountAdminFiltered = [...teamAccountAdminMembers];
    } else {
        teamAccountAdminFiltered = teamAccountAdminMembers.filter(member => {
            const text = [
                member.name,
                member.school,
                member.grade,
                member.id,
                getTeamAccountAdminId(member),
                member.role,
                member.authEmail
            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

            return text.includes(keyword);
        });
    }

    window.renderTeamAccountAdmin();
};

window.renderTeamAccountAdmin = () => {
    const list = document.getElementById("team-account-admin-list");
    const summary = document.getElementById("team-account-admin-summary");

    if (!list) return;

    const total = teamAccountAdminMembers.length;

    const migrated = teamAccountAdminMembers.filter(
        m => m.authMigrated === true && m.authUid
    ).length;

    const authLinked = teamAccountAdminMembers.filter(
        m => !!m.authUid
    ).length;

    const admins = teamAccountAdminMembers.filter(
        m => m.role === "admin"
    ).length;

    if (summary) {
        summary.innerHTML = `
            <span style="padding:8px 12px;border-radius:999px;background:#f1f5f9;font-size:13px;font-weight:800;">
                전체 ${total}명
            </span>

            <span style="padding:8px 12px;border-radius:999px;background:#e8f7ee;color:#16834b;font-size:13px;font-weight:800;">
                Auth 연결 ${authLinked}명
            </span>

            <span style="padding:8px 12px;border-radius:999px;background:#e8f1ff;color:#2463c7;font-size:13px;font-weight:800;">
                마이그레이션 ${migrated}명
            </span>

            <span style="padding:8px 12px;border-radius:999px;background:#fff4db;color:#9a6500;font-size:13px;font-weight:800;">
                관리자 ${admins}명
            </span>
        `;
    }

    if (!teamAccountAdminFiltered.length) {
        list.innerHTML = `
            <div style="padding:40px;text-align:center;color:#777;">
                검색 결과가 없습니다.
            </div>
        `;
        return;
    }

    list.innerHTML = teamAccountAdminFiltered.map(member => {

        const img = member.profileImage ||
            "https://dummyimage.com/160x160/e9ecef/777777&text=NO+IMAGE";

        const id = getTeamAccountAdminId(member);

        const authStatus = member.authUid
            ? `<span style="color:#16834b;background:#e8f7ee;">● Auth 연결</span>`
            : `<span style="color:#888;background:#f1f3f5;">○ 미연결</span>`;

        const migrationStatus = member.authMigrated === true
            ? `<span style="color:#2463c7;background:#e8f1ff;">마이그레이션 완료</span>`
            : `<span style="color:#9a6500;background:#fff4db;">기존 계정</span>`;

        const roleStatus = member.role === "admin"
            ? `<span style="color:#8a4b00;background:#fff0d0;">👑 관리자</span>`
            : `<span style="color:#666;background:#f3f4f6;">팀원</span>`;

        return `
            <div class="team-account-admin-row"
                 style="display:grid;grid-template-columns:60px minmax(170px,1fr) minmax(150px,1fr) minmax(190px,1fr) auto;gap:14px;align-items:center;padding:13px 4px;border-bottom:1px solid #eee;">

                <img src="${escapeTeamAccountAdminHtml(img)}"
                     alt="${escapeTeamAccountAdminHtml(member.name)}"
                     style="width:52px;height:52px;border-radius:12px;object-fit:cover;background:#f1f3f5;">

                <div style="min-width:0;">
                    <div style="font-weight:900;font-size:15px;">
                        ${escapeTeamAccountAdminHtml(member.name)}
                    </div>
                    <div style="margin-top:4px;color:#777;font-size:12px;">
                        ${escapeTeamAccountAdminHtml(member.school || "")}
                        ${escapeTeamAccountAdminHtml(member.grade || "")}
                    </div>
                </div>

                <div style="min-width:0;">
                    <div style="font-size:11px;color:#999;font-weight:700;">TURTLESS ID</div>
                    <div style="font-size:13px;font-weight:800;word-break:break-all;">
                        ${escapeTeamAccountAdminHtml(id)}
                    </div>
                </div>

                <div style="display:flex;gap:5px;flex-wrap:wrap;font-size:11px;font-weight:800;">
                    ${authStatus}
                    ${migrationStatus}
                    ${roleStatus}
                    <span style="padding:5px 7px;border-radius:6px;">
                        ${member.profileImage ? "📷 기본사진" : "📷 기본사진 없음"}
                    </span>
                    <span style="padding:5px 7px;border-radius:6px;">
                        ${member.profileHoverImage ? "✨ 호버사진" : "✨ 호버사진 없음"}
                    </span>
                </div>

                <button onclick="window.openTeamAccountDetail('${String(member.id).replace(/'/g, "\\'")}')"
                        style="padding:9px 13px;border:0;border-radius:9px;background:#111;color:#fff;font-weight:800;cursor:pointer;white-space:nowrap;">
                    상세
                </button>
            </div>
        `;
    }).join("");
};

window.openTeamAccountDetail = (id) => {
    if (!currentUserData || currentUserData.role !== "admin") {
        alert("관리자만 사용할 수 있습니다.");
        return;
    }

    const member = teamAccountAdminMembers.find(m => m.id === id);

    if (!member) {
        alert("팀원 정보를 찾을 수 없습니다.");
        return;
    }

    const modal = document.getElementById("team-account-detail-modal");
    const title = document.getElementById("team-account-detail-title");
    const content = document.getElementById("team-account-detail-content");

    if (!modal || !content) return;

    if (title) {
        title.innerText = `👤 ${member.name} 계정·프로필`;
    }

    const img = member.profileImage ||
        "https://dummyimage.com/400x400/e9ecef/777777&text=NO+IMAGE";

    const hover = member.profileHoverImage ||
        "https://dummyimage.com/400x400/e9ecef/777777&text=NO+HOVER";

    const idValue = getTeamAccountAdminId(member);

    content.innerHTML = `
        <div style="display:flex;gap:18px;align-items:center;margin-bottom:22px;">
            <img src="${escapeTeamAccountAdminHtml(img)}"
                 style="width:100px;height:100px;object-fit:cover;border-radius:16px;background:#f1f3f5;">

            <div>
                <h3 style="margin:0 0 7px;font-size:20px;">
                    ${escapeTeamAccountAdminHtml(member.name)}
                </h3>

                <div style="color:#666;font-size:13px;">
                    ${escapeTeamAccountAdminHtml(member.school || "")}
                    ${escapeTeamAccountAdminHtml(member.grade || "")}
                </div>

                <div style="margin-top:7px;font-size:13px;font-weight:800;">
                    ${escapeTeamAccountAdminHtml(idValue)}
                </div>
            </div>
        </div>

        <div style="display:grid;gap:10px;">

            <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                <div style="font-size:11px;color:#888;font-weight:800;">AUTH UID</div>
                <div style="margin-top:5px;font-size:13px;word-break:break-all;">
                    ${escapeTeamAccountAdminHtml(member.authUid || "아직 연결되지 않음")}
                </div>
            </div>

            <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                <div style="font-size:11px;color:#888;font-weight:800;">AUTH EMAIL</div>
                <div style="margin-top:5px;font-size:13px;word-break:break-all;">
                    ${escapeTeamAccountAdminHtml(member.authEmail || idValue + "@turtless.com")}
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                    <div style="font-size:11px;color:#888;font-weight:800;">계정 상태</div>
                    <div style="margin-top:5px;font-weight:900;">
                        ${member.authUid ? "Firebase Auth 연결됨" : "기존 계정"}
                    </div>
                </div>

                <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                    <div style="font-size:11px;color:#888;font-weight:800;">권한</div>
                    <div style="margin-top:5px;font-weight:900;">
                        ${member.role === "admin" ? "👑 관리자" : "팀원"}
                    </div>
                </div>
            </div>

            <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                <div style="font-size:11px;color:#888;font-weight:800;">소개</div>
                <div style="margin-top:6px;white-space:pre-wrap;line-height:1.6;">
                    ${escapeTeamAccountAdminHtml(member.bio || "등록된 소개 없음")}
                </div>
            </div>

            <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                <div style="font-size:11px;color:#888;font-weight:800;">연락처 / SNS</div>
                <div style="margin-top:6px;word-break:break-word;">
                    ${escapeTeamAccountAdminHtml(member.contact || "등록된 연락처 없음")}
                </div>
            </div>

            <div style="padding:13px;background:#f8f9fa;border-radius:10px;">
                <div style="font-size:11px;color:#888;font-weight:800;">프로필 이미지</div>

                <div style="display:flex;gap:10px;margin-top:10px;">
                    <div>
                        <img src="${escapeTeamAccountAdminHtml(img)}"
                             style="width:110px;height:110px;object-fit:cover;border-radius:12px;">
                        <div style="font-size:11px;color:#777;margin-top:5px;text-align:center;">
                            기본
                        </div>
                    </div>

                    <div>
                        <img src="${escapeTeamAccountAdminHtml(hover)}"
                             style="width:110px;height:110px;object-fit:cover;border-radius:12px;">
                        <div style="font-size:11px;color:#777;margin-top:5px;text-align:center;">
                            호버
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
            <button onclick="window.closeTeamAccountDetailModal()"
                    style="padding:11px 18px;border:0;border-radius:10px;background:#111;color:#fff;font-weight:800;cursor:pointer;">
                닫기
            </button>
        </div>
    `;

    modal.style.display = "flex";
};

window.closeTeamAccountDetailModal = () => {
    const modal = document.getElementById("team-account-detail-modal");
    if (modal) modal.style.display = "none";
};

// 팝업 바깥 클릭으로 닫기
document.addEventListener("click", (e) => {
    const listModal = document.getElementById("team-account-admin-modal");
    const detailModal = document.getElementById("team-account-detail-modal");

    if (e.target === listModal) {
        window.closeTeamAccountAdminModal();
    }

    if (e.target === detailModal) {
        window.closeTeamAccountDetailModal();
    }
});
