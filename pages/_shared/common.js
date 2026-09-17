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

        if (!node || node.nodeType !== Node.TEXT_NODE) {
            return false;
        }

        if (!node.textContent || !node.textContent.trim()) {
            return false;
        }

        const element = node.parentElement;

        if (!element) {
            return false;
        }

        if (element.closest(interactiveSelector)) {
            return false;
        }

        let current = element;

        while (current && current !== document.body) {
            const style = window.getComputedStyle(current);

            if (
                style.userSelect === 'none' ||
                style.webkitUserSelect === 'none'
            ) {
                return false;
            }

            current = current.parentElement;
        }

        return true;
    }

    let ticking = false;

    document.addEventListener('mousemove', function (e) {
        if (ticking) return;

        window.requestAnimationFrame(function () {
            const target = e.target;

            if (
                target &&
                target.closest &&
                target.closest(interactiveSelector)
            ) {
                document.body.classList.remove('text-cursor');
            } else if (
                isRealSelectableText(e.clientX, e.clientY)
            ) {
                document.body.classList.add('text-cursor');
            } else {
                document.body.classList.remove('text-cursor');
            }

            ticking = false;
        });

        ticking = true;
    });
})();



/* =========================================================
   스크롤 등장 애니메이션
   ========================================================= */

(function () {
    if (
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
        return;
    }

    const groups = [
        '#page-home .home-overview-head, #page-home .home-stats, #page-home .home-latest-section .home-section-head, #page-home .home-latest-grid, #page-home .home-quick-links, #page-home .home-sponsor-section',

        '#page-intro_team .subpage-title, #page-intro_team .content-card',

        '#page-intro_logo .subpage-title, #page-intro_logo .content-card',

        '#page-intro_slogan .subpage-title, #page-intro_slogan .content-card',

        '#page-activity .subpage-title, #page-activity .content-card',

        '#page-intro_career .career-row'
    ];

    function collect() {
        const els = [];

        groups.forEach(selector => {
            document
                .querySelectorAll(selector)
                .forEach(el => els.push(el));
        });

        return [...new Set(els)];
    }

    let observer = null;

    function scan() {
        const els = collect();

        if (!els.length) return;

        if (!observer) {
            observer = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: 0.08,
                    rootMargin: '0px 0px -45px 0px'
                }
            );
        }

        els.forEach(el => {
            if (
                !el.classList.contains(
                    'turtless-scroll-reveal'
                )
            ) {
                el.classList.add(
                    'turtless-scroll-reveal'
                );

                observer.observe(el);
            }
        });
    }

    document.addEventListener(
        'DOMContentLoaded',
        scan
    );

    const mo = new MutationObserver(scan);

    mo.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });
})();



/* =========================================================
   Google 번역
   ========================================================= */

function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: 'ko',
            includedLanguages: 'ko,en,ja,zh-CN',
            autoDisplay: false
        },
        'google_translate_element'
    );
}



/* =========================================================
   Footer 언어 선택
   ========================================================= */

function changeLanguage(lang) {
    const tryTranslate = () => {
        const select =
            document.querySelector('.goog-te-combo');

        if (!select) return false;

        const value =
            lang === 'zh'
                ? 'zh-CN'
                : lang;

        select.value = value;

        select.dispatchEvent(
            new Event('change', {
                bubbles: true
            })
        );

        return true;
    };

    if (tryTranslate()) return;

    let tries = 0;

    const timer = setInterval(() => {
        tries++;

        if (
            tryTranslate() ||
            tries >= 30
        ) {
            clearInterval(timer);
        }
    }, 150);
}



/* =========================================================
   이미지 Referrer 정책
   ========================================================= */

window.onload = function () {
    console.log("실행됨");

    const images =
        document.querySelectorAll('img');

    images.forEach(img => {
        img.setAttribute(
            'referrerpolicy',
            'no-referrer'
        );
    });
};



