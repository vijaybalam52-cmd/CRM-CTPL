// ============================================
// Dynamic Scaling (1920x1080 Canvas)
// ============================================
// Scaling is now handled in CSS using the --app-scale variable
// which is set early in the document head to avoid flicker.

// ============================================
// Password Toggle
// ============================================
function initPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach((btn) => {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
            const field = btn.closest('.password-field');
            const input = field?.querySelector('input');
            if (!input) return;
            const isVisible = input.type === 'text';
            input.type = isVisible ? 'password' : 'text';
            btn.dataset.visible = isVisible ? 'false' : 'true';
            btn.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
        });
    });
}

document.addEventListener('DOMContentLoaded', initPasswordToggles);

// ============================================
// Profile Dropdown
// ============================================
function toggleProfile() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const profile = document.querySelector('.user-profile');
    const dropdown = document.getElementById('profileDropdown');
    
    if (dropdown && !profile?.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// ============================================
// Logout
// ============================================
function handleLogout() {
    // Redirect to server-side logout
    window.location.href = '/logout';
    document.getElementById('profileDropdown')?.classList.remove('show');
}

// ============================================
// Register Modal
// ============================================
// UNUSED: No element with id "showRegister" exists in current templates.
// Safe to remove this handler if you don't plan to add a Register trigger button/link.
document.getElementById('showRegister')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('registerModal').classList.add('show');
});

function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('show');
}

document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Registration successful! Please login with your credentials.');
    closeRegisterModal();
});

// ============================================
// Add New Modal
// ============================================
function showAddNewModal() {
    document.getElementById('addNewModal').classList.add('show');
}

function closeAddNewModal() {
    document.getElementById('addNewModal').classList.remove('show');
    // Reset to single entries when closing
    resetAddNewModal();
}

function resetAddNewModal() {
    const machineContainer = document.getElementById('machineEntriesContainer');
    const contactContainer = document.getElementById('contactEntriesContainer');
    
    if (machineContainer) {
        const entries = machineContainer.querySelectorAll('.machine-entry');
        entries.forEach((entry, idx) => {
            if (idx > 0) entry.remove();
            else {
                entry.querySelector('.btn-remove-entry').style.display = 'none';
                entry.querySelectorAll('input, select').forEach(field => field.value = '');
            }
        });
    }
    
    if (contactContainer) {
        const entries = contactContainer.querySelectorAll('.contact-entry');
        entries.forEach((entry, idx) => {
            if (idx > 0) entry.remove();
            else {
                entry.querySelector('.btn-remove-entry').style.display = 'none';
                entry.querySelectorAll('input').forEach(field => field.value = '');
            }
        });
    }
}

// ============================================
// Add/Remove Machine Entry
// ============================================
function addMachineEntry() {
    const container = document.getElementById('machineEntriesContainer');
    if (!container) return;
    
    const entries = container.querySelectorAll('.machine-entry');
    const newIndex = entries.length;
    const firstEntry = entries[0];
    const newEntry = firstEntry.cloneNode(true);
    
    newEntry.setAttribute('data-entry-index', newIndex);
    
    // Clear all input values
    newEntry.querySelectorAll('input, select').forEach(field => {
        field.value = '';
        if (field.name) {
            const name = field.name.replace(/\[\d+\]/, `[${newIndex}]`);
            field.name = name;
        }
    });
    
    // Ensure remove button is visible and has correct onclick
    const removeBtn = newEntry.querySelector('.btn-remove-entry');
    if (removeBtn) {
        removeBtn.style.display = 'block';
        // Set onclick attribute for inline handler
        removeBtn.setAttribute('onclick', 'removeMachineEntry(this)');
        // Also set as direct handler as backup
        removeBtn.onclick = function(e) { 
            e.preventDefault();
            e.stopPropagation();
            removeMachineEntry(this); 
        };
    }
    
    container.appendChild(newEntry);
    
    // Show remove buttons on all entries if more than one
    const allEntries = container.querySelectorAll('.machine-entry');
    allEntries.forEach((ent, idx) => {
        const btn = ent.querySelector('.btn-remove-entry');
        if (btn) {
            btn.style.display = allEntries.length === 1 ? 'none' : 'block';
        }
    });
}

// Make functions globally accessible
window.removeMachineEntry = function(btn) {
    console.log('removeMachineEntry called', btn);
    if (!btn) {
        console.error('No button provided');
        return;
    }
    
    const container = document.getElementById('machineEntriesContainer');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    // Find the parent machine-entry element
    let entry = btn.closest('.machine-entry');
    console.log('Found entry via closest:', entry);
    
    if (!entry) {
        // Fallback: traverse up manually
        let current = btn.parentElement;
        let depth = 0;
        while (current && current !== container && depth < 10) {
            if (current.classList && current.classList.contains('machine-entry')) {
                entry = current;
                console.log('Found entry via traversal:', entry);
                break;
            }
            current = current.parentElement;
            depth++;
        }
    }
    
    if (!entry) {
        console.error('Could not find machine-entry parent');
        alert('Error: Could not find entry to remove');
        return;
    }
    
    console.log('Removing entry:', entry);
    entry.remove();
    
    // Update indices and show/hide remove buttons
    const remaining = container.querySelectorAll('.machine-entry');
    console.log('Remaining entries:', remaining.length);
    
    if (remaining.length === 0) {
        console.error('No entries remaining - this should not happen');
        return;
    }
    
    remaining.forEach((ent, idx) => {
        ent.setAttribute('data-entry-index', idx);
        const removeBtn = ent.querySelector('.btn-remove-entry');
        if (removeBtn) {
            removeBtn.style.display = remaining.length === 1 ? 'none' : 'block';
        }
        ent.querySelectorAll('input, select').forEach(field => {
            if (field.name) {
                const name = field.name.replace(/\[\d+\]/, `[${idx}]`);
                field.name = name;
            }
        });
    });
    
    console.log('Entry removed successfully');
};

// ============================================
// Add/Remove Contact Entry
// ============================================
function addContactEntry() {
    const container = document.getElementById('contactEntriesContainer');
    if (!container) return;
    
    const entries = container.querySelectorAll('.contact-entry');
    const newIndex = entries.length;
    const firstEntry = entries[0];
    const newEntry = firstEntry.cloneNode(true);
    
    newEntry.setAttribute('data-entry-index', newIndex);
    
    // Clear all input values
    newEntry.querySelectorAll('input').forEach(field => {
        field.value = '';
        if (field.name) {
            const name = field.name.replace(/\[\d+\]/, `[${newIndex}]`);
            field.name = name;
        }
    });
    
    // Ensure remove button is visible and has correct onclick
    const removeBtn = newEntry.querySelector('.btn-remove-entry');
    if (removeBtn) {
        removeBtn.style.display = 'block';
        // Set onclick attribute for inline handler
        removeBtn.setAttribute('onclick', 'removeContactEntry(this)');
        // Also set as direct handler as backup
        removeBtn.onclick = function(e) { 
            e.preventDefault();
            e.stopPropagation();
            removeContactEntry(this); 
        };
    }
    
    container.appendChild(newEntry);
    
    // Show remove buttons on all entries if more than one
    const allEntries = container.querySelectorAll('.contact-entry');
    allEntries.forEach((ent, idx) => {
        const btn = ent.querySelector('.btn-remove-entry');
        if (btn) {
            btn.style.display = allEntries.length === 1 ? 'none' : 'block';
        }
    });
}

// Make functions globally accessible
window.removeContactEntry = function(btn) {
    console.log('removeContactEntry called', btn);
    if (!btn) {
        console.error('No button provided');
        return;
    }
    
    const container = document.getElementById('contactEntriesContainer');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    // Find the parent contact-entry element
    let entry = btn.closest('.contact-entry');
    console.log('Found entry via closest:', entry);
    
    if (!entry) {
        // Fallback: traverse up manually
        let current = btn.parentElement;
        let depth = 0;
        while (current && current !== container && depth < 10) {
            if (current.classList && current.classList.contains('contact-entry')) {
                entry = current;
                console.log('Found entry via traversal:', entry);
                break;
            }
            current = current.parentElement;
            depth++;
        }
    }
    
    if (!entry) {
        console.error('Could not find contact-entry parent');
        alert('Error: Could not find entry to remove');
        return;
    }
    
    console.log('Removing entry:', entry);
    entry.remove();
    
    // Update indices and show/hide remove buttons
    const remaining = container.querySelectorAll('.contact-entry');
    console.log('Remaining entries:', remaining.length);
    
    if (remaining.length === 0) {
        console.error('No entries remaining - this should not happen');
        return;
    }
    
    remaining.forEach((ent, idx) => {
        ent.setAttribute('data-entry-index', idx);
        const removeBtn = ent.querySelector('.btn-remove-entry');
        if (removeBtn) {
            removeBtn.style.display = remaining.length === 1 ? 'none' : 'block';
        }
        ent.querySelectorAll('input').forEach(field => {
            if (field.name) {
                const name = field.name.replace(/\[\d+\]/, `[${idx}]`);
                field.name = name;
            }
        });
    });
    
    console.log('Entry removed successfully');
};

// ============================================
// New Contact Modal
// ============================================
function showNewContactModal() {
    document.getElementById('newContactModal').classList.add('show');
}

function closeNewContactModal() {
    document.getElementById('newContactModal').classList.remove('show');
}

// New Machine Modal
// ============================================
function showNewMachineModal() {
    // Set company_id in hidden field
    const companyIdField = document.getElementById('machineCompanyId');
    if (companyIdField) {
        companyIdField.value = currentCompanyId || '';
    }
    document.getElementById('newMachineModal').classList.add('show');
}

