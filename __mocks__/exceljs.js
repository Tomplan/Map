// Lightweight mock of exceljs Workbook used in tests
class WorkbookMock {
  constructor() {
    this._sheet = null;
    this.xlsx = {
      async writeBuffer() {
        return new ArrayBuffer(8);
      },
    };
  }
  addWorksheet(name) {
    const ws = {
      name,
      columns: null,
      rows: [],
      views: null,
      _cells: {},
      rowCount: 0,
      addRows(r) {
        this.rows.push(...r);
        this.rowCount = this.rows.length + 1;
      },
      getRow(rowNumber) {
        return {
          getCell: (colNumber) => {
            const key = `${rowNumber}:${colNumber}`;
            if (!ws._cells[key]) ws._cells[key] = { value: undefined, protection: {} };
            return ws._cells[key];
          },
        };
      },
      protect(password, opts) {
        this._protected = { password, opts };
      },
    };
    this._sheet = ws;
    return ws;
  }
}

module.exports = {
  Workbook: WorkbookMock,
  default: { Workbook: WorkbookMock },
};
