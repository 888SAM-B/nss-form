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

const parseProgCount = (val) => {
  if (!val) return 0;
  const num = Number(String(val).trim());
  return isNaN(num) ? 0 : num;
};

const calculateCumulativeData = (reports) => {
  const stats = {
    specialCamps: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    bloodDonation: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    healthCamps: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    antiDrug: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    votersSIR: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    votersSVEEP: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    roadSafety: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    treePlantation: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    importantDays: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    pledge: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    rallies: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    hostedMeetings: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 },
    anyOther: { progs: 0, colleges: 0, volunteers: 0, beneficiaries: 0 }
  };

  const socialCounts = {
    instagram: 0,
    x: 0,
    facebook: 0,
    youtube: 0,
    other: 0
  };

  reports.forEach(report => {
    const sm = report.socialMedia || {};
    if (sm.instagram && sm.instagram.trim()) socialCounts.instagram++;
    if (sm.x && sm.x.trim()) socialCounts.x++;
    if (sm.facebook && sm.facebook.trim()) socialCounts.facebook++;
    if (sm.youtube && sm.youtube.trim()) socialCounts.youtube++;
    if (sm.other && sm.other.trim()) socialCounts.other++;

    (report.activities || []).forEach(act => {
      const name = act.activityName;
      const pCount = parseProgCount(act.programmeName);
      const vCount = act.volunteersCount || 0;

      switch (name) {
        case 'Blood Donation Camps':
          stats.bloodDonation.progs += pCount;
          stats.bloodDonation.volunteers += vCount;
          stats.bloodDonation.beneficiaries += (act.bloodUnitsDonated || 0);
          if (pCount > 0 || vCount > 0 || (act.bloodUnitsDonated || 0) > 0) {
            stats.bloodDonation.colleges += 1;
          }
          break;
        case 'Health Camps':
          stats.healthCamps.progs += pCount;
          stats.healthCamps.volunteers += vCount;
          stats.healthCamps.beneficiaries += (act.beneficiariesCount || 0);
          if (pCount > 0 || vCount > 0 || (act.beneficiariesCount || 0) > 0) {
            stats.healthCamps.colleges += 1;
          }
          break;
        case 'Anti Drug Camps':
          stats.antiDrug.progs += pCount;
          stats.antiDrug.volunteers += vCount;
          stats.antiDrug.beneficiaries += (act.beneficiariesCount || 0);
          if (pCount > 0 || vCount > 0 || (act.beneficiariesCount || 0) > 0) {
            stats.antiDrug.colleges += 1;
          }
          break;
        case 'Voters Awareness SIR':
          stats.votersSIR.progs += pCount;
          stats.votersSIR.volunteers += vCount;
          stats.votersSIR.beneficiaries += (act.beneficiariesCount || 0);
          if (pCount > 0 || vCount > 0 || (act.beneficiariesCount || 0) > 0) {
            stats.votersSIR.colleges += 1;
          }
          break;
        case 'Voters Awareness SVEEP':
          stats.votersSVEEP.progs += pCount;
          stats.votersSVEEP.volunteers += vCount;
          stats.votersSVEEP.beneficiaries += (act.beneficiariesCount || 0);
          if (pCount > 0 || vCount > 0 || (act.beneficiariesCount || 0) > 0) {
            stats.votersSVEEP.colleges += 1;
          }
          break;
        case 'Road Safety':
          stats.roadSafety.progs += pCount;
          stats.roadSafety.volunteers += vCount;
          stats.roadSafety.beneficiaries += (act.beneficiariesCount || 0);
          if (pCount > 0 || vCount > 0 || (act.beneficiariesCount || 0) > 0) {
            stats.roadSafety.colleges += 1;
          }
          break;
        case 'Tree Plantation':
          stats.treePlantation.progs += pCount;
          stats.treePlantation.volunteers += vCount;
          stats.treePlantation.beneficiaries += (act.saplingsPlanted || 0);
          if (pCount > 0 || vCount > 0 || (act.saplingsPlanted || 0) > 0) {
            stats.treePlantation.colleges += 1;
          }
          break;
        case 'Important Days & Events':
          stats.importantDays.progs += pCount;
          stats.importantDays.volunteers += vCount;
          if (pCount > 0 || vCount > 0) {
            stats.importantDays.colleges += 1;
          }
          break;
        case 'Pledge':
          stats.pledge.progs += pCount;
          stats.pledge.volunteers += vCount;
          if (pCount > 0 || vCount > 0) {
            stats.pledge.colleges += 1;
          }
          break;
        case 'Rallies':
          stats.rallies.progs += pCount;
          stats.rallies.volunteers += vCount;
          stats.rallies.beneficiaries += (act.distanceKm || 0);
          if (pCount > 0 || vCount > 0 || (act.distanceKm || 0) > 0) {
            stats.rallies.colleges += 1;
          }
          break;
        case 'Hosted Meetings':
          stats.hostedMeetings.progs += pCount;
          stats.hostedMeetings.volunteers += vCount;
          stats.hostedMeetings.beneficiaries += (act.beneficiariesCount || 0);
          if (pCount > 0 || vCount > 0 || (act.beneficiariesCount || 0) > 0) {
            stats.hostedMeetings.colleges += 1;
          }
          break;
        case 'Any Other':
          stats.anyOther.progs += (act.programmesConducted || 0);
          stats.anyOther.colleges += (act.collegeParticipated || 0);
          stats.anyOther.volunteers += (act.volunteersParticipated || 0);
          stats.anyOther.beneficiaries += (act.beneficiaries || 0);
          break;
      }
    });
  });

  return { stats, socialCounts };
};

