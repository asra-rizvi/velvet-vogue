/* ============================================================
   app.js - loaded on every page
   Talks to the in-browser backend, keeps the header in sync (sign-in state,
   cart + wishlist counts), and provides helpers the page scripts use.
   ============================================================ */
(function () {
    'use strict';

    const VV = (window.VV = {});
    VV.state = { user: null, csrf: '', cartCount: 0, wishlist: new Set() };

    /* ---------- tiny helpers ---------- */
    VV.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    VV.fmt = (n) => 'LKR ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
    VV.qs = (name) => new URLSearchParams(location.search).get(name);
    VV.PLACEHOLDER = 'img/placeholder.svg';
    VV.imgFallback = "this.onerror=null;this.src='" + VV.PLACEHOLDER + "'";

    // Only same-site relative html pages are allowed as a post-login destination.
    VV.safeNext = (next) => (/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(next || '') ? next : 'index.html');

    /* ---------- API ---------- */
    // VV.api('cart.php', { action: 'add', product_id: 3 })
    // Calls the in-browser backend (js/backend.js). Same request/response shape a real
    // server API would use, so swapping in a fetch() to a real backend later is a one-function change.
    VV.api = async function (file, data = {}) {
        const json = await window.VV_BACKEND(file, data);
        if (json.csrf) VV.state.csrf = json.csrf;
        return json;
    };

    /* ---------- toast ---------- */
    VV.toast = function (msg, opts = {}) {
        let t = document.getElementById('vv-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'vv-toast';
            t.className = 'vv-toast';
            t.setAttribute('role', 'status');
            t.setAttribute('aria-live', 'polite');
            document.body.appendChild(t);
        }
        t.className = 'vv-toast' + (opts.error ? ' error' : '');
        t.textContent = msg;
        if (opts.href) {
            const a = document.createElement('a');
            a.href = opts.href;
            a.textContent = opts.label || 'View';
            t.appendChild(a);
        }
        requestAnimationFrame(() => t.classList.add('show'));
        clearTimeout(t._timer);
        t._timer = setTimeout(() => t.classList.remove('show'), opts.ms || 3500);
    };

    /* ---------- header: counts + sign-in state ---------- */
    function setBadge(link, cls, count) {
        if (!link) return;
        let b = link.querySelector('.' + cls);
        if (!b) {
            b = document.createElement('span');
            b.className = cls;
            b.setAttribute('aria-hidden', 'true');
            link.appendChild(b);
        }
        b.textContent = count > 99 ? '99+' : count;
        b.style.display = count > 0 ? 'flex' : 'none';
    }
    const iconLink = (cls) => [...document.querySelectorAll('.nav-icon a')].find((a) => a.querySelector('.' + cls));

    VV.refreshHeader = function () {
        setBadge(iconLink('bx-cart'), 'cart-badge', VV.state.cartCount);
        setBadge(iconLink('bx-heart'), 'wish-badge', VV.state.wishlist.size);

        const signedIn = !!VV.state.user;
        const signLink = document.querySelector('.navmenu a[data-auth-link]');
        if (signLink) {
            signLink.textContent = signedIn ? 'my account' : 'sign in';
            signLink.href = signedIn ? 'profile.html' : 'login.html';
        }
        const userLink = iconLink('bx-user');
        if (userLink) {
            userLink.href = signedIn ? 'profile.html' : 'login.html';
            userLink.setAttribute('aria-label', signedIn ? 'My account (' + VV.state.user.name + ')' : 'Sign in');
        }
        // Keep every heart on the page in sync with the wishlist
        document.querySelectorAll('[data-wish-id]').forEach((el) => {
            const on = VV.state.wishlist.has(Number(el.dataset.wishId));
            el.classList.toggle('active', on);
            el.setAttribute('aria-pressed', on ? 'true' : 'false');
            const i = el.querySelector('i');
            if (i) i.className = on ? 'bx bxs-heart' : 'bx bx-heart';
        });
    };

    // One call at page load: who is signed in, cart count and wishlist ids.
    VV.ready = VV.api('auth.php', { action: 'check' }).then((r) => {
        if (r.success) {
            VV.state.user = r.user || null;
            VV.state.cartCount = r.cart_count || 0;
            VV.state.wishlist = new Set((r.wishlist_ids || []).map(Number));
        }
        VV.refreshHeader();
        return r;
    });

    VV.requireLogin = function (message) {
        const next = location.pathname.split('/').pop() + location.search;
        VV.toast(message || 'Please sign in to continue.', { href: 'login.html?next=' + encodeURIComponent(next), label: 'Sign in' });
    };

    /* ---------- product card ---------- */
    function stars(r) {
        let out = '';
        for (let i = 1; i <= 5; i++) {
            if (r >= i) out += "<i class='bx bxs-star'></i>";
            else if (r >= i - 0.5) out += "<i class='bx bxs-star-half'></i>";
            else out += "<i class='bx bx-star'></i>";
        }
        return out;
    }
    VV.stars = stars;

    VV.card = function (p) {
        const href = 'product.html?id=' + p.id;
        const wished = VV.state.wishlist.has(p.id);
        return `
        <div class="row${p.in_stock ? '' : ' sold-out'}" data-id="${p.id}">
            <a href="${href}" class="row-img" aria-label="${VV.esc(p.name)}">
                <img src="${VV.esc(p.image)}" alt="${VV.esc(p.name)}" loading="lazy" onerror="${VV.imgFallback}">
            </a>
            ${p.is_new ? '<div class="text"><h5>New</h5></div>' : ''}
            ${p.in_stock ? '' : '<div class="sold-badge">Sold out</div>'}
            <button class="cart" data-quick-add="${p.id}" aria-label="Add ${VV.esc(p.name)} to cart" ${p.in_stock ? '' : 'disabled'}><i class='bx bx-cart'></i></button>
            <button class="favorite${wished ? ' active' : ''}" data-wish-id="${p.id}" aria-pressed="${wished}" aria-label="Save ${VV.esc(p.name)} to wishlist"><i class='${wished ? 'bx bxs-heart' : 'bx bx-heart'}'></i></button>
            <div class="rating" aria-label="Rated ${p.rating} out of 5">${stars(p.rating)}</div>
            <div class="price">
                <h4><a href="${href}">${VV.esc(p.name)}</a></h4>
                <p>${VV.fmt(p.price)}</p>
            </div>
        </div>`;
    };

    VV.skeletons = (n) => Array.from({ length: n }, () => '<div class="skeleton card" aria-hidden="true"></div>').join('');

    /* ---------- cart + wishlist actions ---------- */
    VV.addToCart = async function (productId, { size = '', colour = '', quantity = 1 } = {}) {
        await VV.ready;
        const r = await VV.api('cart.php', { action: 'add', product_id: productId, size, colour, quantity });
        if (r.success) {
            VV.state.cartCount = r.cart_count;
            VV.refreshHeader();
            const detail = [r.size, r.colour].filter(Boolean).join(', ');
            VV.toast(r.message + (detail ? ' (' + detail + ')' : ''), { href: 'cart.html', label: 'View cart' });
        } else {
            VV.toast(r.message, { error: true });
        }
        return r;
    };

    VV.toggleWishlist = async function (productId) {
        await VV.ready;
        if (!VV.state.user) return VV.requireLogin('Sign in to save items to your wishlist.');
        const r = await VV.api('wishlist.php', { action: 'toggle', product_id: productId });
        if (r.success) {
            r.wishlisted ? VV.state.wishlist.add(productId) : VV.state.wishlist.delete(productId);
            VV.refreshHeader();
            VV.toast(r.message, r.wishlisted ? { href: 'wishlist.html', label: 'View wishlist' } : {});
        } else {
            VV.toast(r.message, { error: true });
        }
        return r;
    };

    // Card buttons work everywhere through one delegated listener.
    document.addEventListener('click', (e) => {
        const add = e.target.closest('[data-quick-add]');
        if (add) { e.preventDefault(); VV.addToCart(Number(add.dataset.quickAdd)); return; }
        const wish = e.target.closest('[data-wish-id]');
        if (wish && !wish.hasAttribute('data-wish-manual')) { e.preventDefault(); VV.toggleWishlist(Number(wish.dataset.wishId)); }
    });

    /* ---------- header scroll, mobile menu, search ---------- */
    const header = document.querySelector('header');
    const navMenu = document.querySelector('.navmenu');
    const menuIcon = document.getElementById('menu-icon');
    let lastY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (!header) return;
        const menuOpen = navMenu && navMenu.classList.contains('active');
        header.style.transform = window.scrollY > lastY && window.scrollY > 80 && !menuOpen ? 'translateY(-100%)' : 'translateY(0)';
        lastY = window.scrollY;
    }, { passive: true });

    if (menuIcon && navMenu) {
        menuIcon.setAttribute('role', 'button');
        menuIcon.setAttribute('tabindex', '0');
        menuIcon.setAttribute('aria-label', 'Menu');
        const toggle = () => {
            const open = navMenu.classList.toggle('active');
            menuIcon.classList.toggle('bx-x', open);
            menuIcon.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        menuIcon.addEventListener('click', toggle);
        menuIcon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        navMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuIcon.classList.remove('bx-x');
        }));
    }

    // Search: the magnifier opens a panel; Enter goes to the shop with ?q=
    const searchLink = iconLink('bx-search-alt');
    if (searchLink) {
        const panel = document.createElement('div');
        panel.className = 'search-panel';
        panel.setAttribute('role', 'search');
        panel.innerHTML = `<form action="shop.html" method="get">
            <input type="search" name="q" placeholder="Search dresses, jeans, skirts..." aria-label="Search products" autocomplete="off" maxlength="80">
            <button type="submit">Search</button>
            <button type="button" class="search-close" aria-label="Close search">&times;</button>
        </form>`;
        document.body.appendChild(panel);
        const input = panel.querySelector('input');
        const close = () => panel.classList.remove('open');
        searchLink.setAttribute('role', 'button');
        searchLink.setAttribute('aria-label', 'Search');
        searchLink.addEventListener('click', (e) => {
            e.preventDefault();
            panel.classList.toggle('open');
            if (panel.classList.contains('open')) setTimeout(() => input.focus(), 120);
        });
        panel.querySelector('.search-close').addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }

    /* ---------- home-page "New Updates" slider (only if present) ---------- */
    const slides = document.querySelector('.slides');
    const prev = document.querySelector('.arrow.left');
    const next = document.querySelector('.arrow.right');
    if (slides && prev && next) {
        const items = document.querySelectorAll('.slide');
        let idx = 0;
        const show = (i) => {
            idx = i < 0 ? items.length - 1 : i >= items.length ? 0 : i;
            slides.style.transform = `translateX(${-idx * 100}%)`;
        };
        prev.addEventListener('click', () => show(idx - 1));
        next.addEventListener('click', () => show(idx + 1));
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduce) setInterval(() => show(idx + 1), 5000);
    }
})();
