import Link from "next/link";
import { Sprout, Mail, User, GraduationCap } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer>
      {/* Main footer */}
      <div className="bg-[#0a1610] px-6 lg:px-12 py-12">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-[15px] text-white">
                Livestock Management System
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              A digital platform developed to support Botswana&rsquo;s
              smallholder farmers with livestock health tracking, vaccination
              management, and BMC compliance reporting.
            </p>
          </div>

          {/* Quick Links */}
          <div>
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

          {/* Contact */}
          <div>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">
              Contact
            </p>
            <div className="text-sm text-white/40 leading-relaxed space-y-1">
              <p>University of Botswana</p>
              <p>Department of Computer Science</p>
              <p>Private Bag 0022, Gaborone</p>
              <div className="pt-2 space-y-1">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <a
                    href="mailto:support@livestock.bw"
                    className="text-gold-light hover:text-gold transition-colors"
                  >
                    support@livestock.bw
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Refilwe Sengate (201805029)
                </p>
                <p className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Ms Leburu-Dingalo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/25 px-6 lg:px-12 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/25">
        <span>&copy; 2026 Livestock Management &amp; Health Tracking System</span>
        <span>University of Botswana &middot; Department of Computer Science</span>
      </div>
    </footer>
  );
}
