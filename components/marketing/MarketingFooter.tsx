import Link from "next/link";
import { Cow } from "@phosphor-icons/react/dist/ssr";

export default function MarketingFooter() {
  return (
    <footer>
      {/* Main footer */}
      <div className="bg-[#0a1610] px-6 lg:px-12 py-12">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                <Cow size={16} weight="fill" className="text-white" />
              </div>
              <span className="font-display text-[15px] text-white">
                Livestock Management and Health Tracking System
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              A digital platform developed to support Botswana&rsquo;s
              smallholder farmers with livestock health tracking, vaccination
              management, and BMC compliance reporting.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">
              Quick Links
            </p>
            <div className="space-y-1.5">
              <Link
                href="/login"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Login to System
              </Link>
              <Link
                href="/register"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Create Account
              </Link>
              <a
                href="#features"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#why"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                Why Use It
              </a>
              <a
                href="#preview"
                className="block text-sm text-white/50 hover:text-white transition-colors"
              >
                System Preview
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/25 px-6 lg:px-12 py-3.5 flex justify-center items-center text-xs text-white/25">
        <span>&copy; 2026 Livestock Management and Health Tracking System. All rights reserved.</span>
      </div>
    </footer>
  );
}
