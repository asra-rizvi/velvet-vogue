/* Home: fills "New Arrivals" and "The Denim Edit" from the catalogue API */
(async function () {
    const targets = [
        { el: document.getElementById('arrivals'), params: { action: 'list', new: 1, per_page: 8 } },
        { el: document.getElementById('denim'),    params: { action: 'list', category: 'denim', per_page: 4 } },
    ];
    targets.forEach((t) => t.el && (t.el.innerHTML = VV.skeletons(t.params.per_page === 8 ? 4 : 4)));
    await VV.ready;

    await Promise.all(targets.map(async (t) => {
        if (!t.el) return;
        const r = await VV.api('products.php', t.params);
        if (!r.success) {
            t.el.innerHTML = `<div class="state-box" style="grid-column:1/-1"><i class='bx bx-error-circle'></i>
                <h3>We couldn't load products</h3>
                <p>${VV.esc(r.message)}</p><a class="btn secondary" href="">Try again</a></div>`;
            return;
        }
        t.el.innerHTML = r.products.map(VV.card).join('');
    }));
})();
