import ExcelJS from 'exceljs';

const COLLEGE_NAME = 'NIRMALA COLLEGE OF ENGINEERING TECHNOLOGY AND MANAGEMENT';
const BORDER = { style: 'thin', color: { argb: 'FF404040' } };
const REPORT_SHEETS = {
  graduation: { name: 'Graduation Statistics', create: createGraduationStatsSheet },
  'program-semester': { name: 'Program Semester Wise', create: createProgramSemesterSheet },
  'faculty-history': { name: 'Faculty Performance History', create: createFacultyHistorySheet },
  'supplementary-status': { name: 'Supplementary Status', create: createSupplementaryStatusSheet },
  'course-faculty-performance': { name: 'Course Faculty Performance', create: createCourseFacultySheet },
};

function getRows(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.items) ? data.items : [];
}

function firstValue(object, ...keys) {
  for (const key of keys) {
    if (object?.[key] !== undefined && object[key] !== null) return object[key];
  }
  return null;
}

function getFilterLabel(context, key) {
  const selected = context?.filters?.[key];
  if (!selected) return null;
  const option = (context.filterOptions?.[key === 'program_id' ? 'programs' : 'batches'] ?? [])
    .find((item) => String(item.id ?? item) === String(selected));
  return option?.label ?? option?.name ?? option?.code ?? selected;
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function setMergedText(sheet, range, text, style = {}) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(':')[0]);
  cell.value = text;
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true, ...style.alignment };
  cell.font = { name: 'Times New Roman', size: 11, ...style.font };
  cell.border = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
  if (style.fill) cell.fill = style.fill;
}

function styleRange(sheet, row, startCol, endCol, { header = false, bold = false } = {}) {
  for (let col = startCol; col <= endCol; col += 1) {
    const cell = sheet.getRow(row).getCell(col);
    cell.font = { name: 'Times New Roman', size: 11, bold: header || bold };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
    if (header) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } };
  }
}

function setRowValues(sheet, rowNumber, values) {
  values.forEach((value, index) => {
    sheet.getCell(rowNumber, index + 1).value = value;
  });
}

function styleDataRows(sheet, startRow, endRow, startCol, endCol) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      const cell = sheet.getRow(row).getCell(col);
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
    }
  }
}

function formatPercentColumn(sheet, startRow, endRow, column) {
  for (let row = startRow; row <= endRow; row += 1) {
    sheet.getCell(row, column).numFmt = '0.00"%"';
  }
}

function setReportTitle(sheet, lastColumn, subtitle) {
  const end = sheet.getColumn(lastColumn).letter;
  setMergedText(sheet, `A1:${end}1`, COLLEGE_NAME, {
    font: { name: 'Times New Roman', size: 14, bold: true },
  });
  sheet.getRow(1).height = 25;
  setMergedText(sheet, `A2:${end}2`, subtitle, {
    font: { name: 'Times New Roman', size: 12, bold: true },
  });
  sheet.getRow(2).height = 23;
}

function populateRows(sheet, rows, startRow, valuesForRow, startCol, endCol) {
  rows.forEach((row, index) => {
    setRowValues(sheet, startRow + index, valuesForRow(row, index));
  });
  if (rows.length) styleDataRows(sheet, startRow, startRow + rows.length - 1, startCol, endCol);
}

