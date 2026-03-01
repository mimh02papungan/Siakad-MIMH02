import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Ambil semua data alumni
export async function GET() {
    try {
        const alumni = await prisma.alumni.findMany({
            orderBy: { tahunLulus: "desc" },
        });
        return NextResponse.json(alumni);
    } catch (error: any) {
        console.error("❌ Error GET alumni:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Tambah data alumni manual atau batch import
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rawData = body.data || body; // Handle batch atau single

        if (Array.isArray(rawData)) {
            // Batch creation (Import)
            const cleanedData = rawData.map((item: any) => ({
                namaLengkap: item.namaLengkap,
                nism: String(item.nism || ""),
                nisn: String(item.nisn || ""),
                nik: String(item.nik || ""),
                tempatLahir: item.tempatLahir || "",
                tanggalLahir: item.tanggalLahir ? new Date(item.tanggalLahir) : new Date(),
                umur: parseInt(item.umur) || 0,
                jenisKelamin: item.jenisKelamin || "",
                alamat: item.alamat || "",
                noTelepon: item.noTelepon || "",
                kebutuhanKhusus: item.kebutuhanKhusus || "",
                disabilitas: item.disabilitas || "",
                nomorKipPip: item.nomorKipPip || "",
                namaAyah: item.namaAyah || "",
                namaIbu: item.namaIbu || "",
                nomorKK: item.nomorKK || "",
                tahunLulus: String(item.tahunLulus || ""),
            }));

            const result = await prisma.alumni.createMany({
                data: cleanedData,
                skipDuplicates: true
            });

            // Simpan notifikasi import alumni
            await prisma.notification.create({
                data: {
                    title: "📥 Import Alumni Berhasil",
                    message: `Berhasil mengimpor ${result.count} data alumni ke dalam sistem.`,
                    type: "SUCCESS",
                },
            });

            return NextResponse.json({ success: true, count: result.count });
        } else {
            // Single creation (Tambah Manual)
            const alumni = await prisma.alumni.create({
                data: {
                    namaLengkap: rawData.namaLengkap,
                    nism: rawData.nism || "",
                    nisn: rawData.nisn || "",
                    nik: rawData.nik || "",
                    tempatLahir: rawData.tempatLahir || "",
                    tanggalLahir: rawData.tanggalLahir ? new Date(rawData.tanggalLahir) : new Date(),
                    umur: parseInt(rawData.umur) || 0,
                    jenisKelamin: rawData.jenisKelamin || "",
                    alamat: rawData.alamat || "",
                    noTelepon: rawData.noTelepon || "",
                    kebutuhanKhusus: rawData.kebutuhanKhusus || "",
                    disabilitas: rawData.disabilitas || "",
                    nomorKipPip: rawData.nomorKipPip || "",
                    namaAyah: rawData.namaAyah || "",
                    namaIbu: rawData.namaIbu || "",
                    nomorKK: rawData.nomorKK || "",
                    tahunLulus: String(rawData.tahunLulus || ""),
                }
            });
            return NextResponse.json(alumni);
        }
    } catch (error: any) {
        console.error("❌ Error POST alumni:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update data alumni
export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

        const body = await request.json();
        const alumni = await prisma.alumni.update({
            where: { id: parseInt(id) },
            data: {
                namaLengkap: body.namaLengkap,
                nism: body.nism,
                nisn: body.nisn,
                nik: body.nik,
                tempatLahir: body.tempatLahir,
                tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : undefined,
                umur: parseInt(body.umur),
                jenisKelamin: body.jenisKelamin,
                alamat: body.alamat,
                noTelepon: body.noTelepon,
                kebutuhanKhusus: body.kebutuhanKhusus,
                disabilitas: body.disabilitas,
                nomorKipPip: body.nomorKipPip,
                namaAyah: body.namaAyah,
                namaIbu: body.namaIbu,
                nomorKK: body.nomorKK,
                tahunLulus: body.tahunLulus,
            }
        });
        return NextResponse.json(alumni);
    } catch (error: any) {
        console.error("❌ Error PUT alumni:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Hapus satu data alumni
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

        await prisma.alumni.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true, message: "Data alumni berhasil dihapus" });
    } catch (error: any) {
        console.error("❌ Error DELETE alumni:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
