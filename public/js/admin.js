(function () {
    // Refresh button
    const refresh = document.querySelector('[data-admin-refresh]');
    if (refresh) {
        refresh.addEventListener('click', () => window.location.reload());
    }

    // Delete user
    document.querySelectorAll('[data-delete-user]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-delete-user');
            if (!confirm('Delete this user? This cannot be undone.')) return;
            fetch('/admin/users/' + id + '/delete', { method: 'POST' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.error) { alert(data.error); return; }
                    const row = btn.closest('tr');
                    if (row) row.remove();
                })
                .catch(function () { alert('Something went wrong.'); });
        });
    });

    // Delete pantry item
    document.querySelectorAll('[data-delete-item]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-delete-item');
            if (!confirm('Delete this item?')) return;
            fetch('/admin/items/' + id + '/delete', { method: 'POST' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.error) { alert(data.error); return; }
                    const row = btn.closest('tr');
                    if (row) row.remove();
                })
                .catch(function () { alert('Something went wrong.'); });
        });
    });

    // Toggle admin
    document.querySelectorAll('[data-toggle-admin]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-toggle-admin');
            fetch('/admin/users/' + id + '/toggle-admin', { method: 'POST' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.error) { alert(data.error); return; }
                    btn.textContent = data.isAdmin ? 'Remove Admin' : 'Make Admin';
                    const cell = btn.closest('tr').querySelector('[data-admin-status]');
                    if (cell) cell.textContent = data.isAdmin ? 'Yes' : 'No';
                })
                .catch(function () { alert('Something went wrong.'); });
        });
    });
})();
