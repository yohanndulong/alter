# Alter Dating - Site Vitrine

Site vitrine responsive pour [alterdating.com](https://alterdating.com) conforme aux exigences des app stores (Apple App Store et Google Play Store).

## 📁 Structure

```
web/
├── css/
│   └── style.css          # Design system matching l'app mobile
├── images/                # Assets (à remplir)
│   └── favicon.png       # Favicon du site
├── index.html            # Page d'accueil
├── privacy.html          # Politique de confidentialité
├── terms.html            # Conditions générales d'utilisation
├── sales-terms.html      # Conditions générales de vente
├── contact.html          # Page de contact
└── README.md             # Ce fichier
```

## 🎨 Design

Le site reprend le design system de l'application mobile :

- **Couleurs primaires** : `#ef4444` (rouge) et `#d946ef` (violet)
- **Typographie** : Sora (titres) et Inter (texte)
- **Responsive** : Mobile-first avec breakpoints
- **Animations** : Transitions fluides et effets au survol

## 🚀 Déploiement

### Option 1 : Hébergement statique (recommandé)

Le site est entièrement statique (HTML/CSS/JS), il peut être hébergé sur n'importe quel service :

- **Netlify** : Drag & drop du dossier `/web` (gratuit)
- **Vercel** : Connexion GitHub et déploiement automatique (gratuit)
- **GitHub Pages** : Hébergement gratuit via repository
- **Cloudflare Pages** : CDN rapide et gratuit
- **Firebase Hosting** : Intégration facile avec Firebase

### Option 2 : Serveur web classique

Copiez simplement tous les fichiers du dossier `/web` dans le répertoire racine de votre serveur web (Apache, Nginx, etc.).

### Configuration DNS

Pointez votre domaine `alterdating.com` vers votre hébergeur :

```
Type: A
Name: @
Value: [IP de votre hébergeur]

Type: CNAME
Name: www
Value: alterdating.com
```

## 📝 Pages disponibles

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` ou `/index.html` | Présentation d'Alter Dating |
| Confidentialité | `/privacy.html` | Politique de confidentialité (RGPD) |
| CGU | `/terms.html` | Conditions générales d'utilisation |
| CGV | `/sales-terms.html` | Conditions générales de vente |
| Contact | `/contact.html` | Formulaire de contact |

## 🔗 URLs pour les stores

Lors de la soumission sur les app stores, utilisez ces URLs :

- **Privacy Policy** : `https://alterdating.com/privacy.html`
- **Terms of Service** : `https://alterdating.com/terms.html`
- **Support URL** : `https://alterdating.com/contact.html`
- **Marketing URL** : `https://alterdating.com`

## 📧 Configuration du formulaire de contact

Le formulaire de contact dans `contact.html` est actuellement en mode "démo" (simulation).

Pour le rendre fonctionnel, vous devez :

1. **Option A : Backend personnalisé**
   - Créer un endpoint API dans `/api` pour traiter les emails
   - Utiliser le service Resend déjà configuré
   - Modifier le JavaScript dans `contact.html` pour appeler votre API

2. **Option B : Service tiers**
   - Utiliser Formspree, EmailJS ou similaire
   - Ajouter leur SDK dans `contact.html`
   - Gratuit pour un usage modéré

3. **Option C : Mailto simple**
   - Remplacer le formulaire par un simple lien `mailto:contact@alterdating.com`
   - Moins professionnel mais fonctionne immédiatement

## 🖼️ Images à ajouter

Placez les images suivantes dans `/web/images/` :

- `favicon.png` - Icône du site (32x32 ou 64x64)
- `logo.png` - Logo Alter en haute résolution
- `hero-bg.jpg` - Image de fond pour la section hero (optionnel)
- `app-screenshot-*.png` - Captures d'écran de l'app (optionnel)

## 🌐 Multilingue (optionnel)

Pour ajouter une version anglaise :

1. Dupliquer les pages HTML dans un dossier `/en/`
2. Traduire le contenu
3. Ajouter un sélecteur de langue dans le header
4. Configurer `lang="en"` dans les balises `<html>`

## 📱 Test responsive

Testez le site sur différents appareils :

```bash
# Serveur local pour tester
npx http-server web -p 8080

# Puis ouvrir http://localhost:8080
```

Ou utilisez les outils de développement de votre navigateur (F12 > Mode responsive).

## ✅ Checklist avant déploiement

- [ ] Vérifier tous les liens internes
- [ ] Ajouter les images manquantes
- [ ] Tester sur mobile, tablette et desktop
- [ ] Vérifier la compatibilité cross-browser
- [ ] Configurer le formulaire de contact
- [ ] Mettre à jour les emails de contact
- [ ] Ajouter Google Analytics (optionnel)
- [ ] Configurer SSL/HTTPS
- [ ] Tester les vitesses de chargement
- [ ] Optimiser les images (compression)

## 🔧 Maintenance

Pour mettre à jour le contenu :

1. Modifier les fichiers HTML directement
2. Tester localement
3. Redéployer (automatique sur Netlify/Vercel si connecté à Git)

## 📞 Support

Pour toute question sur le site vitrine, consultez le fichier principal :
- `CLAUDE.md` - Documentation du projet complet

---

**Dernière mise à jour** : 13 janvier 2025
**Version** : 1.0.0
