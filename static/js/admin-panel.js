document.addEventListener('DOMContentLoaded', () => {
  const users = [
    {
      name: 'John Doe',
      role: 'User',
      email: 'john.doe@example.com',
      phone: '9876543210',
      password: '••••••••',
      created: '15/01/2024'
    },
    {
      name: 'Jane Smith',
      role: 'Admin',
      email: 'jane.smith@example.com',
      phone: '9876543211',
      password: '••••••••',
      created: '10/01/2024'
    },
    {
      name: 'Mike Johnson',
      role: 'User',
      email: 'mike.johnson@example.com',
      phone: '9876543212',
      password: '••••••••',
      created: '01/02/2024'
    },
    {
      name: 'Sarah Williams',
      role: 'User',
      email: 'sarah.williams@example.com',
      phone: '9876543213',
      password: '••••••••',
      created: '10/02/2024'
    }
  ];

  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  users.forEach((u) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>
        <span class="admin-role-pill ${u.role.toLowerCase()}">${u.role}</span>
      </td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td class="admin-password-dots">${u.password}</td>
      <td>${u.created}</td>
      <td>
        <div class="admin-action-cell">
          <button type="button" class="admin-btn-edit">Edit</button>
          <button type="button" class="admin-btn-delete">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Simple dummy handlers to match UI expectations
  tbody.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-btn-edit')) {
      alert('Edit action (demo only)');
    }
    if (e.target.classList.contains('admin-btn-delete')) {
      if (confirm('Are you sure you want to delete this user?')) {
        const row = e.target.closest('tr');
        if (row) row.remove();
      }
    }
  });

  const createBtn = document.getElementById('adminCreateUserBtn');

  const registerOverlay = document.getElementById('adminRegisterOverlay');
  const registerCloseBtn = document.getElementById('adminRegisterCloseBtn');
  const registerCancelBtn = document.getElementById('adminRegisterCancelBtn');
  const registerForm = document.getElementById('adminRegisterForm');

  function openRegisterModal() {
    if (!registerOverlay) return;
    registerOverlay.classList.add('show');
    registerOverlay.setAttribute('aria-hidden', 'false');
    // Focus first input for nicer UX
    const firstInput = registerOverlay.querySelector('input, select, button');
    firstInput?.focus();
  }

  function closeRegisterModal() {
    if (!registerOverlay) return;
    registerOverlay.classList.remove('show');
    registerOverlay.setAttribute('aria-hidden', 'true');
    registerForm?.reset();
  }

  if (createBtn) {
    createBtn.addEventListener('click', openRegisterModal);
  }

  registerCloseBtn?.addEventListener('click', closeRegisterModal);
  registerCancelBtn?.addEventListener('click', closeRegisterModal);

  // Click outside to close
  registerOverlay?.addEventListener('click', (e) => {
    if (e.target === registerOverlay) closeRegisterModal();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && registerOverlay?.classList.contains('show')) {
      closeRegisterModal();
    }
  });

  // Demo submit (no backend yet)
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(registerForm);
    const pwd = String(fd.get('password') || '');
    const confirm = String(fd.get('confirm_password') || '');

    if (pwd.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (pwd !== confirm) {
      alert('Password and Confirm Password must match');
      return;
    }

    alert('User registered (demo only)');
    closeRegisterModal();
  });
});

