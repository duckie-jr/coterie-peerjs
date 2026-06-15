# ⚡ FlashDash

A portable Xbox 360-style dashboard for running JavaScript mini-apps. Add apps by uploading a `.js` file or pasting a raw-script URL — each app runs in a sandboxed iframe inside the dashboard.

---

## Getting Started

### Run locally (recommended)
```bash
npm install
npm run dev
```

### Portable / offline
1. Copy the project folder onto a USB drive
2. Run `npm run build`, then open `dist/index.html` in any browser
3. Go to the **Apps** tab and click **＋ Add App**

---

## How Apps Work

Each app is a self-contained JavaScript program. FlashDash supports two sources:

| Source | How to use |
|---|---|
| **Upload a `.js` file** | Click the file picker in the modal and select a `.js` file from disk. The script text is stored in `localStorage`. |
| **Raw JS URL** | Paste the raw URL of a `.js` script (e.g. a `raw.githubusercontent.com` or Gist raw link). FlashDash fetches and runs it on launch. |

> **Note:** Apps run in a sandboxed `<iframe srcdoc>` with `allow-scripts` only. They cannot access the DOM of the parent page, make navigation requests, or load external resources unless the script itself does so via `fetch`.

Apps are saved to **`localStorage`** under the key `flashdash_state` and persist across sessions in the same browser.  
Every time you add, edit, or remove an app the patch version in the status bar increments automatically (`1.0.0` → `1.0.1` → …).

---

## Writing an App

An app is a plain `.js` file. It has full access to the browser APIs inside its sandbox:

```js
// hello.js — minimal example
const root = document.createElement('div');
root.style.cssText = 'font-family:system-ui;padding:2rem;font-size:2rem';
root.textContent = 'Hello from FlashDash!';
document.body.appendChild(root);
```

```js
// clock.js — live digital clock
setInterval(() => {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;font-family:monospace;font-size:4rem">
      ${new Date().toLocaleTimeString()}
    </div>`;
}, 1000);
```

---

## App Fields

| Field | Description |
|---|---|
| **Name** | Display name shown on the tile and Quick Access row |
| **Icon** | Any single emoji |
| **JS File** | Upload a `.js` file — its source is stored locally |
| **Raw JS URL** | URL whose response body is raw JavaScript (e.g. `https://raw.githubusercontent.com/…/app.js`) |

> File and URL are mutually exclusive. Setting one clears the other.

---

## Files

```
flashdash/
├── index.html        — markup & layout
├── style.css         — Xbox 360-inspired dark theme
├── main.js           — state, localStorage, rendering, app viewer
├── package.json      — Vite dev/build scripts
├── vite.config.ts    — Vite configuration
└── README.md         — this file
```

---

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
