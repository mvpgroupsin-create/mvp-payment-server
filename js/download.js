

    // ---- CURSOR ----
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    let mx = -100, my = -100, rx = -100, ry = -100;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    if (!isTouch) {
      document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
      (function animateCursor() {
        cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
        rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(animateCursor);
      })();
      document.addEventListener('mousedown', () => { cursor.style.transform = 'translate(-50%,-50%) scale(2)'; ring.style.transform = 'translate(-50%,-50%) scale(0.6)'; });
      document.addEventListener('mouseup', () => { cursor.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.transform = 'translate(-50%,-50%) scale(1)'; });
    }

    // ---- FEATURES POPUPS (independent per card) ----
    const allPopups = ['popup150', 'popup120', 'popupLoader'];

    function togglePopup(popupId, triggerBtn) {
      const popup = document.getElementById(popupId);
      const isOpen = popup.classList.contains('show');
      // Close all popups first
      allPopups.forEach(id => document.getElementById(id).classList.remove('show'));
      if (!isOpen) {
        // Position near the trigger button
        const btn = triggerBtn.getBoundingClientRect();
        const popW = Math.min(300, Math.max(240, window.innerWidth * 0.25));
        let left = btn.left + btn.width / 2 - popW / 2;
        let top = btn.top - 20;
        if (left < 12) left = 12;
        if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
        top = (top - 400 < 0) ? btn.bottom + 12 : top - 390;
        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
        popup.style.right = 'auto';
        popup.style.bottom = 'auto';
        popup.classList.add('show');
      }
    }

    function closePopup(popupId) {
      document.getElementById(popupId).classList.remove('show');
    }

    // Close all popups on outside click
    document.addEventListener('click', (e) => {
      allPopups.forEach(id => {
        const popup = document.getElementById(id);
        if (popup.classList.contains('show') && !popup.contains(e.target) && !e.target.closest('.btn-features')) {
          popup.classList.remove('show');
        }
      });
    });

    // Make all popups draggable
    document.querySelectorAll('.fp-drag').forEach(handle => {
      const popupId = handle.getAttribute('data-popup');
      const el = document.getElementById(popupId);
      let isDragging = false, startX, startY, startLeft, startTop;

      handle.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('fp-close')) return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = el.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
        e.preventDefault();
      });
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let nL = Math.max(8, Math.min(startLeft + (e.clientX - startX), window.innerWidth - el.offsetWidth - 8));
        let nT = Math.max(8, Math.min(startTop + (e.clientY - startY), window.innerHeight - el.offsetHeight - 8));
        el.style.left = nL + 'px'; el.style.top = nT + 'px';
        el.style.right = 'auto'; el.style.bottom = 'auto';
      });
      document.addEventListener('mouseup', () => { isDragging = false; });

      // Touch drag
      handle.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('fp-close')) return;
        isDragging = true;
        startX = e.touches[0].clientX; startY = e.touches[0].clientY;
        const rect = el.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
      }, { passive: true });
      document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        let nL = Math.max(8, Math.min(startLeft + (e.touches[0].clientX - startX), window.innerWidth - el.offsetWidth - 8));
        let nT = Math.max(8, Math.min(startTop + (e.touches[0].clientY - startY), window.innerHeight - el.offsetHeight - 8));
        el.style.left = nL + 'px'; el.style.top = nT + 'px';
        el.style.right = 'auto'; el.style.bottom = 'auto';
      }, { passive: true });
      document.addEventListener('touchend', () => { isDragging = false; });
    });

    // ---- DOWNLOAD TRIGGERS (separate per card) ----
    function triggerDownload150(e) {
      e.preventDefault();
      showNotif('⬇', 'Downloading WAKE MOD 150!', 'WAKE MOD v4.3 (150mtr) APK is starting...');
    }
    function triggerDownload120(e) {
      e.preventDefault();
      showNotif('⬇', 'Downloading WAKE MOD 120!', 'WAKE MOD v4.2 (120mtr) APK is starting...');
    }
    function triggerDownloadLoader(e) {
      e.preventDefault();
      showNotif('⬇', 'Downloading WAKE LOADER!', 'WAKE LOADER v2.1 APK is starting...');
    }

    function showNotif(icon, title, text) {
      // Create a toast element dynamically
      let toast = document.getElementById('dynamicToast');
      if (!toast) {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:99999;';
        container.innerHTML = `<div id="dynamicToast" style="background:rgba(10,15,30,0.97);border:1px solid rgba(0,255,136,0.3);border-radius:14px;padding:1rem 1.4rem;display:flex;align-items:center;gap:0.8rem;box-shadow:0 10px 40px rgba(0,0,0,0.5);min-width:260px;max-width:320px;transform:translateX(120%);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);">
          <span id="tIcon" style="font-size:1.5rem;"></span>
          <div><div id="tTitle" style="font-weight:700;font-size:0.9rem;color:#e8f4ff;"></div><div id="tText" style="font-size:0.8rem;color:#6b8aad;margin-top:2px;"></div></div>
        </div>`;
        document.body.appendChild(container);
        toast = document.getElementById('dynamicToast');
      }
      document.getElementById('tIcon').textContent = icon;
      document.getElementById('tTitle').textContent = title;
      document.getElementById('tText').textContent = text;
      toast.style.transform = 'translateX(0)';
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => { toast.style.transform = 'translateX(120%)'; }, 4000);
    }


    function openNav() {
      document.getElementById('myMenu').style.width = '270px';
      document.getElementById('navOverlay').classList.add('active');
    }
    function closeNav() {
      document.getElementById('myMenu').style.width = '0';
      document.getElementById('navOverlay').classList.remove('active');
      // reset to main menu when closed
      document.getElementById('mainmenu').style.display = 'block';
      document.getElementById('submenu').style.display = 'none';
    }
    function openSubMenu() {
      document.getElementById('mainmenu').style.display = 'none';
      document.getElementById('submenu').style.display = 'block';
    }
    function backMenu() {
      document.getElementById('mainmenu').style.display = 'block';
      document.getElementById('submenu').style.display = 'none';
    }
    function closeAndScroll(el) {
      closeNav();
      const target = document.querySelector(el.getAttribute('href'));
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
    }

    // ---- PARTICLES ----
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

    const pCount = window.innerWidth < 600 ? 40 : 80;
    const particles = [];
    for (let i = 0; i < pCount; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.5 + 0.1,
        c: Math.random() > 0.6 ? '#00d4ff' : Math.random() > 0.5 ? '#ff6b00' : '#00ff88'
      });
    }

    (function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        if (window.innerWidth > 600) {
          particles.slice(i + 1).forEach(q => {
            const dx = p.x - q.x, dy = p.y - q.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 130)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + Math.round(p.a * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
      requestAnimationFrame(drawParticles);
    })();

    // ---- SCROLL REVEAL ----
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.15 });
    reveals.forEach(r => observer.observe(r));

    // ---- MODAL DATA ----
    const gameData = {
      pubg: {
        name: 'PUBG UC Top-Up',
        sub: 'Delivers to PUBG BGMI & Global accounts',
        uid: 'Enter your PUBG Player ID (e.g. 512839471)',
        packages: [
          { icon: '💎', amount: '60', currency: 'UC', price: '₹79', bonus: '', popular: false },
          { icon: '💎', amount: '325', currency: 'UC', price: '₹399', bonus: '+25 Bonus UC', popular: false },
          { icon: '💎', amount: '660', currency: 'UC', price: '₹799', bonus: '+60 Bonus UC', popular: true },
          { icon: '💎', amount: '1800', currency: 'UC', price: '₹1,999', bonus: '+180 Bonus UC', popular: false },
          { icon: '💎', amount: '3850', currency: 'UC', price: '₹4,299', bonus: '+350 Bonus UC', popular: false },
          { icon: '👑', amount: '8100', currency: 'UC', price: '₹8,699', bonus: '+700 Bonus UC', popular: false },
        ]
      },
      '8ball': {
        name: '8 Ball Pool Coins',
        sub: 'Instant delivery to your Miniclip account',
        uid: 'Enter your 8 Ball Pool Player ID',
        packages: [
          { icon: '🎱', amount: '5M', currency: 'Coins', price: '₹49', bonus: '', popular: false },
          { icon: '🎱', amount: '20M', currency: 'Coins', price: '₹179', bonus: '', popular: false },
          { icon: '🎱', amount: '50M', currency: 'Coins', price: '₹399', bonus: '+5M Bonus', popular: true },
          { icon: '🎱', amount: '150M', currency: 'Coins', price: '₹999', bonus: '+20M Bonus', popular: false },
          { icon: '💵', amount: '50', currency: 'Pool Cash', price: '₹299', bonus: '', popular: false },
          { icon: '💵', amount: '150', currency: 'Pool Cash', price: '₹799', bonus: '+20 Bonus', popular: false },
        ]
      },
      delta: {
        name: 'Delta Force Credits',
        sub: 'Top up your Delta Force: Hawk Ops account',
        uid: 'Enter your Delta Force UID',
        packages: [
          { icon: '⚔️', amount: '80', currency: 'Credits', price: '₹99', bonus: '', popular: false },
          { icon: '⚔️', amount: '400', currency: 'Credits', price: '₹479', bonus: '', popular: false },
          { icon: '⚔️', amount: '880', currency: 'Credits', price: '₹999', bonus: '+80 Bonus', popular: true },
          { icon: '⚔️', amount: '2200', currency: 'Credits', price: '₹2,399', bonus: '+200 Bonus', popular: false },
          { icon: '🔱', amount: '4400', currency: 'Credits', price: '₹4,699', bonus: '+400 Bonus', popular: false },
          { icon: '🔱', amount: '9800', currency: 'Credits', price: '₹9,999', bonus: '+1000 Bonus', popular: false },
        ]
      }
    };

    let selectedPkg = null;

    let bsModal = null;

    function openModal(game) {
      const data = gameData[game];
      document.getElementById('modalGameName').textContent = data.name;
      document.getElementById('modalSub').textContent = data.sub;
      document.getElementById('uidInput').placeholder = data.uid;
      document.getElementById('uidInput').value = '';
      selectedPkg = null;

      const grid = document.getElementById('packagesGrid');
      grid.innerHTML = '';
      data.packages.forEach((pkg, i) => {
        const div = document.createElement('div');
        div.className = 'pkg-card' + (pkg.popular ? ' popular' : '');
        div.innerHTML = `<div class="pkg-icon">${pkg.icon}</div>
      <div class="pkg-amount">${pkg.amount}</div>
      <div class="pkg-currency">${pkg.currency}</div>
      <div class="pkg-price">${pkg.price}</div>
      ${pkg.bonus ? `<div class="pkg-bonus">+${pkg.bonus}</div>` : ''}`;
        div.onclick = () => selectPkg(div, i, pkg);
        grid.appendChild(div);
      });

      if (!bsModal) bsModal = new bootstrap.Modal(document.getElementById('topupModal'));
      bsModal.show();
    }

    function closeModal() {
      if (bsModal) bsModal.hide();
    }

    function selectPkg(el, i, pkg) {
      document.querySelectorAll('.pkg-card').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      selectedPkg = pkg;
    }

    function selectPay(el) {
      document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
    }

    function checkout() {
      const uid = document.getElementById('uidInput').value.trim();
      if (!uid) { document.getElementById('uidInput').style.borderColor = '#ff4444'; document.getElementById('uidInput').focus(); return; }
      if (!selectedPkg) { showNotif('⚠️', 'Select Package', 'Please select a top-up package first.'); return; }
      closeModal();
      setTimeout(() => {
        showNotif('✅', 'Top-Up Successful!', `${selectedPkg.amount} ${selectedPkg.currency} sent to UID: ${uid}`);
      }, 600);
    }

    function showNotif(icon, title, text) {
      document.getElementById('notifIcon').textContent = icon;
      document.getElementById('notifTitle').textContent = title;
      document.getElementById('notifText').textContent = text;
      const toastEl = document.getElementById('notifToast');
      const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 5000 });
      toast.show();
    }

    // ---- LIVE TICKER ----
    const tickerData = [
      { name: 'Ravi S.', detail: 'bought 660 UC', av: 'RS', color: '#ff6b00' },
      { name: 'Priya M.', detail: 'bought 50M Coins', av: 'PM', color: '#00d4ff' },
      { name: 'Ahmed K.', detail: 'bought 880 Credits', av: 'AK', color: '#00ff88' },
      { name: 'Sneha R.', detail: 'bought 1800 UC', av: 'SR', color: '#ffd700' },
      { name: 'Zayan B.', detail: 'bought 150M Coins', av: 'ZB', color: '#ff00aa' },
      { name: 'Kiran T.', detail: 'bought 4400 Credits', av: 'KT', color: '#00ff88' },
      { name: 'Divya P.', detail: 'bought 325 UC', av: 'DP', color: '#ff6b00' },
    ];
    let tickIdx = 0;
    function showTicker() {
      if (window.innerWidth < 481) return;
      const t = tickerData[tickIdx % tickerData.length];
      const ticker = document.getElementById('liveTicker');
      const div = document.createElement('div');
      div.className = 'ticker-item';
      div.innerHTML = `<div class="ticker-av" style="background:linear-gradient(135deg,${t.color},${t.color}88)">${t.av}</div>
    <div><div class="ticker-name">${t.name}</div><div class="ticker-detail">${t.detail}</div></div>`;
      ticker.appendChild(div);
      setTimeout(() => div.remove(), 4200);
      tickIdx++;
    }
    setInterval(showTicker, 5000);
    setTimeout(showTicker, 2000);

    // ---- KEYBOARD ----
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // ---- UID input color reset ----
    document.getElementById('uidInput').addEventListener('input', function () { this.style.borderColor = ''; });
  