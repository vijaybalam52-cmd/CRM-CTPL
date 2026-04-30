// Work Front - Table data loaded from MySQL via API
let tableData = [];
let rowIds = [];

let totalRows = 0; // Dynamic - will be set based on actual data length
let sprValues = [];
let prValues = [];
let doneValues = [];
let statusValues = []; // Track status for each row
let isSortedByZarc = false;
let psortState = 'none'; // 'none', 'F', or 'T'

let originalTableData = [];
let originalRowIds = [];
let originalSprValues = [];
let originalPrValues = [];
let originalDoneValues = [];
let originalStatusValues = [];

// LocalStorage key for PR values (temporary, not stored in database)
const STORAGE_KEY_PR_VALUES = 'workfront_pr_values';

// Helper function to get total rows (based on actual data length)
function getTotalRows() {
    return Math.max(totalRows, tableData.length);
}

function renumberTableRows() {
    let serial = 1;
    for (let i = 0; i < tableData.length; i++) {
        if (tableData[i]) {
            tableData[i].sl = String(serial);
            serial += 1;
        }
    }
}

let mainTableBody;
let sprBody;
let prBody;
let masterScrollbar;
let tableContainer;

async function fetchWorkfrontData() {
    try {
        console.log('Fetching workfront data...');
        const response = await fetch('/api/workfront');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch data`);
        }
        const data = await response.json();
        console.log('Workfront data received:', data.length, 'records');
        
        // Set total rows based on actual data length (dynamic)
        totalRows = data.length;
        
        tableData = [];
        rowIds = [];
        sprValues = [];
        prValues = [];
        doneValues = [];
        
        // Process all records from database (no limit)
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            tableData.push({
                sl: String(i + 1),
                date: row.date || '',
                mc: row.mc || '',
                ticket_no: row.ticket_no || '',
                company: row.company || '',
                prior: row.prior || '',
                s: row.s || '0',
                a: row.a || '0',
                i: row.i || '0',
                d: row.d || '0',
                e: row.e || '0',
                f: row.f || '0',
                p: row.p || '0',
                purpose: row.purpose || '',
                remarks: row.remarks || '',
                zarc: row.zarc || '',
                cluster: row.cluster || '',
                person: row.person || '',
                contact: row.contact || '',
                rg: row.rg || '',
                logby: row.logby || ''
            });
            rowIds.push(row.id);
            sprValues.push(row.spr || '-');
            // PR values are NOT stored in database - load from localStorage instead
            doneValues.push(row.done || false);
            // Track status - if done is true, status is 'done', otherwise check if status field exists
            statusValues.push(row.status || (row.done ? 'done' : 'open'));
        }
        
        // Load PR values from localStorage (temporary storage, not database)
        loadPrValuesFromStorage();
        renumberTableRows();
        
        saveOriginalOrder();
        console.log('Workfront data processed successfully');
        return true;
    } catch (error) {
        console.error('Error fetching workfront data:', error);
        alert('Error loading workfront data: ' + error.message);
        totalRows = 0;
        tableData = [];
        rowIds = [];
        sprValues = [];
        prValues = [];
        doneValues = [];
        statusValues = [];
        saveOriginalOrder();
        return false;
    }
}

function saveOriginalOrder() {
    renumberTableRows();
    originalTableData = tableData.map(r => r ? { ...r } : null);
    originalRowIds = [...rowIds];
    originalSprValues = [...sprValues];
    originalPrValues = [...prValues];
    originalDoneValues = [...doneValues];
    originalStatusValues = [...statusValues];
}

function sortByZarc() {
    const combined = [];
    const total = getTotalRows();
    
    // If F is active, sort only F=1 rows by ZARC, keep F=0 rows below
    if (psortState === 'F') {
        const f1Rows = [];
        const f0Rows = [];
        const nullRows = [];
        
        for (let i = 0; i < total; i++) {
            const row = tableData[i];
            if (!row) {
                nullRows.push({ index: i, zarcVal: Infinity, row: null, rowId: rowIds[i], spr: sprValues[i], pr: prValues[i], done: doneValues[i], status: statusValues[i] });
            } else {
                const fVal = row.f ? (parseInt(row.f) || 0) : 0;
                const zarcVal = row.zarc ? (parseInt(row.zarc) || row.zarc) : Infinity;
                const item = { index: i, zarcVal, row, rowId: rowIds[i], spr: sprValues[i], pr: prValues[i], done: doneValues[i], status: statusValues[i] };
                
                if (fVal === 1) {
                    f1Rows.push(item);
                } else {
                    f0Rows.push(item);
                }
            }
        }
        
        // Sort F=1 rows by ZARC
        f1Rows.sort((a, b) => a.zarcVal - b.zarcVal);
        // F=0 rows stay in their current order (or sort by priority if needed)
        f0Rows.sort((a, b) => {
            const aPrior = a.row && a.row.prior ? (parseInt(a.row.prior) || a.row.prior) : Infinity;
            const bPrior = b.row && b.row.prior ? (parseInt(b.row.prior) || b.row.prior) : Infinity;
            if (aPrior === Infinity && bPrior === Infinity) return 0;
            if (aPrior === Infinity) return 1;
            if (bPrior === Infinity) return -1;
            return aPrior - bPrior;
        });
        
        // Combine: F=1 (sorted by ZARC) first, then F=0, then null rows
        combined.push(...f1Rows, ...f0Rows, ...nullRows);
    }
    // If T is active, sort only F=0 rows by ZARC, keep F=1 rows below
    else if (psortState === 'T') {
        const f1Rows = [];
        const f0Rows = [];
        const nullRows = [];
        
        for (let i = 0; i < total; i++) {
            const row = tableData[i];
            if (!row) {
                nullRows.push({ index: i, zarcVal: Infinity, row: null, rowId: rowIds[i], spr: sprValues[i], pr: prValues[i], done: doneValues[i], status: statusValues[i] });
            } else {
                const fVal = row.f ? (parseInt(row.f) || 0) : 0;
                const zarcVal = row.zarc ? (parseInt(row.zarc) || row.zarc) : Infinity;
                const item = { index: i, zarcVal, row, rowId: rowIds[i], spr: sprValues[i], pr: prValues[i], done: doneValues[i], status: statusValues[i] };
                
                if (fVal === 0) {
                    f0Rows.push(item);
                } else {
                    f1Rows.push(item);
                }
            }
        }
        
        // Sort F=0 rows by ZARC
        f0Rows.sort((a, b) => a.zarcVal - b.zarcVal);
        // F=1 rows stay in their current order (or sort by priority if needed)
        f1Rows.sort((a, b) => {
            const aPrior = a.row && a.row.prior ? (parseInt(a.row.prior) || a.row.prior) : Infinity;
            const bPrior = b.row && b.row.prior ? (parseInt(b.row.prior) || b.row.prior) : Infinity;
            if (aPrior === Infinity && bPrior === Infinity) return 0;
            if (aPrior === Infinity) return 1;
            if (bPrior === Infinity) return -1;
            return aPrior - bPrior;
        });
        
        // Combine: F=0 (sorted by ZARC) first, then F=1, then null rows
        combined.push(...f0Rows, ...f1Rows, ...nullRows);
    }
    // If neither F nor T is active, sort all rows by ZARC
    else {
        for (let i = 0; i < total; i++) {
            const row = tableData[i];
            const zarcVal = row && row.zarc ? (parseInt(row.zarc) || row.zarc) : Infinity;
            combined.push({ index: i, zarcVal, row, rowId: rowIds[i], spr: sprValues[i], pr: prValues[i], done: doneValues[i], status: statusValues[i] });
        }
        combined.sort((a, b) => a.zarcVal - b.zarcVal);
    }
    
    for (let i = 0; i < total; i++) {
        const item = combined[i];
        tableData[i] = item.row ? { ...item.row } : null;
        rowIds[i] = item.rowId;
        sprValues[i] = item.spr;
        prValues[i] = item.pr;
        doneValues[i] = item.done;
        statusValues[i] = item.status;
    }
    renumberTableRows();
    isSortedByZarc = true;
    // Keep F/T button states - don't reset them
}

function restoreOriginalOrder() {
    tableData = originalTableData.map(r => r ? { ...r } : null);
    rowIds = [...originalRowIds];
    sprValues = [...originalSprValues];
    prValues = [...originalPrValues];
    doneValues = [...originalDoneValues];
    statusValues = [...originalStatusValues];
    renumberTableRows();
    isSortedByZarc = false;
    psortState = 'none';
    // Remove active states from all buttons
    const sortButton = document.querySelector('.workfront-content .sort-button');
    const fButton = document.querySelector('.workfront-content .f-button');
    const tButton = document.querySelector('.workfront-content .t-button');
    if (sortButton) sortButton.classList.remove('active');
    if (fButton) fButton.classList.remove('active');
    if (tButton) tButton.classList.remove('active');
}

function sortByF() {
    // Sort: F=1 rows first, then F=0 rows. Within each group, sort by priority. Null rows at end.
    const combined = [];
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const row = tableData[i];
        if (!row) {
            // Null/empty rows go to the end
                combined.push({ 
                index: i, 
                fVal: -1, // Use -1 for null rows to put them at end
                priorVal: Infinity, 
                row: null, 
                rowId: rowIds[i], 
                spr: sprValues[i], 
                pr: prValues[i],
                done: doneValues[i],
                status: statusValues[i]
            });
        } else {
            const fVal = row.f ? (parseInt(row.f) || 0) : 0;
            const priorVal = row.prior ? (parseInt(row.prior) || row.prior) : Infinity;
            combined.push({ 
                index: i, 
                fVal, 
                priorVal, 
                row, 
                rowId: rowIds[i], 
                spr: sprValues[i], 
                pr: prValues[i],
                done: doneValues[i],
                status: statusValues[i]
            });
        }
    }
    combined.sort((a, b) => {
        // Null rows (fVal = -1) always go to the end
        if (a.fVal === -1 && b.fVal === -1) return 0;
        if (a.fVal === -1) return 1;
        if (b.fVal === -1) return -1;
        // First sort by F value: 1 first, then 0
        if (a.fVal !== b.fVal) {
            return b.fVal - a.fVal; // 1 comes before 0
        }
        // Within same F group, sort by priority
        if (a.priorVal === Infinity && b.priorVal === Infinity) return 0;
        if (a.priorVal === Infinity) return 1;
        if (b.priorVal === Infinity) return -1;
        return a.priorVal - b.priorVal;
    });
    for (let i = 0; i < total; i++) {
        const item = combined[i];
        tableData[i] = item.row ? { ...item.row } : null;
        rowIds[i] = item.rowId;
        sprValues[i] = item.spr;
        prValues[i] = item.pr;
        doneValues[i] = item.done;
        statusValues[i] = item.status;
    }
    renumberTableRows();
    psortState = 'F';
    isSortedByZarc = false;
}

function sortByT() {
    // Sort: F=0 rows first, then F=1 rows. Within each group, sort by priority. Null rows at end.
    const combined = [];
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const row = tableData[i];
        if (!row) {
            // Null/empty rows go to the end
                combined.push({ 
                index: i, 
                fVal: -1, // Use -1 for null rows to put them at end
                priorVal: Infinity, 
                row: null, 
                rowId: rowIds[i], 
                spr: sprValues[i], 
                pr: prValues[i],
                done: doneValues[i],
                status: statusValues[i]
            });
        } else {
            const fVal = row.f ? (parseInt(row.f) || 0) : 0;
            const priorVal = row.prior ? (parseInt(row.prior) || row.prior) : Infinity;
            combined.push({ 
                index: i, 
                fVal, 
                priorVal, 
                row, 
                rowId: rowIds[i], 
                spr: sprValues[i], 
                pr: prValues[i],
                done: doneValues[i],
                status: statusValues[i]
            });
        }
    }
    combined.sort((a, b) => {
        // Null rows (fVal = -1) always go to the end
        if (a.fVal === -1 && b.fVal === -1) return 0;
        if (a.fVal === -1) return 1;
        if (b.fVal === -1) return -1;
        // First sort by F value: 0 first, then 1
        if (a.fVal !== b.fVal) {
            return a.fVal - b.fVal; // 0 comes before 1
        }
        // Within same F group, sort by priority
        if (a.priorVal === Infinity && b.priorVal === Infinity) return 0;
        if (a.priorVal === Infinity) return 1;
        if (b.priorVal === Infinity) return -1;
        return a.priorVal - b.priorVal;
    });
    for (let i = 0; i < total; i++) {
        const item = combined[i];
        tableData[i] = item.row ? { ...item.row } : null;
        rowIds[i] = item.rowId;
        sprValues[i] = item.spr;
        prValues[i] = item.pr;
        doneValues[i] = item.done;
        statusValues[i] = item.status;
    }
    renumberTableRows();
    psortState = 'T';
    isSortedByZarc = false;
}

function toggleSortByZarc() {
    const sortButton = document.querySelector('.workfront-content .sort-button');
    if (isSortedByZarc) {
        // If F or T is active, restore to F/T sort (without ZARC), otherwise restore original
        if (psortState === 'F') {
            sortByF();
        } else if (psortState === 'T') {
            sortByT();
        } else {
            restoreOriginalOrder();
        }
        if (sortButton) sortButton.classList.remove('active');
    } else {
        sortByZarc();
        if (sortButton) sortButton.classList.add('active');
        // Keep F and T button states - don't remove them
    }
    renderMainTable();
    renderSprColumn();
    renderPrColumn();
}

function toggleSortByF() {
    const fButton = document.querySelector('.workfront-content .f-button');
    const tButton = document.querySelector('.workfront-content .t-button');
    
    // If F is already active, deactivate it and restore original order
    if (psortState === 'F') {
        if (isSortedByZarc) {
            // If ZARC sorted, restore to original order
            restoreOriginalOrder();
        } else {
            // If just F sorted, restore to original
            restoreOriginalOrder();
        }
        if (fButton) fButton.classList.remove('active');
    } else {
        // Activate F sorting
        sortByF();
        if (fButton) fButton.classList.add('active');
        if (tButton) tButton.classList.remove('active');
        // If sort button was active, keep it active but it will now sort F=1 group
        // Reset ZARC sort state so clicking Sort again will sort F=1 by ZARC
        isSortedByZarc = false;
    }
    
    // Remove active state from sort button if it's active (user needs to click Sort again)
    const sortButton = document.querySelector('.workfront-content .sort-button');
    if (sortButton) sortButton.classList.remove('active');
    
    renderMainTable();
    renderSprColumn();
    renderPrColumn();
}

function toggleSortByT() {
    const fButton = document.querySelector('.workfront-content .f-button');
    const tButton = document.querySelector('.workfront-content .t-button');
    
    // If T is already active, deactivate it and restore original order
    if (psortState === 'T') {
        if (isSortedByZarc) {
            // If ZARC sorted, restore to original order
            restoreOriginalOrder();
        } else {
            // If just T sorted, restore to original
            restoreOriginalOrder();
        }
        if (tButton) tButton.classList.remove('active');
    } else {
        // Activate T sorting
        sortByT();
        if (tButton) tButton.classList.add('active');
        if (fButton) fButton.classList.remove('active');
        // If sort button was active, keep it active but it will now sort F=0 group
        // Reset ZARC sort state so clicking Sort again will sort F=0 by ZARC
        isSortedByZarc = false;
    }
    
    // Remove active state from sort button if it's active (user needs to click Sort again)
    const sortButton = document.querySelector('.workfront-content .sort-button');
    if (sortButton) sortButton.classList.remove('active');
    
    renderMainTable();
    renderSprColumn();
    renderPrColumn();
}

// Save PR values to localStorage (temporary, not database)
function savePrValuesToStorage() {
    const prData = {};
    for (let i = 0; i < rowIds.length; i++) {
        if (rowIds[i] && prValues[i]) {
            prData[rowIds[i]] = prValues[i];
        }
    }
    localStorage.setItem(STORAGE_KEY_PR_VALUES, JSON.stringify(prData));
}

// Load PR values from localStorage (temporary storage)
function loadPrValuesFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PR_VALUES);
        if (stored) {
            const prData = JSON.parse(stored);
            // Map PR values back to rows by work_front_id
            for (let i = 0; i < rowIds.length; i++) {
                if (rowIds[i] && prData[rowIds[i]]) {
                    prValues[i] = prData[rowIds[i]];
                } else {
                    prValues[i] = '';
                }
            }
        } else {
            // Initialize empty PR values
            for (let i = 0; i < rowIds.length; i++) {
                prValues[i] = '';
            }
        }
    } catch (e) {
        console.error('Error loading PR values from storage:', e);
        // Initialize empty PR values on error
        for (let i = 0; i < rowIds.length; i++) {
            prValues[i] = '';
        }
    }
}

async function updateSprPr(rowIndex, spr, pr) {
    const id = rowIds[rowIndex];
    if (!id) return;
    try {
        // Only save SPR to database, NOT PR (PR is temporary/localStorage only)
        const response = await fetch(`/api/workfront/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spr }) // Only send spr, not pr
        });
        if (!response.ok) throw new Error('Failed to update');
        
        // Save PR to localStorage (temporary storage)
        prValues[rowIndex] = pr || '';
        savePrValuesToStorage();
    } catch (error) {
        console.error('Error updating spr:', error);
    }
}

