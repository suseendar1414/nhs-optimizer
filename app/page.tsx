import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center space-y-6">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          NHS Shift Hero
        </h1>
        <p className="text-xl text-slate-300">
          Stop shift-hunting. Start earning. We analyze shift screenshots to find your most profitable work in seconds.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 text-lg">
            <Link href="/login">Get Started Free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-black border-slate-700 hover:bg-slate-800 px-8 py-6 text-lg">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>

      <div className="mt-20 opacity-50 text-sm">
        <p>Built for NHS Bank Staff at Guys, St Thomas, and Kings.</p>
      </div>
    </div>
  );
}