/* =========================================================
   터틀리스 이스터에그
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        /* -----------------------------------------
           1. 솔리테어 스타일 거북이 쏟아지기
           ----------------------------------------- */

        function triggerSolitaireCascade() {
            const turtleCount = 35;

            for (let i = 0; i < turtleCount; i++) {
                setTimeout(() => {
                    createBouncingTurtle();
                }, i * 80);
            }
        }


        function createBouncingTurtle() {
            const turtle =
                document.createElement('div');

            turtle.innerText = '🐢';

            const size =
                Math.floor(
                    Math.random() * 20
                ) + 35;

            let posX =
                Math.random() *
                (window.innerWidth - 60);

            let posY = -60;

            let vx =
                (Math.random() - 0.5) * 14;

            let vy =
                Math.random() * 4 + 2;

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

                if (
                    posY >=
                    window.innerHeight - size
                ) {
                    posY =
                        window.innerHeight - size;

                    vy *= bounce;
                    vx *= 0.96;
                }

                turtle.style.left =
                    `${posX}px`;

                turtle.style.top =
                    `${posY}px`;


                if (
                    posX < -100 ||
                    posX >
                        window.innerWidth + 100 ||
                    (
                        Math.abs(vy) < 1 &&
                        posY >=
                            window.innerHeight -
                            size -
                            5
                    )
                ) {
                    turtle.style.transition =
                        'opacity 0.4s ease';

                    turtle.style.opacity = '0';

                    setTimeout(
                        () => turtle.remove(),
                        400
                    );
                } else {
                    requestAnimationFrame(
                        animate
                    );
                }
            }

            requestAnimationFrame(
                animate
            );
        }



        /* -----------------------------------------
           2. 화면을 휘젓는 거북이
           ----------------------------------------- */

        function triggerWildRoamingTurtle() {
            const turtle =
                document.createElement('div');

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


            setTimeout(() => {
                turtle.style.transform =
                    'translate(-50%, -50%) scale(1)';
            }, 50);


            let moveCount = 0;

            const maxMoves = 15;

            const roamInterval =
                setInterval(() => {
                    moveCount++;

                    const nextX =
                        Math.random() *
                            (window.innerWidth - 120) +
                        60;

                    const nextY =
                        Math.random() *
                            (window.innerHeight - 120) +
                        60;

                    const randomRotate =
                        (Math.random() - 0.5) * 720;

                    const randomScale =
                        Math.random() * 0.8 + 0.8;

                    turtle.style.left =
                        `${nextX}px`;

                    turtle.style.top =
                        `${nextY}px`;

                    turtle.style.transform =
                        `
                        translate(-50%, -50%)
                        rotate(${randomRotate}deg)
                        scale(${randomScale})
                        `;


                    if (
                        moveCount >= maxMoves
                    ) {
                        clearInterval(
                            roamInterval
                        );

                        setTimeout(() => {
                            turtle.style.transition =
                                'all 0.6s ease-in';

                            turtle.style.transform =
                                `
                                translate(-50%, -50%)
                                rotate(${randomRotate + 1080}deg)
                                scale(0)
                                `;

                            turtle.style.opacity =
                                '0';

                            setTimeout(
                                () => turtle.remove(),
                                600
                            );
                        }, 300);
                    }

                }, 300);
        }



        /* -----------------------------------------
           3. 로고 7번 클릭
           ----------------------------------------- */

        let logoClicks = 0;
        let logoTimer = null;

        const logoEl =
            document.querySelector('.logo');

        if (logoEl) {
            logoEl.addEventListener(
                'click',
                () => {
                    logoClicks++;

                    clearTimeout(
                        logoTimer
                    );

                    if (logoClicks === 7) {
                        triggerSolitaireCascade();

                        logoClicks = 0;
                    }

                    logoTimer =
                        setTimeout(
                            () => {
                                logoClicks = 0;
                            },
                            2000
                        );
                }
            );
        }



        /* -----------------------------------------
           4. turtle 입력
           ----------------------------------------- */

        let inputBuffer = '';

        window.addEventListener(
            'keydown',
            e => {
                if (
                    ['INPUT', 'TEXTAREA']
                        .includes(
                            document.activeElement.tagName
                        )
                ) {
                    return;
                }

                inputBuffer +=
                    e.key.toLowerCase();

                if (
                    inputBuffer.length > 6
                ) {
                    inputBuffer =
                        inputBuffer.slice(-6);
                }

                if (
                    inputBuffer === 'turtle'
                ) {
                    inputBuffer = '';

                    triggerWildRoamingTurtle();
                }
            }
        );

    }
);



