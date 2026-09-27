(function () {
    const interactiveSelector = `
        a, button, input, select, textarea, [onclick], [role="button"],
        .feature-card, .unified-card, .member-card, .notice-item,
        .banner-card, .slider-dot, .slider-control-btn, .filter-btn,
        .logo, .hamburger, .clickable, .home-photo-item, .home-photo-item img
    `;

    function isRealSelectableText(x, y) {
        let range = null;

        if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(x, y);
        } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(x, y);
            if (pos && pos.offsetNode) {
                range = document.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.setEnd(pos.offsetNode, pos.offset);
            }
        }

        if (!range) return false;

        const node = range.startContainer;

        /* 텍스트 노드가 아니면 I-beam 금지 */
        if (!node || node.nodeType !== Node.TEXT_NODE) return false;

        /* 빈 텍스트 노드 무시 */
        if (!node.textContent || !node.textContent.trim()) return false;

        const element = node.parentElement;
        if (!element) return false;

        /* 클릭 가능한 영역이면 I-beam 금지 */
        if (element.closest(interactiveSelector)) return false;

        /* 실제 CSS에서 텍스트 선택이 막혀 있는 영역이면 금지 */
        let current = element;
        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            if (style.userSelect === 'none' || style.webkitUserSelect === 'none') {
                return false;
            }
            current = current.parentElement;
        }

        return true;
    }

    // 마우스 이동 이벤트 부하를 줄이기 위한 최적화 변수 (렉 방지)
    let ticking = false;

    document.addEventListener('mousemove', function (e) {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                const target = e.target;

                /* 클릭 가능한 요소에서는 무조건 기존 레트로 커서를 유지 */
                if (target && target.closest && target.closest(interactiveSelector)) {
                    document.body.classList.remove('text-cursor');
                }
                /* 실제 선택 가능한 텍스트 위에서만 레트로 I-beam 커서 표시 */
                else if (isRealSelectableText(e.clientX, e.clientY)) {
                    document.body.classList.add('text-cursor');
                }
                else {
                    document.body.classList.remove('text-cursor');
                }

                ticking = false;
            });
            ticking = true;
        }
    });

})();



(function(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const groups=[
    '#page-home .home-overview-head, #page-home .home-stats, #page-home .home-latest-section .home-section-head, #page-home .home-latest-grid, #page-home .home-quick-links, #page-home .home-sponsor-section',
    '#page-intro_team .subpage-title, #page-intro_team .content-card',
    '#page-intro_logo .subpage-title, #page-intro_logo .content-card',
    '#page-intro_slogan .subpage-title, #page-intro_slogan .content-card',
    '#page-activity .subpage-title, #page-activity .content-card',
    '#page-intro_career .career-row'
  ];

  function collect(){
    const els=[];
    groups.forEach(sel=>document.querySelectorAll(sel).forEach(el=>els.push(el)));
    return [...new Set(els)];
  }

  let observer;

  function scan(){
    const els=collect();
    if(!els.length)return;

    if(!observer){
      observer=new IntersectionObserver(entries=>entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      }),{
        threshold:.08,
        rootMargin:'0px 0px -45px 0px'
      });
    }

    els.forEach(el=>{
      if(!el.classList.contains('turtless-scroll-reveal')){
        el.classList.add('turtless-scroll-reveal');
        observer.observe(el);
      }
    });
  }

  document.addEventListener('DOMContentLoaded',scan);

  const mo=new MutationObserver(scan);

  mo.observe(document.body,{
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:['class','style']
  });
})();



function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'ko',
    includedLanguages: 'ko,en,ja,zh-CN',
    autoDisplay: false
  }, 'google_translate_element');
}



// Footer language selector -> hidden Google Translate selector
function changeLanguage(lang) {
  const tryTranslate = () => {
    const select = document.querySelector('.goog-te-combo');

    if (!select) return false;

    const value = lang === 'zh' ? 'zh-CN' : lang;

    select.value = value;
    select.dispatchEvent(new Event('change', {
      bubbles: true
    }));

    return true;
  };

  if (tryTranslate()) return;

  let tries = 0;

  const timer = setInterval(() => {
    tries++;

    if (tryTranslate() || tries >= 30) {
      clearInterval(timer);
    }
  }, 150);
}



window.onload = function() {
  console.log("실행됨");

  const images = document.querySelectorAll('img');

  images.forEach(img => {
    img.setAttribute('referrerpolicy', 'no-referrer');
  });
};



