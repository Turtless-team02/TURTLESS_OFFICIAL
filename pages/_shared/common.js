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

        if (!node || node.nodeType !== Node.TEXT_NODE) return false;
        if (!node.textContent || !node.textContent.trim()) return false;

        const element = node.parentElement;
        if (!element) return false;

        if (element.closest(interactiveSelector)) return false;

        const style = window.getComputedStyle(element);

        if (
            style.userSelect === "none" ||
            style.webkitUserSelect === "none"
        ) {
            return false;
        }

        return true;
    }

    function updateCursor(x, y) {
        const body = document.body;
        if (!body) return;

        const element = document.elementFromPoint(x, y);

        if (!element) {
            body.classList.remove("turtless-text-cursor");
            return;
        }

        if (element.closest(interactiveSelector)) {
            body.classList.remove("turtless-text-cursor");
            return;
        }

        if (isRealSelectableText(x, y)) {
            body.classList.add("turtless-text-cursor");
        } else {
            body.classList.remove("turtless-text-cursor");
        }
    }

    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        updateCursor(mouseX, mouseY);
    }, { passive: true });

    document.addEventListener("mouseover", function (e) {
        if (!e.target) return;
        updateCursor(mouseX, mouseY);
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
        document.body.classList.remove("turtless-text-cursor");
    });

    /* =========================================================
       TURTLESS 마우스 거북이 트레일
       ========================================================= */

    const isTouchDevice =
        window.matchMedia &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;

    if (!isTouchDevice) {
        let trail = document.getElementById("turtless-mouse-trail");

        if (!trail) {
            trail = document.createElement("img");
            trail.id = "turtless-mouse-trail";
            trail.src = "./turtless-trail.png";
            trail.alt = "";
            trail.setAttribute("aria-hidden", "true");

            Object.assign(trail.style, {
                position: "fixed",
                left: "0",
                top: "0",
                width: "28px",
                height: "28px",
                pointerEvents: "none",
                zIndex: "999999",
                opacity: "0.8",
                display: "none",
                transform: "translate(-50%, -50%)",
                transition: "transform 0.08s linear",
            });

            document.body.appendChild(trail);
        }

        document.addEventListener("mousemove", function (e) {
            if (!trail) return;

            trail.style.display = "block";
            trail.style.left = e.clientX + "px";
            trail.style.top = e.clientY + "px";
        }, { passive: true });

        document.addEventListener("mouseleave", function () {
            if (trail) trail.style.display = "none";
        });
    }

    /* =========================================================
       공통 모달 닫기
       ========================================================= */

    document.addEventListener("click", function (e) {
        const target = e.target;

        if (
            target &&
            target.classList &&
            target.classList.contains("modal-overlay")
        ) {
            target.style.display = "none";
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;

        const modals = document.querySelectorAll(".modal-overlay");

        modals.forEach(function (modal) {
            const style = window.getComputedStyle(modal);

            if (
                style.display === "flex" ||
                style.display === "block"
            ) {
                modal.style.display = "none";
            }
        });
    });

    /* =========================================================
       공통 이미지 오류 처리
       ========================================================= */

    document.addEventListener(
        "error",
        function (e) {
            const img = e.target;

            if (!img || img.tagName !== "IMG") return;
            if (img.dataset.fallbackApplied === "true") return;

            img.dataset.fallbackApplied = "true";

            const fallback =
                img.dataset.fallback ||
                "./assets/logo.png";

            if (img.src !== fallback) {
                img.src = fallback;
            }
        },
        true
    );

    /* =========================================================
       공통 스크롤 애니메이션
       ========================================================= */

    function initRevealAnimation() {
        const targets = document.querySelectorAll(
            ".reveal, .fade-up, .scroll-reveal"
        );

        if (!targets.length) return;

        if (!("IntersectionObserver" in window)) {
            targets.forEach(function (el) {
                el.classList.add("visible", "show", "active");
            });
            return;
        }

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "visible",
                            "show",
                            "active"
                        );

                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.08,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        targets.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* =========================================================
       모바일 메뉴
       ========================================================= */

    function initMobileMenu() {
        const hamburger =
            document.querySelector(".hamburger") ||
            document.getElementById("hamburger");

        const nav =
            document.querySelector(".nav-menu") ||
            document.querySelector(".main-nav") ||
            document.querySelector("nav ul");

        if (!hamburger || !nav) return;

        hamburger.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            hamburger.classList.toggle("active");
            nav.classList.toggle("active");
            document.body.classList.toggle("menu-open");
        });

        nav.addEventListener("click", function (e) {
            const link = e.target.closest("a");

            if (!link) return;

            hamburger.classList.remove("active");
            nav.classList.remove("active");
            document.body.classList.remove("menu-open");
        });

        document.addEventListener("click", function (e) {
            if (
                !nav.contains(e.target) &&
                !hamburger.contains(e.target)
            ) {
                hamburger.classList.remove("active");
                nav.classList.remove("active");
                document.body.classList.remove("menu-open");
            }
        });
    }

    /* =========================================================
       현재 페이지 네비게이션 활성화
       ========================================================= */

    function initActiveNavigation() {
        const currentPath =
            window.location.pathname
                .replace(/\/+$/, "")
                .toLowerCase();

        const links = document.querySelectorAll(
            "nav a, header a, .nav-menu a"
        );

        links.forEach(function (link) {
            const href = link.getAttribute("href");

            if (!href || href.startsWith("#")) return;

            let linkPath = "";

            try {
                linkPath = new URL(
                    href,
                    window.location.href
                ).pathname
                    .replace(/\/+$/, "")
                    .toLowerCase();
            } catch (_) {
                return;
            }

            if (
                linkPath === currentPath ||
                (
                    linkPath !== "/" &&
                    currentPath.startsWith(linkPath)
                )
            ) {
                link.classList.add("active");
            }
        });
    }

    /* =========================================================
       이미지 lazy loading
       ========================================================= */

    function initLazyImages() {
        const images = document.querySelectorAll(
            "img:not([loading])"
        );

        images.forEach(function (img) {
            img.setAttribute("loading", "lazy");
            img.setAttribute("decoding", "async");
        });
    }

    /* =========================================================
       버튼 ripple 효과
       ========================================================= */

    function initButtonEffects() {
        document.addEventListener("click", function (e) {
            const button = e.target.closest(
                "button, .action-btn, .dash-btn, .dash-btn-sm"
            );

            if (!button) return;

            const rect = button.getBoundingClientRect();

            const ripple = document.createElement("span");

            ripple.className = "turtless-ripple";

            const size = Math.max(
                rect.width,
                rect.height
            );

            ripple.style.width = size + "px";
            ripple.style.height = size + "px";

            ripple.style.left =
                e.clientX -
                rect.left -
                size / 2 +
                "px";

            ripple.style.top =
                e.clientY -
                rect.top -
                size / 2 +
                "px";

            button.appendChild(ripple);

            setTimeout(function () {
                ripple.remove();
            }, 600);
        });
    }

    /* =========================================================
       외부 링크 처리
       ========================================================= */

    function initExternalLinks() {
        const links = document.querySelectorAll("a[href]");

        links.forEach(function (link) {
            const href = link.getAttribute("href");

            if (!href) return;

            if (
                href.startsWith("http://") ||
                href.startsWith("https://")
            ) {
                try {
                    const url = new URL(href);

                    if (
                        url.hostname !==
                        window.location.hostname
                    ) {
                        link.setAttribute(
                            "target",
                            "_blank"
                        );

                        link.setAttribute(
                            "rel",
                            "noopener noreferrer"
                        );
                    }
                } catch (_) {}
            }
        });
    }

    /* =========================================================
       페이지 로딩 상태
       ========================================================= */

    function initPageLoading() {
        document.documentElement.classList.add(
            "turtless-page-ready"
        );

        document.body.classList.add(
            "turtless-page-ready"
        );
    }

    /* =========================================================
       공통 이미지 확대
       ========================================================= */

    function initImageViewer() {
        const images = document.querySelectorAll(
            "[data-lightbox], .zoomable-image"
        );

        if (!images.length) return;

        let viewer =
            document.getElementById(
                "turtless-image-viewer"
            );

        if (!viewer) {
            viewer = document.createElement("div");
            viewer.id = "turtless-image-viewer";

            viewer.innerHTML = `
                <div class="turtless-image-viewer-inner">
                    <button
                        type="button"
                        class="turtless-image-viewer-close"
                        aria-label="닫기"
                    >×</button>
                    <img alt="">
                </div>
            `;

            document.body.appendChild(viewer);
        }

        const viewerImage =
            viewer.querySelector("img");

        const closeViewer = function () {
            viewer.classList.remove("active");
            document.body.classList.remove(
                "image-viewer-open"
            );
        };

        viewer.addEventListener("click", function (e) {
            if (
                e.target === viewer ||
                e.target.classList.contains(
                    "turtless-image-viewer-inner"
                )
            ) {
                closeViewer();
            }
        });

        const closeButton =
            viewer.querySelector(
                ".turtless-image-viewer-close"
            );

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closeViewer
            );
        }

        images.forEach(function (img) {
            img.addEventListener("click", function (e) {
                e.preventDefault();

                const src =
                    img.dataset.lightbox ||
                    img.currentSrc ||
                    img.src;

                if (!src) return;

                viewerImage.src = src;
                viewer.classList.add("active");

                document.body.classList.add(
                    "image-viewer-open"
                );
            });
        });
    }

    /* =========================================================
       회원 관리 관련 공통 보조 기능
       ========================================================= */

    function initMemberAdminHelpers() {
        const observerTarget = document.body;

        if (!observerTarget) return;

        const observer = new MutationObserver(
            function () {
                const buttons =
                    document.querySelectorAll(
                        "[data-member-admin]"
                    );

                buttons.forEach(function (button) {
                    if (
                        button.dataset.memberHelperReady ===
                        "true"
                    ) {
                        return;
                    }

                    button.dataset.memberHelperReady =
                        "true";
                });
            }
        );

        observer.observe(observerTarget, {
            childList: true,
            subtree: true
        });
    }

    /* =========================================================
       공통 폼 Enter 처리
       ========================================================= */

    function initFormEnterHandling() {
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Enter") return;

            const target = e.target;

            if (
                !target ||
                target.tagName !== "INPUT"
            ) {
                return;
            }

            if (
                target.type === "submit" ||
                target.type === "button"
            ) {
                return;
            }

            const form = target.closest("form");

            if (!form) return;

            const submit =
                form.querySelector(
                    'button[type="submit"], input[type="submit"]'
                );

            if (submit) {
                e.preventDefault();
                submit.click();
            }
        });
    }

    /* =========================================================
       공통 새로고침 방지
       ========================================================= */

    function initButtonTypeSafety() {
        const buttons =
            document.querySelectorAll(
                "button:not([type])"
            );

        buttons.forEach(function (button) {
            const form = button.closest("form");

            if (form) {
                button.setAttribute(
                    "type",
                    "button"
                );
            }
        });
    }

    /* =========================================================
       전역 유틸
       ========================================================= */

    window.TURTLESS = window.TURTLESS || {};

    window.TURTLESS.escapeHtml = function (value) {
        if (value === null || value === undefined) {
            return "";
        }

        const div = document.createElement("div");
        div.textContent = String(value);

        return div.innerHTML;
    };

    window.TURTLESS.formatDate = function (
        value,
        fallback = ""
    ) {
        if (!value) return fallback;

        let date = null;

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else if (value instanceof Date) {
            date = value;
        } else {
            date = new Date(value);
        }

        if (
            !date ||
            Number.isNaN(date.getTime())
        ) {
            return fallback;
        }

        return new Intl.DateTimeFormat(
            "ko-KR",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(date);
    };

    window.TURTLESS.debounce = function (
        fn,
        delay
    ) {
        let timer = null;

        return function (...args) {
            clearTimeout(timer);

            timer = setTimeout(
                function () {
                    fn.apply(this, args);
                }.bind(this),
                delay
            );
        };
    };

    window.TURTLESS.isMobile = function () {
        return window.matchMedia(
            "(max-width: 768px)"
        ).matches;
    };

    /* =========================================================
       초기화
       ========================================================= */

    function init() {
        initRevealAnimation();
        initMobileMenu();
        initActiveNavigation();
        initLazyImages();
        initButtonEffects();
        initExternalLinks();
        initPageLoading();
        initImageViewer();
        initMemberAdminHelpers();
        initFormEnterHandling();
        initButtonTypeSafety();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }
})();
