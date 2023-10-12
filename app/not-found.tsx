"use client";
import Navbar from "@/app/components/navigation/navbar";
import React from "react";
import Footer from "./components/navigation/footer";
import "../app/globals.css";

export default function error_404() {
  return (
    <div>
      <div className="flex justify-center items-center text-sable-green-text h-screen text-3xl">
        404 Page Not Found
      </div>
    </div>
  );
}