document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. 솔리테어 스타일 거북이 쏟아지기 함수 (바닥 바운스)
  // ==========================================
  function triggerSolitaireCascade() {
    const turtleCount = 35;

    for (let i = 0; i < turtleCount; i++) {
      setTimeout(() => {
        createBouncingTurtle();
      }, i * 80);
    }
  }


  function createBouncingTurtle() {
    const turtle = document.createElement('div');

    turtle.innerText = '🐢';

    // 무작위 크기와 초기 위치 설정
    const size = Math.floor(Math.random() * 20) + 35;
    let posX = Math.random() * (window.innerWidth - 60);
    let posY = -60;

    // 물리 속도 설정
    let vx = (Math.random() - 0.5) * 14;
    let vy = Math.random() * 4 + 2;

    const gravity = 0.7;
    const bounce = -0.72;

    turtle.style.cssText = `
      position: fixed;
      font-size: ${size}px;
      left: ${posX}px;
      top: ${posY}px;
      z-index: 999999;
      pointer-events: none;
      user-select: none;
      filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
    `;

    document.body.appendChild(turtle);

    function animate() {
      vy += gravity;
      posX += vx;
      posY += vy;

      // 화면 바닥 충돌 처리
      if (posY >= window.innerHeight - size) {
        posY = window.innerHeight - size;
        vy *= bounce;
        vx *= 0.96;
      }

      turtle.style.left = `${posX}px`;
      turtle.style.top = `${posY}px`;

      // 화면 밖으로 나가거나 튕김이 끝나면 제거
      if (
        posX < -100 ||
        posX > window.innerWidth + 100 ||
        (Math.abs(vy) < 1 &&
         posY >= window.innerHeight - size - 5)
      ) {
        turtle.style.transition = 'opacity 0.4s ease';
        turtle.style.opacity = '0';

        setTimeout(() => turtle.remove(), 400);
      } else {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }



  // ==========================================
  // 2. 화면 전체를 휘젓고 다니는 로봇 거북이 함수
  // ==========================================
  function triggerWildRoamingTurtle() {
    const turtle = document.createElement('div');

    turtle.innerHTML = '🐢';

    turtle.style.cssText = `
      position: fixed;
      font-size: 65px;
      z-index: 999999;
      pointer-events: none;
      user-select: none;
      left: ${window.innerWidth / 2}px;
      top: ${window.innerHeight / 2}px;
      transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
      filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5));
      transform: translate(-50%, -50%) scale(0);
    `;

    document.body.appendChild(turtle);

    // 등장 줌인
    setTimeout(() => {
      turtle.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);

    let moveCount = 0;
    const maxMoves = 15;

    const roamInterval = setInterval(() => {
      moveCount++;

      const nextX = Math.random() * (window.innerWidth - 120) + 60;
      const nextY = Math.random() * (window.innerHeight - 120) + 60;
      const randomRotate = (Math.random() - 0.5) * 720;
      const randomScale = Math.random() * 0.8 + 0.8;

      turtle.style.left = `${nextX}px`;
      turtle.style.top = `${nextY}px`;

      turtle.style.transform =
        `translate(-50%, -50%) rotate(${randomRotate}deg) scale(${randomScale})`;

      // 이동 종료 후 회오리치며 소멸
      if (moveCount >= maxMoves) {
        clearInterval(roamInterval);

        setTimeout(() => {
          turtle.style.transition = 'all 0.6s ease-in';

          turtle.style.transform =
            `translate(-50%, -50%) rotate(${randomRotate + 1080}deg) scale(0)`;

          turtle.style.opacity = '0';

          setTimeout(() => turtle.remove(), 600);
        }, 300);
      }

    }, 300);
  }



  // ==========================================
  // 이벤트 리스너 바인딩
  // ==========================================

  // 1) 로고 7번 연속 클릭 시 -> 솔리테어 거북이 폭포
  let logoClicks = 0;
  let logoTimer = null;

  const logoEl = document.querySelector('.logo');

  if (logoEl) {
    logoEl.addEventListener('click', (e) => {
      // 홈 화면에서는 로고 클릭으로 페이지가 새로고침되지 않게 함
      const isHome =
        location.pathname === '/TURTLESS_OFFICIAL/' ||
        location.pathname === '/TURTLESS_OFFICIAL/index.html' ||
        location.pathname.endsWith('/TURTLESS_OFFICIAL');

      if (!isHome) return;

      e.preventDefault();

      logoClicks++;

      clearTimeout(logoTimer);

      if (logoClicks >= 7) {
        triggerSolitaireCascade();
        logoClicks = 0;
      }

      logoTimer = setTimeout(() => {
        logoClicks = 0;
      }, 2000);
    });
  }


  // 2) 'turtle' 키보드 타이핑 시 -> 화면 난동 거북이
  let inputBuffer = '';

  window.addEventListener('keydown', (e) => {
    if (
      ['INPUT', 'TEXTAREA'].includes(
        document.activeElement.tagName
      )
    ) return;

    inputBuffer += e.key.toLowerCase();

    if (inputBuffer.length > 6) {
      inputBuffer = inputBuffer.slice(-6);
    }

    if (inputBuffer === 'turtle') {
      inputBuffer = '';
      triggerWildRoamingTurtle();
    }
  });

});



(function () {
  const trail = document.getElementById('turtless-mouse-trail');

  // HTML에 요소가 없을 경우 스크립트 에러 방지
  if (!trail) return;

  let mouseX = 0;
  let mouseY = 0;
  let trailX = 0;
  let trailY = 0;
  let started = false;

  // 마우스 이동 좌표 업데이트
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!started) {
      trailX = mouseX;
      trailY = mouseY;
      started = true;
    }

    trail.classList.add('active');
  });

  // 부드러운 애니메이션 구현
  function animate() {
    if (started) {
      trailX += (mouseX - trailX) * 0.12;
      trailY += (mouseY - trailY) * 0.12;

      trail.style.left = (trailX + 12) + 'px';
      trail.style.top = (trailY + 12) + 'px';
    }

    requestAnimationFrame(animate);
  }

  animate();

  // 브라우저 밖으로 마우스가 나가면 이미지 숨김
  document.addEventListener('mouseleave', function () {
    trail.classList.remove('active');
  });

  // 브라우저 안으로 마우스가 들어오면 다시 표시
  document.addEventListener('mouseenter', function () {
    if (started) {
      trail.classList.add('active');
    }
  });
})();



