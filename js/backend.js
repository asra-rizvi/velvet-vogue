/* ============================================================
   backend.js - a tiny in-browser "server" so the store works with no
   PHP, database or build step. It keeps the same request/response
   shapes as a real API, so the page scripts could be pointed at a
   real backend later by replacing VV_BACKEND with a fetch() wrapper.

   Data is saved in this browser only (localStorage). The sign-in is a
   DEMO: accounts live on this device and nothing leaves it.
   ============================================================ */
(function () {
    'use strict';
    const D = window.VV_DATA;

    /* ---------- storage (falls back to memory if the browser blocks it) ---------- */
    const mem = {};
    function safe(kind) {
        try { const s = window[kind]; const k = '__vv_probe__'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
    }
    const LS = safe('localStorage'), SS = safe('sessionStorage');
    const read = (store, k, def) => {
        try { const raw = store ? store.getItem(k) : mem[k]; return raw == null ? def : JSON.parse(raw); } catch (e) { return def; }
    };
    const write = (store, k, v) => { const raw = JSON.stringify(v); if (store) { try { store.setItem(k, raw); return; } catch (e) { /* quota */ } } mem[k] = raw; };
    const del = (store, k) => { if (store) store.removeItem(k); delete mem[k]; };
    const get = (k, def) => read(LS, 'vv:' + k, def);
    const set = (k, v) => write(LS, 'vv:' + k, v);

    /* ---------- response helpers ---------- */
    const ok = (message, data = {}, status = 200) => ({ success: true, message, status, ...data });
    const fail = (message, data = {}, status = 400) => ({ success: false, message, status, ...data });
    const pad = (n) => String(n).padStart(2, '0');
    const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
    const money = (n) => Math.round(n * 100) / 100;
    const str = (v) => (typeof v === 'string' ? v.trim() : '');
    const int = (v, def = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; };
    const validPhone = (p) => /^[0-9+\-\s()]{7,20}$/.test(p);

    /* ---------- catalogue ---------- */
    const sold = () => get('sold', {});
    const stockOf = (p) => Math.max(0, p.stock - (sold()[p.id] || 0));
    const byId = (id) => D.PRODUCTS.find((p) => p.id === id);
    function payload(p) {
        const stock = stockOf(p);
        return { id: p.id, name: p.name, description: p.description, price: p.price, image: p.image, category: p.category,
                 category_slug: p.category_slug, sizes: p.sizes.slice(), colours: p.colours.slice(), stock, in_stock: stock > 0,
                 rating: p.rating, is_new: p.is_new };
    }

    function productsApi(d) {
        switch (d.action) {
            case 'list': {
                let list = D.PRODUCTS.slice();
                const cat = str(d.category);
                if (cat === 'new-arrivals') list = list.filter((p) => p.is_new);
                else if (cat) list = list.filter((p) => p.category_slug === cat);
                if (str(d.new) === '1') list = list.filter((p) => p.is_new);
                const q = str(d.q).slice(0, 80).toLowerCase();
                if (q) list = list.filter((p) => (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(q));
                const min = d.min !== undefined && d.min !== '' ? Number(d.min) : null;
                const max = d.max !== undefined && d.max !== '' ? Number(d.max) : null;
                if (min !== null && !Number.isNaN(min)) list = list.filter((p) => p.price >= min);
                if (max !== null && !Number.isNaN(max)) list = list.filter((p) => p.price <= max);
                const sorters = {
                    price_asc: (a, b) => a.price - b.price || a.id - b.id,
                    price_desc: (a, b) => b.price - a.price || a.id - b.id,
                    name: (a, b) => a.name.localeCompare(b.name),
                    rating: (a, b) => b.rating - a.rating || a.id - b.id,
                };
                list.sort(sorters[d.sort] || ((a, b) => Number(b.is_new) - Number(a.is_new) || a.id - b.id));
                const perPage = Math.max(1, Math.min(48, int(d.per_page, 12)));
                const total = list.length;
                const pages = Math.max(1, Math.ceil(total / perPage));
                const page = Math.min(Math.max(1, int(d.page, 1)), pages);
                return ok('OK', { products: list.slice((page - 1) * perPage, page * perPage).map(payload), total, page, pages });
            }
            case 'get': {
                const p = byId(int(d.id));
                if (!p) return fail('Product not found.', {}, 404);
                let related = D.PRODUCTS.filter((x) => x.category_slug === p.category_slug && x.id !== p.id);
                related.sort((a, b) => Number(b.is_new) - Number(a.is_new) || a.id - b.id);
                related = related.slice(0, 4);
                if (related.length < 4) {
                    const have = new Set([p.id, ...related.map((r) => r.id)]);
                    related = related.concat(D.PRODUCTS.filter((x) => !have.has(x.id)).slice(0, 4 - related.length));
                }
                return ok('OK', { product: payload(p), related: related.map(payload) });
            }
            case 'categories': {
                const cats = [];
                D.CATEGORIES.forEach((c) => {
                    const n = c.slug === 'new-arrivals' ? D.PRODUCTS.filter((p) => p.is_new).length : D.PRODUCTS.filter((p) => p.category_slug === c.slug).length;
                    if (n > 0) cats.push({ name: c.name, slug: c.slug, count: n });
                });
                return ok('OK', { categories: cats });
            }
        }
        return fail('Unknown action.');
    }

    /* ---------- accounts (demo) ---------- */
    const users = () => get('users', []);
    const saveUsers = (u) => set('users', u);
    function currentUser() {
        const id = read(SS, 'vv:session', null) ?? get('session', null);
        return id ? users().find((u) => u.id === id) || null : null;
    }
    const uid = () => { const u = currentUser(); return u ? u.id : null; };
    const userPayload = (u) => ({ id: u.id, name: u.full_name, email: u.email, photo: u.photo || null, role: 'customer' });

    async function sha256(text) {
        try {
            if (window.crypto && crypto.subtle) {
                const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
                return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (e) { /* fall through */ }
        let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;   // last-resort, demo only
        return 'x' + (h >>> 0).toString(16);
    }
    const salt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

    function passwordProblem(pw) {
        if (pw.length < 8) return 'Password must be at least 8 characters.';
        if (pw.length > 72) return 'Password must be 72 characters or fewer.';
        if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number in your password.';
        return null;
    }

    function startSession(user, remember) {
        del(SS, 'vv:session'); del(LS, 'vv:session');
        if (remember) write(LS, 'vv:session', user.id); else write(SS, 'vv:session', user.id);
        mergeGuestCart(user.id);
    }

    async function authApi(d) {
        switch (d.action) {
            case 'check': {
                const u = currentUser();
                return ok(u ? 'Signed in.' : 'Not signed in.', {
                    csrf: '', user: u ? userPayload(u) : null, cart_count: cartCount(u ? u.id : null),
                    wishlist_ids: u ? get('wish:' + u.id, []) : [],
                });
            }
            case 'register': {
                const name = str(d.full_name), email = str(d.email).toLowerCase(), pw = d.password, conf = d.confirm_password;
                if (!name || !email || !pw || !conf) return fail('All fields are required.');
                if (name.length > 100) return fail('Name must be 100 characters or fewer.');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return fail('Enter a valid email address.');
                const problem = passwordProblem(pw);
                if (problem) return fail(problem);
                if (pw !== conf) return fail('Passwords do not match.');
                const all = users();
                if (all.some((u) => u.email === email)) return fail('An account with this email already exists. Try signing in.', {}, 409);
                const s = salt();
                const user = { id: (get('seq:user', 0)) + 1, full_name: name, email, salt: s, hash: await sha256(s + pw), phone: '', address: '', photo: null, created_at: now() };
                set('seq:user', user.id); all.push(user); saveUsers(all);
                startSession(user, false);
                return ok('Account created. Welcome to Velvet Vogue!', { user: userPayload(user), csrf: '', cart_count: cartCount(user.id) }, 201);
            }
            case 'login': {
                const email = str(d.email).toLowerCase(), pw = d.password;
                if (!email || !pw) return fail('Enter your email and password.');
                const attempts = get('attempts', {});
                const cutoff = Date.now() - 15 * 60 * 1000;
                const recent = (attempts[email] || []).filter((t) => t > cutoff);
                if (recent.length >= 5) return fail('Too many failed attempts. Please wait 15 minutes and try again.', {}, 429);
                const u = users().find((x) => x.email === email);
                if (!u || (await sha256(u.salt + pw)) !== u.hash) {
                    recent.push(Date.now()); attempts[email] = recent; set('attempts', attempts);
                    return fail('Incorrect email or password.', {}, 401);
                }
                delete attempts[email]; set('attempts', attempts);
                startSession(u, d.remember === '1');
                return ok('Signed in.', { user: userPayload(u), csrf: '', cart_count: cartCount(u.id) });
            }
            case 'logout':
                del(SS, 'vv:session'); del(LS, 'vv:session'); del(LS, 'vv:promo');
                return ok('Signed out.', { csrf: '' });
        }
        return fail('Unknown action.');
    }

    /* ---------- cart ---------- */
    const cartKey = (id) => 'cart:' + (id || 'guest');
    const lines = (id) => get(cartKey(id), []);
    const saveLines = (id, l) => set(cartKey(id), l);
    const same = (a, pid, size, colour) => a.product_id === pid && a.size === size && a.colour === colour;
    const cartCount = (id) => lines(id).reduce((n, l) => n + l.quantity, 0);

    function resolveVariant(pid, size, colour) {
        const p = byId(pid);
        if (!p) return { error: fail('That product is no longer available.', {}, 404) };
        if (!size) size = p.sizes.includes('M') ? 'M' : p.sizes[0];
        if (!p.sizes.includes(size)) return { error: fail('Please choose a valid size.') };
        if (p.colours.length) {
            if (!colour) colour = p.colours[0];
            if (!p.colours.includes(colour)) return { error: fail('Please choose a valid colour.') };
        } else colour = '';
        return { p, size, colour };
    }

    function addLine(id, p, size, colour, qty) {
        const cap = Math.min(stockOf(p), D.MAX_LINE_QTY);
        if (cap < 1) return { error: fail('Sorry, this item is out of stock.', {}, 409) };
        const l = lines(id);
        const existing = l.find((x) => same(x, p.id, size, colour));
        const next = Math.min((existing ? existing.quantity : 0) + qty, cap);
        if (existing) existing.quantity = next; else l.push({ product_id: p.id, size, colour, quantity: next });
        saveLines(id, l);
        return { quantity: next };
    }

    function mergeGuestCart(id) {
        const guest = lines(null);
        guest.forEach((g) => { const p = byId(g.product_id); if (p && stockOf(p) >= 1) addLine(id, p, g.size, g.colour, g.quantity); });
        saveLines(null, []);
    }

    function hydrate(l) {
        const items = [];
        l.forEach((x) => {
            const p = byId(x.product_id); if (!p) return;
            const stock = stockOf(p), max = Math.min(stock, D.MAX_LINE_QTY);
            items.push({ product_id: p.id, name: p.name, image: p.image, size: x.size, colour: x.colour, unit_price: p.price,
                         quantity: x.quantity, max_qty: max, available: max >= 1 && x.quantity <= stock, line_total: money(p.price * x.quantity) });
        });
        return items;
    }

    function totals(items, promoCode) {
        let subtotal = 0, count = 0;
        items.forEach((i) => { subtotal += i.line_total; count += i.quantity; });
        subtotal = money(subtotal);
        let discount = 0, promo = null;
        if (promoCode && D.PROMOS[promoCode]) { promo = promoCode; discount = money(subtotal * D.PROMOS[promoCode] / 100); }
        const delivery = count === 0 || subtotal >= D.FREE_DELIVERY_OVER ? 0 : D.DELIVERY_FEE;
        return { item_count: count, subtotal, discount, promo_code: promo, delivery_fee: delivery, total: money(subtotal - discount + delivery),
                 free_delivery_over: D.FREE_DELIVERY_OVER, amount_to_free_delivery: count === 0 || delivery === 0 ? 0 : money(D.FREE_DELIVERY_OVER - subtotal) };
    }

    function snapshot(id) {
        const items = hydrate(lines(id));
        const t = totals(items, get('promo', null));
        if (!t.promo_code) del(LS, 'vv:promo');
        return { items, totals: t };
    }

    function cartApi(d) {
        const id = uid();
        switch (d.action) {
            case 'get': return ok('OK', snapshot(id));
            case 'add': {
                const qty = Math.max(1, Math.min(D.MAX_LINE_QTY, int(d.quantity, 1)));
                const v = resolveVariant(int(d.product_id), str(d.size), str(d.colour)); if (v.error) return v.error;
                const r = addLine(id, v.p, v.size, v.colour, qty); if (r.error) return r.error;
                return ok(v.p.name + ' added to your cart.', { line_quantity: r.quantity, cart_count: cartCount(id), size: v.size, colour: v.colour });
            }
            case 'update': {
                const pid = int(d.product_id), qty = int(d.quantity);
                const v = resolveVariant(pid, str(d.size), str(d.colour)); if (v.error) return v.error;
                if (qty < 1) return fail('Quantity must be at least 1. Use remove to delete an item.');
                const cap = Math.min(stockOf(v.p), D.MAX_LINE_QTY);
                const l = lines(id), line = l.find((x) => same(x, pid, v.size, v.colour));
                if (qty > cap) {
                    if (line) { line.quantity = Math.max(1, cap); saveLines(id, l); }
                    return fail(cap < 1 ? 'This item is now out of stock.' : `Only ${cap} available for this item.`, snapshot(id), 409);
                }
                if (line) { line.quantity = qty; saveLines(id, l); }
                return ok('Cart updated.', snapshot(id));
            }
            case 'remove': {
                const pid = int(d.product_id);
                saveLines(id, lines(id).filter((x) => !same(x, pid, str(d.size), str(d.colour))));
                return ok('Item removed.', snapshot(id));
            }
            case 'clear': saveLines(id, []); del(LS, 'vv:promo'); return ok('Cart cleared.', snapshot(id));
            case 'promo': {
                const code = str(d.code).toUpperCase();
                if (!code) { del(LS, 'vv:promo'); return ok('Promo code removed.', snapshot(id)); }
                if (!D.PROMOS[code]) return fail('That promo code is not valid.', snapshot(id), 422);
                set('promo', code);
                const snap = snapshot(id);
                return ok(`${D.PROMOS[code]}% discount applied. You saved LKR ${Math.round(snap.totals.discount).toLocaleString('en-US')}.`, snap);
            }
        }
        return fail('Unknown action.');
    }

    /* ---------- wishlist ---------- */
    function wishlistApi(d) {
        const id = uid();
        if (!id) return fail('Please sign in to continue.', { login_required: true }, 401);
        const ids = get('wish:' + id, []);
        if (d.action === 'get') return ok('OK', { products: ids.map(byId).filter(Boolean).reverse().map(payload) });
        if (d.action === 'toggle') {
            const pid = int(d.product_id);
            if (!byId(pid)) return fail('That product is no longer available.', {}, 404);
            const i = ids.indexOf(pid);
            if (i >= 0) ids.splice(i, 1); else ids.push(pid);
            set('wish:' + id, ids);
            return ok(i >= 0 ? 'Removed from your wishlist.' : 'Saved to your wishlist.', { wishlisted: i < 0, count: ids.length });
        }
        return fail('Unknown action.');
    }

    /* ---------- orders / checkout ---------- */
    const orders = () => get('orders', []);

    function checkoutApi(d) {
        const id = uid();
        if (!id) return fail('Please sign in to continue.', { login_required: true }, 401);

        if (d.action === 'place') {
            const name = str(d.delivery_name), phone = str(d.delivery_phone), address = str(d.delivery_address), city = str(d.delivery_city), notes = str(d.notes);
            if (!name || !phone || !address || !city) return fail('Fill in your name, phone, address and city.');
            if (name.length > 150 || city.length > 100 || address.length > 500) return fail('One of the delivery fields is too long.');
            if (!validPhone(phone)) return fail('Enter a valid phone number, e.g. 077 123 4567.');
            if (notes.length > 500) return fail('Order notes must be 500 characters or fewer.');
            if ((d.payment_method || 'cod') !== 'cod') return fail('Cash on delivery is the only payment method available right now.');

            const cart = lines(id);
            if (!cart.length) return fail('Your cart is empty.', { cart_problem: true }, 409);
            const demand = {}, items = [];
            for (const l of cart) {
                const p = byId(l.product_id);
                if (!p) return fail('An item in your cart is no longer available. Please review your cart.', { cart_problem: true }, 409);
                demand[p.id] = (demand[p.id] || 0) + l.quantity;
                if (demand[p.id] > stockOf(p)) return fail(`Only ${stockOf(p)} left of "${p.name}". Please update your cart.`, { cart_problem: true }, 409);
                items.push({ product_id: p.id, name: p.name, image: p.image, unit_price: p.price, quantity: l.quantity, size: l.size, colour: l.colour, line_total: money(p.price * l.quantity) });
            }
            const t = totals(items, get('promo', null));
            const seq = get('seq:order', 0) + 1; set('seq:order', seq);
            const order = {
                id: seq, order_number: `VV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`, user_id: id,
                subtotal: t.subtotal, delivery_fee: t.delivery_fee, discount_amount: t.discount, total_amount: t.total, promo_code: t.promo_code,
                status: 'pending', payment_method: 'cod', delivery_name: name, delivery_phone: phone, delivery_address: address, delivery_city: city,
                notes: notes || null, created_at: now(), items,
            };
            const all = orders(); all.push(order); set('orders', all);
            const s = sold(); Object.entries(demand).forEach(([pid, q]) => (s[pid] = (s[pid] || 0) + q)); set('sold', s);
            saveLines(id, []); del(LS, 'vv:promo');
            const all2 = users(), me = all2.find((u) => u.id === id);
            if (me) { me.phone = me.phone || phone; me.address = me.address || `${address}, ${city}`; saveUsers(all2); }
            return ok('Order placed.', { order_id: order.id, order_number: order.order_number }, 201);
        }
        if (d.action === 'order') {
            const o = orders().find((x) => x.id === int(d.id) && x.user_id === id);   // owner-only
            if (!o) return fail('Order not found.', {}, 404);
            return ok('OK', { order: { ...o, items: o.items.map((i) => ({ product_id: i.product_id, name: i.name, quantity: i.quantity, unit_price: i.unit_price, size: i.size, colour: i.colour, image: i.image })) } });
        }
        return fail('Unknown action.');
    }

    /* ---------- profile ---------- */
    function resizeToDataUrl(file, size) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('read'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('decode'));
                img.onload = () => {
                    const side = Math.min(img.width, img.height);
                    const c = document.createElement('canvas'); c.width = c.height = size;
                    c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
                    resolve(c.toDataURL('image/jpeg', 0.85));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function profileApi(d) {
        const me = currentUser();
        if (!me) return fail('Please sign in to continue.', { login_required: true }, 401);
        const action = d instanceof FormData ? d.get('action') : d.action;
        const patch = (fields) => { const all = users(); Object.assign(all.find((u) => u.id === me.id), fields); saveUsers(all); };

        switch (action) {
            case 'get':
                return ok('OK', { user: { id: me.id, full_name: me.full_name, email: me.email, phone: me.phone || '', address: me.address || '', profile_photo: me.photo || null, created_at: me.created_at } });
            case 'update': {
                const name = str(d.full_name), phone = str(d.phone), address = str(d.address);
                if (!name) return fail('Name cannot be empty.');
                if (name.length > 100) return fail('Name must be 100 characters or fewer.');
                if (phone && !validPhone(phone)) return fail('Enter a valid phone number.');
                if (address.length > 500) return fail('Address must be 500 characters or fewer.');
                patch({ full_name: name, phone, address });
                return ok('Profile updated.', { user: { full_name: name, phone, address } });
            }
            case 'change_password': {
                const cur = d.current_password, nw = d.new_password, conf = d.confirm_password;
                if (!cur || !nw || !conf) return fail('Fill in all three password fields.');
                const problem = passwordProblem(nw);
                if (problem) return fail(problem.replace('Password', 'New password').replace('your password', 'your new password'));
                if (nw !== conf) return fail('New passwords do not match.');
                if ((await sha256(me.salt + cur)) !== me.hash) return fail('Your current password is incorrect.', {}, 403);
                const s = salt(); patch({ salt: s, hash: await sha256(s + nw) });
                return ok('Password changed.');
            }
            case 'upload_photo': {
                const f = d.get('photo');
                if (!f || !f.size) return fail('Choose an image to upload.');
                if (f.size > 2 * 1024 * 1024) return fail('That image is too large. Maximum size is 2 MB.');
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return fail('Only JPG, PNG or WebP images are allowed.');
                try { const url = await resizeToDataUrl(f, 256); patch({ photo: url }); return ok('Profile photo updated.', { photo: url }); }
                catch (e) { return fail('That file could not be read as an image.'); }
            }
            case 'orders': {
                const mine = orders().filter((o) => o.user_id === me.id).sort((a, b) => b.id - a.id);
                return ok('OK', { orders: mine.map((o) => ({ id: o.id, order_number: o.order_number, total_amount: o.total_amount, status: o.status, created_at: o.created_at,
                    item_count: o.items.reduce((n, i) => n + i.quantity, 0), items: o.items.map((i) => i.name).join(', ') })) });
            }
        }
        return fail('Unknown action.');
    }

    /* ---------- contact (validated, kept on this device only) ---------- */
    const TOPICS = { order: 'Order Enquiry', returns: 'Returns & Refunds', sizing: 'Sizing Help', payment: 'Payment Issue', general: 'General Enquiry', account: 'Account & Password', other: 'Other' };
    function contactApi(d) {
        if (str(d.website)) return ok('Thanks! Your message has been sent.');
        const name = str(d.name), email = str(d.email).toLowerCase(), subject = str(d.subject), message = str(d.message);
        if (!name || !email || !subject || !message) return fail('Fill in every field before sending.');
        if (name.length > 150) return fail('Name must be 150 characters or fewer.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address.');
        if (message.length < 10) return fail('Your message is too short. Add a little more detail.');
        if (message.length > 3000) return fail('Your message is too long. Keep it under 3,000 characters.');
        if (!TOPICS[subject]) return fail('Choose a topic from the list.');
        const all = get('messages', []);
        if (all.filter((m) => Date.now() - m.at < 3600000).length >= 5) return fail('You have sent several messages recently. Please try again in an hour.', {}, 429);
        all.push({ at: Date.now(), name, email, topic: TOPICS[subject], message }); set('messages', all);
        return ok(`Thanks, ${name.split(' ')[0]}. Your message has been received.`, {}, 201);
    }

    /* ---------- router ---------- */
    window.VV_BACKEND = async function (file, data) {
        try {
            switch (file) {
                case 'auth.php': return await authApi(data);
                case 'products.php': return productsApi(data);
                case 'cart.php': return cartApi(data);
                case 'wishlist.php': return wishlistApi(data);
                case 'checkout.php': return checkoutApi(data);
                case 'profile.php': return await profileApi(data);
                case 'contact.php': return contactApi(data);
            }
            return fail('Unknown endpoint.', {}, 404);
        } catch (e) {
            console.error(e);
            return fail('Something went wrong. Please try again.', {}, 500);
        }
    };

    /* demo helper: run VV_RESET() in the console to wipe all saved shop data */
    window.VV_RESET = function () {
        [LS, SS].forEach((s) => { if (s) Object.keys(s).filter((k) => k.startsWith('vv:')).forEach((k) => s.removeItem(k)); });
        location.reload();
    };
})();
