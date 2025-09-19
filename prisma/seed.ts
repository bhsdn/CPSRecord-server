import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '默认项目',
      description: '示例项目数据',
    },
  });

  const subProject = await prisma.subProject.upsert({
    where: { id: 1 },
    update: {},
    create: {
      projectId: project.id,
      name: '示例子项目',
      description: '示例子项目描述',
      sortOrder: 1,
    },
  });

  await prisma.contentType.upsert({
    where: { name: '链接' },
    update: {},
    create: {
      name: '链接',
      fieldType: 'url',
      hasExpiry: true,
      isSystem: true,
    },
  });

  await prisma.subProjectContent.upsert({
    where: { subProjectId_contentTypeId: { subProjectId: subProject.id, contentTypeId: 1 } },
    update: { contentValue: 'https://example.com' },
    create: {
      subProjectId: subProject.id,
      contentTypeId: 1,
      contentValue: 'https://example.com',
      expiryDays: 30,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
