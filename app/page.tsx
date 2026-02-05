import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ContactButton } from "@/components/contact-button";

import { SUPPORT_EMAIL } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center space-y-6">
      <div className="max-w-2xl space-y-4">
        {/* ... (keep existing header) ... */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          Shift Sense
        </h1>
        <p className="text-xl text-slate-300">
          Upload NHS shift screenshots → see which 5 shifts give you the best pay after travel.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 text-lg">
            <Link href="/login">Get Started Free</Link>
          </Button>
          <ContactButton
            email={SUPPORT_EMAIL}
            subject="NHS Shift Optimizer Question"
            variant="outline"
            size="lg"
            className="text-slate-200 border-slate-700 hover:bg-slate-800 px-8 py-6 text-lg"
          >
            Contact Dev
          </ContactButton>
        </div>
      </div>

      <div className="mt-20 opacity-50 text-sm">
        <p>Built for NHS Bank Staff at Guys, St Thomas, and Kings.</p>
      </div>
    </div>
  );
}
