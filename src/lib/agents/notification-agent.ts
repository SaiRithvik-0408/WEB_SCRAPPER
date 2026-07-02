import { prisma } from "../prisma";

export async function sendNotifications(userId: string, jobIds: string[]) {
  // Creating user notifications in SQLite for dashboard
  const notificationsData = jobIds.map(jobId => ({
    userId,
    jobId,
    sent: true,
    read: false,
  }));

  if (notificationsData.length > 0) {
    await prisma.notification.createMany({
      data: notificationsData,
    });
  }

  console.log(`Notification Agent: Logged ${jobIds.length} new matching job notifications for user ${userId}`);
}
