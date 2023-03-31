import "./globals.css";
import { Inter } from "@next/font/google";
import Link from "next/link";
import { Header } from "./header";

import { Analytics } from "app/components/analytics";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head />
      <body className="relative min-h-screen bg-zinc-100">
        {
          // Not everyone will want to host envshare on Vercel, so it makes sense to make this opt-in.
          process.env.ENABLE_VERCEL_ANALYTICS ? <Analytics /> : null
        }

        <div className="text-3xl font-bold text-center text-gray-800 max-w-1xl mx-auto pt-16 pb-3 px-6">
          <p>
            Generate mediocre Hinge opening lines.
          </p>
        </div>
        <div className="text-lg text-center text-gray-500 max-w-1xl mx-auto pb-16 px-6">
          <p>
            Fill in a name and prompt below.  Press generate, and repeat.
          </p>
        </div>

        <main className=" min-h-[80vh] sm:w-full px-4">{children}</main>

        <footer className="bottom-0 border-t inset-2x-0 border-zinc-500/10">
          <div className="flex flex-col gap-1 px-6 py-12 mx-auto text-xs text-center text-zinc-700 max-w-7xl lg:px-8">
            <p>
              Built by the{" "}
              <Link href="https://github.com/Natto-boys" className="font-semibold duration-150 hover:text-zinc-200">
                Natto boys
              </Link>
            </p>
            <p>
              HingeGPT is deployed on{" "}
              <Link target="_blank" href="https://vercel.com" className="underline duration-150 hover:text-zinc-200">
                Vercel
              </Link>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
