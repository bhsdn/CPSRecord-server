import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const addDays = (days: number) => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now;
  };

  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {
      name: '默认 CPS 推广项目',
      description: '包含多个示例子项目与内容，帮助你快速体验功能',
    },
    create: {
      name: '默认 CPS 推广项目',
      description: '包含多个示例子项目与内容，帮助你快速体验功能',
    },
  });

  const subProject = await prisma.subProject.upsert({
    where: { id: 1 },
    update: {
      name: '夏季爆款商品',
      description: '主打夏日清凉商品的推广集合',
    },
    create: {
      projectId: project.id,
      name: '夏季爆款商品',
      description: '主打夏日清凉商品的推广集合',
      sortOrder: 1,
    },
  });

  const contentTypes = [
    { name: '短链接', fieldType: 'url', hasExpiry: false },
    { name: '长链接', fieldType: 'url', hasExpiry: false },
    { name: '团口令', fieldType: 'text', hasExpiry: true },
    { name: '唤起协议', fieldType: 'text', hasExpiry: false },
    { name: 'H5 图片', fieldType: 'image', hasExpiry: false },
    { name: '小程序图片', fieldType: 'image', hasExpiry: false },
  ];

  for (const type of contentTypes) {
    await prisma.contentType.upsert({
      where: { name: type.name },
      update: {
        fieldType: type.fieldType,
        hasExpiry: type.hasExpiry,
        isSystem: true,
      },
      create: {
        ...type,
        isSystem: true,
      },
    });
  }

  const shortLinkType = await prisma.contentType.findUnique({
    where: { name: '短链接' },
  });
  const longLinkType = await prisma.contentType.findUnique({
    where: { name: '长链接' },
  });
  const groupCodeType = await prisma.contentType.findUnique({
    where: { name: '团口令' },
  });

  if (!shortLinkType || !longLinkType || !groupCodeType) {
    throw new Error('默认内容类型初始化失败');
  }

  await prisma.subProjectContent.upsert({
    where: {
      subProjectId_contentTypeId: {
        subProjectId: subProject.id,
        contentTypeId: shortLinkType.id,
      },
    },
    update: {
      contentValue: 'https://s.example.com/deal-001',
    },
    create: {
      subProjectId: subProject.id,
      contentTypeId: shortLinkType.id,
      contentValue: 'https://s.example.com/deal-001',
    },
  });

  await prisma.subProjectContent.upsert({
    where: {
      subProjectId_contentTypeId: {
        subProjectId: subProject.id,
        contentTypeId: longLinkType.id,
      },
    },
    update: {
      contentValue: 'https://example.com/products/summer-set?ref=promo',
    },
    create: {
      subProjectId: subProject.id,
      contentTypeId: longLinkType.id,
      contentValue: 'https://example.com/products/summer-set?ref=promo',
    },
  });

  await prisma.subProjectContent.upsert({
    where: {
      subProjectId_contentTypeId: {
        subProjectId: subProject.id,
        contentTypeId: groupCodeType.id,
      },
    },
    update: {
      contentValue: '复制这段信息打开手机淘宝，立享 30 元优惠',
      expiryDays: 7,
      expiryDate: addDays(7),
    },
    create: {
      subProjectId: subProject.id,
      contentTypeId: groupCodeType.id,
      contentValue: '复制这段信息打开手机淘宝，立享 30 元优惠',
      expiryDays: 7,
      expiryDate: addDays(7),
    },
  });

  await prisma.textCommand.upsert({
    where: { id: 1 },
    update: {
      commandText: '复制「￥夏日冰爽券￥」打开淘宝下单立减',
      expiryDays: 5,
      expiryDate: addDays(5),
    },
    create: {
      subProjectId: subProject.id,
      commandText: '复制「￥夏日冰爽券￥」打开淘宝下单立减',
      expiryDays: 5,
      expiryDate: addDays(5),
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
