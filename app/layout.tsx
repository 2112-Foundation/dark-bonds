import "./globals.css";
import { Montserrat } from "next/font/google";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Providers } from "./providers";

const inter = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Sable Bonds",
  description: "Sable Ltd.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-sable-green-page-bg">
      <body className={`${inter.className} foo bg-black-100 no-scrollbar`}>
        {/* export to providers class as layout w. metadata cannot be client */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