function createGraduationStatsSheet(workbook, data) {
  const sheet = workbook.addWorksheet('Graduation Statistics');
  setWidths(sheet, [10, 18, 24, 19, 20, 16]);
  setReportTitle(sheet, 6, 'RESULT ANALYSIS - Graduation Statics (Updated as on ___________)');
  [
    ['A4:A5', 'Sl. NO'],
    ['B4:B5', 'Batch'],
    ['C4:C5', 'Program'],
    ['D4:D5', 'Registered for S8'],
    ['E4:F4', 'Number of students'],
    ['E5', 'Graduated (Zero supply)'],
    ['F5', 'Graduation %'],
  ].forEach(([range, text]) => {
    if (range.includes(':')) setMergedText(sheet, range, text, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } }, font: { bold: true } });
    else sheet.getCell(range).value = text;
  });
  styleRange(sheet, 4, 1, 6, { header: true });
  styleRange(sheet, 5, 1, 6, { header: true });
  sheet.getRow(4).height = 25;
  sheet.getRow(5).height = 44;

  const rows = getRows(data);
  populateRows(sheet, rows, 6, (row, index) => [
    firstValue(row, 'sl_no') ?? index + 1,
    firstValue(row, 'batch', 'batch_label'),
    firstValue(row, 'program', 'program_code'),
    firstValue(row, 'registered_s8', 'registered'),
    firstValue(row, 'graduated_zero_supply', 'graduated'),
    firstValue(row, 'graduation_pct'),
  ], 1, 6);

  const total = data?.total ?? {};
  const totalRow = 6 + rows.length;
  setRowValues(sheet, totalRow, [
    'Total', '', '',
    firstValue(total, 'registered_s8') ?? rows.reduce((sum, row) => sum + Number(row.registered_s8 ?? row.registered ?? 0), 0),
    firstValue(total, 'graduated_zero_supply') ?? rows.reduce((sum, row) => sum + Number(row.graduated_zero_supply ?? row.graduated ?? 0), 0),
    firstValue(total, 'graduation_pct'),
  ]);
  styleDataRows(sheet, totalRow, totalRow, 1, 6);
  sheet.getRow(totalRow).eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
  });
  formatPercentColumn(sheet, 6, totalRow, 6);
  sheet.mergeCells(`A${totalRow}:C${totalRow}`);
  const footerRow = totalRow + 4;
  sheet.getCell(`B${footerRow}`).value = 'Academic Coordinator';
  sheet.getCell(`E${footerRow}`).value = 'Principal';
  sheet.getCell(`B${footerRow}`).alignment = { horizontal: 'center' };
  sheet.getCell(`E${footerRow}`).alignment = { horizontal: 'center' };
  return sheet;
}

