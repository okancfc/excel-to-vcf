"use client";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function Home() {
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setSuccess(false);
    setIsProcessing(true);
    setProcessedCount(0);
    setStatus("📄 Excel dosyası okunuyor...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      setStatus("🔄 Veriler işleniyor...");

      const zip = new JSZip();
      const seen = new Set<string>();
      let count = 0;

      json.forEach((row, index) => {
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
        count++;
        
        if (index % 10 === 0) {
          setProcessedCount(count);
        }
      });

      setProcessedCount(count);
      setStatus("📦 ZIP dosyası hazırlanıyor...");

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "rehber_040625_tum_formatli.zip");

      setStatus(`✅ ${count} kişi başarıyla işlendi ve indirildi!`);
      setSuccess(true);
    } catch (error) {
      setStatus("❌ Dosya işlenirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Excel → VCF Dönüştürücü
          </h1>
          <p className="text-gray-600">Excel dosyanızı VCF formatına kolayca dönüştürün</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/50'
              }
              ${isProcessing ? 'pointer-events-none opacity-75' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleInputChange}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center space-y-4">
              {isProcessing ? (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-spin">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                  ${isDragOver 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 scale-110' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:from-blue-100 hover:to-purple-100'
                  }
                `}>
                  <Upload className={`w-8 h-8 ${isDragOver ? 'text-white' : 'text-gray-600'}`} />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {isProcessing ? 'İşleniyor...' : 'Excel Dosyanızı Seçin'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isProcessing 
                    ? `${processedCount} kayıt işlendi` 
                    : 'Dosyayı sürükleyip bırakın veya tıklayarak seçin'
                  }
                </p>
              </div>

              {!isProcessing && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Sadece .xlsx dosyaları</span>
                </div>
              )}
            </div>

            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <div className="text-blue-600 font-medium">Dosyayı bırakın</div>
              </div>
            )}
          </div>

          {/* Status */}
          {status && (
            <div className={`
              mt-6 p-4 rounded-xl border transition-all duration-300
              ${success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-blue-50 border-blue-200 text-blue-800'
              }
            `}>
              <div className="flex items-center space-x-3">
                {success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : isProcessing ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{status}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">İndirme Tamamlandı!</h4>
                  <p className="text-sm text-green-600">ZIP dosyası otomatik olarak indirildi. Başka bir dosya yükleyebilirsiniz.</p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-blue-800">Excel Desteği</p>
              <p className="text-xs text-blue-600 mt-1">XLSX formatı</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-purple-800">Otomatik Format</p>
              <p className="text-xs text-purple-600 mt-1">VCF çıktısı</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Akkan Caner</span> için geliştirildi
          </p>
        </div>
      </div>
    </main>
  );
}