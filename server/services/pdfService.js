const pdfMake = require('pdfmake');
const path = require('path');
const fs = require('fs');

// Read logos as base64
const periyarLogoPath = path.join(__dirname, '..', 'assets', 'periyar_logo.png');
const nssLogoPath = path.join(__dirname, '..', 'assets', 'nss_logo.png');

const periyarLogoDataUrl = fs.existsSync(periyarLogoPath)
  ? `data:image/png;base64,${fs.readFileSync(periyarLogoPath, 'base64')}`
  : null;

const nssLogoDataUrl = fs.existsSync(nssLogoPath)
  ? `data:image/png;base64,${fs.readFileSync(nssLogoPath, 'base64')}`
  : null;

const fonts = {
  Roboto: {
    normal: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Regular.ttf'),
    bold: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Medium.ttf'),
    italics: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-MediumItalic.ttf')
  }
};

// Set fonts globally for this pdfmake instance
pdfMake.setFonts(fonts);

/**
 * Helper to build custom table layout for each activity based on its schema
 */
function buildActivityTable(name, act) {
  let headers = [];
  let values = [];
  let widths = [];

  switch (name) {
    case 'Blood Donation Camps':
      headers = ['No of Programmes Conducted', 'Number of Volunteers', 'No of Units of Blood Donated'];
      values = [act.programmeName || '-', String(act.volunteersCount ?? 0), String(act.bloodUnitsDonated ?? 0)];
      widths = ['*', 120, 150];
      break;

    case 'Health Camps':
    case 'Anti Drug Camps':
    case 'Voters Awareness SIR':
    case 'Voters Awareness SVEEP':
    case 'Road Safety':
      headers = ['No of Programmes Conducted', 'Number of Volunteers', 'No of Beneficiaries'];
      values = [act.programmeName || '-', String(act.volunteersCount ?? 0), String(act.beneficiariesCount ?? 0)];
      widths = ['*', 120, 120];
      break;

    case 'Tree Plantation':
      headers = ['No of Programmes Conducted', 'Number of Volunteers', 'No of Saplings Planted'];
      values = [act.programmeName || '-', String(act.volunteersCount ?? 0), String(act.saplingsPlanted ?? 0)];
      widths = ['*', 120, 130];
      break;

    case 'Important Days & Events':
      headers = ['No of Programmes Conducted', 'Date', 'Number of Volunteers Present'];
      values = [act.programmeName || '-', act.eventDate || '-', String(act.volunteersCount ?? 0)];
      widths = ['*', 100, 150];
      break;

    case 'Pledge':
      headers = ['No of Programmes Conducted', 'Number of Volunteers'];
      values = [act.programmeName || '-', String(act.volunteersCount ?? 0)];
      widths = ['*', 150];
      break;

    case 'Rallies':
      headers = ['No of Programmes Conducted', 'Number of Volunteers', 'Date', 'Distance in KM'];
      values = [act.programmeName || '-', String(act.volunteersCount ?? 0), act.eventDate || '-', String(act.distanceKm ?? 0)];
      widths = ['*', 110, 80, 90];
      break;

    case 'Hosted Meetings':
      headers = ['No of Programmes Conducted', 'Name of Guest (if any)', 'Number of Volunteers', 'No of Beneficiaries'];
      values = [act.programmeName || '-', act.guestName || '-', String(act.volunteersCount ?? 0), String(act.beneficiariesCount ?? 0)];
      widths = ['*', '*', 110, 110];
      break;

    case 'Any Other':
    default:
      headers = ['Programmes Conducted', 'Colleges Participated', 'Volunteers Participated', 'Beneficiaries', 'Remarks'];
      values = [
        String(act.programmesConducted ?? 0),
        String(act.collegeParticipated ?? 0),
        String(act.volunteersParticipated ?? 0),
        String(act.beneficiaries ?? 0),
        act.remarks || '-'
      ];
      widths = [80, 80, 80, 80, '*'];
      break;
  }

  return {
    margin: [0, 4, 0, 12],
    table: {
      widths: widths,
      body: [
        headers.map(h => ({ text: h, style: 'tableHeader', alignment: 'center' })),
        values.map(v => ({ text: v, style: 'tableCell', alignment: 'center' }))
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#bbbbbb',
      vLineColor: () => '#bbbbbb',
      fillColor: (rowIndex) => (rowIndex === 0 ? '#003366' : null)
    }
  };
}

/**
 * Generate an official NSS Quarterly Report PDF.
 * @param {Object} report - Mongoose Report document
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateOfficialPDF = async (report) => {
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const socialMedia = report.socialMedia || {};

  // Build content blocks dynamically
  const logoHeader = {
    margin: [0, 0, 0, 10],
    columns: []
  };

  if (periyarLogoDataUrl) {
    logoHeader.columns.push({
      image: periyarLogoDataUrl,
      width: 45,
      alignment: 'left'
    });
  } else {
    logoHeader.columns.push({ text: '', width: 45 });
  }

  logoHeader.columns.push({
    stack: [
      { text: 'PERIYAR UNIVERSITY', fontSize: 13, bold: true, color: '#003366', alignment: 'center' },
      { text: 'SALEM, TAMIL NADU', fontSize: 8, bold: true, color: '#444444', alignment: 'center', margin: [0, 1, 0, 1] },
      { text: 'NATIONAL SERVICE SCHEME (NSS)', fontSize: 10, bold: true, color: '#f57c00', alignment: 'center' },
      { text: `NSS QUARTERLY REPORT — ${report.reportingPeriod}`, fontSize: 11, bold: true, color: '#003366', alignment: 'center', margin: [0, 4, 0, 0] }
    ],
    width: '*'
  });

  if (nssLogoDataUrl) {
    logoHeader.columns.push({
      image: nssLogoDataUrl,
      width: 45,
      alignment: 'right'
    });
  } else {
    logoHeader.columns.push({ text: '', width: 45 });
  }

  const content = [
    // Header block with Logos
    logoHeader,

    // Divider
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#003366' }] },

    // College Info Table
    {
      margin: [0, 12, 0, 12],
      table: {
        widths: ['*', '*'],
        body: [
          [
            { text: [{ text: 'College Name: ', bold: true }, report.collegeName], style: 'infoCell' },
            { text: [{ text: 'District: ', bold: true }, report.district], style: 'infoCell' }
          ],
          [
            { text: [{ text: 'Programme Officer: ', bold: true }, report.programmeOfficerName], style: 'infoCell' },
            { text: [{ text: 'Mobile: ', bold: true }, report.programmeOfficerMobile], style: 'infoCell' }
          ],
          [
            { text: [{ text: 'Email: ', bold: true }, report.programmeOfficerEmail], style: 'infoCell' },
            { text: '', style: 'infoCell' }
          ]
        ]
      },
      layout: 'noBorders'
    },

    // Divider
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#aaaaaa' }] },
    { text: 'ACTIVITY-WISE REPORT', style: 'sectionHeader', margin: [0, 8, 0, 8] }
  ];

  // Add each activity table
  report.activities.forEach((act, idx) => {
    content.push({
      text: `${idx + 1}. ${act.activityName}`,
      style: 'activityHeader',
      keepWithNext: true
    });
    content.push(buildActivityTable(act.activityName, act));
  });

  // Social Media Presence
  content.push({ text: 'SOCIAL MEDIA PRESENCE', style: 'sectionHeader', margin: [0, 12, 0, 8] });
  content.push({
    margin: [0, 0, 0, 16],
    table: {
      widths: ['*', '*', '*', '*', '*'],
      body: [
        [
          { text: 'Instagram', style: 'socialHeader' },
          { text: 'Facebook', style: 'socialHeader' },
          { text: 'YouTube', style: 'socialHeader' },
          { text: 'X (Twitter)', style: 'socialHeader' },
          { text: 'Other', style: 'socialHeader' }
        ],
        [
          { text: socialMedia.instagram || '-', style: 'socialCell' },
          { text: socialMedia.facebook || '-', style: 'socialCell' },
          { text: socialMedia.youtube || '-', style: 'socialCell' },
          { text: socialMedia.x || '-', style: 'socialCell' },
          { text: socialMedia.other || '-', style: 'socialCell' }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#bbbbbb',
      vLineColor: () => '#bbbbbb',
      fillColor: (rowIndex) => (rowIndex === 0 ? '#003366' : null)
    }
  });

  // Footer line
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }] });
  content.push({
    margin: [0, 8, 0, 0],
    columns: [
      { text: `Submission ID: ${report.submissionId}`, style: 'footerText' },
      { text: `Generated: ${generatedDate}`, style: 'footerText', alignment: 'right' }
    ]
  });

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    content: content,
    styles: {
      reportTitle: { fontSize: 14, bold: true, color: '#003366', margin: [0, 0, 0, 2] },
      periodTitle: { fontSize: 10, color: '#555555' },
      sectionHeader: {
        fontSize: 11, bold: true, color: '#003366',
        decoration: 'underline'
      },
      activityHeader: {
        fontSize: 10, bold: true, color: '#333333'
      },
      infoCell: { fontSize: 9, margin: [0, 2, 0, 2] },
      tableHeader: {
        fontSize: 8, bold: true, color: '#ffffff',
        margin: [2, 4, 2, 4]
      },
      tableCell: { fontSize: 8, margin: [2, 3, 2, 3] },
      socialHeader: {
        fontSize: 8, bold: true, alignment: 'center',
        color: '#ffffff', margin: [2, 4, 2, 4]
      },
      socialCell: { fontSize: 8, alignment: 'center', margin: [2, 4, 2, 4] },
      footerText: { fontSize: 8, color: '#777777' }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  const buffer = await pdfDoc.getBuffer();
  return buffer;
};

/**
 * Generate a combined official NSS Quarterly Reports PDF for multiple reports.
 * @param {Array} reports - Array of Mongoose Report documents
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateBulkPDF = async (reports) => {
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const content = [];

  reports.forEach((report, rIdx) => {
    const socialMedia = report.socialMedia || {};

    const logoHeader = {
      margin: [0, 0, 0, 10],
      columns: []
    };

    if (rIdx > 0) {
      logoHeader.pageBreak = 'before';
    }

    if (periyarLogoDataUrl) {
      logoHeader.columns.push({
        image: periyarLogoDataUrl,
        width: 45,
        alignment: 'left'
      });
    } else {
      logoHeader.columns.push({ text: '', width: 45 });
    }

    logoHeader.columns.push({
      stack: [
        { text: 'PERIYAR UNIVERSITY', fontSize: 13, bold: true, color: '#003366', alignment: 'center' },
        { text: 'SALEM, TAMIL NADU', fontSize: 8, bold: true, color: '#444444', alignment: 'center', margin: [0, 1, 0, 1] },
        { text: 'NATIONAL SERVICE SCHEME (NSS)', fontSize: 10, bold: true, color: '#f57c00', alignment: 'center' },
        { text: `NSS QUARTERLY REPORT — ${report.reportingPeriod}`, fontSize: 11, bold: true, color: '#003366', alignment: 'center', margin: [0, 4, 0, 0] }
      ],
      width: '*'
    });

    if (nssLogoDataUrl) {
      logoHeader.columns.push({
        image: nssLogoDataUrl,
        width: 45,
        alignment: 'right'
      });
    } else {
      logoHeader.columns.push({ text: '', width: 45 });
    }

    content.push(
      logoHeader,
      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#003366' }] },

      // College Info Table
      {
        margin: [0, 12, 0, 12],
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: [{ text: 'College Name: ', bold: true }, report.collegeName], style: 'infoCell' },
              { text: [{ text: 'District: ', bold: true }, report.district], style: 'infoCell' }
            ],
            [
              { text: [{ text: 'Programme Officer: ', bold: true }, report.programmeOfficerName], style: 'infoCell' },
              { text: [{ text: 'Mobile: ', bold: true }, report.programmeOfficerMobile], style: 'infoCell' }
            ],
            [
              { text: [{ text: 'Email: ', bold: true }, report.programmeOfficerEmail], style: 'infoCell' },
              { text: '', style: 'infoCell' }
            ]
          ]
        },
        layout: 'noBorders'
      },

      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#aaaaaa' }] },
      { text: 'ACTIVITY-WISE REPORT', style: 'sectionHeader', margin: [0, 8, 0, 8] }
    );

    // Add each activity table
    report.activities.forEach((act, idx) => {
      content.push({
        text: `${idx + 1}. ${act.activityName}`,
        style: 'activityHeader',
        keepWithNext: true
      });
      content.push(buildActivityTable(act.activityName, act));
    });

    // Social Media Presence
    content.push({ text: 'SOCIAL MEDIA PRESENCE', style: 'sectionHeader', margin: [0, 12, 0, 8] });
    content.push({
      margin: [0, 0, 0, 16],
      table: {
        widths: ['*', '*', '*', '*', '*'],
        body: [
          [
            { text: 'Instagram', style: 'socialHeader' },
            { text: 'Facebook', style: 'socialHeader' },
            { text: 'YouTube', style: 'socialHeader' },
            { text: 'X (Twitter)', style: 'socialHeader' },
            { text: 'Other', style: 'socialHeader' }
          ],
          [
            { text: socialMedia.instagram || '-', style: 'socialCell' },
            { text: socialMedia.facebook || '-', style: 'socialCell' },
            { text: socialMedia.youtube || '-', style: 'socialCell' },
            { text: socialMedia.x || '-', style: 'socialCell' },
            { text: socialMedia.other || '-', style: 'socialCell' }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#bbbbbb',
        vLineColor: () => '#bbbbbb',
        fillColor: (rowIndex) => (rowIndex === 0 ? '#003366' : null)
      }
    });

    // Footer line
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }] });
    content.push({
      margin: [0, 8, 0, 0],
      columns: [
        { text: `Submission ID: ${report.submissionId}`, style: 'footerText' },
        { text: `Generated: ${generatedDate}`, style: 'footerText', alignment: 'right' }
      ]
    });
  });

  if (reports.length === 0) {
    content.push({ text: 'No report data found matching filters.', style: 'reportTitle', alignment: 'center' });
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    content: content,
    styles: {
      reportTitle: { fontSize: 14, bold: true, color: '#003366', margin: [0, 0, 0, 2] },
      periodTitle: { fontSize: 10, color: '#555555' },
      sectionHeader: {
        fontSize: 11, bold: true, color: '#003366',
        decoration: 'underline'
      },
      activityHeader: {
        fontSize: 10, bold: true, color: '#333333'
      },
      infoCell: { fontSize: 9, margin: [0, 2, 0, 2] },
      tableHeader: {
        fontSize: 8, bold: true, color: '#ffffff',
        margin: [2, 4, 2, 4]
      },
      tableCell: { fontSize: 8, margin: [2, 3, 2, 3] },
      socialHeader: {
        fontSize: 8, bold: true, alignment: 'center',
        color: '#ffffff', margin: [2, 4, 2, 4]
      },
      socialCell: { fontSize: 8, alignment: 'center', margin: [2, 4, 2, 4] },
      footerText: { fontSize: 8, color: '#777777' }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  const buffer = await pdfDoc.getBuffer();
  return buffer;
};

module.exports = { generateOfficialPDF, generateBulkPDF };
