// ==========================================
// ROBOT GALLERY — Firebase와 같은 모듈 흐름에서 직접 실행
// ==========================================
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let robotSlidesData = [];
let currentRobotIndex = 0;
let robotLoadInProgress = false;

// 이미 위쪽 Firebase 모듈에서 initializeApp()을 끝냈으므로
// 기본 Firebase App의 Firestore 인스턴스를 그대로 사용한다.
const robotDb = getFirestore();

function escapeRobotHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderRobotMessage(title, message) {
  const wrapper = document.getElementById('robot-slides-wrapper');
  const dotsContainer = document.getElementById('robot-dots');
  if (!wrapper || !dotsContainer) return;

  wrapper.innerHTML = `
    <div class="sp-slide active">
      <div class="robot-info robot-loading">
        <div class="robot-year">TURTLESS</div>
        <div class="robot-game">ROBOT GALLERY</div>
        <div class="robot-line"></div>
        <div class="robot-description">
          <strong>${escapeRobotHtml(title)}</strong><br>${escapeRobotHtml(message)}
        </div>
      </div>
    </div>
  `;
  dotsContainer.innerHTML = '';
}

async function loadRobotSlides() {
  const wrapper = document.getElementById('robot-slides-wrapper');
  const dotsContainer = document.getElementById('robot-dots');
  if (!wrapper || !dotsContainer || robotLoadInProgress) return;

  robotLoadInProgress = true;

  try {
    renderRobotMessage('ROBOT GALLERY', '로봇 데이터를 불러오는 중...');

    // orderBy를 사용하지 않는다. Firestore 인덱스 문제 없이
    // robots 컬렉션 전체를 가져온 뒤 시즌을 브라우저에서 정렬한다.
    const snapshot = await getDocs(collection(robotDb, 'robots'));

    robotSlidesData = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};

      // 필수값이 없는 문서는 갤러리에서 제외
      const imgUrl = String(data.imgUrl || '').trim();
      const name = String(data.name || '').trim();
      const season = String(data.season || '').trim();

      if (imgUrl && name && season) {
        robotSlidesData.push({
          id: docSnap.id,
          season,
          name,
          imgUrl,
          description: String(data.description || '').trim(),
          createdAt: data.createdAt || 0
        });
      }
    });

    robotSlidesData.sort((a, b) => {
      const ay = parseInt((a.season.match(/^\d{4}/) || ['0'])[0], 10);
      const by = parseInt((b.season.match(/^\d{4}/) || ['0'])[0], 10);
      if (by !== ay) return by - ay;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });

    if (robotSlidesData.length === 0) {
      renderRobotMessage('ROBOT GALLERY', '등록된 로봇이 없습니다.');
      return;
    }

    wrapper.innerHTML = robotSlidesData.map((rb, idx) => {
      const seasonText = rb.season;
      const match = seasonText.match(/^(\d{4})\s*(.*)$/);
      const year = match ? match[1] : seasonText;
      const game = match && match[2] ? match[2].trim() : '';

      const safeImgUrl = rb.imgUrl
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "%27")
        .replace(/\)/g, '%29');

      return `
        <div class="sp-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
          <div class="robot-bg" style="background-image:url('${safeImgUrl}')"></div>

          <div class="robot-info">
            <div class="robot-year">${escapeRobotHtml(year)}</div>
            ${game ? `<div class="robot-game">${escapeRobotHtml(game)}</div>` : ''}
            <div class="robot-name">${escapeRobotHtml(rb.name)}</div>
            <div class="robot-line"></div>
            <div class="robot-description">${escapeRobotHtml(rb.description)}</div>

            ${window.isAdmin ? `
              <button
                type="button"
                class="dash-btn-sm robot-delete"
                onclick="deleteRobot('${escapeRobotHtml(rb.id)}')">
                삭제
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    dotsContainer.innerHTML = robotSlidesData.map((_, idx) => `
      <span
        class="slider-dot ${idx === 0 ? 'active' : ''}"
        onclick="goToRobotSlide(${idx})">
      </span>
    `).join('');

    currentRobotIndex = 0;
    updateRobotSlideUI();

  } catch (error) {
    console.error('[TURTLESS] 로봇 갤러리 Firebase 로드 실패:', error);
    renderRobotMessage('ROBOT GALLERY', '로봇 데이터를 불러오지 못했습니다.');
  } finally {
    robotLoadInProgress = false;
  }
}

