import { Request, Response } from 'express';
import { exportData } from '../services/export.service';

export async function handleExport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId as string;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const { format, entityType, from, to } = req.query;

    if (!format || !entityType) {
      res.status(400).json({ message: 'format and entityType are required' });
      return;
    }

    const validFormats = ['CSV', 'JSON', 'EXCEL'];
    if (!validFormats.includes(format as string)) {
      res.status(400).json({ message: `format must be one of: ${validFormats.join(', ')}` });
      return;
    }

    const validEntityTypes = ['activity', 'sessions', 'calendar'];
    if (!validEntityTypes.includes(entityType as string)) {
      res.status(400).json({ message: `entityType must be one of: ${validEntityTypes.join(', ')}` });
      return;
    }

    const result = await exportData(
      userId,
      format as 'CSV' | 'JSON' | 'EXCEL',
      entityType as string,
      {
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      }
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.content);
  } catch (error) {
    console.error('handleExport error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
