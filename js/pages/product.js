/* Product detail: options, quantity, add to cart, wishlist, related items */
(async function () {
    const root = document.getElementById('pd-root');
    const id = parseInt(VV.qs('id') || '0', 10);

    function notFound(msg) {
        root.innerHTML = `<div class="state-box"><i class='bx bx-ghost'></i><h3>${VV.esc(msg)}</h3>
            <p>It may have been removed, or the link is wrong.</p><a class="btn" href="shop.html">Back to the shop</a></div>`;
        document.getElementById('pd-crumb').textContent = 'Not found';
    }
    if (!id) return notFound('We could not find that product');

    const [r] = await Promise.all([VV.api('products.php', { action: 'get', id }), VV.ready]);
    if (!r.success) return notFound(r.status === 404 ? 'We could not find that product' : r.message);

    const p = r.product;
    document.title = p.name + ' | Velvet Vogue';
    document.getElementById('pd-crumb').textContent = p.name;

    const radios = (name, values, checked) => values.map((v, i) => `
        <label class="opt"><input type="radio" name="${name}" value="${VV.esc(v)}" ${v === checked || (!checked && i === 0) ? 'checked' : ''}><span>${VV.esc(v)}</span></label>`).join('');
    const defaultSize = p.sizes.includes('M') ? 'M' : p.sizes[0];
    const wished = VV.state.wishlist.has(p.id);
    const low = p.stock > 0 && p.stock <= 5;

    root.innerHTML = `
    <div class="pd-grid">
        <div class="pd-image"><img src="${VV.esc(p.image)}" alt="${VV.esc(p.name)}" onerror="${VV.imgFallback}"></div>
        <div class="pd-info">
            <a class="pd-cat" href="shop.html?category=${encodeURIComponent(p.category_slug)}">${VV.esc(p.category)}</a>
            <h1>${VV.esc(p.name)}</h1>
            <div class="rating" aria-label="Rated ${p.rating} out of 5">${VV.stars(p.rating)}</div>
            <p class="pd-price">${VV.fmt(p.price)}</p>
            <p class="pd-desc">${VV.esc(p.description || '')}</p>

            <div class="opt-group"><span class="pd-label">Size</span><div class="opts" role="radiogroup" aria-label="Size">${radios('size', p.sizes, defaultSize)}</div></div>
            ${p.colours.length ? `<div class="opt-group"><span class="pd-label">Colour</span><div class="opts" role="radiogroup" aria-label="Colour">${radios('colour', p.colours)}</div></div>` : ''}

            <p class="stock-note ${p.stock === 0 ? 'out' : low ? 'low' : ''}">${p.stock === 0 ? 'Sold out' : low ? 'Only ' + p.stock + ' left' : 'In stock'}</p>

            <div class="pd-buy">
                <div class="qty-stepper pd-qty" role="group" aria-label="Quantity">
                    <button type="button" class="qty-btn" id="qty-dec" aria-label="Decrease quantity">−</button>
                    <span class="qty-value" id="qty-val" aria-live="polite">1</span>
                    <button type="button" class="qty-btn" id="qty-inc" aria-label="Increase quantity">+</button>
                </div>
                <button class="btn" id="add-btn" ${p.in_stock ? '' : 'disabled'}><i class='bx bx-cart'></i> ${p.in_stock ? 'Add to cart' : 'Sold out'}</button>
                <button class="pd-wish${wished ? ' active' : ''}" data-wish-id="${p.id}" aria-pressed="${wished}" aria-label="Save to wishlist"><i class='${wished ? 'bx bxs-heart' : 'bx bx-heart'}'></i></button>
            </div>

            <div class="pd-meta">
                <div><i class='bx bx-package'></i><span>Delivery in 2–3 business days in Colombo, 4–7 elsewhere in Sri Lanka. Free from LKR 5,000.</span></div>
                <div><i class='bx bx-revision'></i><span>Free returns within 14 days if unworn with tags. <a href="shipping-returns.html" style="text-decoration:underline">Details</a></span></div>
                <div><i class='bx bx-money'></i><span>Pay cash on delivery.</span></div>
            </div>
        </div>
    </div>`;

    // quantity stepper
    const max = Math.max(1, Math.min(10, p.stock));
    let qty = 1;
    const val = document.getElementById('qty-val');
    document.getElementById('qty-dec').addEventListener('click', () => { qty = Math.max(1, qty - 1); val.textContent = qty; });
    document.getElementById('qty-inc').addEventListener('click', () => {
        if (qty >= max) return VV.toast(p.stock < 10 ? 'Only ' + p.stock + ' available.' : 'You can order up to 10 of one item at a time.', { error: true });
        qty++; val.textContent = qty;
    });

    const addBtn = document.getElementById('add-btn');
    addBtn.addEventListener('click', async () => {
        addBtn.disabled = true;
        const size = (document.querySelector('input[name="size"]:checked') || {}).value || '';
        const colour = (document.querySelector('input[name="colour"]:checked') || {}).value || '';
        await VV.addToCart(p.id, { size, colour, quantity: qty });
        addBtn.disabled = !p.in_stock;
    });

    // related
    const relGrid = document.getElementById('related-grid');
    if (r.related && r.related.length) {
        relGrid.innerHTML = r.related.map(VV.card).join('');
        document.getElementById('related').hidden = false;
    }
})();