function createProgramSemesterSheet(workbook, data) {
  const sheet = workbook.addWorksheet('Program Semester Wise');
  setWidths(sheet, [10, 23, 16, 13, 25, 20, 14]);
  setReportTitle(sheet, 7, 'Result Analysis - Program & Semester wise AY 2025-26');
  const headers = [
    'Sl No', 'Program', 'Batch', 'Semester',
    'Number of students Registered for the examination (Regular)',
    'Successfully passed', 'Pass %',
  ];
  setRowValues(sheet, 4, headers);
  styleRange(sheet, 4, 1, 7, { header: true });
  sheet.getRow(4).height = 58;
  const rows = getRows(data);
  populateRows(sheet, rows, 5, (row, index) => [
    firstValue(row, 'sl_no') ?? index + 1,
    firstValue(row, 'program', 'program_code'),
    firstValue(row, 'batch', 'batch_label'),
    firstValue(row, 'semester'),
    firstValue(row, 'registered'),
    firstValue(row, 'passed', 'successfully_passed'),
    firstValue(row, 'pass_pct'),
  ], 1, 7);
  const average = firstValue(data?.total, 'avg_pass_pct')
    ?? (rows.length ? rows.reduce((sum, row) => sum + Number(row.pass_pct ?? 0), 0) / rows.length : null);
  const totalRow = 5 + rows.length;
  setMergedText(sheet, `A${totalRow}:F${totalRow}`, 'Avg. percentage', {
    font: { name: 'Times New Roman', size: 11, bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  });
  sheet.getCell(`G${totalRow}`).value = average;
  styleRange(sheet, totalRow, 1, 7, { bold: true });
  formatPercentColumn(sheet, 5, totalRow, 7);
  const footerRow = totalRow + 2;
  setMergedText(sheet, `A${footerRow}:G${footerRow}`, 'Prof. M D Sreekumar / Principal / Nirmala College of Engineering', {
    alignment: { horizontal: 'right' },
    font: { name: 'Times New Roman', size: 11, bold: true },
  });
  return sheet;
}

function createFacultyHistorySheet(workbook, data) {
  const sheet = workbook.addWorksheet('Faculty Performance History');
  setWidths(sheet, [9, 15, 13, 17, 26, 13, 13, 12, 12, 12, 13, 17, 17, 18]);
  setReportTitle(sheet, 14, 'RESULT ANALYSIS - Faculty Performance History');
  setMergedText(sheet, 'A3:G3', `Name of the Faculty: ${data?.faculty?.name ?? '___________'}`, {
    alignment: { horizontal: 'left' },
  });
  setMergedText(sheet, 'H3:N3', `Dept.: ${data?.faculty?.department ?? '___________'}`, {
    alignment: { horizontal: 'right' },
  });
  [
    ['A5:A6', 'SL NO'], ['B5:B6', 'Batch'], ['C5:C6', 'AY'],
    ['D5:D6', 'Course Code'], ['E5:E6', 'Course Name'],
    ['F5:K5', 'Number of students'], ['L5:M5', 'Pass %'],
    ['N5:N6', 'Remarks'],
  ].forEach(([range, text]) => setMergedText(sheet, range, text, {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  }));
  ['Registered', 'Appeared', 'Absent', 'Pass', 'Fail', 'With held'].forEach((value, index) => {
    sheet.getCell(6, index + 6).value = value;
  });
  sheet.getCell('L6').value = 'w.r.t. Registered';
  sheet.getCell('M6').value = 'w.r.t. Appeared';
  styleRange(sheet, 5, 1, 14, { header: true });
  styleRange(sheet, 6, 1, 14, { header: true });
  sheet.getRow(5).height = 25;
  sheet.getRow(6).height = 42;
  const rows = getRows(data);
  populateRows(sheet, rows, 7, (row, index) => [
    firstValue(row, 'sl_no') ?? index + 1,
    firstValue(row, 'batch', 'batch_label'),
    firstValue(row, 'academic_year', 'ay'),
    firstValue(row, 'course_code'),
    firstValue(row, 'course_name', 'course_title'),
    firstValue(row, 'registered'),
    firstValue(row, 'appeared'),
    firstValue(row, 'absent'),
    firstValue(row, 'pass', 'passed'),
    firstValue(row, 'fail'),
    firstValue(row, 'withheld', 'with_held'),
    firstValue(row, 'pass_pct_registered', 'pass_pct_wrt_registered'),
    firstValue(row, 'pass_pct_appeared', 'pass_pct'),
    firstValue(row, 'remarks'),
  ], 1, 14);
  formatPercentColumn(sheet, 7, 6 + rows.length, 12);
  formatPercentColumn(sheet, 7, 6 + rows.length, 13);
  return sheet;
}

function createSupplementaryStatusSheet(workbook, data, context) {
  const sheet = workbook.addWorksheet('Supplementary Status');
  setWidths(sheet, [9, 19, 26, 9, 9, 9, 9, 9, 9, 9, 9, 11, 19, 12, 12]);
  setReportTitle(sheet, 15, 'RESULT ANALYSIS - Supplementary status');
  const program = firstValue(data?.header, 'program', 'program_name', 'program_code') ?? getFilterLabel(context, 'program_id') ?? '___________';
  const batch = firstValue(data?.header, 'batch', 'batch_label') ?? getFilterLabel(context, 'batch_id') ?? '___________';
  setMergedText(sheet, 'A3:F3', `Program ${program}`, { alignment: { horizontal: 'left' } });
  setMergedText(sheet, 'G3:O3', `Batch ${batch} (Updated as on ___________)`, { alignment: { horizontal: 'right' } });
  [
    ['A5:A6', 'SL. NO'], ['B5:B6', 'Register Number'], ['C5:C6', 'Name of the student'],
    ['D5:L5', 'Number of supplementary papers'],
    ['M5:M6', 'Total No. of courses'], ['N5:N6', 'C.G.P.A'],
  ].forEach(([range, text]) => setMergedText(sheet, range, text, {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  }));
  ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'Total'].forEach((value, index) => {
    sheet.getCell(6, index + 4).value = value;
  });
  styleRange(sheet, 5, 1, 14, { header: true });
  styleRange(sheet, 6, 1, 14, { header: true });
  sheet.getRow(5).height = 25;
  sheet.getRow(6).height = 34;
  const rows = getRows(data);
  populateRows(sheet, rows, 7, (row, index) => {
    const supply = row.supply ?? {};
    const semesterCounts = Array.from({ length: 8 }, (_, semester) => {
      const key = `S${semester + 1}`;
      return firstValue(supply, key, key.toLowerCase(), String(semester + 1)) ?? 0;
    });
    const totalSupply = firstValue(row, 'total_supply') ?? semesterCounts.reduce((sum, count) => sum + Number(count ?? 0), 0);
    return [
      firstValue(row, 'sl_no') ?? index + 1,
      firstValue(row, 'register_no', 'register_number'),
      firstValue(row, 'name', 'student_name'),
      ...semesterCounts,
      totalSupply,
      firstValue(row, 'total_courses', 'total_no_courses'),
      firstValue(row, 'cgpa'),
    ];
  }, 1, 14);

  const summaryHeaderRow = 8 + rows.length;
  setMergedText(sheet, `A${summaryHeaderRow}:C${summaryHeaderRow}`, 'Status', {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  });
  ['0 (NIL / ALL PASS)', '1', '2', '3', '4', '5', '6', '7', '8', 'Total']
    .forEach((value, index) => { sheet.getCell(summaryHeaderRow, index + 4).value = value; });
  styleRange(sheet, summaryHeaderRow, 1, 13, { header: true });
  const distribution = data?.supply_summary ?? data?.supply_distribution ?? data?.summary?.supply_distribution ?? {};
  const summaryRow = summaryHeaderRow + 1;
  setMergedText(sheet, `A${summaryRow}:C${summaryRow}`, 'Number of students with supply papers', {
    alignment: { horizontal: 'left' },
  });
  Array.from({ length: 9 }, (_, count) => (
    firstValue(distribution, String(count), `S${count}`, `s${count}`) ?? '?'
  )).concat(firstValue(distribution, 'total') ?? rows.length)
    .forEach((value, index) => { sheet.getCell(summaryRow, index + 4).value = value; });
  styleRange(sheet, summaryRow, 1, 13);
  sheet.getRow(summaryRow).height = 36;

  const actionRow = summaryRow + 3;
  [
    'Action Plans:',
    '1. Ensure that S all pass students do not get any supplementary till S8',
    '2. Support the students to clear the supplementary papers in the next chance.',
    '3. Class Tutors shall prepare the Plan for achieving graduation % not less than 75%',
  ].forEach((text, index) => {
    setMergedText(sheet, `A${actionRow + index}:O${actionRow + index}`, text, {
      alignment: { horizontal: 'left' },
      font: { name: 'Times New Roman', size: 11, bold: index === 0 },
    });
  });
  const signatureRow = actionRow + 6;
  setMergedText(sheet, `A${signatureRow}:D${signatureRow}`, 'Sign / Name');
  setMergedText(sheet, `F${signatureRow}:J${signatureRow}`, 'KTU Coordinator');
  setMergedText(sheet, `L${signatureRow}:O${signatureRow}`, 'Principal');
  return sheet;
}

