# 🛡️ Modération de Contenu avec NSFW.js

Ce projet utilise **NSFW.js** pour la modération automatique des photos envoyées dans le chat.

## 🎯 Pourquoi NSFW.js ?

- **100% Gratuit** - Pas de limite d'utilisation
- **Local & Privé** - Les images ne quittent pas votre serveur
- **Rapide** - Analyse en ~100-300ms
- **Open Source** - Basé sur TensorFlow.js
- **Facile** - Aucune configuration requise

## 🔍 Comment ça fonctionne ?

### 1. Chargement du modèle
Au démarrage du serveur, NSFW.js charge automatiquement son modèle de deep learning :

```
🤖 Loading NSFW.js model...
✅ NSFW.js model loaded successfully
```

### 2. Analyse des images
Quand un utilisateur envoie une photo, NSFW.js l'analyse et retourne des scores :

```typescript
{
  Porn: 0.05,      // 5% - Pornographie explicite
  Sexy: 0.15,      // 15% - Contenu sexy/suggestif
  Hentai: 0.02,    // 2% - Contenu hentai
  Neutral: 0.75,   // 75% - Contenu neutre
  Drawing: 0.03    // 3% - Dessin NSFW
}
```

### 3. Décision de modération
Le service compare les scores aux seuils configurés :

| Catégorie | Seuil | Action |
|-----------|-------|--------|
| Porn      | 60%   | ⚠️ Avertissement |
| Sexy      | 70%   | ⚠️ Avertissement |
| Hentai    | 60%   | ⚠️ Avertissement |

### 4. Notification utilisateur
Si du contenu sensible est détecté, le récepteur voit un avertissement avant d'ouvrir la photo :

```
⚠️ Contenu sensible détecté
Cette photo contient possiblement du contenu sensible. Soyez prudent.
```

## ⚙️ Configuration des seuils

Vous pouvez ajuster les seuils dans `moderation.service.ts:92-94` :

```typescript
const PORN_THRESHOLD = 0.6;   // 60% (défaut)
const SEXY_THRESHOLD = 0.7;   // 70% (défaut)
const HENTAI_THRESHOLD = 0.6; // 60% (défaut)
```

**Recommandations :**
- **Très strict** : 0.4-0.5 (40-50%)
- **Équilibré** : 0.6-0.7 (60-70%) ✅ Défaut
- **Permissif** : 0.8-0.9 (80-90%)

## 📊 Logs de modération

Le service log toutes les analyses :

```bash
# Photo sûre
🔍 Analyzing image: photo_1234567890_abc123.jpg
✅ Image passed moderation (neutral: 85.3%)

# Photo avec contenu sensible
🔍 Analyzing image: photo_1234567890_def456.jpg
⚠️ Porn detected: 72.4%
⚠️ Sexy content detected: 81.2%
```

## 🚀 Performance

- **Première analyse** : ~2-3 secondes (chargement du modèle)
- **Analyses suivantes** : ~100-300ms
- **Mémoire** : ~150-200 MB (modèle chargé en RAM)
- **CPU** : Utilisation du backend TensorFlow CPU

## 🧪 Test de la modération

### 1. Démarrer le serveur
```bash
npm run start:dev
```

### 2. Vérifier les logs
```
🤖 Loading NSFW.js model...
✅ NSFW.js model loaded successfully
```

### 3. Envoyer une photo de test
Utilisez l'interface frontend pour envoyer une photo et observez les logs du backend.

## 🛠️ Dépannage

### Problème : Le modèle ne se charge pas
**Symptôme :**
```
❌ Failed to load NSFW.js model: ...
```

**Solutions :**
1. Vérifier que les packages sont installés :
   ```bash
   npm install nsfwjs @tensorflow/tfjs canvas
   ```

2. Vérifier la connexion internet (première fois seulement)
   Le modèle est téléchargé depuis CDN au premier lancement

3. Vérifier les logs pour plus de détails

### Problème : Analyse très lente
**Causes possibles :**
- Première analyse (chargement du modèle)
- Image très haute résolution

**Solutions :**
- Redimensionner les images avant l'upload
- Augmenter les ressources CPU du serveur

## 🔐 Sécurité & Confidentialité

✅ **Analyse locale** - Les images ne sont jamais envoyées à un service tiers
✅ **Pas de stockage** - Le modèle analyse sans conserver les images
✅ **Open source** - Code vérifiable et auditable
✅ **Sans API externe** - Pas de dépendance à un service cloud

## 📚 Ressources

- [NSFW.js GitHub](https://github.com/infinitered/nsfwjs)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Documentation complète](https://github.com/infinitered/nsfwjs#usage)

## 🎓 Modèle utilisé

NSFW.js utilise un modèle MobileNetV2 entraîné sur des millions d'images :
- Taille : ~4.5 MB
- Précision : ~93% sur les tests
- Entraîné sur : Images du domaine public

## 📝 Notes importantes

1. **Aucun filtre n'est parfait** - Vérifications manuelles recommandées pour les cas limites
2. **Faux positifs possibles** - Certaines images innocentes peuvent être marquées
3. **Faux négatifs possibles** - Certains contenus sensibles peuvent passer
4. **Évolution continue** - Le modèle est régulièrement mis à jour

## 💡 Alternatives envisagées

| Service | Coût | Précision | Vie privée | Choix |
|---------|------|-----------|------------|-------|
| Sightengine | $49/mois | 95% | ⚠️ Cloud | ❌ |
| AWS Rekognition | Variable | 94% | ⚠️ Cloud | ❌ |
| Google Vision | Variable | 96% | ⚠️ Cloud | ❌ |
| **NSFW.js** | **Gratuit** | **93%** | **✅ Local** | **✅** |
