/* My Account: orders, details, password, photo */
(async function () {
    await VV.ready;
    if (!VV.state.user) { location.replace('login.html?next=profile.html'); return; }

    const $ = (id) => document.getElementById(id);
    const msgOf = (text, error) => VV.toast(text, { error });

    /* tabs */
    const tabs = [...document.querySelectorAll('.profile-tab')];
    const activate = (tab) => {
        tabs.forEach((t) => t.classList.toggle('active', t === tab));
        document.querySelectorAll('.profile-panel').forEach((p) => p.classList.remove('active'));
        $('tab-' + tab.dataset.tab).classList.add('active');
    };
    tabs.forEach((t) => {
        t.addEventListener('click', () => activate(t));
        t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(t); } });
    });

    /* header + form */
    function paintUser(u) {
        $('profile-name').textContent = u.full_name;
        $('profile-email').textContent = u.email;
        const [first, ...rest] = u.full_name.split(' ');
        $('pf-fname').value = first || ''; $('pf-lname').value = rest.join(' ');
        $('pf-email').value = u.email; $('pf-phone').value = u.phone || ''; $('pf-address').value = u.address || '';
        if (u.profile_photo) {
            let img = $('avatar').querySelector('img');
            if (!img) { img = document.createElement('img'); img.alt = 'Your profile photo'; $('avatar').prepend(img); }
            img.src = u.profile_photo;
            $('avatar-icon').hidden = true;
        }
    }
    const pr = await VV.api('profile.php', { action: 'get' });
    if (pr.success) paintUser(pr.user); else return msgOf(pr.message, true);

    /* orders */
    const body = $('orders-body');
    const orders = await VV.api('profile.php', { action: 'orders' });
    if (orders.success && orders.orders.length) {
        body.innerHTML = orders.orders.map((o) => `
            <tr>
                <td><a href="order-confirmation.html?id=${o.id}">${VV.esc(o.order_number)}</a></td>
                <td>${new Date(o.created_at.replace(' ', 'T')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td>${VV.esc(o.items || '')}${o.item_count > 1 ? ` <span style="color:#888">(${o.item_count} items)</span>` : ''}</td>
                <td>${VV.fmt(o.total_amount)}</td>
                <td><span class="status-badge ${VV.esc(o.status)}">${VV.esc(o.status)}</span></td>
            </tr>`).join('');
    } else {
        $('orders-table').outerHTML = `<div class="empty-orders"><i class='bx bx-package'></i><h3>No orders yet</h3><p>When you place an order it will show up here.</p><p style="margin-top:14px"><a class="btn" href="shop.html">Start shopping</a></p></div>`;
    }

    /* save details */
    $('save-profile').addEventListener('click', async (e) => {
        const b = e.currentTarget; b.disabled = true;
        const full_name = ($('pf-fname').value.trim() + ' ' + $('pf-lname').value.trim()).trim();
        const r = await VV.api('profile.php', { action: 'update', full_name, phone: $('pf-phone').value.trim(), address: $('pf-address').value.trim() });
        b.disabled = false;
        if (r.success) { $('profile-name').textContent = full_name; msgOf('Details saved.'); } else msgOf(r.message, true);
    });

    /* password */
    $('change-password').addEventListener('click', async (e) => {
        const b = e.currentTarget; b.disabled = true;
        const r = await VV.api('profile.php', { action: 'change_password', current_password: $('sec-current').value, new_password: $('sec-new').value, confirm_password: $('sec-confirm').value });
        b.disabled = false;
        if (r.success) { ['sec-current', 'sec-new', 'sec-confirm'].forEach((id) => ($(id).value = '')); msgOf('Password updated.'); } else msgOf(r.message, true);
    });

    /* logout */
    $('logout').addEventListener('click', async () => {
        await VV.api('auth.php', { action: 'logout' });
        location.href = 'index.html';
    });

    /* photo */
    const input = $('avatar-input');
    $('avatar').addEventListener('click', (e) => { if (e.target !== input) input.click(); });
    $('avatar').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', async () => {
        const f = input.files[0]; if (!f) return;
        if (f.size > 2 * 1024 * 1024) return msgOf('That image is too large. Maximum size is 2 MB.', true);
        const fd = new FormData(); fd.append('action', 'upload_photo'); fd.append('photo', f);
        const r = await VV.api('profile.php', fd);
        if (r.success) { paintUser({ ...pr.user, full_name: $('profile-name').textContent, profile_photo: r.photo }); msgOf('Profile photo updated.'); } else msgOf(r.message, true);
        input.value = '';
    });
})();
