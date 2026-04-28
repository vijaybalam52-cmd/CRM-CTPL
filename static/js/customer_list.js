const customerListColumns = [
    { key: 'sl', width: 70, align: 'center' },
    { key: 'customer_name', width: 280, align: 'left' },
    { key: 'mc_no', width: 110, align: 'center' },
    { key: 'status', width: 130, align: 'center' },
    { key: 'gstin', width: 160, align: 'left' },
    { key: 'invoice_date', width: 130, align: 'center' },
    { key: 'invoice_value', width: 130, align: 'right' },
    { key: 'invoice_no', width: 140, align: 'center' },
    { key: 'start_date', width: 130, align: 'center' },
    { key: 'end_date', width: 130, align: 'center' },
    { key: 'contact_person', width: 220, align: 'left' },
    { key: 'designation', width: 180, align: 'left' },
    { key: 'contact_number', width: 160, align: 'center' },
    { key: 'address1', width: 220, align: 'left' },
    { key: 'address2', width: 220, align: 'left' },
    { key: 'address3', width: 220, align: 'left' },
    { key: 'city', width: 150, align: 'left' },
    { key: 'pin', width: 110, align: 'center' },
    { key: 'state', width: 140, align: 'left' },
    { key: 'country', width: 150, align: 'left' },
    { key: 'rg', width: 90, align: 'center' },
    { key: 'cluster', width: 160, align: 'left' },
    { key: 'security', width: 170, align: 'left' },
    { key: 'weekly_off_start', width: 160, align: 'center' },
    { key: 'weekly_off_end', width: 160, align: 'center' },
    { key: 'working_hours_start', width: 170, align: 'center' },
    { key: 'working_hours_end', width: 170, align: 'center' },
    { key: 'zone', width: 90, align: 'center' },
    { key: 'area', width: 90, align: 'center' },
    { key: 'route', width: 90, align: 'center' },
    { key: 'cluster_code', width: 110, align: 'center' }
];

let customerListRows = [];
let allCustomerListRows = [];

function updateCustomerListStatus(message, isError = false) {
    const statusEl = document.getElementById('customerListStatus');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#c62828' : '#50697f';
}

function updateCustomerListCount() {
    updateCustomerListStatus(`${customerListRows.length} row(s) shown.`);
}

function renderCustomerList() {
    const body = document.getElementById('customerListBody');
    if (!body) return;

    if (!customerListRows.length) {
        body.innerHTML = '<div class="customer-list-empty">No customer rows found.</div>';
        updateCustomerListCount();
        return;
    }

    body.innerHTML = customerListRows.map((row) => {
        const cells = customerListColumns.map((column, index) => {
            const classes = ['td'];
            if (column.align === 'left') {
                classes.push('td-left');
            }
            const borderRight = index === customerListColumns.length - 1 ? 'none' : '';
            return `
                <div class="${classes.join(' ')}" style="width: ${column.width}px; ${borderRight ? `border-right: ${borderRight};` : ''}">
                    ${row[column.key] || ''}
                </div>
            `;
        }).join('');

        return `<div class="customer-list-row">${cells}</div>`;
    }).join('');

    updateCustomerListCount();
}

