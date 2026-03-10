"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { exportStyledExcel } from "@/lib/excelUtils";

export default function AlumniPage() {
    const [alumni, setAlumni] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterTahun, setFilterTahun] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const router = useRouter();

    // --- FUNGSI HITUNG UMUR OTOMATIS ---
    const hitungUmurOtomatis = (tanggalLahir: string) => {
        if (!tanggalLahir) return 0;
        const lahir = new Date(tanggalLahir);
        const hariIni = new Date();
        if (isNaN(lahir.getTime())) return 0;

        let umur = hariIni.getFullYear() - lahir.getFullYear();
        const bulan = hariIni.getMonth() - lahir.getMonth();
        if (bulan < 0 || (bulan === 0 && hariIni.getDate() < lahir.getDate())) {
            umur--;
        }
        return umur < 0 ? 0 : umur;
    };

    // --- HANDLER INPUT FORM ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === "tanggalLahir") {
            const umurBaru = hitungUmurOtomatis(value);
            setFormData((prev: any) => ({
                ...prev,
                [name]: value,
                umur: umurBaru
            }));
        } else {
            setFormData((prev: any) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const fetchAlumni = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/alumni?t=${Date.now()}`, { cache: "no-store" });
            const result = await res.json();
            setAlumni(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Error load data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchAlumni();
    }, []);

    const handleSave = async () => {
        try {
            const method = isEditing ? "PUT" : "POST";
            const endpoint = isEditing ? `/api/alumni?id=${formData.id}` : `/api/alumni`;
            const res = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                alert(`✅ Berhasil ${isEditing ? "Update" : "Tambah"} Data!`);
                setIsModalOpen(false);
                setFormData({});
                fetchAlumni();
            } else {
                const err = await res.json();
                alert("❌ Gagal: " + (err.error || "Terjadi kesalahan"));
            }
        } catch (error) {
            alert("❌ Gagal memproses data");
        }
    };

    const handleExportExcel = () => {
        const sortedData = [...alumni].sort((a, b) => {
            const thnA = String(a.tahunLulus || "").toLowerCase();
            const thnB = String(b.tahunLulus || "").toLowerCase();
            const compareThn = thnB.localeCompare(thnA); // Terbaru dulu
            if (compareThn !== 0) return compareThn;
            return (a.namaLengkap || "").toLowerCase().localeCompare((b.namaLengkap || "").toLowerCase());
        });

        if (sortedData.length === 0) return alert("Data kosong!");

        const headers = ["No", "Nama Lengkap", "Angkatan", "NISM", "NISN", "NIK", "L/P", "Tempat, Tgl Lahir", "Umur", "Ayah / Ibu", "No Telepon", "Alamat Lengkap"];
        const dataRows = sortedData.map((item, idx) => [
            idx + 1,
            item.namaLengkap,
            item.tahunLulus,
            item.nism,
            item.nisn,
            item.nik,
            item.jenisKelamin,
            `${item.tempatLahir}, ${item.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString("id-ID") : "-"}`,
            item.umur,
            `${item.namaAyah} / ${item.namaIbu}`,
            item.noTelepon,
            item.alamat
        ]);

        exportStyledExcel([headers, ...dataRows], `Data_Alumni_${new Date().toISOString().split('T')[0]}.xlsx`, "ALUMNI");
    };

    const handleDelete = async (id: any) => {
        if (!confirm("Yakin mau hapus data alumni ini?")) return;
        try {
            const res = await fetch(`/api/alumni?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                alert("Terhapus!");
                fetchAlumni();
            }
        } catch (error) {
            alert("Gagal hapus");
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            console.error("Logout failed on server");
        }
        localStorage.removeItem("user");
        router.push("/login");
        router.refresh();
    };

    // Filter logic
    const filteredAlumni = useMemo(() => {
        return alumni.filter((a) => {
            const cocokSearch = (a.namaLengkap || "").toLowerCase().includes(search.toLowerCase()) ||
                (a.nisn || "").includes(search) || (a.nism || "").includes(search);
            const cocokTahun = filterTahun ? a.tahunLulus === filterTahun : true;
            return cocokSearch && cocokTahun;
        }).sort((a, b) => {
            const thnA = String(a.tahunLulus || "").toLowerCase();
            const thnB = String(b.tahunLulus || "").toLowerCase();
            const compareThn = thnB.localeCompare(thnA); // Terbaru dulu
            if (compareThn !== 0) return compareThn;
            return (a.namaLengkap || "").toLowerCase().localeCompare((b.namaLengkap || "").toLowerCase());
        });
    }, [alumni, search, filterTahun]);

    const handleDownloadTemplate = () => {
        const headers = ["No", "Nama Lengkap", "Angkatan", "NISM", "NISN", "NIK", "L/P", "Tempat Lahir", "Tgl Lahir", "Ayah / Ibu", "No Telepon", "Alamat Lengkap"];
        const templateRow = [
            1,
            "CONTOH NAMA ALUMNI",
            "2023/2024",
            "12345",
            "0012345678",
            "3501010101010001",
            "L",
            "Blitar",
            "2010-05-20",
            "Nama Ayah / Nama Ibu",
            "08123456789",
            "Jl. Melati No. 10, Papungan"
        ];

        exportStyledExcel([headers, templateRow], "Kerangka_Data_Alumni.xlsx", "TEMPLATE_ALUMNI");
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { cellDates: true });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            const headerRowIndex = rawRows.findIndex(row => row.some(cell => String(cell).toLowerCase().includes("nama")));

            if (headerRowIndex === -1) {
                alert("❌ Header tidak ditemukan!");
                setImporting(false);
                return;
            }

            const headers = rawRows[headerRowIndex].map(h => String(h).trim().toLowerCase().replace(/\s+/g, ''));
            const dataRows = rawRows.slice(headerRowIndex + 1);
            const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k.toLowerCase().replace(/\s+/g, ''))));

            const idxNama = getIdx(["namalengkap", "nama"]);
            const idxAngkatan = getIdx(["angkatan", "tahunlulus"]);
            const idxNISM = getIdx(["nism"]);
            const idxNISN = getIdx(["nisn"]);
            const idxNIK = getIdx(["nik"]);
            const idxJK = getIdx(["jeniskelamin", "jk", "l/p"]);
            const idxTempat = getIdx(["tempatlahir", "tempat"]);
            const idxTgl = getIdx(["tanggallahir", "tgl", "tanggal"]);
            const idxOrtu = getIdx(["ayah/ibu", "orangtua", "wali"]);
            const idxTelp = getIdx(["notelepon", "hp", "telp"]);
            const idxAlamat = getIdx(["alamat", "alamatlengkap"]);

            const mappedData = dataRows.map((row: any[]) => {
                const namaLengkap = row[idxNama] ? String(row[idxNama]).trim() : "";
                if (!namaLengkap) return null;

                const rawDate = row[idxTgl];
                const tglISO = rawDate && !isNaN(new Date(rawDate).getTime()) ? new Date(rawDate).toISOString() : null;

                // Pisah Ayah/Ibu jika ada pemisah "/"
                const ortuRaw = String(row[idxOrtu] || "");
                const [ayah, ibu] = ortuRaw.includes("/") ? ortuRaw.split("/").map(s => s.trim()) : [ortuRaw, ""];

                return {
                    namaLengkap,
                    tahunLulus: String(row[idxAngkatan] || ""),
                    nism: String(row[idxNISM] || ""),
                    nisn: String(row[idxNISN] || ""),
                    nik: String(row[idxNIK] || ""),
                    jenisKelamin: String(row[idxJK] || "").toUpperCase().startsWith("L") ? "L" : "P",
                    tempatLahir: String(row[idxTempat] || ""),
                    tanggalLahir: tglISO,
                    umur: parseInt(row[getIdx(["umur"])]) || (rawDate ? hitungUmurOtomatis(String(rawDate)) : 0),
                    namaAyah: ayah,
                    namaIbu: ibu,
                    noTelepon: String(row[idxTelp] || ""),
                    alamat: String(row[idxAlamat] || ""),
                };
            }).filter(d => d !== null);

            const res = await fetch(`/api/alumni`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: mappedData }),
            });

            if (res.ok) {
                alert(`✅ Import Berhasil!`);
                fetchAlumni();
            } else {
                alert(`❌ Gagal Import`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setImporting(false);
            e.target.value = "";
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("BAHAYA! Kamu yakin mau hapus SEMUA data alumni?")) return;
        try {
            // Kita butuh API delete all atau looping. Di Siswa/Guru ada DELETE /api/siswa.
            // Di Alumni route belum ada DELETE ALL. Mari kita tambahkan jika perlu, 
            // tapi sementara kita asumsikan guru ingin fitur ini konsisten.
            const res = await fetch(`/api/alumni/all`, { method: "DELETE" }); // Asumsi route ini akan dibuat
            if (res.ok) { alert("Dibersihkan!"); fetchAlumni(); }
            else { alert("Gagal hapus semua"); }
        } catch (error) { alert("Terjadi kesalahan"); }
    };

    const tahunList = useMemo(() => [...new Set(alumni.map((a) => a.tahunLulus))].sort().reverse(), [alumni]);

    return (
        <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden relative">
            <Sidebar
                user={user}
                handleLogout={handleLogout}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                {/* BACKGROUND DECORATIONS */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-yellow-600/5 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>
                </div>

                <div className="max-w-full mx-auto space-y-6 relative z-10">
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-700 pb-8">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 md:hidden text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                            </button>
                            <div className="flex items-center gap-5">
                                <Link href="/" className="bg-white p-2 rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-transform">
                                    <img src="/mimh 02.png" alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">
                                        Data <span className="text-yellow-400">Alumni</span>
                                    </h1>
                                    <p className="text-gray-400 text-xs md:text-sm">MI Miftahul Huda 02 Papungan</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">{alumni.length} Total Alumni</p>
                                <p className="text-xs text-gray-500">{tahunList.length} Angkatan</p>
                            </div>
                            <select
                                value={filterTahun}
                                onChange={(e) => setFilterTahun(e.target.value)}
                                className="bg-slate-900 border border-slate-700 p-2 md:p-3 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-yellow-500 min-w-[150px] w-full md:w-auto"
                            >
                                <option value="">Semua Angkatan</option>
                                {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ACTION BAR */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center bg-[#1e293b] border border-slate-700 p-6 rounded-3xl shadow-2xl">
                        <div className="w-full lg:flex-1 relative">
                            <input className="w-full bg-slate-900 border border-slate-700 p-3 md:p-4 pl-10 md:pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 text-xs md:text-sm text-white placeholder-gray-500" placeholder="Cari nama, NISN, atau NISM..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-center">
                            <button onClick={handleDownloadTemplate} className="flex-1 sm:flex-none px-4 py-2 md:px-5 md:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs md:text-sm shadow-lg shadow-emerald-900/40">📝 Kerangka</button>
                            <button onClick={() => { setFormData({}); setIsEditing(false); setIsModalOpen(true); }} className="flex-1 sm:flex-none px-4 py-2 md:px-5 md:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs md:text-sm">➕ Tambah</button>
                            <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs md:text-sm cursor-pointer">
                                <span>{importing ? "⏳" : "📤 Import"}</span>
                                <input type="file" onChange={handleImportExcel} className="hidden" accept=".xlsx,.xls" />
                            </label>
                            <button onClick={handleExportExcel} className="flex-1 sm:flex-none px-4 py-2 md:px-5 md:py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold text-xs md:text-sm">📥 Export</button>
                            <button onClick={handleDeleteAll} className="flex-1 sm:flex-none px-4 py-2 md:px-5 md:py-3 rounded-xl bg-red-900/40 hover:bg-red-600 text-red-200 font-bold text-xs md:text-sm border border-red-800/50">🗑️ Kosongkan</button>
                        </div>
                    </div>

                    {/* TABLE / CARD VIEW */}
                    <div className="bg-[#1e293b] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                        {/* MOBILE VIEW */}
                        <div className="md:hidden grid grid-cols-1 gap-4 p-4 max-h-[600px] overflow-y-auto text-sm">
                            {loading ? (
                                <p className="text-center text-gray-500 py-10">📡 Memuat data...</p>
                            ) : filteredAlumni.length === 0 ? (
                                <p className="text-center text-gray-500 py-10 font-bold">Data alumni tidak ditemukan</p>
                            ) : filteredAlumni.map((item) => (
                                <div key={item.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-yellow-500 text-lg">{item.namaLengkap}</h3>
                                            <p className="text-xs text-gray-400">{item.nisn || "-"} | {item.nism || "-"}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-yellow-900/40 text-yellow-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-yellow-800/50">
                                            {item.tahunLulus}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2 pt-3 border-t border-slate-700">
                                        <button onClick={() => { setSelectedAlumni(item); setIsViewModalOpen(true); }} className="flex-1 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-bold transition-all">👁️ Detail</button>
                                        <button onClick={() => { setFormData(item); setIsEditing(true); setIsModalOpen(true); }} className="flex-1 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs font-bold transition-all">✏️ Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="flex-1 py-2 bg-red-600/20 text-red-400 rounded-lg text-xs font-bold transition-all">🗑️ Hapus</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* DESKTOP VIEW */}
                        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[600px]">
                            <table className="w-full text-left min-w-[2500px] border-collapse relative">
                                <thead className="bg-[#0f172a] text-gray-300 uppercase text-xs tracking-widest border-b border-slate-700 sticky top-0 z-30">
                                    <tr>
                                        <th className="p-5 text-center w-16 sticky left-0 bg-[#0f172a] z-40">No</th>
                                        <th className="p-5 text-left sticky left-16 bg-[#0f172a] z-40 w-[280px] min-w-[280px] border-r border-slate-700 text-white">Nama Lengkap</th>
                                        <th className="p-5 text-center">Angkatan</th>
                                        <th className="p-5 text-center">NISM</th>
                                        <th className="p-5 text-center">NISN</th>
                                        <th className="p-5 text-center">NIK</th>
                                        <th className="p-5 text-center">L/P</th>
                                        <th className="p-5 text-center">Tempat, Tgl Lahir</th>
                                        <th className="p-5 text-center">Umur</th>
                                        <th className="p-5 text-center">Ayah / Ibu</th>
                                        <th className="p-5 text-center">No Telepon</th>
                                        <th className="p-5 text-center">Alamat Lengkap</th>
                                        <th className="p-5 sticky right-0 bg-[#0f172a] z-40 text-center w-[250px] min-w-[250px] border-l border-slate-700 shadow-xl">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {loading ? (
                                        <tr><td colSpan={20} className="p-20 text-center text-gray-500 font-bold animate-pulse uppercase tracking-[0.3em]">📡 Memuat data...</td></tr>
                                    ) : filteredAlumni.length === 0 ? (
                                        <tr><td colSpan={20} className="p-20 text-center text-gray-500 font-bold">Data Alumni Tidak Ditemukan</td></tr>
                                    ) : filteredAlumni.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-700/30 transition-all text-sm whitespace-nowrap">
                                            <td className="p-5 text-center text-gray-500 sticky left-0 bg-gray-800 z-10 w-16">{idx + 1}</td>
                                            <td className="p-5 text-left font-bold sticky left-16 bg-gray-800/95 text-yellow-500 border-r border-gray-700 shadow-lg z-10 w-[280px] min-w-[280px]">{item.namaLengkap}</td>
                                            <td className="p-5 text-center"><span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-lg font-bold border border-yellow-800/50">{item.tahunLulus}</span></td>
                                            <td className="p-5 text-center text-gray-400 font-mono">{item.nism}</td>
                                            <td className="p-5 text-center text-gray-400 font-mono">{item.nisn}</td>
                                            <td className="p-5 text-center text-gray-400 font-mono">{item.nik}</td>
                                            <td className="p-5 text-center font-bold tracking-widest">{item.jenisKelamin}</td>
                                            <td className="p-5 text-center text-gray-400">{item.tempatLahir}, {item.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString("id-ID") : "-"}</td>
                                            <td className="p-5 text-center text-blue-400 font-bold">{item.umur} Thn</td>
                                            <td className="p-5 text-center text-gray-400 max-w-[200px] truncate">{item.namaAyah} / {item.namaIbu}</td>
                                            <td className="p-5 text-center text-gray-400">{item.noTelepon}</td>
                                            <td className="p-5 text-center text-gray-400 max-w-sm truncate">{item.alamat}</td>
                                            <td className="p-5 sticky right-0 bg-gray-800/95 border-l border-gray-700 shadow-lg z-10 w-[250px] min-w-[250px]">
                                                <div className="flex justify-center gap-3">
                                                    <button onClick={() => { setSelectedAlumni(item); setIsViewModalOpen(true); }} className="text-emerald-400 hover:text-emerald-200 uppercase font-black text-xs">View</button>
                                                    <button onClick={() => { const dateVal = item.tanggalLahir ? new Date(item.tanggalLahir).toISOString().split("T")[0] : ""; setFormData({ ...item, tanggalLahir: dateVal }); setIsEditing(true); setIsModalOpen(true); }} className="text-blue-400 hover:text-blue-200 uppercase font-black text-xs">Edit</button>
                                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-300 uppercase font-black text-xs">Hapus</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>

            {/* MODAL VIEW DETAIL (FIXED DESIGN & OVERLAP) */}
            {isViewModalOpen && selectedAlumni && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300 text-sm">
                    <div className="bg-[#0f172a] border border-slate-700 w-full max-w-4xl rounded-[2.5rem] p-10 shadow-3xl overflow-y-auto max-h-[90vh] relative animate-in zoom-in duration-300">
                        {/* Close Button SVG Style */}
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-6 mb-10 border-b border-white/10 pb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-yellow-900/40">
                                {selectedAlumni.namaLengkap?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">{selectedAlumni.namaLengkap}</h2>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <span className="px-4 py-1.5 bg-yellow-900/40 text-yellow-400 rounded-full border border-yellow-800/50 text-[10px] font-bold uppercase tracking-widest">Alumni {selectedAlumni.tahunLulus}</span>
                                    <span className="px-4 py-1.5 bg-purple-900/40 text-purple-400 rounded-full border border-purple-800/50 text-[10px] font-bold uppercase tracking-widest">{selectedAlumni.jenisKelamin === "Laki-laki" || selectedAlumni.jenisKelamin === "L" ? "LAKI-LAKI" : "PEREMPUAN"}</span>
                                    <span className="px-4 py-1.5 bg-blue-900/40 text-blue-400 rounded-full border border-blue-800/50 text-[10px] font-bold uppercase tracking-widest">AKTIF</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-6">
                                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-8 h-[2px] bg-yellow-600"></span> Identitas Alumni
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">NIK</p><p className="font-bold text-white font-mono">{selectedAlumni.nik || "-"}</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Umur</p><p className="font-bold text-white">{selectedAlumni.umur} Tahun</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">NISM</p><p className="font-bold text-white font-mono">{selectedAlumni.nism || "-"}</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">NISN</p><p className="font-bold text-white font-mono">{selectedAlumni.nisn || "-"}</p></div>
                                    <div className="col-span-2"><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Tempat, Tgl Lahir</p><p className="font-bold text-white uppercase">{selectedAlumni.tempatLahir}, {selectedAlumni.tanggalLahir ? new Date(selectedAlumni.tanggalLahir).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</p></div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-8 h-[2px] bg-amber-600"></span> Informasi Sosial
                                </h3>
                                <div className="space-y-4">
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">No. Handphone / WA</p><p className="font-bold text-white">{selectedAlumni.noTelepon || "-"}</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Nama Orang Tua</p><p className="font-bold text-white uppercase">{selectedAlumni.namaAyah} / {selectedAlumni.namaIbu}</p></div>
                                    <div><p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Alamat Domisili Sekarang</p><p className="font-bold text-white leading-relaxed">{selectedAlumni.alamat || "-"}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-800 flex justify-end">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-10 py-4 bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95">Tutup Detail</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT / TAMBAH (FIXED DESIGN & OVERLAP) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-slate-700 w-full max-w-6xl rounded-3xl p-10 shadow-3xl overflow-y-auto max-h-[95vh] relative animate-in zoom-in duration-300 text-xs">
                        <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-600/20 rounded-2xl flex items-center justify-center text-yellow-500 text-2xl font-black">
                                    {isEditing ? "✎" : "＋"}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">{isEditing ? "Edit" : "Tambah"} Data Alumni</h2>
                                    <p className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Silakan lengkapi formulir alumni di bawah ini</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-4xl font-black transition-colors">&times;</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Nama Lengkap</label>
                                <input name="namaLengkap" value={formData.namaLengkap || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 shadow-inner font-bold" placeholder="Masukkan nama lengkap..." />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Tahun Lulus / Angkatan</label>
                                <input name="tahunLulus" value={formData.tahunLulus || ""} onChange={handleInputChange} placeholder="Ex: 2024/2025" className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest font-mono text-[10px]">NISM</label>
                                <input name="nism" value={formData.nism || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest font-mono text-[10px]">NISN</label>
                                <input name="nisn" value={formData.nisn || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest font-mono text-[10px]">NIK (Nomor Induk Kependudukan)</label>
                                <input name="nik" value={formData.nik || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-mono font-bold" placeholder="16 Digit NIK..." />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Jenis Kelamin</label>
                                <select name="jenisKelamin" value={formData.jenisKelamin || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold">
                                    <option value="">Pilih</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Tempat Lahir</label>
                                <input name="tempatLahir" value={formData.tempatLahir || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Tanggal Lahir</label>
                                <input type="date" name="tanggalLahir" value={formData.tanggalLahir || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-white uppercase" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-blue-500 uppercase font-black tracking-widest text-[10px]">Umur (Otomatis)</label>
                                <input name="umur" value={formData.umur || 0} readOnly className="w-full bg-slate-800 border border-slate-700 p-3.5 rounded-2xl font-black text-blue-400 cursor-not-allowed" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Nama Ayah</label>
                                <input name="namaAyah" value={formData.namaAyah || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Nama Ibu Kandung</label>
                                <input name="namaIbu" value={formData.namaIbu || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">No Telp / WhatsApp</label>
                                <input name="noTelepon" value={formData.noTelepon || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500 font-bold" placeholder="08xxxx" />
                            </div>

                            <div className="flex flex-col gap-2 col-span-1 md:col-span-2 lg:col-span-4">
                                <label className="text-gray-500 uppercase font-black tracking-widest text-[10px]">Alamat Domisili Sekarang (Lengkap)</label>
                                <textarea name="alamat" value={formData.alamat || ""} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 p-5 rounded-3xl outline-none focus:ring-2 focus:ring-yellow-500 h-28 font-medium" placeholder="Nama jalan, RT/RW, Kecamatan..." />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
                            <button onClick={handleSave} className="flex-1 bg-yellow-600 hover:bg-yellow-500 p-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-yellow-900/30 transition-all active:scale-95 text-sm">
                                💾 Simpan Data Alumni
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="px-12 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl font-black uppercase tracking-widest transition-all text-sm">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