function closeNewMachineModal() {
    document.getElementById('newMachineModal').classList.remove('show');
}

// ============================================
// Close Modals on Outside Click
// ============================================
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ============================================
// Sidebar Navigation
// ============================================
document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function(e) {
        // Remove active from all
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active to clicked item
        this.classList.add('active');
        this.querySelector('.sidebar-btn')?.classList.add('active');
    });
});

// ============================================
// Form Validations
// ============================================
function formatInvValue(input) {
    let value = input.value.replace(/,/g, ''); // Remove existing commas
    if (value && !isNaN(value)) {
        input.value = Number(value).toLocaleString('en-IN');
    }
}


// Add New Entry Form
document.getElementById('addNewEntryForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Collect company data
    const companyData = {
        company_name: formData.get('company_name') || '',
        company_street: formData.get('company_street') || '',
        company_area: formData.get('company_area') || '',
        company_city: formData.get('company_city') || '',
        company_state: formData.get('company_state') || '',
        company_pin: formData.get('company_pin') || '',
        company_address3: formData.get('company_address3') || '',
        company_gstin: formData.get('company_gstin') || '',
        company_country: formData.get('company_country') || '',
        company_zone: formData.get('company_zone') || '',
        company_area_zarc: formData.get('company_area_zarc') || '',
        company_route: formData.get('company_route') || '',
        company_cluster: formData.get('company_cluster') || '',
        company_weekly_off_start: formData.get('company_weekly_off_start') || '',
        company_weekly_off_end: formData.get('company_weekly_off_end') || '',
        company_working_hrs_start: formData.get('company_working_hrs_start') || '',
        company_working_hrs_end: formData.get('company_working_hrs_end') || '',
        company_security: formData.get('company_security') || '',
    };
    
    // Collect machines data
    const machines = [];
    const machineEntries = document.querySelectorAll('.machine-entry');
    machineEntries.forEach(entry => {
        const entryForm = entry.closest('form') || form;
        const mcNo = entry.querySelector('[name="machine_mc_no[]"]')?.value || '';
        const model = entry.querySelector('[name="machine_model[]"]')?.value || '';
        const status = entry.querySelector('[name="machine_status[]"]')?.value || '';
        const startDt = entry.querySelector('[name="machine_start_dt[]"]')?.value || '';
        const endDt = entry.querySelector('[name="machine_end_dt[]"]')?.value || '';
        const invNo = entry.querySelector('[name="machine_inv_no[]"]')?.value || '';
        const invDt = entry.querySelector('[name="machine_inv_dt[]"]')?.value || '';
        const invValue = (entry.querySelector('[name="machine_inv_value[]"]')?.value || '').replace(/,/g, '');
        
        if (mcNo || model || status) { // Only add if at least one field is filled
            machines.push({
                mc_no: mcNo,
                model: model,
                status: status,
                start_dt: startDt || null,
                end_dt: endDt || null,
                inv_no: invNo,
                inv_dt: invDt || null,
                inv_value: invValue,
            });
        }
    });
    
    // Collect contacts data
    const contacts = [];
    const contactEntries = document.querySelectorAll('.contact-entry');
    contactEntries.forEach(entry => {
        const name = entry.querySelector('[name="contact_name[]"]')?.value || '';
        const phone = entry.querySelector('[name="contact_phone[]"]')?.value || '';
        const email = entry.querySelector('[name="contact_email[]"]')?.value || '';
        const designation = entry.querySelector('[name="contact_designation[]"]')?.value || '';
        
        if (name || phone || email) { // Only add if at least one field is filled
            contacts.push({
                name: name,
                phone: phone,
                email: email,
                designation: designation,
            });
        }
    });
    
    // Prepare payload
    const payload = {
        ...companyData,
        machines: machines,
        contacts: contacts,
    };
    
    // Pre-check machine numbers for existing duplicates before calling add-new-entry
    const mcNos = machines
        .map(m => (m.mc_no || '').trim())
        .filter(n => n);

    // Check for duplicate MC No in client entry itself
    const dupMcNo = mcNos.find((value, index) => mcNos.indexOf(value) !== index);
    if (dupMcNo) {
        alert('Duplicate machine number in the form: ' + dupMcNo);
        return;
    }

    for (let mcNo of mcNos) {
        const checkRes = await fetch('/api/check-mc-no', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mc_no: mcNo }),
        });

        if (!checkRes.ok) {
            const txt = await checkRes.text();
            alert('Machine uniqueness check failed: ' + txt);
            return;
        }

        const checkResult = await checkRes.json();
        if (checkResult.exists) {
            alert('Machine number already exists: ' + mcNo);
            return;
        }
    }

    try {
        const response = await fetch('/api/add-new-entry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert('Error: ' + result.error);
        } else {
            alert('Entry saved successfully!');
            closeAddNewModal();
        }
    } catch (err) {
        alert('Error saving entry: ' + err.message);
    }
});

// Store current company and machine IDs for New Contact form
let currentCompanyId = null;
let currentMachineId = null;
let isCompanyEditMode = false;

// Store selected machine and contact for ticket creation
let selectedMachine = null;
let selectedContact = null;
let currentTicketRow = null; // Reference to first editable ticket row

// New Contact Form Submission
document.getElementById('newContactForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Get company_id and machine_id from hidden fields or current context
    const companyId = formData.get('company_id') || currentCompanyId;
    const machineId = formData.get('machine_id') || currentMachineId;
    
    if (!companyId) {
        alert('Please select a company first');
        return;
    }
    
    if (!machineId) {
        alert('Please select a machine first');
        return;
    }
    
    const payload = {
        company_id: companyId ? parseInt(companyId) : null,
        machine_id: machineId ? parseInt(machineId) : null,
        name: formData.get('name') || '',
        phone: formData.get('phone') || '',
        email: formData.get('email') || '',
        designation: formData.get('designation') || '',
    };
    
    try {
        const response = await fetch('/api/add-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert('Error: ' + result.error);
        } else {
            alert('Contact added successfully!');
            // Reset form
            form.reset();
            closeNewContactModal();
            
            // Reload contact table if company/machine is loaded
            if (currentCompanyId) {
                await loadCompanyDetails(currentCompanyId);
            } else if (currentMachineId) {
                await loadMachineDetails(currentMachineId, false, false);
            }
        }
    } catch (err) {
        alert('Error adding contact: ' + err.message);
    }
});

// New Machine Form Submission
document.getElementById('newMachineForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Get company_id from hidden field or current context
    const companyId = formData.get('company_id') || currentCompanyId;
    
    if (!companyId) {
        alert('Please select a company first');
        return;
    }
    
    const payload = {
        company_id: companyId ? parseInt(companyId) : null,
        mc_no: formData.get('mc_no') || '',
        model: formData.get('model') || '',
        status: formData.get('status') ? parseInt(formData.get('status')) : null,
        start_dt: formData.get('start_dt') || null,
        end_dt: formData.get('end_dt') || null,
        Inv_No: formData.get('Inv_No') || '',
        Inv_Dt: formData.get('Inv_Dt') || null,
        Inv_Value: formData.get('Inv_Value') || '',
    };

    // Pre-check for duplicate machine number
    if (payload.mc_no) {
        const checkRes = await fetch('/api/check-mc-no', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mc_no: payload.mc_no }),
        });

        if (checkRes.ok) {
            const checkResult = await checkRes.json();
            if (checkResult.exists) {
                alert('Machine number already exists. Please enter a different machine number.');
                return;
            }
        } else {
            const errorText = await checkRes.text();
            alert('Could not verify machine number uniqueness: ' + errorText);
            return;
        }
    }
    
    try {
        const response = await fetch('/api/add-machine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert('Error: ' + result.error);
        } else {
            alert('Machine added successfully!');
            // Reset form
            form.reset();
            closeNewMachineModal();
            
            // Reload machine table if company is loaded
            if (currentCompanyId) {
                await loadCompanyDetails(currentCompanyId);
            }
        }
    } catch (err) {
        alert('Error adding machine: ' + err.message);
    }
});

// Format invoice value with commas
document.getElementById('machineInvValue')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/,/g, ''); // Remove existing commas
    if (!isNaN(value) && value !== '') {
        e.target.value = Number(value).toLocaleString('en-IN');
    }
});

// ============================================
// Console Info
// ============================================

// ============================================
// MySQL-backed Autocomplete + Autofill
// ============================================
const API_BASE = '';

function debounce(fn, delay = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

function setSelectValue(select, value) {
    if (!select) return;
    if (select.tagName !== 'SELECT') {
        select.value = value || '';
        return;
    }
    if (!value) {
        select.value = '';
        return;
    }
    const match = Array.from(select.options).find(
        (opt) => opt.value.toLowerCase() === String(value).toLowerCase() || opt.textContent.toLowerCase() === String(value).toLowerCase()
    );
    if (match) {
        match.selected = true;
        return;
    }
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    opt.selected = true;
    select.appendChild(opt);
}

const companyDetailFieldIds = [
    'streetInput',
    'localityInput',
    'address3Input',
    'citySelect',
    'pinInput',
    'stateSelect',
    'countrySelect',
    'zoneInput',
    'areaInput',
    'routeInput',
    'clusterInput',
    'gstInput',
    'weeklyOffStart',
    'weeklyOffEnd',
    'workingStart',
    'workingEnd',
    'securitySelect',
];
const companySearchFieldIds = ['companyInput', 'machineInput'];

function setWorkingHoursInputMode(enabled) {
    ['workingStart', 'workingEnd'].forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;
        field.type = 'text';
        field.inputMode = 'none';
        field.maxLength = 8;
        field.placeholder = id === 'workingStart' ? '09:00 AM' : '05:00 PM';
    });
}

