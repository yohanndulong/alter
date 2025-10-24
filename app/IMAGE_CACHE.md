# Système de Cache d'Images

## Principe

Le système cache les images par leur **ID** (sans les paramètres de signature `?token=...&expires=...`).

Quand une image est chargée avec une URL signée comme :
```
photos/b723907b-3172-4e99-8b06-2e8b9f2fba3f?token=b1aaff58f327a6b4d61343ab3487c767011fb97e42d71b38c4ef33a95a3fada7&expires=1760644584
```

Elle est mise en cache avec la clé `b723907b-3172-4e99-8b06-2e8b9f2fba3f`.

La prochaine fois que cette même image est demandée (même avec une signature différente), elle sera chargée depuis le cache.

## Utilisation

### Composant `CachedImage`

Remplacez vos balises `<img>` par `<CachedImage>` :

**Avant :**
```tsx
<img
  src={profile.images[0]}
  alt={profile.name}
  className="profile-image"
/>
```

**Après :**
```tsx
import { CachedImage } from '@/components'

<CachedImage
  src={profile.images[0]}
  alt={profile.name}
  className="profile-image"
/>
```

### Props disponibles

- `src` : URL de l'image (avec ou sans signature)
- `alt` : Texte alternatif
- `fallback` : Composant à afficher en cas d'erreur (optionnel)
- Toutes les autres props HTML d'un `<img>` sont supportées

### Avec fallback personnalisé

```tsx
<CachedImage
  src={profile.images[0]}
  alt={profile.name}
  className="profile-image"
  fallback={<div className="image-error">Image non disponible</div>}
/>
```

## Service imageCache

Le service peut aussi être utilisé directement :

```typescript
import { imageCache } from '@/services/imagePreloader'

// Charger une image manuellement
const dataUrl = await imageCache.loadImage(signedUrl)

// Vérifier si une image est en cache
if (imageCache.isCached(signedUrl)) {
  console.log('Image déjà en cache !')
}

// Obtenir une image du cache
const cachedImage = imageCache.getFromCache(signedUrl)

// Vider le cache
imageCache.clearCache()

// Obtenir la taille du cache
const size = imageCache.getCacheSize()
```

## Fonctionnalités

✅ **Cache automatique** : Les images sont automatiquement mises en cache après le premier chargement

✅ **Réutilisation** : Une image avec une nouvelle signature réutilise le cache de l'ancienne

✅ **Gestion de la taille** : Le cache garde maximum 100 images (FIFO)

✅ **Data URLs** : Les images sont stockées en Data URLs (base64) dans la mémoire

✅ **Chargement unique** : Si plusieurs composants demandent la même image simultanément, elle n'est chargée qu'une seule fois

✅ **États de chargement** : Spinner pendant le chargement, gestion des erreurs

## Composants à mettre à jour

Les composants suivants devraient utiliser `CachedImage` :

- ✅ `ProfileCard` : Photos des profils dans la page Discover
- ✅ `CompatibilityListItem` : Vignettes dans la liste
- ✅ `PhotoMessage` : Photos dans le chat
- ✅ `ProfileModal` : Photos dans la modale de détails
- ✅ `Matches` : Photos dans la liste des conversations

## Performance

Le cache améliore significativement la performance :
- **Pas de rechargement** lors du changement de page
- **Pas de rechargement** lors de l'ouverture/fermeture de modales
- **Pas de rechargement** même si la signature change (nouvelle génération d'URL)
- **Chargement instantané** depuis le cache (< 1ms)

## Debug

Le service log toutes les opérations dans la console :
- `📦` : Image chargée depuis le cache
- `⏳` : Image déjà en cours de chargement
- `🔄` : Début du chargement d'une nouvelle image
- `✅` : Image mise en cache avec succès
- `🗑️` : Image supprimée du cache (cache plein)
- `❌` : Erreur de chargement
