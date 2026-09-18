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
   높이 자동 조절
   ========================================== */

function fitRobotSliderHeight() {

  const slider =
    document.getElementById('robot-slider');

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  if (!slider || !wrapper) return;

  const active =
    wrapper.querySelector('.sp-slide.active');

  if (!active) return;

  const height =
    active.scrollHeight;

  if (height > 0) {
    wrapper.style.minHeight =
      height + 'px';
  }
}


/* ==========================================
   로봇 데이터 로드
   ========================================== */

async function loadRobotSlides() {

  if (robotLoadInProgress) return;

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  const dots =
    document.getElementById('robot-dots');

  if (!wrapper || !dots) return;

  robotLoadInProgress = true;

  try {

    const snapshot =
      await getDocs(
        collection(robotDb, 'robots')
      );

    robotSlidesData = [];

    snapshot.forEach(docSnap => {

      robotSlidesData.push({
        id: docSnap.id,
        ...docSnap.data()
      });

    });


    robotSlidesData.sort(
      (a, b) =>
        (b.createdAt || 0) -
        (a.createdAt || 0)
    );


    currentRobotIndex = 0;


    if (!robotSlidesData.length) {

      renderRobotMessage(
        '등록된 로봇이 없습니다.',
        '관리자 패널에서 새로운 로봇을 등록해주세요.'
      );

      return;
    }


    renderRobotSlides();

  } catch (error) {

    console.error(
      '[TURTLESS] 로봇 데이터 로드 오류:',
      error
    );

    renderRobotMessage(
      '로봇 데이터를 불러오지 못했습니다.',
      error.message
    );

  } finally {

    robotLoadInProgress = false;

  }
}


/* ==========================================
   로봇 슬라이드 렌더링
   ========================================== */

function renderRobotSlides() {

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  const dots =
    document.getElementById('robot-dots');

  if (!wrapper || !dots) return;


  let slidesHtml = '';
  let dotsHtml = '';


  robotSlidesData.forEach(
    (robot, index) => {

      const season =
        escapeRobotHtml(
          robot.season || ''
        );

      const name =
        escapeRobotHtml(
          robot.name || '이름 없음'
        );

      const description =
        escapeRobotHtml(
          robot.description || ''
        ).replace(/\n/g, '<br>');

      const image =
        robot.imgUrl ||
        robot.file ||
        '';


      slidesHtml += `
        <div
          class="sp-slide ${index === currentRobotIndex ? 'active' : ''}"
          data-index="${index}"
        >

          <div class="sp-left">

            ${
              image
                ? `
                  <img
                    src="${image}"
                    alt="${name}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                  >
                `
                : `
                  <div class="robot-no-image">
                    ROBOT
                  </div>
                `
            }

          </div>


          <div class="sp-right">

            <div class="robot-info">

              <div class="robot-year">
                ${season}
              </div>

              <div class="robot-game">
                ${name}
              </div>

              <div class="robot-line"></div>

              <div class="robot-description">
                ${description}
              </div>

            </div>

          </div>

        </div>
      `;


      dotsHtml += `
        <button
          type="button"
          class="slider-dot ${index === currentRobotIndex ? 'active' : ''}"
          onclick="goToRobotSlide(${index})"
          aria-label="${name} 보기"
        ></button>
      `;

    }
  );


  wrapper.innerHTML =
    slidesHtml;

  dots.innerHTML =
    dotsHtml;


  updateRobotSlideUI();

  setTimeout(
    fitRobotSliderHeight,
    50
  );
}


/* ==========================================
   슬라이드 UI 업데이트
   ========================================== */

function updateRobotSlideUI() {

  const wrapper =
    document.getElementById('robot-slides-wrapper');

  const dots =
    document.getElementById('robot-dots');

  if (!wrapper || !dots) return;

  const slides =
    wrapper.querySelectorAll('.sp-slide');

  const dotList =
    dots.querySelectorAll('.slider-dot');


  slides.forEach(
    (slide, index) => {

      slide.classList.toggle(
        'active',
        index === currentRobotIndex
      );

    }
  );


  dotList.forEach(
    (dot, index) => {

      dot.classList.toggle(
        'active',
        index === currentRobotIndex
      );

    }
  );


  setTimeout(
    fitRobotSliderHeight,
    50
  );
}


/* ==========================================
   이전 / 다음 슬라이드
   ========================================== */

function moveRobotSlide(direction) {

  if (!robotSlidesData.length) return;


  currentRobotIndex += direction;


  if (
    currentRobotIndex <
    0
  ) {

    currentRobotIndex =
      robotSlidesData.length - 1;

  }


  if (
    currentRobotIndex >=
    robotSlidesData.length
  ) {

    currentRobotIndex = 0;

  }


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

/*
 * 기존 코드의 문제:
 *
 * HTML에는
 * id="robot-admin-modal"
 *
 * 로 되어 있는데 JS에서는
 * id="robot-modal"
 *
 * 을 찾고 있었음.
 *
 * 따라서 버튼을 눌러도 실제 모달을 찾지 못했음.
 */

function openRobotModal() {

  const modal =
    document.getElementById(
      'robot-admin-modal'
    );

  if (!modal) {
    console.error(
      '[TURTLESS] robot-admin-modal을 찾을 수 없습니다.'
    );
    return;
  }

  modal.style.display = 'flex';
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


/* ==========================================
   로봇 등록
   ========================================== */

async function saveRobotToFirebase() {

  const season =
    document.getElementById(
      'rb-season'
    )?.value.trim();

  const name =
    document.getElementById(
      'rb-name'
    )?.value.trim();

  const description =
    document.getElementById(
      'rb-desc'
    )?.value.trim();

  const fileInput =
    document.getElementById(
      'rb-file'
    );


  if (
    !season ||
    !name ||
    !description ||
    !fileInput?.files?.[0]
  ) {

    alert(
      '모든 항목을 입력해주세요.'
    );

    return;
  }


  try {

    alert(
      '사진 업로드 중...'
    );


    /* ======================================
       Cloudinary 업로드
       ====================================== */

    const formData =
      new FormData();


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


    /* ======================================
       Firebase 저장
       ====================================== */

    await addDoc(
      collection(
        robotDb,
        'robots'
      ),
      {
        season,
        name,
        imgUrl:
          data.secure_url,
        description,
        createdAt:
          Date.now()
      }
    );


    alert(
      '성공적으로 등록되었습니다!'
    );


    /* ======================================
       모달 닫기
       ====================================== */

    closeRobotModal();


    /* ======================================
       입력창 초기화
       ====================================== */

    const seasonInput =
      document.getElementById(
        'rb-season'
      );

    const nameInput =
      document.getElementById(
        'rb-name'
      );

    const descInput =
      document.getElementById(
        'rb-desc'
      );


    if (seasonInput)
      seasonInput.value = '';


    if (nameInput)
      nameInput.value = '';


    if (descInput)
      descInput.value = '';


    fileInput.value = '';


    /* ======================================
       로봇 목록 새로고침
       ====================================== */

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
      doc(
        robotDb,
        'robots',
        docId
      )
    );


    alert(
      '삭제되었습니다.'
    );


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
   기존 공통 navigate와 연결
   ========================================== */

const originalNavigateForRobot =
  window.navigate;


if (
  typeof originalNavigateForRobot ===
  'function'
) {

  window.navigate =
    function (
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
