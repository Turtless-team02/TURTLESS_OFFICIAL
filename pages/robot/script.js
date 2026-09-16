import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ==========================================
   기본 설정
   ========================================== */

const robotDb = getFirestore();

let robotSlidesData = [];
let currentRobotIndex = 0;
let robotLoadInProgress = false;


/* ==========================================
   HTML 보안 처리
   ========================================== */

function escapeRobotHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* ==========================================
   메시지 표시
   ========================================== */

function renderRobotMessage(title, message) {

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  const dots =
    document.getElementById('robot-dots');

  if (!wrapper || !dots) return;

  wrapper.innerHTML = `
    <div class="sp-slide active">

      <div class="robot-info robot-loading">

        <div class="robot-year">
          TURTLESS
        </div>

        <div class="robot-game">
          ROBOT GALLERY
        </div>

        <div class="robot-line"></div>

        <div class="robot-description">
          <strong>${escapeRobotHtml(title)}</strong><br>
          ${escapeRobotHtml(message)}
        </div>

      </div>

    </div>
  `;

  dots.innerHTML = '';

  setTimeout(fitRobotSliderHeight, 50);
}


/* ==========================================
   로봇 높이 자동 계산
   ========================================== */

function fitRobotSliderHeight() {

  const slider =
    document.getElementById('robot-slider');

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  const slides =
    [...document.querySelectorAll(
      '#robot-slides-wrapper .sp-slide'
    )];

  if (!slider || !wrapper || !slides.length) return;

  let maxHeight = 0;

  /*
   * 각 슬라이드를 잠깐 일반 흐름으로 바꿔서
   * 실제 내용 높이를 측정한다.
   */

  slides.forEach(slide => {

    const info =
      slide.querySelector('.robot-info');

    if (!info) return;

    const oldPosition = slide.style.position;
    const oldHeight = slide.style.height;
    const oldVisibility = slide.style.visibility;
    const oldOpacity = slide.style.opacity;

    slide.style.position = 'relative';
    slide.style.height = 'auto';
    slide.style.visibility = 'hidden';
    slide.style.opacity = '1';

    info.style.height = 'auto';

    maxHeight = Math.max(
      maxHeight,
      info.scrollHeight + 110
    );

    slide.style.position = oldPosition;
    slide.style.height = oldHeight;
    slide.style.visibility = oldVisibility;
    slide.style.opacity = oldOpacity;

    info.style.height = '';
  });

  if (maxHeight < 520) {
    maxHeight = 520;
  }

  if (window.innerWidth <= 768 && maxHeight < 560) {
    maxHeight = 560;
  }

  if (window.innerWidth <= 480 && maxHeight < 600) {
    maxHeight = 600;
  }

  slider.style.height = `${maxHeight}px`;
  wrapper.style.height = `${maxHeight}px`;

  slides.forEach(slide => {
    slide.style.height = `${maxHeight}px`;
  });
}


/* ==========================================
   로봇 데이터 불러오기
   ========================================== */

