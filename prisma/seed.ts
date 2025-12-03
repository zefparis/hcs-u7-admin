/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // 1. Create admin user
  const adminPassword = await bcrypt.hash('ChangeMeNow123!', 10);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@emails.ia-solution.fr' },
    update: {},
    create: {
      email: 'admin@emails.ia-solution.fr',
      passwordHash: adminPassword,
      fullName: 'Benjamin BARRERE',
      role: 'SUPER_ADMIN',
    },
  });
  
  console.log('✅ Admin user created:', admin.email);
  console.log('   Password: ChangeMeNow123!');
  console.log('   🔒 CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!');
  
  // 2. Create test tenant
  const testTenant = await prisma.tenant.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      fullName: 'Test User',
      company: 'Test Company',
      website: 'https://test.com',
      plan: 'STARTER',
      status: 'TRIAL',
      monthlyQuota: 5000,
      currentUsage: 1234,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      metadata: {
        useCase: 'CAPTCHA web',
        estimatedVolume: '5,000 - 25,000 /mois',
        source: 'pricing_page',
      },
    },
  });
  
  console.log('✅ Test tenant created:', testTenant.email);
  
  // 3. Create test API key
  const testKeyHash = await bcrypt.hash('hcs_sk_test_demo123456789', 10);
  
  const testKey = await prisma.apiKey.create({
    data: {
      keyHash: testKeyHash,
      keyPrefix: 'hcs_sk_test',
      lastFourChars: '6789',
      name: 'Test API Key',
      environment: 'DEVELOPMENT',
      tenantId: testTenant.id,
      scopes: ['verify', 'generate'],
      lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });
  
  console.log('✅ Test API key created: hcs_sk_test_***6789');
  
  // 4. Create sample usage logs (last 7 days)
  const now = Date.now();
  const logsToCreate: {
    tenantId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    billable: boolean;
    cost: number;
    responseTime: number;
    createdAt: Date;
  }[] = [];
  
  for (let i = 0; i < 50; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 7);
    const randomHours = Math.floor(Math.random() * 24);
    const timestamp = new Date(now - randomDaysAgo * 24 * 60 * 60 * 1000 - randomHours * 60 * 60 * 1000);
    
    logsToCreate.push({
      tenantId: testTenant.id,
      endpoint: '/v1/verify',
      method: 'POST',
      statusCode: Math.random() > 0.1 ? 200 : 429, // 10% rate limited
      billable: true,
      cost: 0.004,
      responseTime: Math.floor(Math.random() * 200) + 50,
      createdAt: timestamp,
    });
  }
  
  await prisma.usageLog.createMany({ data: logsToCreate });
  console.log(`✅ Created ${logsToCreate.length} sample usage logs`);
  
  // 5. Create billing event
  await prisma.billingEvent.create({
    data: {
      tenantId: testTenant.id,
      type: 'SUBSCRIPTION_CREATED',
      amount: 29.0,
      periodStart: new Date(now - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      description: 'Starter plan - First month',
      metadata: {
        plan: 'STARTER',
        verifications: 5000,
      },
    },
  });
  
  console.log('✅ Created billing event');
  
  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:3000/login');
  console.log('   3. Email: admin@emails.ia-solution.fr');
  console.log('   4. Password: ChangeMeNow123!');
  console.log('   5. CHANGE PASSWORD IMMEDIATELY!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
