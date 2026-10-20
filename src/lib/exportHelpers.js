// Shared CSV/PDF/DOCX export helpers, used by Student Management (all
// students, any class) and Dashboard (quiz results). One place for the
// three format implementations so adding a new export button anywhere
// else doesn't mean re-solving "how do I make a PDF" again.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from "docx";

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function exportCSV(headers, rows, filename) {
	let csvContent = headers.join(",") + "\n";
	rows.forEach((row) => {
		csvContent += row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",") + "\n";
	});
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	downloadBlob(blob, filename);
}

export function exportPDF(title, headers, rows, filename) {
	// Landscape when there are enough columns that portrait would crush
	// them — a wide student/quiz table is unreadable squeezed into
	// portrait's narrower width.
	const doc = new jsPDF(headers.length > 6 ? { orientation: "landscape" } : undefined);
	doc.setFontSize(14);
	doc.text(title, 14, 15);
	doc.setFontSize(9);
	doc.setTextColor(120);
	doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);
	autoTable(doc, {
		head: [headers],
		body: rows,
		startY: 26,
		styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
		headStyles: { fillColor: [108, 50, 236] }, // brand-600
		margin: { left: 10, right: 10 },
	});
	doc.save(filename);
}

export async function exportDOCX(title, headers, rows, filename) {
	const headerRow = new TableRow({
		tableHeader: true,
		children: headers.map(
			(h) =>
				new TableCell({
					shading: { fill: "6C32EC" },
					children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })] })],
				})
		),
	});
	const dataRows = rows.map(
		(row) =>
			new TableRow({
				children: row.map(
					(cell) => new TableCell({ children: [new Paragraph(String(cell ?? ""))] })
				),
			})
	);
	const doc = new Document({
		sections: [
			{
				children: [
					new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
					new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, spacing: { after: 300 } }),
					new Table({
						width: { size: 100, type: WidthType.PERCENTAGE },
						rows: [headerRow, ...dataRows],
					}),
				],
			},
		],
	});
	const blob = await Packer.toBlob(doc);
	downloadBlob(blob, filename);
}
