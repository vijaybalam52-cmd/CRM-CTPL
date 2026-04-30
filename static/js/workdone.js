// Work Done - Table data loaded from MySQL via API
let tableData = [];
let rowIds = [];
let allTableData = []; // Store all data for filtering
let allRowIds = []; // Store all row IDs for filtering

let totalRows = 0; // Dynamic - will be set based on actual data length
let isSortedByZarc = false;
let psortState = 'none'; // 'none', 'F', or 'T'

let originalTableData = [];
let originalRowIds = [];

// Date filter variables
let dateFilterFrom = null;
let dateFilterTo = null;

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
let masterScrollbar;
let tableContainer;
let sparesList = []; // Store spares data for dropdown

async function fetchSparesData() {
    // Fetch spares list from API for dropdown
    try {
        console.log('Fetching spares data...');
        const response = await fetch('/api/spares');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch spares`);
        }
        const data = await response.json();
        console.log('Spares data received:', data.length, 'items');
        sparesList = data || [];
        return true;
    } catch (error) {
        console.error('Error fetching spares data:', error);
        sparesList = [];
        return false;
    }
}

async function fetchWorkdoneData() {
    try {
        console.log('Fetching workdone data...');
        const response = await fetch('/api/workdone');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch data`);
        }
        const data = await response.json();
        console.log('Workdone data received:', data.length, 'records');
        if (data.length > 0) {
            console.log('First record sample:', data[0]);
            console.log('First record done_date:', data[0].done_date);
        }
        
        // Set total rows based on actual data length (dynamic)
        totalRows = data.length;
        
        allTableData = [];
        allRowIds = [];
        tableData = [];
        rowIds = [];
        
        // Process all records from database (no limit)
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowData = {
                sl: String(i + 1), // Always set sequential SI number (1, 2, 3, 4, 5...)
                date: row.date || '',
                mc: row.mc || '',
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
                done_date: row.done_date || '',
                done_by: row.done_by || '',
                spares: row.spares || ['', '', '', '', '']  // Array of 5 spares
            };
            allTableData.push(rowData);
            allRowIds.push(row.id);
        }
        
        // Apply date filter if set
        applyDateFilter();
        saveOriginalOrder();
        console.log('Workdone data processed successfully');
        return true;
    } catch (error) {
        console.error('Error fetching workdone data:', error);
        alert('Error loading workdone data: ' + error.message);
        totalRows = 0;
        tableData = [];
        rowIds = [];
        saveOriginalOrder();
        return false;
    }
}

function saveOriginalOrder() {
    renumberTableRows();
    originalTableData = tableData.map(r => r ? { ...r } : null);
    originalRowIds = [...rowIds];
}

function parseDate(dateStr) {
    // Parse date string in DD-MMM-YY format (e.g., "15-Jan-24")
    if (!dateStr || dateStr.trim() === '') return null;
    
    const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    try {
        const parts = dateStr.trim().split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1].toLowerCase()];
            let year = parseInt(parts[2]);
            // Convert 2-digit year to 4-digit (assuming 2000-2099)
            if (year < 100) {
                year = 2000 + year;
            }
            return new Date(year, month, day);
        }
    } catch (e) {
        console.error('Error parsing date:', dateStr, e);
    }
    return null;
}

