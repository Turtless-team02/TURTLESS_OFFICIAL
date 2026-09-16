
  (function() {
    fetch('https://turtless-team02.github.io/TURTLESS_OFFICIAL/engineering_note.mht')
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(async mhtmlData => {
        const viewer = document.getElementById('mhtml-viewer');
        if (!viewer) return;

        let converted = mhtml2html.convert(mhtmlData);
        if (converted && typeof converted.then === 'function') {
          converted = await converted;
        }

const targetDoc = converted.documentElement ? converted : (converted.document || converted);
if (targetDoc && targetDoc.querySelectorAll) {
  const imgs = targetDoc.querySelectorAll('img');
  for (const img of imgs) {
    const rawSrc = img.getAttribute('src') || img.src || '';
    const blobIndex = rawSrc.indexOf('blob:');
    
    if (blobIndex !== -1) {
      const cleanBlobUrl = rawSrc.substring(blobIndex);
      try {
        const res = await fetch(cleanBlobUrl);
        const blob = await res.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        img.setAttribute('src', base64);
      } catch (e) {}
    }
  }
}


        
        // 객체 내부 구조를 순회하여 순수 HTML 텍스트를 자동 추출
        function getHtmlString(data) {
          if (!data) return '';
          if (typeof data === 'string') return data;
          if (data.documentElement) return data.documentElement.outerHTML;
          if (data.document && data.document.documentElement) return data.document.documentElement.outerHTML;
          if (data.window && data.window.document) return data.window.document.documentElement.outerHTML;
          
          for (let k in data) {
            try {
              const val = data[k];
              if (typeof val === 'string' && val.includes('<')) return val;
              if (val && val.documentElement) return val.documentElement.outerHTML;
            } catch (e) {}
          }
          return '';
        }

        const htmlContent = getHtmlString(converted);

        if (!htmlContent) {
          throw new Error('변환된 데이터에서 HTML을 읽을 수 없습니다.');
        }

        // iframe 내부에 HTML 렌더링
        viewer.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        viewer.appendChild(iframe);

        const destDoc = iframe.contentWindow.document;
        destDoc.open();
        destDoc.write('<script>document.addEventListener("error",function(e){if(e.target.tagName==="IMG")e.target.style.display="none";},true);<\/script><style>* { overflow: visible !important; max-height: none !important; } html, body { overflow: auto !important; height: auto !important; -webkit-overflow-scrolling: touch; }</style>' + htmlContent);
        destDoc.close();
      })
      .catch(err => {
        const viewer = document.getElementById('mhtml-viewer');
        if (viewer) {
          viewer.innerHTML = '<p style="padding: 20px; color: red;">변환 실패: ' + err.message + '</p>';
        }
      });
  })();



  function fixEngineeringNote() {
    const engNote = document.getElementById('engineering_note');
    if (!engNote) return;

    // 엔지니어링 노트를 제외한 다른 서브페이지가 active 상태인지 확인
    const otherActiveTab = document.querySelector('.subpage.active:not(#engineering_note)');

    if (otherActiveTab) {
      // 다른 탭(소개, 가치관 등)이 열려있을 때만 숨김
      engNote.style.setProperty('display', 'none', 'important');
    } else {
      // 메인 화면(다른 active 탭 없음)이거나 엔지니어링 노트 탭일 때 강제 표시
      engNote.style.setProperty('display', 'block', 'important');
    }
  }

  // 클릭 발생 및 탭 클래스 변경 시 자동 동작
  document.addEventListener('click', () => setTimeout(fixEngineeringNote, 30));
  new MutationObserver(fixEngineeringNote).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });

  // 페이지 첫 로드 시 바로 실행
  fixEngineeringNote();



/* =========================================================
   ENGINEERING NOTE MOBILE FIX
   MHT -> iframe 생성 후 내부에도 모바일 CSS 적용
   ========================================================= */

(function () {

    function fixEngineeringIframe(iframe) {

        if (!iframe || iframe.dataset.mobileFixed === '1') {
            return;
        }

        function applyFix() {

            try {

                const doc = iframe.contentDocument;

                if (!doc || !doc.head) {
                    return;
                }

                iframe.dataset.mobileFixed = '1';


                /* -------------------------------------------------
                   모바일 viewport
                   ------------------------------------------------- */

                let viewport = doc.querySelector(
                    'meta[name="viewport"]'
                );

                if (!viewport) {

                    viewport = doc.createElement('meta');

                    viewport.name = 'viewport';

                    doc.head.appendChild(viewport);
                }

                viewport.setAttribute(
                    'content',
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0'
                );


                /* -------------------------------------------------
                   모바일 CSS
                   ------------------------------------------------- */

                const style = doc.createElement('style');

                style.textContent = `

                    * {
                        box-sizing: border-box !important;
                    }

                    html,
                    body {
                        width: 100% !important;
                        min-width: 0 !important;
                        max-width: 100% !important;
                        overflow-x: hidden !important;
                    }

                    img {
                        max-width: 100% !important;
                        height: auto !important;
                    }

                    table {
                        max-width: 100% !important;
                    }


                    @media (max-width: 768px) {

                        body {
                            font-size: 15px !important;
                        }


                        /* 고정 min-width 제거 */

                        [style*="min-width"] {
                            min-width: 0 !important;
                        }


                        /* 지나치게 넓은 고정 폭 요소 */

                        [style*="width: 1000px"],
                        [style*="width: 1100px"],
                        [style*="width: 1200px"] {
                            width: 100% !important;
                            max-width: 100% !important;
                        }


                        /* 긴 텍스트 줄바꿈 */

                        p,
                        div,
                        span,
                        a,
                        h1,
                        h2,
                        h3,
                        h4,
                        h5,
                        h6 {
                            overflow-wrap: break-word !important;
                            word-break: normal !important;
                        }


                        /* 링크 */

                        a {
                            max-width: 100% !important;
                        }


                        /* 노션 계열 콘텐츠 */

                        .notion-page-content,
                        .notion-frame,
                        .notion-selectable {
                            width: 100% !important;
                            max-width: 100% !important;
                        }

                    }
                `;

                doc.head.appendChild(style);

            } catch (e) {
                /* iframe이 아직 로드되지 않았으면 무시 */
            }
        }


        /* iframe 로드 완료 */

        iframe.addEventListener('load', applyFix);


        /* 이미 로드되어 있는 경우 */

        setTimeout(applyFix, 100);
        setTimeout(applyFix, 500);
    }


    /* =====================================================
       엔지니어링 노트 iframe 감시
       ===================================================== */

    const observer = new MutationObserver(function () {

        const viewer = document.getElementById('mhtml-viewer');

        if (!viewer) {
            return;
        }

        const iframe = viewer.querySelector('iframe');

        if (iframe) {
            fixEngineeringIframe(iframe);
        }

    });


    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