function syncSprPrHeights() {
    // Sync SPR and PR cell heights to match main table rows (for proper row alignment)
    if (!mainTableBody || !sprBody || !prBody) return;
    const mainRows = mainTableBody.querySelectorAll('.tr');
    const sprCells = sprBody.querySelectorAll('.spr-cell');
    const prCells = prBody.querySelectorAll('.pr-cell');
    const count = Math.min(mainRows.length, sprCells.length, prCells.length);
    for (let i = 0; i < count; i++) {
        const rowHeight = mainRows[i].offsetHeight;
        sprCells[i].style.height = rowHeight + 'px';
        sprCells[i].style.minHeight = rowHeight + 'px';
        prCells[i].style.height = rowHeight + 'px';
        prCells[i].style.minHeight = rowHeight + 'px';
    }
}

function renderMainTable() {
    renumberTableRows();
    mainTableBody.innerHTML = '';
    const tableTotalRow = document.getElementById('tableTotalRow');
    if (tableTotalRow) tableTotalRow.innerHTML = '';
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const row = tableData[i] || null;
        const tr = document.createElement('div');
        tr.className = 'tr';
        tr.dataset.rowIndex = i;
        tr.innerHTML = `
            <div class="td" style="width: 60px;">${row ? row.sl : ''}</div>
            <div class="td" style="width: 75px;">${row ? row.date : ''}</div>
            <div class="td" style="width: 45px;">${row ? row.mc : ''}</div>
            <div class="td ticket-no-cell" style="width: 80px;">${row ? row.ticket_no : ''}</div>
            <div class="td td-left" style="width: 270px;">${row ? row.company : ''}</div>
            <div class="td" style="width: 26px;">${row ? row.prior : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.s : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.a : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.i : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.d : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.e : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.f : ''}</div>
            <div class="td" style="width: 15px;">${row ? row.p : ''}</div>
            <div class="td td-left" style="width: 85px;">${row ? row.purpose : ''}</div>
            <div class="td td-left" style="width: 295px;">${row ? row.remarks : ''}</div>
            <div class="td" style="width: 45px;">${row ? row.zarc : ''}</div>
            <div class="td td-left" style="width: 110px;">${row ? row.cluster : ''}</div>
            <div class="td td-left" style="width: 110px;">${row ? row.person : ''}</div>
            <div class="td" style="width: 100px;">${row ? row.contact : ''}</div>
            <div class="td" style="width: 50px;">${row ? row.rg : ''}</div>
            <div class="td" style="width: 65px;">${row ? row.logby : ''}</div>
            <div class="td" style="width: 50px; border-right: none;">
                ${row ? `<input type="checkbox" class="done-checkbox" data-row-index="${i}" ${doneValues[i] ? 'checked' : ''}>` : ''}
            </div>
        `;
        mainTableBody.appendChild(tr);
        
        // Add event listener for checkbox
        if (row) {
            const checkbox = tr.querySelector('.done-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', async (e) => {
                    const isChecked = e.target.checked;
                    if (isChecked) {
                        // Show confirmation popup
                        if (confirm('Are you sure you want to mark this as done and transfer to Work Done?')) {
                            // Transfer to work done
                            await transferSingleRowToWorkDone(i);
                        } else {
                            // User cancelled, uncheck the checkbox
                            e.target.checked = false;
                            doneValues[i] = false;
                        }
                    } else {
                        // If unchecking, just update the status
                        doneValues[i] = false;
                        updateDone(i, false);
                    }
                });
            }
        }
    }
    
    // Render total row in separate fixed container (like trip sheet)
    renderTotalRow();
}

