import { type SlabRate, TELESCOPIC_RATES } from '../types';

export const calculateDrillingCost = (totalDepth: number, oldBoreDepth = 0, flushingRate = 0, rates: SlabRate[] = TELESCOPIC_RATES) => {
    let totalCost = 0;
    let breakdown: { range: string; depth: number; rate: number; amount: number }[] = [];

    // 1. Calculate Flushing / Re-bore Cost for the old depth
    if (oldBoreDepth > 0) {
        // The effective re-bore depth is min(totalDepth, oldBoreDepth) in case user enters total < old
        const reBoreDepth = Math.min(totalDepth, oldBoreDepth);
        if (reBoreDepth > 0) {
            const amount = reBoreDepth * flushingRate;
            totalCost += amount;
            breakdown.push({
                range: `0 - ${reBoreDepth}`,
                depth: reBoreDepth,
                rate: flushingRate,
                amount: amount
            });
        }
    }

    // 2. Calculate New Drilling Cost (Starting from Old Depth)
    const drillingStartDepth = Math.max(0, oldBoreDepth);

    // Iterate slabs to find new drilling footage
    for (const slab of rates) {
        // We only care if the Total Depth extends into this slab
        // AND if this slab is beyond the Old Bore Depth

        // The segment of this slab that we are drilling NEW:
        // Start: Max(slab.min, drillingStartDepth)
        // End: Min(slab.max, totalDepth)

        const effectiveStart = Math.max(slab.minDepth, drillingStartDepth);
        const effectiveEnd = Math.min(slab.maxDepth, totalDepth);

        if (effectiveEnd > effectiveStart) {
            const depthInSlab = effectiveEnd - effectiveStart;
            const amount = depthInSlab * slab.rate;
            totalCost += amount;
            breakdown.push({
                range: `${effectiveStart} - ${effectiveEnd}`,
                depth: depthInSlab,
                rate: slab.rate,
                amount: amount
            });
        }
    }

    return { totalCost, breakdown };
};