function applyDateFilter() {
    tableData = [];
    rowIds = [];
    
    // If no filter is set, use all data
    if (!dateFilterFrom && !dateFilterTo) {
        tableData = allTableData.map((r) => ({ ...r }));
        rowIds = [...allRowIds];
        totalRows = tableData.length;
        renumberTableRows();
        return;
    }
    
    // Filter data based on done_date column
    for (let i = 0; i < allTableData.length; i++) {
        const row = allTableData[i];
        // Use done_date column instead of date column
        const rowDate = parseDate(row.done_date);
        
        if (!rowDate) {
            // If done_date can't be parsed, skip rows with invalid dates
            continue;
        }
        
        let include = true;
        
        if (dateFilterFrom) {
            const fromDate = new Date(dateFilterFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (rowDate < fromDate) {
                include = false;
            }
        }
        
        if (dateFilterTo && include) {
            const toDate = new Date(dateFilterTo);
            toDate.setHours(23, 59, 59, 999);
            if (rowDate > toDate) {
                include = false;
            }
        }
        
        if (include) {
            tableData.push({ ...row });
            rowIds.push(allRowIds[i]);
        }
    }
    
    totalRows = tableData.length;
    renumberTableRows();
}

function setupDateFilter() {
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const applyButton = document.getElementById('applyDateFilter');
    const clearButton = document.getElementById('clearDateFilter');
    
    if (!fromDateInput || !toDateInput || !applyButton || !clearButton) {
        console.error('Date filter elements not found');
        return;
    }
    
    applyButton.addEventListener('click', () => {
        dateFilterFrom = fromDateInput.value || null;
        dateFilterTo = toDateInput.value || null;
        
        applyDateFilter();
        saveOriginalOrder();
        renderMainTable();
    });
    
    clearButton.addEventListener('click', () => {
        fromDateInput.value = '';
        toDateInput.value = '';
        dateFilterFrom = null;
        dateFilterTo = null;
        
        applyDateFilter();
        saveOriginalOrder();
        renderMainTable();
    });
}

// Export filtered table to Excel with borders
async function exportFaultInvToExcel() {
    try {
        renumberTableRows();
        // Create a new workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fault Inventory');
        
        // Define border style (thin black borders)
        const borderStyle = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        
        // Add headers matching the table columns
        const headers = [
            'SI.',
            'Date',
            'M/C',
            'Customer Name',
            'Prior',
            'S',
            'A',
            'I',
            'D',
            'E',
            'F',
            'P',
            'Purpose',
            'Remarks',
            'ZARC',
            'Cluster',
            'Person',
            'Contact',
            'Rg',
            'Done Date',
            'Done By',
            'Spare 1',
            'Spare 2',
            'Spare 3',
            'Spare 4',
            'Spare 5'
        ];
        
        // Add header row
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = borderStyle;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF006DB8' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        headerRow.height = 20;
        
        // Add data rows from filtered tableData
        // tableData already contains only the filtered/visible rows
        tableData.forEach((row, index) => {
            if (!row) return; // Skip null rows
            
            // Get done_by value from DOM if available (since it's an input field)
            let doneByValue = row.done_by || '';
            const rowElement = mainTableBody.querySelector(`.tr[data-row-index="${index}"]`);
            if (rowElement) {
                const doneByInput = rowElement.querySelector('.done-by-input');
                if (doneByInput) {
                    doneByValue = doneByInput.value || doneByValue;
                }
            }
            
            // Get spares values from DOM if available (since they're dropdowns)
            const sparesArray = row.spares ? [...row.spares] : ['', '', '', '', ''];
            if (rowElement) {
                const sparesSelects = rowElement.querySelectorAll('.spares-select');
                sparesSelects.forEach((select, idx) => {
                    if (select && select.value) {
                        sparesArray[idx] = select.value;
                    }
                });
            }
            
            const dataRow = [
                row.sl || '',
                row.date || '',
                row.mc || '',
                row.company || '',
                row.prior || '',
                row.s || '0',
                row.a || '0',
                row.i || '0',
                row.d || '0',
                row.e || '0',
                row.f || '0',
                row.p || '0',
                row.purpose || '',
                row.remarks || '',
                row.zarc || '',
                row.cluster || '',
                row.person || '',
                row.contact || '',
                row.rg || '',
                row.done_date || '',
                doneByValue,
                sparesArray[0] || '',
                sparesArray[1] || '',
                sparesArray[2] || '',
                sparesArray[3] || '',
                sparesArray[4] || ''
            ];
            
            const excelRow = worksheet.addRow(dataRow);
            excelRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = borderStyle;
                cell.alignment = { vertical: 'middle' };
            });
        });
        
        // Set column widths
        worksheet.columns = [
            { width: 8 },   // SI.
            { width: 12 },  // Date
            { width: 10 },  // M/C
            { width: 30 },  // Customer Name
            { width: 8 },   // Prior
            { width: 6 },   // S
            { width: 6 },   // A
            { width: 6 },   // I
            { width: 6 },   // D
            { width: 6 },   // E
            { width: 6 },   // F
            { width: 6 },   // P
            { width: 15 },  // Purpose
            { width: 40 },  // Remarks
            { width: 10 },  // ZARC
            { width: 15 },  // Cluster
            { width: 20 },  // Person
            { width: 15 },  // Contact
            { width: 10 },  // Rg
            { width: 15 },  // Done Date
            { width: 15 },  // Done By
            { width: 20 },  // Spare 1
            { width: 20 },  // Spare 2
            { width: 20 },  // Spare 3
            { width: 20 },  // Spare 4
            { width: 20 }   // Spare 5
        ];
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `Fault_Inventory_${dateStr}.xlsx`;
        
        // Write file using ExcelJS
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        
        console.log('Fault Inventory exported to Excel successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

function setupFaultInvButton() {
    const btn = document.getElementById('faultInvBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        // Export filtered table data to Excel
        if (tableData.length === 0) {
            alert('No data to export. Please ensure the table has data.');
            return;
        }
        exportFaultInvToExcel();
    });
}

// Export total spares (counts) from the currently filtered dataset to Excel
async function exportTotalSparesToExcel() {
    try {
        if (!tableData || tableData.length === 0) {
            alert('No data to export. Please ensure the table has data.');
            return;
        }
        // Build initial counts map including all spares from sparesList (from API)
        const counts = {};
        // Ensure sparesList is available; if not, fetch synchronously
        if (!sparesList || !Array.isArray(sparesList) || sparesList.length === 0) {
            await fetchSparesData();
        }

        // Initialize counts to 0 for every spare name from sparesList (use name field)
        sparesList.forEach(s => {
            const name = (s && (s.name || s.sp_name || s.spare_name)) ? String(s.name || s.sp_name || s.spare_name).trim() : '';
            if (name) counts[name] = 0;
        });

        // Count occurrences from currently filtered tableData
        for (let i = 0; i < tableData.length; i++) {
            const row = tableData[i];
            if (!row) continue;

            // Prefer DOM values (current selections), fallback to row.spares
            let sparesArray = row.spares ? [...row.spares] : [];
            const rowElement = mainTableBody ? mainTableBody.querySelector(`.tr[data-row-index="${i}"]`) : null;
            if (rowElement) {
                const sparesSelects = rowElement.querySelectorAll('.spares-select');
                if (sparesSelects && sparesSelects.length) {
                    sparesArray = Array.from(sparesSelects).map(s => s.value || '');
                }
            }

            sparesArray.forEach(s => {
                if (!s) return;
                const name = String(s).trim();
                if (!name) return;
                if (counts.hasOwnProperty(name)) counts[name] += 1;
                else counts[name] = (counts[name] || 0) + 1; // include any ad-hoc names
            });
        }

        // Build items array preserving the order from sparesList first, then any extras
        const items = [];
        const seen = new Set();
        if (sparesList && sparesList.length) {
            sparesList.forEach(s => {
                const name = (s && (s.name || s.sp_name || s.spare_name)) ? String(s.name || s.sp_name || s.spare_name).trim() : '';
                if (!name) return;
                items.push({ name, count: counts[name] || 0 });
                seen.add(name);
            });
        }
        // Add any names that appeared in counts but were not in sparesList
        Object.keys(counts).forEach(name => {
            if (!seen.has(name)) {
                items.push({ name, count: counts[name] });
                seen.add(name);
            }
        });

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Total Spares');

        // Border style
        const borderStyle = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };

        // Header row with S.No, Spare Name, No. of Spares
        const header = worksheet.addRow(['S.No', 'Spare Name', 'No. of Spares']);
        header.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006db8' } };
            cell.border = borderStyle;
        });
        header.height = 18;

        // Data rows with serial number starting at 1
        let totalSum = 0;
        for (let idx = 0; idx < items.length; idx++) {
            const it = items[idx];
            totalSum += Number(it.count || 0);
            const row = worksheet.addRow([idx + 1, it.name, it.count]);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', wrapText: false };
                cell.border = borderStyle;
            });
        }

        // If no items (edge case), still add one placeholder row and set total accordingly
        if (items.length === 0) {
            const r = worksheet.addRow([1, '-- No spares found --', 0]);
            r.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle' };
                cell.border = borderStyle;
            });
            totalSum = 0;
        }

        
        

        // Total row: S.No empty, Spare Name = TOTAL, No. of Spares = sum
        const totalRow = worksheet.addRow(['', 'TOTAL', totalSum]);
        totalRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFb85900' } }; // red background
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = borderStyle;
        });

        // Column widths
        worksheet.columns = [ { width: 8 }, { width: 60 }, { width: 18 } ];

        // Filename with optional date range
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let filename = `Total_Spares_${dateStr}.xlsx`;
        if (dateFilterFrom || dateFilterTo) {
            const from = dateFilterFrom || 'all';
            const to = dateFilterTo || 'all';
            filename = `Total_Spares_${from}_to_${to}.xlsx`;
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('Total Spares exported to Excel successfully');
    } catch (error) {
        console.error('Error exporting total spares:', error);
        alert('Error exporting Total Spares. Please try again.');
    }
}