function renderTotalRow() {
    const tableTotalRow = document.getElementById('tableTotalRow');
    if (!tableTotalRow) return;
    
    const totals = calculateTotals();
    tableTotalRow.innerHTML = `
        <div class="td" style="width: 60px;">Total</div>
        <div class="td" style="width: 75px;"></div>
        <div class="td" style="width: 45px;"></div>
        <div class="td" style="width: 80px;"></div>
        <div class="td td-left" style="width: 270px;"></div>
        <div class="td" style="width: 26px;"></div>
        <div class="td" style="width: 15px;">${totals.s}</div>
        <div class="td" style="width: 15px;">${totals.a}</div>
        <div class="td" style="width: 15px;">${totals.i}</div>
        <div class="td" style="width: 15px;">${totals.d}</div>
        <div class="td" style="width: 15px;">${totals.e}</div>
        <div class="td" style="width: 15px;">${totals.f}</div>
        <div class="td" style="width: 15px;">${totals.p}</div>
        <div class="td td-left" style="width: 85px;"></div>
        <div class="td td-left" style="width: 295px;"></div>
        <div class="td" style="width: 45px;"></div>
        <div class="td td-left" style="width: 110px;"></div>
        <div class="td td-left" style="width: 110px;"></div>
        <div class="td" style="width: 100px;"></div>
        <div class="td" style="width: 50px;"></div>
        <div class="td" style="width: 65px;"></div>
        <div class="td" style="width: 50px; border-right: none;"></div>
    `;
}

