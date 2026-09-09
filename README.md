# CRM CGP

CRM simple et moderne pour Conseillers en Gestion de Patrimoine (CGP), développé étape par étape avec Claude Code.

## Étape 2 — Authentification, cabinets, rôles (terminée)

- **better-auth** (email + mot de passe), stable, adapté à Next 16 / React 19 / Prisma 7
- Modèle `Tenant` (cabinet) et `User` avec un rôle (`ADMIN`, `MANAGER`, `CGP`)
- Inscription = création d'un cabinet + premier utilisateur **ADMIN** (`app/register`)
- Connexion (`app/login`)
- Protection des routes via `proxy.ts` (convention Next 16, ex-`middleware.ts`) : redirection vers `/login` si non connecté
- Vérification des permissions **toujours côté serveur** (`features/auth/session.ts`, `features/auth/permissions.ts`), jamais fait confiance au client
- Page **Paramètres** réservée aux administrateurs (liste des utilisateurs du cabinet), avec message « Accès refusé » pour les autres rôles
- Tableau de bord minimal affichant les informations de session réelles

## Étape 1 — Fondations (terminée)

Configuration du projet : **Next.js 16** (App Router, Turbopack) + **TypeScript** + **React 19**, **Tailwind CSS v4**, **shadcn/ui**, **Prisma 7** + **PostgreSQL** (adapter `@prisma/adapter-pg`), **Zod**, **Vitest**, **Playwright**, **pnpm**.

## Démarrer en local

### 1. Base de données PostgreSQL

```bash
docker compose up -d
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Générez `BETTER_AUTH_SECRET` avec `openssl rand -hex 32`.

### 3. Installation

```bash
pnpm install
```

### 4. Schéma de base de données

```bash
pnpm db:push
```

### 5. Lancer l'application

```bash
pnpm dev
```

Disponible sur [http://localhost:3000](http://localhost:3000). Créez votre premier cabinet via `/register`.

## Scripts disponibles

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Génère les types de routes Next.js puis vérifie TypeScript |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests E2E (Playwright), lance son propre serveur de dev |
| `pnpm db:generate` | Génère le client Prisma |
| `pnpm db:push` | Applique le schéma à la base (dev) |
| `pnpm db:migrate` | Crée une migration Prisma |
| `pnpm db:studio` | Interface graphique Prisma Studio |

## Structure du projet

```
app/                        # routes Next.js (App Router)
  login/, register/         # pages publiques
  (app)/                    # shell protégé (sidebar) : dashboard, settings
  api/auth/[...all]/        # handler better-auth
components/ui/               # composants shadcn/ui
components/Sidebar.tsx       # navigation de l'app
features/auth/               # schémas Zod, actions, session, permissions, formulaires
lib/                          # prisma client, auth (serveur/client), format...
prisma/                       # schema.prisma (Tenant, User, Role + modèles better-auth)
prisma.config.ts              # configuration Prisma 7 (connexion DB)
proxy.ts                      # protection des routes (ex-middleware.ts, Next 16)
tests/e2e/                    # tests Playwright
docker-compose.yml            # PostgreSQL local
```

Le code métier des prochaines étapes (contacts, opportunités, tâches, agenda) sera organisé de la même façon sous `/features`.

## Sécurité

- Mots de passe hachés et sessions gérées par `better-auth` (bibliothèque dédiée, pas de code maison).
- Chaque rôle/tenant est vérifié **côté serveur** à chaque page/action (`requireUser`, `hasRole`) — le `proxy.ts` ne fait qu'une redirection UX rapide basée sur la présence du cookie, jamais l'autorité finale.
- Les champs `role` et `tenantId` ne sont jamais acceptés depuis le client (`input: false` sur les additionalFields better-auth) ; ils sont positionnés côté serveur après création du compte.
- Secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`) uniquement en variables d'environnement, jamais committés.

## Points d'attention

- `pnpm audit` remonte des vulnérabilités **transitives dans les dépendances de dev de la CLI `prisma`** (Prisma Studio embarque `mysql2`/`lodash`). N'affecte pas le code livré en production ; à surveiller lors des prochaines mises à jour de Prisma.
- Il n'y a pas encore de flux d'invitation pour ajouter des utilisateurs à un cabinet existant : chaque inscription crée un nouveau cabinet. À prévoir dans une prochaine étape (Paramètres).

## Prochaine étape

Étape 3 : contacts (fiche contact, timeline), premier module métier réel.
