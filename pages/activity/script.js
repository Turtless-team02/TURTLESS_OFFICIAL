/* =========================================================
   TURTLESS - 주요 활동 페이지 전용 JS
   공통 JS / Firebase JS 수정 없음
   ========================================================= */

(function () {

  'use strict';

  let observer = null;
  let arrangeTimer = null;
  let modal = null;


  /* -------------------------------------------------------
     상세 모달 생성
     ------------------------------------------------------- */

  function createModal() {

    if (document.querySelector('.activity-detail-modal')) {
      modal = document.querySelector('.activity-detail-modal');
      return;
    }

    modal = document.createElement('div');

    modal.className = 'activity-detail-modal';

    modal.innerHTML = `
      <div class="activity-detail-window">

        <button
          type="button"
          class="activity-detail-close"
          aria-label="닫기"
        >×</button>

        <div class="activity-detail-content"></div>

      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {

      if (
        e.target === modal ||
        e.target.closest('.activity-detail-close')
      ) {
        closeModal();
      }

    });

    document.addEventListener('keydown', function (e) {

      if (
        e.key === 'Escape' &&
        modal &&
        modal.classList.contains('is-open')
      ) {
        closeModal();
      }

    });
  }


  /* -------------------------------------------------------
     모달 열기
     ------------------------------------------------------- */

  function openModal(item) {

    createModal();

    const titleEl = item.querySelector('h3');
    const textEl = item.querySelector(':scope > p');
    const imgEl = item.querySelector(
      '.resizable-img-box img'
    );

    let title = titleEl
      ? titleEl.cloneNode(true)
      : null;

    let date = '';

    if (title) {

      const dateEl = title.querySelector('.date');

      if (dateEl) {
        date = dateEl.textContent.trim();
        dateEl.remove();
      }

      /* 최신 뱃지는 상세 제목에서 제거 */
      title.querySelectorAll('span').forEach(function (span) {
        span.remove();
      });

      title = title.textContent.trim();

    } else {
      title = '주요 활동';
    }


    const text = textEl
      ? textEl.textContent.trim()
      : '';


    const content = modal.querySelector(
      '.activity-detail-content'
    );


    content.innerHTML = '';


    if (imgEl && imgEl.src) {

      const img = document.createElement('img');

      img.className = 'activity-detail-image';

      img.src = imgEl.src;

      img.alt = title;

      img.loading = 'lazy';

      content.appendChild(img);

    }


    const body = document.createElement('div');

    body.className = 'activity-detail-body';


    if (date) {

      const dateDiv = document.createElement('div');

      dateDiv.className = 'activity-detail-date';

      dateDiv.textContent = date;

      body.appendChild(dateDiv);

    }


    const titleDiv = document.createElement('h3');

    titleDiv.className = 'activity-detail-title';

    titleDiv.textContent = title;

    body.appendChild(titleDiv);


    if (text) {

      const textDiv = document.createElement('p');

      textDiv.className = 'activity-detail-text';

      textDiv.textContent = text;

      body.appendChild(textDiv);

    }


    content.appendChild(body);


    modal.classList.add('is-open');

    document.body.style.overflow = 'hidden';

  }


  /* -------------------------------------------------------
     모달 닫기
     ------------------------------------------------------- */

  function closeModal() {

    if (!modal) return;

    modal.classList.remove('is-open');

    document.body.style.overflow = '';

  }


  /* -------------------------------------------------------
     활동 아이템을 콜라주에 넣기
     ------------------------------------------------------- */

  function arrangeActivities() {

    const container = document.getElementById(
      'activity-page-content'
    );

    if (!container) return;


    const items = Array.from(
      container.children
    ).filter(function (el) {

      return el.classList &&
             el.classList.contains('act-list-item');

    });


    /*
      Firebase가 아직 데이터를 넣기 전이면
      아무것도 하지 않는다.
    */

    if (!items.length) return;


    let collage = container.querySelector(
      ':scope > .activity-collage'
    );


    /*
      Firebase loadActivities()가 다시 실행되면
      기존 collage가 innerHTML로 지워진다.

      따라서 매번 새로 만들어도 안전하게 처리한다.
    */

    if (!collage) {

      collage = document.createElement('div');

      collage.className = 'activity-collage';

      container.appendChild(collage);

    }


    /*
      act-list-item을 그대로 이동한다.
      Firebase 데이터나 id는 건드리지 않는다.
    */

    items.forEach(function (item) {

      if (item.parentElement !== collage) {
        collage.appendChild(item);
      }

    });


    /*
      사진이 있는 활동만 클릭 가능.
      모든 활동은 상세 내용 확인 가능.
    */

    collage.querySelectorAll(
      '.act-list-item'
    ).forEach(function (item) {

      if (item.dataset.activityReady === '1') {
        return;
      }

      item.dataset.activityReady = '1';


      item.addEventListener('click', function (e) {

        /*
          관리자 삭제 버튼을 누른 경우
          상세 모달을 열지 않는다.
        */

        if (
          e.target.closest('.delete-btn')
        ) {
          return;
        }

        openModal(item);

      });

    });

  }


  /* -------------------------------------------------------
     DOM 변화 감시
     Firebase loadActivities()가 데이터를 넣는 시점이
     정확히 언제인지 신경 쓰지 않아도 되도록 처리
     ------------------------------------------------------- */

  function scheduleArrange() {

    clearTimeout(arrangeTimer);

    arrangeTimer = setTimeout(
      arrangeActivities,
      50
    );

  }


  function startObserver() {

    if (observer) return;

    const target = document.getElementById(
      'activity-page-content'
    );

    if (!target) {

      /*
        혹시 DOM 생성이 늦는 경우 재시도
      */

      setTimeout(
        startObserver,
        200
      );

      return;

    }


    observer = new MutationObserver(
      function () {
        scheduleArrange();
      }
    );


    observer.observe(
      target,
      {
        childList: true,
        subtree: true
      }
    );


    /*
      이미 Firebase가 먼저 데이터를 불러온 경우
      바로 처리
    */

    scheduleArrange();

  }


  /* -------------------------------------------------------
     초기화
     ------------------------------------------------------- */

  function init() {

    /*
      별도 페이지이므로 혹시 common.css에서 숨겨졌다면
      페이지 전용 CSS가 표시하도록 보장.
    */

    const page = document.getElementById(
      'page-activity'
    );

    if (page) {
      page.style.display = 'block';
    }


    createModal();

    startObserver();

    /*
      Firebase보다 먼저 실행되어도,
      MutationObserver가 나중에 생성되는 활동을 잡는다.
    */

    setTimeout(
      arrangeActivities,
      100
    );

    setTimeout(
      arrangeActivities,
      500
    );

    setTimeout(
      arrangeActivities,
      1200
    );

  }


  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {

    init();

  }


  /*
    전역에서 닫을 수 있도록 제공
  */

  window.closeActivityDetail = closeModal;


})();