/* =========================================================
   마우스 거북이 트레일
   ========================================================= */

(function () {
    const trail =
        document.getElementById(
            'turtless-mouse-trail'
        );

    if (!trail) return;

    let mouseX = 0;
    let mouseY = 0;

    let trailX = 0;
    let trailY = 0;

    let started = false;


    document.addEventListener(
        'mousemove',
        function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!started) {
                trailX = mouseX;
                trailY = mouseY;
                started = true;
            }

            trail.classList.add('active');
        }
    );


    function animate() {
        if (started) {
            trailX +=
                (mouseX - trailX) * 0.12;

            trailY +=
                (mouseY - trailY) * 0.12;

            trail.style.left =
                (trailX + 12) + 'px';

            trail.style.top =
                (trailY + 12) + 'px';
        }

        requestAnimationFrame(
            animate
        );
    }

    animate();


    document.addEventListener(
        'mouseleave',
        function () {
            trail.classList.remove(
                'active'
            );
        }
    );


    document.addEventListener(
        'mouseenter',
        function () {
            if (started) {
                trail.classList.add(
                    'active'
                );
            }
        }
    );
})();



/* =========================================================
   중국어 전용 폰트
   ========================================================= */

(function () {
    const style =
        document.createElement('style');

    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');

        body.turtless-chinese,
        body.turtless-chinese * {
            font-family:
                'Noto Sans SC',
                sans-serif !important;
        }

        body.turtless-chinese .fa,
        body.turtless-chinese .fas,
        body.turtless-chinese .far,
        body.turtless-chinese .fab,
        body.turtless-chinese .fa-solid,
        body.turtless-chinese .fa-regular,
        body.turtless-chinese .fa-brands {
            font-family:
                "Font Awesome 6 Free",
                "Font Awesome 6 Brands" !important;
        }
    `;

    document.head.appendChild(style);


    function checkChinese() {
        const select =
            document.querySelector(
                '.lang-select'
            );

        const isChinese =
            select &&
            select.value === 'zh-CN';

        document.body.classList.toggle(
            'turtless-chinese',
            !!isChinese
        );
    }


    document.addEventListener(
        'change',
        function (e) {
            if (
                e.target.classList.contains(
                    'lang-select'
                )
            ) {
                setTimeout(
                    checkChinese,
                    300
                );

                setTimeout(
                    checkChinese,
                    1000
                );

                setTimeout(
                    checkChinese,
                    2000
                );
            }
        }
    );


    setInterval(
        checkChinese,
        1000
    );
})();



/* =========================================================
   팀원 대시보드 / 관리자 패널
   메인 페이지에서만 표시
   ========================================================= */

(function () {

    function hideMemberAdminOnSubpages() {
        const isSubPage =
            window.location.pathname
                .includes('/pages/');

        if (!isSubPage) return;


        const memberActions =
            document.getElementById(
                'member-actions'
            );

        const adminPanel =
            document.getElementById(
                'admin-panel'
            );


        if (memberActions) {
            memberActions.style.display =
                'none';
        }


        if (adminPanel) {
            adminPanel.style.display =
                'none';
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


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'style',
                'class'
            ]
        }
    );

})();
