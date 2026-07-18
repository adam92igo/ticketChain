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

async function stopAndClear(scanner: ScannerInstance) {
  try {
    await scanner.stop();
  } catch {
    // The scanner may not have started or may already be stopped.
  }

  try {
    await scanner.clear();
  } catch {
    // Cleanup is best-effort when the scanner startup was interrupted.
  }
}

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
    let starting = false;
    let scanner: ScannerInstance | null = null;

    const cleanup = () => {
      if (!scanner) return;
      if (scannerRef.current === scanner) scannerRef.current = null;
      void stopAndClear(scanner);
    };

    const start = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (!active) return;

        const scannerInstance = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        scanner = scannerInstance;
        scannerRef.current = scannerInstance;

        starting = true;
        await scannerInstance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (!active) return;

            const tokenId = parseGateQrToken(decodedText);
            if (!tokenId || handledRef.current) {
              if (!tokenId && active) setStatus("This is not a TicketChain ticket QR. Scan the verification QR or enter the bill number.");
              return;
            }

            handledRef.current = true;
            setStatus("Ticket found. Checking Sepolia…");
            void stopAndClear(scannerInstance).then(() => {
              if (active) onTokenScanned(tokenId);
            });
          },
          () => undefined
        );
        starting = false;

        if (!active) {
          cleanup();
          return;
        }

        if (!handledRef.current) setStatus("Point the camera at a TicketChain QR code.");
      } catch {
        starting = false;
        cleanup();
        if (active) setStatus("Camera access is unavailable. Allow camera access or enter the bill number manually.");
      }
    };

    void start();

    return () => {
      active = false;
      if (starting || scanner) cleanup();
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
