import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../server';

export interface GeneratePdfOptions {
  outputPath?: string;
}

export async function generateSessionPdfReport(sessionId: string, userId: string, options: GeneratePdfOptions = {}): Promise<Buffer> {
  const session = await prisma.trackingSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      activities: { orderBy: { createdAt: 'asc' } },
      browserTelemetry: { orderBy: { timestamp: 'asc' } },
      desktopTelemetry: { orderBy: { timestamp: 'asc' } },
      reports: true
    }
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const report = session.reports?.[0];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Colors - Theme "Deep Work Mode" (Dark Slate, Cyan/Accent, Emerald/Success, Rose/Danger)
    const primaryColor = '#0F172A'; // Slate 900
    const secondaryColor = '#475569'; // Slate 600
    const accentColor = '#06B6D4'; // Cyan 500
    const successColor = '#10B981'; // Emerald 500
    const warningColor = '#F59E0B'; // Amber 500
    const dangerColor = '#EF4444'; // Rose 500
    const lightBg = '#F8FAFC'; // Slate 50
    const borderColor = '#E2E8F0'; // Slate 200

    // Header Helper
    const addHeader = (title: string) => {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(20).text(title, { align: 'left' });
      doc.moveDown(0.2);
      doc.strokeColor(accentColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);
    };

    // 1. Page Header (Logo & Subtitle)
    doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(14).text('STUDYTRACK', { characterSpacing: 1 });
    doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text('DEEP WORK SESSIONS', { characterSpacing: 2 });
    doc.moveDown(1.5);

    // Title & Metadata Block
    const sessionDate = session.startTime.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(22).text(session.projectName || 'General Deep Work Session');
    doc.fillColor(secondaryColor).font('Helvetica').fontSize(10).text(`Session Date: ${sessionDate}`);
    doc.text(`Device: ${session.deviceName || 'Web Portal'}`);
    doc.moveDown(1.5);

    // 2. Metrics Cards (2x2 Grid)
    const durationMin = Math.round((session.endTime ? (session.endTime.getTime() - session.startTime.getTime() - session.totalPauseMs) / 1000 : 0) / 60);
    const prodScore = report?.productivityScore || 0;
    const focusScore = report?.focusScore || 0;
    const totalEvents = session.activities.length;

    // Card drawing helper
    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, color: string) => {
      doc.rect(x, y, w, h).fillAndStroke(lightBg, borderColor);
      doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), x + 15, y + 15);
      doc.fillColor(color).font('Helvetica-Bold').fontSize(24).text(value, x + 15, y + 30);
    };

    drawCard(50, doc.y, 235, 75, 'Deep Work Duration', `${durationMin} mins`, accentColor);
    drawCard(310, doc.y, 235, 75, 'Productivity Score', `${prodScore}%`, successColor);
    doc.moveDown(6); // height spacing (approx 80 points)
    
    drawCard(50, doc.y, 235, 75, 'Focus Score', `${focusScore}/100`, warningColor);
    drawCard(310, doc.y, 235, 75, 'Micro Events Captured', String(totalEvents), primaryColor);
    doc.moveDown(6.5);

    // 3. AI Narrative Summary
    if (report && report.summary) {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('AI Summary & Insights');
      doc.moveDown(0.4);
      doc.rect(50, doc.y, 495, 85).fill(lightBg);
      
      const summaryY = doc.y + 10;
      doc.fillColor(primaryColor).font('Helvetica-Oblique').fontSize(9.5)
        .text(report.summary, 65, summaryY, { width: 465, align: 'justify', lineGap: 3 });
      doc.moveDown(7.5);
    }

    // 4. In-App Activity & Modules breakdown
    const activityMap: Record<string, number> = {};
    session.activities.forEach((act) => {
      activityMap[act.category] = (activityMap[act.category] || 0) + act.duration;
    });

    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('Activity Category Breakdown');
    doc.moveDown(0.5);

    // Render category table
    let tableY = doc.y;
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
    doc.text('CATEGORY', 60, tableY);
    doc.text('TIME LOGGED', 200, tableY);
    doc.text('PERCENTAGE', 350, tableY);
    doc.strokeColor(borderColor).lineWidth(1).moveTo(50, tableY + 12).lineTo(545, tableY + 12).stroke();
    
    let currentY = tableY + 20;
    const totalSec = Math.max(1, Object.values(activityMap).reduce((a, b) => a + b, 0));

    Object.entries(activityMap).forEach(([cat, sec]) => {
      const min = Math.round(sec / 60);
      const pct = Math.round((sec / totalSec) * 100);
      doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
      doc.text(cat.replace('_', ' '), 60, currentY);
      doc.text(`${min} mins`, 200, currentY);
      doc.text(`${pct}%`, 350, currentY);
      currentY += 15;
    });
    doc.moveDown(2);

    // 5. Add New Page for Timeline & Telemetry
    doc.addPage();
    addHeader('Detailed Activity Logs');

    // Page Visits / Activities list
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('In-App Micro Activities');
    doc.moveDown(0.4);

    let logY = doc.y;
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8.5);
    doc.text('TIME', 55, logY);
    doc.text('EVENT TYPE', 115, logY);
    doc.text('MODULE / DETAIL', 220, logY);
    doc.strokeColor(borderColor).lineWidth(1).moveTo(50, logY + 12).lineTo(545, logY + 12).stroke();

    let eventY = logY + 20;
    const displayEvents = session.activities.slice(0, 15); // Show first 15 events to fit page neatly

    displayEvents.forEach((act) => {
      if (eventY > 730) {
        doc.addPage();
        eventY = 50;
      }
      const timeStr = act.createdAt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      doc.fillColor(primaryColor).font('Helvetica').fontSize(8.5);
      doc.text(timeStr, 55, eventY);
      
      let typeColor = primaryColor;
      if (act.eventType.includes('CLICK')) typeColor = accentColor;
      if (act.eventType.includes('SUBMIT') || act.eventType.includes('DONE')) typeColor = successColor;
      if (act.eventType.includes('IDLE')) typeColor = dangerColor;

      doc.fillColor(typeColor).font('Helvetica-Bold').text(act.eventType, 115, eventY);
      doc.fillColor(primaryColor).font('Helvetica').text(`${act.label || act.module || 'User Interaction'} (${act.duration}s)`, 220, eventY, { width: 320, height: 12, ellipsis: true });
      
      eventY += 16;
    });

    if (session.activities.length > 15) {
      doc.fillColor(secondaryColor).font('Helvetica-Oblique').fontSize(8.5).text(`... and ${session.activities.length - 15} more micro events captured.`, 55, eventY + 10);
    }
    
    // Add external telemetry summary if exists
    const browserCount = session.browserTelemetry.length;
    const desktopCount = session.desktopTelemetry.length;

    if (browserCount > 0 || desktopCount > 0) {
      doc.moveDown(4);
      if (doc.y > 600) {
        doc.addPage();
      }
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('External System & Browser Integration');
      doc.moveDown(0.4);

      if (browserCount > 0) {
        doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(9.5).text(`Browser Telemetry (${browserCount} tabs tracked)`);
        doc.fillColor(primaryColor).font('Helvetica').fontSize(8.5);
        
        // Find top domains
        const domainMap: Record<string, number> = {};
        session.browserTelemetry.forEach(t => domainMap[t.domain] = (domainMap[t.domain] || 0) + t.duration);
        const topDomains = Object.entries(domainMap).sort((a,b) => b[1] - a[1]).slice(0, 3);
        
        topDomains.forEach(([dom, dur]) => {
          doc.text(`• ${dom}: spent ${Math.round(dur/60)} minutes`, { indent: 10 });
        });
        doc.moveDown(0.5);
      }

      if (desktopCount > 0) {
        doc.fillColor(successColor).font('Helvetica-Bold').fontSize(9.5).text(`Desktop Telemetry (${desktopCount} apps tracked)`);
        doc.fillColor(primaryColor).font('Helvetica').fontSize(8.5);

        // Find top apps
        const appMap: Record<string, number> = {};
        session.desktopTelemetry.forEach(t => appMap[t.activeApp] = (appMap[t.activeApp] || 0) + t.duration);
        const topApps = Object.entries(appMap).sort((a,b) => b[1] - a[1]).slice(0, 3);

        topApps.forEach(([app, dur]) => {
          doc.text(`• ${app}: active for ${Math.round(dur/60)} minutes`, { indent: 10 });
        });
      }
    }

    // Recommendations Footer
    if (report && report.recommendations && (report.recommendations as string[]).length > 0) {
      doc.moveDown(3);
      if (doc.y > 600) {
        doc.addPage();
      }
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('Smart Recommendations');
      doc.moveDown(0.4);
      doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
      (report.recommendations as string[]).forEach((rec) => {
        doc.text(`- ${rec}`, { lineGap: 3 });
      });
    }

    if (options.outputPath) {
      const writeStream = fs.createWriteStream(options.outputPath);
      doc.pipe(writeStream);
    }

    // Complete the document
    doc.end();
  });
}

