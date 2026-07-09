"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RefreshCw, Beaker, ShieldCheck, Home, KeyRound, ScanFace, Eye, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

type LoginMode = "password" | "otp" | "face";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const [mode, setMode] = useState<LoginMode>("password");

  // Shared
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password login
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP login
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);

  // Face login
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [captured, setCaptured] = useState(false);

  // Blink Detection
  const [blinkCount, setBlinkCount] = useState(0);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const blinkCountRef = useRef(0);
  const cameraActiveRef = useRef(false);

  // Captcha
  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaTimer, setCaptchaTimer] = useState(300);

  const fetchCaptcha = useCallback(async () => {
    // Captcha is disabled
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  useEffect(() => {
    if (captchaTimer > 0) {
      const timer = setTimeout(() => setCaptchaTimer((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (captchaKey) {
      fetchCaptcha();
    }
  }, [captchaTimer, captchaKey, fetchCaptcha]);

  // Load FaceLandmarker
  useEffect(() => {
    let isMounted = true;
    const initModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        if (isMounted) {
            faceLandmarkerRef.current = landmarker;
        }
      } catch (err) {
        console.error("Failed to load FaceLandmarker", err);
      }
    };
    initModel();
    return () => {
        isMounted = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
     cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  // Password login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, "disabled", "disabled");
    } catch (err: any) {
      setError(err.message || "Login failed");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers
  const handleSendOtp = async () => {
    if (!email.trim()) { setError("Enter your email first"); return; }
    setError("");
    setOtpLoading(true);
    try {
      await api.post("/auth/send-otp", { email, captchaKey: "disabled", captchaAnswer: "disabled" });
      setOtpSent(true);
      setSuccess("OTP sent to your registered email");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      fetchCaptcha();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpVerifyLoading(true);
    try {
      await login(email, otp, "disabled", "disabled", true);
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
      fetchCaptcha();
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  // Face login handlers
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  const captureFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];
    setFaceImage(base64);
    setCaptured(true);
    stopCamera();
  }, [stopCamera]);

  const captureFaceRef = useRef(captureFace);
  useEffect(() => { captureFaceRef.current = captureFace; }, [captureFace]);

  const startCamera = useCallback(async () => {
    setError("");
    stopCamera();
    
    // Set active immediately to ensure video element is rendered
    setCameraActive(true);
    setCaptured(false);
    setFaceImage(null);
    setBlinkCount(0);
    blinkCountRef.current = 0;

    // Small delay to ensure previous stream is fully released and DOM is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        let lastVideoTime = -1;
        let blinkState = false;

        const renderLoop = () => {
           if (!videoRef.current || !faceLandmarkerRef.current || !cameraActiveRef.current) return;
           
           const video = videoRef.current;
           const startTimeMs = performance.now();
           if (video.currentTime !== lastVideoTime) {
             lastVideoTime = video.currentTime;
             const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
             
             if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                 const blendshapes = results.faceBlendshapes[0].categories;
                 const leftEye = blendshapes.find((b: any) => b.categoryName === 'eyeBlinkLeft')?.score || 0;
                 const rightEye = blendshapes.find((b: any) => b.categoryName === 'eyeBlinkRight')?.score || 0;
                 
                 const isCurrentlyBlinking = leftEye > 0.4 && rightEye > 0.4;
                 
                 if (isCurrentlyBlinking && !blinkState) {
                     blinkState = true;
                 } else if (!isCurrentlyBlinking && blinkState) {
                     blinkState = false;
                     blinkCountRef.current += 1;
                     setBlinkCount(blinkCountRef.current);
                     
                     if (blinkCountRef.current >= 3) {
                         captureFaceRef.current(); 
                         return; // stop RAF
                     }
                 }
             }
           }
           requestRef.current = requestAnimationFrame(renderLoop);
        };
        requestRef.current = requestAnimationFrame(renderLoop);
      }
    } catch {
      setCameraActive(false);
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(async () => {
    setCaptured(false);
    setFaceImage(null);
    await startCamera();
  }, [startCamera]);

  const handleFaceLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceImage) { setError("Please capture your face first by blinking 3 times."); return; }
    if (!email.trim()) { setError("Enter your email first"); return; }
    setError("");
    setFaceLoading(true);
    try {
      await login(email, faceImage, "disabled", "disabled", false, true);
    } catch (err: any) {
      setError(err.message || "Face login failed");
      fetchCaptcha();
    } finally {
      setFaceLoading(false);
    }
  };

  const tabs: { key: LoginMode; label: string; icon: any }[] = [
    { key: "password", label: "Password", icon: Beaker },
    { key: "otp", label: "OTP", icon: KeyRound },
    { key: "face", label: "Face", icon: ScanFace },
  ];

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 mr-3 rounded-lg hover:bg-st-bg-elevated transition-colors" aria-label="Home">
          <Home className="w-5 h-5 text-st-text-secondary" />
        </Link>
        <h3 className="text-xl font-semibold text-st-text-primary flex-1">sign in to your account</h3>
      </div>

      {/* Demo Account Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => { setEmail("user@studytrack.dev"); setPassword("password123"); setMode("password"); }} className="text-xs py-1 h-8 border-st-accent text-st-accent hover:bg-st-accent/10">
          <Beaker size={14} className="mr-1" /> Test User
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { setEmail("admin@studytrack.dev"); setPassword("password123"); setMode("password"); }} className="text-xs py-1 h-8 border-st-accent text-st-accent hover:bg-st-accent/10">
          <ShieldCheck size={14} className="mr-1" /> Admin
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { setEmail("gaganbadiger2002@gmail.com"); setPassword(""); setMode("password"); }} className="text-xs py-1 h-8 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10">
          <Eye size={14} className="mr-1" /> GaganCB
        </Button>
      </div>

      {justRegistered && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-sm text-emerald-400 font-medium">✓ Registration successful!</p>
          <p className="text-xs text-emerald-400/70 mt-1">Your account is ready. Sign in below to get started.</p>
        </div>
      )}

      {/* Login Mode Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-st-bg-elevated rounded-xl border border-st-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setMode(t.key); setError(""); setSuccess(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === t.key ? "bg-st-accent text-black shadow-lg" : "text-st-text-secondary hover:text-st-text-primary"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ===== PASSWORD TAB ===== */}
      {mode === "password" && (
        <motion.form key="password" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="space-y-5" onSubmit={handleLogin}>
          <Input label="email address" id="email" name="email" type="email" autoComplete="email" required placeholder="developer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div>
            <Input label="password" id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex items-center justify-end mt-2">
              <Link href="/forgot-password" className="text-sm font-medium text-st-accent hover:text-st-accent-hover">forgot your password?</Link>
            </div>
          </div>


          {error && <p className="text-sm text-st-danger text-center">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
            {loading ? "signing in..." : "continue"}
          </Button>
        </motion.form>
      )}

      {/* ===== OTP TAB ===== */}
      {mode === "otp" && (
        <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
          <Input label="email address" id="otp-email" name="email" type="email" autoComplete="email" required placeholder="developer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />


          {!otpSent ? (
            <Button type="button" onClick={handleSendOtp} disabled={otpLoading || !email.trim()} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
              {otpLoading ? "sending..." : "send OTP to email"}
            </Button>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-400">{success}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-st-text-muted mb-1.5">enter OTP</label>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" required placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6}
                  className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2.5 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent text-center font-mono tracking-[0.3em]" />
              </div>
              {error && <p className="text-sm text-st-danger text-center">{error}</p>}
              <Button type="submit" disabled={otpVerifyLoading || otp.length !== 6} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
                {otpVerifyLoading ? "verifying..." : "verify & sign in"}
              </Button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-xs text-st-text-muted hover:text-st-accent w-full text-center">
                resend OTP
              </button>
            </form>
          )}
        </motion.div>
      )}

      {/* ===== FACE TAB ===== */}
      {mode === "face" && (
        <motion.form key="face" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="space-y-5" onSubmit={handleFaceLogin}>
          <Input label="email address" id="face-email" name="email" type="email" autoComplete="email" required placeholder="developer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />


          {/* Webcam Section */}
          <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-st-accent" />
              <span className="text-xs font-semibold text-st-text-muted tracking-wider">face verification</span>
              {captured && <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto"><CheckCircle2 className="w-3 h-3" /> captured ✓</span>}
            </div>

            <div className={`text-center ${!cameraActive && !captured ? 'hidden' : ''}`}>
              <div className="relative inline-block rounded-lg overflow-hidden border-2 border-st-accent/50 mb-3" style={{ minHeight: '240px' }}>
                <video ref={videoRef} autoPlay playsInline muted className={`w-full max-w-[320px] h-auto rounded-lg ${captured ? 'hidden' : ''}`} />
                {cameraActive && !captured && (
                  <div className="absolute inset-0 flex items-center justify-center bg-st-bg-card text-xs text-st-text-muted">Camera loading...</div>
                )}
                
                {cameraActive && !captured && (
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono flex gap-1 items-center z-10">
                    <Eye className="w-3 h-3 text-st-accent" /> Blinks: {blinkCount} / 3
                  </div>
                )}

                {captured && faceImage && (
                  <img src={`data:image/jpeg;base64,${faceImage}`} alt="Captured face" className="w-full max-w-[320px] h-auto rounded-lg" />
                )}
              </div>

              {cameraActive && !captured && (
                <div className="flex flex-col gap-2 justify-center items-center">
                  <p className="text-xs text-st-accent font-medium mb-1 bg-st-accent/10 px-3 py-1.5 rounded-full border border-st-accent/20">Please blink your eyes 3 times to verify liveness</p>
                  <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>Cancel</Button>
                </div>
              )}

              {captured && faceImage && (
                <div className="flex gap-2 justify-center">
                  <Button type="button" variant="ghost" size="sm" onClick={retakePhoto}>Retake Photo</Button>
                </div>
              )}
            </div>

            {!cameraActive && !captured && (
              <div className="text-center py-8">
                <ScanFace className="w-12 h-12 mx-auto text-st-text-muted mb-3" />
                <p className="text-xs text-st-text-muted mb-3">Position your face clearly and blink 3 times</p>
                <Button type="button" variant="primary" size="sm" onClick={startCamera}>
                  <Camera className="w-4 h-4 mr-1" /> Start Camera
                </Button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {error && <p className="text-sm text-st-danger text-center">{error}</p>}
          <Button type="submit" disabled={faceLoading || !faceImage || !email.trim()} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
            {faceLoading ? "verifying face..." : "sign in with face"}
          </Button>
        </motion.form>
      )}

      <p className="mt-8 text-center text-xs text-st-text-secondary">
        not a member?{" "}
        <Link href="/register" className="font-medium text-st-accent hover:text-st-accent-hover">apply for early access</Link>
      </p>
    </div>
  );
}

function CaptchaSection({ captchaQuestion, captchaAnswer, captchaTimer, onCaptchaChange, onRefresh }: {
  captchaQuestion: string; captchaAnswer: string; captchaTimer: number; onCaptchaChange: (v: string) => void; onRefresh: () => void;
}) {
  return (
    <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-st-text-muted tracking-wider">security verification</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-st-text-muted font-mono">{Math.floor(captchaTimer / 60)}m {captchaTimer % 60}s</span>
          <button type="button" onClick={onRefresh} className="text-st-text-muted hover:text-st-accent transition-colors" aria-label="Refresh captcha">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm font-medium text-st-text-primary mb-3 text-center py-2 bg-st-bg-card rounded-lg border border-st-border/30 font-mono tracking-wider">{captchaQuestion || "Loading..."}</p>
      <input type="text" placeholder="enter the code shown above" autoComplete="off" required value={captchaAnswer} onChange={(e) => onCaptchaChange(e.target.value.toLowerCase())} maxLength={6} className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent text-center font-mono tracking-[0.3em]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-st-text-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
