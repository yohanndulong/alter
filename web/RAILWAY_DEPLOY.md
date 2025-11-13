# Guide de déploiement Railway - Site vitrine Alter

## 📋 Prérequis

- Compte Railway : https://railway.app
- Repository Git avec le code (GitHub, GitLab, etc.)
- Domaine `alterdating.com` configuré (optionnel)

## 🚀 Déploiement du site vitrine

### Étape 1 : Créer un nouveau service

1. Connectez-vous à Railway : https://railway.app
2. Ouvrez votre projet existant "Alter" (celui avec l'API)
3. Cliquez sur **"+ New"** puis **"GitHub Repo"**
4. Sélectionnez votre repository `alter`

### Étape 2 : Configurer le service

Railway va créer un nouveau service. Configurez-le :

1. **Nom du service** :
   - Cliquez sur le service nouvellement créé
   - Renommez-le en "alter-website" ou "web"

2. **Root Directory** :
   - Allez dans **Settings** > **Service Settings**
   - Définissez **Root Directory** : `web`
   - Cliquez sur "Deploy"

3. **Variables d'environnement** (optionnel) :
   - Railway configure automatiquement `PORT`
   - Aucune variable supplémentaire n'est nécessaire

### Étape 3 : Vérifier le déploiement

1. Attendez que le déploiement se termine (1-2 minutes)
2. Dans l'onglet "Deployments", vérifiez que le status est "Success"
3. Cliquez sur le domaine généré (ex: `alter-website-production.up.railway.app`)
4. Votre site doit s'afficher !

### Étape 4 : Configurer un domaine personnalisé

1. Dans le service "alter-website", allez dans **Settings** > **Domains**
2. Cliquez sur **"+ Custom Domain"**
3. Entrez `alterdating.com`
4. Railway vous donnera des instructions DNS :

```
Type: CNAME
Name: @
Value: [votre-domaine].up.railway.app
```

5. Ajoutez également `www.alterdating.com` :

```
Type: CNAME
Name: www
Value: [votre-domaine].up.railway.app
```

6. Configurez ces enregistrements DNS chez votre registrar (OVH, Namecheap, etc.)
7. Attendez la propagation DNS (5-30 minutes)
8. Railway configurera automatiquement le certificat SSL (HTTPS)

## 🏗️ Architecture finale sur Railway

Après déploiement, vous aurez 3 services dans votre projet Railway :

```
Projet "Alter"
├── postgres (base de données)
│   └── URL interne : postgresql://...
│
├── alter-api (backend NestJS)
│   ├── Root Directory: api
│   ├── Port: 3000
│   ├── Domaine: api.alterdating.com (recommandé)
│   └── URLs:
│       - https://api.alterdating.com/api/auth/login
│       - https://api.alterdating.com/api/users/...
│
└── alter-website (site vitrine)
    ├── Root Directory: web
    ├── Port: 3001
    ├── Domaine: alterdating.com
    └── URLs:
        - https://alterdating.com/
        - https://alterdating.com/privacy.html
        - https://alterdating.com/terms.html
```

## 🔄 Redéploiement automatique

Railway redéploie automatiquement :
- À chaque `git push` sur votre branche principale
- Quand vous modifiez les variables d'environnement
- Quand vous cliquez sur "Redeploy" dans le dashboard

## 🧪 Test du déploiement

Vérifiez que toutes les pages fonctionnent :

```bash
# Page d'accueil
curl https://alterdating.com/

# Politique de confidentialité
curl https://alterdating.com/privacy.html

# CGU
curl https://alterdating.com/terms.html

# CGV
curl https://alterdating.com/sales-terms.html

# Contact
curl https://alterdating.com/contact.html
```

Ou simplement ouvrez ces URLs dans votre navigateur.

## 🐛 Troubleshooting

### Le site ne se charge pas

1. Vérifiez les logs :
   - Dashboard Railway > Service "alter-website" > "Deployments"
   - Cliquez sur le déploiement actif > "View Logs"

2. Vérifiez que `server.js` démarre correctement :
   ```
   🌐 Alter Website is running on http://localhost:3001
   📁 Serving static files from: /app
   ```

3. Vérifiez le Root Directory :
   - Settings > Service Settings > Root Directory doit être `web`

### Les CSS ne se chargent pas

1. Vérifiez dans les logs que les fichiers CSS sont servis
2. Ouvrez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que le chemin est correct : `/css/style.css`

### Le domaine personnalisé ne fonctionne pas

1. Vérifiez la propagation DNS : https://dnschecker.org
2. Attendez jusqu'à 24h pour la propagation complète
3. Vérifiez que les enregistrements DNS sont corrects chez votre registrar
4. Railway configure automatiquement HTTPS, ça peut prendre quelques minutes

### Erreur "Application failed to respond"

1. Vérifiez que `package.json` et `server.js` sont bien dans le dossier `/web`
2. Vérifiez que le port est bien configuré dans `server.js` :
   ```javascript
   const PORT = process.env.PORT || 3001;
   ```
3. Railway injecte automatiquement la variable `PORT`

## 📊 Monitoring

Railway fournit :
- **Logs en temps réel** : Dashboard > Service > View Logs
- **Metrics** : CPU, RAM, Network
- **Uptime** : Disponibilité du service

## 💰 Coûts

Railway offre :
- **$5 de crédit gratuit par mois** (plan Hobby)
- Le site vitrine statique consomme très peu de ressources
- Estimation : **~$1-2/mois** pour le service web

Le plan Hobby suffit largement pour :
- API NestJS
- Site vitrine
- Base de données PostgreSQL

## 🔐 Sécurité

Railway configure automatiquement :
- ✅ HTTPS/SSL avec Let's Encrypt
- ✅ Protection DDoS de base
- ✅ Isolation des services
- ✅ Variables d'environnement sécurisées

## 📞 Support

- Documentation Railway : https://docs.railway.app
- Discord Railway : https://discord.gg/railway
- Support Alter : voir `/web/contact.html`

---

**Dernière mise à jour** : 13 janvier 2025
