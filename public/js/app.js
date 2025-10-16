// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const currentUsername = document.getElementById('current-username');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const iconSelect = document.getElementById('icon-select');
const sendBtn = document.getElementById('send-btn');
const editInfo = document.getElementById('edit-info');

// Icon map
const iconMap = {
  note: '📝',
  warning: '⚠️',
  maintenance: '🔧',
  done: '✅',
  info: 'ℹ️'
};

const MAX_EDITS = 3;
let myMessage = null;
let remainingEdits = MAX_EDITS;
let isSubmitting = false;

function cacheUser(username) {
  try {
    if (username) {
      sessionStorage.setItem('shiftAppUser', username);
    } else {
      sessionStorage.removeItem('shiftAppUser');
    }
  } catch (error) {
    console.warn('Session storage unavailable', error);
  }
}

function showApp(username) {
  currentUsername.textContent = username;
  loginScreen.style.display = 'none';
  appScreen.style.display = 'block';
  const adminLink = document.getElementById('admin-link');
  if (adminLink) {
    adminLink.style.display = username === 'admin' ? 'inline-block' : 'none';
  }
  const registerLink = document.getElementById('register-link');
  if (registerLink) {
    registerLink.style.display = 'none';
  }
}

function initializeForUser(username) {
  showApp(username);
  myMessage = null;
  remainingEdits = MAX_EDITS;
  resetComposeState();
}

// Format date: DD/Mon/YYYY hh:mm AM/PM
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const timePart = date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${day}/${month}/${year} ${timePart}`;
}

// Time ago helper for compact header subtitle
function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now - then) / 1000);
  if (Number.isNaN(seconds)) return '';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isSameDay(dateStr) {
  const reference = new Date(dateStr);
  if (Number.isNaN(reference.getTime())) {
    return false;
  }
  const now = new Date();
  return (
    reference.getFullYear() === now.getFullYear() &&
    reference.getMonth() === now.getMonth() &&
    reference.getDate() === now.getDate()
  );
}

function resetComposeState() {
  if (messageInput) {
    messageInput.value = '';
  }
  if (iconSelect) {
    iconSelect.value = 'note';
  }
  updateEditUI();
}

function populateComposeFromMessage(msg) {
  if (!msg) return;
  if (iconSelect) {
    iconSelect.value = msg.icon || 'note';
  }
  if (messageInput) {
    messageInput.value = msg.message || '';
    messageInput.focus();
  }
  updateEditUI();
}

function updateEditUI() {
  if (!sendBtn) return;

  const hasUser = Boolean((currentUsername?.textContent || '').trim());
  if (!hasUser) {
    sendBtn.textContent = 'Send Note';
    sendBtn.disabled = false;
    if (editInfo) { editInfo.textContent = ''; }
    return;
  }

  if (!myMessage) {
    sendBtn.textContent = "Send Today's Note";
    sendBtn.disabled = isSubmitting;
    if (editInfo) {
      editInfo.textContent = 'One card per day. Share your latest shift update below.';
    }
    return;
  }

  const plural = remainingEdits === 1 ? 'time' : 'times';
  sendBtn.textContent = "Update Today's Note";
  sendBtn.disabled = isSubmitting || remainingEdits <= 0;
  if (editInfo) {
    if (remainingEdits > 0) {
      editInfo.textContent = `You can edit today's card ${remainingEdits} more ${plural}.`;
    } else {
      editInfo.textContent = 'Edit limit reached for today. Contact an admin if you need further changes.';
    }
  }
}

// API Functions
async function apiRequest(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  };

  try {
    const response = await fetch(url, config);
    const isLogoutCall = url.includes('logout.php');

    if (response.status === 401 && !isLogoutCall) {
      alert('Session expired. Please log in again.');
      logout(true);
      return null;
    }

    const raw = await response.text();
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error('Failed to parse API response', parseError);
      }
    }

    if (!response.ok) {
      const error = new Error(data?.error || `Request failed (${response.status})`);
      error.status = response.status;
      if (data) { error.data = data; }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth Functions
async function login() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginError.textContent = 'Please enter username and password';
    return;
  }

  try {
    const data = await apiRequest('src/api/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (!data) {
      return;
    }

    if (data && data.success) {
      initializeForUser(data.username);
      cacheUser(data.username);
      await loadMessages();
    } else {
      loginError.textContent = data?.error || 'Login failed';
    }
  } catch (error) {
    loginError.textContent = error?.data?.error || error?.message || 'Login failed';
  }
}

