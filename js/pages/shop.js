/* Shop: category chips, search, price + sort filters, pagination. State lives in the URL
   so every filtered view can be bookmarked or shared. */
(function () {
    const grid = document.getElementById('shop-grid');
    const chipsEl = document.getElementById('chips');
    const qEl = document.getElementById('shop-q');
    const sortEl = document.getElementById('shop-sort');
    const priceEl = document.getElementById('shop-price');
    const countEl = document.getElementById('shop-count');
    const pagEl = document.getElementById('pagination');
    const titleEl = document.getElementById('shop-title');
    const crumbEl = document.getElementById('crumb-current');
    const subEl = document.getElementById('shop-sub');

    const state = { category: '', q: '', sort: '', price: '', page: 1 };
    let categories = [];
    let seq = 0; // ignore out-of-order responses

    function readUrl() {
        state.category = VV.qs('category') || '';
        state.q = VV.qs('q') || '';
        state.sort = VV.qs('sort') || '';
        state.price = VV.qs('price') || '';
        state.page = Math.max(1, parseInt(VV.qs('page') || '1', 10) || 1);
        qEl.value = state.q; sortEl.value = state.sort; priceEl.value = state.price;
    }
    function writeUrl(push) {
        const p = new URLSearchParams();
        Object.entries(state).forEach(([k, v]) => v && !(k === 'page' && v === 1) && p.set(k, v));
        const url = 'shop.html' + (p.toString() ? '?' + p.toString() : '');
        try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (e) { /* e.g. file:// - filters still work, URL just won't update */ }
    }

    function renderChips() {
        const all = { name: 'All', slug: '', count: categories.reduce((n, c) => (c.slug === 'new-arrivals' ? n : n + c.count), 0) };
        chipsEl.innerHTML = [all, ...categories].map((c) =>
            `<button type="button" class="chip${c.slug === state.category ? ' active' : ''}" data-slug="${VV.esc(c.slug)}" aria-pressed="${c.slug === state.category}">${VV.esc(c.name)}<small>${c.count}</small></button>`).join('');
    }

    function heading() {
        const cat = categories.find((c) => c.slug === state.category);
        let title = cat ? cat.name : 'Shop All';
        if (state.q) title = 'Results for "' + state.q + '"';
        titleEl.textContent = title;
        crumbEl.textContent = title;
        subEl.textContent = state.q ? 'Showing products that match your search.' : cat ? '' : 'Dresses, denim and everyday pieces, designed in Colombo.';
        subEl.hidden = !subEl.textContent;
        document.title = title + ' | Velvet Vogue';
    }

    async function load() {
        const mine = ++seq;
        heading();
        renderChips();
        grid.innerHTML = VV.skeletons(8);
        countEl.textContent = 'Loading products...';

        const [min, max] = (state.price || '').split('-');
        const r = await VV.api('products.php', { action: 'list', category: state.category, q: state.q, sort: state.sort, min, max, page: state.page, per_page: 12 });
        if (mine !== seq) return;
        await VV.ready; // so hearts reflect the wishlist

        if (!r.success) {
            grid.innerHTML = `<div class="state-box" style="grid-column:1/-1"><i class='bx bx-error-circle'></i><h3>We couldn't load products</h3><p>${VV.esc(r.message)}</p><button class="btn secondary" id="retry">Try again</button></div>`;
            document.getElementById('retry').addEventListener('click', load);
            countEl.textContent = '';
            pagEl.innerHTML = '';
            return;
        }
        state.page = r.page;
        countEl.textContent = r.total === 0 ? 'No products found' : `Showing ${r.products.length} of ${r.total} product${r.total === 1 ? '' : 's'}`;
        grid.innerHTML = r.products.length
            ? r.products.map(VV.card).join('')
            : `<div class="state-box" style="grid-column:1/-1"><i class='bx bx-search-alt'></i><h3>Nothing matches yet</h3><p>Try a different search, or clear your filters.</p><button class="btn secondary" id="clear">Clear filters</button></div>`;
        const clear = document.getElementById('clear');
        if (clear) clear.addEventListener('click', () => { Object.assign(state, { category: '', q: '', sort: '', price: '', page: 1 }); qEl.value = ''; sortEl.value = ''; priceEl.value = ''; writeUrl(true); load(); });
        renderPagination(r.pages);
    }

    function renderPagination(pages) {
        if (pages <= 1) { pagEl.innerHTML = ''; return; }
        let h = `<button data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Previous page">&lsaquo;</button>`;
        for (let i = 1; i <= pages; i++) h += `<button data-page="${i}" class="${i === state.page ? 'active' : ''}" ${i === state.page ? 'aria-current="page"' : ''}>${i}</button>`;
        h += `<button data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''} aria-label="Next page">&rsaquo;</button>`;
        pagEl.innerHTML = h;
    }

    chipsEl.addEventListener('click', (e) => {
        const b = e.target.closest('.chip'); if (!b) return;
        state.category = b.dataset.slug; state.page = 1; writeUrl(true); load();
    });
    pagEl.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-page]'); if (!b || b.disabled) return;
        state.page = Number(b.dataset.page); writeUrl(true); load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    sortEl.addEventListener('change', () => { state.sort = sortEl.value; state.page = 1; writeUrl(true); load(); });
    priceEl.addEventListener('change', () => { state.price = priceEl.value; state.page = 1; writeUrl(true); load(); });
    let t;
    qEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { state.q = qEl.value.trim(); state.page = 1; writeUrl(false); load(); }, 300);
    });
    window.addEventListener('popstate', () => { readUrl(); load(); });

    (async function init() {
        readUrl();
        const r = await VV.api('products.php', { action: 'categories' });
        categories = r.success ? r.categories : [];
        load();
    })();
})();
