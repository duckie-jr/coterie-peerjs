// @name        Clock
// @icon        ⏰
// @description Live digital clock and date

document.head.insertAdjacentHTML('beforeend', `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0f0f0f;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #f4f4f4;
    gap: 16px;
    user-select: none;
  }
  .time {
    font-size: clamp(4rem, 18vw, 10rem);
    font-weight: 800;
    letter-spacing: -3px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .colon { color: #52B043; animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0.15; } }
  .seconds {
    font-size: 0.42em;
    color: #52B043;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    align-self: flex-end;
    margin-bottom: 0.18em;
  }
  .date {
    font-size: clamp(0.7rem, 2vw, 1rem);
    color: #444;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
</style>`);

document.body.innerHTML = `
  <div class="time">
    <span id="hm"></span>
    <span class="colon">:</span>
    <span class="seconds" id="sec"></span>
  </div>
  <div class="date" id="date"></div>
`;

const hmEl   = document.getElementById('hm');
const secEl  = document.getElementById('sec');
const dateEl = document.getElementById('date');

function tick() {
  const now = new Date();
  hmEl.textContent  = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  secEl.textContent = String(now.getSeconds()).padStart(2, '0');
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

tick();
setInterval(tick, 1000);
