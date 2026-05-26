"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/studio", label: "Dashboard" },
  { href: "/zone-studio", label: "Design Studio" },
  { href: "/configurator", label: "3D Configurator" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-black/5 bg-white/70 px-5 py-3 shadow-xl shadow-black/[0.04] backdrop-blur">
      <Link href="/studio" className="font-serif text-xl tracking-[0.18em]">ATELIER ENGINE</Link>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href}
              className={`rounded-2xl px-4 py-2 transition ${active ? "bg-[#191714] text-white" : "text-[#191714] hover:bg-[#f4ece3]"}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
