"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "GitHub",
    href: "https://github.com/Natto-boys",
    external: true,
  },
] satisfies { name: string; href: string; external?: boolean }[];

export const Header: React.FC = () => {
  const pathname = usePathname();
  return (
    <header className="top-0 z-30 w-full px-4 sticky backdrop-blur border-b border-zinc-500/20 bg-violet-50/50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between sm:h-14 flex-row sm:pt-0">
          <Link href="/" className="text-xl font-semibold duration-150 text-zinc-900 hover:text-zinc-800">
            HingeGPT
          </Link>
          {/* Desktop navigation */}
          <nav className="flex items-center grow">
            <ul className="flex flex-wrap items-center justify-end gap-4 grow">
              {navigation.map((item) => (
                <li className="" key={item.href}>
                  <Link
                    className={`flex items-center px-3 py-2 duration-150 text-sm sm:text-base  hover:text-zinc-800
                    ${pathname === item.href ? "text-zinc-200" : "text-zinc-400"}`}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Fancy fading bottom border */}
    </header>
  );
};