async function loadRobotSlides() {

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  const dotsContainer =
    document.getElementById('robot-dots');

  if (
    !wrapper ||
    !dotsContainer ||
    robotLoadInProgress
  ) {
    return;
  }

  robotLoadInProgress = true;

  try {

    renderRobotMessage(
      'ROBOT GALLERY',
      '로봇 데이터를 불러오는 중...'
    );

    const snapshot =
      await getDocs(
        collection(robotDb, 'robots')
      );

    robotSlidesData = [];

    snapshot.forEach(docSnap => {

      const data = docSnap.data() || {};

      const imgUrl =
        String(data.imgUrl || '').trim();

      const name =
        String(data.name || '').trim();

      const season =
        String(data.season || '').trim();

      if (!imgUrl || !name || !season) {
        return;
      }

      robotSlidesData.push({
        id: docSnap.id,
        season,
        name,
        imgUrl,
        description:
          String(data.description || '').trim(),
        createdAt:
          data.createdAt || 0
      });
    });


    /* 시즌 기준 정렬 */

    robotSlidesData.sort((a, b) => {

      const yearA =
        parseInt(a.season.match(/\d{4}/)?.[0] || '0');

      const yearB =
        parseInt(b.season.match(/\d{4}/)?.[0] || '0');

      return yearB - yearA;
    });


    /* 등록된 로봇이 없을 때 */

    if (robotSlidesData.length === 0) {

      renderRobotMessage(
        'ROBOT GALLERY',
        '등록된 로봇이 없습니다.'
      );

      return;
    }


    /* ==========================================
       슬라이드 생성
       ========================================== */

    wrapper.innerHTML =
      robotSlidesData.map((robot, index) => {

        const seasonText = robot.season;

        const match =
          seasonText.match(/^(\d{4})\s*(.*)$/);

        const year =
          match ? match[1] : seasonText;

        const game =
          match && match[2]
            ? match[2].trim()
            : '';

        const safeImgUrl =
          robot.imgUrl
            .replace(/\\/g, '\\\\')
            .replace(/'/g, '%27')
            .replace(/\)/g, '%29');

        return `
          <div
            class="sp-slide ${index === 0 ? 'active' : ''}"
            data-index="${index}"
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
                ${escapeRobotHtml(robot.name)}
              </div>

              <div class="robot-line"></div>

              <div class="robot-description">
                ${escapeRobotHtml(robot.description)}
              </div>

              ${
                window.isAdmin
                  ? `
                    <button
                      type="button"
                      class="dash-btn-sm robot-delete"
                      onclick="deleteRobot('${escapeRobotHtml(robot.id)}')"
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


    /* ==========================================
       점 생성
       ========================================== */

    dotsContainer.innerHTML =
      robotSlidesData.map((_, index) => `
        <span
          class="slider-dot ${index === 0 ? 'active' : ''}"
          onclick="goToRobotSlide(${index})"
        ></span>
      `).join('');


    currentRobotIndex = 0;

    updateRobotSlideUI();


    /*
     * 이미지가 로딩된 뒤 실제 높이를 다시 계산
     */

    const images = [];

    robotSlidesData.forEach(robot => {

      const img = new Image();

      img.onload = () => {
        fitRobotSliderHeight();
      };

      img.src = robot.imgUrl;

      images.push(img);
    });


    setTimeout(fitRobotSliderHeight, 50);
    setTimeout(fitRobotSliderHeight, 300);
    setTimeout(fitRobotSliderHeight, 800);

  } catch (error) {

    console.error(
      '[TURTLESS] 로봇 불러오기 오류:',
      error
    );

    renderRobotMessage(
      'ERROR',
      '로봇 데이터를 불러오지 못했습니다.'
    );

  } finally {

    robotLoadInProgress = false;

  }
}


/* ==========================================
   슬라이드 UI
   ========================================== */

function updateRobotSlideUI() {

  const slides =
    document.querySelectorAll(
      '#robot-slides-wrapper .sp-slide'
    );

  const dots =
    document.querySelectorAll(
      '#robot-dots .slider-dot'
    );

  slides.forEach((slide, index) => {

    slide.classList.toggle(
      'active',
      index === currentRobotIndex
    );

  });

  dots.forEach((dot, index) => {

    dot.classList.toggle(
      'active',
      index === currentRobotIndex
    );

  });
}


/* ==========================================
   이전 / 다음
   ========================================== */

function moveRobotSlide(step) {

  if (!robotSlidesData.length) return;

  currentRobotIndex =
    (
      currentRobotIndex +
      step +
      robotSlidesData.length
    ) %
    robotSlidesData.length;

  updateRobotSlideUI();
}


/* ==========================================
   특정 슬라이드
   ========================================== */

function goToRobotSlide(index) {

  if (!robotSlidesData.length) return;

  if (
    index < 0 ||
    index >= robotSlidesData.length
  ) {
    return;
  }

  currentRobotIndex = index;

  updateRobotSlideUI();
}


/* ==========================================
   관리자 모달
   ========================================== */

function openRobotModal() {

  const modal =
    document.getElementById('robot-modal');

  if (modal) {
    modal.style.display = 'flex';
  }
}


function closeRobotModal() {

  const modal =
    document.getElementById('robot-modal');

  if (modal) {
    modal.style.display = 'none';
  }
}


/* ==========================================
   로봇 등록
   ========================================== */

async function saveRobotToFirebase() {

  const season =
    document.getElementById('rb-season')?.value.trim();

  const name =
    document.getElementById('rb-name')?.value.trim();

  const description =
    document.getElementById('rb-desc')?.value.trim();

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


    /* Cloudinary 업로드 */

    const formData = new FormData();

    formData.append(
      'upload_preset',
      'ml_default'
    );

    formData.append(
      'file',
      fileInput.files[0]
    );


    const response =
      await fetch(
        'https://api.cloudinary.com/v1_1/k8m3zaye/image/upload',
        {
          method: 'POST',
          body: formData
        }
      );


    const data =
      await response.json();


    if (!data.secure_url) {

      throw new Error(
        data.error?.message ||
        'Cloudinary 사진 업로드에 실패했습니다.'
      );
    }


    /* Firebase 저장 */

    await addDoc(
      collection(robotDb, 'robots'),
      {
        season,
        name,
        imgUrl: data.secure_url,
        description,
        createdAt: Date.now()
      }
    );


    alert('성공적으로 등록되었습니다!');


    closeRobotModal();


    /* 입력창 초기화 */

    document.getElementById(
      'rb-season'
    ).value = '';

    document.getElementById(
      'rb-name'
    ).value = '';

    document.getElementById(
      'rb-desc'
    ).value = '';

    document.getElementById(
      'rb-file'
    ).value = '';


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


/* ==========================================
   로봇 삭제
   ========================================== */

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
      doc(robotDb, 'robots', docId)
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


/* ==========================================
   전역 함수
   ========================================== */

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


/* ==========================================
   페이지 이동
   ========================================== */

const originalNavigateForRobot =
  window.navigate;

if (
  typeof originalNavigateForRobot ===
  'function'
) {

  window.navigate = function (
    pageId,
    pushHistory = true
  ) {

    originalNavigateForRobot(
      pageId,
      pushHistory
    );


    if (
      pageId === 'intro_robot' ||
      pageId === 'page-intro_robot'
    ) {

      setTimeout(
        () => loadRobotSlides(),
        100
      );

      const adminTools =
        document.getElementById(
          'robot-admin-tools'
        );

      if (
        adminTools &&
        window.isAdmin
      ) {

        adminTools.style.display =
          'block';
      }
    }
  };
}


/* ==========================================
   초기 실행
   ========================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    loadRobotSlides();

  }
);


/* ==========================================
   화면 크기 변경
   ========================================== */

window.addEventListener(
  'resize',
  () => {

    fitRobotSliderHeight();

  }
);
