import { googleMapsClient } from './maps';

export type ShiftScore = {
    total_pay: number;
    travel_cost: number;
    net_profit: number;
    travel_time_minutes: number;
    roi_score: number; // Hourly profit effectively
}

export async function calculateShiftScore(
    origin: string,
    destination: string,
    hourlyRate: number,
    shiftDurationHours: number
): Promise<ShiftScore> {
    // 1. Get Distance and Duration from Google Maps
    // In a real implementation, we would call the Google Maps API here.
    // For now, I'll mock it or use the client if keys were present.
    // Since keys are not present in the environment yet, I will add the logic but handle the missing key case gracefully or mock for dev.

    let travelTimeMinutes = 30; // Default mock
    let distanceKm = 5; // Default mock

    if (process.env.GOOGLE_MAPS_API_KEY) {
        try {
            const response = await googleMapsClient.distancematrix({
                params: {
                    origins: [origin],
                    destinations: [destination],
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    mode: 'driving' as any // Temporary fix as importing enum across files might be tricky if not exported from maps.ts
                }
            });
            if (response.data.rows[0].elements[0].status === 'OK') {
                const element = response.data.rows[0].elements[0];
                travelTimeMinutes = Math.round(element.duration.value / 60);
                distanceKm = element.distance.value / 1000;
            }
        } catch (e) {
            console.error("Google Maps API Error", e);
        }
    }

    // 2. Calculate Costs
    const fuelCostPerKm = 0.15; // Average UK fuel cost
    const travelCost = distanceKm * fuelCostPerKm * 2; // Round trip

    // 3. Calculate Earnings
    const totalPay = hourlyRate * shiftDurationHours;
    const netProfit = totalPay - travelCost;

    // 4. Calculate ROI (Effective Hourly Rate including travel time)
    const totalTimeHours = shiftDurationHours + (travelTimeMinutes * 2 / 60);
    const roiScore = netProfit / totalTimeHours;

    return {
        total_pay: parseFloat(totalPay.toFixed(2)),
        travel_cost: parseFloat(travelCost.toFixed(2)),
        net_profit: parseFloat(netProfit.toFixed(2)),
        travel_time_minutes: travelTimeMinutes,
        roi_score: parseFloat(roiScore.toFixed(2))
    };
}
