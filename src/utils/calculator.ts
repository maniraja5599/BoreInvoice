import { type SlabRate, TELESCOPIC_RATES } from '../types';

export const calculateDrillingCost = (totalDepth: number, oldBoreDepth = 0, flushingRate = 0, rates: SlabRate[] = TELESCOPIC_RATES, bufferLimit = 0) => {
    let totalCost = 0;
    let breakdown: { range: string; depth: number; rate: number; amount: number }[] = [];

    // 1. Calculate Flushing / Re-bore Cost
    if (oldBoreDepth > 0) {
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

    // 2. Prepare Effective Rates (Handle Buffer Logic)
    // We clone rates to avoid mutating the global constant if passed
    let effectiveRates = rates.map(r => ({ ...r }));

    // Check if we need to apply buffer
    if (bufferLimit > 0) {
        for (let i = 0; i < effectiveRates.length; i++) {
            const slab = effectiveRates[i];
            const nextSlab = effectiveRates[i + 1];

            // Condition: Total Depth is just slightly above this slab's max, but within buffer
            // And this is NOT the last slab (if it's the last slab, maxDepth might be Infinity or irrelevant)
            if (totalDepth > slab.maxDepth && totalDepth <= slab.maxDepth + bufferLimit) {
                // Extend this slab to cover the extra depth
                slab.maxDepth = totalDepth;

                // If there is a next slab, push its start forward to avoid overlap
                if (nextSlab) {
                    nextSlab.minDepth = totalDepth;
                }

                // We typically only apply this once for the specific boundary we are crossing
                break;
            }
        }
    }

    // 3. Calculate Drilling Cost
    const drillingStartDepth = Math.max(0, oldBoreDepth);

    for (const slab of effectiveRates) {
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
