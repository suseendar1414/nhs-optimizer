export type Profile = {
    id: string
    email: string | null
    full_name: string | null
    home_location: string | null
    transport_mode: 'driving' | 'transit' | 'bicycling' | 'walking'
    hourly_band_rate: number | null
    created_at: string
}

export type Upload = {
    id: string
    user_id: string
    file_path: string
    status: 'processing' | 'completed' | 'failed'
    original_filename: string | null
    created_at: string
}

export type Shift = {
    id: string
    user_id: string
    upload_id: string | null
    hospital_name: string | null
    ward_name: string | null
    shift_date: string | null
    start_time: string | null
    end_time: string | null
    pay_rate: number | null
    total_pay: number | null
    travel_time_minutes: number | null
    travel_distance_km: number | null
    roi_score: number | null
    raw_text: string | null
    status: 'available' | 'applied' | 'booked' | 'incomplete'
    created_at: string
}

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: Partial<Profile>
                Update: Partial<Profile>
            }
            uploads: {
                Row: Upload
                Insert: Partial<Upload>
                Update: Partial<Upload>
            }
            shifts: {
                Row: Shift
                Insert: Partial<Shift>
                Update: Partial<Shift>
            }
        }
    }
}
