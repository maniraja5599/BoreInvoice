import { forwardRef } from 'react';
import type { InvoiceData } from '../types';
import { calculateDrillingCost } from '../utils/calculator';
// import { Droplet } from 'lucide-react';
import { useInvoices } from '../context/InvoiceContext';
import { numberToWords } from '../utils/numberToWords';

interface Props {
    data: InvoiceData;
}

const InvoicePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
    const { totalCost, breakdown } = calculateDrillingCost(data.borewell.depth, data.borewell.oldBoreDepth, data.borewell.flushingRate);
    const { logo } = useInvoices();


    // Calculate casing cost
    const casing7Cost = (data.borewell.casingDepth7 || 0) * (data.borewell.casingRate7 || 0);
    const casing10Cost = (data.borewell.casingDepth10 || 0) * (data.borewell.casingRate10 || 0);

    // Calculate extra items total
    const itemsTotal = data.items.reduce((sum, item) => sum + item.amount, 0);

    // Grand Total
    const grandTotal = (totalCost + casing7Cost + casing10Cost +
        (data.borewell.transportCharges || 0) +
        (data.borewell.bata || 0) +
        (data.borewell.extraTime || 0) +
        itemsTotal) - (data.borewell.discountAmount || 0);

    let sNo = 1;

    return (
        <div ref={ref} className="bg-white p-6 max-w-2xl mx-auto text-xs border shadow-xl print:shadow-none print:border-none font-sans" id="invoice-preview">
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-[#009900] pb-4 mb-4">
                <div className="flex gap-4 items-center">
                    {logo ? (
                        <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                            No Logo
                        </div>
                    )}
                    <div>
                        <h1 className="text-base md:text-xl font-normal text-[#009900] tracking-wider leading-tight" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                            ANJANEYA BO<span className="text-red-600">R</span>EWELLS
                        </h1>
                        <p className="text-gray-600 font-bold text-xs uppercase tracking-wider">ஆழமான நம்பிக்கை!..</p>
                        <div className="mt-1 text-[10px] text-gray-600 space-y-0.5 leading-tight">
                            <p className="font-medium">6/906-1, Sri Mahal Thirumana Mandapam</p>
                            <p>Trichy Road, Namakkal, Tamil Nadu 637001</p>
                            <p className="font-bold text-primary pt-1">Ph: 96596-57777, 94433-73573</p>
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="bg-gray-800 text-white px-3 py-1 rounded-md mb-2 shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-widest">{data.type || 'INVOICE'}</h2>
                    </div>
                    {data.boreType && (
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-2">
                            {data.boreType}
                        </span>
                    )}
                    <p className="text-gray-600 font-medium text-xs">#{data.customer.invoiceNumber}</p>
                    <p className="text-gray-500 text-xs">{data.customer.date}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 bg-slate-50 p-2 rounded">
                <h3 className="font-semibold text-gray-700 mb-1 border-b border-gray-200 pb-0.5">Bill To:</h3>
                <p className="font-bold text-sm">{data.customer.name}</p>
                <p>{data.customer.address}</p>
                <p>Ph: {data.customer.phone}</p>
            </div>

            {/* Table */}
            <div className="mb-6">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-primary text-white">
                            <th className="p-1 w-10">S.No</th>
                            <th className="p-1">Description</th>
                            <th className="p-1 text-right whitespace-nowrap">Qty / Depth</th>
                            <th className="p-1 text-right whitespace-nowrap">Rate</th>
                            <th className="p-1 text-right whitespace-nowrap">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Drilling Charges Breakdown */}
                        <tr className="bg-gray-50">
                            <td className="p-1 font-bold" colSpan={5}>Drilling Format Details (Total Depth: {data.borewell.depth} ft)</td>
                        </tr>
                        {breakdown.map((slab, index) => (
                            <tr key={index}>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1 whitespace-nowrap">{slab.range} ft</td>
                                <td className="p-1 text-right whitespace-nowrap">{slab.depth} ft</td>
                                <td className="p-1 text-right whitespace-nowrap">{slab.rate}/ft</td>
                                <td className="p-1 text-right whitespace-nowrap">{slab.amount.toLocaleString()}</td>
                            </tr>
                        ))}

                        {/* 7" Casing */}
                        {(data.borewell.casingDepth7 || 0) > 0 && (
                            <tr>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1">7" PVC Casing Pipe</td>
                                <td className="p-1 text-right whitespace-nowrap">{data.borewell.casingDepth7} ft</td>
                                <td className="p-1 text-right whitespace-nowrap">{data.borewell.casingRate7}</td>
                                <td className="p-1 text-right whitespace-nowrap">{casing7Cost.toLocaleString()}</td>
                            </tr>
                        )}

                        {/* 10" Casing */}
                        {(data.borewell.casingDepth10 || 0) > 0 && (
                            <tr>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1">10" PVC Casing Pipe</td>
                                <td className="p-1 text-right whitespace-nowrap">{data.borewell.casingDepth10} ft</td>
                                <td className="p-1 text-right whitespace-nowrap">{data.borewell.casingRate10}</td>
                                <td className="p-1 text-right whitespace-nowrap">{casing10Cost.toLocaleString()}</td>
                            </tr>
                        )}

                        {/* Other Charges */}
                        {data.borewell.bata > 0 && (
                            <tr>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1">Bata</td>
                                <td className="p-1 text-right">-</td>
                                <td className="p-1 text-right">-</td>
                                <td className="p-1 text-right">{data.borewell.bata.toLocaleString()}</td>
                            </tr>
                        )}
                        {data.borewell.transportCharges > 0 && (
                            <tr>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1">Transport Charges</td>
                                <td className="p-1 text-right">-</td>
                                <td className="p-1 text-right">-</td>
                                <td className="p-1 text-right">{data.borewell.transportCharges.toLocaleString()}</td>
                            </tr>
                        )}
                        {data.borewell.extraTime > 0 && (
                            <tr>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1">Extra Time</td>
                                <td className="p-1 text-right">-</td>
                                <td className="p-1 text-right">-</td>
                                <td className="p-1 text-right">{data.borewell.extraTime.toLocaleString()}</td>
                            </tr>
                        )}

                        {/* Extra Items */}
                        {data.items.map((item) => (
                            <tr key={item.id}>
                                <td className="p-1">{sNo++}</td>
                                <td className="p-1">{item.description}</td>
                                <td className="p-1 text-right whitespace-nowrap">{item.quantity}</td>
                                <td className="p-1 text-right whitespace-nowrap">{item.rate}</td>
                                <td className="p-1 text-right whitespace-nowrap">{item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        {data.borewell.discountAmount && data.borewell.discountAmount > 0 && (
                            <tr className="bg-red-50 text-red-600">
                                <td className="p-2 text-right font-medium" colSpan={4}>Less: Discount</td>
                                <td className="p-2 text-right whitespace-nowrap">- ₹{data.borewell.discountAmount.toLocaleString()}</td>
                            </tr>
                        )}
                        <tr className="bg-gray-100 font-bold text-base">
                            <td className="p-2 text-right" colSpan={4}>Grand Total</td>
                            <td className="p-2 text-right text-primary whitespace-nowrap">₹{grandTotal.toLocaleString()}</td>
                        </tr>
                        <tr className="bg-white">
                            <td className="p-2 text-left font-semibold text-gray-600 border-t" colSpan={5}>
                                <span className="text-[10px] text-gray-500 font-normal">Amount in Words:</span><br />
                                {numberToWords(Math.round(grandTotal))} Rupees Only
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t-2 border-[#009900] text-center">
                <h4 className="text-primary font-bold text-sm">Thank You for Choosing Anjaneya Borewells!</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Water is Life • Save Water • Save Earth</p>
                <div className="mt-1 text-[8px] text-gray-400">
                    Computer Generated Invoice
                </div>
            </div>
        </div >
    );
});

export default InvoicePreview;