let activeTimeInput = null;
let timePickerPanel = null;

function findSecurityOptionByValue(value) {
    if (!value) return null;
    return Array.from(document.querySelectorAll('#securitySelect option'))
        .find((option) => option.value === value) || null;
}

function toDisplayTime(value) {
    if (!value) return '';
    const ampmMatch = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
        return `${ampmMatch[1].padStart(2, '0')}:${ampmMatch[2]} ${ampmMatch[3].toUpperCase()}`;
    }

    const parts = String(value).split(':');
    if (parts.length < 2) return '';
    let hours = parseInt(parts[0], 10);
    const minutes = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
    if (Number.isNaN(hours)) return '';
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
}

function toRailwayTime(value) {
    if (!value) return '';
    const ampmMatch = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = String(parseInt(ampmMatch[2], 10) || 0).padStart(2, '0');
        const period = ampmMatch[3].toUpperCase();
        if (period === 'AM' && hours === 12) hours = 0;
        if (period === 'PM' && hours !== 12) hours += 12;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    const parts = String(value).split(':');
    if (parts.length < 2) return '';
    const hours = Math.min(Math.max(parseInt(parts[0], 10) || 0, 0), 23);
    const minutes = Math.min(Math.max(parseInt(parts[1], 10) || 0, 0), 59);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function setCompanyEditMode(enabled) {
    isCompanyEditMode = Boolean(enabled);
    const form = document.querySelector('.company-form');
    form?.classList.toggle('company-editing', isCompanyEditMode);
    setWorkingHoursInputMode(isCompanyEditMode);
    if (!isCompanyEditMode) hideTimePicker();

    companySearchFieldIds.forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;
        field.disabled = false;
        field.readOnly = false;
        field.classList.add('company-search-field');
        field.classList.remove('company-edit-field');
    });

    companyDetailFieldIds.forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;

        if (field.tagName === 'SELECT') {
            field.disabled = !isCompanyEditMode;
        } else {
            field.readOnly = !isCompanyEditMode;
            field.disabled = false;
        }

        if (id === 'workingStart' || id === 'workingEnd') {
            field.readOnly = true;
        }

        field.classList.toggle('company-edit-field', isCompanyEditMode);
        field.classList.toggle('company-readonly-field', !isCompanyEditMode);
    });
}

function setCompanyActionState() {
    const hasCompany = Boolean(currentCompanyId);
    document.querySelector('.edit-button')?.classList.toggle('is-disabled', !hasCompany);
    document.querySelector('.submit-button')?.classList.toggle('is-disabled', !hasCompany || !isCompanyEditMode);
}

function getCompanyUpdatePayload() {
    const securitySelect = document.getElementById('securitySelect');
    const selectedSecurityOption = securitySelect?.selectedOptions?.[0] || null;
    const securityId = securitySelect?.value || '';
    const securityValue = securityId ? (selectedSecurityOption?.textContent || '') : '';
    return {
        company_name: document.getElementById('companyInput')?.value || '',
        company_street: document.getElementById('streetInput')?.value || '',
        company_area: document.getElementById('localityInput')?.value || '',
        company_address3: document.getElementById('address3Input')?.value || '',
        company_city: document.getElementById('citySelect')?.value || '',
        company_state: document.getElementById('stateSelect')?.value || '',
        company_pin: document.getElementById('pinInput')?.value || '',
        company_country: document.getElementById('countrySelect')?.value || '',
        company_zone: document.getElementById('zoneInput')?.value || '',
        company_area_zarc: document.getElementById('areaInput')?.value || '',
        company_route: document.getElementById('routeInput')?.value || '',
        company_cluster: document.getElementById('clusterInput')?.value || '',
        company_gstin: document.getElementById('gstInput')?.value || '',
        company_weekly_off_start: document.getElementById('weeklyOffStart')?.value || '',
        company_weekly_off_end: document.getElementById('weeklyOffEnd')?.value || '',
        company_working_hrs_start: toRailwayTime(document.getElementById('workingStart')?.value || ''),
        company_working_hrs_end: toRailwayTime(document.getElementById('workingEnd')?.value || ''),
        company_security: securityValue,
        company_security_id: securityId,
    };
}

function fillCompanyFields(company = {}) {
    const {
        id,
        name,
        address1,
        address2,
        address3,
        area,
        city,
        cluster,
        state,
        zone,
        pin,
        route,
        gstin,
        country,
        weekly_off_start,
        weekly_off_end,
        working_hrs_start,
        working_hrs_end,
        security,
        security_id,
    } = company;

    const companyInput = document.getElementById('companyInput');
    if (companyInput) {
        companyInput.value = name || '';
        if (id) companyInput.dataset.companyId = id;
    }
    // Map address1 to streetInput (Address 1 field)
    document.getElementById('streetInput').value = address1 || '';
    // Map address2 to localityInput (Address 2 field)
    document.getElementById('localityInput').value = address2 || '';
    // Map address3 to address3Input (Address 3 field) if it exists
    const address3Input = document.getElementById('address3Input');
    if (address3Input) address3Input.value = address3 || '';
    document.getElementById('pinInput').value = pin || '';

    // Fill ZARC fields: Z -> zone, A -> area, R -> route, C -> cluster
    const zoneInput = document.getElementById('zoneInput');
    if (zoneInput) zoneInput.value = zone || '';
    const areaInput = document.getElementById('areaInput');
    if (areaInput) areaInput.value = area || '';
    const routeInput = document.getElementById('routeInput');
    if (routeInput) routeInput.value = route || '';
    const clusterInput = document.getElementById('clusterInput');
    if (clusterInput) clusterInput.value = cluster || '';

    // Fill GSTIN
    const gstInput = document.getElementById('gstInput');
    if (gstInput) gstInput.value = gstin || '';

    setSelectValue(document.getElementById('citySelect'), city);
    setSelectValue(document.getElementById('stateSelect'), state);
    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
        // For input field, set value directly (default to India)
        countrySelect.value = country || 'India';
    }
    setSelectValue(document.getElementById('weeklyOffStart'), weekly_off_start);
    setSelectValue(document.getElementById('weeklyOffEnd'), weekly_off_end);
    // Format working hours to HH:MM (24-hour format)
    const startInput = document.getElementById('workingStart');
    if (startInput) {
        if (working_hrs_start) {
            let startTime = working_hrs_start;
            // Ensure HH:MM format
            if (startTime.includes(':')) {
                const parts = startTime.split(':');
                if (parts.length >= 2) {
                    startTime = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
                }
            } else if (startTime.length === 4) {
                // If format is HHMM, convert to HH:MM
                startTime = startTime.substring(0, 2) + ':' + startTime.substring(2, 4);
            }
            startInput.value = toDisplayTime(startTime);
        } else {
            startInput.value = '';
        }
    }
    const endInput = document.getElementById('workingEnd');
    if (endInput) {
        if (working_hrs_end) {
            let endTime = working_hrs_end;
            // Ensure HH:MM format
            if (endTime.includes(':')) {
                const parts = endTime.split(':');
                if (parts.length >= 2) {
                    endTime = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
                }
            } else if (endTime.length === 4) {
                // If format is HHMM, convert to HH:MM
                endTime = endTime.substring(0, 2) + ':' + endTime.substring(2, 4);
            }
            endInput.value = toDisplayTime(endTime);
        } else {
            endInput.value = '';
        }
    }
    const securitySelect = document.getElementById('securitySelect');
    if (securitySelect) {
        securitySelect.value = security_id || '';
        if (!securitySelect.value && security) {
            const matchingOption = Array.from(securitySelect.options)
                .find((option) => option.textContent.trim().toLowerCase() === String(security).trim().toLowerCase());
            if (matchingOption) securitySelect.value = matchingOption.value;
        }
    }
}

document.querySelector('.edit-button')?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!currentCompanyId) {
        alert('Please select a company first.');
        return;
    }
    setCompanyEditMode(!isCompanyEditMode);
    setCompanyActionState();
});

function buildTimeSelect(className, values, visibleRows = 6) {
    const select = document.createElement('select');
    select.className = className;
    select.size = Math.min(values.length, visibleRows);
    values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
    return select;
}

function ensureTimePicker() {
    if (timePickerPanel) return timePickerPanel;

    timePickerPanel = document.createElement('div');
    timePickerPanel.className = 'time-picker-panel';

    const hours = buildTimeSelect('time-picker-hour', Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), 6);
    const minutes = buildTimeSelect('time-picker-minute', Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), 6);
    const period = buildTimeSelect('time-picker-period', ['AM', 'PM'], 2);
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'time-picker-apply';
    apply.textContent = 'Set';
    apply.addEventListener('mousedown', (event) => {
        event.preventDefault();
        if (activeTimeInput) {
            activeTimeInput.value = `${hours.value}:${minutes.value} ${period.value}`;
            activeTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        hideTimePicker();
    });

    timePickerPanel.append(hours, minutes, period, apply);
    document.body.appendChild(timePickerPanel);
    return timePickerPanel;
}

function showTimePicker(input) {
    if (!isCompanyEditMode) return;
    activeTimeInput = input;
    const panel = ensureTimePicker();
    const normalizedValue = toDisplayTime(input.value) || (input.id === 'workingStart' ? '09:00 AM' : '05:00 PM');
    const match = normalizedValue.match(/^(\d{2}):(\d{2})\s(AM|PM)$/);
    if (match) {
        panel.querySelector('.time-picker-hour').value = match[1];
        panel.querySelector('.time-picker-minute').value = match[2];
        panel.querySelector('.time-picker-period').value = match[3];
    }

    const rect = input.getBoundingClientRect();
    panel.style.left = `${rect.left + window.scrollX}px`;
    panel.style.top = `${rect.bottom + window.scrollY + 2}px`;
    panel.classList.add('show');
}

