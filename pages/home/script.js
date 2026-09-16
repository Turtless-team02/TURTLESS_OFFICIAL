
(function(){
  const TARGET_DATE = '2026-10-24T00:00:00+09:00'; // 공식 정확한 대회일 확정 시 이 한 줄만 변경
  const target = new Date(TARGET_DATE);

  function makeHomeEnhancements(){
    const home=document.getElementById('page-home'), hero=document.getElementById('hero-slider');
    if(!home||!hero||document.getElementById('t-next-challenge')) return;
    const wrap=document.createElement('div');
    wrap.id='t-home-enhancements';
    wrap.innerHTML=`
      <section id="t-next-challenge" class="t-section t-countdown">
        <div class="t-wrap">
          <div class="t-count-head"><div><div class="t-kicker">NEXT CHALLENGE</div><h2 class="t-title">제2회 SSRC</h2><p class="t-desc">다음 도전을 향한 TURTLESS의 카운트다운</p></div><div class="t-date" id="t-count-date"></div></div>
          <div class="t-clock"><div class="t-time"><strong id="t-days">--</strong><span>DAYS</span></div><div class="t-time"><strong id="t-hours">--</strong><span>HOURS</span></div><div class="t-time"><strong id="t-minutes">--</strong><span>MINUTES</span></div><div class="t-time"><strong id="t-seconds">--</strong><span>SECONDS</span></div></div>
          <div class="t-status" id="t-count-status">대회까지 남은 시간</div>
        </div>
      </section>
      <section class="t-section alt"><div class="t-wrap"><div class="t-kicker">KEY ACHIEVEMENTS</div><h2 class="t-title">우리가 만들어온 결과</h2><div class="t-grid">
        <div class="t-card"><div class="t-card-num">01</div><h3>SSRC 종합우승</h3><p>제1회 서울학생로봇대회에서 종합우승을 기록했습니다.</p></div>
        <div class="t-card"><div class="t-card-num">02</div><h3>펀딩 피칭 3위</h3><p>SSRC Funding Pitching에서 3위를 기록하며 프로젝트 기획력을 보여주었습니다.</p></div>
        <div class="t-card"><div class="t-card-num">03</div><h3>FRC 경험</h3><p>호주 FRC 지역예선 경험을 바탕으로 글로벌 로봇 대회에 도전하고 있습니다.</p></div>
      </div></div></section>
      <section class="t-section"><div class="t-wrap t-about"><div class="t-about-main"><div class="t-kicker">ABOUT TURTLESS</div><h2 class="t-title">학교와 전공의 경계를 넘어, 로봇으로 연결됩니다.</h2><p>터틀리스는 서울학생로봇대회(SSRC)를 기반으로 로봇 개발뿐 아니라 전략·회계·마케팅·브랜딩까지 함께 경험하며 성장하는 고등학생 연합 로봇팀입니다. SSRC에서 쌓은 경험을 FRC 도전으로 확장하고 있습니다.</p><div class="t-flow"><span>SSRC</span><span>Project</span><span>FRC</span><span>Global Challenge</span></div><button class="t-link blue" onclick="location.href='./pages/intro-team/'">팀 소개 보기 →</button></div><div class="t-about-side"><div class="t-stat"><b>11379</b><span>FRC TEAM</span></div><div class="t-stat"><b>SSRC → FRC</b><span>도전의 흐름</span></div><div class="t-stat"><b>일반고</b><span>참여 학교의 차별성</span></div></div></div></section>
      <section class="t-section alt"><div class="t-wrap"><div class="t-kicker">OUR ROBOT</div><h2 class="t-title">우리가 만든 로봇</h2><p class="t-desc">시즌·게임·로봇 이름과 설명을 한 곳에서 확인하세요.</p><div id="t-robot-home-slot" style="margin-top:28px"></div><button class="t-link blue" onclick="location.href='./pages/robot/'">전체 로봇 보기 →</button></div></section>
      <section class="t-section"><div class="t-wrap"><div class="t-kicker">WHY TURTLESS</div><h2 class="t-title">세 가지 핵심가치</h2><div class="t-values"><div class="t-value"><i class="fa-solid fa-people-group"></i><h3>협력</h3><p>서로 다른 역할과 지식을 연결해 하나의 로봇과 프로젝트를 완성합니다.</p></div><div class="t-value"><i class="fa-solid fa-leaf"></i><h3>지속가능성</h3><p>기술의 결과가 새로운 문제를 만들지 않도록 환경과 사회적 영향을 함께 생각합니다.</p></div><div class="t-value"><i class="fa-solid fa-compass"></i><h3>초심</h3><p>처음의 책임감과 배우려는 자세를 잃지 않고 꾸준히 성장합니다.</p></div></div></div></section>
      <section class="t-section alt t-engineering-preview"><div class="t-wrap"><div class="t-kicker">ENGINEERING NOTE</div><h2 class="t-title">만들고, 기록하고, 다시 개선합니다.</h2><div class="t-preview"><div><div class="t-preview-meta" id="t-note-date">Engineering Note</div><h3 id="t-note-title">최근 Engineering Note를 불러오는 중...</h3></div><button class="t-link blue" onclick="location.href='./pages/engineering/'">VIEW ALL →</button></div></div></section>
      <section class="t-section"><div class="t-wrap"><div class="t-kicker">SOCIAL CONTRIBUTION / ESG</div><h2 class="t-title">로봇을 넘어, 우리가 살아가는 사회로</h2><div class="t-grid"><div class="t-card"><span class="t-mini-label">E</span><h3>환경</h3><p>해양 생태계 보호와 플로깅 등 환경 문제를 직접 관찰하고 행동으로 연결합니다.</p></div><div class="t-card"><span class="t-mini-label">S</span><h3>사회</h3><p>캔으로 달려요, 전자기기 활용 교육 등 다양한 세대와 지역사회를 연결합니다.</p></div><div class="t-card"><span class="t-mini-label">G</span><h3>거버넌스</h3><p>수평적 토론, 투표, 역할 분담과 규칙·안전 준수를 통해 함께 결정합니다.</p></div></div><button class="t-link" onclick="location.href='./pages/values-social/'">사회공헌 보기 →</button></div></section>
      <section class="t-section alt"><div class="t-wrap"><div class="t-kicker">PR GALLERY</div><h2 class="t-title">활동의 순간을 기록합니다.</h2><div id="t-gallery-home-slot" style="margin-top:25px"></div><button class="t-link blue" onclick="location.href='./pages/gallery/'">VIEW ALL →</button></div></section>
      <section class="t-section"><div class="t-wrap"><div class="t-kicker">SOCIAL</div><h2 class="t-title">TURTLESS를 더 가까이</h2><div class="t-social"><a href="https://www.instagram.com/turtless_11379" target="_blank"><div class="t-card"><i class="fa-brands fa-instagram" style="font-size:28px;color:#e1306c"></i><h3>Instagram</h3><p>TURTLESS의 활동과 일상을 사진으로 만나보세요.</p></div></a><a href="https://www.youtube.com/channel/UC8QwTy46OaCGdTauiPYkeow" target="_blank"><div class="t-card"><i class="fa-brands fa-youtube" style="font-size:28px;color:#f00"></i><h3>YouTube</h3><p>로봇과 팀 활동의 영상 콘텐츠를 확인하세요.</p></div></a><a href="https://www.tiktok.com/@turtless_11379" target="_blank"><div class="t-card"><i class="fa-brands fa-tiktok" style="font-size:28px"></i><h3>TikTok</h3><p>짧고 생생한 TURTLESS 콘텐츠를 만나보세요.</p></div></a></div></div></section>
      <section class="t-section alt"><div class="t-wrap"><div class="t-contact"><div><div class="t-kicker">CONTACT</div><h2 class="t-title">함께 도전할 파트너를 찾습니다.</h2><p>후원·협업·로봇 시연 등 TURTLESS와의 협력을 문의해주세요.</p></div><button class="t-link" onclick="location.href='./pages/sponsorship/'">후원문의 →</button></div></div></section>`;
    hero.insertAdjacentElement('afterend',wrap);
    const robot=document.getElementById('robot-slider'); if(robot) document.getElementById('t-robot-home-slot').appendChild(robot.cloneNode(true));
    const gallery=document.getElementById('home-gallery-4grid'); if(gallery) document.getElementById('t-gallery-home-slot').appendChild(gallery.cloneNode(true));
    updateCountdown(); setInterval(updateCountdown,1000); loadEngineeringPreview(); protectNames();
  }
  function updateCountdown(){const diff=target-new Date();const status=document.getElementById('t-count-status');const date=document.getElementById('t-count-date');if(!status)return;date.textContent='2026.10.24 예정';const setFlip=(id,value)=>{const el=document.getElementById(id);if(!el)return;const next=String(value).padStart(2,'0');if(el.textContent!==next){el.textContent=next;el.classList.remove('is-flipping');void el.offsetWidth;el.classList.add('is-flipping');setTimeout(()=>el.classList.remove('is-flipping'),540);}};if(diff<=0){setFlip('t-days','00');setFlip('t-hours','00');setFlip('t-minutes','00');setFlip('t-seconds','00');status.textContent=diff>-86400000?'D-DAY':'대회가 종료되었습니다.';return;}const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);setFlip('t-days',d);setFlip('t-hours',h);setFlip('t-minutes',m);setFlip('t-seconds',s);status.textContent='대회까지 남은 시간';}
  async function loadEngineeringPreview(){try{const r=await fetch('https://turtless-team02.github.io/TURTLESS_OFFICIAL/engineering_note.mht');const txt=await r.text();const title=(txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1];const date=(txt.match(/20\d{2}[./-]\d{1,2}[./-]\d{1,2}/)||[])[0];if(title)document.getElementById('t-note-title').textContent=title.replace(/<[^>]+>/g,'').trim();if(date)document.getElementById('t-note-date').textContent=date;}catch(e){document.getElementById('t-note-title').textContent='Engineering Note';}}
  function protectNames(){const protectedTerms=['TURTLESS','터틀리스','SSRC','FRC','Team 11379','11379'];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{if(!n.nodeValue.trim()||n.parentElement.closest('script,style,textarea,input,.notranslate,[contenteditable="true"]'))return;let text=n.nodeValue;let changed=false;protectedTerms.forEach(term=>{if(text.includes(term))changed=true});if(!changed)return;const frag=document.createDocumentFragment();let rest=text;protectedTerms.sort((a,b)=>b.length-a.length).forEach(term=>{const parts=rest.split(term);if(parts.length===1)return;parts.forEach((part,i)=>{if(part)frag.appendChild(document.createTextNode(part));if(i<parts.length-1){const span=document.createElement('span');span.className='notranslate';span.setAttribute('translate','no');span.textContent=term;frag.appendChild(span)}});rest=''});if(rest)frag.appendChild(document.createTextNode(rest));if(frag.childNodes.length)n.parentNode.replaceChild(frag,n);});document.querySelectorAll('.robot-name,.sp-right h3,[alt="TURTLESS"]').forEach(el=>{el.classList.add('notranslate');el.setAttribute('translate','no')});}
  document.addEventListener('DOMContentLoaded',()=>{makeHomeEnhancements();setTimeout(protectNames,1500);});
  const obs=new MutationObserver(()=>{clearTimeout(window.__tProtect);window.__tProtect=setTimeout(protectNames,250)});obs.observe(document.body,{childList:true,subtree:true});
})();



