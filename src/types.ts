export interface SlabRate {
    minDepth: number;
    maxDepth: number;
    rate: number;
}

export interface SlabRateProfile {
    name: string;
    rates: SlabRate[];
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface BorewellDetails {
    depth: number;
    casingDepth7: number;
    casingRate7: number;
    casingDepth10: number;
    casingRate10: number;
    bata: number;
    extraTime: number;
    transportCharges: number;
    discountAmount?: number;
    // For Repair Bore
    oldBoreDepth?: number;
    flushingRate?: number;
    drillingBuffer?: number; // Grace limit in feet (e.g. 10)
}

export interface CustomerDetails {
    name: string;
    phone: string;
    address: string;
    date: string;
    invoiceNumber: string;
}

export interface InvoiceData {
    id: string;
    customer: CustomerDetails;
    borewell: BorewellDetails;
    items: InvoiceItem[]; // Extra items like "Cap", "Motor", etc.
    totalAmount: number;
    createdAt: number;
    type?: 'Invoice' | 'Quotation';
    boreType?: 'New Bore' | 'Repair Bore';
    isDeleted?: boolean;
}

export const TELESCOPIC_RATES: SlabRate[] = [
    { minDepth: 0, maxDepth: 300, rate: 85 },
    { minDepth: 300, maxDepth: 400, rate: 90 },
    { minDepth: 400, maxDepth: 500, rate: 100 },
    { minDepth: 500, maxDepth: 600, rate: 120 },
    { minDepth: 600, maxDepth: 700, rate: 150 },
    { minDepth: 700, maxDepth: 800, rate: 190 },
    { minDepth: 800, maxDepth: 900, rate: 240 },
    { minDepth: 900, maxDepth: 1000, rate: 300 },
    { minDepth: 1000, maxDepth: 1100, rate: 400 },
    { minDepth: 1100, maxDepth: 1200, rate: 500 },
    { minDepth: 1200, maxDepth: 1300, rate: 600 },
];
