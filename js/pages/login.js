/* Sign in / create account (same design as before; now talks to the real API) */
(function () {
    const alertBox = document.getElementById('auth-alert');
    const next = VV.safeNext(VV.qs('next'));

    function show(text, type) { alertBox.textContent = text; alertBox.className = 'auth-alert show ' + type; }
    function hide() { alertBox.className = 'auth-alert'; }

    function switchTab(which) {
        document.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === which));
        document.getElementById('login-form').classList.toggle('active', which === 'login');
        document.getElementById('register-form').classList.toggle('active', which === 'register');
        hide();
    }
    document.querySelectorAll('.auth-tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    document.querySelectorAll('.switch-link').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); switchTab(a.dataset.switch); }));
    if (VV.qs('tab') === 'register') switchTab('register');

    // show/hide password
    [['toggle-login-pw', 'login-password'], ['toggle-reg-pw', 'reg-password']].forEach(([btnId, inputId]) => {
        const icon = document.getElementById(btnId), input = document.getElementById(inputId);
        icon.setAttribute('role', 'button'); icon.setAttribute('tabindex', '0'); icon.setAttribute('aria-label', 'Show or hide password');
        const toggle = () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; icon.className = 'bx ' + (show ? 'bx-show' : 'bx-hide') + ' toggle-pw'; };
        icon.addEventListener('click', toggle);
        icon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });

    async function submit(btn, label, data) {
        btn.disabled = true; btn.textContent = label + '...';
        const r = await VV.api('auth.php', data);
        if (r.success) {
            show(r.message, 'success');
            setTimeout(() => { location.href = next; }, 600);
        } else {
            show(r.message, 'error');
            btn.disabled = false; btn.textContent = label;
        }
    }

    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!email || !password) return show('Enter your email and password.', 'error');
        await VV.ready;
        submit(loginBtn, 'Sign In', { action: 'login', email, password, remember: document.getElementById('remember-me').checked ? '1' : '0' });
    });

    const regBtn = document.getElementById('register-btn');
    regBtn.addEventListener('click', async () => {
        const full_name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm_password = document.getElementById('reg-confirm').value;
        if (!full_name || !email || !password || !confirm_password) return show('All fields are required.', 'error');
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return show('Use at least 8 characters, with a letter and a number.', 'error');
        if (password !== confirm_password) return show('Passwords do not match.', 'error');
        if (!document.getElementById('agree-terms').checked) return show('Please agree to the Terms & Privacy Policy.', 'error');
        await VV.ready;
        submit(regBtn, 'Create Account', { action: 'register', full_name, email, password, confirm_password });
    });

    document.querySelectorAll('.auth-form input').forEach((i) => i.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        (document.getElementById('login-form').classList.contains('active') ? loginBtn : regBtn).click();
    }));

    // Already signed in? Skip the form.
    VV.ready.then(() => { if (VV.state.user) location.replace(next === 'index.html' ? 'profile.html' : next); });
})();
