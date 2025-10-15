async function loadProfile() {
  const res = await fetch('src/api/profile.php', { credentials: 'include' });
  if (res.status === 401) { window.location.href = '/'; return; }
  const data = await res.json();
  document.getElementById('avatar-url').value = data.avatar_url || '';
}

async function saveProfile() {
  const avatar_url = document.getElementById('avatar-url').value.trim();
  const msg = document.getElementById('profile-msg');
  msg.textContent = '';
  try {
    const res = await fetch('src/api/profile.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url }) });
    const data = await res.json();
    if (data.success) { msg.style.color = 'green'; msg.textContent = 'Saved'; }
    else { msg.textContent = data.error || 'Failed'; }
  } catch { msg.textContent = 'Network error'; }
}

document.getElementById('save-profile').addEventListener('click', saveProfile);
document.getElementById('upload-avatar').addEventListener('click', async () => {
  const fileInput = document.getElementById('avatar-file');
  const msg = document.getElementById('profile-msg');
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
loadProfile();


