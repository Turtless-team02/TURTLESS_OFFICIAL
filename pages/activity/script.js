/* =========================================================
   TURTLESS - 주요 활동 전용 JS
   공통 firebase.js / common.js 수정 없이 동작
   ========================================================= */

(() => {
  "use strict";

  const CONTENT_SELECTOR = "#activity-page-content";

  let observer = null;
  let enhancing = false;


  /* ---------------------------------------------------------
     HTML 안전 처리
     --------------------------------------------------------- */

  function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    const div = document.createElement("div");
    div.textContent = String(value);

    return div.innerHTML;
  }


  /* ---------------------------------------------------------
     날짜 처리
     --------------------------------------------------------- */

  function getActivityDate(item) {
    const dateElement =
      item.querySelector(".activity-date") ||
      item.querySelector(".act-date") ||
      item.querySelector("time");

    if (dateElement) {
      return dateElement.textContent.trim();
    }

    return "";
  }


  /* ---------------------------------------------------------
     기존 활동 하나를 전용 타일로 변환
     --------------------------------------------------------- */

  function enhanceActivity(item, index) {

    if (!item || item.dataset.activityEnhanced === "true") {
      return;
    }

    item.dataset.activityEnhanced = "true";

    /*
     * 공통 Firebase renderer에서 생성된 요소에서
     * 필요한 데이터를 먼저 가져온다.
     */

    const titleElement =
      item.querySelector("h3") ||
      item.querySelector("h4") ||
      item.querySelector(".act-title");

    const contentElement =
      item.querySelector(".act-content") ||
      item.querySelector(".activity-content") ||
      item.querySelector("p");

    const imageElement = item.querySelector("img");

    const deleteButton = item.querySelector(".delete-btn");

    const title =
      titleElement?.textContent?.trim() ||
      "주요 활동";

    const content =
      contentElement?.textContent?.trim() ||
      "";

    const date = getActivityDate(item);

    const imageURL =
      imageElement?.getAttribute("src") ||
      imageElement?.dataset?.src ||
      "";


    /*
     * 기존 DOM에서 관리자 삭제 버튼은 잠시 분리한다.
     */

    if (deleteButton) {
      deleteButton.remove();
    }


    /*
     * 기존 내용은 새로운 타일로 교체한다.
     * 단, 가장 중요한 ID는 유지한다.
     */

    const originalId = item.id;

    item.className = "activity-tile";

    if (originalId) {
      item.id = originalId;
    }


    /*
     * 최신 활동은 중앙의 큰 타일
     */

    if (index === 0) {
      item.classList.add("featured");
    }


    /*
     * 이미지가 있는지 여부
     */

    if (!imageURL) {
      item.classList.add("no-image");
    }


    /*
     * 다양한 Tetris 크기.
     * 첫 번째는 항상 중앙의 메인 활동.
     */

    applyTileSize(item, index);


    /*
     * 내부 HTML 생성
     */

    const safeTitle = escapeHTML(title);
    const safeDate = escapeHTML(date);

    let imageHTML = "";

    if (imageURL) {
      imageHTML = `
        <img
          class="activity-tile-image"
          src="${escapeHTML(imageURL)}"
          alt="${safeTitle}"
          loading="${index < 3 ? "eager" : "lazy"}"
        >
      `;
    }


    const newBadge =
      index === 0
        ? `<span class="activity-new">LATEST</span>`
        : "";


    item.innerHTML = `
      ${imageHTML}

      ${newBadge}

      <div class="activity-tile-info">
        ${
          safeDate
            ? `<span class="activity-tile-date">${safeDate}</span>`
            : ""
        }

        <h3 class="activity-tile-title">
          ${safeTitle}
        </h3>
      </div>
    `;


    /*
     * 관리자 삭제 버튼이 있었다면 다시 추가.
     * 공통 JS가 생성한 버튼 자체를 보존하기 위한 처리.
     */

    if (deleteButton) {
      item.appendChild(deleteButton);
    }


    /*
     * 상세보기 데이터 저장
     */

    item.dataset.activityTitle = title;
    item.dataset.activityDate = date;
    item.dataset.activityContent = content;
    item.dataset.activityImage = imageURL;


    /*
     * 클릭 이벤트
     */

    item.addEventListener("click", event => {

      /*
       * 삭제 버튼을 누른 경우에는 상세보기 열지 않는다.
       */

      if (
        event.target.closest(".delete-btn") ||
        event.target.closest("button")
      ) {
        return;
      }

      openActivityDetail({
        title,
        date,
        content,
        image: imageURL
      });

    });

  }


  /* ---------------------------------------------------------
     Tetris 배치
     --------------------------------------------------------- */

  function applyTileSize(item, index) {

    /*
     * CSS Grid의 column / row span을 직접 지정해서
     * 각각 다른 크기의 블록을 만든다.
     */

    const layouts = [

      /* 0 - 최신 / 중앙 */
      {
        col: "4 / span 6",
        row: "span 3"
      },

      /* 1 */
      {
        col: "1 / span 3",
        row: "span 2"
      },

      /* 2 */
      {
        col: "10 / span 3",
        row: "span 2"
      },

      /* 3 */
      {
        col: "1 / span 4",
        row: "span 2"
      },

      /* 4 */
      {
        col: "5 / span 4",
        row: "span 2"
      },

      /* 5 */
      {
        col: "9 / span 4",
        row: "span 2"
      },

      /* 6 */
      {
        col: "1 / span 3",
        row: "span 2"
      },

      /* 7 */
      {
        col: "4 / span 5",
        row: "span 2"
      },

      /* 8 */
      {
        col: "9 / span 4",
        row: "span 2"
      }

    ];


    /*
     * 9개 이후 활동은 자동 dense 배치.
     */

    const layout = layouts[index];

    if (!layout) {
      item.style.gridColumn = "span 3";
      item.style.gridRow = "span 2";
      return;
    }


    item.style.gridColumn = layout.col;
    item.style.gridRow = layout.row;
  }


  /* ---------------------------------------------------------
     상세보기 모달 생성
     --------------------------------------------------------- */

  function createModal() {

    if (document.querySelector(".activity-detail-modal")) {
      return;
    }


    const modal = document.createElement("div");

    modal.className = "activity-detail-modal";

    modal.innerHTML = `
      <div
        class="activity-detail-window"
        role="dialog"
        aria-modal="true"
        aria-label="활동 상세보기"
      >

        <button
          class="activity-detail-close"
          type="button"
          aria-label="닫기"
        >
          ×
        </button>

        <div class="activity-detail-image-wrap">
          <img
            class="activity-detail-image"
            src=""
            alt=""
          >
        </div>

        <div class="activity-detail-body">

          <span class="activity-detail-date"></span>

          <h2 class="activity-detail-title"></h2>

          <div class="activity-detail-content"></div>

        </div>

      </div>
    `;


    document.body.appendChild(modal);


    /*
     * 닫기 버튼
     */

    modal
      .querySelector(".activity-detail-close")
      .addEventListener("click", closeActivityDetail);


    /*
     * 배경 클릭
     */

    modal.addEventListener("click", event => {

      if (event.target === modal) {
        closeActivityDetail();
      }

    });

  }


  /* ---------------------------------------------------------
     상세보기 열기
     --------------------------------------------------------- */

  function openActivityDetail(data) {

    createModal();

    const modal =
      document.querySelector(".activity-detail-modal");

    const imageWrap =
      modal.querySelector(".activity-detail-image-wrap");

    const image =
      modal.querySelector(".activity-detail-image");

    const date =
      modal.querySelector(".activity-detail-date");

    const title =
      modal.querySelector(".activity-detail-title");

    const content =
      modal.querySelector(".activity-detail-content");


    title.textContent = data.title || "주요 활동";

    date.textContent = data.date || "";

    content.textContent = data.content || "";


    if (data.image) {

      imageWrap.classList.remove("no-image");

      image.src = data.image;

      image.alt = data.title || "활동 사진";

    } else {

      imageWrap.classList.add("no-image");

      image.removeAttribute("src");

      image.alt = "";

    }


    modal.classList.add("is-open");

    document.body.style.overflow = "hidden";


    /*
     * 닫기 버튼에 포커스
     */

    requestAnimationFrame(() => {

      modal
        .querySelector(".activity-detail-close")
        ?.focus();

    });

  }


  /* ---------------------------------------------------------
     상세보기 닫기
     --------------------------------------------------------- */

  function closeActivityDetail() {

    const modal =
      document.querySelector(".activity-detail-modal");

    if (!modal) return;

    modal.classList.remove("is-open");

    document.body.style.overflow = "";

  }


  /* ---------------------------------------------------------
     ESC로 닫기
     --------------------------------------------------------- */

  document.addEventListener("keydown", event => {

    if (event.key !== "Escape") return;

    const modal =
      document.querySelector(".activity-detail-modal");

    if (
      modal &&
      modal.classList.contains("is-open")
    ) {
      closeActivityDetail();
    }

  });


  /* ---------------------------------------------------------
     활동 목록 변환
     --------------------------------------------------------- */

  function enhanceActivities() {

    if (enhancing) return;

    const container =
      document.querySelector(CONTENT_SELECTOR);

    if (!container) return;


    const items = [
      ...container.querySelectorAll(":scope > .act-list-item")
    ];


    if (!items.length) return;


    enhancing = true;


    /*
     * 이미 변환된 항목은 제외하고
     * 새로 들어온 항목만 처리한다.
     */

    items.forEach((item, index) => {

      if (
        item.dataset.activityEnhanced !== "true"
      ) {
        enhanceActivity(item, index);
      }

    });


    /*
     * Firebase가 새 목록을 다시 렌더링했을 때
     * index 기준 featured 상태를 다시 맞춘다.
     */

    items.forEach((item, index) => {

      item.classList.toggle(
        "featured",
        index === 0
      );

      applyTileSize(item, index);

    });


    enhancing = false;

  }


  /* ---------------------------------------------------------
     Firebase loadActivities() 감시
     --------------------------------------------------------- */

  function startObserver() {

    const container =
      document.querySelector(CONTENT_SELECTOR);

    if (!container) {

      /*
       * 페이지 전환 후 DOM이 늦게 생기는 경우를 대비.
       */

      setTimeout(startObserver, 300);

      return;
    }


    /*
     * 이미 observer가 있으면 다시 만들지 않는다.
     */

    if (observer) {
      return;
    }


    observer = new MutationObserver(() => {

      /*
       * Firebase가 innerHTML을 교체한 직후
       * 다음 프레임에서 처리.
       */

      requestAnimationFrame(() => {

        enhanceActivities();

      });

    });


    observer.observe(container, {

      childList: true,
      subtree: true

    });


    /*
     * 처음 진입했을 때 이미 데이터가 존재하는 경우
     */

    enhanceActivities();

  }


  /* ---------------------------------------------------------
     페이지 초기화
     --------------------------------------------------------- */

  function init() {

    createModal();

    startObserver();

  }


  /*
   * 공통 common.js / firebase.js와 실행 순서를 고려해
   * 여러 시점에서 초기화 확인.
   */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }


  /*
   * 페이지 전환형 구조에서도 작동하도록 한 번 더 확인.
   */

  setTimeout(enhanceActivities, 500);
  setTimeout(enhanceActivities, 1200);
  setTimeout(enhanceActivities, 2500);

})();
