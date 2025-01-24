"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import localFont from 'next/font/local';

import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";

export const NeueMontreal = localFont({
  src: "./fonts/PPNeueMontreal-Bold.woff",
});
export const LibreFranklin = localFont({
  src: "./fonts/LibreFranklin-Regular.ttf",
});
export const testFont = localFont({
  src: "./fonts/Exposure-[+40]Italic-205TF.otf",
});
export const ExposureRegular = localFont({
  src: "./fonts/Exposure-[+40]-205TF.otf",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <html lang="en">
      <title>ANCHUVA</title>
            <body suppressHydrationWarning={true} className={`${LibreFranklin.className} antialiased`}>

        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? <Loader /> : children}
        </div>
      </body>
    </html>
  );
}
