const ExcelJS = require('exceljs');

const RAW_ACTIVITY_FIELDS = [
  { name: 'Blood Donation Camps', keys: ['programmeName', 'volunteersCount', 'bloodUnitsDonated'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Units of Blood Donated'] },
  { name: 'Health Camps', keys: ['programmeName', 'volunteersCount', 'beneficiariesCount'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Beneficiaries'] },
  { name: 'Anti Drug Camps', keys: ['programmeName', 'volunteersCount', 'beneficiariesCount'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Beneficiaries'] },
  { name: 'Voters Awareness SIR', keys: ['programmeName', 'volunteersCount', 'beneficiariesCount'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Beneficiaries'] },
  { name: 'Voters Awareness SVEEP', keys: ['programmeName', 'volunteersCount', 'beneficiariesCount'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Beneficiaries'] },
  { name: 'Road Safety', keys: ['programmeName', 'volunteersCount', 'beneficiariesCount'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Beneficiaries'] },
  { name: 'Tree Plantation', keys: ['programmeName', 'volunteersCount', 'saplingsPlanted'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'No of Saplings Planted'] },
  { name: 'Important Days & Events', keys: ['programmeName', 'eventDate', 'volunteersCount'], labels: ['No of Programmes Conducted', 'Date', 'Number of Volunteers Present'] },
  { name: 'Pledge', keys: ['programmeName', 'volunteersCount'], labels: ['No of Programmes Conducted', 'Number of Volunteers'] },
  { name: 'Rallies', keys: ['programmeName', 'volunteersCount', 'eventDate', 'distanceKm'], labels: ['No of Programmes Conducted', 'Number of Volunteers', 'Date', 'Distance in KM'] },
  { name: 'Hosted Meetings', keys: ['programmeName', 'guestName', 'volunteersCount', 'beneficiariesCount'], labels: ['No of Programmes Conducted', 'Name of Guest (if any)', 'Number of Volunteers', 'No of Beneficiaries'] },
  { name: 'Any Other', keys: ['programmesConducted', 'collegeParticipated', 'volunteersParticipated', 'beneficiaries', 'remarks'], labels: ['Programmes Conducted', 'Colleges Participated', 'Volunteers Participated', 'Beneficiaries', 'Remarks'] }
];

// Premium Slate / Navy Theme Colors
const COLOR_PRIMARY = '0F172A';       // Dark Slate (Slate-900)
const COLOR_SECONDARY = '1E3A8A';     // Deep Royal Blue
const COLOR_ACCENT_BG = 'EFF6FF';     // Very light blue for cells
const COLOR_BANNER_BG = 'F1F5F9';     // Slate-100 for activity title banners
const COLOR_BORDER = 'E2E8F0';        // Slate-200 border
const COLOR_WHITE = 'FFFFFF';
const COLOR_TEXT_MUTED = '475569';    // Slate-600

const BORDER_STYLE = { style: 'thin', color: { argb: COLOR_BORDER } };
const ALL_BORDERS = { top: BORDER_STYLE, left: BORDER_STYLE, bottom: BORDER_STYLE, right: BORDER_STYLE };

function applyCellStyles(cell, { bg, fg, bold, size, italic, align, wrap, border = ALL_BORDERS }) {
  cell.font = {
    name: 'Segoe UI',
    size: size || 9,
    bold: !!bold,
    italic: !!italic,
    color: fg ? { argb: fg } : { argb: '000000' }
  };
  
  if (bg) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bg }
    };
  } else {
    cell.fill = undefined;
  }

  cell.alignment = {
    horizontal: align || 'center',
    vertical: 'middle',
    wrapText: !!wrap
  };

  if (border) {
    cell.border = border;
  }
}

/**
 * Clean sheet name to comply with Excel standards (max 31 chars, no special characters)
 */
function sanitizeSheetName(name, index = 1) {
  let clean = name.replace(/[\\/?*\[\]:]/g, '').trim();
  if (clean.length > 25) {
    clean = clean.substring(0, 25);
  }
  if (index > 1) {
    const suffix = `_${index}`;
    clean = clean.substring(0, 31 - suffix.length) + suffix;
  }
  return clean || `Sheet_${index}`;
}

/**
 * Populate a single worksheet with the official report design
 */
function populateOfficialSheet(ws, report) {
  // Ensure gridlines are visible
  ws.views = [{ showGridLines: true }];
  ws.properties.defaultRowHeight = 22;

  // Setup Column widths for professional spacing
  ws.columns = [
    { width: 5 },   // A: Left margin spacing
    { width: 28 },  // B: Col 1 (Field Names / Prog names)
    { width: 22 },  // C: Col 2
    { width: 22 },  // D: Col 3
    { width: 22 },  // E: Col 4
    { width: 22 },  // F: Col 5
    { width: 25 }   // G: Right padding / Remarks
  ];

  // Row 1: Header Spacer
  ws.getRow(1).height = 10;

  // Row 2: Report Title Banner
  ws.mergeCells('B2:G2');
  const titleCell = ws.getCell('B2');
  titleCell.value = 'NSS QUARTERLY REPORT';
  applyCellStyles(titleCell, {
    fg: COLOR_PRIMARY,
    bold: true,
    size: 14,
    align: 'center',
    border: null
  });
  ws.getRow(2).height = 30;

  // Row 3: Reporting Period Subtitle
  ws.mergeCells('B3:G3');
  const periodCell = ws.getCell('B3');
  periodCell.value = `Reporting Period: ${report.reportingPeriod}`;
  applyCellStyles(periodCell, {
    fg: COLOR_TEXT_MUTED,
    italic: true,
    size: 10,
    align: 'center',
    border: null
  });
  ws.getRow(3).height = 20;

  // Row 4: Double border divider line
  ws.mergeCells('B4:G4');
  const divCell = ws.getCell('B4');
  divCell.border = {
    bottom: { style: 'double', color: { argb: COLOR_SECONDARY } }
  };
  ws.getRow(4).height = 8;

  // Rows 5-7: Meta Information Card
  const infoRows = [
    [`College Name:  ${report.collegeName}`, `District:  ${report.district}`],
    [`Programme Officer:  ${report.programmeOfficerName}`, `PO Mobile:  ${report.programmeOfficerMobile}`],
    [`PO Email:  ${report.programmeOfficerEmail}`, `Submitted:  ${report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('en-IN') : '-'}`]
  ];

  infoRows.forEach((pair, i) => {
    const rowNum = 5 + i;
    ws.getRow(rowNum).height = 20;
    
    ws.mergeCells(`B${rowNum}:D${rowNum}`);
    ws.mergeCells(`E${rowNum}:G${rowNum}`);

    const leftCell = ws.getCell(`B${rowNum}`);
    leftCell.value = pair[0];
    applyCellStyles(leftCell, {
      align: 'left',
      size: 9.5,
      bold: true,
      fg: '334155',
      border: { bottom: BORDER_STYLE }
    });

    const rightCell = ws.getCell(`E${rowNum}`);
    rightCell.value = pair[1];
    applyCellStyles(rightCell, {
      align: 'left',
      size: 9.5,
      fg: '475569',
      border: { bottom: BORDER_STYLE }
    });
  });

  // Row 8: Spacer
  ws.getRow(8).height = 15;

  // Row 9: Section Header
  ws.mergeCells('B9:G9');
  const sectionCell = ws.getCell('B9');
  sectionCell.value = 'ACTIVITY-WISE PERFORMANCE REPORT';
  applyCellStyles(sectionCell, {
    fg: COLOR_SECONDARY,
    bold: true,
    size: 11,
    align: 'left',
    border: { bottom: { style: 'medium', color: { argb: COLOR_SECONDARY } } }
  });
  ws.getRow(9).height = 24;

  let currentRow = 10;

  // Loop through and build each activity block
  RAW_ACTIVITY_FIELDS.forEach((meta, idx) => {
    // Spacer row before activity block
    ws.getRow(currentRow).height = 8;
    currentRow++;

    // 1. Write Activity Name Banner (e.g. "1. Blood Donation Camps")
    ws.mergeCells(`B${currentRow}:G${currentRow}`);
    const nameCell = ws.getCell(`B${currentRow}`);
    nameCell.value = `  ${idx + 1}. ${meta.name.toUpperCase()}`;
    applyCellStyles(nameCell, {
      bg: COLOR_BANNER_BG,
      fg: COLOR_PRIMARY,
      bold: true,
      size: 9.5,
      align: 'left',
      border: {
        top: BORDER_STYLE,
        left: { style: 'medium', color: { argb: COLOR_SECONDARY } },
        bottom: BORDER_STYLE,
        right: BORDER_STYLE
      }
    });
    ws.getRow(currentRow).height = 24;
    currentRow++;

    // 2. Write Table Headers
    const headersRow = currentRow;
    ws.getRow(headersRow).height = 24;
    meta.labels.forEach((label, lIdx) => {
      const colChar = String.fromCharCode(66 + lIdx); // B, C, D...
      const cell = ws.getCell(`${colChar}${headersRow}`);
      applyCellStyles(cell, {
        bg: COLOR_SECONDARY,
        fg: COLOR_WHITE,
        bold: true,
        size: 9,
        align: 'center'
      });
      cell.value = label;
    });
    // Add empty cell borders for remaining unused columns to maintain grid alignment
    for (let c = meta.labels.length; c < 6; c++) {
      const colChar = String.fromCharCode(66 + c);
      const cell = ws.getCell(`${colChar}${headersRow}`);
      applyCellStyles(cell, { bg: 'F8FAFC', border: ALL_BORDERS });
    }
    currentRow++;

    // 3. Write Table Data
    const dataRow = currentRow;
    ws.getRow(dataRow).height = 22;
    const act = report.activities.find(a => a.activityName === meta.name) || {};
    meta.keys.forEach((key, kIdx) => {
      const colChar = String.fromCharCode(66 + kIdx); // B, C, D...
      const cell = ws.getCell(`${colChar}${dataRow}`);
      const rawVal = act[key];
      const val = (rawVal === undefined || rawVal === null || rawVal === '') ? '-' : rawVal;
      applyCellStyles(cell, {
        bg: COLOR_ACCENT_BG,
        size: 9,
        align: 'center'
      });
      cell.value = val;
    });
    // Fill remaining unused columns
    for (let c = meta.keys.length; c < 6; c++) {
      const colChar = String.fromCharCode(66 + c);
      const cell = ws.getCell(`${colChar}${dataRow}`);
      applyCellStyles(cell, { bg: 'F8FAFC', border: ALL_BORDERS });
    }
    currentRow++;
  });

  // Spacer
  ws.getRow(currentRow).height = 15;
  currentRow++;

  // Social Media Presence Section Header
  ws.mergeCells(`B${currentRow}:G${currentRow}`);
  const smHeader = ws.getCell(`B${currentRow}`);
  smHeader.value = 'SOCIAL MEDIA PRESENCE';
  applyCellStyles(smHeader, {
    fg: COLOR_SECONDARY,
    bold: true,
    size: 11,
    align: 'left',
    border: { bottom: { style: 'medium', color: { argb: COLOR_SECONDARY } } }
  });
  ws.getRow(currentRow).height = 24;
  currentRow++;

  // Social Media Table Headers
  const smHeadRow = currentRow;
  ws.getRow(smHeadRow).height = 24;
  const smLabels = ['Instagram', 'Facebook', 'YouTube', 'X (Twitter)', 'Other'];
  smLabels.forEach((label, i) => {
    const colChar = String.fromCharCode(66 + i); // B, C, D...
    const cell = ws.getCell(`${colChar}${smHeadRow}`);
    applyCellStyles(cell, {
      bg: COLOR_SECONDARY,
      fg: COLOR_WHITE,
      bold: true,
      size: 9,
      align: 'center'
    });
    cell.value = label;
  });
  // Empty padding col G
  applyCellStyles(ws.getCell(`G${smHeadRow}`), { bg: 'F8FAFC' });
  currentRow++;

  // Social Media Data
  const smDataRow = currentRow;
  ws.getRow(smDataRow).height = 22;
  const sm = report.socialMedia || {};
  const smKeys = ['instagram', 'facebook', 'youtube', 'x', 'other'];
  smKeys.forEach((key, i) => {
    const colChar = String.fromCharCode(66 + i);
    const cell = ws.getCell(`${colChar}${smDataRow}`);
    applyCellStyles(cell, {
      bg: COLOR_ACCENT_BG,
      size: 9,
      align: 'center'
    });
    cell.value = sm[key] || '-';
  });
  applyCellStyles(ws.getCell(`G${smDataRow}`), { bg: 'F8FAFC' });
  currentRow++;

  // Footer metadata
  const footerRow = currentRow + 2;
  ws.mergeCells(`B${footerRow}:D${footerRow}`);
  const footL = ws.getCell(`B${footerRow}`);
  footL.value = `Submission ID: ${report.submissionId}`;
  applyCellStyles(footL, {
    fg: COLOR_TEXT_MUTED,
    italic: true,
    size: 8,
    align: 'left',
    border: null
  });

  ws.mergeCells(`E${footerRow}:G${footerRow}`);
  const footR = ws.getCell(`E${footerRow}`);
  footR.value = `Report Generated: ${new Date().toLocaleDateString('en-IN')}`;
  applyCellStyles(footR, {
    fg: COLOR_TEXT_MUTED,
    italic: true,
    size: 8,
    align: 'right',
    border: null
  });
}

/**
 * Generate Official University Excel for a single report
 */
const generateOfficialExcel = async (report) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('NSS Quarterly Report');
  populateOfficialSheet(ws, report);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generate Official University Excel where each report is in a separate sheet
 */
const generateMultiSheetExcel = async (reports) => {
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set();

  reports.forEach((report) => {
    let baseName = report.collegeName || 'Report';
    let index = 1;
    let sheetName = sanitizeSheetName(baseName, index);

    while (usedNames.has(sheetName.toLowerCase())) {
      index++;
      sheetName = sanitizeSheetName(baseName, index);
    }
    usedNames.add(sheetName.toLowerCase());

    const ws = workbook.addWorksheet(sheetName);
    populateOfficialSheet(ws, report);
  });

  if (reports.length === 0) {
    workbook.addWorksheet('No Data');
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generate Raw Data Excel (one row per submission)
 */
const generateRawDataExcel = async (reports) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Raw NSS Data');
  ws.views = [{ showGridLines: true }];

  // Build header columns
  const fixedHeaders = [
    'Submission ID', 'Reporting Period', 'College Name',
    'Programme Officer', 'Mobile', 'Email', 'District', 'Submitted At'
  ];

  const activityHeaders = [];
  RAW_ACTIVITY_FIELDS.forEach(meta => {
    const prefix = meta.name;
    meta.labels.forEach(label => {
      activityHeaders.push(`${prefix} - ${label}`);
    });
  });

  const socialHeaders = ['Instagram', 'Facebook', 'YouTube', 'X (Twitter)', 'Other (Social)'];
  const allHeaders = [...fixedHeaders, ...activityHeaders, ...socialHeaders];

  // Set columns
  ws.columns = allHeaders.map((h, i) => ({
    header: h,
    key: String(i),
    width: i < 8 ? 20 : 25
  }));

  // Style header row
  ws.getRow(1).height = 30;
  ws.getRow(1).eachCell(cell => {
    applyCellStyles(cell, {
      bg: COLOR_PRIMARY,
      fg: COLOR_WHITE,
      bold: true,
      size: 9.5,
      align: 'center',
      wrap: true
    });
  });

  // Data rows
  reports.forEach((report, rIdx) => {
    const sm = report.socialMedia || {};
    const rowValues = [
      report.submissionId,
      report.reportingPeriod,
      report.collegeName,
      report.programmeOfficerName,
      report.programmeOfficerMobile,
      report.programmeOfficerEmail,
      report.district,
      report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('en-IN') : ''
    ];

    RAW_ACTIVITY_FIELDS.forEach(meta => {
      const act = report.activities.find(a => a.activityName === meta.name) || {};
      meta.keys.forEach(key => {
        const val = act[key];
        rowValues.push((val === undefined || val === null) ? '' : val);
      });
    });

    rowValues.push(sm.instagram || '', sm.facebook || '', sm.youtube || '', sm.x || '', sm.other || '');

    const row = ws.addRow(rowValues);
    row.height = 20;
    row.eachCell(cell => {
      applyCellStyles(cell, {
        bg: rIdx % 2 === 0 ? COLOR_ACCENT_BG : null,
        size: 9,
        align: 'center'
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { generateOfficialExcel, generateMultiSheetExcel, generateRawDataExcel };
