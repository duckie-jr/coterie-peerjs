// @name        Calculator
// @icon        🔢
// @description Standard calculator with keyboard support

document.head.insertAdjacentHTML('beforeend', `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111;
    font-family: 'Segoe UI', system-ui, sans-serif;
    user-select: none;
  }
  .calc {
    width: min(340px, 94vw);
    background: #1a1a1a;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  }
  .display {
    background: #0f0f0f;
    padding: 20px 20px 12px;
    text-align: right;
  }
  .expr {
    font-size: 13px;
    color: #444;
    min-height: 18px;
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .result {
    font-size: clamp(2rem, 8vw, 3rem);
    font-weight: 600;
    color: #f4f4f4;
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 4px;
    min-height: 1.2em;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #0f0f0f;
  }
  .key {
    padding: 18px 10px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    font-family: inherit;
    background: #1e1e1e;
    color: #f4f4f4;
    transition: background 0.1s, color 0.1s;
  }
  .key:hover  { background: #2a2a2a; }
  .key:active { background: #333; }
  .key-op     { background: #252525; color: #52B043; }
  .key-op:hover  { background: #2e2e2e; }
  .key-eq     { background: #52B043; color: #fff; }
  .key-eq:hover  { background: #64cc54; }
  .key-clear  { background: #252525; color: #f47; }
  .key-clear:hover { background: #2e2e2e; }
  .key-wide   { grid-column: span 2; }
</style>`);

document.body.innerHTML = `
  <div class="calc">
    <div class="display">
      <div class="expr"  id="expr"></div>
      <div class="result" id="result">0</div>
    </div>
    <div class="grid" id="grid"></div>
  </div>
`;

const BUTTONS = [
  { label: 'AC',  cls: 'key-clear', action: 'clear'   },
  { label: '+/-', cls: 'key-op',    action: 'negate'  },
  { label: '%',   cls: 'key-op',    action: 'percent' },
  { label: '÷',   cls: 'key-op',    action: 'op', value: '/'  },
  { label: '7',   action: 'digit', value: '7' },
  { label: '8',   action: 'digit', value: '8' },
  { label: '9',   action: 'digit', value: '9' },
  { label: '×',   cls: 'key-op',    action: 'op', value: '*'  },
  { label: '4',   action: 'digit', value: '4' },
  { label: '5',   action: 'digit', value: '5' },
  { label: '6',   action: 'digit', value: '6' },
  { label: '−',   cls: 'key-op',    action: 'op', value: '-'  },
  { label: '1',   action: 'digit', value: '1' },
  { label: '2',   action: 'digit', value: '2' },
  { label: '3',   action: 'digit', value: '3' },
  { label: '+',   cls: 'key-op',    action: 'op', value: '+'  },
  { label: '0',   action: 'digit', value: '0', cls: 'key-wide' },
  { label: '.',   action: 'dot'   },
  { label: '=',   cls: 'key-eq',    action: 'equals'  },
];

const grid     = document.getElementById('grid');
const exprEl   = document.getElementById('expr');
const resultEl = document.getElementById('result');

BUTTONS.forEach(btn => {
  const el = document.createElement('button');
  el.className = `key ${btn.cls || ''} ${btn.cls === undefined && btn.label !== '=' ? '' : ''}`.trim();
  if (btn.cls === 'key-wide' || btn.label === '0' && !btn.cls?.includes('key-wide')) {
    // handled in object
  }
  if (btn.cls === 'key-wide' || (btn.label === '0' && !btn.cls)) {
    // this is fine
  }
  el.className = ['key', btn.cls || ''].filter(Boolean).join(' ');
  el.textContent = btn.label;
  el.addEventListener('click', () => handleAction(btn));
  grid.appendChild(el);
});

let currentInput  = '0';
let storedValue   = null;
let pendingOp     = null;
let justEqualed   = false;
let inputStarted  = false;

function display() {
  resultEl.textContent = currentInput.length > 12
    ? parseFloat(currentInput).toPrecision(8)
    : currentInput;

  if (storedValue !== null && pendingOp) {
    const opSymbol = { '/': '÷', '*': '×', '-': '−', '+': '+' }[pendingOp] || pendingOp;
    exprEl.textContent = `${storedValue} ${opSymbol}`;
  } else {
    exprEl.textContent = '';
  }
}

function applyOp(a, op, b) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  switch (op) {
    case '+': return String(numA + numB);
    case '-': return String(numA - numB);
    case '*': return String(numA * numB);
    case '/': return numB === 0 ? 'Error' : String(numA / numB);
    default:  return b;
  }
}

function handleAction(btn) {
  switch (btn.action) {
    case 'digit':
      if (justEqualed) { currentInput = btn.value; justEqualed = false; inputStarted = true; break; }
      if (!inputStarted) { currentInput = btn.value; inputStarted = true; break; }
      if (currentInput === '0') { currentInput = btn.value; break; }
      if (currentInput.length < 12) currentInput += btn.value;
      break;

    case 'dot':
      if (justEqualed) { currentInput = '0.'; justEqualed = false; inputStarted = true; break; }
      if (!inputStarted) { currentInput = '0.'; inputStarted = true; break; }
      if (!currentInput.includes('.')) currentInput += '.';
      break;

    case 'op':
      if (storedValue !== null && pendingOp && inputStarted) {
        currentInput = applyOp(storedValue, pendingOp, currentInput);
      }
      storedValue  = currentInput;
      pendingOp    = btn.value;
      inputStarted = false;
      justEqualed  = false;
      break;

    case 'equals':
      if (storedValue !== null && pendingOp) {
        const prev = exprEl.textContent;
        currentInput = applyOp(storedValue, pendingOp, currentInput);
        storedValue  = null;
        pendingOp    = null;
        justEqualed  = true;
        inputStarted = false;
      }
      break;

    case 'clear':
      currentInput = '0'; storedValue = null;
      pendingOp = null; justEqualed = false; inputStarted = false;
      break;

    case 'negate':
      if (currentInput !== '0' && currentInput !== 'Error') {
        currentInput = currentInput.startsWith('-')
          ? currentInput.slice(1)
          : '-' + currentInput;
      }
      break;

    case 'percent':
      if (currentInput !== 'Error') {
        currentInput = String(parseFloat(currentInput) / 100);
      }
      break;
  }
  display();
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') handleAction({ action: 'digit', value: e.key });
  else if (e.key === '.')              handleAction({ action: 'dot' });
  else if (e.key === '+')              handleAction({ action: 'op', value: '+' });
  else if (e.key === '-')              handleAction({ action: 'op', value: '-' });
  else if (e.key === '*')              handleAction({ action: 'op', value: '*' });
  else if (e.key === '/')              { e.preventDefault(); handleAction({ action: 'op', value: '/' }); }
  else if (e.key === 'Enter' || e.key === '=') handleAction({ action: 'equals' });
  else if (e.key === 'Escape')         handleAction({ action: 'clear' });
  else if (e.key === 'Backspace') {
    if (currentInput.length > 1) currentInput = currentInput.slice(0, -1);
    else currentInput = '0';
    display();
  }
});

display();
