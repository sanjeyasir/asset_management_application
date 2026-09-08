const ExcelJS = require('exceljs');

async function main() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('public/AssetSample.xlsx');
    console.log('Worksheet count:', workbook.worksheets.length);
    workbook.worksheets.forEach((sheet) => {
      console.log('Sheet Name:', sheet.name, 'Rows:', sheet.rowCount, 'Cols:', sheet.columnCount);
      const rows = [];
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 3) {
          rows.push({ rowNumber, values: row.values });
        }
      });
      console.log('Sample rows for ' + sheet.name + ':', JSON.stringify(rows));
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
