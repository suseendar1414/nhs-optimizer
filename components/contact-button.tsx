"use client"

import * as React from "react"
import { buttonVariants, Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Mail, Copy, X, ExternalLink } from "lucide-react"

interface ContactButtonProps {
    email: string
    subject?: string
    className?: string
    children?: React.ReactNode
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

export function ContactButton({
    email,
    subject = "Support Request",
    className,
    children,
    variant = "default",
    size = "default",
}: ContactButtonProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const encodedSubject = encodeURIComponent(subject);
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodedSubject}`;
    const outlookLink = `https://outlook.office.com/mail/deeplink/compose?to=${email}&subject=${encodedSubject}`;
    const defaultLink = `mailto:${email}?subject=${encodedSubject}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(buttonVariants({ variant, size }), className)}
            >
                {children || "Contact Support"}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold mb-1">Contact Support</h3>
                            <p className="text-sm text-slate-500">How would you like to email us?</p>
                        </div>

                        <div className="space-y-3">
                            <a
                                href={gmailLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start h-12 text-sm")}
                            >
                                <Mail className="mr-3 h-4 w-4 text-red-500" />
                                Open Gmail
                            </a>

                            <a
                                href={outlookLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start h-12 text-sm")}
                            >
                                <Mail className="mr-3 h-4 w-4 text-blue-500" />
                                Open Outlook
                            </a>

                            <a
                                href={defaultLink}
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start h-12 text-sm")}
                            >
                                <ExternalLink className="mr-3 h-4 w-4 text-slate-500" />
                                Open Default Mail App
                            </a>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or copy manually</span>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full h-12"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copied ? "Email Copied!" : email}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