function calculateTotals() {
    let totals = { s: 0, a: 0, i: 0, d: 0, e: 0, f: 0, p: 0 };
    for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i];
        if (row) {
            totals.s += parseInt(row.s) || 0;
            totals.a += parseInt(row.a) || 0;
            totals.i += parseInt(row.i) || 0;
            totals.d += parseInt(row.d) || 0;
            totals.e += parseInt(row.e) || 0;
            totals.f += parseInt(row.f) || 0;
            totals.p += parseInt(row.p) || 0;
        }
    }
    return totals;
}

async function updateDone(rowIndex, done) {
    const id = rowIds[rowIndex];
    if (!id) return;
    try {
        const response = await fetch(`/api/workfront/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: done })
        });
        if (!response.ok) throw new Error('Failed to update');
    } catch (error) {
        console.error('Error updating done status:', error);
    }
}

async function transferSingleRowToWorkDone(rowIndex) {
    const id = rowIds[rowIndex];
    if (!id) return;
    
    try {
        // Transfer to work done
        const response = await fetch('/api/workfront/transfer-to-workdone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ work_front_ids: [id] })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to transfer');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Status is already updated to 'done' in backend during transfer
            // Show success message
            alert('Successfully done! Record transferred to Work Done. Redirecting to Work Done page...');
            
            // Redirect to work done page
            window.location.href = '/workdone';
        } else {
            throw new Error(data.error || 'Transfer failed');
        }
    } catch (error) {
        console.error('Error transferring to work done:', error);
        alert('Error transferring to work done: ' + error.message);
        // Uncheck the checkbox on error
        const checkbox = document.querySelector(`.done-checkbox[data-row-index="${rowIndex}"]`);
        if (checkbox) {
            checkbox.checked = false;
            doneValues[rowIndex] = false;
        }
    }
}

async function updateWorkfrontStatus(workFrontId, status) {
    try {
        const response = await fetch(`/api/workfront/${workFrontId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        if (!response.ok) throw new Error('Failed to update status');
    } catch (error) {
        console.error('Error updating workfront status:', error);
    }
}

function removeRowFromDisplay(rowIndex) {
    // Remove from arrays
    tableData.splice(rowIndex, 1);
    rowIds.splice(rowIndex, 1);
    sprValues.splice(rowIndex, 1);
    prValues.splice(rowIndex, 1);
    doneValues.splice(rowIndex, 1);
    
    // Update total rows
    totalRows = tableData.length;
    renumberTableRows();
    
    // Re-render table
    renderMainTable();
    renderSprColumn();
    renderPrColumn();
}

function renderSprColumn() {
    sprBody.innerHTML = '';
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const cell = document.createElement('div');
        cell.className = 'spr-cell';
        cell.dataset.rowIndex = i;
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'spr-select-wrapper';
        const select = document.createElement('select');
        select.className = 'spr-select';
        select.innerHTML = '<option value="-">-</option><option value="0">0</option><option value="1">1</option>';
        select.value = sprValues[i];
        select.addEventListener('change', (e) => {
            sprValues[i] = e.target.value;
            updateSprPr(i, sprValues[i], prValues[i]);
        });
        const dropdownIcon = document.createElement('img');
        dropdownIcon.src = '/static/images/drop-down-icon.png';
        dropdownIcon.className = 'spr-dropdown-icon';
        dropdownIcon.alt = '';
        selectWrapper.appendChild(select);
        selectWrapper.appendChild(dropdownIcon);
        cell.appendChild(selectWrapper);
        sprBody.appendChild(cell);
    }
}

function renderPrColumn() {
    prBody.innerHTML = '';
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const cell = document.createElement('div');
        cell.className = 'pr-cell';
        cell.dataset.rowIndex = i;
        if (prValues[i]) {
            const box = document.createElement('div');
            box.className = 'pr-box';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'pr-input';
            input.value = prValues[i];
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                    prValues[i] = value;
                    if (value === '') renderPrColumn();
                    updateSprPr(i, sprValues[i], prValues[i]);
                } else e.target.value = prValues[i];
            });
            box.appendChild(input);
            cell.appendChild(box);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'pr-input-empty';
            input.value = '';
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                    prValues[i] = value;
                    if (value) renderPrColumn();
                    updateSprPr(i, sprValues[i], prValues[i]);
                } else e.target.value = '';
            });
            cell.appendChild(input);
        }
        prBody.appendChild(cell);
    }
    // Sync SPR/PR heights to match main table rows
    requestAnimationFrame(() => requestAnimationFrame(syncSprPrHeights));
}