function setupTotalSparesButton() {
    const btn = document.getElementById('totalSparesBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (tableData.length === 0) {
            alert('No data to export. Please ensure the table has data.');
            return;
        }
        exportTotalSparesToExcel();
    });
}

function sortByZarc() {
    const combined = [];
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const row = tableData[i];
        const zarcVal = row && row.zarc ? (parseInt(row.zarc) || row.zarc) : Infinity;
        combined.push({ index: i, zarcVal, row, rowId: rowIds[i] });
    }
    combined.sort((a, b) => a.zarcVal - b.zarcVal);
    for (let i = 0; i < total; i++) {
        const item = combined[i];
        tableData[i] = item.row ? { ...item.row } : null;
        rowIds[i] = item.rowId;
    }
    renumberTableRows();
    isSortedByZarc = true;
    psortState = 'none';
    // Reset psort button text
    const psortButton = document.querySelector('.workdone-content .psort-button');
    if (psortButton) {
        psortButton.classList.remove('active');
        const span = psortButton.querySelector('span');
        if (span) span.textContent = 'P/sort';
    }
}

function restoreOriginalOrder() {
    tableData = originalTableData.map(r => r ? { ...r } : null);
    rowIds = [...originalRowIds];
    renumberTableRows();
    isSortedByZarc = false;
    psortState = 'none';
    // Remove active states from both buttons
    const sortButton = document.querySelector('.workdone-content .sort-button');
    const psortButton = document.querySelector('.workdone-content .psort-button');
    if (sortButton) sortButton.classList.remove('active');
    if (psortButton) {
        psortButton.classList.remove('active');
        const span = psortButton.querySelector('span');
        if (span) span.textContent = 'P/sort';
    }
}

