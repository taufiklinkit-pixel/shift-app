async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options });
  if (res.status === 401 || res.status === 403) {
    alert('Not authorized. Please log in as admin.');
    window.location.href = '/';
    return null;
  }
  return res.json();
}

async function loadUsers() {
  const users = await api('src/api/admin_users.php');
  if (!users) return;
  const tbody = document.getElementById('users-body');
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.username}</td>
      <td>${u.is_approved == 1 ? 'Approved' : 'Pending'}</td>
      <td>
        <div class="row-actions">
          ${u.is_approved == 1 ? '' : `<button class="btn" data-act="approve" data-user="${u.username}">Approve</button>`}
          <button class="btn secondary" data-act="reset" data-user="${u.username}">Reset Password</button>
          ${u.username === 'admin' ? '' : `<button class="btn secondary" data-act="delete" data-user="${u.username}">Delete</button>`}
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

async function createUser() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  if (!username || !password) { alert('Enter username and password'); return; }
  const ok = await api('src/api/admin_users.php', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (ok && ok.success) { document.getElementById('new-username').value = ''; document.getElementById('new-password').value=''; loadUsers(); }
}

document.addEventListener('click', async (e) => {
  const act = e.target.getAttribute('data-act');
  if (!act) return;
  const username = e.target.getAttribute('data-user');
  if (act === 'delete') {
    if (!confirm(`Delete user ${username}?`)) return;
    const ok = await api('src/api/admin_users.php', { method: 'POST', body: JSON.stringify({ action: 'delete', username }) });
    if (ok && ok.success) loadUsers();
  }
  if (act === 'reset') {
    const password = prompt('Enter new password for ' + username);
    if (!password) return;
    const ok = await api('src/api/admin_users.php', { method: 'POST', body: JSON.stringify({ action: 'reset', username, password }) });
    if (ok && ok.success) alert('Password updated');
  }
  if (act === 'approve') {
    const username = e.target.getAttribute('data-user');
    const ok = await api('src/api/admin_users.php', { method: 'POST', body: JSON.stringify({ action: 'approve', username }) });
    if (ok && ok.success) loadUsers();
  }
});

document.getElementById('create-user').addEventListener('click', createUser);

loadUsers();