const generateCumulativePDF = async (reports, filters = {}) => {
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const { stats, socialCounts } = calculateCumulativeData(reports);

  // Build header with logos
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
      { text: 'PERIYAR UNIVERSITY', fontSize: 14, bold: true, color: '#003366', alignment: 'center' },
      { text: 'SALEM, TAMIL NADU', fontSize: 9, bold: true, color: '#444444', alignment: 'center', margin: [0, 1, 0, 1] },
      { text: 'NATIONAL SERVICE SCHEME (NSS)', fontSize: 10, bold: true, color: '#f57c00', alignment: 'center' },
      { text: 'NSS EVENT-WISE CUMULATIVE REPORT', fontSize: 12, bold: true, color: '#003366', alignment: 'center', margin: [0, 4, 0, 0] }
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

  const filterDetails = [];
  if (filters.reportingPeriod) filterDetails.push(`Period: ${filters.reportingPeriod}`);
  if (filters.district) filterDetails.push(`District: ${filters.district}`);
  if (filters.submissionDate) filterDetails.push(`Date: ${filters.submissionDate}`);
  const filterString = filterDetails.length > 0 ? filterDetails.join(' | ') : 'All Submissions';

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [47, 40, 47, 40],
    content: [
      logoHeader,
      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 748, y2: 0, lineWidth: 1.5, lineColor: '#003366' }] },

      // Meta info row
      {
        margin: [0, 8, 0, 8],
        columns: [
          { text: `Filters Applied: ${filterString}`, fontSize: 9, bold: true, color: '#555555' },
          { text: 'University Name: Periyar University', fontSize: 9, bold: true, color: '#003366', alignment: 'center' },
          { text: `Total Submissions Aggregated: ${reports.length}`, fontSize: 9, bold: true, color: '#003366', alignment: 'right' }
        ]
      },

      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 748, y2: 0, lineWidth: 0.5, lineColor: '#aaaaaa' }] },      {
        margin: [0, 10, 0, 10],
        table: {
          headerRows: 2,
          widths: [15, 115, 46, 46, 46, 46, 32, 36, 42, 46, 50, 36, 36, 46, 42],
          body: [
            // Header Row 1
            [
              { text: 'S.No', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Subject', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Special Camps Conducted', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Blood Donation Camps', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'No of Health Camps', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Anti drug Camps', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Voters Awareness', style: 'tableHeader', colSpan: 2, alignment: 'center' },
              {}, // placeholder for Voter SVEEP
              { text: 'Road Safety', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Tree Plantation', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Important Days & Events', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Pledge', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Rallies', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Hosted Meetings', style: 'tableHeader', rowSpan: 2, alignment: 'center' },
              { text: 'Any Other', style: 'tableHeader', rowSpan: 2, alignment: 'center' }
            ],
            // Header Row 2
            [
              {}, {}, {}, {}, {}, {},
              { text: 'SIR', style: 'tableSubHeader', alignment: 'center' },
              { text: 'SVEEP', style: 'tableSubHeader', alignment: 'center' },
              {}, {}, {}, {}, {}, {}, {}
            ],
            // Row 1 (No. of Programmes Conducted)
            [
              { text: '1', style: 'tableCell', alignment: 'center' },
              { text: 'No. Of Programmes Conducted', style: 'tableCellBold' },
              { text: String(stats.specialCamps.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.bloodDonation.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.healthCamps.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.antiDrug.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSIR.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSVEEP.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.roadSafety.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.treePlantation.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.importantDays.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.pledge.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.rallies.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.hostedMeetings.progs), style: 'tableCell', alignment: 'center' },
              { text: String(stats.anyOther.progs), style: 'tableCell', alignment: 'center' }
            ],
            // Row 2 (No of College Participated)
            [
              { text: '2', style: 'tableCell', alignment: 'center' },
              { text: 'No of College Participated', style: 'tableCellBold' },
              { text: String(stats.specialCamps.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.bloodDonation.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.healthCamps.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.antiDrug.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSIR.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSVEEP.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.roadSafety.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.treePlantation.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.importantDays.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.pledge.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.rallies.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.hostedMeetings.colleges), style: 'tableCell', alignment: 'center' },
              { text: String(stats.anyOther.colleges), style: 'tableCell', alignment: 'center' }
            ],
            // Row 3 (No. of NSS Volunteers Participated)
            [
              { text: '3', style: 'tableCell', alignment: 'center' },
              { text: 'No. of NSS Volunteers Participated', style: 'tableCellBold' },
              { text: String(stats.specialCamps.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.bloodDonation.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.healthCamps.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.antiDrug.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSIR.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSVEEP.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.roadSafety.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.treePlantation.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.importantDays.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.pledge.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.rallies.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.hostedMeetings.volunteers), style: 'tableCell', alignment: 'center' },
              { text: String(stats.anyOther.volunteers), style: 'tableCell', alignment: 'center' }
            ],
            // Row 4 (No of Beneficiaries)
            [
              { text: '4', style: 'tableCell', alignment: 'center' },
              { text: 'No of Beneficiaries', style: 'tableCellBold' },
              { text: String(stats.specialCamps.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.bloodDonation.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.healthCamps.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.antiDrug.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSIR.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.votersSVEEP.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.roadSafety.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.treePlantation.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.importantDays.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.pledge.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.rallies.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.hostedMeetings.beneficiaries), style: 'tableCell', alignment: 'center' },
              { text: String(stats.anyOther.beneficiaries), style: 'tableCell', alignment: 'center' }
            ],
            // Row 5 (Social Media)
            [
              { text: '5', style: 'tableCell', alignment: 'center', bold: true },
              {
                text: [
                  { text: 'You are requested to post all the NSS Events in social media\n', bold: true },
                  `1. Instagram: ${socialCounts.instagram} submissions\n`,
                  `2. X (Twitter): ${socialCounts.x} submissions\n`,
                  `3. Meta (Facebook): ${socialCounts.facebook} submissions\n`,
                  `4. YouTube: ${socialCounts.youtube} submissions\n`,
                  `5. Any other: ${socialCounts.other} submissions`
                ],
                style: 'socialMediaText',
                colSpan: 14,
                alignment: 'left'
              },
              {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#444444',
          vLineColor: () => '#444444',
          fillColor: (rowIndex) => {
            if (rowIndex === 0 || rowIndex === 1) return '#003366';
            if (rowIndex === 6) return '#f9fafb';
            return null;
          },
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 4,
          paddingBottom: () => 4
        }
      },

      // Footer divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 748, y2: 0, lineWidth: 1, lineColor: '#cccccc' }] },
      {
        margin: [0, 8, 0, 0],
        columns: [
          { text: 'NSS Periyar University Event-wise Cumulative Report', style: 'footerText' }
        ]
      }
    ],
    styles: {
      tableHeader: { fontSize: 7, bold: true, color: '#ffffff' },
      tableSubHeader: { fontSize: 7, bold: true, color: '#ffffff' },
      tableCell: { fontSize: 7.5 },
      tableCellBold: { fontSize: 7.5, bold: true },
      socialMediaText: { fontSize: 7.5, color: '#333333', lineHeight: 1.3 },
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

module.exports = { generateOfficialPDF, generateBulkPDF, generateCumulativePDF };
