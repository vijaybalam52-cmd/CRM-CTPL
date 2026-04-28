// Trip Sheet - Fetch data from API
let tripsheetData = [];
let breakfastTime = '';
let lunchTime = '';

const mainTableBody = document.getElementById('mainTableBody');

// LocalStorage keys
const STORAGE_KEY_USER_DATA = 'tripsheet_user_data';
const STORAGE_KEY_VEHICLE_EXPENSES = 'tripsheet_vehicle_expenses';

// Save user-entered data to localStorage
function saveUserDataToStorage() {
    const userData = {};
    const rows = mainTableBody.querySelectorAll('.tr');
    
    rows.forEach((row, index) => {
        const rowIndex = parseInt(row.dataset.rowIndex);
        const regularRows = tripsheetData.filter(r => !r.isTotal);
        const rowData = regularRows[rowIndex];
        
        if (rowData) {
            const schdEtInput = row.querySelector('.schd-et-input');
            const actualTimeInput = row.querySelector('.actual-time-input');
            const actualOdoInput = row.querySelector('.actual-odo-input');
            
            const rowKey = rowData.work_front_id || `row_${rowIndex}`;
            userData[rowKey] = {
                schd_et: schdEtInput ? schdEtInput.value : '',
                actual_time: actualTimeInput ? actualTimeInput.value : '',
                actual_odo_read: actualOdoInput ? actualOdoInput.value : ''
            };
        }
    });
    
    localStorage.setItem(STORAGE_KEY_USER_DATA, JSON.stringify(userData));
}

// Load user-entered data from localStorage
function loadUserDataFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_USER_DATA);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Error loading user data from storage:', e);
        return {};
    }
}

// Save vehicle and expenses data to localStorage
function saveVehicleExpensesToStorage() {
    const vehicleData = {};
    
    // Vehicle table data
    const vehicleInputs = document.querySelectorAll('.vehicle-data-cell input, .vehicle-data-cell select');
    vehicleInputs.forEach(input => {
        const col = input.closest('[data-col]')?.dataset.col;
        if (col !== undefined) {
            vehicleData[`vehicle_${col}`] = input.value;
        }
    });
    
    // Expenses table data
    const expensesInputs = document.querySelectorAll('.expenses-data-cell input');
    expensesInputs.forEach(input => {
        const col = input.closest('[data-col]')?.dataset.col;
        if (col !== undefined) {
            vehicleData[`expenses_${col}`] = input.value;
        }
    });
    
    localStorage.setItem(STORAGE_KEY_VEHICLE_EXPENSES, JSON.stringify(vehicleData));
}

// Load vehicle and expenses data from localStorage
function loadVehicleExpensesFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_VEHICLE_EXPENSES);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('Error loading vehicle/expenses data from storage:', e);
        return {};
    }
}

// Clear all localStorage data
function clearStorageData() {
    localStorage.removeItem(STORAGE_KEY_USER_DATA);
    localStorage.removeItem(STORAGE_KEY_VEHICLE_EXPENSES);
    // Also clear stored PR values used for filtering
    localStorage.removeItem('tripsheet_selected_pr_values');
    localStorage.removeItem('tripsheet_selected_work_front_ids');
}

