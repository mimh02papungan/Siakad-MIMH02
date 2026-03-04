import * as XLSX from "xlsx-js-style";

export const exportStyledExcel = (data: any[][], fileName: string, sheetName: string) => {
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Apply styles to all cells
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");

    // Default column widths
    const cols: any[] = [];
    for (let i = 0; i < data[0].length; i++) {
        cols.push({ wch: 15 }); // default width 15
    }

    // Adjust specific column widths based on content if needed
    // For now use default
    ws["!cols"] = cols;

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);

            if (!ws[cell_ref]) ws[cell_ref] = { t: "s", v: "" };

            const isHeader = R === 0;

            ws[cell_ref].s = {
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                },
                alignment: {
                    vertical: "center",
                    horizontal: isHeader ? "center" : "left",
                    wrapText: true
                },
                font: {
                    name: "Arial",
                    sz: 10,
                    bold: isHeader
                }
            };

            if (isHeader) {
                ws[cell_ref].s.fill = {
                    fgColor: { rgb: "4F81BD" } // A nice blue color for header
                };
                ws[cell_ref].s.font.color = { rgb: "FFFFFF" };
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
};