function sortByF() {
    // Sort: F=1 rows first, then F=0 rows. Within each group, sort by priority. Null rows at end.
    const combined = [];
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const row = tableData[i];
        if (!row) {
            combined.push({ 
                index: i, 
                fVal: -1,
                priorVal: Infinity, 
                row: null, 
                rowId: rowIds[i]
            });
        } else {
            const fVal = row.f ? (parseInt(row.f) || 0) : 0;
            const priorVal = row.prior ? (parseInt(row.prior) || row.prior) : Infinity;
            combined.push({ 
                index: i, 
                fVal, 
                priorVal, 
                row, 
                rowId: rowIds[i]
            });
        }
    }
    combined.sort((a, b) => {
        if (a.fVal === -1 && b.fVal === -1) return 0;
        if (a.fVal === -1) return 1;
        if (b.fVal === -1) return -1;
        if (a.fVal !== b.fVal) {
            return b.fVal - a.fVal;
        }
        if (a.priorVal === Infinity && b.priorVal === Infinity) return 0;
        if (a.priorVal === Infinity) return 1;
        if (b.priorVal === Infinity) return -1;
        return a.priorVal - b.priorVal;
    });
    for (let i = 0; i < total; i++) {
        const item = combined[i];
        tableData[i] = item.row ? { ...item.row } : null;
        rowIds[i] = item.rowId;
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
            combined.push({ 
                index: i, 
                fVal: -1,
                priorVal: Infinity, 
                row: null, 
                rowId: rowIds[i]
            });
        } else {
            const fVal = row.f ? (parseInt(row.f) || 0) : 0;
            const priorVal = row.prior ? (parseInt(row.prior) || row.prior) : Infinity;
            combined.push({ 
                index: i, 
                fVal, 
                priorVal, 
                row, 
                rowId: rowIds[i]
            });
        }
    }
    combined.sort((a, b) => {
        if (a.fVal === -1 && b.fVal === -1) return 0;
        if (a.fVal === -1) return 1;
        if (b.fVal === -1) return -1;
        if (a.fVal !== b.fVal) {
            return a.fVal - b.fVal;
        }
        if (a.priorVal === Infinity && b.priorVal === Infinity) return 0;
        if (a.priorVal === Infinity) return 1;
        if (b.priorVal === Infinity) return -1;
        return a.priorVal - b.priorVal;
    });
    for (let i = 0; i < total; i++) {
        const item = combined[i];
        tableData[i] = item.row ? { ...item.row } : null;
        rowIds[i] = item.rowId;
    }
    renumberTableRows();
    psortState = 'T';
    isSortedByZarc = false;
}

