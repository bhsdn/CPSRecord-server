import { PrismaService } from '../database/prisma.service';
import { calculateExpiryDate } from './date.util';

export class BatchOperations {
  static async batchCreateTextCommands(
    prisma: PrismaService,
    commands: Array<{
      subProjectId: number;
      commandText: string;
      expiryDays: number;
    }>,
  ) {
    if (!commands.length) {
      return { count: 0 };
    }

    const data = commands.map((command) => ({
      subProjectId: command.subProjectId,
      commandText: command.commandText,
      expiryDays: command.expiryDays,
      expiryDate: calculateExpiryDate(command.expiryDays) ?? undefined,
    }));

    return prisma.textCommand.createMany({
      data,
      skipDuplicates: true,
    });
  }

  static async batchUpdateExpiryStatus(prisma: PrismaService) {
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$executeRaw`
      UPDATE sub_project_contents
      SET updated_at = NOW()
      WHERE expiry_date IS NOT NULL
        AND expiry_date <= ${sevenDaysLater}
        AND is_active = true
    `;
  }
}
