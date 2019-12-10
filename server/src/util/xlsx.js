import xlsxToJson from 'xlsx-to-json';
import XLSX from 'xlsx';

const toJSON = async (path) => new Promise((resolve, reject) => {
  xlsxToJson({
    input: path,
    output: null,
  }, (error, result) => {
    if (error) reject(error);
    resolve(result);
  });
});

const toArray = (path) => {
  const workbook = XLSX.readFile(path);
  const sheetNames = workbook.SheetNames;
  const workSheet = workbook.Sheets[sheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(workSheet);
  const result = rows.map((x) => Object.values(x));
  return result;
};

const xlsxUtil = {
  toJSON,
  toArray,
};

export default xlsxUtil;
