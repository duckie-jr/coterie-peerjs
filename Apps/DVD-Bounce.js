// @name        DVD Bounce
// @icon        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#111"/><text x="12" y="16" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="7" font-weight="900" fill="#3bffff">DVD</text></svg>
// @description The classic bouncing DVD logo screensaver. Will it hit the corner?

(function () {
  const LOGO_W  = 140;
  const LOGO_H  =  70;
  const COLORS  = ['#ff3b3b', '#3bff6e', '#3b8fff', '#ffee3b', '#ff3bff', '#3bffff', '#ff8c3b', '#c03bff'];

  let colorIndex = 2;
  let cornerHits = 0;
  let posX       = 160;
  let posY       = 100;
  let velX       =   2;
  let velY       =   2;
  let paused     = false;
  let rafId      = null;

  // ── Styles ─────────────────────────────────────────────────
  document.head.insertAdjacentHTML('beforeend', `<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #000;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', system-ui, Arial, sans-serif;
      user-select: none;
    }

    .screen {
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: none;
    }

    .dvd-logo {
      position: absolute;
      top: 0;
      left: 0;
      width: ${LOGO_W}px;
      height: ${LOGO_H}px;
      will-change: transform;
    }

    .dvd-logo svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 8px currentColor);
    }

    .corner-flash {
      position: absolute;
      inset: 0;
      background: #fff;
      opacity: 0;
      pointer-events: none;
      z-index: 10;
    }
    .corner-flash.pop {
      animation: cf-pop 0.45s ease-out forwards;
    }
    @keyframes cf-pop {
      0%   { opacity: 0.7; }
      100% { opacity: 0; }
    }

    .corner-toast {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      font-size: 52px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #fff;
      text-shadow: 0 0 20px #ffee3b, 0 0 50px #ffee3b;
      pointer-events: none;
      opacity: 0;
      z-index: 20;
    }
    .corner-toast.pop {
      animation: toast-pop 1.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }
    @keyframes toast-pop {
      0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      35%  { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
      65%  { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1);   opacity: 0; }
    }

    .hud {
      position: absolute;
      bottom: 14px;
      right: 18px;
      text-align: right;
      pointer-events: none;
      z-index: 5;
    }
    .hud-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #1c1c1c;
    }
    .hud-count {
      font-size: 40px;
      font-weight: 900;
      color: #1c1c1c;
      line-height: 1;
    }
    .hud-count.pop {
      animation: count-pop 0.55s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }
    @keyframes count-pop {
      0%   { transform: scale(1);   color: #ffee3b; }
      40%  { transform: scale(1.7); color: #ffee3b; }
      100% { transform: scale(1);   color: #1c1c1c; }
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: #060606;
      border-top: 1px solid #0f0f0f;
      flex-shrink: 0;
    }
    .ctrl-label {
      font-size: 11px;
      color: #333;
    }
    .speed-range {
      -webkit-appearance: none;
      width: 90px;
      height: 3px;
      background: #1e1e1e;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    .speed-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #3a3a3a;
      cursor: pointer;
      transition: background 0.1s;
    }
    .speed-range::-webkit-slider-thumb:hover { background: #555; }

    .pause-btn {
      margin-left: auto;
      background: #111;
      border: 1px solid #1e1e1e;
      color: #3a3a3a;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      letter-spacing: 0.5px;
      transition: background 0.1s, color 0.1s;
    }
    .pause-btn:hover { background: #161616; color: #555; }
  </style>`);

  // ── HTML ───────────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <div class="screen" id="screen">

      <div class="dvd-logo" id="logo" style="color:${COLORS[colorIndex]}">
        <svg viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg">
          <text x="70" y="50"
                text-anchor="middle"
                font-family="Arial Black, Impact, sans-serif"
                font-size="52"
                font-weight="900"
                fill="currentColor">DVD</text>
          <text x="70" y="65"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="11"
                letter-spacing="9"
                fill="currentColor"
                opacity="0.65">VIDEO</text>
        </svg>
      </div>

      <div class="corner-flash" id="cornerFlash"></div>
      <div class="corner-toast" id="cornerToast">CORNER!</div>

      <div class="hud">
        <div class="hud-label">Corner Hits</div>
        <div class="hud-count" id="hudCount">0</div>
      </div>

    </div>

    <div class="controls">
      <span class="ctrl-label">Speed</span>
      <input class="speed-range" id="speedRange" type="range" min="1" max="10" value="2" step="1" />
      <span class="ctrl-label" id="speedLabel">2x</span>
      <button class="pause-btn" id="pauseBtn">Pause</button>
    </div>
  `);

  // ── DOM refs ───────────────────────────────────────────────
  const screenEl    = document.getElementById('screen');
  const logoEl      = document.getElementById('logo');
  const cornerFlash = document.getElementById('cornerFlash');
  const cornerToast = document.getElementById('cornerToast');
  const hudCount    = document.getElementById('hudCount');
  const speedRange  = document.getElementById('speedRange');
  const speedLabel  = document.getElementById('speedLabel');
  const pauseBtn    = document.getElementById('pauseBtn');

  // ── Helpers ────────────────────────────────────────────────
  function triggerAnimation(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function onCornerHit() {
    cornerHits++;
    hudCount.textContent = cornerHits;
    triggerAnimation(cornerFlash, 'pop');
    triggerAnimation(cornerToast, 'pop');
    triggerAnimation(hudCount,    'pop');
  }

  // ── Animation loop ─────────────────────────────────────────
  function tick() {
    if (!logoEl.isConnected) return;

    if (!paused) {
      const maxX = screenEl.clientWidth  - LOGO_W;
      const maxY = screenEl.clientHeight - LOGO_H;

      posX += velX;
      posY += velY;

      let bounceX = false;
      let bounceY = false;

      if (posX <= 0)    { posX = 0;    velX =  Math.abs(velX); bounceX = true; }
      if (posX >= maxX) { posX = maxX; velX = -Math.abs(velX); bounceX = true; }
      if (posY <= 0)    { posY = 0;    velY =  Math.abs(velY); bounceY = true; }
      if (posY >= maxY) { posY = maxY; velY = -Math.abs(velY); bounceY = true; }

      if (bounceX || bounceY) {
        colorIndex = (colorIndex + 1) % COLORS.length;
        logoEl.style.color = COLORS[colorIndex];
        if (bounceX && bounceY) onCornerHit();
      }

      logoEl.style.transform = `translate(${posX}px, ${posY}px)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  // ── Controls ───────────────────────────────────────────────
  speedRange.addEventListener('input', () => {
    const newSpeed = parseInt(speedRange.value, 10);
    speedLabel.textContent = newSpeed + 'x';
    velX = velX >= 0 ?  newSpeed : -newSpeed;
    velY = velY >= 0 ?  newSpeed : -newSpeed;
  });

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  });

  // ── Init ───────────────────────────────────────────────────
  logoEl.style.transform = `translate(${posX}px, ${posY}px)`;
  rafId = requestAnimationFrame(tick);
})();
