// @name        JSON Formatter
// @icon        search
// @description Paste JSON to format and validate it

document.head.insertAdjacentHTML('beforeend', `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #111;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #f4f4f4;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: #0f0f0f;
    border-bottom: 1px solid #1e1e1e;
    flex-shrink: 0;
  }
  .toolbar-title { font-size: 13px; font-weight: 700; color: #f4f4f4; flex: 1; }
  .btn {
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #888;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 12px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .btn:hover { background: #52B043; border-color: #52B043; color: #fff; }
  .btn.copied { background: #52B043; border-color: #52B043; color: #fff; }
  .btn-clear:hover { background: #c00; border-color: #c00; color: #fff; }
  .status {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 3px;
  }
  .status-ok    { background: rgba(82,176,67,0.15); color: #52B043; }
  .status-error { background: rgba(200,50,50,0.15); color: #f66; }
  .panes {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: #1e1e1e;
    overflow: hidden;
  }
  .pane {
    display: flex;
    flex-direction: column;
    background: #111;
    overflow: hidden;
  }
  .pane-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #333;
    padding: 6px 14px;
    background: #0f0f0f;
    border-bottom: 1px solid #1a1a1a;
    flex-shrink: 0;
  }
  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #aaa;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.7;
    padding: 14px;
    resize: none;
  }
  textarea::placeholder { color: #2a2a2a; }
  .output-scroll {
    flex: 1;
    overflow: auto;
    padding: 14px;
  }
  .output-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .output-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; }
  pre {
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.7;
    white-space: pre;
    margin: 0;
  }
  .j-key    { color: #7ab4ff; }
  .j-str    { color: #ce9178; }
  .j-num    { color: #b5cea8; }
  .j-bool   { color: #569cd6; }
  .j-null   { color: #569cd6; }
  .j-punct  { color: #555; }
  .error-msg {
    color: #f66;
    font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.6;
    padding: 14px;
  }
</style>`);

document.body.innerHTML = `
  <div class="toolbar">
    <span class="toolbar-title">JSON Formatter</span>
    <span class="status" id="status"></span>
    <button class="btn" id="copyBtn">Copy</button>
    <button class="btn btn-clear" id="clearBtn">Clear</button>
  </div>
  <div class="panes">
    <div class="pane">
      <div class="pane-label">Input</div>
      <textarea id="input" placeholder='Paste JSON here…' spellcheck="false"></textarea>
    </div>
    <div class="pane">
      <div class="pane-label">Formatted</div>
      <div class="output-scroll" id="outputScroll">
        <pre id="output"></pre>
      </div>
    </div>
  </div>
`;

const inputEl   = document.getElementById('input');
const outputEl  = document.getElementById('output');
const statusEl  = document.getElementById('status');
const copyBtn   = document.getElementById('copyBtn');
const clearBtn  = document.getElementById('clearBtn');

let lastFormatted = '';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function syntaxHighlight(json) {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}\[\],:])/g,
    (match) => {
      if (/^"/.test(match)) {
        return match.endsWith(':')
          ? `<span class="j-key">${match}</span>`
          : `<span class="j-str">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="j-bool">${match}</span>`;
      if (/null/.test(match))       return `<span class="j-null">${match}</span>`;
      if (/[{}\[\],:]/.test(match)) return `<span class="j-punct">${match}</span>`;
      return `<span class="j-num">${match}</span>`;
    }
  );
}

function format() {
  const raw = inputEl.value.trim();
  if (!raw) {
    outputEl.innerHTML = '';
    statusEl.textContent = '';
    statusEl.className = 'status';
    lastFormatted = '';
    return;
  }

  try {
    const parsed    = JSON.parse(raw);
    lastFormatted   = JSON.stringify(parsed, null, 2);
    outputEl.innerHTML = syntaxHighlight(lastFormatted);
    statusEl.textContent = 'Valid JSON';
    statusEl.className   = 'status status-ok';
  } catch (err) {
    outputEl.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    statusEl.textContent = 'Invalid JSON';
    statusEl.className   = 'status status-error';
    lastFormatted = '';
  }
}

inputEl.addEventListener('input', format);

copyBtn.addEventListener('click', () => {
  if (!lastFormatted) return;
  navigator.clipboard.writeText(lastFormatted).then(() => {
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});

clearBtn.addEventListener('click', () => {
  inputEl.value = '';
  format();
});
