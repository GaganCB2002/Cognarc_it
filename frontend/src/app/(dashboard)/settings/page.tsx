"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Settings as SettingsIcon, User, Shield, Bell, Palette, Globe, Brain, Eye, Link2, Database, Activity, Moon, Sun, Monitor, ChevronRight, Save, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [darkMode, setDarkMode] = useState(true);

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

  return (
    <div className="h-full flex flex-col gap-6 pb-8 overflow-y-auto">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Configuration</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Settings</h1>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Settings Navigation */}
        <div className="col-span-3 space-y-1">
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
        <div className="col-span-9">
          {activeSection === "profile" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Profile Settings</h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-st-bg-elevated flex items-center justify-center border-2 border-st-accent/30">
                  <User className="w-8 h-8 text-st-text-muted" />
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-st-text-muted mt-1">JPG, PNG, GIF. Max 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: "Developer", type: "text" },
                  { label: "Email", value: "dev@studytrack.app", type: "email" },
                  { label: "Target Role", value: "Senior Full Stack Engineer", type: "text" },
                  { label: "Current Level", value: "Mid-level", type: "text" },
                  { label: "Weekly Study Goal (hrs)", value: "30", type: "number" },
                  { label: "Timezone", value: "Asia/Kolkata (IST)", type: "text" },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="text-xs text-st-text-muted mb-1 block">{field.label}</label>
                    <input type={field.type} defaultValue={field.value}
                      className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-st-text-muted mb-1 block">Bio</label>
                <textarea defaultValue="Full-stack developer passionate about distributed systems and AI."
                  className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-3 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50 resize-none" rows={3} />
              </div>
              <Button variant="primary"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Appearance</h3>
              <div>
                <p className="text-sm text-st-text-secondary mb-3">Theme</p>
                <div className="flex gap-3">
                  {[
                    { icon: Moon, label: "Dark", active: darkMode },
                    { icon: Sun, label: "Light", active: !darkMode },
                    { icon: Monitor, label: "System", active: false },
                  ].map((theme, i) => (
                    <button key={i} onClick={() => setDarkMode(theme.label === "Dark")}
                      className={`px-6 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${theme.active ? "bg-st-accent/10 border-st-accent/30 text-st-accent" : "bg-st-bg-elevated border-st-border text-st-text-secondary"}`}>
                      <theme.icon className="w-4 h-4" />{theme.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-st-text-secondary mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {["#FFCF70", "#3B82F6", "#10B981", "#8B5CF6", "#F43F5E", "#F59E0B"].map(c => (
                    <button key={c} className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white transition-colors" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Notification Preferences</h3>
              {[
                { label: "Task Reminders", desc: "Get notified before task deadlines", enabled: true },
                { label: "Learning Streak", desc: "Daily reminder to maintain your streak", enabled: true },
                { label: "AI Recommendations", desc: "New learning suggestions from AI", enabled: true },
                { label: "Weekly Report", desc: "Automated weekly productivity summary", enabled: false },
                { label: "Achievement Alerts", desc: "Celebrate milestones and achievements", enabled: true },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-st-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-st-text-primary">{n.label}</p>
                    <p className="text-xs text-st-text-muted">{n.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-colors ${n.enabled ? "bg-st-accent" : "bg-st-bg-elevated border border-st-border"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${n.enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-st-text-primary">Security Settings</h3>
              <div>
                <label className="text-xs text-st-text-muted mb-1 block">Current Password</label>
                <input type="password" placeholder="Enter current password" className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
                <div>
                  <label className="text-xs text-st-text-muted mb-1 block">Confirm Password</label>
                  <input type="password" placeholder="Confirm new password" className="w-full bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary focus:outline-none focus:border-st-accent/50" />
                </div>
              </div>
              <Button variant="primary">Update Password</Button>
            </Card>
          )}

          {!["profile", "appearance", "notifications", "security"].includes(activeSection) && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-st-text-primary mb-4">{sections.find(s => s.key === activeSection)?.label}</h3>
              <p className="text-sm text-st-text-secondary">Configuration options for {sections.find(s => s.key === activeSection)?.label?.toLowerCase()} will be available here.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
