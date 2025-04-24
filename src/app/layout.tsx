"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import localFont from 'next/font/local';

import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ClientWrapper from "@/components/Wrapper";

const NeueMontreal = localFont({
  src: "./fonts/PPNeueMontreal-Bold.woff",
});
const LibreFranklin = localFont({
  src: "./fonts/LibreFranklin-Regular.ttf",
});
const testFont = localFont({
  src: "./fonts/Exposure-[+40]Italic-205TF.otf",
});
const ExposureRegular = localFont({
  src: "./fonts/Exposure-[+40]-205TF.otf",
});


 const Gluten = localFont({
  src: "/fonts/Gluten.ttf",
});
 const Genos = localFont({
  src: "/fonts/Genos.ttf",
});
export const Baskerville = localFont({
  src: "/fonts/LibreBaskerville-Regular.ttf",
});
export const Berkishire = localFont({
  src: "/fonts/BerkshireSwash-Regular.ttf",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>MAMILK</title>
      </head>
      <body suppressHydrationWarning={true} className={`${Baskerville.className} antialiased`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