function logout(skipRequest = false) {
  const performLocalLogout = () => {
    appScreen.style.display = 'none';
    loginScreen.style.display = 'block';
    loginUsername.value = '';
    loginPassword.value = '';
    loginError.textContent = '';
    currentUsername.textContent = '';
    myMessage = null;
    remainingEdits = MAX_EDITS;
    resetComposeState();
    cacheUser(null);
  };

  if (skipRequest) {
    performLocalLogout();
    return;
  }

  apiRequest('src/api/logout.php', { method: 'POST' })
    .catch(() => null)
    .finally(performLocalLogout);
}

// Message Functions
let currentPage = 1;
const pageSize = 15; // 5 rows x 3 columns

async function loadMessages(page = currentPage) {
  if (!currentUsername.textContent) {
    messagesDiv.innerHTML = '';
    updateEditUI();
    return;
  }

  try {
    const data = await apiRequest(`src/api/messages.php?page=${page}&pageSize=${pageSize}`);
    if (!data || !data.items) {
      return;
    }

    currentPage = data.page;
    messagesDiv.innerHTML = '';

    const currentUser = currentUsername.textContent || '';
    const isAdmin = currentUser === 'admin';
    let foundMyMessage = null;
    let editsLeftForMe = MAX_EDITS;

    data.items.forEach((msg) => {
      const safe = escapeHtml(String(msg.message || ''));
      const editCount = Number(msg.edit_count ?? msg.editCount ?? 0);
      const iconKey = iconMap[msg.icon] ? msg.icon : 'note';
      const iconLabel = escapeHtml(iconKey);
      const isMine = msg.username === currentUser;
      const isToday = msg.is_today !== undefined ? Boolean(Number(msg.is_today)) : isSameDay(msg.created_at);
      const isMineToday = isMine && isToday;
      const canEdit = isMineToday && editCount < MAX_EDITS;
      const wasEdited = Boolean(msg.updated_at && msg.updated_at !== msg.created_at);
      const displayTimestamp = wasEdited ? msg.updated_at : msg.created_at;
      const subtitlePrefix = wasEdited ? `Updated ${timeAgo(msg.updated_at)}` : timeAgo(msg.created_at);
      const subtitleDate = formatDateTime(displayTimestamp);

      const card = document.createElement('div');
      const mineClasses = isMineToday ? ' mine mine-today' : (isMine ? ' mine' : '');
      card.className = `message-card card${mineClasses}`;
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">
            ${
              msg.avatar_url
                ? `<img class="avatar" src="${encodeURI(msg.avatar_url)}" alt="${msg.username}" />`
                : `<div class="avatar placeholder">${(msg.username || '').slice(0, 1).toUpperCase() || 'U'}</div>`
            }
            <span class="icon">${iconMap[iconKey]}</span>
            <span class="title-text">${escapeHtml(msg.username || 'Unknown')}</span>
          </div>
          <div class="card-subtitle">${subtitlePrefix} &bull; ${subtitleDate}</div>
        </div>
        <div class="card-body">
          <div class="message-content">${safe.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="card-footer">
          <button class="btn-chip" title="Type">${iconMap[iconKey]} ${iconLabel}</button>
          <div class="card-actions">
            ${canEdit ? `<button class="btn-edit" data-edit="${msg.id}">Edit</button>` : ''}
            ${isAdmin ? `<button class="btn-danger" data-del="${msg.id}">Delete</button>` : ''}
          </div>
        </div>
      `;
      messagesDiv.appendChild(card);

      if (isMineToday && !foundMyMessage) {
        const mineData = {
          id: msg.id,
          message: msg.message || '',
          icon: iconKey,
          edit_count: editCount
        };
        foundMyMessage = mineData;
        editsLeftForMe = Math.max(0, MAX_EDITS - editCount);
        if (canEdit) {
          const editBtn = card.querySelector('[data-edit]');
          if (editBtn) {
            editBtn.addEventListener('click', () => populateComposeFromMessage(mineData));
          }
        }
      }

      if (isAdmin) {
        const deleteBtn = card.querySelector('[data-del]');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (!confirm('Delete this message?')) return;
            try {
              await apiRequest(`src/api/messages.php?id=${msg.id}`, { method: 'DELETE' });
              await loadMessages(currentPage);
            } catch (err) {
              alert(err?.data?.error || 'Failed to delete message.');
            }
          });
        }
      }
    });

    myMessage = foundMyMessage;
    remainingEdits = foundMyMessage ? editsLeftForMe : MAX_EDITS;

    const pagination = document.getElementById('pagination');
    if (pagination) {
      const prevDisabled = currentPage <= 1 ? 'disabled' : '';
      const nextDisabled = currentPage >= data.totalPages ? 'disabled' : '';
      pagination.innerHTML = `
        <button id="pg-prev" class="pg-btn" ${prevDisabled}>Prev</button>
        <span class="pg-info">Page ${data.page} / ${data.totalPages}</span>
        <button id="pg-next" class="pg-btn" ${nextDisabled}>Next</button>
      `;
      const prev = document.getElementById('pg-prev');
      const next = document.getElementById('pg-next');
      if (prev) prev.onclick = () => loadMessages(Math.max(1, currentPage - 1));
      if (next) next.onclick = () => loadMessages(currentPage + 1);
    }
  } catch (error) {
    console.error('Load messages error:', error);
  } finally {
    updateEditUI();
  }
}

async function submitMessage() {
  const message = messageInput.value.trim();
  const icon = iconSelect.value;

  if (!message) {
    alert('Please enter a message.');
    return;
  }

  const isUpdate = Boolean(myMessage);
  if (isUpdate && remainingEdits <= 0) {
    alert('Edit limit reached for today. Contact an admin for help.');
    return;
  }

  const previousLabel = sendBtn.textContent;
  isSubmitting = true;
  updateEditUI();

  try {
    const payload = JSON.stringify({ message, icon });
    if (isUpdate) {
      await apiRequest('src/api/messages.php', { method: 'PUT', body: payload });
      await loadMessages(currentPage);
    } else {
      await apiRequest('src/api/messages.php', { method: 'POST', body: payload });
      await loadMessages(1);
    }
    resetComposeState();
  } catch (error) {
    if (error?.status === 409) {
      alert(error?.data?.error || 'You already submitted a card today. Loading it now.');
      await loadMessages();
    } else if (error?.status === 403) {
      alert(error?.data?.error || 'Edit limit reached for today.');
      await loadMessages();
    } else {
      alert(error?.data?.error || 'Failed to save message.');
    }
  } finally {
    isSubmitting = false;
    sendBtn.textContent = previousLabel;
    updateEditUI();
  }
}

// Event Listeners
loginBtn.addEventListener('click', login);
loginPassword.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});

logoutBtn.addEventListener('click', () => logout(false));
sendBtn.addEventListener('click', submitMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitMessage();
  }
});

async function checkExistingSession(shouldLoadMessages = true) {
  try {
    const res = await fetch('src/api/profile.php', { credentials: 'include' });
    if (res.status === 401) {
      cacheUser(null);
      return;
    }
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    if (!data?.username) {
      return;
    }

    initializeForUser(data.username);
    cacheUser(data.username);
    if (shouldLoadMessages) {
      await loadMessages();
    }
  } catch (error) {
    console.error('Session bootstrap failed', error);
  }
}

async function bootstrapApp() {
  let cachedUser = null;
  try {
    cachedUser = sessionStorage.getItem('shiftAppUser');
  } catch (error) {
    cachedUser = null;
  }

  if (cachedUser) {
    initializeForUser(cachedUser);
    cacheUser(cachedUser);
    await loadMessages();
    checkExistingSession(false);
  } else {
    checkExistingSession(true);
  }
}

// Auto-refresh
setInterval(() => loadMessages(currentPage), 10000);

bootstrapApp();
