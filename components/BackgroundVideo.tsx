"use client";

import React from "react";
import Image from "next/image";

export default function BackgroundVideo() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <Image
                src="/apel.jpg"
                alt="Background Upacara"
                fill
                priority
                className="object-cover brightness-[1.0]"
            />
            {/* Overlay to ensure readability */}
            <div className="absolute inset-0 bg-slate-950/20"></div>
        </div>
    );
}
