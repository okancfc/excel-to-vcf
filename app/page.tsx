"use client";
import { useState, useRef, useCallback, forwardRef } from "react"; // forwardRef import edildi
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale/tr";
import "react-datepicker/dist/react-datepicker.css";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Calendar,
} from "lucide-react";

registerLocale("tr", tr);

// --- TASARIM GÜNCELLEMESİ: Özel Tarih Giriş Bileşeni ---
const CustomDateInput = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void }
>(({ value, onClick }, ref) => (
  <button
    className="w-full text-left p-4 bg-white/60 border-2 border-transparent rounded-xl flex items-center justify-between hover:border-blue-300 transition-all duration-300 shadow-sm"
    onClick={onClick}
    ref={ref}
  >
    <span className="text-gray-700 font-medium">{value}</span>
    <Calendar className="w-5 h-5 text-blue-600" />
  </button>
));
CustomDateInput.displayName = "CustomDateInput";
// ----------------------------------------------------

export default function Home() {
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file || !selectedDate) {
      setStatus("Lütfen önce bir tarih seçin.");
      return;
    }

    setSuccess(false);
    setIsProcessing(true);
    setProcessedCount(0);
    setStatus("📄 Excel dosyası okunuyor...");

    try {
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = selectedDate.getFullYear().toString().slice(-2);
      const datePrefix = `${day}${month}${year}`;

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
        if (phone.startsWith("90") && phone.length === 12)
          phone = phone.slice(2);
        if (phone.length > 10) phone = phone.slice(-10);

        if (phone.length !== 10 || seen.has(phone)) return;

        seen.add(phone);
        const formattedPhone = `+90 ${phone.slice(0, 3)} ${phone.slice(
          3,
          6
        )} ${phone.slice(6, 8)} ${phone.slice(8)}`;

        const fullName = `${datePrefix} ${ad} ${soyad}`;
        const fileName = `${datePrefix}_${ad}_${soyad}.vcf`;

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
      saveAs(content, `${datePrefix} rehber.zip`);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".xlsx")) {
        handleFileUpload(file);
      }
    },
    [selectedDate]
  );

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
          <p className="text-gray-600">
            Excel dosyanızı VCF formatına kolayca dönüştürün
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl">
          {/* --- TASARIM GÜNCELLEMESİ: Tarih Seçme Alanı --- */}
          <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100/80 mb-6">
            <label className="flex items-center text-base font-semibold text-blue-800 mb-2">
              1. İşlem Tarihini Belirleyin
            </label>
            <DatePicker
              locale="tr"
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="d MMMM yyyy"
              customInput={<CustomDateInput />}
              popperClassName="z-30" // Takvimin diğer elemanların üzerinde kalmasını sağlar
            />
          </div>
          {/* ------------------------------------------- */}

          {/* Drag & Drop Area */}
          <label className="flex items-center text-lg font-semibold text-gray-800 mb-2">
            <Upload className="w-5 h-5 mr-2 text-blue-500" />
            2. Dosya Yükleyin
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
              ${
                isDragOver
                  ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50/50"
              }
              ${
                isProcessing || !selectedDate
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleInputChange}
              className="hidden"
              disabled={isProcessing || !selectedDate}
            />

            <div className="flex flex-col items-center space-y-4">
              {isProcessing ? (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-spin">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div
                  className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                  ${
                    isDragOver
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 hover:from-blue-100 hover:to-purple-100"
                  }
                `}
                >
                  <Upload
                    className={`w-8 h-8 ${
                      isDragOver ? "text-white" : "text-gray-600"
                    }`}
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {isProcessing ? "İşleniyor..." : "Excel Dosyanızı Seçin"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isProcessing
                    ? `${processedCount} kayıt işlendi`
                    : "Dosyayı sürükleyip bırakın veya tıklayarak seçin"}
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
            <div
              className={`
              mt-6 p-4 rounded-xl border transition-all duration-300
              ${
                success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }
            `}
            >
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
                  <h4 className="font-semibold text-green-800">
                    İndirme Tamamlandı!
                  </h4>
                  <p className="text-sm text-green-600">
                    ZIP dosyası otomatik olarak indirildi. Başka bir dosya
                    yükleyebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Akkan Caner
            </span>{" "}
            için geliştirildi
          </p>
        </div>
      </div>

      {/* --- TASARIM GÜNCELLEMESİ: Özel Takvim Stilleri --- */}
      <style jsx global>{`
        .react-datepicker-popper {
          padding-top: 8px !important;
        }
        .react-datepicker {
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 1rem !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          background-color: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(10px);
          font-family: inherit !important;
        }
        .react-datepicker__header {
          background: linear-gradient(to right, #60a5fa, #a78bfa) !important;
          border-radius: 1rem 1rem 0 0 !important;
          border-bottom: none !important;
          padding-top: 12px !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white !important;
          font-weight: 500 !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: white !important;
          border-width: 2px 2px 0 0 !important;
        }
        .react-datepicker__month-container {
          padding: 8px !important;
        }
        .react-datepicker__day {
          border-radius: 9999px !important;
          transition: all 0.2s ease-in-out !important;
        }
        .react-datepicker__day:hover {
          background-color: #dbeafe !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background: linear-gradient(to right, #3b82f6, #8b5cf6) !important;
          color: white !important;
          font-weight: bold !important;
        }
        .react-datepicker__day--today {
          font-weight: bold !important;
          background-color: rgba(96, 165, 250, 0.2) !important;
        }
        .react-datepicker__day--outside-month {
          opacity: 0.5;
        }
      `}</style>
      {/* ---------------------------------------------------- */}
    </main>
  );
}
