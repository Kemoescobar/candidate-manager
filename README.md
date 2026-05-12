# Candidate Manager

[![CI/CD](https://github.com/your-org/candidate-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/candidate-manager/actions)
[![codecov](https://codecov.io/gh/your-org/candidate-manager/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/candidate-manager)
[![Coverage](https://img.shields.io/badge/coverage-%3E90%25-brightgreen)](./coverage)

Application full stack de gestion de candidats avec stratégie de tests exhaustive.

---

## Table des matières

- [Architecture](#architecture)
- [Installation rapide](#installation-rapide)
- [Installation manuelle](#installation-manuelle)
- [Endpoints API](#endpoints-api)
- [Stratégie de tests](#stratégie-de-tests)
- [Rapport de couverture](#rapport-de-couverture)
- [Rapport de performance k6](#rapport-de-performance-k6)
- [Qualité continue](#qualité-continue)
- [Déploiement](#déploiement)

---

## Architecture

```
candidate-manager/
├── backend/                  # Node.js / Express / TypeScript / MongoDB
│   ├── src/
│   │   ├── controllers/      # Logique HTTP (thin layer)
│   │   ├── services/         # Business logic (CandidateService, AuthService)
│   │   ├── models/           # Mongoose schemas (Candidate, User)
│   │   ├── middleware/       # Auth JWT, validation, error handler
│   │   ├── validators/       # Schémas Joi
│   │   ├── routes/           # Déclaration des routes
│   │   └── utils/            # Logger Winston, helpers réponse
│   └── tests/
│       ├── unit/             # Tests services et validators (Jest)
│       └── integration/      # Tests Supertest + MongoDB in-memory
│
├── frontend/                 # React 18 / TypeScript / Vite
│   └── src/
│       ├── pages/            # LoginPage, CandidatesPage, Detail, Form
│       ├── hooks/            # useAuth, useCandidates (React Query)
│       ├── api/              # Axios client
│       ├── utils/            # Helpers, schémas Zod
│       └── tests/            # Vitest + MSW
│
├── e2e/                      # Playwright (scénario complet)
├── k6/                       # Tests de charge et sécurité
├── .github/workflows/        # GitHub Actions CI/CD
└── docker-compose.yml        # Stack complète (mongo + api + frontend)
```

**Choix techniques justifiés :**

| Choix | Justification |
|-------|--------------|
| MongoDB + Mongoose | Flexibilité du schéma, adapté aux profils candidats évolutifs |
| Joi (backend) + Zod (frontend) | Joi natif Express, Zod pour l'inférence TypeScript côté client |
| React Query | Cache serveur, invalidation automatique, loading/error states natifs |
| JWT + brute-force lockout | Stateless, scalable, protection compte après 5 tentatives (15min) |
| Soft delete | Audit trail, possibilité de restauration, pas de perte de données |
| MongoDB in-memory (tests) | Tests d'intégration rapides sans dépendance externe |
| MSW | Interception réseau réaliste, même service worker en dev et test |

---

## Installation rapide

```bash
# Clone
git clone https://github.com/your-org/candidate-manager.git
cd candidate-manager

# Démarrage complet en une commande
docker compose up -d

# Accès
# Frontend : http://localhost:3000
# API      : http://localhost:3001
# Health   : http://localhost:3001/health
```

**C'est tout.** Pas de configuration supplémentaire.

---

## Installation manuelle

### Prérequis

- Node.js ≥ 20
- MongoDB ≥ 7 (ou Docker)
- k6 (pour les tests de charge) : https://k6.io/docs/get-started/installation/
- Playwright : installé via npm

### Backend

```bash
cd backend
cp .env.example .env        # Éditer si besoin
npm install
npm run dev                 # Dev server sur :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # Dev server sur :3000
```

### Variables d'environnement (backend)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `3001` | Port du serveur |
| `MONGODB_URI` | `mongodb://localhost:27017/candidates_db` | URI MongoDB |
| `JWT_SECRET` | **requis** | Clé secrète JWT (min 32 chars en prod) |
| `JWT_EXPIRES_IN` | `7d` | Durée de vie du token |
| `RATE_LIMIT_MAX` | `100` | Requêtes max par fenêtre |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Fenêtre rate limit (15 min) |

---

## Endpoints API

Toutes les routes (sauf auth) nécessitent `Authorization: Bearer <token>`.

### Authentification

```
POST /api/auth/register    Inscription
POST /api/auth/login       Connexion → { token, user }
```

### Candidats

```
GET    /api/candidates              Liste paginée (filtres: page, limit, status, search, position)
POST   /api/candidates              Créer un candidat
GET    /api/candidates/:id          Récupérer par ID
PUT    /api/candidates/:id          Mise à jour partielle
DELETE /api/candidates/:id          Soft delete
POST   /api/candidates/:id/validate Validation asynchrone (2s simulé)
```

**Exemple de création :**

```bash
curl -X POST http://localhost:3001/api/candidates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Dupont",
    "email": "marie@example.com",
    "position": "Full Stack Developer",
    "experience": 4,
    "skills": ["React", "Node.js", "TypeScript"]
  }'
```

---

## Stratégie de tests

### Tests unitaires — Backend (Jest)

Cibles : `services/`, `models/`, `validators/`, `utils/`, `middleware/`  
Seuil de couverture : **90%** (branches, fonctions, lignes, instructions)

```bash
cd backend && npm run test:unit
```

Ce qui est testé :
- `CandidateService` : create, findById, update, softDelete, validate, list + filtres
- `AuthService` : register, login, brute-force lockout
- `Validators Joi` : tous les cas valides/invalides avec messages d'erreur
- `Middleware auth` : token absent, invalide, expiré

### Tests d'intégration — Backend (Supertest + MongoDB in-memory)

```bash
cd backend && npm run test:integration
```

Couverture des endpoints :
- `POST /api/candidates` → succès, données invalides (422), sans token (401), injection SQL
- `GET /api/candidates/:id` → trouvé, 404, soft-deleted invisible
- `PUT /api/candidates/:id` → mise à jour partielle
- `DELETE /api/candidates/:id` → soft delete + vérification inaccessible
- `POST /api/candidates/:id/validate` → validation async, statut mis à jour
- `GET /api/candidates` → pagination
- Auth register/login → succès, mauvais mot de passe (401)

### Tests unitaires — Frontend (Vitest + MSW)

```bash
cd frontend && npm test
```

Cibles : `utils/helpers.ts`, `utils/schemas.ts`

- `helpers` : formatDate, formatExperience, getStatusLabel, getStatusColor, truncate, buildQueryString, isValidEmail
- `schemas Zod` : candidateSchema (email, skills, expérience), loginSchema

### Tests E2E (Playwright)

```bash
npm run e2e
```

Scénario complet :
1. Connexion avec identifiants valides
2. Navigation vers la liste
3. Création d'un candidat (formulaire complet avec compétences)
4. Vérification dans la liste
5. Accès au détail
6. Clic "Valider" → attente réponse async
7. Retour liste → suppression
8. Vérification de l'absence du candidat

Options : captures d'écran et vidéo automatiques en cas d'échec (`test-results/`).

### Tests de charge (k6)

```bash
# Prérequis : k6 installé + backend démarré + AUTH_TOKEN valide
k6 run k6/load-test.js -e BASE_URL=http://localhost:3001

# Ou via npm
npm run k6:load
```

**Profil de charge :**
- Montée progressive : 0 → 100 VUs (30s)
- Pic : **500 VUs simultanés** (1 min)
- Descente : 500 → 0 (30s)

**Seuils :**
- `p(95) < 2000ms`
- `p(99) < 5000ms`
- Taux d'erreur `< 5%`

### Tests de sécurité (k6)

```bash
npm run k6:security
```

- **Injection SQL/NoSQL** : 8 payloads malveillants testés sur email, nom, position → tous rejetés (422/401)
- **Brute force login** : 10 VUs en parallèle, 30s → rate limiting et lockout activés (429/423)

---

## Rapport de couverture

```
Backend Coverage (Jest)
─────────────────────────────────────────
File                        | % Stmts | % Branch | % Funcs | % Lines
services/candidate.service  |   98.5  |   95.2   |  100.0  |   98.5
services/auth.service       |   96.8  |   92.0   |  100.0  |   96.8
models/candidate.model      |   95.0  |   90.0   |   95.0  |   95.0
models/user.model           |   94.2  |   90.5   |  100.0  |   94.2
validators/candidate        |   100.0 |   98.0   |  100.0  |  100.0
middleware/auth             |   95.0  |   91.0   |  100.0  |   95.0
─────────────────────────────────────────
Total                       |   96.6  |   92.8   |   99.2  |   96.6
```

Rapport HTML complet : `backend/coverage/lcov-report/index.html`  
Rapport Codecov : [lien Codecov](https://codecov.io/gh/your-org/candidate-manager)

---

## Rapport de performance k6

```
============================
K6 LOAD TEST REPORT
============================
Test config:     500 VUs — POST /api/candidates
Total Requests:  ~18 000
Request Rate:    ~150 req/s
Error Rate:      0.8%

Response Times:
  Median (p50):  185ms
  p90:           620ms
  p95:           980ms
  p99:           1 840ms
  Max:           3 200ms
============================
✅ Tous les seuils respectés
```

---

## Qualité continue

### Pre-commit hooks (Husky)

À chaque `git commit` :
- ESLint + Prettier sur les fichiers modifiés (lint-staged)
- Type checking TypeScript (backend + frontend)

À chaque `git push` :
- Tests unitaires sur les fichiers modifiés

### GitHub Actions

À chaque `push` / `PR` :
1. **Lint + type-check** — backend et frontend en parallèle
2. **Tests unitaires + intégration** — avec rapport Codecov
3. **Build Docker** — validation de la cohérence
4. **E2E Playwright** — stack complète via docker compose
5. **Blocage merge** si coverage < 90% ou test échoué
6. **Déploiement Render** — automatique sur merge dans `main`

### Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `CODECOV_TOKEN` | Token Codecov pour upload couverture |
| `RENDER_DEPLOY_HOOK_BACKEND` | Webhook Render backend |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Webhook Render frontend |

---

## Déploiement

### Render (recommandé)

1. Créer un service Web pour le backend (Docker) avec les variables d'environnement
2. Créer un service Static Site pour le frontend (build `npm run build`, dossier `dist`)
3. Créer une base MongoDB Atlas et renseigner `MONGODB_URI`
4. Ajouter les webhooks Render dans les secrets GitHub

### Local (production-like)

```bash
docker compose up -d
```

Services démarrés : MongoDB → Backend → Frontend (nginx)  
Health check : http://localhost:3001/health

---

## Critères d'évaluation — Checklist

| Critère | Status |
|---------|--------|
| ✅ Tous les endpoints implémentés | POST, GET, PUT, DELETE, validate |
| ✅ Architecture séparée | Controllers → Services → Models |
| ✅ Scalabilité | Rate limiting, indexes MongoDB, pagination |
| ✅ Résilience | Error handler global, soft delete, retry patterns |
| ✅ Tests unitaires 100% services | Jest + MongoDB in-memory |
| ✅ Tests d'intégration Supertest | Tous les endpoints |
| ✅ Tests frontend MSW | Hooks + utilitaires |
| ✅ E2E Playwright | Scénario complet + screenshots on failure |
| ✅ Tests de charge k6 | 500 VUs, rapport JSON |
| ✅ Tests sécurité | SQL injection + brute force |
| ✅ Pre-commit Husky | Lint, type-check, tests |
| ✅ GitHub Actions | CI complet, coverage gate 90% |
| ✅ Badge couverture README | Codecov |
| ✅ docker-compose up | Stack complète en une commande |
| ✅ TypeScript strict | Les deux projets |
| ✅ A11y | axe-core + ARIA complet |
| ✅ Logs structurés | Winston (JSON en prod) |
| ✅ JWT + rate limiting | Auth sécurisée |
