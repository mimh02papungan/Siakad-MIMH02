import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE - Hapus semua data alumni
export async function DELETE() {
    try {
        await prisma.alumni.deleteMany();

        // Simpan notifikasi
        await prisma.notification.create({
            data: {
                title: "🗑️ Data Alumni Dibersihkan",
                message: "Seluruh data alumni telah berhasil dihapus dari sistem.",
                type: "WARNING",
            },
        });

        return NextResponse.json({ success: true, message: "Seluruh data alumni berhasil dihapus" });
    } catch (error: any) {
        console.error("❌ Error DELETE all alumni:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
