'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bell, Home, Settings, Upload, LogOut, Loader2, FileText, TrendingUp, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { type Shift } from '@/types/database';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { ContactButton } from '@/components/contact-button';

export default function DashboardPage() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [debugData, setDebugData] = useState<any>(null); // For raw JSON panel
    const [showDebug, setShowDebug] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [homeLocation, setHomeLocation] = useState('London'); // Default to London
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                // Fetch existing shifts
                const { data } = await supabase.from('shifts').select('*').order('created_at', { ascending: false });
                if (data) setShifts(data);
            }
        };
        getUser();
    }, [supabase, router]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !user) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const formData = new FormData();
        files.forEach((file) => formData.append('file', file));
        formData.append('userId', user.id);
        formData.append('homeLocation', homeLocation);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Shifts parsed:', data.shifts);
                setDebugData(data.raw_ocr); // Set raw data for debug panel
                setShowDebug(true); // Auto-open for feedback
                // Add new shifts to the list (or refetch)
                const { data: latestShifts } = await supabase.from('shifts').select('*').order('created_at', { ascending: false });
                if (latestShifts) setShifts(latestShifts);
            } else {
                console.error('Upload failed:', data.error || data.message);
                alert('Upload failed: ' + (data.error || data.message));
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert('An error occurred during upload.');
        } finally {
            setUploading(false);
            // Reset input if needed, though simple logic suffices for MVP
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    // derived stats
    const totalPotentialEarnings = shifts.reduce((acc, shift) => acc + (shift.total_pay || 0), 0);
    const avgRoi = shifts.length > 0 ? (shifts.reduce((acc, s) => acc + (s.roi_score || 0), 0) / shifts.length).toFixed(2) : '0.00';

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        Shift Sense
                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-blue-200">BETA</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                        This is an early beta. Some shifts may be misread – please use “Report Issue” so I can improve it.
                    </p>
                    <div className="mt-4">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Home Postcode</label>
                        <Input
                            value={homeLocation}
                            onChange={(e) => setHomeLocation(e.target.value)}
                            placeholder="e.g. SE1 7EH"
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start bg-slate-100 dark:bg-slate-800">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <ContactButton
                            email={SUPPORT_EMAIL}
                            subject="Help with Shift Sense"
                            variant="ghost"
                            className="w-full justify-start text-slate-500 hover:text-blue-600"
                        >
                            <span className="flex items-center">
                                <Briefcase className="mr-2 h-4 w-4" />
                                Contact Support
                            </span>
                        </ContactButton>
                    </div>
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
                    <h2 className="text-lg font-semibold">Dashboard</h2>
                </header>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Shifts Found</CardTitle>
                                <Briefcase className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{shifts.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Potential Earnings</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">£{totalPotentialEarnings.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ROI Score Avg</CardTitle>
                                <div className="text-xs font-bold text-blue-500">£/hr</div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{avgRoi}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Recent Shifts (Sorted by Value)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {shifts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                        <FileText className="h-8 w-8 mb-2 opacity-50" />
                                        <p>No shifts uploaded yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {shifts.map((shift) => (
                                            <div key={shift.id} className={cn(
                                                "flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800",
                                                shift.status === 'incomplete' && "border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                                            )}>
                                                <div>
                                                    <p className="font-semibold">
                                                        {shift.hospital_name || <span className="text-red-500 italic">Unknown Hospital</span>} - {shift.ward_name}
                                                        {shift.status === 'incomplete' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">Needs Review</span>}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {shift.shift_date || "Date?"} |
                                                        {shift.start_time || "?"} - {shift.end_time || "?"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {shift.status === 'incomplete' ? (
                                                        <p className="text-sm font-medium text-red-600">--</p>
                                                    ) : (
                                                        <p className="font-bold text-green-600">£{shift.total_pay?.toFixed(2)}</p>
                                                    )}
                                                    <p className="text-xs text-slate-400">
                                                        {shift.pay_rate ? `£${shift.pay_rate}/hr` : <span className="text-red-500">Rate missing</span>}
                                                    </p>
                                                    {shift.status === 'incomplete' && (
                                                        <a
                                                            href={`mailto:${SUPPORT_EMAIL}?subject=OCR%20Failed%20for%20Shift%20${shift.id}&body=The%20AI%20missed%20details%20for%20this%20shift.%0A%0A Raw%20Text:%20${encodeURIComponent(shift.raw_text || '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-blue-500 underline hover:text-blue-700 block mt-1"
                                                        >
                                                            👎 Report Issue
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload Screenshot</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg h-48 flex flex-col items-center justify-center text-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {uploading ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                                            <p className="text-sm font-medium text-blue-600">Analyzing Shift...</p>
                                            <p className="text-xs text-slate-500">Extracting pay & calculating travel</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                            <p className="text-sm font-medium">Click to Upload</p>
                                            <p className="text-xs text-slate-500 mt-1">Supports Multiple PNG, JPG (e.g., WhatsApp Screenshots)</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Debug Panel - Raw JSON */}
                    {showDebug && debugData && (
                        <Card className="mt-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-400">Claude Vision Output (Debug)</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)} className="h-6 w-6 p-0 text-amber-800 hover:bg-amber-200"><LogOut className="h-4 w-4 rotate-45" /></Button>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs font-mono overflow-auto bg-white dark:bg-slate-950 p-4 rounded border border-amber-100 dark:border-amber-900 shadow-inner max-h-64">
                                    {JSON.stringify(debugData, null, 2)}
                                </pre>
                                <p className="text-xs text-amber-700 mt-2">
                                    *This raw data is what the AI extracted before our scoring logic found fields missing.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
