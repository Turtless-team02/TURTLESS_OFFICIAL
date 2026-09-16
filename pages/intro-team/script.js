
(function(){
  function initNotebook(){
    const track=document.getElementById('team-notebook-pages');
    const prev=document.getElementById('team-notebook-prev');
    const next=document.getElementById('team-notebook-next');
    const dots=[...document.querySelectorAll('.team-notebook-dot')];
    if(!track||!prev||!next||!dots.length||track.dataset.ready==='1') return;
    track.dataset.ready='1';
    const pages=[...track.querySelectorAll('.team-note-page')];
    let index=0, startX=0, deltaX=0, dragging=false, animating=false;

    function render(animate=true, direction=0){
      pages.forEach((page,i)=>{
        page.classList.remove('is-current','is-before','is-after','is-turning-next','is-turning-prev');
        page.style.transition=animate
          ? 'transform .72s cubic-bezier(.2,.78,.22,1), opacity .55s ease, box-shadow .72s ease'
          : 'none';

        if(i===index){
          page.classList.add('is-current');
          page.style.transform='translate3d(0,0,0) rotateZ(0deg)';
          page.style.opacity='1';
          page.style.zIndex='6';
        }else if(i<index){
          page.classList.add('is-before');
          page.style.transform='translate3d(-6px,6px,0) rotateZ(-0.6deg)';
          page.style.opacity='1';
          page.style.zIndex=String(3+i);
        }else{
          page.classList.add('is-after');
          const offset=(i-index)*8;
          const y=(i-index)*5.5;
          const r=(i-index)*0.45;
          page.style.transform='translate3d('+offset+'px,'+y+'px,0) rotateZ('+r+'deg)';
          page.style.opacity='1';
          page.style.zIndex=String(5-i);
        }
      });
      if(animate && direction!==0){
        const current=pages[index];
        current.classList.add(direction>0?'is-turning-next':'is-turning-prev');
      }
      /* 양 끝에서 끊기지 않고 마지막↔처음이 순환하도록 버튼은 항상 활성화 */
      prev.disabled=false;
      next.disabled=false;
      dots.forEach((dot,i)=>{
        dot.classList.toggle('active',i===index);
        dot.setAttribute('aria-selected',i===index?'true':'false');
      });
      window.updateTurtlessNotebookHeight?.();
    }

    function go(n){
      if(animating)return;
      if(!pages.length)return;
      /* 마지막 → 처음 / 처음 → 마지막 순환 */
      const nextIndex=((n % pages.length)+pages.length)%pages.length;
      if(nextIndex===index)return;
      const direction=(nextIndex>index || (index===pages.length-1 && nextIndex===0))?1:-1;
      animating=true;
      index=nextIndex;
      render(true,direction);
      window.setTimeout(()=>{animating=false;render(false,0)},760);
    }

    prev.addEventListener('click',()=>go(index-1));
    next.addEventListener('click',()=>go(index+1));
    dots.forEach(dot=>dot.addEventListener('click',()=>go(Number(dot.dataset.page))));

    track.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' && e.button!==0)return;
      if(animating)return;
      dragging=true;startX=e.clientX;deltaX=0;
      track.classList.add('dragging');
      track.setPointerCapture?.(e.pointerId);
    });
    track.addEventListener('pointermove',e=>{if(dragging)deltaX=e.clientX-startX});
    const release=e=>{
      if(!dragging)return;
      dragging=false;track.classList.remove('dragging');
      if(Math.abs(deltaX)>55)go(index+(deltaX<0?1:-1));
      else render(true,0);
      try{track.releasePointerCapture?.(e.pointerId)}catch(_){ }
    };
    track.addEventListener('pointerup',release);
    track.addEventListener('pointercancel',release);
    document.addEventListener('keydown',e=>{
      const section=document.getElementById('page-intro_team');
      if(!section||!section.classList.contains('active'))return;
      if(e.key==='ArrowLeft')go(index-1);
      if(e.key==='ArrowRight')go(index+1);
    });
    render(false,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initNotebook);else initNotebook();
  window.initTurtlessTeamNotebook=initNotebook;
})();



