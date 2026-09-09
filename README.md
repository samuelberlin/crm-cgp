# CRM CGP

CRM simple et moderne pour Conseillers en Gestion de Patrimoine (CGP), développé étape par étape avec Claude Code.

## Fonctionnalités ajoutées après le plan initial

### Produits et multi-équipement

- Modèles `Product` (catalogue par cabinet) et `Subscription` (souscription d'un client à un produit, avec encours)
- **Catalogue produits créé automatiquement** à la création d'un cabinet (`features/products/defaultCatalog.ts`), pré-rempli avec les **23 produits SwissLife** effectivement commercialisés — extrait de la grille de commissions Agents Généraux fournie — répartis en 5 catégories (Prévoyance, Santé, Retraite, Épargne, **Dommages**) — gérable ensuite depuis **Paramètres** (ajout, activation/désactivation, réservé ADMIN)
- Fiche contact : section **Produits souscrits** — ajout rapide (produit + encours + date), résiliation, et deux indicateurs calculés à la volée (`features/subscriptions/calc.ts`, pur et testé) : **multi-équipement** (nombre de produits actifs) et **encours total**
- Chaque souscription/résiliation est tracée dans la timeline du contact, comme le reste des activités
- **Synchronisation avec le patrimoine** : une souscription à un produit **Retraite ou Épargne** (capital réellement détenu) crée automatiquement un actif financier lié dans le patrimoine du client, pour son montant d'encours ; les produits Prévoyance/Santé/Dommages (primes d'assurance, sans valeur de rachat) n'y figurent jamais (`features/subscriptions/calc.ts#subscriptionFeedsWealth`, pur et testé). L'actif lié est marqué « (produit souscrit) » et ne se supprime pas manuellement — il se retire automatiquement quand la souscription est résiliée, pour éviter toute désynchronisation.

### Fiche contact enrichie

- **Adresse postale** (rue, code postal, ville) et **situation familiale** à choix fixe (Célibataire, Marié(e), Pacsé(e), Union libre, Divorcé(e), Veuf/Veuve) plutôt qu'un champ texte libre

### 4e fonctionnalité IA : suggestions d'opportunités

- Bouton **« Suggérer des opportunités »** sur la fiche contact (`features/ai/actions.ts#generateOpportunitySuggestions`) : croise le patrimoine du client, les produits déjà souscrits, le catalogue des produits non souscrits, et les opportunités déjà ouvertes, pour proposer 2-3 pistes commerciales concrètes sans jamais dupliquer l'existant — même discipline que les 3 autres boutons IA (prompt pur et testé, scoping par rôle, dégradation explicite sans clé API)

## Étape 9 — Assistant IA (terminée)

Trois fonctionnalités IA ciblées, appuyées sur l'API Claude (`@anthropic-ai/sdk`), déclenchées à la demande (aucun appel automatique, aucun coût caché) :

- **Résumé client** et **rédaction de relance** : boutons sur la fiche contact (carte « Assistant IA »)
- **Analyse d'opportunité** : bouton sur la page d'édition d'une opportunité
- Construction des prompts entièrement pure et testée (`features/ai/prompts.ts`) : le texte envoyé au modèle est assemblé à partir des données réelles du contact/de l'opportunité (statut, patrimoine net, opportunités en cours, dernières activités), jamais inventé
- Les 3 server actions (`features/ai/actions.ts`) réutilisent le même scoping par rôle que le reste de l'application (`contactWhere` / `opportunityWhere`) : un CGP ne peut générer du contenu IA que sur ses propres contacts/opportunités
- **Dégradation explicite** : sans `ANTHROPIC_API_KEY` configurée (`lib/ai.ts#isAiConfigured`), chaque bouton affiche clairement « Fonctionnalité IA non configurée » plutôt que d'échouer silencieusement — c'est l'état par défaut de cet environnement de développement, couvert par un test E2E dédié (`tests/e2e/ai.spec.ts`)

## Étape 8 — Automatisations (terminée)

Pas de cron/scheduler disponible dans cet environnement : les automatisations sont **événementielles** (déclenchées par une action utilisateur) ou **calculées à la lecture**, jamais par une tâche planifiée en arrière-plan.

- Délais configurables par cabinet (`Tenant.firstContactDelayDays`, `meetingReportDelayDays`, `proposalFollowUpDelayDays`, `inactivityAlertDays`), réglables depuis **Paramètres** (ADMIN uniquement)
- Trois tâches automatiques, créées via un helper partagé (`features/automations/scheduleTask.ts#scheduleAutomationTask`, tâche + entrée de timeline en une fois) :
  - Nouveau prospect → tâche « Premier contact »
  - Rendez-vous marqué Réalisé → tâche « Envoyer le compte rendu »
  - Opportunité passée à l'étape Proposition → tâche « Relancer : *titre* »
- **Badge « Inactif »** sur la liste des contacts et une carte dédiée au dashboard : calculé à la volée (`features/automations/inactivity.ts`, pur et testé) à partir de la dernière activité connue, sans stockage ni tâche planifiée
- Même discipline de test que les étapes précédentes : logique pure testée en unitaire, flux complet testé en E2E (`tests/e2e/automations.spec.ts`)

