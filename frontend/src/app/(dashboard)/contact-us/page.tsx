"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MapPin, Phone, Mail, Send, Clock } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
    setSubmitting(false);
  };

  const contactInfo = [
    {
      icon: MapPin,
      label: "Our Address",
      value: "123 Innovation Drive, Tech Park, San Francisco, CA 94105",
    },
    {
      icon: Phone,
      label: "Phone Number",
      value: "+1 (555) 123-4567",
    },
    {
      icon: Mail,
      label: "Email Address",
      value: "hello@studytrack.ai",
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: "Mon - Fri: 9:00 AM - 6:00 PM",
    },
  ];

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="max-w-6xl mx-auto space-y-8">
      <motion.div variants={fadeInUp} className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-st-accent to-st-accent-hover bg-clip-text text-transparent">
          Contact Us
        </h1>
        <p className="text-st-text-secondary text-sm max-w-2xl">
          Have questions, feedback, or need support? We&apos;d love to hear from you.
          Reach out and our team will get back to you promptly.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={fadeInUp} className="space-y-3">
            {contactInfo.map((item, index) => (
              <Card key={index} className="p-4 flex items-start gap-4 card-hover">
                <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-st-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-st-text-muted uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-st-text-primary mt-0.5">{item.value}</p>
                </div>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden h-[220px] card-hover p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019296807468!2d-122.41941548468104!3d37.77492927975957!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c5c0b0b0b%3A0x0!2sSan+Francisco%2C+CA!5e0!3m2!1sen!2sus!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="StudyTrack Office Location"
                className="grayscale-[30%] hover:grayscale-0 transition-all duration-500"
              />
            </Card>
          </motion.div>
        </div>

        <motion.div variants={fadeInUp} className="lg:col-span-3">
          <Card className="p-6 lg:p-8 card-hover">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-st-text-primary">Send us a message</h2>
                <p className="text-xs text-st-text-muted mt-1">
                  We typically respond within 24 hours
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Subject"
                name="subject"
                placeholder="How can we help you?"
                value={formData.subject}
                onChange={handleChange}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-st-text-secondary">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={handleChange}
                  className="flex w-full rounded-lg border border-st-border bg-st-bg-elevated/50 px-3 py-2 text-sm text-st-text-primary placeholder:text-st-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-st-accent/40 focus-visible:border-st-accent/30 focus-visible:bg-st-bg-elevated transition-all duration-200 resize-none"
                />
              </div>

              <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
