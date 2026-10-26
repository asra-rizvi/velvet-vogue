/* Contact form -> api/contact.php */
(function () {
    const $ = (id) => document.getElementById(id);
    const box = $('cf-alert'), btn = $('cf-btn');
    const show = (text, type) => { box.textContent = text; box.className = 'cf-alert show ' + type; };

    const topic = VV.qs('topic');
    if (topic && [...$('cf-subject').options].some((o) => o.value === topic)) $('cf-subject').value = topic;

    VV.ready.then(() => { if (VV.state.user) { if (!$('cf-name').value) $('cf-name').value = VV.state.user.name; if (!$('cf-email').value) $('cf-email').value = VV.state.user.email; } });

    btn.addEventListener('click', async () => {
        const data = { name: $('cf-name').value.trim(), email: $('cf-email').value.trim(), subject: $('cf-subject').value, message: $('cf-message').value.trim(), website: $('cf-website').value };
        if (!data.name || !data.email || !data.subject || !data.message) return show('Fill in every field before sending.', 'error');
        if (data.message.length < 10) return show('Your message is too short. Add a little more detail.', 'error');
        await VV.ready;
        const label = btn.innerHTML; btn.disabled = true; btn.textContent = 'Sending...';
        const r = await VV.api('contact.php', data);
        btn.disabled = false; btn.innerHTML = label;
        show(r.message, r.success ? 'success' : 'error');
        if (r.success) { $('cf-message').value = ''; $('cf-subject').value = ''; }
    });
})();
