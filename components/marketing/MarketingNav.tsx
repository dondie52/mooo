"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Cow } from "@phosphor-icons/react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Why", href: "#why" },
  { label: "Preview", href: "#preview" },
  { label: "Login", href: "/login" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-forest-deep/[.97] backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-6 lg:px-12 h-[62px]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center">
            <Cow size={20} weight="fill" className="text-white" />
          </div>
          <span className="font-display text-sm text-white leading-tight">
            LMHTS<br />
            <span className="text-white/50 text-xs font-sans">Botswana</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            link.href.startsWith("#") ? (
              <a
                key={link.label}
                href={link.href}
                className="text-white/70 text-sm font-medium px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/70 text-sm font-medium px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
          <Link
            href="/register"
            className="btn-gold ml-2 shadow-md shadow-gold/30 hover:shadow-lg hover:shadow-gold/40 hover:-translate-y-0.5 transition-all"
          >
            Get Started &rarr;
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-white/70 hover:text-white"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-forest-deep px-6 py-4 space-y-1 animate-fade-in">
          {navLinks.map((link) => (
            link.href.startsWith("#") ? (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-white/70 text-sm font-medium px-3 py-2.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-white/70 text-sm font-medium px-3 py-2.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="btn-gold w-full justify-center mt-2"
          >
            Get Started &rarr;
          </Link>
        </div>
      )}
    </nav>
  );
}