// =========================================================
// 영어 텍스트에 Ethnocentric 폰트 자동 적용
//
// 영어 페이지에서만 적용하는 것이 아니라
// 한국어 페이지 안에 있는 영문도 자동으로 적용한다.
//
// 한국어 → 기존 폰트
// 영어   → Ethnocentric
// 일본어 → 별도 폰트 지정 없음
// 중국어 → 별도 폰트 지정 없음
// =========================================================
(function () {

  const latinRegex = /[A-Za-z]+(?:['’\-][A-Za-z]+)*/g;

  const SKIP_TAGS = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEXTAREA',
    'INPUT',
    'SELECT',
    'OPTION',
    'CODE',
    'PRE',
    'SVG'
  ]);


  function applyEnglishFont(root) {
    if (!root || !root.ownerDocument) return;

    const doc = root.ownerDocument;

    const walker = doc.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {

          const parent = node.parentElement;

          if (!parent || SKIP_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // 이미 처리된 영문은 다시 처리하지 않음
          if (parent.closest('.turtless-english-text')) {
            return NodeFilter.FILTER_REJECT;
          }

          if (!latinRegex.test(node.nodeValue)) {
            latinRegex.lastIndex = 0;
            return NodeFilter.FILTER_REJECT;
          }

          latinRegex.lastIndex = 0;

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );


    const nodes = [];

    let node;

    while ((node = walker.nextNode())) {
      nodes.push(node);
    }


    nodes.forEach(textNode => {

      const text = textNode.nodeValue;

      latinRegex.lastIndex = 0;

      if (!latinRegex.test(text)) {
        latinRegex.lastIndex = 0;
        return;
      }

      latinRegex.lastIndex = 0;


      const fragment = doc.createDocumentFragment();

      let lastIndex = 0;
      let match;


      while ((match = latinRegex.exec(text)) !== null) {

        // 영문 앞의 한글/공백/기호
        if (match.index > lastIndex) {
          fragment.appendChild(
            doc.createTextNode(
              text.slice(lastIndex, match.index)
            )
          );
        }


        // 영문 부분만 Ethnocentric 적용
        const span = doc.createElement('span');

        span.className = 'turtless-english-text';

        span.style.fontFamily =
          "'Ethnocentric', sans-serif";

        span.textContent = match[0];

        fragment.appendChild(span);


        lastIndex = match.index + match[0].length;
      }


      // 마지막 남은 텍스트
      if (lastIndex < text.length) {
        fragment.appendChild(
          doc.createTextNode(
            text.slice(lastIndex)
          )
        );
      }


      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(
          fragment,
          textNode
        );
      }

    });

  }



  function checkLanguageFont() {

    // 언어 선택과 관계없이 영문은 항상 Ethnocentric
    applyEnglishFont(document.body);

  }


  // 페이지가 처음 열렸을 때
  document.addEventListener(
    'DOMContentLoaded',
    checkLanguageFont
  );


  // Google 번역 등으로 DOM 내용이 변경됐을 때
  let fontTimer = null;

  const observer = new MutationObserver(() => {

    if (fontTimer) {
      clearTimeout(fontTimer);
    }

    fontTimer = setTimeout(() => {
      applyEnglishFont(document.body);
    }, 100);

  });


  document.addEventListener('DOMContentLoaded', () => {

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  });

})();



