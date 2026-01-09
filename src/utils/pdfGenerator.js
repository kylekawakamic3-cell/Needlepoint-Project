import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (canvas, patternStats) => {
    if (!canvas || !patternStats) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // --- PAGE 1: PATTERN OVERVIEW ---
    doc.setFontSize(22);
    doc.setTextColor(236, 72, 153); // Pink-600
    doc.text("Cross Stitch Pattern", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Generated on ${dateStr}`, pageWidth / 2, 30, { align: 'center' });

    // Pattern Stats
    doc.setFontSize(10);
    doc.text(`Size: ${patternStats.width} x ${patternStats.height} stitches`, pageWidth / 2, 40, { align: 'center' });
    doc.text(`Total Colors: ${patternStats.colors.length}`, pageWidth / 2, 45, { align: 'center' });

    // Add Pattern Image (Scaled to fit)
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);

    // Calculate scaling to fit page width (minus margins)
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - 100; // Leave space for header/footer

    let imgWidth = maxWidth;
    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
    }

    const xPos = (pageWidth - imgWidth) / 2;
    doc.addImage(imgData, 'PNG', xPos, 55, imgWidth, imgHeight);

    // --- PAGE 2: LEGEND ---
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Symbol Key & Material List", margin, 20);

    // Prepare table data
    const tableBody = patternStats.colors.map(c => [
        c.symbol,       // Symbol
        c.floss,        // DMC Number
        c.description,  // Name
        c.count,        // Stitches
        Math.ceil(c.count / 2000) // Skeins
    ]);

    autoTable(doc, {
        head: [['Symbol', 'DMC #', 'Color Name', 'Stitches', 'Skeins']],
        body: tableBody,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [236, 72, 153] }, // Pink header
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
            1: { fontStyle: 'bold' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        },
        didDrawCell: (data) => {
            // Draw color preview if needed? 
            // autoTable is strictly text/canvas based, tricky to draw rects easily inside without hooks.
            // For now, text is sufficient.
        }
    });

    // Save
    doc.save('cross-stitch-pattern.pdf');
};
