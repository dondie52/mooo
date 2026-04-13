import Link from "next/link";
import { KeyRound, ClipboardList, Eye } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 relative overflow-hidden bg-forest-deep"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
    >
      {/* Headline */}
      <h1
        className="font-display text-white font-semibold leading-[1.1] mb-5 max-w-3xl animate-fade-up"
        style={{
          fontSize: "clamp(36px, 6vw, 66px)",
          animationDelay: "100ms",
        }}
      >
        Empowering Botswana&rsquo;s
        <br />
        <span className="text-gold-light">Farmers</span> with Digital Tools
      </h1>

      {/* Subhead */}
      <p
        className="text-white/70 max-w-xl mb-10 animate-fade-up"
        style={{
          fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.7,
          animationDelay: "200ms",
        }}
      >
        A digital platform for smallholder farmers to manage livestock records,
        track vaccinations, monitor animal health, and meet BMC compliance
        requirements.
      </p>

      {/* Buttons */}
      <div
        className="flex gap-3 justify-center flex-wrap animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <Link
          href="/login"
          className="btn-gold px-7 py-3 text-[15px] shadow-lg shadow-gold/40 hover:shadow-xl hover:shadow-gold/50 hover:-translate-y-0.5 transition-all"
        >
          <KeyRound className="w-4 h-4" />
          Login to System
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-white/10 text-white text-[15px] font-medium border border-white/[.28] backdrop-blur-sm hover:bg-white/[.18] hover:-translate-y-0.5 transition-all"
        >
          <ClipboardList className="w-4 h-4" />
          Register Account
        </Link>
        <a
          href="#preview"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-white/10 text-white text-[15px] font-medium border border-white/[.28] backdrop-blur-sm hover:bg-white/[.18] hover:-translate-y-0.5 transition-all"
        >
          <Eye className="w-4 h-4" />
          Take a Tour
        </a>
      </div>
    </section>
  );
}
