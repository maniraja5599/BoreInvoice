import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const generateAndSharePdf = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // html-to-image handles modern CSS (like oklch) much better than html2canvas
        const imgData = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();

        // Calculate dimensions to maintain aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        let finalPdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If height exceeds A4 page height, scale it down to fit
        if (finalPdfHeight > pdfPageHeight) {
            finalPdfHeight = pdfPageHeight;
            // We also need to adjust width to maintain aspect ratio effectively, 
            // but addImage takes width/height args. 
            // If we set strict height, we should adjust width too?
            // Actually, usually we want to fit width 100%. 
            // If it's too tall, we must choose: 2 pages OR shrink.
            // User likely wants single page.

            // Let's recalculate based on fitting height:
            const scaledWidth = (imgProps.width * pdfPageHeight) / imgProps.height;
            // Center it horizontally
            const xOffset = (pdfWidth - scaledWidth) / 2;
            pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, finalPdfHeight);
        } else {
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalPdfHeight);
        }

        const blob = pdf.output('blob');
        const file = new File([blob], fileName, { type: 'application/pdf' });

        const shareData = {
            files: [file],
            title: 'Borewell Invoice',
            text: 'Please find the attached invoice.',
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (shareError: any) {
                if (shareError.name !== 'AbortError') {
                    console.warn("Sharing failed, falling back to download:", shareError);
                    pdf.save(fileName);
                }
            }
        } else {
            pdf.save(fileName);
        }
    } catch (error: any) {
        console.error("Error generating PDF:", error);
        alert(`Failed to generate PDF: ${error.message || error}`);
    }
};

export const generateAndShareImage = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const dataUrl = await toPng(element, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            style: {
                width: '800px',
                maxWidth: 'none',
                height: 'auto',
                overflow: 'visible' // Ensure no clipping
            }
        });

        // Convert to blob for sharing
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName.replace('.pdf', '.png'), { type: 'image/png' });

        const shareData = {
            files: [file],
            title: 'Borewell Invoice',
            text: 'Please find the attached invoice details.',
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (shareError: any) {
                if (shareError.name !== 'AbortError') {
                    console.warn("Sharing failed, falling back to download:", shareError);
                    downloadLink(dataUrl, fileName.replace('.pdf', '.png'));
                }
            }
        } else {
            downloadLink(dataUrl, fileName.replace('.pdf', '.png'));
        }

    } catch (error) {
        console.error("Error generating Image:", error);
        alert("Failed to generate image.");
    }
};

export const generateWhatsAppLink = (invoice: any) => {
    const text = `*INVOICE DETAILS*
----------------
*Customer:* ${invoice.customer.name}
*Invoice #:* ${invoice.customer.invoiceNumber}
*Date:* ${invoice.customer.date}
*Amount:* ₹${invoice.totalAmount.toLocaleString()}
----------------
*Anjaneya Borewells*`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

const downloadLink = (url: string, name: string) => {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    link.click();
};


