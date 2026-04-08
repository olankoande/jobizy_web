# Deploiement `/web`

## Build local

```powershell
npx tsc -p tsconfig.app.json --pretty false
npx vite build
```

## Variables d'environnement

- `VITE_API_BASE_URL` : URL de l'API backend Jobizy exposee au navigateur.

Exemple :

```powershell
$env:VITE_API_BASE_URL="https://api.jobizy.com/api/v1"
npx vite build
```

## Docker

```powershell
docker build -t jobizy-web --build-arg VITE_API_BASE_URL=https://api.jobizy.com/api/v1 .
docker run -p 8080:80 jobizy-web
```

## Reverse proxy

Le fichier `deploy/nginx.conf` :

- sert les assets statiques de la PWA ;
- applique le fallback `/index.html` necessaire a `react-router` ;
- conserve un cache long pour les fichiers versionnes sous `/assets/`.

## Infra recommandee

- heberger `/web` sur un serveur statique ou un conteneur Nginx ;
- exposer `https://app.jobizy.com` pour le frontend ;
- exposer `https://api.jobizy.com/api/v1` pour le backend ;
- autoriser ce domaine dans `backend/.env` via `CORS_ALLOWED_ORIGINS`.
