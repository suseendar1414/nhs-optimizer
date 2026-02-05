import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { parseShiftScreenshot } from '@/lib/ocr';
import { calculateShiftScore } from '@/lib/scoring';

// Helper to convert Web Stream/Buffer to base64
async function fileToBase64(file: Blob): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return buffer.toString('base64');
}

export async function POST(request: Request) {
    const supabase = createClient();

    // 1. Auth Check - Ideally use getUser from server-auth helpers for security
    // For this prototype, we'll assume the client passes the session or we trust the anon key limits for now
    // In production, strictly validate the user session here.

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string; // Client passes ID for now

    if (!file || !userId) {
        return NextResponse.json({ error: 'File and User ID required' }, { status: 400 });
    }

    try {
        // 2. Upload to Supabase Storage
        const filename = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { data: storageData, error: storageError } = await supabase.storage
            .from('uploads')
            .upload(filename, file);

        if (storageError) {
            console.error('Storage upload error:', storageError);
            // We continue execution even if storage fails? 
            // Ideally yes for the user, but for training data collection we might want to warn.
            // For now, log and proceed, but we won't have an upload_id.
        }

        // 3. Create Upload Record in DB
        let uploadId = null;
        if (storageData) {
            const { data: uploadRecord, error: uploadDbError } = await supabase
                .from('uploads')
                .insert({
                    user_id: userId,
                    file_path: filename,
                    original_filename: file.name,
                    status: 'processing' // Initial status
                })
                .select()
                .single();

            if (uploadRecord) uploadId = uploadRecord.id;
        }

        // 4. Process with OCR
        const base64 = await fileToBase64(file);
        const shifts = await parseShiftScreenshot(base64);

        if (shifts.length === 0) {
            // Update upload status to failed if no shifts
            if (uploadId) await supabase.from('uploads').update({ status: 'failed' }).eq('id', uploadId);
            return NextResponse.json({ message: 'No shifts found in image' }, { status: 422 });
        }

        // Update upload status to completed
        if (uploadId) await supabase.from('uploads').update({ status: 'completed' }).eq('id', uploadId);

        // 5. Score and Save Shifts
        const processedShifts = [];

        // Fetch user profile for home location
        const { data: profile } = await supabase
            .from('profiles')
            .select('home_location')
            .eq('id', userId)
            .single();

        const homeLocation = profile?.home_location || 'London, UK'; // Default fallback

        for (const shift of shifts) {
            // Calculate duration
            const start = new Date(`1970-01-01T${shift.start_time}`);
            const end = new Date(`1970-01-01T${shift.end_time}`);
            let duration = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
            if (duration < 0) duration += 24; // Handle overnight

            // Validation Logic
            let status: 'available' | 'booked' | 'incomplete' = shift.status === 'booked' ? 'booked' : 'available';
            let validationError = null;

            // Only mark as incomplete if it's supposed to be available but missing data
            // If it's already 'booked', we might still want to accept it even if incomplete data, or flag it.
            // For now, let's keep the user's validation rules but respect 'booked'.

            if (status === 'available') {
                if (shift.pay_rate === 'unknown' || shift.pay_rate === 0) {
                    status = 'incomplete';
                    validationError = 'Rate not detected';
                }
                if (shift.start_time === 'unknown' || shift.end_time === 'unknown') {
                    status = 'incomplete';
                    validationError = 'Time not detected';
                }
            }

            let scores = {
                total_pay: 0,
                travel_cost: 0,
                travel_time_minutes: 0,
                roi_score: 0
            };

            // Only calculate scores if we have a valid rate and time
            if (typeof shift.pay_rate === 'number' && shift.start_time !== 'unknown' && shift.end_time !== 'unknown') {
                scores = await calculateShiftScore(
                    homeLocation,
                    shift.hospital_name === 'unknown' ? 'London' : shift.hospital_name,
                    shift.pay_rate,
                    duration
                );
            }

            const { data: insertedShift, error } = await supabase.from('shifts').insert({
                user_id: userId,
                upload_id: uploadId, // Link to the source image
                hospital_name: shift.hospital_name,
                ward_name: shift.ward_name,
                shift_date: shift.shift_date,
                start_time: shift.start_time,
                end_time: shift.end_time,
                pay_rate: shift.pay_rate,
                total_pay: scores.total_pay,
                travel_time_minutes: scores.travel_time_minutes,
                travel_distance_km: 0, // Mock for now or add to scoring
                roi_score: scores.roi_score,
                status: status as any, // 'available' | 'incomplete' | 'booked'
                validation_error: validationError // Add validation error if any
            }).select().single();

            if (!error) {
                processedShifts.push(insertedShift);
            }
        }

        return NextResponse.json({ success: true, shifts: processedShifts });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