// ==========================================
// 팀원 대시보드 / 관리자 패널
// 메인 페이지에서만 표시
// ==========================================
(function () {

  function hideMemberAdminOnSubpages() {

    const isSubPage =
      window.location.pathname.includes('/pages/');

    if (!isSubPage) return;

    const memberActions =
      document.getElementById('member-actions');

    const adminPanel =
      document.getElementById('admin-panel');

    if (memberActions) {
      memberActions.style.display = 'none';
    }

    if (adminPanel) {
      adminPanel.style.display = 'none';
    }
  }

  document.addEventListener(
    'DOMContentLoaded',
    hideMemberAdminOnSubpages
  );

  const observer =
    new MutationObserver(
      hideMemberAdminOnSubpages
    );

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'style',
      'class'
    ]
  });

})();

/* ============================================================
   TURTLESS Messenger UI
   ============================================================ */

function initTurtlessMessenger() {
  if (document.getElementById('turtless-messenger')) return;

  const wrap = document.createElement('div');
  wrap.id = 'turtless-messenger';

  wrap.innerHTML = `
    <button id="turtless-messenger-button" aria-label="메신저 열기">
      <span>💬</span>
      <b id="turtless-messenger-unread">0</b>
    </button>

    <div id="turtless-messenger-menu" aria-hidden="true">
      <div class="turtless-messenger-head">
        <strong>메신저</strong>
        <button id="turtless-messenger-close">×</button>
      </div>

      <button class="turtless-messenger-item" data-messenger-tab="personal">
        <span>👤</span>
        <div>
          <strong>개인채팅</strong>
          <small>팀원과 1:1로 대화</small>
        </div>
      </button>

      <button class="turtless-messenger-item" data-messenger-tab="team">
        <span>👥</span>
        <div>
          <strong>팀채팅</strong>
          <small>팀원들과 함께 대화</small>
        </div>
      </button>

      <button class="turtless-messenger-item" data-messenger-tab="contacts">
        <span>📇</span>
        <div>
          <strong>연락처</strong>
          <small>터틀리스 팀원 목록</small>
        </div>
      </button>
    </div>

    <div id="turtless-messenger-panel" aria-hidden="true">
      <div class="turtless-chat-head">
        <button id="turtless-chat-back">‹</button>
        <strong id="turtless-chat-title">메신저</strong>
        <button id="turtless-chat-close">×</button>
      </div>

      <div id="turtless-chat-content"></div>
    </div>
  `;

  document.body.appendChild(wrap);

  const style = document.createElement('style');
  style.textContent = `
    #turtless-messenger {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 99999;
      font-family: inherit;
    }

    #turtless-messenger-button {
      width: 58px;
      height: 58px;
      border: 0;
      border-radius: 50%;
      background: #1769ff;
      color: white;
      font-size: 25px;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(0,0,0,.2);
      position: relative;
      transition: .2s;
    }

    #turtless-messenger-button:hover {
      transform: translateY(-2px) scale(1.03);
    }

    #turtless-messenger-unread {
      display: none;
      position: absolute;
      right: -2px;
      top: -2px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 20px;
      background: #ff3b30;
      color: white;
      font-size: 11px;
      line-height: 18px;
    }

    #turtless-messenger-menu,
    #turtless-messenger-panel {
      display: none;
      position: absolute;
      right: 0;
      bottom: 72px;
      width: 320px;
      overflow: hidden;
      border-radius: 18px;
      background: white;
      box-shadow: 0 15px 50px rgba(0,0,0,.2);
      border: 1px solid rgba(0,0,0,.08);
    }

    .turtless-messenger-head,
    .turtless-chat-head {
      height: 58px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
    }

    .turtless-messenger-head strong,
    .turtless-chat-head strong {
      font-size: 16px;
    }

    .turtless-messenger-head button,
    .turtless-chat-head button {
      border: 0;
      background: none;
      cursor: pointer;
      font-size: 24px;
      color: #777;
    }

    .turtless-messenger-item {
      width: 100%;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 13px;
      border: 0;
      border-bottom: 1px solid #f1f1f1;
      background: white;
      text-align: left;
      cursor: pointer;
    }

    .turtless-messenger-item:hover {
      background: #f6f9ff;
    }

    .turtless-messenger-item > span {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #eef4ff;
      font-size: 20px;
    }

    .turtless-messenger-item div {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .turtless-messenger-item small {
      color: #888;
      font-size: 12px;
    }

    #turtless-chat-content {
      min-height: 300px;
      max-height: 500px;
      overflow-y: auto;
    }

    @media (max-width: 600px) {
      #turtless-messenger {
        right: 15px;
        bottom: 15px;
      }

      #turtless-messenger-menu,
      #turtless-messenger-panel {
        width: calc(100vw - 30px);
        right: -1px;
      }
    }
  `;

  document.head.appendChild(style);

  const button = document.getElementById('turtless-messenger-button');
  const menu = document.getElementById('turtless-messenger-menu');
  const panel = document.getElementById('turtless-messenger-panel');
  const content = document.getElementById('turtless-chat-content');

  function openMenu() {
    menu.style.display = 'block';
    panel.style.display = 'none';
  }

  function closeMenu() {
    menu.style.display = 'none';
  }



  // ============================================================
  // TURTLESS Messenger - 사이트 내 읽지 않은 메시지 알림
  // ============================================================

  const unreadStorageKey = 'turtlessChatReadAt';
  const unreadByChat = new Map();
  const chatListeners = new Map();
  let unreadWatcherStarted = false;

  function getReadAtMap() {
    try {
      return JSON.parse(localStorage.getItem(unreadStorageKey) || '{}');
    } catch {
      return {};
    }
  }

  function saveReadAt(chatId, timestamp) {
    if (!chatId || !timestamp) return;

    const map = getReadAtMap();
    const current = Number(map[chatId] || 0);
    const next = Number(timestamp || 0);

    if (next > current) {
      map[chatId] = next;
      localStorage.setItem(unreadStorageKey, JSON.stringify(map));
    }
  }

  function getUnreadCount(messages, chatId) {
    const readAt = Number(getReadAtMap()[chatId] || 0);
    const myUid = window.auth?.currentUser?.uid;

    return messages.filter(message => {
      const timestamp = Number(message.timestamp || 0);

      return (
        timestamp > readAt &&
        message.senderAuthUid !== myUid
      );
    }).length;
  }

  function updateMessengerUnreadBadge() {
    const badge = document.getElementById('turtless-messenger-unread');
    if (!badge) return;

    let total = 0;

    unreadByChat.forEach(count => {
      total += Number(count || 0);
    });

    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : String(total);
      badge.style.display = 'block';
    } else {
      badge.textContent = '0';
      badge.style.display = 'none';
    }

    document.querySelectorAll('[data-unread-badge]').forEach(el => {
      const chatId = el.dataset.unreadBadge;
      const count = Number(unreadByChat.get(chatId) || 0);

      if (count > 0) {
        el.textContent = count > 99 ? '99+' : String(count);
        el.style.display = 'inline-flex';
      } else {
        el.textContent = '';
        el.style.display = 'none';
      }
    });
  }

  function markChatAsRead(chatId, messages = []) {
    if (!chatId) return;

    const latest = messages.reduce(
      (max, message) =>
        Math.max(max, Number(message.timestamp || 0)),
      0
    );

    if (latest > 0) {
      saveReadAt(chatId, latest);
    }

    unreadByChat.set(chatId, 0);
    updateMessengerUnreadBadge();
  }

  async function refreshUnreadChats() {
    if (
      !window.auth?.currentUser ||
      typeof window.turtlessGetMyChats !== 'function'
    ) {
      return;
    }

    let chats;

    try {
      chats = await window.turtlessGetMyChats();
    } catch (error) {
      return;
    }

    if (!Array.isArray(chats)) return;

    const activeChatIds = new Set(chats.map(chat => chat.id));

    // 더 이상 존재하지 않는 채팅의 listener 정리
    chatListeners.forEach((unsubscribe, chatId) => {
      if (!activeChatIds.has(chatId)) {
        try {
          unsubscribe();
        } catch {}
        chatListeners.delete(chatId);
        unreadByChat.delete(chatId);
      }
    });

    // 각 개인채팅의 실시간 메시지 감시
    chats.forEach(chat => {
      if (!chat?.id || chatListeners.has(chat.id)) return;

      try {
        const unsubscribe = window.turtlessListenChatMessages(
          chat.id,
          (messages, error) => {
            if (error || !Array.isArray(messages)) return;

            const count = getUnreadCount(messages, chat.id);
            unreadByChat.set(chat.id, count);

            updateMessengerUnreadBadge();
          }
        );

        if (typeof unsubscribe === 'function') {
          chatListeners.set(chat.id, unsubscribe);
        }
      } catch (error) {
        console.error(
          '[TURTLESS] 알림 listener 연결 실패:',
          chat.id,
          error
        );
      }
    });

    updateMessengerUnreadBadge();
  }

  function startUnreadWatcher() {
    if (unreadWatcherStarted) return;
    unreadWatcherStarted = true;

    const tryStart = () => {
      if (
        window.auth?.currentUser &&
        typeof window.turtlessGetMyChats === 'function'
      ) {
        refreshUnreadChats();
      }
    };

    tryStart();

    setInterval(() => {
      tryStart();
    }, 5000);
  }

  startUnreadWatcher();

  async function openDirectChatUI(chatId, user) {
    menu.style.display = 'none';
    panel.style.display = 'block';

    const title = document.getElementById('turtless-chat-title');
    title.textContent = user.name || '개인채팅';

    content.innerHTML = `
      <div id="turtless-direct-chat" style="
        display:flex;
        flex-direction:column;
        height:430px;
        background:#f7f9fc;
      ">
        <div id="turtless-message-list" style="
          flex:1;
          overflow-y:auto;
          padding:14px 12px;
          display:flex;
          flex-direction:column;
          gap:7px;
        ">
          <div style="
            text-align:center;
            color:#999;
            font-size:12px;
            padding:30px 0;
          ">
            메시지를 불러오는 중...
          </div>
        </div>

        <div style="
          display:flex;
          gap:7px;
          padding:10px;
          background:#fff;
          border-top:1px solid #e8ebf0;
        ">
          <input
            id="turtless-message-input"
            type="text"
            maxlength="2000"
            placeholder="메시지를 입력하세요"
            autocomplete="off"
            style="
              flex:1;
              min-width:0;
              border:1px solid #dfe4eb;
              border-radius:20px;
              padding:9px 13px;
              outline:none;
              font-size:13px;
            "
          >
          <button
            id="turtless-message-send"
            type="button"
            style="
              border:0;
              border-radius:50%;
              width:38px;
              height:38px;
              background:#2563eb;
              color:#fff;
              cursor:pointer;
              font-size:15px;
            "
          >➤</button>
        </div>
      </div>
    `;

    const messageList = document.getElementById('turtless-message-list');
    const input = document.getElementById('turtless-message-input');
    const sendButton = document.getElementById('turtless-message-send');

    let unsubscribe = null;

    const renderMessages = messages => {
      if (!messages.length) {
        messageList.innerHTML = `
          <div style="
            text-align:center;
            color:#aaa;
            font-size:12px;
            padding:45px 10px;
          ">
            아직 메시지가 없습니다.
          </div>
        `;
        return;
      }

      const myUid = window.auth?.currentUser?.uid;

      messageList.innerHTML = messages.map(message => {
        const mine = message.senderAuthUid === myUid;
        const time = message.timestamp
          ? new Date(message.timestamp).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        return `
          <div style="
            display:flex;
            justify-content:${mine ? 'flex-end' : 'flex-start'};
            width:100%;
          ">
            <div style="
              max-width:75%;
              display:flex;
              flex-direction:column;
              align-items:${mine ? 'flex-end' : 'flex-start'};
            ">
              ${!mine ? `
                <div style="
                  font-size:10px;
                  color:#888;
                  margin:0 5px 3px;
                ">
                  ${message.senderName || user.name || ''}
                </div>
              ` : ''}

              <div style="
                padding:8px 11px;
                border-radius:${mine
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px'};
                background:${mine ? '#2563eb' : '#fff'};
                color:${mine ? '#fff' : '#222'};
                font-size:13px;
                line-height:1.45;
                word-break:break-word;
                box-shadow:0 1px 2px rgba(0,0,0,.06);
              ">
                ${String(message.text || '')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\n/g, '<br>')}
              </div>

              <div style="
                font-size:9px;
                color:#aaa;
                margin:2px 5px 0;
              ">
                ${time}
              </div>
            </div>
          </div>
        `;
      }).join('');

      messageList.scrollTop = messageList.scrollHeight;
    };

    try {
      unsubscribe = window.turtlessListenChatMessages(
        chatId,
        (messages, error) => {
          if (error) {
            messageList.innerHTML = `
              <div style="
                text-align:center;
                color:#d33;
                padding:40px 15px;
                font-size:12px;
              ">
                메시지를 불러오지 못했습니다.
              </div>
            `;
            return;
          }

          renderMessages(messages);

          // 현재 열려 있는 채팅은 자동으로 읽음 처리
          markChatAsRead(chatId, messages);
        }
      );
    } catch (error) {
      console.error('[TURTLESS] 실시간 채팅 연결 실패:', error);
    }

    const sendMessage = async () => {
      const text = input.value.trim();

      if (!text) return;

      sendButton.disabled = true;
      input.disabled = true;

      try {
        await window.turtlessSendChatMessage(chatId, text);
        input.value = '';
        input.focus();
      } catch (error) {
        console.error('[TURTLESS] 메시지 전송 실패:', error);
        alert(error.message || '메시지를 전송하지 못했습니다.');
      } finally {
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
      }
    };

    sendButton.addEventListener('click', sendMessage);

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });

    input.focus();

    // 패널이 닫힐 때 실시간 listener 정리
    const closeObserver = new MutationObserver(() => {
      if (panel.style.display === 'none') {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        closeObserver.disconnect();
      }
    });

    closeObserver.observe(panel, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  async function openPanel(tab) {
    menu.style.display = 'none';
    panel.style.display = 'block';

    const titles = {
      personal: '개인채팅',
      team: '팀채팅',
      contacts: '연락처'
    };

    document.getElementById('turtless-chat-title').textContent =
      titles[tab] || '메신저';

    // 개인채팅 목록
    if (tab === 'personal') {
      content.innerHTML = `
        <div style="
          padding:18px 16px;
          color:#777;
          text-align:center;
        ">
          개인채팅을 불러오는 중...
        </div>
      `;

      try {
        const chats = await window.turtlessGetMyChats();

        if (!Array.isArray(chats) || chats.length === 0) {
          content.innerHTML = `
            <div style="
              padding:50px 20px;
              text-align:center;
              color:#888;
            ">
              <div style="font-size:35px;margin-bottom:10px;">💬</div>
              <strong>개인채팅이 없습니다.</strong>
              <p style="font-size:13px;margin-top:8px;">
                연락처에서 팀원을 선택해 대화를 시작해보세요.
              </p>
            </div>
          `;
          return;
        }

        const myUserId =
          typeof window.turtlessGetCurrentUserId === 'function'
            ? window.turtlessGetCurrentUserId()
            : null;

        const users = await window.turtlessGetPublicMembers();

        const userMap = new Map(
          users.map(user => [user.id, user])
        );

        const chatItems = chats.map(chat => {
          const memberIds = Array.isArray(chat.memberUserIds)
            ? chat.memberUserIds
            : [];

          const otherUserId =
            memberIds.find(id => id !== myUserId) || '';

          const user = userMap.get(otherUserId) || {};

          return {
            chat,
            otherUserId,
            name: user.name || chat.name || '개인채팅',
            profile: user.profileImage || ''
          };
        });

        content.innerHTML = `
          <div style="padding:8px 0;">
            ${chatItems.map(item => `
              <div
                data-personal-chat="${item.chat.id}"
                style="
                  display:flex;
                  align-items:center;
                  gap:12px;
                  padding:13px 16px;
                  cursor:pointer;
                  border-bottom:1px solid #eee;
                "
              >
                <div style="
                  width:44px;
                  height:44px;
                  border-radius:50%;
                  overflow:hidden;
                  background:#edf4ff;
                  flex:none;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:20px;
                ">
                  ${
                    item.profile
                      ? `<img src="${item.profile}"
                          style="width:100%;height:100%;object-fit:cover;">`
                      : '👤'
                  }
                </div>

                <div style="
                  min-width:0;
                  flex:1;
                  text-align:left;
                ">
                  <div style="
                    font-weight:700;
                    color:#222;
                  ">
                    ${item.name}
                  </div>

                  <div style="
                    color:#999;
                    font-size:12px;
                    margin-top:4px;
                  ">
                    개인채팅
                  </div>
                </div>

                <span
                  data-unread-badge="${item.chat.id}"
                  style="
                    display:none;
                    min-width:20px;
                    height:20px;
                    padding:0 6px;
                    border-radius:999px;
                    align-items:center;
                    justify-content:center;
                    background:#ff3b30;
                    color:#fff;
                    font-size:10px;
                    font-weight:700;
                    flex:none;
                  "
                ></span>
              </div>
            `).join('')}
          </div>
        `;

        updateMessengerUnreadBadge();

        content.querySelectorAll('[data-personal-chat]').forEach(item => {
          item.addEventListener('click', async () => {
            const chatId = item.dataset.personalChat;

            const chatItem = chatItems.find(
              value => value.chat.id === chatId
            );

            if (!chatItem) return;

            try {
              await openDirectChatUI(
                chatId,
                {
                  id: chatItem.otherUserId,
                  name: chatItem.name,
                  profileImage: chatItem.profile
                }
              );
            } catch (error) {
              console.error(
                '[TURTLESS] 개인채팅 열기 실패:',
                error
              );

              alert(
                error.message || '개인채팅을 열 수 없습니다.'
              );
            }
          });
        });

      } catch (error) {
        console.error(
          '[TURTLESS] 개인채팅 목록 불러오기 실패:',
          error
        );

        content.innerHTML = `
          <div style="
            padding:40px 20px;
            text-align:center;
            color:#888;
          ">
            <div style="font-size:32px;margin-bottom:10px;">⚠️</div>
            <strong>개인채팅을 불러오지 못했습니다.</strong>
            <p style="font-size:13px;margin-top:8px;">
              ${error.message || '잠시 후 다시 시도해주세요.'}
            </p>
          </div>
        `;
      }

      return;
    }

    // 팀채팅은 기존처럼 준비 중 상태 유지
    if (tab === 'team') {
      content.innerHTML = `
        <div style="
          padding:40px 20px;
          text-align:center;
          color:#888;
        ">
          <div style="font-size:35px;margin-bottom:10px;">👥</div>
          <strong>팀채팅</strong>
          <p style="font-size:13px;margin-top:8px;">
            팀채팅 기능을 연결하는 중입니다.
          </p>
        </div>
      `;
      return;
    }

    // 연락처
    content.innerHTML = `
      <div style="padding:18px 16px;color:#777;text-align:center;">
        연락처를 불러오는 중...
      </div>
    `;

    try {
      const users = await window.turtlessGetPublicMembers();

      content.innerHTML = `
        <div style="padding:8px 0;">
          ${users.map(user => {
            const name = user.name || '이름 없음';
            const school = user.school || '';

            // DB의 grade 값에 이미 "학년"이 포함되어 있으므로 그대로 표시
            const grade = user.grade || '';

            const role = user.role || '';
            const id = user.id || '';

            const displayId =
              typeof window.turtlessGetDisplayLoginId === 'function'
                ? window.turtlessGetDisplayLoginId(id, name)
                : '';

            const fakeEmail =
              displayId ? `${displayId}@turtless.com` : '';

            const profile =
              user.profileImage ||
              'https://ui-avatars.com/api/?name=' +
              encodeURIComponent(name) +
              '&background=edf4ff&color=2563eb';

            return `
              <div
                data-contact-user="${id}"
                style="
                  display:flex;
                  align-items:center;
                  gap:12px;
                  padding:11px 14px;
                  cursor:pointer;
                  border-bottom:1px solid #f0f2f5;
                "
              >
                <img
                  src="${profile}"
                  alt=""
                  style="
                    width:44px;
                    height:44px;
                    border-radius:50%;
                    object-fit:cover;
                    flex:none;
                  "
                >

                <div style="min-width:0;flex:1;">
                  <div style="
                    display:flex;
                    align-items:center;
                    gap:6px;
                    margin-bottom:3px;
                  ">
                    <strong style="font-size:14px;color:#222;">
                      ${name}
                    </strong>

                    ${role ? `
                      <span style="
                        font-size:10px;
                        padding:2px 6px;
                        border-radius:8px;
                        background:#edf4ff;
                        color:#2563eb;
                      ">
                        ${role}
                      </span>
                    ` : ''}
                  </div>

                  <div style="
                    font-size:11px;
                    color:#888;
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                  ">
                    ${school} ${grade}
                  </div>

                  <div style="
                    font-size:10px;
                    color:#aaa;
                    margin-top:2px;
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                  ">
                    ${fakeEmail}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      content.querySelectorAll('[data-contact-user]').forEach(item => {
        item.addEventListener('click', async () => {
          const otherUserId = item.dataset.contactUser;

          try {
            const result =
              await window.turtlessOpenDirectChat(otherUserId);

            const user =
              users.find(u => u.id === otherUserId);

            await openDirectChatUI(
              result.chatId,
              user || {
                name: '개인채팅',
                profileImage: ''
              }
            );
          } catch (error) {
            console.error(
              '[TURTLESS] 개인채팅 열기 실패:',
              error
            );

            alert(
              error.message || '개인채팅을 열 수 없습니다.'
            );
          }
        });
      });

    } catch (error) {
      console.error(
        'TURTLESS 연락처 불러오기 실패:',
        error
      );

      content.innerHTML = `
        <div style="
          padding:40px 20px;
          text-align:center;
          color:#d33;
        ">
          연락처를 불러오지 못했습니다.
        </div>
      `;
    }
  }

  button.addEventListener('click', () => {
    if (menu.style.display === 'block' || panel.style.display === 'block') {
      closeMenu();
      panel.style.display = 'none';
    } else {
      openMenu();
    }
  });

  document.getElementById('turtless-messenger-close')
    .addEventListener('click', closeMenu);

  document.getElementById('turtless-chat-close')
    .addEventListener('click', () => {
      panel.style.display = 'none';
    });

  document.getElementById('turtless-chat-back')
    .addEventListener('click', openMenu);

  document.querySelectorAll('[data-messenger-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      openPanel(btn.dataset.messengerTab);
    });
  });
};
