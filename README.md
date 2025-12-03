# HCS-U7 Admin Dashboard

Interface d’administration pour la plateforme SaaS **HCS-U7** : gestion des clients (tenants), des clés API, du trafic, de la facturation et de la sécurité de l’API.

L’application est un dashboard interne réservé aux administrateurs HCS-U7.

---

## Aperçu rapide

- **Dashboard global** : synthèse clients, trafic API (7 jours), revenu (30 jours), clients à risque.
- **Clients** : listing paginé, recherche, statut (TRIAL/ACTIVE/…), quotas et usage, fiche détaillée par client.
- **API Keys** : génération, affichage masqué, activation/désactivation, association à un tenant et à un environnement (dev/staging/prod).
- **Usage détaillé** : page dédiée `/usage` listant les appels API avec filtres et pagination.
- **Analytics** : répartition du trafic par endpoint et par code HTTP, derniers appels.
- **Security & Monitoring** : erreurs, IP/Endpoints problématiques, logs suspects sur 24h.
- **Billing** : événements de facturation (90 jours), total de revenu, détails par client.
- **Audit** : journal des actions admin (génération/révocation clés, etc.).
- **Support multi-tenant** : vue `/support` pour le support client (statut, plan, facturation et erreurs récentes).
- **Admins internes** : gestion des comptes `AdminUser` et de leurs rôles dans `/admin-users`.
- **Guides d'intégration** : page `/integration` avec snippets backend-only (curl, Node, Python, Go, PHP, Java) sans secrets.

---