async function fetchCustomerList() {
    updateCustomerListStatus('Loading customer list...');
    try {
        const response = await fetch('/api/customer-list');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch customer list`);
        }

        const data = await response.json();
        allCustomerListRows = Array.isArray(data) ? data : [];
        applyCustomerListFilter();
        updateCustomerListStatus(`Loaded ${customerListRows.length} customer row(s).`);
    } catch (error) {
        console.error('Error fetching customer list:', error);
        allCustomerListRows = [];
        customerListRows = [];
        renderCustomerList();
        updateCustomerListStatus(`Error loading customer list: ${error.message}`, true);
    }
}

function applyCustomerListFilter() {
    const fromInput = document.getElementById('customerListFromSl');
    const toInput = document.getElementById('customerListToSl');
    const fromValue = fromInput ? parseInt(fromInput.value, 10) : NaN;
    const toValue = toInput ? parseInt(toInput.value, 10) : NaN;

    customerListRows = allCustomerListRows.filter((row) => {
        const sl = parseInt(row.sl, 10);
        if (!Number.isNaN(fromValue) && sl < fromValue) return false;
        if (!Number.isNaN(toValue) && sl > toValue) return false;
        return true;
    });

    renderCustomerList();
}

function clearCustomerListFilter() {
    const fromInput = document.getElementById('customerListFromSl');
    const toInput = document.getElementById('customerListToSl');
    if (fromInput) fromInput.value = '';
    if (toInput) toInput.value = '';
    customerListRows = [...allCustomerListRows];
    renderCustomerList();
}

async function exportCustomerListToExcel() {
    if (!customerListRows.length) {
        updateCustomerListStatus('No rows available to export.', true);
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customer List');
        const headers = [
            'SI.',
            'Customer Name',
            'MC No',
            'Status',
            'GSTIN',
            'Invoice Date',
            'Invoice Value',
            'Invoice No',
            'Start Date',
            'End Date',
            'Contact Person',
            'Designation',
            'Contact Number',
            'Address 1',
            'Address 2',
            'Address 3',
            'City',
            'PIN',
            'State',
            'Country',
            'RG',
            'Cluster',
            'Security',
            'Weekly Off Start',
            'Weekly Off End',
            'Working Hours Start',
            'Working Hours End',
            'Zone (Z)',
            'Area (A)',
            'Route (R)',
            'Cluster (C)'
        ];

        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006DB8' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                bottom: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                left: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                right: { style: 'thin', color: { argb: 'FFB9B9B9' } }
            };
        });

        customerListRows.forEach((row) => {
            const excelRow = worksheet.addRow([
                row.sl || '',
                row.customer_name || '',
                row.mc_no || '',
                row.status || '',
                row.gstin || '',
                row.invoice_date || '',
                row.invoice_value || '',
                row.invoice_no || '',
                row.start_date || '',
                row.end_date || '',
                row.contact_person || '',
                row.designation || '',
                row.contact_number || '',
                row.address1 || '',
                row.address2 || '',
                row.address3 || '',
                row.city || '',
                row.pin || '',
                row.state || '',
                row.country || '',
                row.rg || '',
                row.cluster || '',
                row.security || '',
                row.weekly_off_start || '',
                row.weekly_off_end || '',
                row.working_hours_start || '',
                row.working_hours_end || '',
                row.zone || '',
                row.area || '',
                row.route || '',
                row.cluster_code || ''
            ]);

            excelRow.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                    bottom: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                    left: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                    right: { style: 'thin', color: { argb: 'FFB9B9B9' } }
                };
                cell.alignment = { vertical: 'middle' };
            });
        });

        worksheet.columns = customerListColumns.map((column, index) => ({
            width: index === 1 ? 30 : index >= 13 && index <= 15 ? 24 : Math.max(12, Math.round(column.width / 9))
        }));

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob(
            [buffer],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Customer_List.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        updateCustomerListStatus(`Exported ${customerListRows.length} row(s) to Excel.`);
    } catch (error) {
        console.error('Error exporting customer list:', error);
        updateCustomerListStatus(`Export failed: ${error.message}`, true);
    }
}

async function exportCustomerListCompactToExcel() {
    if (!customerListRows.length) {
        updateCustomerListStatus('No rows available to export.', true);
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customer List Print2');
        const exportColumns = [
            { header: 'S.No', key: 'sl', width: 10 },
            { header: 'Customer Name', key: 'customer_name', width: 30 },
            { header: 'M/C', key: 'mc_no', width: 18 },
            { header: 'Model', key: 'model', width: 22 },
            { header: 'Address 1', key: 'address1', width: 24 },
            { header: 'Address 2', key: 'address2', width: 24 },
            { header: 'Address 3', key: 'address3', width: 24 },
            { header: 'City', key: 'city', width: 18 },
            { header: 'PIN', key: 'pin', width: 12 },
            { header: 'State', key: 'state', width: 18 },
            { header: 'Country', key: 'country', width: 18 },
            { header: 'RG', key: 'rg', width: 12 },
            { header: 'Cluster', key: 'cluster', width: 18 },
            { header: 'Zone', key: 'zone', width: 12 },
            { header: 'Area', key: 'area', width: 12 },
            { header: 'Route', key: 'route', width: 12 },
            { header: 'Cluster Code', key: 'cluster_code', width: 16 }
        ];

        worksheet.columns = exportColumns;

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006DB8' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                bottom: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                left: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                right: { style: 'thin', color: { argb: 'FFB9B9B9' } }
            };
        });

        customerListRows.forEach((row) => {
            const excelRow = worksheet.addRow({
                sl: row.sl || '',
                customer_name: row.customer_name || '',
                mc_no: row.mc_no || '',
                model: row.model || '',
                address1: row.address1 || '',
                address2: row.address2 || '',
                address3: row.address3 || '',
                city: row.city || '',
                pin: row.pin || '',
                state: row.state || '',
                country: row.country || '',
                rg: row.rg || '',
                cluster: row.cluster || '',
                zone: row.zone || '',
                area: row.area || '',
                route: row.route || '',
                cluster_code: row.cluster_code || ''
            });

            excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                    bottom: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                    left: { style: 'thin', color: { argb: 'FFB9B9B9' } },
                    right: { style: 'thin', color: { argb: 'FFB9B9B9' } }
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colNumber === 1 ? 'center' : 'left'
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob(
            [buffer],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Customer_List_Print2.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
        updateCustomerListStatus(`Exported ${customerListRows.length} row(s) to Print2 Excel.`);
    } catch (error) {
        console.error('Error exporting compact customer list:', error);
        updateCustomerListStatus(`Print2 export failed: ${error.message}`, true);
    }
}

function syncCustomerListScroll() {
    const bodyWrapper = document.getElementById('customerListBodyWrapper');
    const headerWrapper = document.querySelector('.customer-list-header-wrapper');
    if (!bodyWrapper || !headerWrapper) return;

    bodyWrapper.addEventListener('scroll', () => {
        headerWrapper.scrollLeft = bodyWrapper.scrollLeft;
    });
}

function setupCustomerListActions() {
    const refreshBtn = document.getElementById('refreshCustomerList');
    const printBtn = document.getElementById('printCustomerList');
    const printCompactBtn = document.getElementById('printCustomerListCompact');
    const applyFilterBtn = document.getElementById('applyCustomerListFilter');
    const clearFilterBtn = document.getElementById('clearCustomerListFilter');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchCustomerList);
    }
    if (printBtn) {
        printBtn.addEventListener('click', exportCustomerListToExcel);
    }
    if (printCompactBtn) {
        printCompactBtn.addEventListener('click', exportCustomerListCompactToExcel);
    }
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyCustomerListFilter);
    }
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearCustomerListFilter);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    syncCustomerListScroll();
    setupCustomerListActions();
    fetchCustomerList();
});
