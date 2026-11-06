"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

const FORMATS = ["code_128", "code_39"];
const CAMERA = { video: { facingMode: { ideal: "environment" } }, audio: false };

/**
 * Live camera view that reads a Code 128 / Code 39 barcode and calls `onScan(text)` once.
 * Uses the browser's BarcodeDetector where it exists (Chrome on Android) and falls back to ZXing
 * (iPhone Safari). Browsers only allow the camera on https:// pages or localhost.
 */
export function BarcodeScanner({ onScan }) {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let stopped = false;
    let stream;
    let timer;
    let controls;

    const found = (text) => {
      if (stopped || !text) return;
      stopped = true;
      onScanRef.current(text.trim());
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        return setProblem("The camera needs a secure (https) connection.");
      }
      try {
        const video = videoRef.current;
        if ("BarcodeDetector" in window) {
          stream = await navigator.mediaDevices.getUserMedia(CAMERA);
          if (stopped) return stream.getTracks().forEach((t) => t.stop());
          video.srcObject = stream;
          await video.play();
          const detector = new window.BarcodeDetector({ formats: FORMATS });
          const tick = async () => {
            if (stopped) return;
            try {
              const codes = await detector.detect(video);
              if (codes[0]?.rawValue) return found(codes[0].rawValue);
            } catch {
              /* frame not ready yet */
            }
            timer = setTimeout(tick, 150);
          };
          tick();
        } else {
          const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
          const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.CODE_39]]]);
          const reader = new BrowserMultiFormatReader(hints);
          const handle = await reader.decodeFromConstraints(CAMERA, video, (result) => result && found(result.getText()));
          if (stopped) handle.stop();
          else controls = handle;
        }
      } catch (error) {
        setProblem(error?.name === "NotAllowedError" ? "Camera access was blocked. Allow the camera for this page and try again." : "Couldn't start the camera on this device.");
      }
    }

    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      controls?.stop();
    };
  }, []);

  if (problem) {
    return (
      <div role="alert" className="flex flex-col items-center rounded-xl border border-line-strong bg-cream-100 px-6 py-8 text-center">
        <Camera size={40} aria-hidden="true" className="text-muted" />
        <p className="mt-3 text-base font-semibold text-ink">{problem}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} muted playsInline aria-label="Camera view for scanning your ID card" className="aspect-[4/3] w-full object-cover" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[10%] top-1/2 h-[38%] -translate-y-1/2 rounded-lg border-2 border-white/80" />
    </div>
  );
}
