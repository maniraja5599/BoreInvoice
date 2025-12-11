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

        // Calculate dimensions to maintain aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

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
        const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });

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

const downloadLink = (url: string, name: string) => {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    link.click();
};