function setupScrolling() {
    if (masterScrollbar) {
        masterScrollbar.addEventListener('scroll', function() {
            const scrollTop = this.scrollTop;
            if (mainTableBody) mainTableBody.scrollTop = scrollTop;
            if (sprBody) sprBody.scrollTop = scrollTop;
            if (prBody) prBody.scrollTop = scrollTop;
        });
    }
    if (tableContainer) {
        tableContainer.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (masterScrollbar) masterScrollbar.scrollTop += e.deltaY;
        }, { passive: false });
    }
    const sprContainer = document.querySelector('.workfront-content .spr-container');
    const prContainer = document.querySelector('.workfront-content .pr-container');
    if (sprContainer) {
        sprContainer.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (masterScrollbar) masterScrollbar.scrollTop += e.deltaY;
        }, { passive: false });
    }
    if (prContainer) {
        prContainer.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (masterScrollbar) masterScrollbar.scrollTop += e.deltaY;
        }, { passive: false });
    }
}

function setupSortButton() {
    const sortButton = document.querySelector('.workfront-content .sort-button');
    if (sortButton) sortButton.addEventListener('click', toggleSortByZarc);
    
    const fButton = document.querySelector('.workfront-content .f-button');
    if (fButton) fButton.addEventListener('click', toggleSortByF);
    
    const tButton = document.querySelector('.workfront-content .t-button');
    if (tButton) tButton.addEventListener('click', toggleSortByT);
    
    const wpmvButton = document.querySelector('.workfront-content .wpmv-button');
    if (wpmvButton) {
        wpmvButton.addEventListener('click', async function() {
            // Get all rows with done checkbox checked
            const doneRowIds = [];
            for (let i = 0; i < doneValues.length; i++) {
                if (doneValues[i]) {
                    doneRowIds.push(rowIds[i]);
                }
            }
            
            if (doneRowIds.length === 0) {
                alert('No rows with "Done" checkbox checked. Please select at least one row to transfer.');
                return;
            }
            
            if (confirm(`Transfer ${doneRowIds.length} done row(s) to Work Done page?`)) {
                try {
                    const response = await fetch('/api/workfront/transfer-to-workdone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ work_front_ids: doneRowIds })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert(`Successfully transferred ${data.count || doneRowIds.length} row(s) to Work Done! Redirecting to Work Done page...`);
                        // Automatically redirect to work done page
                        window.location.href = '/workdone';
                    } else {
                        alert('Error transferring to work done: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error transferring to work done:', error);
                    alert('Error transferring to work done: ' + error.message);
                }
            }
        });
    }
    
    const generateButton = document.querySelector('.workfront-content .generate-button');
    if (generateButton) {
        generateButton.addEventListener('click', async function() {
            // Collect PR values and work_front_ids together (maintain order for sorting)
            const selectedRows = [];
            
            for (let i = 0; i < prValues.length; i++) {
                const prValue = prValues[i];
                const status = statusValues[i] || 'open';
                // Only include rows with valid PR values (non-empty, not '-') AND status is NOT 'done'
                if (prValue && prValue.trim() !== '' && prValue.trim() !== '-' && status !== 'done') {
                    selectedRows.push({
                        pr: parseInt(prValue.trim()) || 0, // Convert to number for sorting
                        pr_str: prValue.trim(),
                        work_front_id: rowIds[i]
                    });
                }
            }
            
            // Sort by PR value (ascending order: 1, 2, 3...)
            selectedRows.sort((a, b) => a.pr - b.pr);
            
            const selectedPrValues = selectedRows.map(r => r.pr_str);
            const selectedWorkFrontIds = selectedRows.map(r => r.work_front_id);
            
            if (selectedPrValues.length === 0) {
                alert('Please enter PR values in at least one row before generating trip sheet.');
                return;
            }
            
            if (confirm(`Generate trip sheet from ${selectedPrValues.length} row(s) with PR values: ${selectedPrValues.join(', ')}?`)) {
                try {
                    // Store selected work_front_ids in localStorage (PR values are temporary, use IDs for filtering)
                    localStorage.setItem('tripsheet_selected_pr_values', JSON.stringify(selectedPrValues));
                    localStorage.setItem('tripsheet_selected_work_front_ids', JSON.stringify(selectedWorkFrontIds));
                    
                    const response = await fetch('/api/tripsheet/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            work_front_ids: selectedWorkFrontIds, // Use work_front_ids for filtering
                            pr_order: selectedPrValues // Send PR values for ordering reference
                        })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Trip sheet generated successfully! ' + (data.message || ''));
                        // Redirect to trip sheet page with work_front_ids and PR order in URL
                        const idParams = selectedWorkFrontIds.map(id => `id=${encodeURIComponent(id)}`).join('&');
                        const prParams = selectedPrValues.map(pr => `pr=${encodeURIComponent(pr)}`).join('&');
                        window.location.href = `/tripsheet?${idParams}&${prParams}`;
                    } else {
                        alert('Error generating trip sheet: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error generating trip sheet:', error);
                    alert('Error generating trip sheet: ' + error.message);
                }
            }
        });
    }
}

