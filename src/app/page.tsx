"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const user = false;
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/");
    }
  }, [router, user]);
  return <div></div>;
}