function hideTimePicker() {
    timePickerPanel?.classList.remove('show');
    activeTimeInput = null;
}

['workingStart', 'workingEnd'].forEach((id) => {
    const field = document.getElementById(id);
    field?.addEventListener('click', () => showTimePicker(field));
    field?.addEventListener('focus', () => showTimePicker(field));
});

document.addEventListener('mousedown', (event) => {
    if (!timePickerPanel?.classList.contains('show')) return;
    if (timePickerPanel.contains(event.target) || event.target === activeTimeInput) return;
    hideTimePicker();
});

document.querySelector('.submit-button')?.addEventListener('click', async function(e) {
    e.preventDefault();
    if (!currentCompanyId) {
        alert('Please select a company first.');
        return;
    }
    if (!isCompanyEditMode) {
        alert('Click Edit before changing company details.');
        return;
    }

    const payload = getCompanyUpdatePayload();
    if (!payload.company_name.trim()) {
        alert('Company name is required.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/company/${currentCompanyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || result.error) {
            throw new Error(result.error || 'Unable to update company');
        }

        alert('Company details updated successfully!');
        setCompanyEditMode(false);
        setCompanyActionState();
        await loadCompanyDetails(currentCompanyId);
    } catch (err) {
        alert('Error updating company: ' + err.message);
    }
});

function renderMachineTable(machines = [], ticket = null, updateInfoTicket = true) {
    const tbody = document.getElementById('machineTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!machines.length) {
        tbody.innerHTML = '<tr class="row-white"><td colspan="10">No machine records found</td></tr>';
        return;
    }

    machines.forEach((m, idx) => {
        const tr = document.createElement('tr');
        tr.dataset.machineId = m.id || '';
        tr.dataset.companyId = m.company_id || '';
        tr.className = idx % 2 === 0 ? 'row-white' : 'row-blue';
        const ticketNo = m.ticket_no || '';
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td class="ticket-number" style="cursor: pointer;">${ticketNo}</td>
            <td>${m.mc_no || ''}</td>
            <td>${m.model || ''}</td>
            <td>${m.status || ''}</td>
            <td>${m.start_dt || ''}</td>
            <td>${m.end_dt || ''}</td>
            <td>${m.inv_no || ''}</td>
            <td>${m.inv_dt || ''}</td>
            <td>${m.inv_value || ''}</td>
        `;
        tbody.appendChild(tr);
        
        // Make ticket number clickable with yellow highlight
        const ticketNoCell = tr.querySelector('.ticket-number');
        ticketNoCell.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Remove previous selection
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('row-selected'));
            
            // Highlight selected row
            tr.classList.add('row-selected');
            
            // If no ticket number exists, generate a new one (but don't save to database yet)
            let finalTicketNo = ticketNo || null;
            if (!finalTicketNo) {
                try {
                    const res = await fetch(`/api/generate-ticket-no?machine_id=${m.id}`);
                    const data = await res.json();
                    if (data.ticket_no) {
                        finalTicketNo = data.ticket_no;
                        // Update the machine table cell with new ticket number (UI only, not saved to DB yet)
                        ticketNoCell.textContent = finalTicketNo;
                        ticketNoCell.classList.add('ticket-number');
                    }
                } catch (err) {
                    console.error('Error generating ticket number:', err);
                }
            }
            
            // Store selected machine (company_id will be updated when machine details load)
            selectedMachine = {
                id: m.id,
                company_id: m.company_id || tr.dataset.companyId || currentCompanyId,
                mc_no: m.mc_no,
                ticket_no: finalTicketNo // Use generated ticket_no if available
            };
            
            // Update info ticket label with ticket number
            const infoTicket = document.getElementById('infoTicketNo');
            if (infoTicket) {
                if (finalTicketNo) {
                    infoTicket.textContent = finalTicketNo;
                    infoTicket.classList.add('ticket-number');
                    infoTicket.classList.remove('text-red');
                } else {
                    infoTicket.textContent = '—';
                    infoTicket.classList.remove('ticket-number');
                }
            }
            
            // Load machine details (this will update company_id in selectedMachine)
            if (m.id) {
                await loadMachineDetails(m.id, false, true); // Don't update info ticket (we already did)
                // Ensure company_id is set after loading
                if (!selectedMachine.company_id && currentCompanyId) {
                    selectedMachine.company_id = currentCompanyId;
                }
            }
            
            // DON'T prepare ticket row yet - wait for contact selection
            // Only prepare if contact is already selected
            if (selectedContact) {
                await prepareTicketRow();
                // Remove yellow highlights after data is placed
                setTimeout(() => {
                    tr.classList.remove('row-selected');
                    document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
                }, 500);
            }
        });
    });

    // Click a machine row -> load its ticket details into Table 3
    tbody.querySelectorAll('tr').forEach((row) => {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking ticket number (handled separately)
            if (e.target.classList.contains('ticket-number')) return;
            
            const machineId = row.dataset.machineId;
            if (machineId) loadMachineDetails(machineId, true, true);
        });
    });

    if (updateInfoTicket) {
        const infoTicket = document.getElementById('infoTicketNo');
        if (infoTicket) {
            // PRIORITY: Only use machine's ticket_no from the machines table
            // Don't use latest_ticket because it might be from a closed ticket or old ticket
            // Only show ticket number if the machine itself has a ticket_no
            let ticketNoToSet = null;
            
            // First check if machines[0] has a ticket_no (this is the source of truth)
            if (machines[0] && machines[0].ticket_no) {
                ticketNoToSet = machines[0].ticket_no;
            }
            // Only use latest_ticket if machine doesn't have ticket_no AND ticket is open
            else if (ticket && ticket.ticket_no && ticket.status !== 'closed') {
                ticketNoToSet = ticket.ticket_no;
            }
            
            if (ticketNoToSet) {
                infoTicket.textContent = ticketNoToSet;
                infoTicket.classList.add('ticket-number');
            } else {
                infoTicket.textContent = '—';
                infoTicket.classList.remove('ticket-number');
            }
        }
    }
}

function renderContactTable(contacts = []) {
    const tbody = document.getElementById('contactTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!contacts.length) {
        tbody.innerHTML = '<tr class="row-white"><td colspan="6">No contacts found</td></tr>';
        return;
    }

    contacts.forEach((c, idx) => {
        const tr = document.createElement('tr');
        tr.dataset.contactId = c.id || '';
        tr.className = idx % 2 === 0 ? 'row-white' : 'row-blue';
        tr.style.cursor = 'pointer';
        
        // Create WF checkbox
        const wfCheckbox = document.createElement('input');
        wfCheckbox.type = 'checkbox';
        wfCheckbox.className = 'wf-checkbox';
        wfCheckbox.name = 'wf-contact'; // Same name for all checkboxes to ensure only one is selected
        wfCheckbox.style.cursor = 'pointer';
        
        // Handle checkbox change - ensure only one is checked
        wfCheckbox.addEventListener('change', function(e) {
            e.stopPropagation(); // Prevent row click event
            if (this.checked) {
                // Uncheck all other checkboxes
                tbody.querySelectorAll('.wf-checkbox').forEach(cb => {
                    if (cb !== this) cb.checked = false;
                });

                // Note: contact_id is handled during transfer-to-workfront, not here
                // The contact_id is only used for work_front table, not ticket_issues
            }
        });
        
        const wfTd = document.createElement('td');
        wfTd.style.textAlign = 'center';
        wfTd.style.width = '40px';
        wfTd.appendChild(wfCheckbox);
        
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td class="text-left">${c.name || ''}</td>
            <td class="text-red">${c.phone || ''}</td>
            <td>${c.email || ''}</td>
            <td class="text-left">${c.designation || ''}</td>
        `;
        
        // Insert WF column as first column
        tr.insertBefore(wfTd, tr.firstChild);
        tbody.appendChild(tr);
        
        // Make contact row selectable with yellow highlight (but not when clicking checkbox)
        tr.addEventListener('click', async (e) => {
            // Don't trigger row selection if clicking on checkbox 
            if (e.target.type === 'checkbox') {
                return;
            }
            
            // Remove previous selection
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('contact-row-selected'));
            
            // Highlight selected row (yellow)
            tr.classList.add('contact-row-selected');
            
            // Store selected contact
            selectedContact = {
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                designation: c.designation
            };

            // Note: Contact assignment is now handled through the /api/save-ticket endpoint
            // which includes contact_id in the payload
            
            // Prepare ticket row ONLY if machine is already selected
            if (selectedMachine) {
                await prepareTicketRow();
                // Remove yellow highlights after data is placed
                setTimeout(() => {
                    document.querySelectorAll('.row-selected').forEach(r => r.classList.remove('row-selected'));
                    document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
                }, 500);
            }
        });
    });
}

