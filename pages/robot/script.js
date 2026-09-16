// ==========================================
// ROBOT GALLERY — Firebase
// ==========================================

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// Firebase 설정
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAyHSEWtN-y6o9Myt-cDe9193QWv11rbTU",
  authDomain: "turtless-web.firebaseapp.com",
  projectId: "turtless-web",
  storageBucket: "turtless-web.firebasestorage.app",
  messagingSenderId: "794305996729",
  appId: "1:794305996729:web:cf7132e77cc5621c5bb868"
};


// 이미 Firebase가 초기화되어 있으면 기존 앱 사용
// 아니면 이 페이지에서 직접 초기화
const robotApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const robotDb = getFirestore(robotApp);


// ==========================================
// 로봇 데이터
// ==========================================

let robotSlidesData = [];
let currentRobotIndex = 0;
let robotLoadInProgress = false;


// ==========================================
// HTML 이스케이프
// ==========================================

function escapeRobotHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ==========================================
// 로딩 / 오류 메시지
// ==========================================

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
          <strong>${escapeRobotHtml(title)}</strong><br>
          ${escapeRobotHtml(message)}
        </div>
      </div>
    </div>
  `;

  dotsContainer.innerHTML = '';
}


// ==========================================
// Firebase에서 로봇 불러오기
// ==========================================

async function loadRobotSlides() {

  const wrapper = document.getElementById('robot-slides-wrapper');
  const dotsContainer = document.getElementById('robot-dots');

  if (!wrapper || !dotsContainer || robotLoadInProgress) {
    return;
  }

  robotLoadInProgress = true;

  try {

    renderRobotMessage(
      'ROBOT GALLERY',
      '로봇 데이터를 불러오는 중...'
    );


    // robots 컬렉션 전체 불러오기
    const snapshot = await getDocs(
      collection(robotDb, 'robots')
    );


    robotSlidesData = [];


    snapshot.forEach((docSnap) => {

      const data = docSnap.data() || {};

      const imgUrl = String(data.imgUrl || '').trim();
      const name = String(data.name || '').trim();
      const season = String(data.season || '').trim();


      // 필수 데이터가 없는 문서는 제외
      if (!imgUrl || !name || !season) {
        return;
      }


      robotSlidesData.push({
        id: docSnap.id,
        season: season,
        name: name,
        imgUrl: imgUrl,
        description: String(data.description || '').trim(),
        createdAt: data.createdAt || 0
      });

    });


    // ==========================================
    // 시즌 / 등록일 기준 정렬
    // ==========================================

    robotSlidesData.sort((a, b) => {

      const ay = parseInt(
        (a.season.match(/^\d{4}/) || ['0'])[0],
        10
      );

      const by = parseInt(
        (b.season.match(/^\d{4}/) || ['0'])[0],
        10
      );


      if (by !== ay) {
        return by - ay;
      }


      return Number(b.createdAt || 0)
        - Number(a.createdAt || 0);

    });


    // ==========================================
    // 로봇 데이터가 없는 경우
    // ==========================================

    if (robotSlidesData.length === 0) {

      renderRobotMessage(
        'ROBOT GALLERY',
        '등록된 로봇이 없습니다.'
      );

      return;
    }


    // ==========================================
    // 슬라이드 생성
    // ==========================================

    wrapper.innerHTML = robotSlidesData.map((rb, idx) => {

      const seasonText = rb.season;


      const match = seasonText.match(
        /^(\d{4})\s*(.*)$/
      );


      const year = match
        ? match[1]
        : seasonText;


      const game = match && match[2]
        ? match[2].trim()
        : '';


      // CSS background-image에서 사용할 URL 정리
      const safeImgUrl = rb.imgUrl
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "%27")
        .replace(/\)/g, '%29');


      return `
        <div
          class="sp-slide ${idx === 0 ? 'active' : ''}"
          data-index="${idx}"
        >

          <div
            class="robot-bg"
            style="background-image:url('${safeImgUrl}')"
          ></div>


          <div class="robot-info">

            <div class="robot-year">
              ${escapeRobotHtml(year)}
            </div>


            ${
              game
                ? `
                  <div class="robot-game">
                    ${escapeRobotHtml(game)}
                  </div>
                `
                : ''
            }


            <div class="robot-name">
              ${escapeRobotHtml(rb.name)}
            </div>


            <div class="robot-line"></div>


            <div class="robot-description">
              ${escapeRobotHtml(rb.description)}
            </div>


            ${
              window.isAdmin
                ? `
                  <button
                    type="button"
                    class="dash-btn-sm robot-delete"
                    onclick="deleteRobot('${escapeRobotHtml(rb.id)}')"
                  >
                    삭제
                  </button>
                `
                : ''
            }

          </div>

        </div>
      `;

    }).join('');


    // ==========================================
    // 슬라이더 도트
    // ==========================================

    dotsContainer.innerHTML =
      robotSlidesData.map((_, idx) => {

        return `
          <span
            class="slider-dot ${idx === 0 ? 'active' : ''}"
            onclick="goToRobotSlide(${idx})"
          ></span>
        `;

      }).join('');


    currentRobotIndex = 0;

    updateRobotSlideUI();


  } catch (error) {

    console.error(
      '[TURTLESS] 로봇 갤러리 Firebase 로드 실패:',
      error
    );


    renderRobotMessage(
      'ROBOT GALLERY',
      '로봇 데이터를 불러오지 못했습니다.'
    );


  } finally {

    robotLoadInProgress = false;

  }

}


// ==========================================
// 이전 / 다음 슬라이드
// ==========================================

function moveRobotSlide(step) {

  if (!robotSlidesData.length) {
    return;
  }


  currentRobotIndex =
    (
      currentRobotIndex
      + step
      + robotSlidesData.length
    )
    % robotSlidesData.length;


  updateRobotSlideUI();

}


// ==========================================
// 특정 슬라이드 이동
// ==========================================

function goToRobotSlide(index) {

  if (
    index < 0 ||
    index >= robotSlidesData.length
  ) {
    return;
  }


  currentRobotIndex = index;

  updateRobotSlideUI();

}


// ==========================================
// 슬라이드 UI 업데이트
// ==========================================

function updateRobotSlideUI() {

  const slides =
    document.querySelectorAll(
      '#robot-slides-wrapper .sp-slide'
    );


  const dots =
    document.querySelectorAll(
      '#robot-dots .slider-dot'
    );


  slides.forEach((slide, idx) => {

    slide.classList.toggle(
      'active',
      idx === currentRobotIndex
    );

  });


  dots.forEach((dot, idx) => {

    dot.classList.toggle(
      'active',
      idx === currentRobotIndex
    );

  });

}


// ==========================================
// 로봇 관리자 모달
// ==========================================

function openRobotModal() {

  const modal =
    document.getElementById(
      'robot-admin-modal'
    );


  if (modal) {
    modal.style.display = 'flex';
  }

}


function closeRobotModal() {

  const modal =
    document.getElementById(
      'robot-admin-modal'
    );


  if (modal) {
    modal.style.display = 'none';
  }

}


// ==========================================
// 로봇 등록
// ==========================================

async function saveRobotToFirebase() {

  const season =
    document
      .getElementById('rb-season')
      ?.value
      .trim();


  const name =
    document
      .getElementById('rb-name')
      ?.value
      .trim();


  const description =
    document
      .getElementById('rb-desc')
      ?.value
      .trim();


  const fileInput =
    document.getElementById('rb-file');


  if (
    !season ||
    !name ||
    !description ||
    !fileInput?.files?.[0]
  ) {

    alert('모든 항목을 입력해주세요.');

    return;
  }


  try {

    alert('사진 업로드 중...');


    // ==========================================
    // Cloudinary 업로드
    // ==========================================

    const formData = new FormData();

    formData.append(
      'upload_preset',
      'ml_default'
    );

    formData.append(
      'file',
      fileInput.files[0]
    );


    const response = await fetch(
      'https://api.cloudinary.com/v1_1/k8m3zaye/image/upload',
      {
        method: 'POST',
        body: formData
      }
    );


    const data = await response.json();


    if (!data.secure_url) {

      throw new Error(
        data.error?.message ||
        'Cloudinary 사진 업로드에 실패했습니다.'
      );

    }


    // ==========================================
    // Firestore 저장
    // ==========================================

    await addDoc(
      collection(robotDb, 'robots'),
      {
        season: season,
        name: name,
        imgUrl: data.secure_url,
        description: description,
        createdAt: Date.now()
      }
    );


    alert('성공적으로 등록되었습니다!');


    closeRobotModal();


    // 입력창 초기화
    const seasonInput =
      document.getElementById('rb-season');

    const nameInput =
      document.getElementById('rb-name');

    const descInput =
      document.getElementById('rb-desc');

    const fileInputElement =
      document.getElementById('rb-file');


    if (seasonInput) {
      seasonInput.value = '';
    }

    if (nameInput) {
      nameInput.value = '';
    }

    if (descInput) {
      descInput.value = '';
    }

    if (fileInputElement) {
      fileInputElement.value = '';
    }


    // 목록 새로고침
    await loadRobotSlides();


  } catch (error) {

    console.error(
      '[TURTLESS] 로봇 등록 오류:',
      error
    );


    alert(
      '등록 중 오류 발생: ' +
      error.message
    );

  }

}


// ==========================================
// 로봇 삭제
// ==========================================

async function deleteRobot(docId) {

  if (
    !confirm(
      '이 로봇 데이터를 삭제하시겠습니까?'
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        robotDb,
        'robots',
        docId
      )
    );


    alert('삭제되었습니다.');


    await loadRobotSlides();


  } catch (error) {

    console.error(
      '[TURTLESS] 로봇 삭제 오류:',
      error
    );


    alert(
      '삭제 실패: ' +
      error.message
    );

  }

}


// ==========================================
// HTML onclick에서 사용할 전역 함수
// ==========================================

window.moveRobotSlide =
  moveRobotSlide;

window.goToRobotSlide =
  goToRobotSlide;

window.loadRobotSlides =
  loadRobotSlides;

window.openRobotModal =
  openRobotModal;

window.closeRobotModal =
  closeRobotModal;

window.saveRobotToFirebase =
  saveRobotToFirebase;

window.deleteRobot =
  deleteRobot;


// ==========================================
// 페이지 로드
// ==========================================

window.addEventListener(
  'DOMContentLoaded',
  () => {
    loadRobotSlides();
  }
);