(function(){
  function initNotebookHeight(){
    const track=document.getElementById('team-notebook-pages');
    if(!track) return;
    const pages=[...track.querySelectorAll('.team-note-page')];
    const current=pages.find(p=>p.classList.contains('is-current')) || pages[0];
    if(!current) return;
    const h=Math.max(660,current.scrollHeight+8);
    track.style.height=h+'px';
  }
  function bind(){
    const track=document.getElementById('team-notebook-pages');
    if(!track || track.dataset.heightBound==='1') return;
    track.dataset.heightBound='1';
    const resize=()=>window.requestAnimationFrame(initNotebookHeight);
    window.addEventListener('resize',resize,{passive:true});
    const ro=window.ResizeObserver ? new ResizeObserver(resize) : null;
    if(ro) track.querySelectorAll('.team-note-page').forEach(p=>ro.observe(p));
    track.querySelectorAll('.editable-content').forEach(el=>{
      el.addEventListener('input',resize);
      el.addEventListener('keyup',resize);
    });
    setTimeout(resize,80);
    setTimeout(resize,400);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind);
  else bind();
  window.updateTurtlessNotebookHeight=initNotebookHeight;
})();



(function(){
  function fitNotebook(){
    const section=document.getElementById('page-intro_team');
    const track=document.getElementById('team-notebook-pages');
    if(!section||!track)return;
    const pages=[...track.querySelectorAll('.team-note-page')];
    if(!pages.length)return;
    /* 모든 페이지를 같은 높이로 유지한다. 현재 디자인의 카드 높이를 기준으로 내용은 글자 크기로 압축한다. */
    const writing=document.getElementById('b-intro_team_note');
    const intro=document.getElementById('b-intro_team');
    section.classList.remove('team-notebook-compact-1','team-notebook-compact-2','team-notebook-compact-3','team-notebook-compact-4');
    const targets=[intro,writing].filter(Boolean);
    const limit=window.innerWidth<=520?470:(window.innerWidth<=800?500:535);
    let level=0;
    for(let i=0;i<targets.length;i++){
      if(targets[i].scrollHeight>limit)level=Math.max(level,1);
    }
    if(level===1){
      section.classList.add('team-notebook-compact-1');
      if(targets.some(el=>el.scrollHeight>limit))level=2;
    }
    if(level===2){
      section.classList.remove('team-notebook-compact-1');section.classList.add('team-notebook-compact-2');
      if(targets.some(el=>el.scrollHeight>limit))level=3;
    }
    if(level===3){
      section.classList.remove('team-notebook-compact-2');section.classList.add('team-notebook-compact-3');
      if(targets.some(el=>el.scrollHeight>limit))level=4;
    }
    if(level===4){
      section.classList.remove('team-notebook-compact-3');section.classList.add('team-notebook-compact-4');
    }
    /* 세 페이지 모두 같은 실제 높이. 한 장만 길어져서 카드가 길어지는 현상을 막는다. */
    const h=window.innerWidth<=520?600:(window.innerWidth<=800?625:660);
    track.style.height=h+'px';
    pages.forEach(p=>p.style.height=h+'px');
  }
  function bind(){
    if(window.__turtlessNotebookV40Bound)return;
    window.__turtlessNotebookV40Bound=true;
    const run=()=>requestAnimationFrame(()=>requestAnimationFrame(fitNotebook));
    window.addEventListener('resize',run,{passive:true});
    document.addEventListener('input',e=>{if(e.target.closest('#page-intro_team'))run()});
    document.addEventListener('keyup',e=>{if(e.target.closest('#page-intro_team'))run()});
    const track=document.getElementById('team-notebook-pages');
    if(track&&window.ResizeObserver){const ro=new ResizeObserver(run);track.querySelectorAll('.editable-content').forEach(el=>ro.observe(el));}
    setTimeout(run,100);setTimeout(run,500);setTimeout(run,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();



function updateTeamColor(index){
  const input = document.getElementById(`team-color-hex-${index}`);
  const swatch = document.getElementById(`team-color-swatch-${index}`);

  if(!input || !swatch) return;

  let hex = input.value.trim();

  if(hex && !hex.startsWith("#")){
    hex = "#" + hex;
  }

  if(/^#[0-9A-Fa-f]{6}$/.test(hex)){
    swatch.style.backgroundColor = hex;
    input.style.borderColor = "";
  }else if(hex === ""){
    swatch.style.backgroundColor = "#EDF0F2";
    input.style.borderColor = "";
  }else{
    input.style.borderColor = "#d66";
  }
}

document.addEventListener("DOMContentLoaded", function(){
  for(let i = 1; i <= 4; i++){
    updateTeamColor(i);
  }

  const syncTeamColorInputs = () => {
    const editing = document.body.classList.contains("edit-mode");
    document.querySelectorAll(".team-color-hex").forEach(el => {
      el.disabled = !editing;
      el.style.display = "";
    });
  };

  syncTeamColorInputs();

  new MutationObserver(syncTeamColorInputs).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });
});
