"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BlogsV2RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pages/blogs");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-backgroundColor">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-secondary"></div>
        <p className="mt-2 text-sm text-gray-600">Redirecting to Blog Management...</p>
      </div>
    </div>
  );
}
