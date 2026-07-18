"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { parseGateQrToken } from "@/lib/gateQr";

type ScannerInstance = {
  start: (
    cameraConfig: { facingMode: "environment" },
    configuration: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: () => void
  ) => Promise<null | void>;
  stop: () => Promise<void>;
  clear: () => void | Promise<void>;
};

export function GateQrScanner({
  onTokenScanned,
  onClose
}: {
  onTokenScanned: (tokenId: string) => void;
  onClose: () => void;
}) {
  const scannerId = useId().replace(/:/g, "-");
  const scannerRef = useRef<ScannerInstance | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState("Starting camera…");

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (!active) return;

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            const tokenId = parseGateQrToken(decodedText);
            if (!tokenId || handledRef.current) {
              if (!tokenId) setStatus("This is not a TicketChain ticket QR. Scan the verification QR or enter the bill number.");
              return;
            }

            handledRef.current = true;
            setStatus("Ticket found. Checking Sepolia…");
            void scanner.stop().catch(() => undefined).finally(() => onTokenScanned(tokenId));
          },
          () => undefined
        );
        setStatus("Point the camera at a TicketChain QR code.");
      } catch {
        setStatus("Camera access is unavailable. Allow camera access or enter the bill number manually.");
      }
    };

    void start();

    return () => {
      active = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        void scanner.stop().catch(() => undefined).finally(() => {
          void Promise.resolve(scanner.clear()).catch(() => undefined);
        });
      }
    };
  }, [onTokenScanned, scannerId]);

  return (
    <div className="gate-scanner-panel" aria-live="polite">
      <div className="gate-scanner-heading">
        <div><p className="eyebrow">Camera scanner</p><h3>Scan TicketChain QR</h3></div>
        <button className="icon-button" onClick={onClose} aria-label="Close QR scanner"><X size={18} /></button>
      </div>
      <div id={scannerId} className="gate-scanner-view" />
      <p className="helper-copy"><Camera size={15} /> {status}</p>
      <button className="secondary-button full" onClick={onClose}>Cancel scanner</button>
    </div>
  );
}