async function refreshData() {
    const success = await fetchWorkfrontData();
    if (success) {
        renderMainTable();
        renderSprColumn();
        renderPrColumn();
    }
}

async function refreshWorkfrontData() {
    // Refresh data from server to get updated status
    const success = await fetchWorkfrontData();
    if (success) {
        renderMainTable();
        renderSprColumn();
        renderPrColumn();
    }
}

async function init() {
    mainTableBody = document.getElementById('mainTableBody');
    sprBody = document.getElementById('sprBody');
    prBody = document.getElementById('prBody');
    masterScrollbar = document.getElementById('masterScrollbar');
    tableContainer = document.querySelector('.workfront-content .table-container');
    
    if (!mainTableBody || !sprBody || !prBody) {
        console.error('Required DOM elements not found');
        return;
    }
    
    await fetchWorkfrontData();
    renderMainTable();
    renderSprColumn();
    renderPrColumn();
    setupScrolling();
    setupSortButton();
    
    // Refresh data when page becomes visible (e.g., after navigating from another page)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('Page became visible, refreshing workfront data...');
            refreshData();
        }
    });
    
    // Also refresh on focus (when user switches back to this tab)
    window.addEventListener('focus', function() {
        console.log('Window focused, refreshing workfront data...');
        refreshData();
    });
    
    // Listen for custom refresh event (triggered from call entry page after transfer)
    window.addEventListener('workfrontRefresh', function() {
        console.log('Workfront refresh event received, refreshing data...');
        refreshData();
    });
    
    // Also refresh when navigating to this page (e.g., using browser back/forward)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log('Page loaded from cache, refreshing workfront data...');
            refreshData();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