export async function generatePeriodicPdfReport(reportId: string, userId: string, options: GeneratePdfOptions = {}): Promise<Buffer> {
  const report = await prisma.report.findFirst({
    where: { id: reportId, userId }
  });

  if (!report) {
    throw new Error('Report not found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Colors - Theme "Deep Work Mode"
    const primaryColor = '#0F172A';
    const secondaryColor = '#475569';
    const accentColor = '#06B6D4';
    const successColor = '#10B981';
    const lightBg = '#F8FAFC';
    const borderColor = '#E2E8F0';

    const addHeader = (title: string) => {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(20).text(title, { align: 'left' });
      doc.moveDown(0.2);
      doc.strokeColor(accentColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);
    };

    // 1. Page Header
    doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(14).text('STUDYTRACK', { characterSpacing: 1 });
    doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text('PERIODIC PRODUCTIVITY REPORT', { characterSpacing: 2 });
    doc.moveDown(1.5);

    // Title
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(22).text(report.title);
    doc.moveDown(1.5);

    const metrics = report.metrics as any;
    const chartData = report.chartData as any;

    // 2. Metrics Grid
    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, color: string) => {
      doc.rect(x, y, w, h).fillAndStroke(lightBg, borderColor);
      doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), x + 15, y + 15);
      doc.fillColor(color).font('Helvetica-Bold').fontSize(24).text(value, x + 15, y + 30);
    };

    const durationMin = Math.round(metrics.totalDuration / 60);
    drawCard(50, doc.y, 235, 75, 'Total Duration', `${durationMin} mins`, accentColor);
    drawCard(310, doc.y, 235, 75, 'Avg Productivity Score', `${metrics.avgScore}%`, successColor);
    doc.moveDown(6);
    drawCard(50, doc.y, 495, 75, 'Total Sessions Completed', `${metrics.totalSessions}`, primaryColor);
    doc.moveDown(6.5);

    // 3. AI Summary
    if (report.summary) {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('Summary & Insights');
      doc.moveDown(0.4);
      doc.rect(50, doc.y, 495, 60).fill(lightBg);
      const summaryY = doc.y + 10;
      doc.fillColor(primaryColor).font('Helvetica-Oblique').fontSize(9.5)
        .text(report.summary, 65, summaryY, { width: 465, align: 'justify', lineGap: 3 });
      doc.moveDown(5.5);
    }

    // 4. Analysis Bar Chart (Custom Vector Drawing)
    if (chartData?.sessions && chartData.sessions.length > 0) {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text('Session Duration Trend');
      doc.moveDown(0.5);

      const chartX = 50;
      const chartY = doc.y;
      const chartW = 495;
      const chartH = 150;

      // Draw axis
      doc.strokeColor(borderColor).lineWidth(1)
        .moveTo(chartX, chartY)
        .lineTo(chartX, chartY + chartH)
        .lineTo(chartX + chartW, chartY + chartH)
        .stroke();

      const sessions = chartData.sessions as any[];
      const maxDuration = Math.max(...sessions.map(s => s.durationSeconds || 0), 1);
      
      const barWidth = Math.min(30, (chartW - 20) / sessions.length - 5);
      const spacing = ((chartW - 20) - (barWidth * sessions.length)) / Math.max(1, sessions.length);

      let currentX = chartX + 10;
      sessions.forEach((s, i) => {
        const height = (s.durationSeconds / maxDuration) * (chartH - 20);
        const y = chartY + chartH - height;

        // Draw bar
        doc.rect(currentX, y, barWidth, height).fill(accentColor);
        
        // Label
        const date = new Date(s.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        doc.fillColor(secondaryColor).font('Helvetica').fontSize(6)
          .text(date, currentX - 5, chartY + chartH + 5, { width: barWidth + 10, align: 'center' });

        currentX += barWidth + spacing;
      });

      doc.moveDown(12);
    }

    doc.addPage();
    addHeader('Application & Website Usage Analytics');

    // 5. App / Web Tables
    const topApps = metrics.topApps || [];
    const topWebs = metrics.topWebsites || [];

    if (topApps.length > 0) {
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('Top Desktop Applications');
      doc.moveDown(0.4);

      let tableY = doc.y;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
      doc.text('APPLICATION', 60, tableY);
      doc.text('TIME LOGGED', 350, tableY);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, tableY + 12).lineTo(545, tableY + 12).stroke();
      
      let currentY = tableY + 20;
      topApps.forEach((app: any) => {
        doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
        doc.text(app.app, 60, currentY);
        doc.text(`${Math.round(app.duration / 60)} mins`, 350, currentY);
        currentY += 15;
      });
      doc.moveDown(3);
    }

    if (topWebs.length > 0) {
      if (doc.y > 600) { doc.addPage(); }
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('Top Websites Visited');
      doc.moveDown(0.4);

      let tableY = doc.y;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
      doc.text('DOMAIN', 60, tableY);
      doc.text('TIME LOGGED', 350, tableY);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, tableY + 12).lineTo(545, tableY + 12).stroke();
      
      let currentY = tableY + 20;
      topWebs.forEach((web: any) => {
        doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
        doc.text(web.domain, 60, currentY);
        doc.text(`${Math.round(web.duration / 60)} mins`, 350, currentY);
        currentY += 15;
      });
    }

    if (topApps.length === 0 && topWebs.length === 0) {
      doc.fillColor(secondaryColor).font('Helvetica-Oblique').fontSize(9).text('No external telemetry data recorded for this period.');
    }

    if (options.outputPath) {
      const writeStream = fs.createWriteStream(options.outputPath);
      doc.pipe(writeStream);
    }

    doc.end();
  });
}