## Stack technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router)
- **Langage** : TypeScript
- **UI** : React 19, Tailwind CSS 4, composants UI maison
- **Auth** : [NextAuth 5 (credentials)](https://authjs.dev/) avec JWT
- **ORM / DB** : [Prisma](https://www.prisma.io/) + PostgreSQL
- **Validation** : [Zod](https://zod.dev/)

---

## Périmètre & non-objectifs

- Ce dépôt contient uniquement le **dashboard d'administration SaaS HCS-U7** (UI, routes Next.js, Prisma, NextAuth, pages métiers).
- Il **ne contient pas** la logique cryptographique HCS-U7, ni les algorithmes internes de génération / vérification des codes.
- Aucun secret de production HCS-U7 ne doit être stocké ici ; seuls des placeholders et variables d'environnement sont utilisés.
- L'API publique HCS-U7 est supposée être exposée par un **backend séparé**, auquel ce dashboard se connecte via la base de données et des clés API hashées (pas de stockage de clé en clair côté admin).

---

## Architecture principale

- `app/layout.tsx` : layout racine, police `Inter`, toasts, meta par défaut.
- `auth.ts` + `lib/auth.ts` : configuration NextAuth (credentials), enrichissement de la session avec `AdminRole`.
- `lib/env.ts` : validation des variables d’environnement via Zod.
- `lib/prisma.ts` : instanciation unique du `PrismaClient`.
- `lib/auth-helpers.ts` : helpers `requireAuth` et `requireRole` pour protéger les pages admin.
- `app/page.tsx` : redirection automatique vers `/login` ou `/dashboard` selon la session.
- `app/login/page.tsx` : page de connexion admin (credentials).
- `app/(admin)/layout.tsx` : layout protégé avec `requireAuth` + barre de navigation `AdminNav`.

### Routes admin principales

- `/dashboard` : vue d’ensemble (stats, top clients, trafic).
- `/clients` : liste des tenants, recherche et pagination.
- `/clients/[id]` : fiche client (infos, clés API, logs d’usage, événements de facturation).
- `/api-keys` : génération et gestion des clés API.
- `/usage` : liste détaillée des appels API (filtres, pagination, IP, erreurs).
- `/analytics` : analytics détaillées sur 30 jours (endpoints, status HTTP, derniers appels).
- `/security` : monitoring sécurité sur 24h (erreurs, IP/endpoints problématiques, événements suspects).
- `/billing` : événements de facturation sur 90 jours (montants, périodes, plans).
- `/audit` : logs d’audit des actions admin.
- `/support` : vue multi-tenant pour le support (statut, plan, usage, billing et erreurs récentes).
- `/admin-users` : gestion des comptes administrateurs internes et de leurs rôles.
- `/integration` : guides d'intégration API HCS-U7 (snippets backend-only, sans secrets).

### Modèles Prisma (extrait)

- `Tenant` : client HCS-U7 (plan, statut, quota, usage, métadonnées, notes internes).
- `ApiKey` : clé API hashée, préfixe, environnement, scopes, statut et métadonnées.
- `UsageLog` : logs d’utilisation de l’API (endpoint, method, status, coût, IP, UA, temps de réponse).
- `BillingEvent` : événements de facturation (montant, période, type, métadonnées).
- `AdminUser` : comptes administrateurs (email, mot de passe hashé, rôle, profil).
- `AuditLog` : journal des actions admin (qui, quoi, quand, détails, IP, UA).

Voir `prisma/schema.prisma` pour la définition complète du schéma.

---

## Prérequis

- **Node.js** ≥ 18.x
- **PostgreSQL** (local ou hébergé)
- Un gestionnaire de paquets JavaScript : `npm`, `pnpm` ou `yarn` (exemples ci-dessous avec `npm`).

---

## Configuration de l’environnement

Les variables d’environnement sont validées dans `lib/env.ts`.

Variables attendues :

- `NODE_ENV` : `development` | `test` | `production` (par défaut `development`).
- `DATABASE_URL` (**obligatoire**) : URL de connexion PostgreSQL.
- `NEXTAUTH_URL` (optionnel) : URL publique de l’app (ex. `http://localhost:3000` en dev).
- `NEXTAUTH_SECRET` (**obligatoire**) : secret utilisé par NextAuth pour signer les JWT.
- `RESEND_API_KEY` (optionnel) : clé API Resend si l’envoi d’emails est activé.
- `SITE_URL` (optionnel) : URL publique du site HCS-U7 (front client).
- `ADMIN_URL` (optionnel) : URL publique du dashboard admin.

### Exemple de `.env.local`

```bash
# Environnement
NODE_ENV=development

# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hcs_u7_admin

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-prod

# URLs publiques (si utilisées)
SITE_URL=https://hcs-u7.example.com
ADMIN_URL=https://admin.hcs-u7.example.com

# Email (optionnel)
RESEND_API_KEY=your_resend_api_key_here
```

---

## Installation & lancement en local

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Configurer la base PostgreSQL**

   Assurez-vous que `DATABASE_URL` pointe vers une base existante et accessible.

3. **Appliquer les migrations Prisma**

   ```bash
   npm run prisma:migrate -- --name init
   # ou
   npx prisma migrate dev --name init
   ```

4. **Générer le client Prisma (si nécessaire)**

   (normalement exécuté en `postinstall`)

   ```bash
   npm run prisma:generate
   ```

5. **Seeder la base avec des données de démo**

   Le script `prisma/seed.ts` crée :

   - un compte admin `AdminUser` par défaut,
   - un tenant de test,
   - une clé API de test,
   - des logs d’usage & un événement de facturation de démonstration.

   ```bash
   npm run prisma:seed
   ```

6. **Lancer le serveur de développement**

   ```bash
   npm run dev
   ```

   L’application est accessible sur : <http://localhost:3000>

7. **Connexion au dashboard**

   - URL de connexion : <http://localhost:3000/login>
   - **Email** : `admin@emails.ia-solution.fr`
   - **Mot de passe** : `ChangeMeNow123!`

   > ⚠️ **Important** : changez ce mot de passe immédiatement après la première connexion (en mettant à jour l’utilisateur admin dans la base ou via un flux dédié si implémenté en production).

---

## Scripts npm disponibles

Scripts définis dans `package.json` :

- `npm run dev` : lance le serveur de développement Next.js.
- `npm run build` : build de production.
- `npm run start` : démarre le serveur Next.js en mode production (après `build`).
- `npm run lint` : exécute ESLint.

Scripts Prisma :

- `npm run prisma:generate` : génère le client Prisma.
- `npm run prisma:migrate` : applique une migration en environnement de dev.
- `npm run prisma:seed` : exécute `prisma/seed.ts`.
- `npm run prisma:studio` : ouvre Prisma Studio.
- `npm run prisma:reset` : réinitialise la base (migrate reset).

---

## Fonctionnalités du dashboard

### Dashboard (`/dashboard`)

- Nombre total de clients, clients actifs, en essai et suspendus.
- Requêtes API sur les 30 derniers jours (total + facturables).
- Revenu sur les 30 derniers jours.
- Liste des **top clients** par usage (quota vs utilisation actuelle).

### Clients (`/clients`, `/clients/[id]`)

- Liste paginée des tenants avec recherche (email, nom, entreprise).
- Visualisation du **plan**, du **statut** et des **quotas**.
- Fiche détaillée par client :
  - Informations de contact et entreprise.
  - Plan, statut, quotas et usage.
  - Clés API liées (par environnement).
  - Derniers événements de facturation.
  - Derniers appels API (endpoint, status, temps de réponse).

### API Keys (`/api-keys`)

- Génération de nouvelles clés API pour un tenant donné.
- Association à un environnement (`DEVELOPMENT`, `STAGING`, `PRODUCTION`).
- Affichage masqué (préfixe + 4 derniers caractères seulement).
- Activation / révocation d’une clé.

### Analytics (`/analytics`)

- Top endpoints par volume de requêtes (30 derniers jours).
- Répartition des requêtes par code HTTP.
- Liste des derniers appels (client, endpoint, status, temps de réponse).

### Security & Monitoring (`/security`)

- Volume total de requêtes sur 24h.
- Nombre de requêtes bloquées/refusées (401/403/429).
- Nombre d’erreurs serveur (5xx).
- Top IPs et endpoints générant des erreurs.
- Liste des **derniers événements suspects** (client, endpoint, IP, message d’erreur).

### Billing (`/billing`)

- Revenu total sur les 90 derniers jours.
- Nombre d’événements de facturation et types d’événements.
- Détail des 200 derniers événements (client, type, montant, période).

### Audit (`/audit`)

- Journal des actions admin sur le dashboard.
- Filtres par action et type d’entité.
- Visualisation des détails de chaque log (admin, entité, changements, IP, UA).

### Admins (`/admin-users`)

- Liste des comptes `AdminUser` internes avec rôle (`SUPER_ADMIN`, `ADMIN`, `SUPPORT`, `VIEWER`).
- Création de nouveaux admins avec génération d'un mot de passe (affiché une seule fois après création).
- Mise à jour du rôle d'un admin.
- Suppression d'un admin (avec protection contre la suppression de son propre compte).

### Usage détaillé (`/usage`)

- Liste détaillée des appels API (`UsageLog`) avec filtres par tenant, endpoint, code HTTP et période.
- Affichage de l'IP, du message d'erreur éventuel, du temps de réponse.
- Pagination serveur pour naviguer dans les logs volumineux.

### Support multi-tenant (`/support`)

- Vue consolidée par client : plan, statut, quota, usage et dates d'essai/abonnement.
- Dernier événement de facturation et dernière erreur API par tenant.
- Filtres par statut, plan et recherche texte (nom, email, entreprise) pour aider le support.

### Guides d'intégration (`/integration`)

- Page documentaire statique avec exemples d'appels API HCS-U7.
- Snippets pour plusieurs stacks backend (curl, Node/TS, Python, Go, PHP, Java).
- Utilise uniquement des placeholders (`YOUR_HCS_U7_API_KEY`, `HCS_U7_API_KEY`, etc.) et un domaine d'exemple.

---

## RBAC & rôles admin

Les comptes admin sont stockés dans le modèle Prisma `AdminUser` avec un rôle `AdminRole` :

- `SUPER_ADMIN` : accès complet (gestion des `AdminUser`, des tenants, des clés API, de toutes les vues internes).
- `ADMIN` : gestion des clients et des clés API, accès aux pages d'usage, billing, analytics et audit.
- `SUPPORT` : accès en lecture aux vues de support multi-tenant (`/support`), usage (`/usage`), sécurité (`/security`) et audit (`/audit`).
- `VIEWER` : accès lecture restreint (dashboard, analytics, billing) pour un usage type investisseurs / reporting.

L'enforcement RBAC est centralisé via :

- `lib/auth.ts` : enrichissement du token/session NextAuth avec le rôle `AdminRole`.
- `lib/auth-helpers.ts` : helpers `requireAuth` et `requireRole` utilisés dans les pages `(admin)`.

## Sécurité

- Authentification par **credentials** (email/mot de passe) via NextAuth.
- Mots de passe stockés en base sous forme de hash `bcrypt`.
- Stratégie de session **JWT**.
- Accès au dashboard protégé par `requireAuth` / `requireRole`.
- Logs d'usage (`UsageLog`) et d'audit (`AuditLog`) pour la traçabilité.
- Variables sensibles (DB, secrets, clés API email) chargées via l'environnement et validées par Zod.

En production, il est recommandé de :

- Utiliser un `NEXTAUTH_SECRET` fort et unique.
- Désactiver ou adapter les données de démo du seed.
- Restreindre l'accès au dashboard admin (VPN, IP allowlist, etc. selon l'infra).

---

## Déploiement

Le projet peut être déployé sur toute plateforme supportant Next.js (par exemple un PaaS ou un hébergeur containerisé) avec :

1. Build de production :

   ```bash
   npm run build
   ```

2. Démarrage :

   ```bash
   npm run start
   ```

3. Configuration des variables d’environnement (voir section dédiée).

Assurez-vous que la base PostgreSQL est accessible depuis l’environnement de production et que les migrations Prisma ont été appliquées.

---

## Licence & mentions légales

Le code de l’application contient les mentions suivantes :

```text
Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
Patent Pending FR2514274 | CC BY-NC-SA 4.0
Commercial license: contact@ia-solution.fr
```

- Pour un usage **non commercial**, se référer à la licence **CC BY-NC-SA 4.0**.
- Pour tout usage **commercial** de HCS-U7 Admin Dashboard, contacter : **contact@ia-solution.fr**.

