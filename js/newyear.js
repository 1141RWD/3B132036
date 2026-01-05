// js/newyear.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) 只要有畫面就加一層 confetti canvas（不會影響點擊）
  const canvas = document.createElement("canvas");
  canvas.id = "confettiCanvas";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resize(){
    canvas.width = Math.floor(window.innerWidth * DPR);
    canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // 2) 紙屑粒子（紅金白）
  const COLORS = ["#ff3b3b", "#ffd166", "#fff7e6", "#ffb703", "#e11d48"];
  const particles = [];
  const COUNT = Math.min(120, Math.floor(window.innerWidth / 10));

  function rand(a,b){ return a + Math.random()*(b-a); }

  for(let i=0;i<COUNT;i++){
    particles.push({
      x: rand(0, window.innerWidth),
      y: rand(-window.innerHeight, 0),
      w: rand(4, 9),
      h: rand(6, 14),
      r: rand(0, Math.PI*2),
      vr: rand(-0.04, 0.04),
      vx: rand(-0.5, 0.5),
      vy: rand(0.8, 2.2),
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
      alpha: rand(0.65, 0.95)
    });
  }

  let last = performance.now();
  function tick(now){
    const dt = Math.min(33, now - last);
    last = now;

    ctx.clearRect(0,0,window.innerWidth, window.innerHeight);

    for(const p of particles){
      p.x += p.vx * (dt/16);
      p.y += p.vy * (dt/16);
      p.r += p.vr * (dt/16);

      // 風吹
      p.x += Math.sin((p.y/80) + now/1200) * 0.25;

      // 出界重生
      if(p.y > window.innerHeight + 20){
        p.y = rand(-60, -10);
        p.x = rand(0, window.innerWidth);
      }
      if(p.x < -40) p.x = window.innerWidth + 40;
      if(p.x > window.innerWidth + 40) p.x = -40;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // 3) 首頁文案（有就替換，不存在就略過）
  const h1 = document.querySelector(".hero h1");
  const p = document.querySelector(".hero .muted");
  if(h1) h1.textContent = "元旦新年限定｜新年好運商城";
  if(p) p.textContent = "致力於打造成熟穩定的運動商品交易平台";

  // 4) 小提示
  if(window.MiniShop?.toast){
    MiniShop.toast("", "🎉 元旦模式已啟用", "祝你新年快樂，逛街順利～");
  }
});
