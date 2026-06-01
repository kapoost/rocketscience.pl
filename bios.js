(() => {
  const tabs = [
    { path: '/',         hint: 'h' },
    { path: '/about',    hint: 'a' },
    { path: '/projects', hint: 'p' },
    { path: '/writing',  hint: 'w' },
    { path: '/contact',  hint: 'c' },
    { path: '/privacy',  hint: 's' },
  ];
  const paths = tabs.map(t => t.path);
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const go = (href) => { if (href !== path) window.location.href = href; };

  const BOOT_KEY    = 'rs.booted';
  const CONSENT_KEY = 'rs.consent';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Boot screen (supports fast / slow / forced) ─────────────── */
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

  function runBoot(opts = {}) {
    const slow = opts.slow === true;
    const forced = opts.forced === true;
    if (!forced && (sessionStorage.getItem(BOOT_KEY) === '1' || reduceMotion)) {
      return Promise.resolve();
    }
    const el = document.createElement('div');
    el.className = 'bios-boot';
    el.setAttribute('role', 'presentation');
    document.body.appendChild(el);

    const stepBig   = slow ? 180 : 70;
    const stepSmall = slow ?  70 : 30;
    const tail      = slow ? 800 : 350;

    return new Promise((resolve) => {
      let i = 0;
      const tick = () => {
        if (i >= bootLines.length) { finish(); return; }
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
        setTimeout(tick, line.s ? stepBig : stepSmall);
      };

      const finish = () => {
        sessionStorage.setItem(BOOT_KEY, '1');
        setTimeout(() => {
          el.classList.add('fading');
          setTimeout(() => { el.remove(); resolve(); }, 320);
        }, tail);
      };

      const skip = (e) => {
        if (e.type === 'keydown' && (e.ctrlKey || e.metaKey || e.altKey)) return;
        if (forced) return;            // forced reboot is not skippable
        e.preventDefault();
        document.removeEventListener('keydown', skip, true);
        el.removeEventListener('click', skip);
        finish();
      };
      if (!forced) {
        document.addEventListener('keydown', skip, true);
        el.addEventListener('click', skip);
      }
      tick();
    });
  }

  /* ── Keyboard nav ─────────────────────────────────────────────── */
  let gPending = false, gTimer = 0;

  function helpDialog() {
    alert(
      'kapoost BIOS Edition v3.1 — Keyboard\n\n' +
      '  ← →     Switch tab\n' +
      '  ENTER   Follow focused link\n' +
      '  ESC     Back to Main\n' +
      '  g h     Go to Main\n' +
      '  g a     Go to About\n' +
      '  g p     Go to Projects\n' +
      '  g w     Go to Writing\n' +
      '  g c     Go to Contact\n' +
      '  g s     Go to Save\n' +
      '  ?       This dialog\n\n' +
      'Tip (Safari): enable Settings → Advanced → ' +
      '"Press Tab to highlight each item on a webpage" ' +
      'to cycle focus through links.'
    );
  }

  function bindNav() {
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && t.matches('input, textarea, [contenteditable]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (gPending) {
        const target = tabs.find(x => x.hint === e.key.toLowerCase());
        gPending = false;
        clearTimeout(gTimer);
        if (target) { e.preventDefault(); go(target.path); return; }
        return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault(); helpDialog(); break;
        case 'Escape':
          if (path !== '/') { e.preventDefault(); go('/'); } break;
        case 'ArrowLeft':
        case 'ArrowRight': {
          const i = paths.indexOf(path);
          if (i < 0) return;
          e.preventDefault();
          const n = e.key === 'ArrowLeft'
            ? (i - 1 + paths.length) % paths.length
            : (i + 1) % paths.length;
          go(paths[n]);
          break;
        }
        case 'g':
        case 'G':
          e.preventDefault();
          gPending = true;
          gTimer = setTimeout(() => { gPending = false; }, 1200);
          break;
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

  /* ── Exit button = forced slow reboot, then reload ───────────── */
  function bindExit() {
    document.querySelectorAll('[data-exit]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem(BOOT_KEY);
        runBoot({ slow: true, forced: true }).then(() => location.reload());
      });
    });
  }

  /* ── Cookie consent banner (prowizoryczne — do Google CMP) ───── */
  function consentBanner() {
    if (localStorage.getItem(CONSENT_KEY)) return;
    const el = document.createElement('div');
    el.className = 'bios-consent';
    el.innerHTML =
      '<span class="msg">Cookies for Google AdSense. Choose how you want them set.</span>' +
      '<button type="button" data-consent="all">Accept all</button>' +
      '<button type="button" data-consent="limited">Necessary only</button>' +
      '<a href="/privacy">Read more</a>';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-consent]');
      if (!t) return;
      const v = t.dataset.consent;
      localStorage.setItem(CONSENT_KEY, v);
      // Best-effort signal to AdSense; the real consent layer will be
      // Google CMP (Funding Choices) once AdSense review is complete.
      if (v === 'limited' && window.adsbygoogle) {
        window.adsbygoogle.requestNonPersonalizedAds = 1;
      }
      el.remove();
    });
  }

  runBoot().then(() => {
    bindNav();
    bindClock();
    bindExit();
    consentBanner();
  });
})();
