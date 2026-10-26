/* Checkout: requires sign-in, shows the live server-side totals, places the order */
(async function () {
    const form = document.getElementById('checkout-form');
    const msg = document.getElementById('co-msg');
    const btn = document.getElementById('co-submit');
    const show = (text, type) => { msg.textContent = text; msg.className = 'form-msg show ' + type; msg.scrollIntoView({ block: 'center', behavior: 'smooth' }); };

    await VV.ready;
    if (!VV.state.user) { location.replace('login.html?next=checkout.html'); return; }

    const [cart, prof] = await Promise.all([VV.api('cart.php', { action: 'get' }), VV.api('profile.php', { action: 'get' })]);
    if (!cart.success || !cart.items.length) { location.replace('cart.html'); return; }

    // Pre-fill from the account
    if (prof.success) {
        form.elements.delivery_name.value = prof.user.full_name || '';
        form.elements.delivery_phone.value = prof.user.phone || '';
        form.elements.delivery_address.value = prof.user.address || '';
    } else { form.elements.delivery_name.value = VV.state.user.name; }

    const t = cart.totals;
    document.getElementById('co-items').innerHTML = cart.items.map((i) => `
        <div class="co-line">
            <img src="${VV.esc(i.image)}" alt="" onerror="${VV.imgFallback}">
            <div class="info"><b>${VV.esc(i.name)}</b><span>${VV.esc(i.size)}${i.colour ? ' · ' + VV.esc(i.colour) : ''} · Qty ${i.quantity}</span></div>
            <div class="amt">${VV.fmt(i.line_total)}</div>
        </div>`).join('');
    document.getElementById('co-totals').innerHTML = `
        <div class="summary-line"><span>Subtotal</span><span>${VV.fmt(t.subtotal)}</span></div>
        ${t.discount ? `<div class="summary-line"><span>Discount (${VV.esc(t.promo_code)})</span><span>− ${VV.fmt(t.discount)}</span></div>` : ''}
        <div class="summary-line"><span>Delivery</span><span>${t.delivery_fee ? VV.fmt(t.delivery_fee) : 'Free'}</span></div>
        <div class="summary-line total"><span>Total to pay on delivery</span><span>${VV.fmt(t.total)}</span></div>`;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.className = 'form-msg';
        const data = Object.fromEntries(new FormData(form).entries());
        for (const [k, label] of [['delivery_name', 'your name'], ['delivery_phone', 'your phone number'], ['delivery_address', 'your street address'], ['delivery_city', 'your city']]) {
            if (!String(data[k] || '').trim()) { form.elements[k].focus(); return show('Enter ' + label + '.', 'error'); }
        }
        btn.disabled = true; btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Placing order...";
        const r = await VV.api('checkout.php', { action: 'place', ...data, payment_method: 'cod' });
        if (r.success) { location.href = 'order-confirmation.html?id=' + r.order_id; return; }
        btn.disabled = false; btn.innerHTML = "<i class='bx bx-check-circle'></i> Place order";
        if (r.login_required) return location.replace('login.html?next=checkout.html');
        show(r.message + (r.cart_problem ? ' Go back to your cart to fix this.' : ''), 'error');
    });
})();
