async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const avatar_url = document.getElementById('reg-avatar').value.trim();
  const msg = document.getElementById('reg-msg');
  msg.textContent = '';
  if (!username || !password) { msg.textContent = 'Username and password required'; return; }
  try {
    const res = await fetch('src/api/register.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, avatar_url }) });
    const data = await res.json();
    if (data.success) {
      msg.style.color = 'green';
      msg.textContent = 'Registered! Awaiting admin approval.';
    } else {
      msg.textContent = data.error || 'Failed to register';
    }
  } catch (e) {
    msg.textContent = 'Network error';
  }
}

document.getElementById('reg-submit').addEventListener('click', register);