async function loadCompanyDetails(companyId) {
    try {
        const res = await fetch(`${API_BASE}/api/company/${companyId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Store current company ID for New Contact form
        currentCompanyId = companyId;
        currentMachineId = null; // Reset machine ID when loading company
        
        // Update hidden fields in New Contact form
        document.getElementById('contactCompanyId').value = companyId;
        document.getElementById('contactMachineId').value = '';

        fillCompanyFields(data.company);
        setCompanyEditMode(false);
        setCompanyActionState();
        
        // Clear selections and editable ticket row when loading new company
        selectedMachine = null;
        selectedContact = null;
        currentTicketRow = null;
        document.querySelectorAll('.row-selected').forEach(r => r.classList.remove('row-selected'));
        document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
        
        // Do not overwrite header ticket number when selecting company
        renderMachineTable(data.machines || [], null, false);
        renderContactTable(data.contacts || []);
        renderTicketTable([]); // Clear ticket table
    } catch (err) {
        alert('Unable to load company: ' + err.message);
    }
}

async function loadMachineDetails(machineId, updateInfoTicket = true, updateTicketTable = true) {
    try {
        const res = await fetch(`${API_BASE}/api/machine/${machineId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Store current company and machine IDs for New Contact form
        currentCompanyId = data.machine.company_id;
        currentMachineId = machineId;
        
        // Update selectedMachine with company_id if machine is selected
        if (selectedMachine && selectedMachine.id == machineId) {
            selectedMachine.company_id = data.machine.company_id;
        }
        
        // Update hidden fields in New Contact form
        document.getElementById('contactCompanyId').value = currentCompanyId;
        document.getElementById('contactMachineId').value = currentMachineId;

        document.getElementById('machineInput').value = data.machine.mc_no || '';
        fillCompanyFields(data.company || {});
        setCompanyEditMode(false);
        setCompanyActionState();

        // Fetch full company dataset so we can show all machines and contacts
        let companyMachines = [data.machine];
        let companyContacts = data.contacts || [];
        let ticketList = data.tickets || [];
        try {
            const companyRes = await fetch(`${API_BASE}/api/company/${data.machine.company_id}`);
            const companyData = await companyRes.json();
            if (!companyData.error) {
                companyMachines = companyData.machines || companyMachines;
                companyContacts = companyData.contacts || companyContacts;
            }
        } catch (e) {
            // fall back silently if company fetch fails
        }

        // Clear selections and editable ticket row when loading new machine (unless it's the same machine)
        if (!selectedMachine || selectedMachine.id != machineId) {
            selectedMachine = null;
            selectedContact = null;
            currentTicketRow = null;
            document.querySelectorAll('.row-selected').forEach(r => r.classList.remove('row-selected'));
            document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
        }
        
        renderMachineTable(companyMachines, data.latest_ticket, updateInfoTicket);
        renderContactTable(companyContacts);
        if (updateTicketTable) {
            renderTicketTable(ticketList);
            // Only prepare ticket row if both machine and contact are still selected for this machine
            if (selectedContact && selectedMachine && selectedMachine.id == machineId) {
                await prepareTicketRow();
            }
        }

        if (updateInfoTicket) {
            // Use the clicked machine's ticket_no directly (from data.machine)
            // This is the source of truth for the specific machine that was clicked
            const infoTicket = document.getElementById('infoTicketNo');
            if (infoTicket) {
                // Only show ticket number if the clicked machine has a ticket_no
                if (data.machine && data.machine.ticket_no) {
                    infoTicket.textContent = data.machine.ticket_no;
                    infoTicket.classList.add('ticket-number');
                } else {
                    infoTicket.textContent = '—';
                    infoTicket.classList.remove('ticket-number');
                }
            }
            
            const infoDate = document.getElementById('infoDate');
            const infoTime = document.getElementById('infoTime');
            if (infoDate) infoDate.textContent = (data.latest_ticket && data.latest_ticket.date) || '—';
            if (infoTime) infoTime.textContent = (data.latest_ticket && data.latest_ticket.start_time) || '—';
        }
    } catch (err) {
        alert('Unable to load machine: ' + err.message);
    }
}

function setupCompanyAutocomplete() {
    const input = document.getElementById('companyInput');
    const datalist = document.getElementById('companyList');
    if (!input) return;

    // Hide the native datalist
    if (datalist) {
        input.removeAttribute('list');
        datalist.style.display = 'none';
    }

    // Create custom dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'companyDropdownCustom';
    dropdown.style.position = 'fixed';
    dropdown.style.background = 'white';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.borderRadius = '4px';
    dropdown.style.maxHeight = '220px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
    dropdown.style.zIndex = '10000';
    dropdown.style.display = 'none';
    dropdown.style.fontFamily = "'Carlito', Arial, sans-serif";
    dropdown.style.fontSize = '14px';
    document.body.appendChild(dropdown);

    let suggestions = [];
    let selectedIndex = -1;

    const positionDropdown = () => {
        const rect = input.getBoundingClientRect();
        dropdown.style.left = (rect.left + window.scrollX) + 'px';
        dropdown.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        dropdown.style.width = rect.width + 'px';
    };

    const renderDropdown = () => {
        dropdown.innerHTML = '';
        
        if (!suggestions.length) {
            dropdown.style.display = 'none';
            return;
        }

        suggestions.forEach((company, idx) => {
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #f0f0f0';
            item.style.userSelect = 'none';
            item.style.backgroundColor = (idx === selectedIndex) ? '#e3f2fd' : 'white';
            item.textContent = `${company.name}${company.address3 ? ' — ' + company.address3 : ''}`;
            item.dataset.companyId = company.id;
            item.className = 'company-dropdown-item';

            item.addEventListener('mouseenter', function() {
                const allItems = dropdown.querySelectorAll('.company-dropdown-item');
                allItems.forEach((el, i) => {
                    el.style.backgroundColor = (i === idx) ? '#e3f2fd' : 'white';
                });
            });

            item.addEventListener('mouseleave', function() {
                const allItems = dropdown.querySelectorAll('.company-dropdown-item');
                allItems.forEach((el) => {
                    el.style.backgroundColor = 'white';
                });
            });

            item.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Dropdown item clicked:', company.name, company.id);
                input.value = company.name;
                console.log('Loading company details for ID:', company.id);
                loadCompanyDetails(company.id);
                dropdown.style.display = 'none';
                selectedIndex = -1;
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
        positionDropdown();
    };

    const fetchSuggestions = debounce(async (value) => {
        if (value.length < 2) {
            suggestions = [];
            renderDropdown();
            return;
        }

        try {
            console.log('Fetching suggestions for:', value);
            const res = await fetch(`${API_BASE}/api/company-suggest?q=${encodeURIComponent(value)}`);
            const data = await res.json();
            console.log('Received suggestions:', data);
            suggestions = data.companies || [];
            console.log('Suggestions set to:', suggestions);
            selectedIndex = -1;
            renderDropdown();
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        }
    }, 250);

    input.addEventListener('input', (e) => {
        fetchSuggestions(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
        if (dropdown.style.display === 'none') return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
            renderDropdown();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            renderDropdown();
        } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
            e.preventDefault();
            const selected = suggestions[selectedIndex];
            input.value = selected.name;
            loadCompanyDetails(selected.id);
            dropdown.style.display = 'none';
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            selectedIndex = -1;
        }
    });

    input.addEventListener('focus', () => {
        if (suggestions.length > 0) {
            dropdown.style.display = 'block';
            positionDropdown();
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    window.addEventListener('scroll', () => {
        if (dropdown.style.display === 'block') {
            positionDropdown();
        }
    });

    window.addEventListener('resize', () => {
        if (dropdown.style.display === 'block') {
            positionDropdown();
        }
    });
}

function setupMachineAutocomplete() {
    const input = document.getElementById('machineInput');
    const list = document.getElementById('machineList');
    if (!input || !list) return;

    const fetchSuggestions = debounce(async (value) => {
        if (value.length < 2) {
            list.innerHTML = '';
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/machine-suggest?q=${encodeURIComponent(value)}`);
            const data = await res.json();
            list.innerHTML = '';
            (data.machines || []).forEach((m) => {
                const opt = document.createElement('option');
                opt.value = m.mc_no;
                opt.textContent = `${m.mc_no} — ${m.company_name || ''}${m.address3 ? ' — ' + m.address3 : ''}`;
                opt.setAttribute('data-id', m.id);
                opt.setAttribute('data-company', m.company_name || '');
                opt.setAttribute('data-address3', m.address3 || '');
                list.appendChild(opt);
            });
        } catch (err) {
            console.error(err);
        }
    }, 250);

    input.addEventListener('input', (e) => fetchSuggestions(e.target.value));
    input.addEventListener('change', () => {
        const match = Array.from(list.options).find((o) => o.value === input.value);
        if (!match) return;
        const id = match.getAttribute('data-id');
        if (id) loadMachineDetails(id, false, true); // update ticket table, keep header ticket unchanged
    });
}

// Helper functions for priority mappings
function getPriorityOption(ft, number) {
    if (ft === 'F') {
        const fOptions = {
            '1': 'Service',
            '2': 'Calib',
            '3': 'Train/Upg',
            '4': 'PMV',
            '5': 'Demo',
            '6': 'Extand',
            '7': 'Furture'
        };
        return fOptions[number] || '';
    } else if (ft === 'T') {
        const tOptions = {
            '1': 'Tele',
            '2': 'Online',
            '3': 'Disc',
            '4': 'Courier'
        };
        return tOptions[number] || '';
    }
    return '';
}

function getMaxNumber(ft) {
    return ft === 'F' ? 6 : 4;
}

// Helper function to create priority component HTML
function createPriorityComponent(priorityValue = '', isEditable = false) {
    // Parse priority: format is "F 5 Service" (space-separated) or "F|5|Service" (pipe-separated for backward compatibility)
    // Also handle old format: "T1", "F1", "OP", etc.
    let ftValue = '';
    let numberValue = '';
    let optionValue = '';
    
    if (priorityValue) {
        // Check for space-separated format first (new format)
        if (priorityValue.includes(' ') && !priorityValue.includes('|')) {
            // New format: "F 5 Service" or "T1 Tele" (combined format)
            const parts = priorityValue.trim().split(/\s+/);
            const firstPart = parts[0] || '';
            
            // Check if first part is like "T1" or "F5" (letter + number combined)
            const match = firstPart.match(/^([TF])(\d+)$/);
            if (match) {
                // Format: "T1 Tele" or "F5 Service"
                ftValue = match[1];
                numberValue = match[2];
                optionValue = parts[1] || '';
            } else {
                // Format: "F 5 Service" (space-separated)
                ftValue = firstPart;
                numberValue = parts[1] || '';
                optionValue = parts[2] || '';
            }
        } else if (priorityValue.includes('|')) {
            // Old pipe format: "F|5|Service" (backward compatibility)
            const parts = priorityValue.split('|');
            ftValue = parts[0] || '';
            numberValue = parts[1] || '';
            optionValue = parts[2] || '';
        } else {
            // Old format: "T1", "F1", "OP", etc.
            if (priorityValue.startsWith('T') || priorityValue.startsWith('F')) {
                ftValue = priorityValue.charAt(0);
                numberValue = priorityValue.charAt(1) || '1';
                optionValue = getPriorityOption(ftValue, numberValue);
            } else if (priorityValue === 'OP') {
                ftValue = 'F';
                numberValue = '1';
                optionValue = 'Service';
            }
        }
    }
    
    // Get arrow path from existing image in the page, or use default (cache it)
    let arrowPath = window._cachedArrowPath;
    if (!arrowPath) {
        arrowPath = '/static/images/arrow-down.png';
        const existingArrow = document.querySelector('.form-header-arrow, .dropdown-arrow-small');
        if (existingArrow && existingArrow.src) {
            // Extract just the path part if it's a full URL
            const url = new URL(existingArrow.src, window.location.origin);
            arrowPath = url.pathname;
        }
        window._cachedArrowPath = arrowPath; // Cache for future use
    }
    
    if (isEditable) {
        // Default to 'F' if no value
        const defaultFt = ftValue || 'F';
        // Default to '1' if no value
        const defaultNumber = numberValue || '1';
        const maxNumber = getMaxNumber(defaultFt);
        
        // Generate number options based on F/T
        let numberOptions = '';
        for (let i = 1; i <= maxNumber; i++) {
            numberOptions += `<option value="${i}" ${defaultNumber === String(i) ? 'selected' : ''}>${i}</option>`;
        }
        
        // Get the option value to display
        const displayOption = optionValue || getPriorityOption(defaultFt, defaultNumber);
        
        return `
            <div class="priority-container">
                <div class="priority-ft-box">
                    <select class="priority-ft-select ticket-priority-ft" data-priority-part="ft">
                        <option value="F" ${defaultFt === 'F' ? 'selected' : ''}>F</option>
                        <option value="T" ${defaultFt === 'T' ? 'selected' : ''}>T</option>
                    </select>
                    <img src="${arrowPath}" alt="" class="priority-ft-arrow" />
                </div>
                <div class="priority-number-box">
                    <select class="priority-number-select ticket-priority-number" data-priority-part="number">
                        ${numberOptions}
                    </select>
                    <img src="${arrowPath}" alt="" class="priority-number-arrow" />
                </div>
                <div class="priority-option-box" style="pointer-events: none; background: #f0f0f0;">
                    <span class="priority-option-display" style="font-family: 'Carlito', Arial, sans-serif; font-weight: bold; font-size: 14px; display: block; width: 100%; text-align: center; padding: 0 4px;">${displayOption || '—'}</span>
                    <img src="${arrowPath}" alt="" class="priority-option-arrow" style="display: none;" />
                </div>
            </div>
        `;
    } else {
        // Read-only display
        const ftDisplay = ftValue || 'F';
        const numberDisplay = numberValue || '1';
        const optionDisplay = optionValue || getPriorityOption(ftDisplay, numberDisplay);
        
        if (!priorityValue) {
            return '';
        }
        
        return `
            <div class="priority-container">
                <div class="priority-ft-box priority-readonly" style="pointer-events: none;">
                    <span style="font-family: 'Carlito', Arial, sans-serif; font-weight: bold; font-size: 14px;">${ftDisplay}</span>
                    <img src="${arrowPath}" alt="" class="priority-ft-arrow" style="display: none;" />
                </div>
                <div class="priority-number-box priority-readonly" style="pointer-events: none;">
                    <span style="font-family: 'Carlito', Arial, sans-serif; font-weight: bold; font-size: 14px;">${numberDisplay}</span>
                    <img src="${arrowPath}" alt="" class="priority-number-arrow" style="display: none;" />
                </div>
                <div class="priority-option-box priority-readonly" style="pointer-events: none;">
                    <span style="font-family: 'Carlito', Arial, sans-serif; font-weight: bold; font-size: 14px;">${optionDisplay}</span>
                    <img src="${arrowPath}" alt="" class="priority-option-arrow" style="display: none;" />
                </div>
            </div>
        `;
    }
}

// Helper function to get priority value from a row
function getPriorityFromRow(row) {
    const ftSelect = row.querySelector('.priority-ft-select');
    const numberSelect = row.querySelector('.priority-number-select');
    
    if (!ftSelect || !numberSelect) {
        return null;
    }
    
    const ft = ftSelect.value || '';
    const number = numberSelect.value || '';
    const option = getPriorityOption(ft, number);
    
    if (!ft && !number) {
        return null;
    }
    
    return `${ft} ${number} ${option}`;
}

// Function to update priority number dropdown and option display
function updatePriorityDropdowns(container) {
    const ftSelect = container.querySelector('.priority-ft-select');
    const numberSelect = container.querySelector('.priority-number-select');
    const optionDisplay = container.querySelector('.priority-option-display');
    
    if (!ftSelect || !numberSelect) return;
    
    const ft = ftSelect.value || 'F';
    const maxNumber = getMaxNumber(ft);
    const currentNumber = parseInt(numberSelect.value) || 1;
    
    // Update number dropdown options
    numberSelect.innerHTML = '';
    for (let i = 1; i <= maxNumber; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentNumber || (currentNumber > maxNumber && i === 1)) {
            option.selected = true;
        }
        numberSelect.appendChild(option);
    }
    
    // Update option display
    const selectedNumber = numberSelect.value || '1';
    const option = getPriorityOption(ft, selectedNumber);
    if (optionDisplay) {
        optionDisplay.textContent = option || '—';
    }
}

// Function to setup priority event listeners for a container
function setupPriorityEventListeners(container) {
    const ftSelect = container.querySelector('.priority-ft-select');
    const numberSelect = container.querySelector('.priority-number-select');
    
    // Remove existing listeners if any (prevent duplicates)
    if (ftSelect && ftSelect._priorityHandler) {
        ftSelect.removeEventListener('change', ftSelect._priorityHandler);
    }
    if (numberSelect && numberSelect._priorityHandler) {
        numberSelect.removeEventListener('change', numberSelect._priorityHandler);
    }
    
    // Create new handlers
    const ftHandler = function() {
        updatePriorityDropdowns(container);
    };
    const numberHandler = function() {
        updatePriorityDropdowns(container);
    };
    
    if (ftSelect) {
        ftSelect._priorityHandler = ftHandler; // Store reference for cleanup
        ftSelect.addEventListener('change', ftHandler);
    }
    
    if (numberSelect) {
        numberSelect._priorityHandler = numberHandler; // Store reference for cleanup
        numberSelect.addEventListener('change', numberHandler);
    }
    
    // Initialize on load
    updatePriorityDropdowns(container);
}

function renderTicketTable(tickets = []) {
    const tbody = document.getElementById('ticketTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    currentTicketRow = null; // Reset current ticket row

    // DON'T create first row here - only create when contact is selected
    // Filter out closed, WF, and done tickets - only show open tickets (not transferred to workfront yet)
    const openTickets = tickets.filter(t => t.status === 'open');
    
    // Store tickets globally for close function to access
    window.currentTickets = openTickets;
    
    // Add existing open tickets
    if (openTickets.length > 0) {
        openTickets.slice(0, 20).forEach((t, idx) => {
            const row = document.createElement('tr');
            row.className = idx % 2 === 0 ? 'row-white' : 'row-blue';
            // Store ticket data in data attributes for easy access
            row.dataset.ticketNo = t.ticket_no || '';
            row.dataset.machineId = t.machine_id || '';
            row.dataset.companyId = t.company_id || '';
            row.innerHTML = `
                <td>${idx + 1}</td>
                <td>${t.date || ''}</td>
                <td>${t.start_time || ''}</td>
                <td>${t.end_time || ''}</td>
                <td>${t.log_by || ''}</td>
                <td class="text-left">${t.customer_name || ''}</td>
                <td class="text-left">${t.fault || ''}</td>
                <td>${createPriorityComponent(t.priority || '', false)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Pad rows to keep height
    let currentRows = tbody.querySelectorAll('tr').length;
    while (currentRows < 9) {
        const padRow = document.createElement('tr');
        padRow.className = currentRows % 2 === 0 ? 'row-white' : 'row-blue';
        padRow.innerHTML = `
            <td>${currentRows + 1}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${createPriorityComponent('', true)}</td>
        `;
        tbody.appendChild(padRow);
        // Setup event listeners for priority component
        const priorityContainer = padRow.querySelector('.priority-container');
        if (priorityContainer) {
            setupPriorityEventListeners(priorityContainer);
        }
        currentRows += 1;
    }
    
    // Setup event listeners for all priority components in existing rows
    tbody.querySelectorAll('.priority-container').forEach(container => {
        setupPriorityEventListeners(container);
    });
}

// Get user tag from profile
function getUserTag() {
    const dropdownItems = document.querySelectorAll('#profileDropdown .dropdown-item');
    const tagItem = Array.from(dropdownItems).find(item => item.textContent.trim().startsWith('Tag:'));
    if (tagItem) {
        const tagText = tagItem.textContent.replace('Tag:', '').trim();
        return tagText || 'SD'; // Default to SD if not found sf
    }
    return 'SD'; // Default
}

// Create and prepare ticket row with auto-filled data
async function prepareTicketRow() {
    if (!selectedMachine || !selectedContact) return;
    
    const tbody = document.getElementById('ticketTableBody');
    if (!tbody) return;
    
    // Create first editable row if it doesn't exist
    if (!currentTicketRow) {
        const firstRow = document.createElement('tr');
        firstRow.className = 'row-white';
        firstRow.id = 'ticketRow1';
        firstRow.innerHTML = `
            <td>1</td>
            <td class="ticket-date"></td>
            <td class="ticket-start-time"></td>
            <td class="ticket-end-time" style="cursor: pointer;"></td>
            <td class="ticket-log-by"></td>
            <td class="text-left ticket-customer-name"></td>
            <td class="text-left"><input type="text" class="ticket-fault-input" placeholder="Enter fault/issue..." style="width: 100%; border: none; background: transparent; padding: 4px;" /></td>
            <td>${createPriorityComponent('', true)}</td>
        `;
        // Insert at the beginning
        const existingRows = tbody.querySelectorAll('tr');
        if (existingRows.length > 0) {
            tbody.insertBefore(firstRow, existingRows[0]);
            // Renumber existing rows
            existingRows.forEach((row, idx) => {
                if (row.querySelector('td')) {
                    row.querySelector('td').textContent = idx + 2;
                }
            });
        } else {
            tbody.appendChild(firstRow);
        }
        currentTicketRow = firstRow;
        
        // Setup priority event listeners
        const priorityContainer = firstRow.querySelector('.priority-container');
        if (priorityContainer) {
            setupPriorityEventListeners(priorityContainer);
        }
        
        // Add click handler for end time
        const endTimeCell = firstRow.querySelector('.ticket-end-time');
        endTimeCell.addEventListener('click', () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            endTimeCell.textContent = timeStr;
        });
        
        // Add Enter key handler for fault input
        const faultInput = firstRow.querySelector('.ticket-fault-input');
        faultInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                await saveTicketRow(firstRow);
            }
        });
    }
    
    // Use ticket number from selectedMachine (should already be set when ticket_no was clicked)
    const ticketNo = selectedMachine.ticket_no;
    
    // Update info ticket label with ticket number if available
    const infoTicket = document.getElementById('infoTicketNo');
    if (infoTicket) {
        if (ticketNo) {
            infoTicket.textContent = ticketNo;
            infoTicket.classList.add('ticket-number');
            infoTicket.classList.remove('text-red');
        } else {
            infoTicket.textContent = '—';
            infoTicket.classList.remove('ticket-number');
        }
    }
    
    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const userTag = getUserTag();
    
    // Auto-fill first row
    currentTicketRow.querySelector('.ticket-date').textContent = dateStr;
    currentTicketRow.querySelector('.ticket-start-time').textContent = timeStr;
    currentTicketRow.querySelector('.ticket-log-by').textContent = userTag;
    currentTicketRow.querySelector('.ticket-customer-name').textContent = selectedContact.name || '';
    
    // Update info bar (date and time)
    const infoDate = document.getElementById('infoDate');
    if (infoDate) infoDate.textContent = dateStr;
    
    const infoTime = document.getElementById('infoTime');
    if (infoTime) infoTime.textContent = timeStr;
}

// Save ticket row to database
async function saveTicketRow(row) {
    const tbody = document.getElementById('ticketTableBody');
    if (!tbody) {
        alert('Error: Ticket table not found');
        return;
    }
    
    if (!selectedMachine || !selectedContact) {
        alert('Please select both a machine and a contact first');
        return;
    }
    
    const faultInput = row.querySelector('.ticket-fault-input');
    const fault = faultInput.value.trim();
    
    if (!fault) {
        alert('Please enter a fault/issue description');
        return;
    }
    
    const dateStr = row.querySelector('.ticket-date').textContent.trim();
    const startTime = row.querySelector('.ticket-start-time').textContent.trim();
    const endTime = row.querySelector('.ticket-end-time').textContent.trim();
    const logBy = row.querySelector('.ticket-log-by').textContent.trim();
    const customerName = row.querySelector('.ticket-customer-name').textContent.trim();
    const priority = getPriorityFromRow(row);
    
    // Convert date string to YYYY-MM-DD format
    let dateValue = null;
    if (dateStr) {
        try {
            const dateParts = dateStr.split(' ');
            if (dateParts.length === 3) {
                const day = dateParts[0];
                const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                                  'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
                const month = monthMap[dateParts[1]] || '01';
                const year = dateParts[2];
                dateValue = `${year}-${month}-${day.padStart(2, '0')}`;
            }
        } catch (e) {
            dateValue = new Date().toISOString().split('T')[0];
        }
    }
    
    // Ensure integer values are properly converted
    // Use currentCompanyId as fallback if selectedMachine doesn't have company_id
    const companyId = selectedMachine.company_id 
        ? parseInt(selectedMachine.company_id) 
        : (currentCompanyId ? parseInt(currentCompanyId) : null);
    const machineId = selectedMachine.id ? parseInt(selectedMachine.id) : null;
    const contactId = selectedContact.id ? parseInt(selectedContact.id) : null;
    const ticketNo = selectedMachine.ticket_no ? parseInt(selectedMachine.ticket_no) : null;
    
    if (!companyId) {
        alert('Error: Company ID is missing. Please select a machine again.');
        return;
    }
    
    if (!machineId) {
        alert('Error: Machine ID is missing. Please select a machine again.');
        return;
    }
    
    const payload = {
        ticket_no: ticketNo,
        company_id: companyId,
        machine_id: machineId,
        contact_id: contactId,
        date: dateValue,
        start_time: startTime || null,
        end_time: endTime || null,
        log_by: logBy || null,
        customer_name: customerName || null,
        fault: fault,
        priority: priority || null,
        status: 'open'
    };
    
    try {
        const response = await fetch('/api/save-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert('Error saving ticket: ' + result.error);
        } else {
            // Update ticket number in machine table display
            const savedTicketNo = result.ticket ? result.ticket.ticket_no : ticketNo;
            if (savedTicketNo && selectedMachine) {
                const machineRows = document.querySelectorAll('#machineTableBody tr');
                machineRows.forEach(machineRow => {
                    if (machineRow.dataset.machineId == selectedMachine.id) {
                        const ticketCell = machineRow.querySelector('.ticket-number');
                        if (ticketCell) {
                            ticketCell.textContent = savedTicketNo;
                            ticketCell.classList.add('ticket-number');
                        }
                    }
                });
            }
            
            // Convert row to read-only display
            row.innerHTML = `
                <td>1</td>
                <td>${dateStr}</td>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${logBy}</td>
                <td class="text-left">${customerName}</td>
                <td class="text-left">${fault}</td>
                <td>${createPriorityComponent(priority || '', false)}</td>
            `;
            row.className = 'row-white';
            
            // Remove editable first row and reset selections
            currentTicketRow = null;
            selectedMachine = null;
            selectedContact = null;
            
            // Remove yellow highlights
            document.querySelectorAll('.row-selected').forEach(r => r.classList.remove('row-selected'));
            document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
            
            // Re-number rows
            const allRows = tbody.querySelectorAll('tr');
            allRows.forEach((r, idx) => {
                if (r.querySelector('td')) {
                    r.querySelector('td').textContent = idx + 1;
                }
            });
            
            alert('Ticket saved successfully!');
        }
    } catch (err) {
        alert('Error saving ticket: ' + err.message);
    }
}

// Close/Clear ticket details
window.closeTicketDetails = async function() {
    const tbody = document.getElementById('ticketTableBody');
    
    // Get ticket number and machine ID
    const infoTicket = document.getElementById('infoTicketNo');
    const ticketNo = infoTicket ? infoTicket.textContent.trim() : null;
    
    // Try to get machine ID from multiple sources:
    // 1. From selectedMachine (if ticket number was clicked)
    // 2. From currentMachineId (if machine is loaded)
    // 3. From first open ticket in the table (for existing tickets)
    let machineId = selectedMachine ? selectedMachine.id : null;
    
    if (!machineId && currentMachineId) {
        machineId = currentMachineId;
    }
    
    // If still no machineId, try to get it from the first ticket in the table
    if (!machineId && window.currentTickets && window.currentTickets.length > 0) {
        const firstTicket = window.currentTickets.find(t => t.ticket_no && t.ticket_no.toString() === ticketNo);
        if (firstTicket && firstTicket.machine_id) {
            machineId = firstTicket.machine_id;
        } else if (window.currentTickets[0] && window.currentTickets[0].machine_id) {
            // Fallback to first ticket's machine_id
            machineId = window.currentTickets[0].machine_id;
        }
    }
    
    // If we have a ticket number and machine ID, close the ticket in database
    if (ticketNo && ticketNo !== '—' && machineId) {
        try {
            const ticketNoInt = parseInt(ticketNo);
            if (!isNaN(ticketNoInt)) {
                const response = await fetch('/api/close-ticket', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ticket_no: ticketNoInt,
                        machine_id: parseInt(machineId)
                    }),
                });
                
                const result = await response.json();
                
                if (result.error) {
                    alert('Error closing ticket: ' + result.error);
                    return;
                }
                
                // Show success message
                alert(`✅ Ticket #${ticketNoInt} has been closed successfully!\n\nStatus: Closed\nMachine ticket number has been cleared.`);
                
                // Remove editable ticket row if it exists
                if (currentTicketRow && currentTicketRow.parentNode) {
                    currentTicketRow.remove();
                    currentTicketRow = null;
                }
                
                // Clear ALL rows from table 3 (visually only, data remains in DB with status='closed')
                renderTicketTable([]);
                
                // Clear selections
                selectedMachine = null;
                selectedContact = null;
                
                // Remove yellow highlights
                document.querySelectorAll('.row-selected').forEach(r => r.classList.remove('row-selected'));
                document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
                
                // Clear info labels
                if (infoTicket) {
                    infoTicket.textContent = '—';
                    infoTicket.classList.remove('ticket-number');
                    infoTicket.classList.remove('text-red');
                }
                
                const infoDate = document.getElementById('infoDate');
                const infoTime = document.getElementById('infoTime');
                if (infoDate) infoDate.textContent = '—';
                if (infoTime) infoTime.textContent = '—';
                
                // Update machine table to remove ticket_no display (without reloading)
                // Find the machine row and clear its ticket_no cell
                const machineTableBody = document.getElementById('machineTableBody');
                if (machineTableBody && machineId) {
                    const machineRows = machineTableBody.querySelectorAll('tr');
                    machineRows.forEach(row => {
                        if (row.dataset.machineId == machineId) {
                            const ticketNoCell = row.querySelector('.ticket-number');
                            if (ticketNoCell) {
                                ticketNoCell.textContent = '';
                            }
                        }
                    });
                }
                
                console.log('Ticket closed successfully - all rows cleared from table 3');
                return; // Exit early after successful close
            }
        } catch (err) {
            alert('Error closing ticket: ' + err.message);
            console.error('Error closing ticket:', err);
            return;
        }
    } else {
        // No ticket selected - just clear the form
        if (!ticketNo || ticketNo === '—') {
            alert('ℹ️ No ticket selected to close.\n\nClearing current ticket details...');
        }
    }
    
    // If we reach here, just clear the form (no ticket to close or error occurred)
    // Remove editable ticket row if it exists
    if (currentTicketRow && currentTicketRow.parentNode) {
        currentTicketRow.remove();
        currentTicketRow = null;
    }
    
    // Clear ALL rows from table 3 (visually only)
    renderTicketTable([]);
    
    // Clear selections
    selectedMachine = null;
    selectedContact = null;
    
    // Remove yellow highlights
    document.querySelectorAll('.row-selected').forEach(r => r.classList.remove('row-selected'));
    document.querySelectorAll('.contact-row-selected').forEach(r => r.classList.remove('contact-row-selected'));
    
    // Clear info labels
    if (infoTicket) {
        infoTicket.textContent = '—';
        infoTicket.classList.remove('ticket-number');
        infoTicket.classList.remove('text-red');
    }
    
    const infoDate = document.getElementById('infoDate');
    const infoTime = document.getElementById('infoTime');
    if (infoDate) infoDate.textContent = '—';
    if (infoTime) infoTime.textContent = '—';
    
    console.log('Ticket details closed - all rows cleared from table 3');
};

// Working hour values are selected through the custom AM/PM picker above.
function setupTimeInputs() {
    ['workingStart', 'workingEnd'].forEach((id) => {
        const input = document.getElementById(id);
        input?.addEventListener('blur', (event) => {
            event.target.value = toDisplayTime(event.target.value);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupCompanyAutocomplete();
    setupTimeInputs();
    setupMachineAutocomplete();
    startClock();
    
    // Done / Close Ticket button
    document.querySelector('.btn-done')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeTicketDetails();
    });
    
    // To Workfront button
    document.getElementById('transferToWorkfrontBtn')?.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Check if company is selected
        if (!currentCompanyId) {
            alert('Please select a company first');
            return;
        }
        
        // Check if machine (MC) is selected - REQUIRED
        const machineId = (selectedMachine && selectedMachine.id) ? selectedMachine.id : currentMachineId;
        if (!machineId) {
            alert('Please select a machine (MC) first by clicking on it in the machine table');
            return;
        }
        
        // Get the checked WF contact
        const contactTableBody = document.getElementById('contactTableBody');
        if (!contactTableBody) {
            alert('Contact table not found');
            return;
        }
        
        const checkedCheckbox = contactTableBody.querySelector('.wf-checkbox:checked');
        if (!checkedCheckbox) {
            alert('Please select a contact with WF checkbox checked');
            return;
        }
        
        // Get contact ID from the row
        const contactRow = checkedCheckbox.closest('tr');
        const contactId = contactRow ? contactRow.dataset.contactId : null;
        
        if (!contactId) {
            alert('Contact ID not found');
            return;
        }
        
        // Show loading/processing message
        const btn = this;
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;
        
        try {
            // Call API to transfer tickets to workfront
            // Only tickets for the currently selected machine will be transferred
            const response = await fetch('/api/transfer-to-workfront', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    company_id: parseInt(currentCompanyId),
                    machine_id: parseInt(machineId),
                    contact_id: parseInt(contactId)
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to transfer tickets');
            }
            
            // Success - show message
            alert(`✅ ${data.message || 'Successfully transferred tickets to workfront'}`);
            
            // Reload ticket table to remove transferred tickets from UI
            // Tickets are still in database but with status='WF', so they won't show in the table
            if (data.machine_id && currentMachineId === data.machine_id) {
                // Reload machine details to refresh ticket table
                await loadMachineDetails(data.machine_id, false, true);
            } else if (machineId) {
                // Fallback: use the machineId from the button click
                await loadMachineDetails(machineId, false, true);
            }
            
            // If workfront page is open in another tab/window, trigger a refresh event
            // This will be caught by the workfront page's visibility/focus listeners
            window.dispatchEvent(new Event('workfrontRefresh'));
            
            // Optionally navigate to workfront (user can choose to stay or go)
            // window.location.href = '/workfront';
            
        } catch (error) {
            alert(` Error: ${error.message}`);
            console.error('Transfer to workfront error:', error);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
    
    // Event delegation for remove buttons (works for dynamically added buttons)
    document.addEventListener('click', (e) => {
        // Check if clicked element is a remove button or inside one
        const removeBtn = e.target.closest('.btn-remove-entry');
        if (!removeBtn) return;
        
        // Check which container it belongs to
        const machineContainer = document.getElementById('machineEntriesContainer');
        const contactContainer = document.getElementById('contactEntriesContainer');
        
        if (machineContainer && machineContainer.contains(removeBtn)) {
            e.preventDefault();
            e.stopPropagation();
            removeMachineEntry(removeBtn);
        } else if (contactContainer && contactContainer.contains(removeBtn)) {
            e.preventDefault();
            e.stopPropagation();
            removeContactEntry(removeBtn);
        }
    });
});

// ============================================
// Live Date / Time
// ============================================
function startClock() {
    const dateEl = document.getElementById('infoDate');
    const timeEl = document.getElementById('infoTime');
    if (!dateEl || !timeEl) return;

    const tick = () => {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString();
        timeEl.textContent = now.toLocaleTimeString();
    };
    tick();
    setInterval(tick, 1000);
}

// ============================================
// Limit Dropdown Scroll Size
// ============================================
function limitDropdownScrollSize() {
    if (document.body?.dataset?.page !== 'call-entry') return;

    // For select elements - add size attribute to limit visible options
    // This helps control the dropdown height
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach(select => {
        // Skip spares-select dropdowns - they should remain normal dropdowns
        if (select.classList.contains('spares-select')) {
            return;
        }
        // Only apply if not already has size attribute and has multiple options
        if (!select.hasAttribute('size') && select.options.length > 10) {
            // Store original behavior
            let isOpen = false;
            
            // Add event listeners to manage dropdown size
            select.addEventListener('focus', function() {
                // When focused, temporarily set size to limit visible options
                if (select.options.length > 10) {
                    select.setAttribute('data-original-size', select.getAttribute('size') || '');
                    // Don't set size for single-select dropdowns as it changes behavior
                    // Instead, we rely on CSS max-height
                }
            });
            
            select.addEventListener('blur', function() {
                // Restore original size when not focused
                const originalSize = select.getAttribute('data-original-size');
                if (originalSize !== null) {
                    if (originalSize === '') {
                        select.removeAttribute('size');
                    } else {
                        select.setAttribute('size', originalSize);
                    }
                }
            });
        }
    });
    
    // For datalist inputs - add custom styling
    const datalistInputs = document.querySelectorAll('input[list]');
    datalistInputs.forEach(input => {
        // Datalist dropdowns are browser-controlled, but we can ensure
        // the input itself has proper styling
        input.style.maxHeight = '200px';
    });
    
    // Apply CSS class to all dropdown elements for consistent styling
    const dropdownElements = document.querySelectorAll(
        'select, input[list], .form-dropdown, .city-dropdown, .state-dropdown, ' +
        '.country-input, .week-dropdown-select, .security-dropdown-main'
    );
    dropdownElements.forEach(el => {
        el.classList.add('limited-dropdown');
    });
}

// Initialize dropdown scroll limitations on page load
document.addEventListener('DOMContentLoaded', () => {
    limitDropdownScrollSize();
    setCompanyEditMode(false);
    setCompanyActionState();
});

// Re-apply when new elements are added dynamically
if (document.body?.dataset?.page === 'call-entry') {
    const observer = new MutationObserver(() => {
        limitDropdownScrollSize();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
