document.addEventListener('DOMContentLoaded', () => {
  // Pull user info from localStorage (set during login)
  const name = localStorage.getItem('userName') || 'John Doe';
  const role = localStorage.getItem('userRoleLabel') || 'Technician';
  const email = localStorage.getItem('userEmail') || 'john.doe@rapid-i.com';
  const phone = localStorage.getItem('userPhone') || '+91 9876543210';
  const tag = localStorage.getItem('userTag') || 'JD';

  document.getElementById('userProfName').textContent = name;
  document.getElementById('userProfRole').textContent = role;
  document.getElementById('userProfEmail').textContent = email;
  document.getElementById('userProfPhone').textContent = phone;
  document.getElementById('userProfAvatarText').textContent = tag;

  // Also update header/profile tag in base.html area if present
  const profileNameEl = document.querySelector('.profile-name');
  if (profileNameEl) profileNameEl.textContent = tag;

  const logoutBtn = document.getElementById('userProfLogoutBtn');
  logoutBtn?.addEventListener('click', () => {
    // Use existing global logout handler if available
    if (typeof window.handleLogout === 'function') {
      window.handleLogout();
      return;
    }
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  });
});