## Étape 7 — Patrimoine simplifié et documents (terminée)

- Modèle `WealthItem` : actif (immobilier, financier, liquidités, professionnel, autre) ou passif (crédit, autre dette), avec calcul **brut / passif / net** à la volée (`features/wealth/calc.ts`, pur et testé), jamais stocké
- Section **Patrimoine** sur la fiche contact : deux formulaires d'ajout rapide (actif / passif), suppression en un clic
- Modèle `Document` : upload, aperçu, téléchargement, suppression, associé à une catégorie (Identité, Fiscalité, Patrimoine, Contrats, Autre)
- Fichiers stockés directement en base PostgreSQL (`bytea`, limite 5 Mo) — pas de dépendance de stockage externe (S3, etc.) à configurer
- Route `GET /api/documents/[id]` protégée par l'isolation par rôle du contact associé ; seuls les PDF et images sont servis en aperçu (`Content-Disposition: inline`), tout le reste est forcé en téléchargement (`attachment`) pour éviter qu'un fichier uploadé (ex. HTML) ne s'exécute dans le contexte de l'application — en-tête `X-Content-Type-Options: nosniff` systématique
- OCR volontairement non développé (prévu par l'architecture — bytes + type MIME conservés tels quels — mais hors périmètre du MVP)

## Étape 6 — Dashboard (terminée)

Dashboard entièrement piloté par les données réelles (aucune valeur fictive) :

- **Ma prochaine meilleure action** : le système propose toujours une seule action concrète — une tâche en retard, sinon une tâche du jour, sinon un contact dont la relance est due, sinon « Rien d'urgent aujourd'hui ». Logique de sélection pure et testée (`features/dashboard/nextBestAction.ts`), avec actions directes (Terminer/Reporter une tâche, Appeler/Email un contact)
- **Tâches à venir** : les prochaines tâches non terminées, triées par échéance
- **Relances** : les contacts dont la date de prochain contact est arrivée
- **Pipeline** : entonnoir Nouveaux → Qualifiés → Propositions → Gagnés
- **CA potentiel** : pipeline total, pipeline pondéré, CA gagné (`features/opportunities/calc.ts#wonTotal`)
- **Opportunités prioritaires** : triées par valeur pondérée
- Tout est filtré par le même scoping de rôle que le reste (CGP ne voit que ses propres données)

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
features/dashboard/             # sélection de la prochaine meilleure action (pur, testé)
features/wealth/                # calcul brut/net (pur, testé), actions, formulaires
features/documents/             # upload/validation, actions, formulaires
features/automations/           # délais configurables, helper de création de tâche, calcul d'inactivité (pur, testé)
features/ai/                    # assistant IA : construction de prompts (pur, testé), actions, bouton client
features/products/              # catalogue produits (seed par défaut, actions, formulaires ADMIN)
features/subscriptions/         # souscriptions client : calcul encours/multi-équipement (pur, testé), actions, formulaires
lib/                          # prisma client, auth (serveur/client), format, zod-helpers...
prisma/                       # schema.prisma (Tenant, User, Contact, Opportunity, Task, Meeting, Note, WealthItem, Document, Product, Subscription, Activity + modèles better-auth)
prisma.config.ts              # configuration Prisma 7 (connexion DB)
proxy.ts                      # protection des routes (ex-middleware.ts, Next 16)
tests/e2e/                    # tests Playwright (helpers.ts : utilitaires partagés entre les specs)
docker-compose.yml            # PostgreSQL local
```

## Sécurité

- Mots de passe hachés et sessions gérées par `better-auth` (bibliothèque dédiée, pas de code maison).
- Chaque rôle/tenant est vérifié **côté serveur** à chaque page/action (`requireUser`, `hasRole`) — le `proxy.ts` ne fait qu'une redirection UX rapide basée sur la présence du cookie, jamais l'autorité finale.
- Les champs `role` et `tenantId` ne sont jamais acceptés depuis le client (`input: false` sur les additionalFields better-auth) ; ils sont positionnés côté serveur après création du compte.
- Secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`, `ANTHROPIC_API_KEY`) uniquement en variables d'environnement, jamais committés.
- Les server actions IA rechargent le contact/l'opportunité via le même scoping par rôle que le reste de l'app avant de construire le prompt — un CGP ne peut pas déclencher une génération IA sur les données d'un autre conseiller.

## Points d'attention

- `pnpm audit` remonte des vulnérabilités **transitives dans les dépendances de dev de la CLI `prisma`** (Prisma Studio embarque `mysql2`/`lodash`). N'affecte pas le code livré en production ; à surveiller lors des prochaines mises à jour de Prisma.
- Il n'y a pas encore de flux d'invitation pour ajouter des utilisateurs à un cabinet existant : chaque inscription crée un nouveau cabinet. À prévoir dans une prochaine étape (Paramètres).

## Prochaine étape

Les 9 étapes du plan initial sont terminées. Pistes possibles pour la suite, à valider avant tout développement :

- Flux d'invitation pour ajouter des utilisateurs à un cabinet existant (cf. Points d'attention)
- Recherche/filtres avancés sur les listes (contacts, opportunités, tâches)
- Export de données (CSV/PDF)