function toggleSortByZarc() {
    const sortButton = document.querySelector('.workdone-content .sort-button');
    if (isSortedByZarc) {
        restoreOriginalOrder();
        if (sortButton) sortButton.classList.remove('active');
    } else {
        sortByZarc();
        if (sortButton) sortButton.classList.add('active');
        const psortButton = document.querySelector('.workdone-content .psort-button');
        if (psortButton) psortButton.classList.remove('active');
    }
    renderMainTable();
}

function toggleSortByPrior() {
    const psortButton = document.querySelector('.workdone-content .psort-button');
    const span = psortButton ? psortButton.querySelector('span') : null;
    
    if (psortState === 'none') {
        sortByF();
        if (psortButton) {
            psortButton.classList.add('active');
            if (span) span.textContent = 'F';
        }
        const sortButton = document.querySelector('.workdone-content .sort-button');
        if (sortButton) sortButton.classList.remove('active');
    } else if (psortState === 'F') {
        sortByT();
        if (span) span.textContent = 'T';
    } else if (psortState === 'T') {
        restoreOriginalOrder();
        if (psortButton) {
            psortButton.classList.remove('active');
            if (span) span.textContent = 'P/sort';
        }
    }
    
    renderMainTable();
}

async function updateWorkdone(rowIndex, fieldName, value) {
    const id = rowIds[rowIndex];
    if (!id) return;
    try {
        const response = await fetch(`/api/workdone/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [fieldName]: value })
        });
        if (!response.ok) throw new Error('Failed to update');
    } catch (error) {
        console.error('Error updating workdone:', error);
    }
}

async function updateWorkdoneSpares(rowIndex, sparesArray) {
    const id = rowIds[rowIndex];
    if (!id) return;
    try {
        const response = await fetch(`/api/workdone/${id}/spares`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spares: sparesArray })
        });
        if (!response.ok) throw new Error('Failed to update spares');
    } catch (error) {
        console.error('Error updating workdone spares:', error);
    }
}

function formatDateInput(input) {
    // Format date input to DD-MMM-YY format
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '-' + value.substring(2);
    }
    if (value.length >= 6) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = parseInt(value.substring(3, 5));
        if (month >= 1 && month <= 12) {
            value = value.substring(0, 3) + monthNames[month - 1] + '-' + value.substring(5);
        }
    }
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    input.value = value;
}

function updateScrollbarHeight() {
    const scrollbarContent = document.querySelector('.workdone-content .scrollbar-content');
    if (scrollbarContent && mainTableBody) {
        // Set scrollbar content height to match table body height
        const totalRows = getTotalRows();
        const rowHeight = 38; // Approximate row height
        const totalHeight = totalRows * rowHeight;
        scrollbarContent.style.height = Math.max(totalHeight, 950) + 'px';
    }
}

function renderMainTable() {
    renumberTableRows();
    mainTableBody.innerHTML = '';
    const total = getTotalRows();
    for (let i = 0; i < total; i++) {
        const row = tableData[i] || null;
        const tr = document.createElement('div');
        tr.className = 'tr';
        tr.dataset.rowIndex = i;
        
        // Done Date - read-only (display only)
        const doneDateDisplay = row && row.done_date ? row.done_date : '';
        
        // Done By input - editable
        const doneByInput = row ? `<input type="text" class="done-by-input" value="${row.done_by || ''}" placeholder="" style="width: 100%; border: 1px solid #ccc; padding: 2px; text-align: center; box-sizing: border-box;" data-row-index="${i}">` : '';
        
        // Spares dropdowns - 5 columns, editable
        const sparesArray = row ? (row.spares || ['', '', '', '', '']) : ['', '', '', '', ''];
        // Ensure we have exactly 5 spares
        while (sparesArray.length < 5) {
            sparesArray.push('');
        }
        
        const buildSpareDropdown = (spareIdx, currentValue) => {
            let options = '<option value="">Select</option>';
            sparesList.forEach(spare => {
                const spareName = spare.name || String(spare.id || '');
                const spareId = String(spare.id || '');
                const currentSpareValue = (currentValue || '').toString().trim();
                // Match by name (since we store the name in spares table)
                const selected = (currentSpareValue === spareName || currentSpareValue.toLowerCase() === spareName.toLowerCase()) ? 'selected' : '';
                // Store spare name as value (not ID) since spares table stores the name
                options += `<option value="${spareName}" data-spare-id="${spareId}" ${selected}>${spareName}</option>`;
            });
            return `<select class="spares-select" data-row-index="${i}" data-spare-index="${spareIdx}" style="width: 100%; border: 1px solid #ccc; padding: 2px; text-align: center; box-sizing: border-box; font-family: Calibri, sans-serif; font-weight: bold; font-size: 14px;">${options}</select>`;
        };
        
        tr.innerHTML = `
            <div class="td" style="width: 70px;">${row ? row.sl : ''}</div>
            <div class="td" style="width: 90px;">${row ? row.date : ''}</div>
            <div class="td" style="width: 60px;">${row ? row.mc : ''}</div>
            <div class="td td-left" style="width: 350px;">${row ? row.company : ''}</div>
            <div class="td" style="width: 28px;">${row ? row.prior : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.s : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.a : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.i : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.d : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.e : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.f : ''}</div>
            <div class="td" style="width: 25px;">${row ? row.p : ''}</div>
            <div class="td td-left" style="width: 120px;">${row ? row.purpose : ''}</div>
            <div class="td td-left" style="width: 430px;">${row ? row.remarks : ''}</div>
            <div class="td" style="width: 60px;">${row ? row.zarc : ''}</div>
            <div class="td td-left" style="width: 125px;">${row ? row.cluster : ''}</div>
            <div class="td td-left" style="width: 190px;">${row ? row.person : ''}</div>
            <div class="td" style="width: 140px;">${row ? row.contact : ''}</div>
            <div class="td" style="width: 70px;">${row ? row.rg : ''}</div>
            <div class="td" style="width: 130px;">
                ${doneDateDisplay}
            </div>
            <div class="td" style="width: 150px;">
                ${doneByInput}
            </div>
            <div class="td" style="width: 200px;">
                ${buildSpareDropdown(0, sparesArray[0])}
            </div>
            <div class="td" style="width: 200px;">
                ${buildSpareDropdown(1, sparesArray[1])}
            </div>
            <div class="td" style="width: 200px;">
                ${buildSpareDropdown(2, sparesArray[2])}
            </div>
            <div class="td" style="width: 200px;">
                ${buildSpareDropdown(3, sparesArray[3])}
            </div>
            <div class="td" style="width: 200px; border-right: none;">
                ${buildSpareDropdown(4, sparesArray[4])}
            </div>
        `;
        mainTableBody.appendChild(tr);
        
        // Add event listeners for editable inputs (Done By and Spares)
        if (row) {
            const doneByInputEl = tr.querySelector('.done-by-input');
            
            if (doneByInputEl) {
                doneByInputEl.addEventListener('change', (e) => {
                    tableData[i].done_by = e.target.value;
                    updateWorkdone(i, 'done_by', e.target.value);
                });
            }
            
            // Add event listeners for all 5 spares dropdowns
            const sparesSelects = tr.querySelectorAll('.spares-select');
            sparesSelects.forEach((selectEl) => {
                selectEl.addEventListener('change', async (e) => {
                    const rowIndex = parseInt(e.target.dataset.rowIndex);
                    const spareIndex = parseInt(e.target.dataset.spareIndex);
                    // Get the spare name (value) - this is what we store in spares table
                    const spareName = e.target.value || '';
                    
                    // Update local data
                    if (!tableData[rowIndex].spares) {
                        tableData[rowIndex].spares = ['', '', '', '', ''];
                    }
                    tableData[rowIndex].spares[spareIndex] = spareName;
                    
                    // Update database - store spare name in spares table
                    await updateWorkdoneSpares(rowIndex, tableData[rowIndex].spares);
                });
            });
        }
    }
    // Update scrollbar height after rendering
    updateScrollbarHeight();
    
    // Force scrollbar visibility check after rendering
    setTimeout(() => {
        const bodyWrapper = document.querySelector('.workdone-content .table-body-wrapper');
        if (bodyWrapper) {
            // Force scrollbar to appear if content overflows
            const hasVerticalScroll = bodyWrapper.scrollHeight > bodyWrapper.clientHeight;
            const hasHorizontalScroll = bodyWrapper.scrollWidth > bodyWrapper.clientWidth;
            console.log('After render - Vertical scroll needed:', hasVerticalScroll);
            console.log('After render - Horizontal scroll needed:', hasHorizontalScroll);
            console.log('Body scrollHeight:', bodyWrapper.scrollHeight, 'clientHeight:', bodyWrapper.clientHeight);
            
            // If scrollbar should be visible but isn't, force it
            if (hasVerticalScroll) {
                bodyWrapper.style.overflowY = 'scroll';
            }
            if (hasHorizontalScroll) {
                bodyWrapper.style.overflowX = 'scroll';
            }
        }
    }, 100);
}

function setupScrolling() {
    const headerWrapper = document.querySelector('.workdone-content .table-header-wrapper');
    const bodyWrapper = document.querySelector('.workdone-content .table-body-wrapper');
    
    console.log('Setting up scrolling...');
    console.log('Header wrapper:', headerWrapper);
    console.log('Body wrapper:', bodyWrapper);
    console.log('Master scrollbar:', masterScrollbar);
    
    // Ensure bodyWrapper has proper height constraint
    if (bodyWrapper) {
        // Force recalculation of height
        const computedStyle = window.getComputedStyle(bodyWrapper);
        console.log('Body wrapper height:', computedStyle.height);
        console.log('Body wrapper max-height:', computedStyle.maxHeight);
        
        // Log scrollbar dimensions after a short delay to ensure content is rendered
        setTimeout(() => {
            if (bodyWrapper) {
                console.log('Body scrollHeight:', bodyWrapper.scrollHeight, 'clientHeight:', bodyWrapper.clientHeight);
                console.log('Body scrollWidth:', bodyWrapper.scrollWidth, 'clientWidth:', bodyWrapper.clientWidth);
                console.log('Should show vertical scrollbar:', bodyWrapper.scrollHeight > bodyWrapper.clientHeight);
                console.log('Should show horizontal scrollbar:', bodyWrapper.scrollWidth > bodyWrapper.clientWidth);
            }
        }, 500);
    }
    
    // Sync horizontal scrolling between header and body
    // Body scrollbar controls both - header follows body
    if (headerWrapper && bodyWrapper) {
        console.log('Syncing horizontal scrollbars');
        // When body scrolls horizontally, sync header to match
        bodyWrapper.addEventListener('scroll', function() {
            headerWrapper.scrollLeft = this.scrollLeft;
        });
        // Prevent header from being scrolled directly (only via body)
        headerWrapper.addEventListener('scroll', function(e) {
            // If header is scrolled directly, sync back to body
            bodyWrapper.scrollLeft = this.scrollLeft;
        });
        // Disable wheel events on header to prevent direct scrolling
        headerWrapper.addEventListener('wheel', function(e) {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                // Forward horizontal scroll to body
                bodyWrapper.scrollLeft += e.deltaX;
            }
        }, { passive: false });
    }
    
    // Sync vertical scrolling between masterScrollbar and bodyWrapper
    if (masterScrollbar && bodyWrapper) {
        console.log('Syncing vertical scrollbars');
        // When masterScrollbar scrolls, update bodyWrapper
        masterScrollbar.addEventListener('scroll', function() {
            bodyWrapper.scrollTop = this.scrollTop;
        });
        
        // When bodyWrapper scrolls vertically, update masterScrollbar
        bodyWrapper.addEventListener('scroll', function() {
            masterScrollbar.scrollTop = this.scrollTop;
        });
    }
    
    // Wheel event handling for vertical scrolling
    if (tableContainer && bodyWrapper) {
        tableContainer.addEventListener('wheel', function(e) {
            e.preventDefault();
            // Scroll vertically in bodyWrapper
            bodyWrapper.scrollTop += e.deltaY;
            // Also update masterScrollbar if it exists
            if (masterScrollbar) {
                masterScrollbar.scrollTop = bodyWrapper.scrollTop;
            }
        }, { passive: false });
    }
}

function setupSortButton() {
    const sortButton = document.querySelector('.workdone-content .sort-button');
    if (sortButton) sortButton.addEventListener('click', toggleSortByZarc);
    
    const psortButton = document.querySelector('.workdone-content .psort-button');
    if (psortButton) psortButton.addEventListener('click', toggleSortByPrior);
}

async function refreshData() {
    const success = await fetchWorkdoneData();
    if (success) {
        renderMainTable();
    }
}

async function init() {
    mainTableBody = document.getElementById('mainTableBody');
    masterScrollbar = document.getElementById('masterScrollbar');
    tableContainer = document.querySelector('.workdone-content .table-container');
    
    if (!mainTableBody) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Fetch spares data first, then workdone data
    await fetchSparesData();
    await fetchWorkdoneData();
    renderMainTable();
    setupScrolling();
    setupDateFilter();
    setupFaultInvButton();
    setupTotalSparesButton();
    
    // Refresh data when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('Page became visible, refreshing workdone data...');
            refreshData();
        }
    });
    
    window.addEventListener('focus', function() {
        console.log('Window focused, refreshing workdone data...');
        refreshData();
    });
    
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log('Page loaded from cache, refreshing workdone data...');
            refreshData();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
