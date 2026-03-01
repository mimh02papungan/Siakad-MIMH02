import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const settingsPath = path.join(process.cwd(), "settings.json");

function getSettings() {
    if (!fs.existsSync(settingsPath)) {
        const defaultSettings = { kepalaSekolah: "AHMAD FAUZI, S.Pd" };
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
        return defaultSettings;
    }
    const data = fs.readFileSync(settingsPath, "utf-8");
    return JSON.parse(data);
}

export async function GET() {
    try {
        const settings = getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const settings = getSettings();

        if (body.kepalaSekolah) {
            settings.kepalaSekolah = body.kepalaSekolah;
        }

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
    }
}
