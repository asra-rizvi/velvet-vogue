/* Wishlist page */
(async function () {
    const root = document.getElementById('wish-root');
    await VV.ready;

    if (!VV.state.user) {
        root.innerHTML = `<div class="state-box"><i class='bx bx-heart'></i><h3>Sign in to see your wishlist</h3>
            <p>Save pieces you love and find them here on any device.</p><a class="btn" href="login.html?next=wishlist.html">Sign in</a></div>`;
        return;
    }
    const r = await VV.api('wishlist.php', { action: 'get' });
    if (!r.success) { root.innerHTML = `<div class="state-box"><i class='bx bx-error-circle'></i><h3>We couldn't load your wishlist</h3><p>${VV.esc(r.message)}</p></div>`; return; }

    function render(list) {
        root.innerHTML = list.length
            ? `<p class="shop-count">${list.length} saved item${list.length === 1 ? '' : 's'}</p><div class="products">${list.map(VV.card).join('')}</div>`
            : `<div class="state-box"><i class='bx bx-heart'></i><h3>Nothing saved yet</h3><p>Tap the heart on any product to keep it here.</p><a class="btn" href="shop.html">Browse the shop</a></div>`;
    }
    let list = r.products;
    render(list);

    // Un-hearting removes the card from this page
    document.addEventListener('click', async (e) => {
        const h = e.target.closest('[data-wish-id]');
        if (!h) return;
        setTimeout(() => {
            list = list.filter((p) => VV.state.wishlist.has(p.id));
            render(list);
        }, 400);
    });
})();
