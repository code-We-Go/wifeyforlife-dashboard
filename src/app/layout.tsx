import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import React from "react";
import ClientWrapper from "@/components/Wrapper";
import { wifeyFont } from "./lib/fonts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Wifey For Lifey</title>
      </head>
      <body
        suppressHydrationWarning={true}
        className={`$${wifeyFont.className}  antialiased`}
      >
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}