function createCourseFacultySheet(workbook, data, context) {
  const sheet = workbook.addWorksheet('Course Faculty Performance');
  setWidths(sheet, [9, 17, 26, 22, 12, 12, 11, 11, 11, 13, 17, 17, 18, 10, 24]);
  setReportTitle(sheet, 13, 'RESULT ANALYSIS - Course wise Faculty wise Performance');
  const header = data?.header ?? {};
  setMergedText(sheet, 'A3:C3', `Program ${header.program ?? getFilterLabel(context, 'program_id') ?? '____'}`, { alignment: { horizontal: 'left' } });
  setMergedText(sheet, 'D3:F3', `Batch ${header.batch ?? getFilterLabel(context, 'batch_id') ?? '____'}`, { alignment: { horizontal: 'center' } });
  setMergedText(sheet, 'G3:I3', `AY ${header.academic_year ?? '____'}`, { alignment: { horizontal: 'center' } });
  setMergedText(sheet, 'J3:M3', `Semester ${header.semester ?? '____'}`, { alignment: { horizontal: 'right' } });
  [
    ['A5:A6', 'Sl No.'], ['B5:B6', 'Course Code'], ['C5:C6', 'Course Title'],
    ['D5:D6', 'Faculty assigned'], ['E5:J5', 'Number of students'],
    ['K5:L5', 'Pass %'], ['M5:M6', 'Remarks'],
  ].forEach(([range, text]) => setMergedText(sheet, range, text, {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  }));
  ['Registered', 'Appeared', 'Absent', 'Pass', 'Fail', 'With held'].forEach((value, index) => {
    sheet.getCell(6, index + 5).value = value;
  });
  sheet.getCell('K6').value = 'w.r.t. Registered';
  sheet.getCell('L6').value = 'w.r.t. Appeared';
  styleRange(sheet, 5, 1, 13, { header: true });
  styleRange(sheet, 6, 1, 13, { header: true });
  sheet.getRow(5).height = 25;
  sheet.getRow(6).height = 42;
  const rows = getRows(data);
  populateRows(sheet, rows, 7, (row, index) => [
    firstValue(row, 'sl_no') ?? index + 1,
    firstValue(row, 'course_code'),
    firstValue(row, 'course_title', 'course_name'),
    firstValue(row, 'faculty', 'faculty_name'),
    firstValue(row, 'registered'),
    firstValue(row, 'appeared'),
    firstValue(row, 'absent'),
    firstValue(row, 'pass', 'passed'),
    firstValue(row, 'fail'),
    firstValue(row, 'withheld', 'with_held'),
    firstValue(row, 'pass_pct_registered', 'pass_pct_wrt_registered'),
    firstValue(row, 'pass_pct_appeared', 'pass_pct'),
    firstValue(row, 'remarks'),
  ], 1, 13);
  formatPercentColumn(sheet, 7, 6 + rows.length, 11);
  formatPercentColumn(sheet, 7, 6 + rows.length, 12);

  const tableRow = 8 + rows.length;
  setMergedText(sheet, `A${tableRow}:C${tableRow}`, 'Status', {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  });
  ['0 (NIL / ALL PASS)', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'Total']
    .forEach((value, index) => { sheet.getCell(tableRow, index + 4).value = value; });
  styleRange(sheet, tableRow, 1, 13, { header: true });
  const overall = data?.overall ?? {};
  const summary = data?.summary ?? {};
  const distribution = data?.supply_summary ?? data?.supply_distribution ?? summary.supply_distribution ?? {};
  const summaryRows = [
    ['Number of students with supply papers', [
      firstValue(distribution, '0', 'S0', 'nil') ?? '?',
      ...Array.from({ length: 8 }, (_, index) => firstValue(distribution, `S${index + 1}`, `s${index + 1}`, String(index + 1)) ?? '?'),
      firstValue(distribution, 'total') ?? '?',
    ]],
    ['Number of students registered for the semester examination', [null, null, null, null, null, null, null, null, null, firstValue(overall, 'registered')]],
    ['Number of students appeared for all the examinations', [null, null, null, null, null, null, null, null, null, firstValue(overall, 'appeared')]],
    ['Number of students cleared all the courses', [null, null, null, null, null, null, null, null, null, firstValue(overall, 'cleared_all')]],
    ['CLASS ALL Pass percentage', [null, null, null, null, null, null, null, null, null, firstValue(overall, 'class_all_pass_pct')]],
  ];
  summaryRows.forEach(([label, values], index) => {
    const rowNumber = tableRow + index + 1;
    setMergedText(sheet, `A${rowNumber}:C${rowNumber}`, label, {
      alignment: { horizontal: 'left' },
    });
    values.forEach((value, valueIndex) => {
      sheet.getCell(rowNumber, valueIndex + 4).value = value;
    });
    styleRange(sheet, rowNumber, 1, 13);
    sheet.getRow(rowNumber).height = 34;
  });
  formatPercentColumn(sheet, tableRow + summaryRows.length, 13);

  const topperStart = tableRow + summaryRows.length + 2;
  setMergedText(sheet, `A${topperStart}:C${topperStart}`, 'Class Toppers', {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EDF3' } },
  });
  sheet.getRow(topperStart + 1).getCell(1).value = 'Rank';
  sheet.getRow(topperStart + 1).getCell(2).value = 'Name of the Student';
  sheet.getRow(topperStart + 1).getCell(3).value = 'SGPA';
  styleRange(sheet, topperStart + 1, 1, 3, { header: true });
  const toppers = Array.isArray(data?.toppers) ? data.toppers : [];
  [0, 1, 2].forEach((index) => {
    const topper = toppers[index] ?? {};
    const rowNumber = topperStart + index + 2;
    sheet.getRow(rowNumber).getCell(1).value = firstValue(topper, 'rank') ?? index + 1;
    sheet.getRow(rowNumber).getCell(2).value = firstValue(topper, 'name', 'student_name', 'register_no');
    sheet.getRow(rowNumber).getCell(3).value = firstValue(topper, 'sgpa');
  });
  styleDataRows(sheet, topperStart + 2, topperStart + 4, 1, 3);
  const signatureRow = topperStart + 6;
  setMergedText(sheet, `A${signatureRow}:D${signatureRow}`, 'Sign / Name');
  setMergedText(sheet, `F${signatureRow}:J${signatureRow}`, 'KTU Coordinator');
  setMergedText(sheet, `L${signatureRow}:O${signatureRow}`, 'Principal');
  return sheet;
}