async function fetchTripsheetData() {
    try {
        // Get work_front_ids and PR values from URL query parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const idsFromUrl = urlParams.getAll('id'); // Get all 'id' parameters
        const prFromUrl = urlParams.getAll('pr'); // Get all 'pr' parameters
        
        // Also check localStorage (fallback)
        let workFrontIds = idsFromUrl.length > 0 ? idsFromUrl.map(id => parseInt(id)).filter(id => !isNaN(id)) : null;
        let prValues = prFromUrl.length > 0 ? prFromUrl : null;
        
        if (!workFrontIds || workFrontIds.length === 0) {
            try {
                const storedIds = localStorage.getItem('tripsheet_selected_work_front_ids');
                const storedPr = localStorage.getItem('tripsheet_selected_pr_values');
                if (storedIds) {
                    workFrontIds = JSON.parse(storedIds);
                }
                if (storedPr) {
                    prValues = JSON.parse(storedPr);
                }
            } catch (e) {
                console.error('Error reading from localStorage:', e);
            }
        }
        
        // IMPORTANT: Only show trip sheet if PR values/work_front_ids exist
        // If no PR values entered, show empty trip sheet (not all rows)
        if (!workFrontIds || workFrontIds.length === 0 || !prValues || prValues.length === 0) {
            console.log('No PR values selected - showing empty trip sheet');
            tripsheetData = [];
            breakfastTime = '';
            lunchTime = '';
            renderTable();
            return true;
        }
        
        // Build API URL with work_front_ids and PR values
        const idParams = workFrontIds.map(id => `id=${encodeURIComponent(id)}`).join('&');
        const prParams = prValues.map(pr => `pr=${encodeURIComponent(pr)}`).join('&');
        const apiUrl = `/api/tripsheet?${idParams}&${prParams}`;
        console.log('Fetching trip sheet with work_front_ids:', workFrontIds, 'PR values:', prValues);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch data`);
        }
        const data = await response.json();
        // API returns { rows, breakfast_time, lunch_time } - Food & Fuel placed based on schd time
        if (Array.isArray(data)) {
        tripsheetData = data;
            breakfastTime = '';
            lunchTime = '';
        } else {
            tripsheetData = data.rows || [];
            breakfastTime = data.breakfast_time || '';
            lunchTime = data.lunch_time || '';
        }
        renderTable();
        return true;
    } catch (error) {
        console.error('Error fetching tripsheet data:', error);
        tripsheetData = [];
        breakfastTime = '';
        lunchTime = '';
        renderTable();
        return false;
    }
}

function calculateTotalFoodFuel(regularRows) {
    // Sum all food_fuel_others times
    let totalDecimal = 0;
    regularRows.forEach(row => {
        if (row.food_fuel_others) {
            const timeVal = parseDecimalToHours(String(row.food_fuel_others));
            totalDecimal += timeVal;
        }
    });
    return decimalHoursToTime(totalDecimal);
}

function parseSchdEtToDecimal(schdEtValue) {
    // Convert schd_et or actual_time value to decimal hours, handling multiple formats
    if (!schdEtValue) return null;
    
    const str = String(schdEtValue);
    
    // Check if it's in HH:MM format
    if (str.includes(':')) {
        return parseTimeToDecimalHours(str);
    }
    
    // It's a number - parse it
    const decimal = parseFloat(str);
    if (isNaN(decimal)) return null;
    
    // Check if it looks like HH.MM format (e.g., "20.20" = 20:20)
    const wholePart = Math.floor(decimal);
    const decimalPart = decimal - wholePart;
    
    if (decimalPart === 0) {
        // Exact whole number (e.g., 8.0, 20.0) - treat as decimal hours
        return decimal;
    }
    
    // Count decimal places to distinguish HH.MM from decimal hours
    const strDecimalPart = str.split('.')[1] || '';
    const decimalPlaces = strDecimalPart.length;
    
    // If it has more than 2 decimal places (e.g., 8.333), it's definitely decimal hours, not HH.MM
    if (decimalPlaces > 2) {
        return decimal;
    }
    
    // If it has exactly 2 decimal places, check if it could be HH.MM format
    // HH.MM format: decimal part * 100 should be < 60 (minutes)
    if (decimalPlaces === 2) {
        const minutesPart = Math.round(decimalPart * 100);
        
        // If minutes part is < 60, it could be HH.MM format
        if (minutesPart < 60 && wholePart < 24 && decimalPart > 0) {
            // Check if it's a "clean" HH.MM format (e.g., 20.20, 8.05)
            const checkMinutes = decimalPart * 100;
            if (Math.abs(checkMinutes - Math.round(checkMinutes)) < 0.001) {
                // HH.MM format: convert to decimal hours
                return wholePart + (minutesPart / 60.0);
            }
        }
    }
    
    // Regular decimal hours format (e.g., 8.333 = 8.333 decimal hours = 8:20)
    return decimal;
}

function calculateTotalSchdTime(regularRows) {
    // Calculate total duration: last schd_et - first schd_et (in row order)
    // Read from DOM cells/inputs first (most up-to-date), then fall back to data
    const timesWithIndex = [];
    const rows = mainTableBody.querySelectorAll('.tr');
    
    regularRows.forEach((row, index) => {
        let schdEtValue = null;
        
        // Try to read from DOM first (user may have edited Factory row or recalculated)
        if (rows[index]) {
            const schdEtInput = rows[index].querySelector('.schd-et-input');
            const schdEtDisplay = rows[index].querySelector('.schd-et-display');
            const schdEtCell = rows[index].querySelector('.schd-et-cell');
            
            if (schdEtInput && schdEtInput.value) {
                schdEtValue = schdEtInput.value.trim();
            } else if (schdEtDisplay && schdEtDisplay.textContent) {
                schdEtValue = schdEtDisplay.textContent.trim();
            } else if (schdEtCell && schdEtCell.textContent) {
                schdEtValue = schdEtCell.textContent.trim();
            }
        }
        
        // Fall back to data if no DOM value found
        if (!schdEtValue && row.schd_et) {
            schdEtValue = row.schd_et;
        }
        
        if (schdEtValue) {
            const dec = parseSchdEtToDecimal(schdEtValue);
            if (dec !== null && !isNaN(dec)) {
                timesWithIndex.push({ time: dec, index: index });
            }
        }
    });
    
    if (timesWithIndex.length === 0) return '';
    if (timesWithIndex.length === 1) return decimalHoursToTime(timesWithIndex[0].time);
    
    // Get first and last times based on row order (not min/max)
    const firstEntry = timesWithIndex[0];
    const lastEntry = timesWithIndex[timesWithIndex.length - 1];
    const firstTime = firstEntry.time;
    const lastTime = lastEntry.time;
    const totalDuration = lastTime - firstTime;
    
    // Handle 24-hour wrap-around (if last < first, assume next day)
    const duration = totalDuration < 0 ? (24 + totalDuration) : totalDuration;
    return decimalHoursToTime(duration);
}

function calculateTotalActualTime(regularRows) {
    // Calculate total duration: last actual_time - first actual_time (in row order)
    // This shows the total time taken from start to finish
    // Read from DOM input fields first (most up-to-date), then fall back to data
    // Only consider rows that have actual time values entered
    const timesWithIndex = [];
    const rows = mainTableBody.querySelectorAll('.tr');
    
    regularRows.forEach((row, index) => {
        let actualTimeValue = null;
        
        // Try to read from DOM first (user may have edited it)
        if (rows[index]) {
            const actualTimeInput = rows[index].querySelector('.actual-time-input');
            
            if (actualTimeInput && actualTimeInput.value && actualTimeInput.value.trim() !== '') {
                actualTimeValue = actualTimeInput.value.trim();
            }
        }
        
        // Fall back to data if no DOM value found
        if (!actualTimeValue && row.actual_time && String(row.actual_time).trim() !== '') {
            actualTimeValue = String(row.actual_time).trim();
        }
        
        // Only add if we have a valid value
        if (actualTimeValue) {
            const dec = parseSchdEtToDecimal(actualTimeValue);
            if (dec !== null && !isNaN(dec)) {
                timesWithIndex.push({ time: dec, index: index });
            }
        }
    });
    
    // Need at least 2 values to calculate duration
    if (timesWithIndex.length === 0) return '';
    if (timesWithIndex.length === 1) return '';
    
    // Get first and last times based on row order (not min/max)
    const firstEntry = timesWithIndex[0];
    const lastEntry = timesWithIndex[timesWithIndex.length - 1];
    const firstTime = firstEntry.time;
    const lastTime = lastEntry.time;
    const totalDuration = lastTime - firstTime;
    
    // Handle 24-hour wrap-around (if last < first, assume next day)
    const duration = totalDuration < 0 ? (24 + totalDuration) : totalDuration;
    return decimalHoursToTime(duration);
}

function calculateTotalActualOdo(regularRows) {
    // Sum all Actual ODO Reading values from all rows
    // Read from DOM input fields first (most up-to-date), then fall back to data
    let totalOdo = 0;
    const rows = mainTableBody.querySelectorAll('.tr');
    
    regularRows.forEach((row, index) => {
        let odoValue = null;
        
        // Try to read from DOM first (user may have edited it)
        if (rows[index]) {
            const actualOdoInput = rows[index].querySelector('.actual-odo-input');
            
            if (actualOdoInput && actualOdoInput.value && actualOdoInput.value.trim() !== '') {
                odoValue = actualOdoInput.value.trim();
            }
        }
        
        // Fall back to data if no DOM value found
        if (!odoValue && row.actual_odo_read && String(row.actual_odo_read).trim() !== '') {
            odoValue = String(row.actual_odo_read).trim();
        }
        
        // Parse and add to total
        if (odoValue) {
            const odo = parseFloat(odoValue);
            if (!isNaN(odo) && odo !== null) {
                totalOdo += odo;
            }
        }
    });
    
    // Return sum if we have at least one value
    if (totalOdo === 0) return '';
    return totalOdo.toFixed(2);
}

function renderTable() {
    if (!mainTableBody) return;
    
    const tableTotalRow = document.getElementById('tableTotalRow');
    
    mainTableBody.innerHTML = '';
    if (tableTotalRow) tableTotalRow.innerHTML = '';
    
    if (tripsheetData.length === 0) {
        return;
    }
    
    // Separate regular rows and total row
    const regularRows = tripsheetData.filter(row => !row.isTotal);
    const totalRow = tripsheetData.find(row => row.isTotal);
    
    // Render only regular rows in the scrollable table body
    regularRows.forEach((row, index) => {
        const tr = document.createElement('div');
        tr.className = 'tr';
        tr.dataset.rowIndex = index;
        tr.dataset.rowId = row.id || '';
        
        // Alternate row colors (light blue and white)
        if (index % 2 === 0) {
            tr.style.backgroundColor = '#E6F3FF';
        } else {
            tr.style.backgroundColor = '#FFFFFF';
        }
        
        // Check if this is Factory row (first row with Customer_Name = 'Factory')
        const isFactoryRow = row.Customer_Name === 'Factory';
        
        // Load saved user data from localStorage
        const savedUserData = loadUserDataFromStorage();
        const rowKey = row.work_front_id || `row_${index}`;
        const savedRowData = savedUserData[rowKey] || {};
        
        // Convert schd_et from decimal hours (e.g., "7.00") to HH:MM format
        // Priority: saved data > row data
        let schdEtDisplay = '';
        if (savedRowData.schd_et) {
            schdEtDisplay = savedRowData.schd_et;
        } else if (row.schd_et) {
            const decimalHours = parseFloat(row.schd_et);
            if (!isNaN(decimalHours)) {
                const hours = Math.floor(decimalHours);
                const minutes = Math.round((decimalHours - hours) * 60);
                schdEtDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
        }
        
        // Create schd_et cell - editable input for first row, display for others
        let schdEtCell;
        if (index === 0) {
            // First row: editable input field
            schdEtCell = `<div class="td" style="width: 190px;">
                <input type="text" class="schd-et-input" 
                       value="${schdEtDisplay}" 
                       placeholder="HH:MM" 
                       style="width: 100%; border: 1px solid #ccc; padding: 2px; text-align: center;"
                       data-row-index="${index}">
            </div>`;
        } else {
            // Other rows: display calculated value
            schdEtCell = `<div class="td schd-et-display" style="width: 190px;" data-row-index="${index}">${schdEtDisplay}</div>`;
        }
        
        // Food/fuel cell: placed by recalculateSchdEt based on user-entered schd time
        const foodFuelCell = `<div class="td food-fuel-cell" style="width: 220px;" data-row-index="${index}">${row.food_fuel_others || ''}</div>`;
        const purposeCell = `<div class="td purpose-cell" style="width: 280px;" data-row-index="${index}">${row.purpose || ''}</div>`;
        
        // Convert actual_time from decimal to HH:MM for display
        // Priority: saved data > row data
        let actualTimeDisplay = '';
        if (savedRowData.actual_time) {
            actualTimeDisplay = savedRowData.actual_time;
        } else if (row.actual_time) {
            const dec = parseFloat(row.actual_time);
            if (!isNaN(dec)) {
                const h = Math.floor(dec);
                const m = Math.round((dec - h) * 60);
                actualTimeDisplay = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        }
        
        // Actual ODO Read - Priority: saved data > row data
        const actualOdoDisplay = savedRowData.actual_odo_read || row.actual_odo_read || '';
        
        // Actual time and Actual ODO Read: editable inputs (skip for total row - handled below)
        const actualTimeCell = `<div class="td" style="width: 200px;">
            <input type="text" class="actual-time-input" value="${actualTimeDisplay}" placeholder="HH:MM"
                   style="width: 100%; border: 1px solid #ccc; padding: 2px; text-align: center; box-sizing: border-box;"
                   data-row-index="${index}" data-row-id="${row.id || ''}">
        </div>`;
        const actualOdoCell = `<div class="td" style="width: 150px;">
            <input type="text" class="actual-odo-input" value="${actualOdoDisplay}" placeholder=""
                   style="width: 100%; border: 1px solid #ccc; padding: 2px; text-align: center; box-sizing: border-box;"
                   data-row-index="${index}" data-row-id="${row.id || ''}">
        </div>`;
        
        tr.innerHTML = `
            <div class="td" style="width: 95px;">${row.sn || ''}</div>
            <div class="td" style="width: 130px;">${row.mc_no || ''}</div>
            <div class="td" style="width: 450px;">${row.Customer_Name || ''}</div>
            ${purposeCell}
            <div class="td" style="width: 190px;">${row.task_class || ''}</div>
            <div class="td" style="width: 285px;">${row.cluster_location || ''}</div>
            <div class="td" style="width: 200px;">${row.est_dist_kms || ''}</div>
            <div class="td" style="width: 220px;">${row.est_trvl_time || ''}</div>
            ${foodFuelCell}
            <div class="td" style="width: 200px;">${row.est_job_time || ''}</div>
            ${schdEtCell}
            ${actualTimeCell}
            ${actualOdoCell}
        `;
        
        mainTableBody.appendChild(tr);
        
        // Add event listener for schd-et input (only for first row)
        if (index === 0) {
            const input = tr.querySelector('.schd-et-input');
            if (input) {
                input.addEventListener('change', function() {
                    recalculateSchdEt(this.value, index);
                    saveUserDataToStorage(); // Save to localStorage
                });
        
                // Format time input (HH:MM)
                input.addEventListener('input', function(e) {
                    formatTimeInput(e.target);
                    saveUserDataToStorage(); // Save to localStorage
                });
                
                // Place Food & Fuel on initial load if time already set
                if (schdEtDisplay && schdEtDisplay.includes(':')) {
                    setTimeout(() => recalculateSchdEt(schdEtDisplay, index), 0);
                }
            }
        }
        
        // Add event listeners for Actual time and Actual ODO inputs
        const actualTimeInput = tr.querySelector('.actual-time-input');
        const actualOdoInput = tr.querySelector('.actual-odo-input');
        if (actualTimeInput) {
            actualTimeInput.addEventListener('input', (e) => {
                formatTimeInput(e.target);
                // Update total row live as user types
                updateTotalRow();
                saveUserDataToStorage(); // Save to localStorage
            });
            actualTimeInput.addEventListener('change', () => {
                updateTripsheetRow(index, 'actual_time', actualTimeInput);
                // Update total row when value changes
                updateTotalRow();
                saveUserDataToStorage(); // Save to localStorage
            });
        }
        if (actualOdoInput) {
            actualOdoInput.addEventListener('input', () => {
                // Update total row live as user types
                updateTotalRow();
                saveUserDataToStorage(); // Save to localStorage
            });
            actualOdoInput.addEventListener('change', () => {
                updateTripsheetRow(index, 'actual_odo_read', actualOdoInput);
                // Update total row when ODO changes
                updateTotalRow();
                saveUserDataToStorage(); // Save to localStorage
            });
        }
    });
    
    // Store original data for recalculation (rows only, exclude total)
    window.tripsheetOriginalData = tripsheetData.filter(row => !row.isTotal);
    
    // Render total row separately in fixed container with calculated totals
    if (totalRow && tableTotalRow) {
        // Calculate totals
        const totalFoodFuel = calculateTotalFoodFuel(regularRows);
        const totalSchdTime = calculateTotalSchdTime(regularRows);
        const totalActualTime = calculateTotalActualTime(regularRows);
        const totalActualOdo = calculateTotalActualOdo(regularRows);
        
        tableTotalRow.innerHTML = `
            <div class="td" style="width: 95px;">${totalRow.sn || ''}</div>
            <div class="td" style="width: 130px;">${totalRow.mc_no || ''}</div>
            <div class="td" style="width: 450px;">${totalRow.Customer_Name || ''}</div>
            <div class="td" style="width: 280px;">${totalRow.purpose || ''}</div>
            <div class="td" style="width: 190px;">${totalRow.task_class || ''}</div>
            <div class="td" style="width: 285px;">${totalRow.cluster_location || ''}</div>
            <div class="td" style="width: 200px;">${totalRow.est_dist_kms || ''}</div>
            <div class="td" style="width: 220px;">${totalRow.est_trvl_time || ''}</div>
            <div class="td" style="width: 220px;">${totalFoodFuel || ''}</div>
            <div class="td" style="width: 200px;">${totalRow.est_job_time || ''}</div>
            <div class="td" style="width: 190px;">${totalSchdTime || ''}</div>
            <div class="td" style="width: 200px;">${totalActualTime || ''}</div>
            <div class="td" style="width: 150px;">${totalActualOdo || ''}</div>
        `;
    }
    
    // Recalculate expenses table after rendering (setup is already called in init, just recalculate)
    setTimeout(() => {
        calculateExpensesTable();
    }, 200);
}

function updateTotalRow() {
    // Update only the total row with recalculated values
    const tableTotalRow = document.getElementById('tableTotalRow');
    if (!tableTotalRow) return;
    
    const totalRow = tripsheetData.find(row => row.isTotal);
    if (!totalRow) return;
    
    const regularRows = tripsheetData.filter(row => !row.isTotal);
    
    // Calculate totals
    const totalFoodFuel = calculateTotalFoodFuel(regularRows);
    const totalSchdTime = calculateTotalSchdTime(regularRows);
    const totalActualTime = calculateTotalActualTime(regularRows);
    const totalActualOdo = calculateTotalActualOdo(regularRows);
    
    // Update only the relevant cells
    const cells = tableTotalRow.querySelectorAll('.td');
    if (cells.length >= 13) {
        cells[8].textContent = totalFoodFuel || '';  // Food & Fuel
        cells[10].textContent = totalSchdTime || ''; // Schd Time
        cells[11].textContent = totalActualTime || ''; // Actual Time
        cells[12].textContent = totalActualOdo || ''; // Actual ODO
    }
}

// Sequence sidebar removed - functions commented out
// function renderSequenceButtons() {
//     // Removed
// }

// function scrollToSequence(seq) {
//     // Removed
// }

function timeToDecimalForApi(val) {
    if (!val) return '';
    if (typeof val === 'number' && !isNaN(val)) return String(val);
    const str = String(val).trim();
    if (str.includes(':')) return String(parseTimeToDecimalHours(str));
    const num = parseFloat(str);
    return isNaN(num) ? '' : String(num);
}

async function updateTripsheetRow(rowIndex, fieldName, inputEl) {
    const rowId = inputEl.dataset.rowId;
    if (!rowId) return;
    
    const regularRows = tripsheetData.filter(r => !r.isTotal);
    const rowData = regularRows[rowIndex];
    if (!rowData) return;
    
    let value = inputEl.value.trim();
    if (fieldName === 'actual_time') {
        value = value ? String(parseTimeToDecimalHours(value.includes(':') ? value : value.replace(/(\d{2})(\d{2})/, '$1:$2'))) : '';
    }
    
    const payload = {
        Customer_Name: rowData.Customer_Name,
        mc_no: rowData.mc_no,
        purpose: rowData.purpose,
        cluster_location: rowData.cluster_location,
        est_dist_kms: rowData.est_dist_kms,
        est_trvl_time: rowData.est_trvl_time,
        food_fuel_others: rowData.food_fuel_others,
        est_job_time: rowData.est_job_time,
        schd_et: timeToDecimalForApi(rowData.schd_et),
        actual_time: fieldName === 'actual_time' ? value : timeToDecimalForApi(rowData.actual_time),
        actual_odo_read: fieldName === 'actual_odo_read' ? value : (rowData.actual_odo_read || ''),
        work_front_id: rowData.work_front_id
    };
    
    try {
        const response = await fetch(`/api/tripsheet/${rowId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Update failed');
        rowData.actual_time = payload.actual_time;
        rowData.actual_odo_read = payload.actual_odo_read;
        // Update totals after data change
        updateTotalRow();
    } catch (err) {
        console.error('Error updating trip sheet:', err);
    }
}

function formatTimeInput(input) {
    let value = input.value.replace(/[^\d:]/g, ''); // Remove non-digit, non-colon characters
    
    // Auto-format as user types (HH:MM)
    if (value.length > 0 && !value.includes(':')) {
        if (value.length >= 2) {
            value = value.substring(0, 2) + ':' + value.substring(2, 4);
        }
    }
    
    // Limit to HH:MM format
    if (value.length > 5) {
        value = value.substring(0, 5);
    }
    
    input.value = value;
}

function parseTimeToDecimalHours(timeStr) {
    // Convert HH:MM to decimal hours
    if (!timeStr || !timeStr.includes(':')) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours + (minutes / 60.0);
}

function parseDecimalToHours(decimalStr) {
    // Parse decimal string - could be:
    // 1. Decimal hours (e.g., "0.10" = 0.10 hours = 6 minutes)
    // 2. HH.MM format (e.g., "0.10" = 0 hours 10 minutes = 10 minutes)
    // We'll check: if it's < 1.0 and has 2 decimal places, treat as HH.MM format
    if (!decimalStr || decimalStr === '') return 0;
    
    const decimal = parseFloat(decimalStr);
    if (isNaN(decimal)) return 0;
    
    // Check if it looks like HH.MM format (e.g., 0.10, 0.25, 1.30)
    // If decimal part is < 60 and the number is < 24, treat as HH.MM
    const wholePart = Math.floor(decimal);
    const decimalPart = decimal - wholePart;
    const minutesPart = Math.round(decimalPart * 100);
    
    // If minutes part is < 60, treat as HH.MM format
    if (minutesPart < 60 && wholePart < 24) {
        // HH.MM format: wholePart = hours, minutesPart = minutes
        return wholePart + (minutesPart / 60.0);
    } else {
        // Regular decimal hours format
        return decimal;
    }
}

function decimalHoursToTime(decimalHours) {
    // Convert decimal hours to HH:MM format
    if (!decimalHours || decimalHours === 0) return '';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function addTimeToTime(baseTimeStr, hoursToAdd) {
    // Add hours (decimal) to time string (HH:MM) and return new time string
    if (!baseTimeStr || !baseTimeStr.includes(':')) return '';
    
    const baseDecimal = parseTimeToDecimalHours(baseTimeStr);
    const newDecimal = baseDecimal + hoursToAdd;
    
    // Handle 24-hour overflow
    const finalDecimal = newDecimal % 24;
    
    return decimalHoursToTime(finalDecimal);
}

function recalculateSchdEt(factoryTimeStr, factoryRowIndex) {
    // Recalculate schd_et and place Food & Fuel based on scheduled time
    // Breakfast: Travel row where scheduled time is between 7:00 to 8:30
    // Lunch: Travel row where scheduled time crosses 12:00
    const rows = mainTableBody.querySelectorAll('.tr');
    const regularRows = tripsheetData.filter(r => !r.isTotal);
    let currentTime = factoryTimeStr;
    let breakfastPlaced = false;
    let lunchPlaced = false;
    
    if (regularRows[factoryRowIndex]) {
        regularRows[factoryRowIndex].schd_et = factoryTimeStr;
    }
    
    for (let i = factoryRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = parseInt(row.dataset.rowIndex);
        const rowData = regularRows[rowIndex];
        
        if (!rowData || rowData.isTotal) continue;
        
        const basePurpose = (rowData.purpose || '').trim();
        const isTravelRow = basePurpose === 'Travel' || basePurpose.startsWith('Travel and ');
        const estTrvlTime = rowData.est_trvl_time || '';
        const estJobTime = rowData.est_job_time || '';
        const travelHours = parseDecimalToHours(estTrvlTime);
        
        let rowPurpose = 'Travel';
        let rowFoodFuel = '';
        
        if (isTravelRow) {
            // Determine Food & Fuel based on scheduled time (currentTime), not Factory start time
            const currentDecimal = parseTimeToDecimalHours(currentTime);
            const endTimeAfterTravel = currentDecimal + travelHours;
            
            // Breakfast: place when scheduled time falls in 7:00 to 8:30 window
            // 8:30 = 8.5 in decimal hours
            if (!breakfastPlaced && breakfastTime) {
                const inBreakfastWindow = currentDecimal >= 7 && currentDecimal < 8.5;
                const crossesBreakfastStart = currentDecimal < 7 && endTimeAfterTravel >= 7;
                
                // Place breakfast if current time is in window OR if travel crosses into breakfast window
                if (inBreakfastWindow || (crossesBreakfastStart && endTimeAfterTravel <= 8.5)) {
                    rowPurpose = 'Travel and Breakfast';
                    rowFoodFuel = breakfastTime;
                    breakfastPlaced = true; // Mark breakfast as placed
                }
            }
            // Lunch: place when scheduled time crosses 12:00 (12:00 to 13:00 window)
            // Place lunch in the travel row that crosses 12:00, or if already past 12:00, place in first travel row after 12:00
            // 1:00 PM = 13:00 = 13.0 in decimal hours
            if (!lunchPlaced && lunchTime) {
                // Place lunch if:
                // 1. Travel crosses into lunch window (starts before 12:00, ends at/after 12:00), OR
                // 2. Current time is already in lunch window (12:00-13:00) and we haven't placed lunch yet, OR
                // 3. Current time is past 12:00 but before 13:30 (missed lunch window, place retroactively)
                const crossesLunchStart = currentDecimal < 12 && endTimeAfterTravel >= 12;
                const inLunchWindow = currentDecimal >= 12 && currentDecimal < 13;
                const missedLunchWindow = currentDecimal >= 12 && currentDecimal < 13.5; // Allow up to 13:30 to place lunch retroactively
                
                if (crossesLunchStart || inLunchWindow || missedLunchWindow) {
                    rowPurpose = 'Travel and Lunch';
                    rowFoodFuel = lunchTime;
                    lunchPlaced = true; // Mark lunch as placed
                }
            }
            
            // Add travel time
            if (travelHours > 0) {
                currentTime = addTimeToTime(currentTime, travelHours);
            }
            // Add food/fuel time (breakfast or lunch)
            if (rowFoodFuel) {
                const foodHours = parseDecimalToHours(rowFoodFuel);
                if (foodHours > 0) {
                    currentTime = addTimeToTime(currentTime, foodHours);
                }
            }
        } else if (basePurpose !== '' && basePurpose !== 'Factory') {
            // Company row: add job time
            rowPurpose = basePurpose;
            const jobHours = parseDecimalToHours(estJobTime);
            if (jobHours > 0) {
                currentTime = addTimeToTime(currentTime, jobHours);
            }
        } else {
            rowPurpose = basePurpose || '';
        }
        
        // Update DOM: purpose, food_fuel, schd_et
        const purposeCell = row.querySelector('.purpose-cell');
        const foodFuelCell = row.querySelector('.food-fuel-cell');
        const schdEtElement = row.querySelector('.schd-et-input') || row.querySelector('.schd-et-display') || row.querySelector('.schd-et-cell');
        
        if (purposeCell) purposeCell.textContent = rowPurpose;
        if (foodFuelCell) foodFuelCell.textContent = rowFoodFuel;
        if (schdEtElement) schdEtElement.textContent = currentTime;
        
        // Update row data
        if (regularRows[rowIndex]) {
            regularRows[rowIndex].purpose = rowPurpose;
            regularRows[rowIndex].food_fuel_others = rowFoodFuel;
            regularRows[rowIndex].schd_et = currentTime;
        }
    }
    
    // Update totals after recalculation
    updateTotalRow();
}

// Resequence button removed - function commented out
// function setupResequenceButton() {
//     // Removed
// }

function setupMasterScrollbar() {
    const masterScrollbar = document.getElementById('masterScrollbar');
    const scrollbarContent = masterScrollbar?.querySelector('.scrollbar-content');
    const tableBody = document.getElementById('mainTableBody');
    
    if (!masterScrollbar || !scrollbarContent || !tableBody) {
        console.error('Master scrollbar elements not found');
        return;
    }
    
    // Calculate content height - wait a bit for rendering
    setTimeout(() => {
        const tableHeight = tableBody.scrollHeight;
        const maxHeight = Math.max(tableHeight, 1000); // Minimum 1000px
        
        // Set scrollbar content height to make it scrollable
        scrollbarContent.style.height = maxHeight + 'px';
        
        let isScrolling = false;
        
        // Sync scrolling: master scrollbar controls table
        masterScrollbar.addEventListener('scroll', function() {
            if (isScrolling) return;
            isScrolling = true;
            
            const scrollTop = this.scrollTop;
            const masterMaxScroll = maxHeight - masterScrollbar.clientHeight;
            const scrollRatio = masterMaxScroll > 0 ? scrollTop / masterMaxScroll : 0;
            
            // Calculate scroll position for table body
            const tableMaxScroll = tableBody.scrollHeight - tableBody.clientHeight;
            if (tableMaxScroll > 0) {
                const tableScrollTop = scrollRatio * tableMaxScroll;
                tableBody.scrollTop = tableScrollTop;
            }
            
            setTimeout(() => { isScrolling = false; }, 10);
        });
        
        // Sync scrolling: table body scroll updates master
        tableBody.addEventListener('scroll', function() {
            if (isScrolling) return;
            isScrolling = true;
            
            const scrollTop = this.scrollTop;
            const maxScroll = this.scrollHeight - this.clientHeight;
            const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
            
            const masterMaxScroll = maxHeight - masterScrollbar.clientHeight;
            if (masterMaxScroll > 0) {
                masterScrollbar.scrollTop = scrollRatio * masterMaxScroll;
            }
            
            setTimeout(() => { isScrolling = false; }, 10);
        });
    }, 200);
}

function setCurrentDate() {
    const dateInput = document.getElementById('tripSheetDate');
    if (dateInput) {
        const now = new Date();
        // Format: DD-MMM-YY (e.g., 23-Nov-23)
        const day = String(now.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = String(now.getFullYear()).slice(-2);
        dateInput.value = `${day}-${month}-${year}`;
    }
}

async function init() {
    if (!mainTableBody) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Set current date
    setCurrentDate();
    
    await fetchTripsheetData();
    
    // Setup vehicle expenses calculations after data is loaded and table is rendered
    // Give it a bit more time to ensure DOM is fully ready
    setTimeout(() => {
        setupVehicleExpensesCalculations();
    }, 300);
    
    setupPrintButton();
    setupClearButton();
    
    // Setup master scrollbar after content is rendered
    setTimeout(() => {
        setupMasterScrollbar();
    }, 100);
}

// Calculate total km from main table
function calculateTotalKm() {
    const regularRows = tripsheetData.filter(row => !row.isTotal);
    let totalKm = 0;
    
    regularRows.forEach(row => {
        const kmValue = parseFloat(row.est_dist_kms) || 0;
        totalKm += kmValue;
    });
    
    return totalKm;
}

// Calculate expenses table values
function calculateExpensesTable() {
    try {
        console.log('calculateExpensesTable called');
        
        // Get values from vehicle table
        const mileageInput = document.querySelector('.vehicle-data-cell[data-col="2"]');
        const perLkgInput = document.querySelector('.vehicle-data-cell[data-col="3"]');
        const hotelInput = document.querySelector('.expenses-data-cell[data-col="3"]');
        const foodInput = document.querySelector('.expenses-data-cell[data-col="4"]');
        
        if (!mileageInput || !perLkgInput) {
            console.warn('Vehicle inputs not found:', {
                mileageInput: !!mileageInput,
                perLkgInput: !!perLkgInput
            });
            return;
        }
        
        const mileage = parseFloat(mileageInput.value) || 0;
        const perLkg = parseFloat(perLkgInput.value) || 0;
        const hotel = parseFloat(hotelInput?.value) || 0;
        const food = parseFloat(foodInput?.value) || 0;
        
        console.log('Input values:', { mileage, perLkg, hotel, food });
        
        // Calculate total km from main table
        const totalKm = calculateTotalKm();
        console.log('Total KM:', totalKm);
        
        // Calculate Fuel Req = total km / mileage
        let fuelReq = 0;
        if (mileage > 0 && totalKm > 0) {
            fuelReq = totalKm / mileage;
            fuelReq = Math.round(fuelReq * 100) / 100; // Round to 2 decimal places
        }
        
        // Calculate Fuel Cost = Fuel Req * per l/kg price
        let fuelCost = 0;
        if (fuelReq > 0 && perLkg > 0) {
            fuelCost = fuelReq * perLkg;
            fuelCost = Math.round(fuelCost * 100) / 100; // Round to 2 decimal places
        }
        
        // Calculate Total amt req = Fuel Cost + Hotel + Food (not Fuel Req, that's in liters/kg)
        const totalAmtReq = fuelCost + hotel + food;
        
        // Update expenses table
        const fuelReqInput = document.querySelector('.expenses-data-cell[data-col="1"]');
        const fuelCostInput = document.querySelector('.expenses-data-cell[data-col="2"]');
        const totalAmtReqInput = document.querySelector('.expenses-data-cell[data-col="0"]');
        
        console.log('Output elements found:', {
            fuelReqInput: !!fuelReqInput,
            fuelCostInput: !!fuelCostInput,
            totalAmtReqInput: !!totalAmtReqInput
        });
        
        if (fuelReqInput) {
            fuelReqInput.value = fuelReq > 0 ? fuelReq.toFixed(2) : '';
            console.log('Fuel Req set to:', fuelReqInput.value);
        } else {
            console.error('Fuel Req input not found!');
        }
        
        if (fuelCostInput) {
            fuelCostInput.value = fuelCost > 0 ? fuelCost.toFixed(2) : '';
            console.log('Fuel Cost set to:', fuelCostInput.value);
        } else {
            console.error('Fuel Cost input not found!');
        }
        
        if (totalAmtReqInput) {
            totalAmtReqInput.value = totalAmtReq > 0 ? totalAmtReq.toFixed(2) : '';
            console.log('Total Amt Req set to:', totalAmtReqInput.value);
        } else {
            console.error('Total Amt Req input not found!');
        }
        
        console.log('Expenses calculated:', { mileage, perLkg, totalKm, fuelReq, fuelCost, hotel, food, totalAmtReq });
    } catch (error) {
        console.error('Error calculating expenses table:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Test function - can be called from browser console: testVehicleExpenses()
window.testVehicleExpenses = function() {
    console.log('=== Testing Vehicle Expenses ===');
    const mileageInput = document.querySelector('.vehicle-data-cell[data-col="2"]');
    const perLkgInput = document.querySelector('.vehicle-data-cell[data-col="3"]');
    console.log('Mileage input:', mileageInput);
    console.log('Per L/kg input:', perLkgInput);
    if (mileageInput) {
        mileageInput.value = '20';
        mileageInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (perLkgInput) {
        perLkgInput.value = '100';
        perLkgInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    calculateExpensesTable();
    console.log('=== Test Complete ===');
};

// Setup event listeners for vehicle and expenses table calculations
function setupVehicleExpensesCalculations() {
    console.log('Setting up vehicle expenses calculations...');
    
    // Function to actually setup the listeners (called when DOM is ready)
    function doSetup() {
        console.log('Setting up listeners...');
        
        // Get all input elements
        const mileageInput = document.querySelector('.vehicle-data-cell[data-col="2"]');
        const perLkgInput = document.querySelector('.vehicle-data-cell[data-col="3"]');
        const hotelInput = document.querySelector('.expenses-data-cell[data-col="3"]');
        const foodInput = document.querySelector('.expenses-data-cell[data-col="4"]');
        const vehicleInput = document.querySelector('.vehicle-data-cell[data-col="0"]');
        const fuelSelect = document.querySelector('.vehicle-data-cell[data-col="1"]');
        
        // Debug: Log which elements were found
        console.log('Elements found:', {
            mileageInput: !!mileageInput,
            perLkgInput: !!perLkgInput,
            hotelInput: !!hotelInput,
            foodInput: !!foodInput,
            vehicleInput: !!vehicleInput,
            fuelSelect: !!fuelSelect
        });
        
        if (!mileageInput || !perLkgInput) {
            console.error('Critical inputs not found! Retrying in 500ms...');
            setTimeout(doSetup, 500);
            return;
        }
        
        // Load saved vehicle/expenses data first
        const savedData = loadVehicleExpensesFromStorage();
        console.log('Loaded saved data:', savedData);
        
        // Apply saved data to inputs
        Object.keys(savedData).forEach(key => {
            const colIndex = key.replace(/vehicle_|expenses_/, '');
            const element = document.querySelector(`[data-col="${colIndex}"]`);
            if (element && (element.tagName === 'INPUT' || element.tagName === 'SELECT')) {
                element.value = savedData[key];
                console.log(`Restored ${key} = ${savedData[key]}`);
            }
        });
        
        // Helper function to setup listener (remove old listener first to prevent duplicates)
        function setupListener(element, eventType, handler) {
            if (!element) {
                console.warn(`Element not found for event ${eventType}`);
                return;
            }
            
            // Remove any existing listener with same type
            const newHandler = function(e) {
                console.log(`Event ${eventType} triggered on`, element);
                handler(e);
            };
            
            // Store handler reference for removal
            if (!element._handlers) {
                element._handlers = {};
            }
            if (element._handlers[eventType]) {
                element.removeEventListener(eventType, element._handlers[eventType]);
            }
            element._handlers[eventType] = newHandler;
            element.addEventListener(eventType, newHandler);
            console.log(`Listener added for ${eventType} on`, element);
        }
        
        // Setup listeners with save to localStorage
        const saveAndCalculate = () => {
            console.log('saveAndCalculate called');
            saveVehicleExpensesToStorage();
            calculateExpensesTable();
        };
        
        // Vehicle and Fuel - save only (don't affect calculations)
        if (vehicleInput) {
            setupListener(vehicleInput, 'change', saveVehicleExpensesToStorage);
            setupListener(vehicleInput, 'input', saveVehicleExpensesToStorage);
        } else {
            console.warn('Vehicle input not found!');
        }
        
        if (fuelSelect) {
            setupListener(fuelSelect, 'change', saveVehicleExpensesToStorage);
        } else {
            console.warn('Fuel select not found!');
        }
        
        // Mileage and Per L/kg - trigger calculations
        if (mileageInput) {
            setupListener(mileageInput, 'input', saveAndCalculate);
            setupListener(mileageInput, 'change', saveAndCalculate);
            setupListener(mileageInput, 'blur', saveAndCalculate);
            console.log('Mileage input listeners set up');
        } else {
            console.error('Mileage input not found!');
        }
        
        if (perLkgInput) {
            setupListener(perLkgInput, 'input', saveAndCalculate);
            setupListener(perLkgInput, 'change', saveAndCalculate);
            setupListener(perLkgInput, 'blur', saveAndCalculate);
            console.log('Per L/kg input listeners set up');
        } else {
            console.error('Per L/kg input not found!');
        }
        
        // Hotel and Food - trigger calculations
        if (hotelInput) {
            setupListener(hotelInput, 'input', saveAndCalculate);
            setupListener(hotelInput, 'change', saveAndCalculate);
            setupListener(hotelInput, 'blur', saveAndCalculate);
        }
        
        if (foodInput) {
            setupListener(foodInput, 'input', saveAndCalculate);
            setupListener(foodInput, 'change', saveAndCalculate);
            setupListener(foodInput, 'blur', saveAndCalculate);
        }
        
        // Initial calculation
        console.log('Running initial calculation...');
        calculateExpensesTable();
    }
    
    // Check if DOM is ready, if not wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(doSetup, 100);
        });
    } else {
        // DOM is ready, but wait a bit for elements to be rendered
        setTimeout(doSetup, 100);
    }
}

// Clear table function
function clearTable() {
    // Clear tripsheet data array completely (this contains all row data including SN, M/c No., Customer Name, Purpose, etc.)
    tripsheetData = [];
    breakfastTime = '';
    lunchTime = '';
    
    // Clear localStorage (removes all saved user data)
    clearStorageData();
    
    // Clear main table body - this removes all rows including:
    // SN, M/c No., Customer Name, Purpose, Task Class, Cluster Location,
    // Est. Dist Kms, Est. Trvl Time, Food/Fuel others, Est. Job time,
    // Schd ET, Actual Time, Actual ODO Read
    if (mainTableBody) {
        mainTableBody.innerHTML = '';
    }
    
    // Clear total row
    const tableTotalRow = document.getElementById('tableTotalRow');
    if (tableTotalRow) {
        tableTotalRow.innerHTML = '';
    }
    
    // Clear all input fields in table rows (Schd ET, Actual Time, Actual ODO Read)
    const schdEtInputs = document.querySelectorAll('.schd-et-input');
    schdEtInputs.forEach(input => {
        input.value = '';
    });
    
    const actualTimeInputs = document.querySelectorAll('.actual-time-input');
    actualTimeInputs.forEach(input => {
        input.value = '';
    });
    
    const actualOdoInputs = document.querySelectorAll('.actual-odo-input');
    actualOdoInputs.forEach(input => {
        input.value = '';
    });
    
    // Clear all table cells (purpose, food-fuel, schd-et cells)
    const purposeCells = document.querySelectorAll('.purpose-cell');
    purposeCells.forEach(cell => {
        cell.textContent = '';
    });
    
    const foodFuelCells = document.querySelectorAll('.food-fuel-cell');
    foodFuelCells.forEach(cell => {
        cell.textContent = '';
    });
    
    const schdEtDisplays = document.querySelectorAll('.schd-et-display');
    schdEtDisplays.forEach(cell => {
        cell.textContent = '';
    });
    
    // Clear vehicle and expenses inputs
    const vehicleInputs = document.querySelectorAll('.vehicle-data-cell input, .vehicle-data-cell select');
    vehicleInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.value = '';
        } else {
            input.value = '';
        }
    });
    
    const expensesInputs = document.querySelectorAll('.expenses-data-cell input');
    expensesInputs.forEach(input => {
        if (!input.readOnly) {
            input.value = '';
        } else {
            input.value = ''; // Clear readonly fields too
        }
    });
    
    // Clear engineer name
    const engineerInput = document.getElementById('engineerName');
    if (engineerInput) {
        engineerInput.value = '';
    }
    
    // Clear trip sheet number
    const tripsheetNoInput = document.querySelector('.tripsheet-no-input');
    if (tripsheetNoInput) {
        tripsheetNoInput.value = '';
    }
    
    // Reset date to current date
    setCurrentDate();
    
    console.log('All trip sheet data cleared including SN, M/c No., Customer Name, Purpose, Task Class, Cluster Location, Est. Dist Kms, Est. Trvl Time, Food/Fuel others, Est. Job time, Schd ET, Actual Time');
}

// Export trip sheet to Excel using ExcelJS (supports borders and styling)
async function exportToExcel() {
    try {
        // Create a new workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        
        // Get current date for filename
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        
        // Collect all data from the page
        const rows = mainTableBody.querySelectorAll('.tr');
        const regularRows = tripsheetData.filter(r => !r.isTotal);
        const totalRow = tripsheetData.find(r => r.isTotal);
        
        // Prepare main table data with exact column headers matching HTML table
        const mainTableData = [];
        
        // Add headers - matching exact order from HTML table
        mainTableData.push([
            'SN', 
            'M/c No.', 
            'Customer Name', 
            'Purpose', 
            'Task Class', 
            'Cluster Location',
            'Est. Dist Kms', 
            'Est. Trvl Time', 
            'Food, Fuel others', 
            'Est. Job time',
            'Schd ET', 
            'Actual Time', 
            'Actual ODO Read'
        ]);
        
        // Add data rows - get values directly from DOM cells to ensure accuracy
        rows.forEach((row, index) => {
            const rowIndex = parseInt(row.dataset.rowIndex);
            const rowData = regularRows[rowIndex];
            
            if (rowData) {
                // Get all cell values from DOM (most accurate)
                const cells = row.querySelectorAll('.td');
                
                // Extract values from DOM cells in order
                const sn = cells[0] ? cells[0].textContent.trim() : (rowData.sn || '');
                const mcNo = cells[1] ? cells[1].textContent.trim() : (rowData.mc_no || '');
                const customerName = cells[2] ? cells[2].textContent.trim() : (rowData.Customer_Name || '');
                
                // Purpose - check if it's a cell or has been updated
                const purposeCell = row.querySelector('.purpose-cell');
                const purpose = purposeCell ? purposeCell.textContent.trim() : (cells[3] ? cells[3].textContent.trim() : (rowData.purpose || ''));
                
                const taskClass = cells[4] ? cells[4].textContent.trim() : (rowData.task_class || '');
                const clusterLocation = cells[5] ? cells[5].textContent.trim() : (rowData.cluster_location || '');
                const estDistKms = cells[6] ? cells[6].textContent.trim() : (rowData.est_dist_kms || '');
                const estTrvlTime = cells[7] ? cells[7].textContent.trim() : (rowData.est_trvl_time || '');
                
                // Food/Fuel - check dynamic cell
                const foodFuelCell = row.querySelector('.food-fuel-cell');
                const foodFuel = foodFuelCell ? foodFuelCell.textContent.trim() : (cells[8] ? cells[8].textContent.trim() : (rowData.food_fuel_others || ''));
                
                const estJobTime = cells[9] ? cells[9].textContent.trim() : (rowData.est_job_time || '');
                
                // Schd ET - check input first, then display div, then cell
                const schdEtInput = row.querySelector('.schd-et-input');
                const schdEtDisplay = row.querySelector('.schd-et-display');
                const schdEtCell = row.querySelector('.schd-et-cell');
                const schdEt = schdEtInput ? schdEtInput.value.trim() : (schdEtDisplay ? schdEtDisplay.textContent.trim() : (schdEtCell ? schdEtCell.textContent.trim() : (cells[10] ? cells[10].textContent.trim() : '')));
                
                // Actual Time - check input
                const actualTimeInput = row.querySelector('.actual-time-input');
                const actualTime = actualTimeInput ? actualTimeInput.value.trim() : (cells[11] ? cells[11].textContent.trim() : '');
                
                // Actual ODO Read - check input
                const actualOdoInput = row.querySelector('.actual-odo-input');
                const actualOdo = actualOdoInput ? actualOdoInput.value.trim() : (cells[12] ? cells[12].textContent.trim() : '');
                
                mainTableData.push([
                    sn,
                    mcNo,
                    customerName,
                    purpose,
                    taskClass,
                    clusterLocation,
                    estDistKms,
                    estTrvlTime,
                    foodFuel,
                    estJobTime,
                    schdEt,
                    actualTime,
                    actualOdo
                ]);
            }
        });
        
        // Add total row - get from DOM total row
        if (totalRow) {
            const tableTotalRow = document.getElementById('tableTotalRow');
            const totalCells = tableTotalRow ? tableTotalRow.querySelectorAll('.td') : [];
            
            // Extract total values from DOM cells
            const totalSn = totalCells[0] ? totalCells[0].textContent.trim() : (totalRow.sn || '');
            const totalMcNo = totalCells[1] ? totalCells[1].textContent.trim() : (totalRow.mc_no || '');
            const totalCustomerName = totalCells[2] ? totalCells[2].textContent.trim() : (totalRow.Customer_Name || 'Total');
            const totalPurpose = totalCells[3] ? totalCells[3].textContent.trim() : (totalRow.purpose || '');
            const totalTaskClass = totalCells[4] ? totalCells[4].textContent.trim() : (totalRow.task_class || '');
            const totalClusterLocation = totalCells[5] ? totalCells[5].textContent.trim() : (totalRow.cluster_location || '');
            const totalEstDistKms = totalCells[6] ? totalCells[6].textContent.trim() : '';
            const totalEstTrvlTime = totalCells[7] ? totalCells[7].textContent.trim() : '';
            const totalFoodFuel = totalCells[8] ? totalCells[8].textContent.trim() : '';
            const totalEstJobTime = totalCells[9] ? totalCells[9].textContent.trim() : '';
            const totalSchdEt = totalCells[10] ? totalCells[10].textContent.trim() : '';
            const totalActualTime = totalCells[11] ? totalCells[11].textContent.trim() : '';
            const totalActualOdo = totalCells[12] ? totalCells[12].textContent.trim() : '';
            
            mainTableData.push([
                totalSn,
                totalMcNo,
                totalCustomerName,
                totalPurpose,
                totalTaskClass,
                totalClusterLocation,
                totalEstDistKms,
                totalEstTrvlTime,
                totalFoodFuel,
                totalEstJobTime,
                totalSchdEt,
                totalActualTime,
                totalActualOdo
            ]);
        }
        
        // Create single worksheet for everything
        const worksheet = workbook.addWorksheet('Trip Sheet');
        
        // Get Engineer and Date info
        const engineerInput = document.getElementById('engineerName');
        const dateInput = document.getElementById('tripSheetDate');
        const engineerName = engineerInput ? engineerInput.value : '';
        const tripDate = dateInput ? dateInput.value : '';
        
        // Define border style (thin black borders)
        const borderStyle = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        
        let currentRow = 1; // Start from row 1
        
        // Add Engineer info at the top
        const engineerRow = worksheet.addRow(['Engineer:', engineerName, 'Date:', tripDate]);
        engineerRow.eachCell({ includeEmpty: false }, (cell) => {
            cell.border = borderStyle;
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle' };
        });
        currentRow++;
        
        // Add empty row for spacing
        worksheet.addRow([]);
        currentRow++;
        
        // Set column widths for main table (will also be used for vertical tables in columns A-B)
        worksheet.columns = [
            { width: 25 },  // Column A - Labels for vertical tables / SN for main table
            { width: 20 },  // Column B - Values for vertical tables / M/c No. for main table
            { width: 30 },  // Column C - Customer Name
            { width: 20 },  // Column D - Purpose
            { width: 15 },  // Column E - Task Class
            { width: 20 },  // Column F - Cluster Location
            { width: 15 },  // Column G - Est. Dist Kms
            { width: 15 },  // Column H - Est. Trvl Time
            { width: 18 },  // Column I - Food, Fuel others
            { width: 15 },  // Column J - Est. Job time
            { width: 12 },  // Column K - Schd ET
            { width: 12 },  // Column L - Actual Time
            { width: 15 }   // Column M - Actual ODO Read
        ];
        
        // Add main table data rows
        mainTableData.forEach((row, rowIndex) => {
            const excelRow = worksheet.addRow(row);
            
            // Apply borders to all cells in this row
            excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.border = borderStyle;
                
                // Header row styling (first row of main table)
                if (rowIndex === 0) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF006DB8' }
                    };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    excelRow.height = 20;
                } else {
                    cell.alignment = { vertical: 'middle' };
                }
            });
            currentRow++;
        });
        
        // Add empty row for spacing
        worksheet.addRow([]);
        currentRow++;
        
        // Prepare Vehicle table data (vertical format)
        const vehicleInputs = document.querySelectorAll('.vehicle-data-cell');
        const vehicleData = [];
        vehicleInputs.forEach((input, index) => {
            const labels = ['Vehicle', 'Fuel', 'Mileage', 'per l/kg Rs.'];
            if (labels[index]) {
                vehicleData.push([labels[index], input.value || '']);
            }
        });
        
        // Add Vehicle table section header
        const vehicleHeaderRow = worksheet.addRow(['Vehicle and Fuel Information']);
        vehicleHeaderRow.getCell(1).border = borderStyle;
        vehicleHeaderRow.getCell(1).font = { bold: true, size: 12 };
        vehicleHeaderRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        vehicleHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        vehicleHeaderRow.height = 20;
        currentRow++;
        
        // Add Vehicle table data (vertical format)
        vehicleData.forEach((row) => {
            const excelRow = worksheet.addRow(row);
            excelRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = borderStyle;
                cell.alignment = { vertical: 'middle' };
                // First column (label) - bold
                if (cell.col === 1) {
                    cell.font = { bold: true };
                }
            });
            currentRow++;
        });
        
        // Add empty row for spacing
        worksheet.addRow([]);
        currentRow++;
        
        // Prepare Expenses table data (vertical format)
        const expensesInputs = document.querySelectorAll('.expenses-data-cell');
        const expensesLabels = ['Total amt req', 'Fuel Req', 'Fuel Cost', 'Hotel', 'Food'];
        const expensesData = [];
        expensesInputs.forEach((input, index) => {
            if (expensesLabels[index]) {
                expensesData.push([expensesLabels[index], input.value || '']);
            }
        });
        
        // Add Expenses table section header
        const expensesHeaderRow = worksheet.addRow(['Total Amount and Expenses']);
        expensesHeaderRow.getCell(1).border = borderStyle;
        expensesHeaderRow.getCell(1).font = { bold: true, size: 12 };
        expensesHeaderRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        expensesHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        expensesHeaderRow.height = 20;
        currentRow++;
        
        // Add Expenses table data (vertical format)
        expensesData.forEach((row) => {
            const excelRow = worksheet.addRow(row);
            excelRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = borderStyle;
                cell.alignment = { vertical: 'middle' };
                // First column (label) - bold
                if (cell.col === 1) {
                    cell.font = { bold: true };
                }
            });
            currentRow++;
        });
        
        // Generate filename
        const filename = `TripSheet_${dateStr}.xlsx`;
        
        // Write file using ExcelJS
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        
        console.log('Trip sheet exported to Excel successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please make sure all data is filled correctly.');
    }
}

// Setup print button
function setupPrintButton() {
    const printButton = document.getElementById('printTableButton');
    if (printButton) {
        printButton.addEventListener('click', function() {
            exportToExcel();
        });
    }
}

// Setup clear button
function setupClearButton() {
    const clearButton = document.getElementById('clearTableButton');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            // Clear all data immediately on one click (no confirmation)
            clearTable();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
