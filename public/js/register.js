async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const msg = document.getElementById('reg-msg');
  msg.style.color = '#ef4444';
  msg.textContent = '';
  if (!username || !email || !password) { msg.textContent = 'Username, email, and password required'; return; }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    msg.textContent = 'Enter a valid email address';
    return;
  }
  try {
    const res = await fetch('src/api/register.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
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


