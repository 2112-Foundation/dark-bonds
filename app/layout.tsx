import Navbar from "./components/navigation/navbar";
import Footer from "./components/navigation/footer";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { ReduxProvider } from "./redux/provider";

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
        <ReduxProvider>
          <Navbar />
          {children}
          <Footer />
        </ReduxProvider>
      </body>
    </html>
  );
}
