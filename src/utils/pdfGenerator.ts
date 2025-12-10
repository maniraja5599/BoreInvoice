import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateAndSharePdf = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

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
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], fileName.replace('.pdf', '.png'), { type: 'image/png' });

            const shareData = {
                files: [file],
                title: 'Borewell Invoice',
                text: 'Please find the attached invoice details.',
            };

            // Enhanced sharing logic
            if (navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                } catch (shareError: any) {
                    if (shareError.name !== 'AbortError') {
                        console.warn("Sharing failed, falling back to download:", shareError);
                        downloadLink(canvas.toDataURL('image/png'), fileName.replace('.pdf', '.png'));
                    }
                }
            } else {
                // Fallback for desktop or non-supported browsers
                downloadLink(canvas.toDataURL('image/png'), fileName.replace('.pdf', '.png'));
            }
        }, 'image/png');

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


