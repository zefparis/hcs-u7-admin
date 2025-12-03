/**
 * Script pour réinitialiser le mot de passe admin
 * Usage: npx tsx scripts/reset-admin-password.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const NEW_PASSWORD = 'HCS-U7_Admin_2025';
const ADMIN_EMAIL = 'contact@ia-solution.fr';

async function main() {
  console.log('🔐 Réinitialisation du mot de passe admin...');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  
  const admin = await prisma.adminUser.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!admin) {
    console.error(`❌ Aucun admin trouvé avec l'email: ${ADMIN_EMAIL}`);
    
    // Lister les admins existants
    const admins = await prisma.adminUser.findMany({
      select: { email: true, fullName: true, role: true },
    });
    
    console.log('\n📋 Admins existants:');
    admins.forEach((a) => {
      console.log(`   - ${a.email} (${a.fullName}) [${a.role}]`);
    });
    
    return;
  }

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  console.log('✅ Mot de passe mis à jour avec succès!');
  console.log(`   Nouveau mot de passe: ${NEW_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
