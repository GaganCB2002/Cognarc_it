import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { prisma } from '../lib/prisma';

export const clerkWebhookHandler = async (req: Request, res: Response) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      res.status(200).json({ success: true, message: 'Webhook handling disabled - no CLERK_WEBHOOK_SECRET configured' });
      return;
    }

    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({
        success: false,
        message: 'Error occured -- no svix headers'
      });
      return;
    }

    const payload = req.body;
    const body = payload.toString('utf8');

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : 'Error verifying webhook'
      });
      return;
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with and ID of ${id} and type of ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id: clerkId, email_addresses, first_name, last_name, primary_email_address_id } = evt.data;

      const primaryEmailObj = email_addresses.find(
        (email: any) => email.id === primary_email_address_id
      );
      const email = primaryEmailObj?.email_address || email_addresses[0]?.email_address;

      if (!email) {
        console.error('User creation failed: No email found in Clerk data');
        res.status(400).json({ success: false, message: 'No email found' });
        return;
      }

      const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';

      try {
        await prisma.user.upsert({
          where: { clerkId },
          update: {
            email,
            name,
          },
          create: {
            clerkId,
            email,
            name,
            provider: 'LOCAL',
            isApproved: false,
          },
        });

        console.log(`User ${clerkId} synced to database.`);
      } catch (error) {
        console.error('Error syncing user to database:', error);
        res.status(500).json({ success: false, message: 'Database error' });
        return;
      }
    }

    if (eventType === 'user.deleted') {
      const { id: clerkId } = evt.data;

      try {
        if (clerkId) {
          await prisma.user.deleteMany({
            where: { clerkId }
          });
          console.log(`User ${clerkId} deleted from database.`);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};
