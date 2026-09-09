# CRM CGP

CRM simple et moderne pour Conseillers en Gestion de Patrimoine (CGP), développé étape par étape avec Claude Code.

## Étape 1 — Fondations (terminée)

Configuration du projet uniquement, sans fonctionnalité métier :

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **React 19**
- **Tailwind CSS v4**
- **shadcn/ui** (Button, Card, Input, Label installés)
- **Prisma 7** + **PostgreSQL** (adapter `@prisma/adapter-pg`), aucun modèle métier pour l'instant
- **Zod** (prêt pour les validations de formulaires)
- **Vitest** pour les tests unitaires
- **Playwright** pour les tests E2E
- **pnpm** comme gestionnaire de paquets

`app/page.tsx` affiche une simple carte de vérification confirmant que la stack est opérationnelle.

## Démarrer en local

### 1. Base de données PostgreSQL

```bash
docker compose up -d
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

### 3. Installation

```bash
pnpm install
```

### 4. Lancer l'application

```bash
pnpm dev
```

Disponible sur [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm db:generate` | Génère le client Prisma |
| `pnpm db:push` | Applique le schéma à la base (dev) |
| `pnpm db:migrate` | Crée une migration Prisma |
| `pnpm db:studio` | Interface graphique Prisma Studio |

## Structure du projet

```
app/                 # routes Next.js (App Router)
components/ui/       # composants shadcn/ui
lib/                 # utilitaires transverses (prisma client, format...)
prisma/              # schema.prisma (pas encore de modèle métier)
prisma.config.ts     # configuration Prisma 7 (connexion DB)
tests/e2e/           # tests Playwright
docker-compose.yml   # PostgreSQL local
```

À mesure que les fonctionnalités seront développées (étapes suivantes), le code métier sera organisé par feature sous `/features` (contacts, opportunities, tasks, calendar...).

## Point d'attention

`pnpm audit` remonte des vulnérabilités **transitives dans les dépendances de dev de la CLI `prisma`** (Prisma Studio embarque `mysql2`/`lodash` pour le support multi-SGBD). Elles n'affectent pas le code livré en production (Next.js ne bundle pas la CLI Prisma) ; à surveiller lors des prochaines mises à jour de Prisma.

## Prochaine étape

Étape 2 : authentification, modèle `User`/`Tenant`, rôles (ADMIN / MANAGER / CGP) et isolation multi-cabinet.
