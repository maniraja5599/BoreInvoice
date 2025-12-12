import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { calculateDrillingCost } from './calculator';

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
    const { customer, borewell, items, totalAmount, boreType } = invoice;

    // Calculate core drilling cost re-using the utility to get precise breakdown if needed, 
    // or just use the data we have if we trusted it. 
    // Since we don't store the sub-total for drilling specifically in the DB separate from the grand total (we just calculate it live usually),
    // Let's re-calculate it here for the text to be safe.
    const { totalCost: drillingCost } = calculateDrillingCost(
        borewell.depth,
        borewell.oldBoreDepth,
        borewell.flushingRate,
        borewell.appliedRates,
        borewell.drillingBuffer
    );

    let text = `🧾 *INVOICE DETAILS* 🧾\n`;
    text += `--------------------------------\n`;
    text += `👤 *${customer.name}*\n`;
    text += `📞 ${customer.phone || 'N/A'}\n`; // Check if phone exists
    text += `📍 ${customer.address ? customer.address.split(',')[0] : ''}\n`; // Short address
    text += `📅 ${customer.date}  |  #️⃣ ${customer.invoiceNumber.replace('INV-', '')}\n`;
    text += `--------------------------------\n\n`;

    // Bore Details
    text += `🏗️ *${boreType || 'Drilling'} Work*\n`;
    text += `🔹 Depth: *${borewell.depth} ft*\n`;
    text += `🔹 Drill Cost: ₹${drillingCost.toLocaleString()}\n`;

    // Casing
    if (borewell.casingDepth7 > 0) {
        text += `\n🔩 *7" Casing Pipe*\n`;
        text += `   ${borewell.casingDepth7} ft x ₹${borewell.casingRate7} = ₹${(borewell.casingDepth7 * borewell.casingRate7).toLocaleString()}\n`;
    }
    if (borewell.casingDepth10 > 0) {
        text += `\n🔩 *10" Casing Pipe*\n`;
        text += `   ${borewell.casingDepth10} ft x ₹${borewell.casingRate10} = ₹${(borewell.casingDepth10 * borewell.casingRate10).toLocaleString()}\n`;
    }

    // Other Charges
    if (borewell.bata > 0) text += `\n👷 Bata: ₹${borewell.bata.toLocaleString()}\n`;
    if (borewell.transportCharges > 0) text += `🚚 Transport: ₹${borewell.transportCharges.toLocaleString()}\n`;
    if (borewell.extraTime > 0) text += `⏱️ Extra Time: ₹${borewell.extraTime.toLocaleString()}\n`;

    // Items
    if (items && items.length > 0) {
        text += `\n📦 *Extra Items:*\n`;
        items.forEach((item: any) => {
            text += `   • ${item.description}: ${item.quantity} x ${item.rate} = ₹${item.amount.toLocaleString()}\n`;
        });
    }

    // Discount
    if (borewell.discountAmount > 0) {
        text += `\n🎁 *Discount:* -₹${borewell.discountAmount.toLocaleString()}\n`;
    }

    text += `\n--------------------------------\n`;
    text += `💰 *GRAND TOTAL: ₹${totalAmount.toLocaleString()}* 💰\n`;
    text += `--------------------------------\n`;
    text += `\n*Anjaneya Borewells* 🚜\n`;
    text += `Short of Water? Go Deeper! 💧\n`;
    text += `🌐 https://anjaneyaborewells.com/`;

    const phone = customer.phone ? `91${customer.phone}` : '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

const downloadLink = (url: string, name: string) => {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    link.click();
};


