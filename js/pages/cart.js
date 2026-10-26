/* Cart: server-backed (prices, stock and promo are all decided by the API) */
(function () {
    const layout = document.getElementById('cart-layout');
    let snap = null;

    const line = (i) => `data-pid="${i.product_id}" data-size="${VV.esc(i.size)}" data-colour="${VV.esc(i.colour)}"`;

    function render() {
        const { items, totals: t } = snap;
        if (!items.length) {
            layout.innerHTML = `
                <div class="cart-empty">
                    <i class='bx bx-cart-alt'></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything yet. Browse our latest arrivals!</p>
                    <a href="shop.html" class="btn-shop">Continue Shopping</a>
                </div>`;
            return;
        }

        const rows = items.map((i) => `
            <div class="cart-item" ${line(i)}>
                <div class="cart-product">
                    <a href="product.html?id=${i.product_id}"><img src="${VV.esc(i.image)}" alt="${VV.esc(i.name)}" class="cart-product-img" onerror="${VV.imgFallback}"></a>
                    <div class="cart-product-info">
                        <a href="product.html?id=${i.product_id}"><h4>${VV.esc(i.name)}</h4></a>
                        <p>Size: ${VV.esc(i.size)} &nbsp;|&nbsp; Colour: ${VV.esc(i.colour || 'Default')}</p>
                        ${i.available ? '' : `<p class="cart-warning">${i.max_qty < 1 ? 'Sold out. Remove this item to continue.' : 'Only ' + i.max_qty + ' left. Lower the quantity.'}</p>`}
                    </div>
                </div>
                <div class="cart-price">${VV.fmt(i.unit_price)}</div>
                <div class="qty-stepper">
                    <button class="qty-btn qty-dec" data-q="${i.quantity - 1}" aria-label="Decrease quantity of ${VV.esc(i.name)}" ${i.quantity <= 1 ? 'disabled' : ''}>−</button>
                    <span class="qty-value">${i.quantity}</span>
                    <button class="qty-btn qty-inc" data-q="${i.quantity + 1}" aria-label="Increase quantity of ${VV.esc(i.name)}" ${i.quantity >= i.max_qty ? 'disabled' : ''}>+</button>
                </div>
                <div class="cart-subtotal">${VV.fmt(i.line_total)}</div>
                <button class="cart-remove" aria-label="Remove ${VV.esc(i.name)}"><i class='bx bx-x'></i></button>
            </div>`).join('');

        const free = t.delivery_fee === 0;
        const blocked = items.some((i) => !i.available);
        layout.innerHTML = `
            <div class="cart-items-panel">
                <div class="cart-items-header"><span>Product</span><span>Price</span><span>Quantity</span><span>Subtotal</span><span></span></div>
                ${rows}
            </div>
            <div class="order-summary">
                <h3>Order Summary</h3>
                <div class="summary-row"><span>Subtotal (${t.item_count} item${t.item_count === 1 ? '' : 's'})</span><span>${VV.fmt(t.subtotal)}</span></div>
                ${t.discount ? `<div class="summary-row"><span>Discount (${VV.esc(t.promo_code)})</span><span style="color:#27ae60">− ${VV.fmt(t.discount)}</span></div>` : ''}
                <div class="summary-row"><span>Delivery</span><span>${free ? '<span style="color:#27ae60">Free</span>' : VV.fmt(t.delivery_fee)}</span></div>
                ${free
                    ? `<p style="font-size:0.78rem;color:#27ae60;margin:-6px 0 10px;"><i class='bx bx-check-circle'></i> Free delivery on orders of ${VV.fmt(t.free_delivery_over)} or more</p>`
                    : `<p style="font-size:0.78rem;color:#888;margin:-6px 0 10px;">Add ${VV.fmt(t.amount_to_free_delivery)} more for free delivery</p>`}

                ${t.promo_code
                    ? `<div class="promo-applied"><span><i class='bx bx-purchase-tag'></i> ${VV.esc(t.promo_code)} applied</span><button type="button" id="promo-remove">Remove</button></div>`
                    : `<div class="promo-wrap"><input type="text" id="promo-input" placeholder="Promo code" aria-label="Promo code" maxlength="30"><button class="promo-btn" id="promo-apply" type="button">Apply</button></div>`}
                <p class="promo-msg" id="promo-msg" role="status"></p>

                <div class="summary-row total"><span>Total</span><span id="order-total">${VV.fmt(t.total)}</span></div>

                <button class="checkout-btn" id="checkout-btn" ${blocked ? 'disabled' : ''}><i class='bx bx-lock-alt'></i> Proceed to Checkout</button>
                <a href="shop.html" class="continue-link">← Continue Shopping</a>

                <div class="trust-badges">
                    <div class="trust-badge"><i class='bx bx-money'></i><span>Cash on<br>Delivery</span></div>
                    <div class="trust-badge"><i class='bx bx-package'></i><span>Fast<br>Delivery</span></div>
                    <div class="trust-badge"><i class='bx bx-revision'></i><span>Easy<br>Returns</span></div>
                </div>
            </div>`;
    }

    function apply(r) {
        if (r.items) { snap = { items: r.items, totals: r.totals }; VV.state.cartCount = r.totals.item_count; VV.refreshHeader(); render(); }
    }
    const lineOf = (el) => { const l = el.closest('.cart-item'); return { product_id: l.dataset.pid, size: l.dataset.size, colour: l.dataset.colour }; };

    layout.addEventListener('click', async (e) => {
        const inc = e.target.closest('.qty-inc, .qty-dec');
        if (inc && !inc.disabled) {
            const r = await VV.api('cart.php', { action: 'update', ...lineOf(inc), quantity: inc.dataset.q });
            apply(r); if (!r.success) VV.toast(r.message, { error: true });
            return;
        }
        const rm = e.target.closest('.cart-remove');
        if (rm) { const r = await VV.api('cart.php', { action: 'remove', ...lineOf(rm) }); apply(r); VV.toast('Item removed from cart.'); return; }

        if (e.target.closest('#promo-apply')) {
            const code = document.getElementById('promo-input').value.trim();
            const r = await VV.api('cart.php', { action: 'promo', code });
            if (r.success) { apply(r); const m = document.getElementById('promo-msg'); m.textContent = '✓ ' + r.message; m.className = 'promo-msg success'; }
            else { const m = document.getElementById('promo-msg'); m.textContent = '✕ ' + r.message; m.className = 'promo-msg error'; }
            return;
        }
        if (e.target.closest('#promo-remove')) { apply(await VV.api('cart.php', { action: 'promo', code: '' })); return; }

        if (e.target.closest('#checkout-btn')) {
            await VV.ready;
            if (!VV.state.user) { location.href = 'login.html?next=checkout.html'; return; }
            location.href = 'checkout.html';
        }
    });
    layout.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'promo-input') document.getElementById('promo-apply').click(); });

    (async function () {
        layout.innerHTML = '<div class="skeleton" style="height:260px;grid-column:1/-1"></div>';
        await VV.ready;
        const r = await VV.api('cart.php', { action: 'get' });
        if (!r.success) { layout.innerHTML = `<div class="cart-empty"><i class='bx bx-error-circle'></i><h3>We couldn't load your cart</h3><p>${VV.esc(r.message)}</p></div>`; return; }
        apply(r);
    })();
})();
