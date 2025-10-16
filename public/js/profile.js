async function loadProfile() {
  const res = await fetch('src/api/profile.php', { credentials: 'include' });
  if (res.status === 401) { window.location.href = '/'; return; }
}

document.getElementById('upload-avatar').addEventListener('click', async () => {
  const fileInput = document.getElementById('avatar-file');
  const msg = document.getElementById('profile-msg');
  msg.style.color = '#ef4444';
  msg.textContent = '';
  if (!fileInput.files || !fileInput.files[0]) { msg.textContent = 'Select an image file'; return; }
  const form = new FormData();
  form.append('avatar', fileInput.files[0]);
  try {
    const res = await fetch('src/api/profile.php', { method: 'POST', credentials: 'include', body: form });
    const data = await res.json();
    if (data.success) { msg.style.color = 'green'; msg.textContent = 'Avatar uploaded'; }
    else { msg.textContent = data.error || 'Upload failed'; }
  } catch { msg.textContent = 'Network error'; }
});

async function changePassword() {
  const current = document.getElementById('current-password').value;
  const next = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const msg = document.getElementById('password-msg');
  msg.style.color = '#ef4444';
  msg.textContent = '';

  if (!current || !next) {
    msg.textContent = 'Enter current and new passwords.';
    return;
  }
  if (next !== confirm) {
    msg.textContent = 'New password and confirmation do not match.';
    return;
  }

  try {
    const res = await fetch('src/api/change_password.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: next })
    });

    if (res.status === 401) {
      window.location.href = '/';
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data?.error || 'Failed to update password.';
      return;
    }

    msg.style.color = 'green';
    msg.textContent = 'Password updated successfully.';
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  } catch (error) {
    msg.textContent = 'Network error';
  }
}

document.getElementById('change-password').addEventListener('click', changePassword);
loadProfile();


