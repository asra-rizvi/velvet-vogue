/* Order confirmation (owner-only; the API returns 404 for anyone else's order) */
(async function () {
    const root = document.getElementById('conf-root');
    await VV.ready;
    if (!VV.state.user) return location.replace('login.html?next=' + encodeURIComponent('order-confirmation.html' + location.search));

    const r = await VV.api('checkout.php', { action: 'order', id: VV.qs('id') });
    if (!r.success) {
        root.innerHTML = `<div class="state-box"><i class='bx bx-error-circle'></i><h3>We couldn't find that order</h3><p>${VV.esc(r.message)}</p><a class="btn" href="profile.html">Go to my orders</a></div>`;
        return;
    }
    const o = r.order;
    document.title = 'Order ' + o.order_number + ' | Velvet Vogue';
    const when = new Date(o.created_at.replace(' ', 'T')).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    root.innerHTML = `
        <div class="conf-head">
            <div class="tick"><i class='bx bx-check'></i></div>
            <h1>Thank you, your order is in</h1>
            <p>We'll prepare it for delivery. You can follow its status in My Account.</p>
            <div class="conf-num">Order ${VV.esc(o.order_number)}</div>
        </div>
        <div class="conf-grid">
            <div class="co-card">
                <h3>Delivering to</h3>
                <p style="line-height:1.8;color:#444">${VV.esc(o.delivery_name)}<br>${VV.esc(o.delivery_address)}<br>${VV.esc(o.delivery_city)}<br>${VV.esc(o.delivery_phone)}</p>
                ${o.notes ? `<p style="margin-top:12px;color:#666;font-size:.9rem"><b>Notes:</b> ${VV.esc(o.notes)}</p>` : ''}
                <h3 style="margin-top:22px">Payment</h3>
                <p style="color:#444">Cash on delivery. Please have <b>${VV.fmt(o.total_amount)}</b> ready.</p>
                <p style="color:#888;font-size:.85rem;margin-top:10px">Placed on ${VV.esc(when)}</p>
            </div>
            <div class="co-summary" style="position:static">
                <h3>Your items</h3>
                ${o.items.map((i) => `
                <div class="co-line">
                    <img src="${VV.esc(i.image || VV.PLACEHOLDER)}" alt="" onerror="${VV.imgFallback}">
                    <div class="info"><b>${VV.esc(i.name)}</b><span>${VV.esc(i.size || '')}${i.colour ? ' · ' + VV.esc(i.colour) : ''} · Qty ${i.quantity}</span></div>
                    <div class="amt">${VV.fmt(i.unit_price * i.quantity)}</div>
                </div>`).join('')}
                <div class="summary-line"><span>Subtotal</span><span>${VV.fmt(o.subtotal)}</span></div>
                ${o.discount_amount ? `<div class="summary-line"><span>Discount (${VV.esc(o.promo_code)})</span><span>− ${VV.fmt(o.discount_amount)}</span></div>` : ''}
                <div class="summary-line"><span>Delivery</span><span>${o.delivery_fee ? VV.fmt(o.delivery_fee) : 'Free'}</span></div>
                <div class="summary-line total"><span>Total</span><span>${VV.fmt(o.total_amount)}</span></div>
            </div>
        </div>
        <div class="conf-actions">
            <a class="btn" href="shop.html">Keep shopping</a>
            <a class="btn secondary" href="profile.html">View my orders</a>
        </div>`;
})();