(function(){
  const ids=['t-days','t-hours','t-minutes','t-seconds'];
  function watchCountdown(){
    ids.forEach(id=>{
      const el=document.getElementById(id); if(!el || el.dataset.tWatch==='1') return;
      el.dataset.tWatch='1';
      let old=el.textContent;
      const obs=new MutationObserver(()=>{
        if(el.textContent===old)return;
        old=el.textContent;
        el.classList.remove('counting-change');
        void el.offsetWidth;
        el.classList.add('counting-change');
      });
      obs.observe(el,{childList:true,characterData:true,subtree:true});
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    watchCountdown();
    setInterval(watchCountdown,1000);
  });
})();



(function(){
  const TARGET_DATE='2026-10-24T00:00:00+09:00';
  let initialized=false;
  function setDigit(id,next,animate){
    const card=document.getElementById(id);
    const digit=card?.querySelector('.t-digit');
    if(!card||!digit||digit.textContent===next)return;
    digit.textContent=next;
    if(animate){
      card.classList.remove('is-flipping');
      void card.offsetWidth;
      card.classList.add('is-flipping');
      setTimeout(()=>card.classList.remove('is-flipping'),520);
    }
  }
  function update(first=false){
    const diff=new Date(TARGET_DATE).getTime()-Date.now();
    const date=document.getElementById('t-countdown-date');
    if(diff<=0){
      ['days','hours','minutes','seconds'].forEach(k=>setDigit('t-'+k,'00',!first));
      if(date)date.textContent='SSRC 2026 · D-DAY';
      return;
    }
    const v={
      days:String(Math.floor(diff/86400000)).padStart(2,'0'),
      hours:String(Math.floor((diff%86400000)/3600000)).padStart(2,'0'),
      minutes:String(Math.floor((diff%3600000)/60000)).padStart(2,'0'),
      seconds:String(Math.floor((diff%60000)/1000)).padStart(2,'0')
    };
    Object.entries(v).forEach(([k,val])=>setDigit('t-'+k,val,!first));
    if(date)date.textContent='SSRC 2026';
  }
  function init(){
    if(initialized||!document.getElementById('t-flip-clock'))return;
    initialized=true; update(true); setInterval(()=>update(false),1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();



(function(){
  function initTurtlessNumbers(){
    const section=document.querySelector('.turtless-numbers-section');
    if(!section || section.dataset.numberMotionReady) return;
    section.dataset.numberMotionReady='1';
    if(!('IntersectionObserver' in window)){ section.classList.add('numbers-visible'); return; }
    const io=new IntersectionObserver((entries,observer)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          section.classList.add('numbers-visible');
          observer.unobserve(section);
        }
      });
    },{threshold:.22,rootMargin:'0px 0px -8% 0px'});
    io.observe(section);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initTurtlessNumbers);
  else initTurtlessNumbers();
})();