export async function generateResultAnalysisExcel(reportId, data, context = {}) {
  const report = REPORT_SHEETS[reportId];
  if (!report) throw new Error(`Excel template is not available for report: ${reportId}`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nirmala College of Engineering Technology and Management';
  workbook.subject = report.name;
  workbook.title = report.name;
  workbook.created = new Date();
  const sheet = report.create(workbook, data ?? {}, context);
  sheet.views = [{ state: 'frozen', ySplit: reportId === 'graduation' || reportId === 'program-semester' ? 4 : 6 }];
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  sheet.properties.pageSetUpPr = { fitToPage: true };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportId}.xlsx`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generateResultAnalysisSampleWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nirmala College of Engineering Technology and Management';
  workbook.subject = 'Illustrative sample result analysis reports';
  workbook.title = 'Sample Result Analysis Reports';
  workbook.created = new Date();

  const sampleReports = {
    graduation: {
      rows: [
        { sl_no: 1, batch: '2021-25', program: 'B.Tech Computer Science', registered_s8: 60, graduated_zero_supply: 48, graduation_pct: 80 },
        { sl_no: 2, batch: '2021-25', program: 'B.Tech Electronics', registered_s8: 42, graduated_zero_supply: 33, graduation_pct: 78.57 },
      ],
      total: { registered_s8: 102, graduated_zero_supply: 81, graduation_pct: 79.41 },
    },
    'program-semester': {
      rows: [
        { sl_no: 1, program: 'B.Tech Computer Science', batch: '2022-26', semester: 6, registered: 58, passed: 49, pass_pct: 84.48 },
        { sl_no: 2, program: 'B.Tech Electronics', batch: '2022-26', semester: 6, registered: 40, passed: 32, pass_pct: 80 },
      ],
      total: { avg_pass_pct: 82.24 },
    },
    'faculty-history': {
      faculty: { name: 'Dr. Ananya Nair', department: 'Computer Science and Engineering' },
      rows: [
        { sl_no: 1, batch: '2021-25', academic_year: '2024-25', course_code: 'CST301', course_name: 'Formal Languages and Automata Theory', registered: 60, appeared: 58, absent: 2, pass: 51, fail: 7, withheld: 0, pass_pct_registered: 85, pass_pct_appeared: 87.93, remarks: 'Good' },
        { sl_no: 2, batch: '2022-26', academic_year: '2024-25', course_code: 'CST203', course_name: 'Computer Organization and Architecture', registered: 58, appeared: 56, absent: 2, pass: 49, fail: 7, withheld: 0, pass_pct_registered: 84.48, pass_pct_appeared: 87.5, remarks: 'Good' },
      ],
    },
    'supplementary-status': {
      header: { program: 'B.Tech Computer Science', batch: '2022-26' },
      rows: [
        { sl_no: 1, register_no: 'NCE22CS001', name: 'Aarav Menon', supply: { S1: 0, S2: 0, S3: 1, S4: 0, S5: 0, S6: 0, S7: 0, S8: 0 }, total_supply: 1, total_courses: 42, cgpa: 7.84 },
        { sl_no: 2, register_no: 'NCE22CS002', name: 'Diya Thomas', supply: { S1: 0, S2: 1, S3: 0, S4: 0, S5: 0, S6: 0, S7: 0, S8: 0 }, total_supply: 1, total_courses: 42, cgpa: 8.12 },
        { sl_no: 3, register_no: 'NCE22CS003', name: 'Ishan Varghese', supply: { S1: 0, S2: 0, S3: 0, S4: 0, S5: 0, S6: 0, S7: 0, S8: 0 }, total_supply: 0, total_courses: 42, cgpa: 9.02 },
      ],
      supply_distribution: { 0: 1, 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, total: 3 },
    },
    'course-faculty-performance': {
      header: { program: 'B.Tech Computer Science', batch: '2022-26', academic_year: '2024-25', semester: 6 },
      rows: [
        { sl_no: 1, course_code: 'CST301', course_title: 'Formal Languages and Automata Theory', faculty: 'Dr. Ananya Nair', registered: 58, appeared: 56, absent: 2, pass: 49, fail: 7, withheld: 0, pass_pct_registered: 84.48, pass_pct_appeared: 87.5, remarks: 'Good' },
        { sl_no: 2, course_code: 'CST303', course_title: 'Computer Networks', faculty: 'Prof. Rahul Das', registered: 58, appeared: 57, absent: 1, pass: 52, fail: 5, withheld: 0, pass_pct_registered: 89.66, pass_pct_appeared: 91.23, remarks: 'Very good' },
      ],
      overall: { registered: 58, appeared: 56, cleared_all: 46, class_all_pass_pct: 79.31 },
      supply_distribution: { 0: 46, S1: 5, S2: 4, S3: 2, S4: 1, S5: 0, S6: 0, S7: 0, S8: 0, total: 58 },
      toppers: [
        { rank: 1, name: 'Ishan Varghese', sgpa: 9.42 },
        { rank: 2, name: 'Diya Thomas', sgpa: 9.18 },
        { rank: 3, name: 'Aarav Menon', sgpa: 8.96 },
      ],
    },
  };

  Object.entries(REPORT_SHEETS).forEach(([reportId, report]) => {
    const sheet = report.create(workbook, sampleReports[reportId], {
      filters: { program_id: 'sample-program', batch_id: 'sample-batch' },
      filterOptions: {
        programs: [{ id: 'sample-program', label: 'B.Tech Computer Science' }],
        batches: [{ id: 'sample-batch', label: '2022-26' }],
      },
    });
    sheet.views = [{ state: 'frozen', ySplit: reportId === 'graduation' || reportId === 'program-semester' ? 4 : 6 }];
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    sheet.properties.pageSetUpPr = { fitToPage: true };
  });

  return workbook.xlsx.writeBuffer();
}
