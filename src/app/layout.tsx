"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import { Baskerville } from "@/app/lib/fonts";
import React from "react";
import ClientWrapper from "@/components/Wrapper";

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
      <body
        suppressHydrationWarning={true}
        className={`${Baskerville.className} antialiased`}
      >
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}