function moveRobotSlide(step) {
  if (!robotSlidesData.length) return;
  currentRobotIndex =
    (currentRobotIndex + step + robotSlidesData.length) % robotSlidesData.length;
  updateRobotSlideUI();
}

function goToRobotSlide(index) {
  if (index < 0 || index >= robotSlidesData.length) return;
  currentRobotIndex = index;
  updateRobotSlideUI();
}

function updateRobotSlideUI() {
  const slides = document.querySelectorAll('#robot-slides-wrapper .sp-slide');
  const dots = document.querySelectorAll('#robot-dots .slider-dot');

  slides.forEach((slide, idx) => {
    slide.classList.toggle('active', idx === currentRobotIndex);
  });

  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentRobotIndex);
  });
}

function openRobotModal() {
  const modal = document.getElementById('robot-admin-modal');
  if (modal) modal.style.display = 'flex';
}

function closeRobotModal() {
  const modal = document.getElementById('robot-admin-modal');
  if (modal) modal.style.display = 'none';
}

async function saveRobotToFirebase() {
  const season = document.getElementById('rb-season')?.value.trim();
  const name = document.getElementById('rb-name')?.value.trim();
  const description = document.getElementById('rb-desc')?.value.trim();
  const fileInput = document.getElementById('rb-file');

  if (!season || !name || !description || !fileInput?.files?.[0]) {
    alert('모든 항목을 입력해주세요.');
    return;
  }

  try {
    alert('사진 업로드 중...');

    const formData = new FormData();
    formData.append('upload_preset', 'ml_default');
    formData.append('file', fileInput.files[0]);

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/k8m3zaye/image/upload',
      { method: 'POST', body: formData }
    );

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error(data.error?.message || 'Cloudinary 사진 업로드에 실패했습니다.');
    }

    await addDoc(collection(robotDb, 'robots'), {
      season,
      name,
      imgUrl: data.secure_url,
      description,
      createdAt: Date.now()
    });

    alert('성공적으로 등록되었습니다!');
    closeRobotModal();

    document.getElementById('rb-season').value = '';
    document.getElementById('rb-name').value = '';
    document.getElementById('rb-desc').value = '';
    document.getElementById('rb-file').value = '';

    await loadRobotSlides();
  } catch (error) {
    console.error('[TURTLESS] 로봇 등록 오류:', error);
    alert('등록 중 오류 발생: ' + error.message);
  }
}

async function deleteRobot(docId) {
  if (!confirm('이 로봇 데이터를 삭제하시겠습니까?')) return;

  try {
    await deleteDoc(doc(robotDb, 'robots', docId));
    alert('삭제되었습니다.');
    await loadRobotSlides();
  } catch (error) {
    console.error('[TURTLESS] 로봇 삭제 오류:', error);
    alert('삭제 실패: ' + error.message);
  }
}

// HTML onclick에서 사용할 전역 함수
window.moveRobotSlide = moveRobotSlide;
window.goToRobotSlide = goToRobotSlide;
window.loadRobotSlides = loadRobotSlides;
window.openRobotModal = openRobotModal;
window.closeRobotModal = closeRobotModal;
window.saveRobotToFirebase = saveRobotToFirebase;
window.deleteRobot = deleteRobot;

// 직접 /intro_robot로 들어온 경우 포함
window.addEventListener('DOMContentLoaded', () => {
  loadRobotSlides();
});
