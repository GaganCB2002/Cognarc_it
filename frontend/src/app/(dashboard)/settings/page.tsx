"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { User, Shield, Bell, Palette, Globe, Brain, Eye, Link2, Database, Activity, Moon, Sun, Monitor, Save, LogOut, CheckCircle2, ScanFace, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { api } from "@/lib/api";

type BlendshapeCategory = {
  categoryName: string;
  score: number;
};

type AppSettings = {
  appearance: { theme: string; accentColor: string };
  notifications: { taskReminders: boolean; learningStreak: boolean; aiRecommendations: boolean; weeklyReport: boolean; achievementAlerts: boolean };
  language: string;
  ai: { autoSuggestions: boolean; smartSummaries: boolean; interviewPrep: boolean };
  privacy: { dataSharing: boolean; analyticsOptIn: boolean; publicProfile: boolean };
  tracking: { desktopAgent: boolean; browserExtension: boolean; idleDetection: boolean };
  auth: { passwordLogin: boolean; otpLogin: boolean; faceLogin: boolean };
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  
  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    targetRole: "",
    currentLevel: "",
    weeklyHours: 0,
    timezone: "UTC",
    skills: [] as string[],
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [settings, setSettings] = useState<AppSettings>({
    appearance: { theme: "light", accentColor: "#D4A373" },
    notifications: {
      taskReminders: true,
      learningStreak: true,
      aiRecommendations: true,
      weeklyReport: false,
      achievementAlerts: true
    },
    language: "en-US",
    ai: { autoSuggestions: true, smartSummaries: true, interviewPrep: true },
    privacy: { dataSharing: false, analyticsOptIn: true, publicProfile: false },
    tracking: { desktopAgent: true, browserExtension: true, idleDetection: true },
    auth: { passwordLogin: true, otpLogin: true, faceLogin: true }
  });

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Face enrollment
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceSaving, setFaceSaving] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);

  // Blink Detection
  const [blinkCount, setBlinkCount] = useState(0);
  const faceLandmarkerRef = useRef<{ detectForVideo: (video: HTMLVideoElement, startTimeMs: number) => { faceBlendshapes?: { categories: BlendshapeCategory[] }[] } } | null>(null);
  const requestRef = useRef<number | null>(null);
  const blinkCountRef = useRef(0);
  const cameraActiveRef = useRef(false);

  useEffect(() => {
     cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  // Load FaceLandmarker only when camera is active (lazy)
  useEffect(() => {
    if (!cameraActive) return;
    let isMounted = true;
    const initModel = async () => {
      try {
        const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
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
  }, [cameraActive]);

  // Cleanup camera on unmount
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

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
    stopCamera();
  }, [stopCamera]);

  const captureFaceRef = useRef(captureFace);
  useEffect(() => { captureFaceRef.current = captureFace; }, [captureFace]);

  const startCamera = useCallback(async () => {
    stopCamera();
    
    setCameraActive(true);
    setFaceImage(null);
    setFaceEnrolled(false);
    setBlinkCount(0);
    blinkCountRef.current = 0;

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
                  const leftEye = blendshapes.find((b: BlendshapeCategory) => b.categoryName === 'eyeBlinkLeft')?.score || 0;
                  const rightEye = blendshapes.find((b: BlendshapeCategory) => b.categoryName === 'eyeBlinkRight')?.score || 0;
                 
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
      showError("Camera access denied. Please allow camera permissions.");
    }
  }, [stopCamera]);

  const retakeFacePhoto = () => {
    setFaceImage(null);
    startCamera();
  };

  const saveFaceEnrollment = async () => {
    if (!faceImage) return;
    setFaceSaving(true);
    try {
      await api.put("/auth/enroll-face", { faceImage });
      setFaceEnrolled(true);
      showSuccess("Face enrolled successfully!");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to enroll face");
      setFaceImage(null);
    } finally {
      setFaceSaving(false);
    }
  };

  const sections = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Shield },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "appearance", label: "Appearance", icon: Palette },
    { key: "language", label: "Language", icon: Globe },
    { key: "ai", label: "AI Preferences", icon: Brain },
    { key: "privacy", label: "Privacy", icon: Eye },
    { key: "connected", label: "Connected Accounts", icon: Link2 },
    { key: "data", label: "Backup & Export", icon: Database },
    { key: "tracking", label: "Activity Tracking", icon: Activity },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const meRes = await api.get<{ user: { name: string; profile?: { bio?: string; targetRole?: string; currentLevel?: string; weeklyHours?: number; timezone?: string; skills?: string[]; githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string } } }>("/auth/me");
        const settingsRes = await api.get<{ settings: AppSettings }>("/auth/settings");

        const u = meRes.user;
        const p = u.profile || {};
        setProfileData({
          name: u.name || "",
          bio: p.bio || "",
          targetRole: p.targetRole || "",
          currentLevel: p.currentLevel || "",
          weeklyHours: p.weeklyHours || 0,
          timezone: p.timezone || "UTC",
          skills: p.skills || [],
          githubUrl: p.githubUrl || "",
          linkedinUrl: p.linkedinUrl || "",
          portfolioUrl: p.portfolioUrl || "",
        });

        if (settingsRes.settings && Object.keys(settingsRes.settings).length > 0) {
          setSettings(settingsRes.settings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showError("Avatar must be under 2MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      await api.put("/auth/profile", { avatar: dataUrl });
      showSuccess("Avatar updated! If a face was detected, it is now enrolled for face login.");
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/auth/profile", profileData);
      showSuccess("Profile updated successfully!");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await api.put("/auth/settings", { settings: newSettings });
      setSettings(newSettings);
      showSuccess("Settings saved");
    } catch {
      showError("Failed to save settings");
    }
  };

  const updateSettingField = (category: keyof AppSettings, field: string, value: boolean | string) => {
    const newSettings = { 
      ...settings, 
      [category]: { ...((settings[category] ?? {}) as Record<string, boolean | string>), [field]: value } 
    };
    setSettings(newSettings);
    // Auto-save on toggle
    saveSettings(newSettings);
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showError("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showSuccess("Password changed successfully");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      showSuccess("Initiating export...");
      // Add export logic here when implemented on backend
    } catch {
      showError("Failed to export data");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 pb-8 overflow-y-auto pr-2">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Configuration</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Settings</h1>
      </div>

      {(successMsg || errorMsg) && (
        <div className={`p-3 rounded-lg border flex items-center gap-2 ${successMsg ? 'bg-st-success/10 border-st-success text-st-success' : 'bg-st-danger/10 border-st-danger text-st-danger'}`}>
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{successMsg || errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {sections.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeSection === s.key ? "bg-st-accent/10 text-st-accent border border-st-accent/20" : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated"}`}>
              <s.icon className="w-4 h-4 shrink-0" />{s.label}
            </button>
          ))}
          <div className="pt-4 border-t border-st-border mt-4">
            <button onClick={logout} className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-st-danger hover:bg-st-danger/10 transition-colors flex items-center gap-3">
              <LogOut className="w-4 h-4" />Sign Out
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeSection === "profile" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Profile Settings</h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-st-bg-elevated flex items-center justify-center border-2 border-st-accent/30 overflow-hidden">
                  {user?.avatar ? (
                    <Image src={user.avatar} alt="Avatar" width={80} height={80} unoptimized className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-st-text-muted" />
                  )}
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif" onChange={handleAvatarUpload} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}>
                    {avatarUploading ? "Uploading..." : "Change Avatar"}
                  </Button>
                  <p className="text-xs text-st-text-muted mt-1">JPG, PNG, GIF. Max 2MB</p>
                  <p className="text-xs text-st-accent mt-0.5">Face detected in photo will be auto-enrolled for face login</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Full Name</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Email</label>
                  <input type="email" value={user?.email || ""} disabled
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-muted cursor-not-allowed opacity-70" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Target Role</label>
                  <input type="text" value={profileData.targetRole} onChange={e => setProfileData({...profileData, targetRole: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Current Level</label>
                  <input type="text" value={profileData.currentLevel} onChange={e => setProfileData({...profileData, currentLevel: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Weekly Study Goal (hrs)</label>
                  <input type="number" value={profileData.weeklyHours} onChange={e => setProfileData({...profileData, weeklyHours: parseInt(e.target.value) || 0})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Timezone</label>
                  <input type="text" value={profileData.timezone} onChange={e => setProfileData({...profileData, timezone: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-st-text-muted mb-1 block">Bio</label>
                <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-3 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">GitHub URL</label>
                  <input type="url" value={profileData.githubUrl} onChange={e => setProfileData({...profileData, githubUrl: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" placeholder="https://github.com/username" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">LinkedIn URL</label>
                  <input type="url" value={profileData.linkedinUrl} onChange={e => setProfileData({...profileData, linkedinUrl: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" placeholder="https://linkedin.com/in/username" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Portfolio URL</label>
                  <input type="url" value={profileData.portfolioUrl} onChange={e => setProfileData({...profileData, portfolioUrl: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" placeholder="https://your-portfolio.com" />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} variant="primary">
                {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
              </Button>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Appearance</h3>
              <div>
                <p className="text-sm text-st-text-secondary mb-3">Theme</p>
                <div className="flex gap-3">
                  {[
                    { icon: Moon, label: "dark", display: "Dark" },
                    { icon: Sun, label: "light", display: "Light" },
                    { icon: Monitor, label: "system", display: "System" },
                  ].map((t, i) => {
                    const isActive = settings.appearance.theme === t.label;
                    return (
                      <button key={i} onClick={() => { setTheme(t.label); updateSettingField("appearance", "theme", t.label); }}
                        className={`px-6 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${isActive ? "bg-st-accent/10 border-st-accent/30 text-st-accent" : "bg-st-bg-elevated border-st-border text-st-text-secondary hover:bg-st-bg-secondary"}`}>
                        <t.icon className="w-4 h-4" />{t.display}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm text-st-text-secondary mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {["#FFCF70", "#3B82F6", "#10B981", "#8B5CF6", "#F43F5E", "#F59E0B"].map(c => {
                    const isActive = settings.appearance.accentColor === c;
                    return (
                      <button key={c} onClick={() => updateSettingField("appearance", "accentColor", c)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${isActive ? "border-white scale-110" : "border-transparent hover:border-white/50"}`} 
                        style={{ backgroundColor: c }} />
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Notification Preferences</h3>
              {[
                { key: "taskReminders" as const, label: "Task Reminders", desc: "Get notified before task deadlines" },
                { key: "learningStreak" as const, label: "Learning Streak", desc: "Daily reminder to maintain your streak" },
                { key: "aiRecommendations" as const, label: "AI Recommendations", desc: "New learning suggestions from AI" },
                { key: "weeklyReport" as const, label: "Weekly Report", desc: "Automated weekly productivity summary" },
                { key: "achievementAlerts" as const, label: "Achievement Alerts", desc: "Celebrate milestones and achievements" },
              ].map((n, i) => {
                const enabled = settings.notifications[n.key];
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-st-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">{n.label}</p>
                      <p className="text-xs text-st-text-muted">{n.desc}</p>
                    </div>
                    <button onClick={() => updateSettingField("notifications", n.key, !enabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-st-accent" : "bg-st-bg-elevated border border-st-border"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                )
              })}
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Security Settings</h3>
              <div>
                <label className="text-xs text-st-text-muted mb-1 block">Current Password</label>
                <input type="password" placeholder="Enter current password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="w-full max-w-md bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">New Password</label>
                  <input type="password" placeholder="Enter new password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Confirm Password</label>
                  <input type="password" placeholder="Confirm new password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
              </div>
              <Button variant="primary" onClick={changePassword} disabled={saving || !passwords.currentPassword || !passwords.newPassword}>
                {saving ? "Updating..." : "Update Password"}
              </Button>

              {/* Authentication Methods */}
              <div className="border-t border-st-border pt-6 mt-6">
                <h4 className="text-sm font-bold text-st-text-primary mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-st-accent" /> Authentication Methods
                </h4>
                <p className="text-xs text-st-text-muted mb-4">Enable or disable sign-in methods for your account.</p>
                {[
                  { key: "passwordLogin" as const, label: "Password Login", desc: "Sign in using your email and password" },
                  { key: "otpLogin" as const, label: "OTP / Email Login", desc: "Sign in using a one-time code sent to your email" },
                  { key: "faceLogin" as const, label: "Face Login", desc: "Sign in using facial recognition" },
                ].map((n, i) => {
                  const enabled = settings.auth?.[n.key];
                  return (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-st-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-st-text-primary">{n.label}</p>
                        <p className="text-xs text-st-text-muted">{n.desc}</p>
                      </div>
                      <button onClick={() => updateSettingField("auth", n.key, !enabled)}
                        className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-st-accent" : "bg-st-bg-elevated border border-st-border"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Face Enrollment Section */}
              <div className="border-t border-st-border pt-6 mt-6">
                <h4 className="text-sm font-bold text-st-text-primary mb-1 flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-st-accent" /> Face Login
                </h4>
                <p className="text-xs text-st-text-muted mb-4">Enroll your face for quick login. Position your face clearly and keep your eyes open.</p>

                <canvas ref={canvasRef} className="hidden" />

                {!faceImage ? (
                  <div className="text-center py-6 bg-st-bg-elevated rounded-lg border border-st-border">
                    <div className={`flex flex-col items-center justify-center ${cameraActive ? 'hidden' : ''}`}>
                      <ScanFace className="w-10 h-10 mx-auto text-st-text-muted mb-2" />
                      <Button type="button" variant="primary" size="sm" onClick={startCamera}>
                        <Camera className="w-4 h-4 mr-1" /> Start Camera
                      </Button>
                    </div>
                    
                    <div className={`flex flex-col items-center ${!cameraActive ? 'hidden' : ''}`}>
                      <div className="relative inline-block rounded-lg overflow-hidden border-2 border-st-accent/50 mb-3">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-[240px] h-auto" />
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono flex gap-1 items-center z-10">
                          <Eye className="w-3 h-3 text-st-accent" /> Blinks: {blinkCount} / 3
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 justify-center items-center">
                        <p className="text-xs text-st-accent font-medium mb-1 bg-st-accent/10 px-3 py-1.5 rounded-full border border-st-accent/20">Please blink your eyes 3 times</p>
                        <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-st-bg-elevated rounded-lg border border-st-border">
                    <div className="inline-block rounded-lg overflow-hidden border-2 border-emerald-500/50 mb-2">
                      <Image src={`data:image/jpeg;base64,${faceImage}`} alt="Captured face" width={96} height={96} unoptimized className="w-24 h-24 object-cover" />
                    </div>
                    <p className="text-xs text-emerald-400 mb-2 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Face captured
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button type="button" variant="primary" size="sm" onClick={saveFaceEnrollment} disabled={faceSaving}>
                        {faceSaving ? "Saving..." : "Save Face"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={retakeFacePhoto}>Retake</Button>
                    </div>
                    {faceEnrolled && (
                      <p className="text-xs text-emerald-400 mt-2 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Face enrolled successfully!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeSection === "language" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Language & Region</h3>
              <div>
                <label className="text-xs text-st-text-muted mb-1 block">Display Language</label>
                <select value={settings.language} onChange={e => {
                  const newSettings = { ...settings, language: e.target.value };
                  setSettings(newSettings);
                  saveSettings(newSettings);
                }} className="w-full max-w-xs bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50">
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                </select>
              </div>
            </Card>
          )}

          {activeSection === "ai" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">AI Preferences</h3>
              {[
                { key: "autoSuggestions" as const, label: "Auto-Suggestions", desc: "AI assists with writing code and notes" },
                { key: "smartSummaries" as const, label: "Smart Summaries", desc: "Automatically summarize long documents" },
                { key: "interviewPrep" as const, label: "Interview Prep Mode", desc: "Tailor AI responses for interview readiness" },
              ].map((n, i) => {
                const enabled = settings.ai?.[n.key];
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-st-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">{n.label}</p>
                      <p className="text-xs text-st-text-muted">{n.desc}</p>
                    </div>
                    <button onClick={() => updateSettingField("ai", n.key, !enabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-st-accent" : "bg-st-bg-elevated border border-st-border"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                )
              })}
            </Card>
          )}

          {activeSection === "privacy" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Privacy Settings</h3>
              {[
                { key: "dataSharing" as const, label: "Anonymous Data Sharing", desc: "Help improve the product by sharing usage stats" },
                { key: "analyticsOptIn" as const, label: "Personal Analytics", desc: "Allow system to analyze your study patterns" },
                { key: "publicProfile" as const, label: "Public Profile", desc: "Allow others to see your public achievements" },
              ].map((n, i) => {
                const enabled = settings.privacy?.[n.key];
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-st-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">{n.label}</p>
                      <p className="text-xs text-st-text-muted">{n.desc}</p>
                    </div>
                    <button onClick={() => updateSettingField("privacy", n.key, !enabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-st-accent" : "bg-st-bg-elevated border border-st-border"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                )
              })}
            </Card>
          )}

          {activeSection === "connected" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Connected Accounts</h3>
              <p className="text-sm text-st-text-secondary mb-4">Connect your professional profiles.</p>
              
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#333] text-white rounded-lg flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-st-text-primary">GitHub</p>
                    <p className="text-xs text-st-text-muted">Not connected</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0077b5] text-white rounded-lg flex items-center justify-center shrink-0">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-st-text-primary">LinkedIn</p>
                    <p className="text-xs text-st-text-muted">Not connected</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === "tracking" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-st-accent" /> Activity Tracking
              </h3>
              {[
                { key: "desktopAgent" as const, label: "Desktop Agent Integration", desc: "Allow tracking from local Desktop Agent" },
                { key: "browserExtension" as const, label: "Browser Extension Integration", desc: "Allow tracking from Chrome Extension" },
                { key: "idleDetection" as const, label: "Smart Idle Detection", desc: "Automatically pause sessions when inactive" },
              ].map((n, i) => {
                const enabled = settings.tracking?.[n.key];
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-st-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">{n.label}</p>
                      <p className="text-xs text-st-text-muted">{n.desc}</p>
                    </div>
                    <button onClick={() => updateSettingField("tracking", n.key, !enabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-st-accent" : "bg-st-bg-elevated border border-st-border"}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                )
              })}
            </Card>
          )}

          {activeSection === "data" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Backup & Export</h3>
              <p className="text-sm text-st-text-secondary">Export your data, notes, and progress history.</p>
              
              <div className="flex flex-col gap-4 max-w-xs pt-2">
                <Button variant="primary" onClick={exportData} className="w-full justify-center">
                  Export Data as JSON
                </Button>
                <Button variant="outline" onClick={exportData} className="w-full justify-center">
                  Export Reports to PDF
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
