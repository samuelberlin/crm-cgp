# CRM CGP

CRM simple et moderne pour Conseillers en Gestion de Patrimoine (CGP), développé étape par étape avec Claude Code.

## Étape 5 — Tâches, agenda, notes (terminée)

- Modèles `Task` (priorité, statut, échéance, liée à un contact et/ou une opportunité), `Meeting` (rendez-vous), `Note`
- **Tâches** (`/tasks`) : vues filtrées Aujourd'hui / Cette semaine / En retard / Toutes (`features/tasks/views.ts`, pur et testé), changement de statut en un clic
- **Agenda** (`/agenda`) : rendez-vous à venir / passés, changement de statut (Planifié → Réalisé/Annulé) ; un rendez-vous réalisé propose « Ajouter un compte-rendu »
- **Notes** : ajout rapide directement depuis la fiche contact (aucune page dédiée, conforme à l'esprit « note en 2 secondes »)
- Actions rapides complètes sur la fiche contact : Appeler, Email, Créer opportunité, Ajouter une tâche, Planifier rendez-vous — les 6 actions prévues dès le départ
- Timeline enrichie : création/complétion de tâche, planification/réalisation de rendez-vous, ajout de note
- **Navigation finale à 6 sections** : Dashboard, Contacts, Opportunités, Agenda, Tâches, Paramètres
- Même isolation par rôle partagée (`advisorScopedWhere`) pour les tâches et les rendez-vous
- Un bug de validation (`FormData.get()` renvoie `null` et non `""` pour un champ absent du formulaire, ce que Zod refuse) a été corrigé une fois pour toutes via `lib/zod-helpers.ts#emptyToUndefined`, réutilisé par tous les schémas de formulaires

## Étape 4 — Opportunités (terminée)

- Modèle `Opportunity` : catégorie (investissement, retraite, immobilier, assurance, fiscalité, transmission, autre), montant, probabilité, étape (7 étapes : nouveau → qualifié → rendez-vous → proposition → négociation → gagné/perdu), date estimée, note, prochaine action
- **Valeur pondérée = montant × probabilité**, calculée à la volée (`features/opportunities/calc.ts`), jamais stockée pour éviter toute désynchronisation
- Pipeline en vue **Kanban** (`/opportunities`) : une colonne par étape, changement d'étape en un clic (menu déroulant sur la carte), totaux du pipeline (brut et pondéré) en en-tête
- Création depuis la fiche contact (bouton « Créer opportunité », contact préverrouillé) ou en libre depuis `/opportunities/new`
- Édition complète (`/opportunities/[id]/edit`), réassignation du conseiller réservée à ADMIN/MANAGER
- Fiche contact enrichie : section Commercial avec la liste réelle des opportunités et leurs totaux
- Timeline enrichie : création d'opportunité et changement d'étape apparaissent dans l'historique du contact
- **Même isolation par rôle** que les contacts, via une règle générique partagée (`features/auth/permissions.ts#advisorScopedWhere`) : CGP ne voit que ses opportunités, ADMIN/MANAGER voient tout le cabinet

## Étape 3 — Contacts (terminée)

- Modèle `Contact` (prospect / client / ancien client / partenaire) et `Activity` (timeline)
- Création rapide (`/contacts/new`) : prénom, nom, téléphone, email, statut, source — puis ouverture automatique de la fiche
- Fiche contact (`/contacts/[id]`) : en-tête (statut, conseiller), actions rapides (Appeler, Email), sections Relation / Commercial / Informations complémentaires, timeline unifiée
- Édition complète (`/contacts/[id]/edit`) : tous les champs, réassignation du conseiller réservée à ADMIN/MANAGER
- **Isolation par rôle**, vérifiée côté serveur sur chaque requête (`features/contacts/access.ts`) :
  - `ADMIN` / `MANAGER` : tous les contacts du cabinet
  - `CGP` : uniquement les contacts qui lui sont assignés
- Chaque contact créé est automatiquement assigné à son créateur

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
  (app)/                    # shell protégé (sidebar) : dashboard, contacts, opportunities, agenda, tasks, settings
  api/auth/[...all]/        # handler better-auth
components/ui/               # composants shadcn/ui
components/Sidebar.tsx       # navigation de l'app
features/auth/               # schémas Zod, actions, session, permissions (dont advisorScopedWhere partagé)
features/contacts/           # schémas Zod, isolation par rôle, actions, formulaires
features/opportunities/      # schémas Zod, isolation par rôle, calcul pipeline, actions, formulaires
features/tasks/               # schémas Zod, isolation par rôle, vues filtrées, actions, formulaires
features/agenda/              # schémas Zod, isolation par rôle, actions, formulaires
features/notes/                # schéma Zod, action de création, formulaire rapide
lib/                          # prisma client, auth (serveur/client), format, zod-helpers...
prisma/                       # schema.prisma (Tenant, User, Contact, Opportunity, Task, Meeting, Note, Activity + modèles better-auth)
prisma.config.ts              # configuration Prisma 7 (connexion DB)
proxy.ts                      # protection des routes (ex-middleware.ts, Next 16)
tests/e2e/                    # tests Playwright (helpers.ts : utilitaires partagés entre les specs)
docker-compose.yml            # PostgreSQL local
```

## Sécurité

- Mots de passe hachés et sessions gérées par `better-auth` (bibliothèque dédiée, pas de code maison).
- Chaque rôle/tenant est vérifié **côté serveur** à chaque page/action (`requireUser`, `hasRole`) — le `proxy.ts` ne fait qu'une redirection UX rapide basée sur la présence du cookie, jamais l'autorité finale.
- Les champs `role` et `tenantId` ne sont jamais acceptés depuis le client (`input: false` sur les additionalFields better-auth) ; ils sont positionnés côté serveur après création du compte.
- Secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`) uniquement en variables d'environnement, jamais committés.

## Points d'attention

- `pnpm audit` remonte des vulnérabilités **transitives dans les dépendances de dev de la CLI `prisma`** (Prisma Studio embarque `mysql2`/`lodash`). N'affecte pas le code livré en production ; à surveiller lors des prochaines mises à jour de Prisma.
- Il n'y a pas encore de flux d'invitation pour ajouter des utilisateurs à un cabinet existant : chaque inscription crée un nouveau cabinet. À prévoir dans une prochaine étape (Paramètres).

## Prochaine étape

Étape 6 : dashboard (aujourd'hui, relances, pipeline, « prochaine meilleure action »), en n'affichant que des données réellement disponibles.
