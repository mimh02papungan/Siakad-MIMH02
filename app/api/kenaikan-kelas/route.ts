import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Proses kenaikan kelas
export async function POST() {
    try {
        // --- Hitung tahun ajaran aktif saat ini ---
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const tahunAjaranSekarang = month >= 7
            ? `${year}/${year + 1}`
            : `${year - 1}/${year}`;

        // --- Ambil semua siswa aktif ---
        const siswaAktif = await prisma.siswa.findMany({
            where: { status: "Aktif" },
        });

        if (siswaAktif.length === 0) {
            return NextResponse.json({ error: "Tidak ada siswa aktif yang bisa diproses." }, { status: 400 });
        }

        // --- Cek apakah sudah pernah diproses di tahun ajaran ini ---
        const sudahDiproses = siswaAktif.some((s) => s.tahunAjaran === tahunAjaranSekarang);
        if (sudahDiproses) {
            return NextResponse.json({
                error: `Kenaikan kelas untuk tahun ajaran ${tahunAjaranSekarang} sudah pernah diproses.`
            }, { status: 409 });
        }

        const kelasMap: Record<string, string> = {
            "Kelas 1": "Kelas 2",
            "Kelas 2": "Kelas 3",
            "Kelas 3": "Kelas 4",
            "Kelas 4": "Kelas 5",
            "Kelas 5": "Kelas 6",
        };

        let jumlahNaik = 0;
        let jumlahLulus = 0;
        const alumniData: any[] = [];

        for (const siswa of siswaAktif) {
            const kelasBaru = kelasMap[siswa.tingkatRombel];

            if (kelasBaru) {
                // Naik kelas
                await prisma.siswa.update({
                    where: { id: siswa.id },
                    data: {
                        tingkatRombel: kelasBaru,
                        tahunAjaran: tahunAjaranSekarang,
                    },
                });
                jumlahNaik++;
            } else if (siswa.tingkatRombel === "Kelas 6") {
                // Lulus → pindah ke Alumni
                alumniData.push({
                    namaLengkap: siswa.namaLengkap,
                    nism: siswa.nism,
                    nisn: siswa.nisn,
                    nik: siswa.nik,
                    tempatLahir: siswa.tempatLahir,
                    tanggalLahir: siswa.tanggalLahir,
                    umur: siswa.umur,
                    jenisKelamin: siswa.jenisKelamin,
                    alamat: siswa.alamat,
                    noTelepon: siswa.noTelepon,
                    kebutuhanKhusus: siswa.kebutuhanKhusus,
                    disabilitas: siswa.disabilitas,
                    nomorKipPip: siswa.nomorKipPip,
                    namaAyah: siswa.namaAyah,
                    namaIbu: siswa.namaIbu,
                    nomorKK: siswa.nomorKK,
                    tahunLulus: tahunAjaranSekarang,
                });

                // Hapus dari tabel siswa
                await prisma.siswa.delete({ where: { id: siswa.id } });
                jumlahLulus++;
            }
        }

        // Insert semua alumni sekaligus
        if (alumniData.length > 0) {
            await prisma.alumni.createMany({ data: alumniData });
        }

        // Simpan notifikasi
        await prisma.notification.create({
            data: {
                title: "✅ Kenaikan Kelas Berhasil",
                message: `Tahun Ajaran ${tahunAjaranSekarang}: ${jumlahNaik} siswa naik kelas, ${jumlahLulus} siswa dinyatakan lulus dan dipindah ke data alumni.`,
                type: "SUCCESS",
            },
        });

        return NextResponse.json({
            success: true,
            tahunAjaran: tahunAjaranSekarang,
            jumlahNaik,
            jumlahLulus,
            message: `Kenaikan kelas berhasil! ${jumlahNaik} siswa naik kelas, ${jumlahLulus} siswa lulus dan dipindah ke alumni.`,
        });

    } catch (error: any) {
        console.error("❌ Error kenaikan kelas:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Cek status apakah sudah diproses tahun ini
export async function GET() {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const tahunAjaranSekarang = month >= 7
            ? `${year}/${year + 1}`
            : `${year - 1}/${year}`;

        const sudahDiproses = await prisma.siswa.findFirst({
            where: {
                status: "Aktif",
                tahunAjaran: tahunAjaranSekarang,
            },
        });

        return NextResponse.json({
            tahunAjaran: tahunAjaranSekarang,
            sudahDiproses: !!sudahDiproses,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
