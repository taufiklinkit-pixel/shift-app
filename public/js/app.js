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

// Icon map
const iconMap = {
  'note': '📝',
  'warning': '⚠️',
  'maintenance': '🔧',
  'done': '✅',
  'info': 'ℹ️'
};

// Format date: DD/Mon/YYYY hh:mm AM/PM
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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

// API Functions
async function apiRequest(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      alert('Session expired. Please log in again.');
      logout();
      return null;
    }
    
    return await response.json();
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
    
    if (data && data.success) {
      currentUsername.textContent = data.username;
      loginScreen.style.display = 'none';
      appScreen.style.display = 'block';
      // show admin link if admin
      const adminLink = document.getElementById('admin-link');
      if (adminLink) {
        adminLink.style.display = data.username === 'admin' ? 'inline-block' : 'none';
      }
      // hide register link for logged-in users
      const registerLink = document.getElementById('register-link');
      if (registerLink) {
        registerLink.style.display = 'none';
      }
      loadMessages();
    } else {
      loginError.textContent = data?.error || 'Login failed';
    }
  } catch (error) {
    loginError.textContent = 'Login failed';
  }
}

function logout() {
  apiRequest('src/api/logout.php', { method: 'POST' })
    .then(() => {
      appScreen.style.display = 'none';
      loginScreen.style.display = 'block';
      loginUsername.value = '';
      loginPassword.value = '';
      loginError.textContent = '';
    })
    .catch(() => {
      // Still logout locally
      appScreen.style.display = 'none';
      loginScreen.style.display = 'block';
    });
}

// Message Functions
let currentPage = 1;
const pageSize = 15; // 5 rows x 3 columns

async function loadMessages(page = currentPage) {
  try {
    const data = await apiRequest(`src/api/messages.php?page=${page}&pageSize=${pageSize}`);
    if (data && data.items) {
      currentPage = data.page;
      messagesDiv.innerHTML = '';
      const isAdmin = (document.getElementById('current-username').textContent === 'admin');
      data.items.forEach(msg => {
        const safe = escapeHtml(String(msg.message || ''));
        const card = document.createElement('div');
        card.className = 'message-card card';
        card.innerHTML = `
          <div class="card-header">
            <div class="card-title">
              ${msg.avatar_url ? `<img class=\"avatar\" src=\"${encodeURI(msg.avatar_url)}\" alt=\"${msg.username}\" />` : `<div class=\"avatar placeholder\">${(msg.username||'')[0]?.toUpperCase()||'U'}</div>`}
              <span class="icon">${iconMap[msg.icon] || '📝'}</span>
              <span class="title-text">${msg.username}</span>
            </div>
            <div class="card-subtitle">${timeAgo(msg.created_at)} · ${formatDateTime(msg.created_at)}</div>
          </div>
          <div class="card-body">
            <div class="message-content">${safe.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="card-footer">
            <button class="btn-chip" title="Type">${iconMap[msg.icon] || '📝'} ${msg.icon}</button>
            ${isAdmin ? `<button class="btn-danger" data-del="${msg.id}">Delete</button>` : ''}
          </div>
        `;
        messagesDiv.appendChild(card);
      });

      if (isAdmin) {
        document.querySelectorAll('[data-del]')?.forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-del');
            if (!confirm('Delete this message?')) return;
            try {
              await apiRequest(`src/api/messages.php?id=${id}`, { method: 'DELETE' });
              loadMessages(currentPage);
            } catch {
              alert('Failed to delete');
            }
          });
        });
      }

      // Render pagination controls
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
    }
  } catch (error) {
    console.error('Load messages error:', error);
  }
}

async function createMessage() {
  const message = messageInput.value.trim();
  const icon = iconSelect.value;
  
  if (!message) {
    alert('Please enter a message.');
    return;
  }
  
  try {
    await apiRequest('src/api/messages.php', {
      method: 'POST',
      body: JSON.stringify({ message, icon })
    });
    messageInput.value = '';
    loadMessages(1); // go back to first page to see newest
  } catch (error) {
    alert('Failed to send message.');
  }
}

// Event Listeners
loginBtn.addEventListener('click', login);
loginPassword.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});

logoutBtn.addEventListener('click', logout);
sendBtn.addEventListener('click', createMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    createMessage();
  }
});

// Auto-refresh
setInterval(() => loadMessages(currentPage), 10000);