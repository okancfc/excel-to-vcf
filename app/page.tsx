"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Home() {
  const [status, setStatus] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("📄 Excel dosyası okunuyor...");

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet) as any[];

    const zip = new JSZip();
    const seen = new Set<string>();

    json.forEach((row) => {
      const ad = (row["Ad"] || "").toString().trim().toUpperCase();
      const soyad = (row["Soyad"] || "").toString().trim().toUpperCase();
      let phone = (row["Telefon"] || "").toString().replace(/\D/g, "");

      if (phone.startsWith("0")) phone = phone.slice(1);
      if (phone.startsWith("90") && phone.length === 12) phone = phone.slice(2);
      if (phone.length > 10) phone = phone.slice(-10);

      if (phone.length !== 10 || seen.has(phone)) return;

      seen.add(phone);
      const formattedPhone = `+90 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8)}`;
      const fullName = `040625 ${ad} ${soyad}`;
      const fileName = `040625_${ad}_${soyad}.vcf`;

      const vcf = `BEGIN:VCARD
VERSION:3.0
N:${fullName}
FN:${fullName}
TEL;TYPE=CELL:${formattedPhone}
END:VCARD`;

      zip.file(fileName, vcf);
    });

    setStatus("📦 ZIP dosyası hazırlanıyor...");

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "rehber_040625_tum_formatli.zip");

    setStatus("✅ İşlem tamam! ZIP dosyası indiriliyor.");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Excel to VCF Dönüştürücü</h1>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileUpload}
        className="mb-4 text-gray-800"
      />
      {status && <p className="text-gray-700">{status}</p>}
    </main>
  );
}
