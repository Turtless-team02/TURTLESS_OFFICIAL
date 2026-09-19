
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
        if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}
      }),{threshold:.08,rootMargin:'0px 0px -45px 0px'});
    }
    els.forEach(el=>{if(!el.classList.contains('turtless-scroll-reveal')){el.classList.add('turtless-scroll-reveal');observer.observe(el);}});
  }
  document.addEventListener('DOMContentLoaded',scan);
  const mo=new MutationObserver(scan);
  mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
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
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    if (tryTranslate()) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (tryTranslate() || tries >= 30) clearInterval(timer);
    }, 150);
  }



  window.onload = function() {
    console.log("실행됨"); // 이 줄을 넣고 F12 콘솔에 '실행됨'이 뜨는지 확인해 보세요!
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
    const turtleCount = 35; // 쏟아질 거북이 수
    
    for (let i = 0; i < turtleCount; i++) {
      setTimeout(() => {
        createBouncingTurtle();
      }, i * 80); // 약간의 시차를 두고 연속 생성
    }
  }

  function createBouncingTurtle() {
    const turtle = document.createElement('div');
    turtle.innerText = '🐢';
    
    // 무작위 크기와 초기 위치 설정
    const size = Math.floor(Math.random() * 20) + 35; // 35px ~ 55px
    let posX = Math.random() * (window.innerWidth - 60);
    let posY = -60;
    
    // 물리 속도 설정 (x축 이동, y축 중력 및 탄성)
    let vx = (Math.random() - 0.5) * 14; 
    let vy = Math.random() * 4 + 2;
    const gravity = 0.7;
    const bounce = -0.72; // 바닥 튕김 계수

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

      // 화면 바닥 충돌 처리 (솔리테어 카드가 튕기는 효과)
      if (posY >= window.innerHeight - size) {
        posY = window.innerHeight - size;
        vy *= bounce;
        vx *= 0.96; // 마찰력
      }

      turtle.style.left = `${posX}px`;
      turtle.style.top = `${posY}px`;

      // 화면 밖으로 완전히 나가거나 튕김이 끝나면 제거
      if (posX < -100 || posX > window.innerWidth + 100 || (Math.abs(vy) < 1 && posY >= window.innerHeight - size - 5)) {
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
    
    // 이모지 대신 로봇/거북이 이미지를 넣고 싶다면 <img> 태그로 바꾸셔도 됩니다.
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
    const maxMoves = 15; // 난동 부리는 횟수

    const roamInterval = setInterval(() => {
      moveCount++;

      // 화면 내부 아무 좌표나 무작위 추출
      const nextX = Math.random() * (window.innerWidth - 120) + 60;
      const nextY = Math.random() * (window.innerHeight - 120) + 60;
      const randomRotate = (Math.random() - 0.5) * 720; // 360도 이상 회전
      const randomScale = Math.random() * 0.8 + 0.8; // 크기 조절 (0.8~1.6배)

      turtle.style.left = `${nextX}px`;
      turtle.style.top = `${nextY}px`;
      turtle.style.transform = `translate(-50%, -50%) rotate(${randomRotate}deg) scale(${randomScale})`;

      // 이동 종료 후 회오리치며 소멸
      if (moveCount >= maxMoves) {
        clearInterval(roamInterval);
        setTimeout(() => {
          turtle.style.transition = 'all 0.6s ease-in';
          turtle.style.transform = `translate(-50%, -50%) rotate(${randomRotate + 1080}deg) scale(0)`;
          turtle.style.opacity = '0';
          setTimeout(() => turtle.remove(), 600);
        }, 300);
      }
    }, 300); // 0.3초마다 사방으로 좌표 변경
  }

  // ==========================================
  // 이벤트 리스너 바인딩
  // ==========================================

  // 1) 로고 7번 연속 클릭 시 -> 솔리테어 거북이 폭포
  let logoClicks = 0;
  let logoTimer = null;
  const logoEl = document.querySelector('.logo');

  if (logoEl) {
    logoEl.addEventListener('click', () => {
      logoClicks++;
      clearTimeout(logoTimer);

      if (logoClicks === 7) {
        triggerSolitaireCascade();
        logoClicks = 0;
      }

      logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
    });
  }

  // 2) 'turtle' 키보드 타이핑 시 -> 화면 난동 거북이
  let inputBuffer = '';

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    inputBuffer += e.key.toLowerCase();
    if (inputBuffer.length > 6) inputBuffer = inputBuffer.slice(-6);

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
        // 0.12 수치를 조절하면 따라오는 속도가 달라집니다 (1에 가까울수록 빠름)
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
      if (started) trail.classList.add('active');
    });
  })();



(function () {
  function checkLanguageFont() {
    const select = document.querySelector('.lang-select');
    const lang = select ? select.value : 'ko';

    document.body.classList.toggle('turtless-english', lang === 'en');
    document.body.classList.toggle('turtless-japanese', lang === 'ja');
    document.body.classList.toggle('turtless-chinese', lang === 'zh-CN' || lang === 'zh');
  }

  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('lang-select')) {
      setTimeout(checkLanguageFont, 300);
      setTimeout(checkLanguageFont, 1000);
      setTimeout(checkLanguageFont, 2000);
    }
  });

  checkLanguageFont();
  setInterval(checkLanguageFont, 1000);
})();

// ==========================================
// 팀원 대시보드 / 관리자 패널
// 메인 페이지에서만 표시
// ==========================================
(function () {
  function hideMemberAdminOnSubpages() {
    const isSubPage = window.location.pathname.includes('/pages/');

    if (!isSubPage) return;

    const memberActions = document.getElementById('member-actions');
    const adminPanel = document.getElementById('admin-panel');

    if (memberActions) {
      memberActions.style.display = 'none';
    }

    if (adminPanel) {
      adminPanel.style.display = 'none';
    }
  }

  // 처음 로드될 때
  document.addEventListener('DOMContentLoaded', hideMemberAdminOnSubpages);

  // Firebase가 로그인 복구 후 다시 display:block으로 바꾸는 경우까지 방지
  const observer = new MutationObserver(hideMemberAdminOnSubpages);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
})();
