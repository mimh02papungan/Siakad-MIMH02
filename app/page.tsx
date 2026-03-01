"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// --- COMPONENTS: ICON SVG ---
const Icons = {
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
  ),
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  ),
  Academic: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  ),
  Chart: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  )
};

export default function Dashboard() {
  const [stats, setStats] = useState({ siswa: 0, guru: 0, rombel: 6, verified: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kenaikanLoading, setKenaikanLoading] = useState(false);
  const [kenaikanStatus, setKenaikanStatus] = useState<{ sudahDiproses: boolean; tahunAjaran: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [kepalaSekolah, setKepalaSekolah] = useState("AHMAD FAUZI, S.Pd");
  const [editingKepsek, setEditingKepsek] = useState(false);
  const [newKepsek, setNewKepsek] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 1. Cek User Login
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Fetch Stats
    const fetchStats = async () => {
      try {
        const [resSiswa, resGuru, resNotif] = await Promise.all([
          fetch("/api/siswa?t=" + Date.now()),
          fetch("/api/guru?t=" + Date.now()),
          fetch("/api/notifikasi?t=" + Date.now())
        ]);
        const dataSiswa = await resSiswa.json();
        const dataGuru = await resGuru.json();
        const dataNotif = await resNotif.json();

        setStats({
          siswa: Array.isArray(dataSiswa) ? dataSiswa.length : 0,
          guru: Array.isArray(dataGuru) ? dataGuru.length : 0,
          rombel: 6, // Hardcoded for now (Kelas 1-6)
          verified: Array.isArray(dataSiswa) ? dataSiswa.filter((s: any) => s.nisn).length : 0
        });

        if (Array.isArray(dataNotif)) {
          setNotifications(dataNotif);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Cek status kenaikan kelas
    fetch("/api/kenaikan-kelas")
      .then((r) => r.json())
      .then((d) => setKenaikanStatus(d))
      .catch(() => { });

    // 4. Fetch Settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.kepalaSekolah) setKepalaSekolah(data.kepalaSekolah);
      })
      .catch((e) => console.error("Gagal load settings:", e));

    // Update current time every second
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --- LOGIKA TAHUN AJARAN & SEMESTER OTOMATIS ---
  // Gunakan fallback date jika currentTime masih null (saat SSR)
  const activeDate = currentTime || new Date();
  const currentMonth = activeDate.getMonth() + 1; // 1-12
  const currentYear = activeDate.getFullYear();
  let tahunAjaran = "";
  let semester = "";
  let semesterNum = "";

  if (currentMonth >= 7) {
    tahunAjaran = `${currentYear}/${currentYear + 1}`;
    semester = "Semester Ganjil";
    semesterNum = "1";
  } else {
    tahunAjaran = `${currentYear - 1}/${currentYear}`;
    semester = "Semester Genap";
    semesterNum = "2";
  }

  const hariIni = activeDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const jamSekarang = currentTime ? currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : "--:--:--";

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifikasi", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all as read");
    }
  };

  const clearNotifications = async () => {
    if (!confirm("Hapus semua riwayat notifikasi?")) return;
    try {
      await fetch("/api/notifikasi", { method: "DELETE" });
      setNotifications([]);
    } catch (e) {
      console.error("Failed to clear notifications");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleKenaikanKelas = async () => {
    if (user?.role !== 'admin') {
      alert("Maaf, hanya Admin yang dapat melakukan proses ini.");
      return;
    }
    if (!confirm(`Proses kenaikan kelas untuk tahun ajaran ${kenaikanStatus?.tahunAjaran}?\n\nSiswa Kelas 1-5 akan naik satu tingkat.\nSiswa Kelas 6 akan dipindah ke Data Alumni.\n\nProses ini tidak bisa dibatalkan!`)) return;
    setKenaikanLoading(true);
    try {
      const res = await fetch("/api/kenaikan-kelas", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✅ ${data.message}`);
      // Refresh status dan stats
      const statusRes = await fetch("/api/kenaikan-kelas");
      setKenaikanStatus(await statusRes.json());
      const [resSiswa] = await Promise.all([fetch("/api/siswa?t=" + Date.now())]);
      const dataSiswa = await resSiswa.json();
      setStats(prev => ({
        ...prev,
        siswa: Array.isArray(dataSiswa) ? dataSiswa.length : prev.siswa,
        verified: Array.isArray(dataSiswa) ? dataSiswa.filter((s: any) => s.nisn).length : prev.verified,
      }));
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setKenaikanLoading(false);
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

  const updateKepalaSekolah = async () => {
    if (!newKepsek.trim()) return;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kepalaSekolah: newKepsek }),
      });
      if (res.ok) {
        setKepalaSekolah(newKepsek);
        setEditingKepsek(false);
        alert("Nama Kepala Madrasah berhasil diperbarui!");
      }
    } catch (e) {
      alert("Gagal memperbarui nama");
    }
  };

  return (
    <div className="flex h-screen bg-[#1e293b] text-white font-sans overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        handleLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#1e293b]">

        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-[#1e293b] border-b border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center transition-all shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 md:hidden text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Icons.Menu />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <img src="/mimh 02.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold tracking-tight">SIAKAD</span>
            </div>
            <div className="hidden md:block">
              <h2 className="font-bold text-xl">Overview</h2>
              <p className="text-xs text-gray-500">
                {user ? `Halo, ${user.namaLengkap || user.username}` : "Selamat datang, Tamu"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative">
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#0f172a] z-10">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 ${showNotifications ? 'text-white bg-gray-800' : ''}`}
              >
                <Icons.Bell />
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-80 bg-[#1e293b] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#1e293b]/50">
                      <h3 className="font-bold text-sm">Notifikasi</h3>
                      <div className="flex gap-2">
                        <button onClick={markAllAsRead} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider">Tanndai Baca</button>
                        <button onClick={clearNotifications} className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider">Hapus</button>
                      </div>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors relative ${!n.isRead ? 'bg-blue-500/5' : ''}`}>
                            {!n.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full"></div>}
                            <div className="flex gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'DANGER' ? 'bg-red-500' :
                                n.type === 'SUCCESS' ? 'bg-green-500' :
                                  n.type === 'WARNING' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></div>
                              <div>
                                <p className={`text-[12px] font-bold mb-0.5 ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                                <p className="text-[11px] text-gray-400 leading-relaxed mb-1">{n.message}</p>
                                <p className="text-[9px] text-gray-500 font-mono italic">{new Date(n.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                            <Icons.Bell />
                          </div>
                          <p className="text-xs text-gray-500 font-medium">Belum ada notifikasi baru</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {user ? (
              <div className="relative pl-4 md:pl-6 border-l border-gray-700">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className={`flex items-center gap-2 md:gap-3 p-1 rounded-xl transition-all ${showProfileMenu ? 'bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-800/50'}`}
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-gray-800 uppercase shadow-lg">
                    {user.username.substring(0, 2)}
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold truncate max-w-[100px] leading-tight">{user.username}</div>
                    <div className="text-[10px] text-gray-500 leading-none font-medium">Administrator</div>
                  </div>
                  <svg className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* DROPDOWN MENU */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="absolute right-0 mt-3 w-48 bg-[#1e293b] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-gray-800 bg-[#1e293b]/50">
                        <p className="text-xs font-bold text-white truncate">{user.namaLengkap || user.username}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user.email || 'Admin Sistem'}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/pengaturan"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-all text-xs font-bold rounded-lg"
                        >
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Pengaturan
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs md:sm font-medium transition-colors shadow-lg shadow-blue-900/40">
                Login
              </Link>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-20 relative z-10 w-full">

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-6 sm:p-8 md:p-12 min-h-[300px] flex items-center">
            {/* Background Image with Overlay */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-right transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: "url('/foto2.jpeg')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#1e293b] via-[#1e293b]/90 to-transparent"></div>

            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-5 mb-6 md:mb-8">
                <img src="/mimh 02.png" alt="Logo MI" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-2xl" />
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight">
                  <span className="text-blue-400">MI Miftahul Huda 02</span>
                </h1>
              </div>
              <p className="text-blue-200/80 mb-8 sm:mb-10 text-base sm:text-lg max-w-xl leading-relaxed">
                Kelola data siswa dan guru dengan mudah, cepat, dan terintegrasi dalam satu sistem modern.
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <Link href="/siswa" className="px-8 py-4 bg-blue-600/20 text-white font-bold rounded-2xl hover:bg-blue-600/40 border border-blue-500/30 transition-all flex items-center justify-center gap-2 shadow-xl backdrop-blur-md">
                  Kelola Siswa
                </Link>
                <Link href="/guru" className="px-8 py-4 bg-blue-600/20 text-white font-bold rounded-2xl hover:bg-blue-600/40 border border-blue-500/30 transition-all flex items-center justify-center gap-2 shadow-xl backdrop-blur-md">
                  Kelola Guru
                </Link>
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
            <StatCard
              label="Total Siswa"
              value={loading ? "..." : stats.siswa}
              icon={<Icons.Users />}
              color="bg-blue-600/20"
              subtext="Siswa Aktif"
              className="backdrop-blur-lg border border-white/10"
            />
            <StatCard
              label="Total Guru"
              value={loading ? "..." : stats.guru}
              icon={<Icons.Academic />}
              color="bg-purple-600/20"
              subtext="Tenaga Pendidik"
              className="backdrop-blur-lg border border-white/10"
            />
            <StatCard
              label="Rombongan Belajar"
              value={loading ? "..." : stats.rombel}
              icon={<Icons.Chart />}
              color="bg-orange-600/20"
              subtext="Kelas 1 - 6"
              className="backdrop-blur-lg border border-white/10"
            />
            <StatCard
              label="Data Terverifikasi"
              value={loading ? "..." : stats.verified}
              icon={<span className="text-lg">✅</span>}
              color="bg-green-600/20"
              subtext="NISN Valid"
              className="backdrop-blur-lg border border-white/10"
            />
          </div>

          {/* LOWER SECTION: QUICK MENU GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* LEFT COLUMN: Main Shortcuts */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                Akses Cepat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/siswa" className="group p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-24 h-24 bg-blue-500 rounded-full blur-xl"></div>
                  </div>
                  <div className="w-12 h-12 bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <Icons.Users />
                  </div>
                  <h4 className="text-lg font-bold mb-1 group-hover:text-blue-400 transition-colors text-white">Data Siswa</h4>
                  <p className="text-sm text-gray-500">Lihat, tambah, dan edit data seluruh siswa.</p>
                </Link>

                <Link href="/guru" className="group p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all hover:bg-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-24 h-24 bg-purple-500 rounded-full blur-xl"></div>
                  </div>
                  <div className="w-12 h-12 bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    <Icons.Academic />
                  </div>
                  <h4 className="text-lg font-bold mb-1 group-hover:text-purple-400 transition-colors text-white">Data Guru</h4>
                  <p className="text-sm text-gray-500">Manajemen data GTK dan staff pengajar.</p>
                </Link>

                <Link href="/alumni" className="group p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-yellow-500/50 transition-all hover:bg-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-24 h-24 bg-yellow-500 rounded-full blur-xl"></div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-900/50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    🎓
                  </div>
                  <h4 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition-colors text-white">Data Alumni</h4>
                  <p className="text-sm text-gray-500">Arsip data siswa yang telah lulus.</p>
                </Link>

                {/* KENAIKAN KELAS */}
                <div className="group p-6 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 relative overflow-hidden
                  hover:border-green-500/50 transition-all hover:bg-white/10">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="w-24 h-24 bg-green-500 rounded-full blur-xl"></div>
                  </div>
                  <div className="w-12 h-12 bg-green-900/50 rounded-2xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <h4 className="text-lg font-bold mb-1 text-white">Kenaikan Kelas</h4>
                  <p className="text-xs text-gray-500 mb-3">Proses kenaikan kelas tahun ajaran baru. Siswa Kelas 6 otomatis dipindah ke alumni.</p>
                  {kenaikanStatus?.sudahDiproses ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-xs font-bold">Sudah diproses ({kenaikanStatus.tahunAjaran})</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleKenaikanKelas}
                      disabled={kenaikanLoading || user?.role !== 'admin'}
                      className={`w-full py-2 font-bold rounded-xl text-sm transition-all shadow-lg ${user?.role === 'admin'
                        ? "bg-green-600 hover:bg-green-500 text-white shadow-green-900/40 shadow-xl active:scale-95"
                        : "bg-slate-800/50 text-gray-500 cursor-not-allowed shadow-none border border-white/5"
                        }`}
                    >
                      {user?.role === 'admin'
                        ? (kenaikanLoading ? "⏳ Memproses..." : `🚀 Proses Kenaikan Kelas`)
                        : "🔒 Hanya Admin"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Info Sekolah */}
            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-3xl border border-white/10 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <div className="w-7 h-7 bg-blue-600/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h3 className="font-bold uppercase text-xs tracking-widest text-gray-300">Informasi Sekolah</h3>
              </div>

              {/* Tahun Ajaran */}
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400/70">Tahun Ajaran Aktif</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-white tracking-tight">{tahunAjaran}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${semesterNum === "1"
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                    }`}>
                    Smt {semesterNum}
                  </span>
                </div>
                <p className="text-xs text-blue-300/70 font-medium">{semester}</p>
              </div>

              {/* Tanggal Hari Ini */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Waktu Sekarang</p>
                  <p className="text-xs font-bold text-white leading-tight">{hariIni}</p>
                  <p className="text-[10px] font-mono text-indigo-400 mt-0.5">{jamSekarang} WIB</p>
                </div>
              </div>

              {/* Kepala Madrasah */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Kepala Madrasah</p>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setNewKepsek(kepalaSekolah);
                          setEditingKepsek(!editingKepsek);
                        }}
                        className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
                      >
                        {editingKepsek ? "[Batal]" : "[Ubah]"}
                      </button>
                    )}
                  </div>
                  {editingKepsek ? (
                    <div className="mt-2 space-y-2">
                      <input
                        autoFocus
                        value={newKepsek}
                        onChange={(e) => setNewKepsek(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Nama Lengkap & Gelar"
                      />
                      <button
                        onClick={updateKepalaSekolah}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-lg"
                      >
                        SIMPAN PERUBAHAN
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-white leading-tight mt-0.5">{kepalaSekolah}</p>
                      <p className="text-[10px] text-gray-500">MI Miftahul Huda 02</p>
                    </>
                  )}
                </div>
              </div>

              {/* Status Akademik */}
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-gray-500 font-medium">Tahun Ajaran otomatis diperbarui mengikuti jadwal akademik</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color, subtext, className }: any) {
  return (
    <div className={`p-6 rounded-3xl transition-all shadow-xl hover:-translate-y-1 ${className || 'bg-[#1e293b] border border-slate-700'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-3xl font-black text-white">{value}</h3>
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider text-white/50">
        {subtext}
      </div>
    </div>
  );
}

function TimelineItem({ time, title, desc, active }: any) {
  return (
    <div className="relative flex gap-4 items-start">
      <div className={`w-5 h-5 rounded-full z-10 flex-shrink-0 ${active ? 'bg-blue-500 ring-4 ring-blue-900' : 'bg-gray-700 border-2 border-gray-900'}`}></div>
      <div className="bg-gray-800/30 p-3 rounded-2xl border border-gray-800/50 flex-1">
        <span className="text-[9px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 font-mono uppercase tracking-tighter">{time}</span>
        <h4 className="font-bold text-sm mt-1 text-white">{title}</h4>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  );
}