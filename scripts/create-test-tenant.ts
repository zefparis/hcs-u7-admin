import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { generateSecurePassword } from "../lib/utils/password";

async function createTestTenant() {
  try {
    // Générer un mot de passe temporaire
    const tempPassword = generateSecurePassword();
    console.log("\n🔐 Mot de passe temporaire généré:", tempPassword);
    
    // Générer un code HCS-U7 (code cognitif) - Format réel complexe
    // C'est une signature cognitive unique qui encode des paramètres comportementaux
    const version = "8.0";
    const alg = "QS";
    const env = "W";
    
    // Générer des composants aléatoires mais réalistes
    const modCode = `c${Math.floor(Math.random() * 10)}f${Math.floor(Math.random() * 10)}m${Math.floor(Math.random() * 1000)}`;
    const cogCode = `F${Math.floor(Math.random() * 100)}C${Math.floor(Math.random() * 10)}V${Math.floor(Math.random() * 100)}S${Math.floor(Math.random() * 10)}Cr${Math.floor(Math.random() * 100)}`;
    const vocCode = `R${Math.floor(Math.random() * 100)}v${Math.floor(Math.random() * 1000)}h${Math.floor(Math.random() * 10)}f${Math.floor(Math.random() * 100)}`;
    
    // Paramètres d'interaction (PB, SM, TN, VO avec valeurs B/M/H)
    const intValues = ["B", "M", "H"]; // Bas, Moyen, Haut
    const pb = intValues[Math.floor(Math.random() * 3)];
    const sm = intValues[Math.floor(Math.random() * 3)];
    const tn = intValues[Math.floor(Math.random() * 3)];
    const vo = intValues[Math.floor(Math.random() * 3)];
    
    // Signatures finales
    const qsig = Math.random().toString(36).substring(2, 12);
    const b3 = Math.random().toString(36).substring(2, 10);
    
    // Assembler le code HCS complet
    const hcsCode = `HCS-U7|V:${version}|ALG:${alg}|E:${env}|MOD:${modCode}|COG:${cogCode}|VOC:${vocCode}|INT:PB=${pb},SM=${sm},TN=${tn},VO=${vo}|QSIG:${qsig}|B3:${b3}`;
    
    console.log("\n🧠 Code HCS-U7 (Signature Cognitive Humaine) généré:");
    console.log(hcsCode);
    console.log("\n📊 Ce code encode une empreinte cognitive unique basée sur :");
    console.log("   - Modalités cognitives (MOD)");
    console.log("   - Signature cognitive (COG)");
    console.log("   - Empreinte vocabulaire (VOC)");
    console.log("   - Paramètres d'interaction (INT)");
    
    // Hacher le mot de passe et le code HCS
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const hcsCodeHash = await bcrypt.hash(hcsCode, 10);
    
    // Créer ou mettre à jour le tenant de test
    const tenant = await prisma.tenant.upsert({
      where: { email: "test@example.com" },
      update: {
        passwordHash,
        hcsCodeHash,
        mustChangePassword: true,
      },
      create: {
        email: "test@example.com",
        fullName: "Test User",
        company: "Test Company",
        passwordHash,
        hcsCodeHash,
        mustChangePassword: true,
        plan: "STARTER",
        status: "TRIAL",
        monthlyQuota: 10000,
        currentUsage: 0,
      },
    });
    
    console.log("\n✅ Tenant de test créé/mis à jour:");
    console.log("📧 Email:", tenant.email);
    console.log("🔑 Mot de passe:", tempPassword);
    console.log("🧠 Code HCS-U7:", hcsCode);
    console.log("\n⚠️  NOTEZ CES IDENTIFIANTS, ILS NE SERONT PLUS AFFICHÉS !");
    console.log("\n📱 Ce tenant doit se connecter sur: https://hcs-u7.online");
    console.log("🚫 Il ne peut PAS se connecter sur le dashboard admin!");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTenant();
