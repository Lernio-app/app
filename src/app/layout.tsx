import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: { default: "Lernio", template: "%s · Lernio" },
  description:
    "Alumnos, clases, cobros, tareas y exámenes en un solo lugar, para profes particulares.",
};

export const viewport: Viewport = {
  themeColor: "#1f5a44",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${figtree.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
