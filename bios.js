(() => {
  const tabs = ['/', '/about', '/projects', '/writing', '/contact', '/privacy'];
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const go = (href) => { if (href !== path) window.location.href = href; };

  /* ── POST boot screen ─────────────────────────────────────────── */
  const BOOT_KEY = 'rs.booted';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipBoot = sessionStorage.getItem(BOOT_KEY) === '1' || reduceMotion;

  const bootLines = [
    { t: 'head', s: 'kapoost BIOS Edition v3.1 — Award Modular BIOS' },
    { t: 'head', s: '(C) 2026 Łukasz Kapuśniak — All Rights Reserved' },
    { t: '',     s: '' },
    { t: '',     s: 'CPU      : Cogito Ergo Sum @ 4.2 GHz', tail: 'OK' },
    { t: '',     s: 'L1 Cache : 64 KB',                     tail: 'OK' },
    { t: '',     s: 'L2 Cache : 512 KB',                    tail: 'OK' },
    { t: '',     s: 'Memory   : 65536K',                    tail: 'OK' },
    { t: '',     s: '' },
    { t: 'info', s: 'Detecting IDE devices ...' },
    { t: '',     s: '  Primary Master   ... AUTHOR.SYS' },
    { t: '',     s: '  Primary Slave    ... WORKS.IDX' },
    { t: '',     s: '  Secondary Master ... POEMS.TXT' },
    { t: '',     s: '  Secondary Slave  ... SEA.LOG' },
    { t: '',     s: '' },
    { t: 'info', s: 'Loading AdCP runtime ......... [3.1.RC]' },
    { t: 'info', s: 'Loading humanMCP module ...... OK' },
    { t: 'info', s: 'Loading signal provider ...... OK' },
    { t: '',     s: '' },
    { t: 'prompt', s: 'Press any key to enter SETUP ...' },
  ];

  function runBoot() {
    if (skipBoot) return Promise.resolve();
    const el = document.createElement('div');
    el.className = 'bios-boot';
    el.setAttribute('role', 'presentation');
    document.body.appendChild(el);

    return new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        if (i >= bootLines.length) {
          finish();
          return;
        }
        const line = bootLines[i++];
        const span = document.createElement('span');
        if (line.t) span.className = line.t;
        span.textContent = line.s;
        el.appendChild(span);
        if (line.tail) {
          const dots = document.createElement('span');
          dots.textContent = ' '.repeat(Math.max(1, 38 - line.s.length));
          el.appendChild(dots);
          const ok = document.createElement('span');
          ok.className = 'ok';
          ok.textContent = '[ ' + line.tail + ' ]';
          el.appendChild(ok);
        }
        el.appendChild(document.createTextNode('\n'));
        setTimeout(tick, line.s ? 70 : 30);
      };

      const finish = () => {
        sessionStorage.setItem(BOOT_KEY, '1');
        setTimeout(() => {
          el.classList.add('fading');
          setTimeout(() => { el.remove(); resolve(); }, 320);
        }, 350);
      };

      const skip = (e) => {
        if (e.type === 'keydown' && (e.ctrlKey || e.metaKey || e.altKey)) return;
        e.preventDefault();
        document.removeEventListener('keydown', skip, true);
        el.removeEventListener('click', skip);
        finish();
      };
      document.addEventListener('keydown', skip, true);
      el.addEventListener('click', skip);

      tick();
    });
  }

  /* ── Keyboard nav ─────────────────────────────────────────────── */
  function bindNav() {
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && t.matches('input, textarea, [contenteditable]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          alert(
            'kapoost BIOS Edition v3.1 — Setup Utility\n\n' +
            '  ← →    Switch tab\n' +
            '  ENTER  Follow focused link\n' +
            '  TAB    Move focus within page\n' +
            '  ESC    Back to Main\n' +
            '  F1     Help (this dialog)\n' +
            '  F10    Save & Exit (Main)\n'
          );
          break;
        case 'F10':
        case 'Escape':
          if (path !== '/') { e.preventDefault(); go('/'); }
          break;
        case 'ArrowLeft':
        case 'ArrowRight': {
          const i = tabs.indexOf(path);
          if (i < 0) return;
          e.preventDefault();
          const next = e.key === 'ArrowLeft'
            ? (i - 1 + tabs.length) % tabs.length
            : (i + 1) % tabs.length;
          go(tabs[next]);
          break;
        }
      }
    });
  }

  /* ── Status-bar clock ─────────────────────────────────────────── */
  function bindClock() {
    const clock = document.querySelector('.bios-status .clock');
    if (!clock) return;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      clock.textContent =
        `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  runBoot().then(() => { bindNav(); bindClock(); });
})();
