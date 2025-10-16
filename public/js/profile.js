async function loadProfile() {
  const res = await fetch('src/api/profile.php', { credentials: 'include' });
  if (res.status === 401) { window.location.href = '/'; return; }
  const data = await res.json();
  if (data?.email !== undefined) {
    document.getElementById('profile-email').value = data.email || '';
  }
}

async function saveEmail() {
  const emailInput = document.getElementById('profile-email');
  const emailMsg = document.getElementById('email-msg');
  emailMsg.style.color = '#ef4444';
  emailMsg.textContent = '';
  const email = emailInput.value.trim();
  if (!email) {
    emailMsg.textContent = 'Email is required.';
    return;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    emailMsg.textContent = 'Enter a valid email address.';
    return;
  }
  try {
    const res = await fetch('src/api/profile.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.status === 401) {
      window.location.href = '/';
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      emailMsg.textContent = data?.error || 'Failed to update email.';
      return;
    }
    emailMsg.style.color = 'green';
    emailMsg.textContent = 'Email updated successfully.';
  } catch (error) {
    emailMsg.textContent = 'Network error';
  }
}

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

document.getElementById('save-email').addEventListener('click', saveEmail);
document.getElementById('change-password').addEventListener('click', changePassword);
document.getElementById('back-home').addEventListener('click', () => {
  window.location.href = '/';
});
loadProfile();
