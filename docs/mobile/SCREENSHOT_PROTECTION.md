# 🛡️ Protection contre les captures d'écran

Ce document explique comment fonctionne la protection contre les captures d'écran dans l'application Alter.

## 🎯 Objectif

Protéger la vie privée des utilisateurs en empêchant ou en rendant difficile la capture d'écran des conversations et photos dans le chat.

## 🔒 Mécanismes de protection

### 1. Protection Native (Mobile - iOS/Android)

Sur les plateformes natives, nous utilisons le plugin `@capacitor-community/privacy-screen` qui bloque réellement les captures d'écran au niveau du système d'exploitation.

**Fichiers concernés :**
- `src/services/privacyScreen.ts` - Service de gestion de la protection
- `src/hooks/usePrivacyScreen.ts` - Hook React pour activer/désactiver automatiquement
- `src/pages/Chat.tsx:44` - Activation dans la page Chat

**Comment ça fonctionne :**
```typescript
// Activation automatique lors de l'entrée dans le chat
usePrivacyScreen(true)

// Désactivation automatique lors de la sortie du chat
// (géré par le cleanup du useEffect)
```

**Résultat :**
- ✅ **Android** : Écran noir dans les captures d'écran/enregistrements
- ✅ **iOS** : Message "Screenshot blocked" ou écran noir

### 2. Protection Web (Navigateur)

Sur le web, il n'est pas possible de bloquer complètement les captures d'écran, mais nous rendons la tâche plus difficile :

#### A. Watermark invisible avec ID utilisateur

Un watermark avec l'ID de l'utilisateur est superposé sur tout le conteneur du chat. Il est presque invisible à l'œil nu mais apparaît dans les captures d'écran.

**Fichier :** `src/pages/Chat.css:14-28`

```css
.chat-container::after {
  content: attr(data-user-id);
  color: rgba(255, 255, 255, 0.015);
  transform: rotate(-45deg);
  font-size: 80px;
}
```

**Objectif :** Permettre de tracer l'origine d'une capture d'écran partagée

#### B. Désactivation du clic droit et du drag & drop

Les images ne peuvent pas être sauvegardées par clic droit ou glisser-déposer.

**Fichiers :**
- `src/components/PhotoMessage.tsx:96-100` - Handler `onContextMenu`
- `src/components/PhotoMessage.css:67-73` - Styles CSS de protection

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault()
  return false
}
```

```jsx
<img
  onContextMenu={handleContextMenu}
  draggable={false}
/>
```

**Résultat :**
- ❌ Clic droit désactivé sur les images
- ❌ Impossible de glisser-déposer les images
- ❌ Impossible de sélectionner le texte des images

#### C. Protection CSS

Les images utilisent des propriétés CSS pour empêcher la sélection et la copie.

```css
.photo-message-image {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
```

## 📱 Activation de la protection

### Automatique dans le Chat

La protection s'active automatiquement quand un utilisateur entre dans une conversation :

```typescript
// Dans Chat.tsx
usePrivacyScreen(true)  // Active la protection
```

### Sortie du Chat

La protection se désactive automatiquement quand l'utilisateur quitte le chat :

```typescript
useEffect(() => {
  if (enabled) {
    privacyScreenService.enable()
  }

  return () => {
    // Cleanup : désactive la protection
    if (enabled) {
      privacyScreenService.disable()
    }
  }
}, [enabled])
```

## 🧪 Test de la protection

### Sur Android/iOS

1. Ouvrir l'application native
2. Naviguer vers une conversation
3. Essayer de faire une capture d'écran (Power + Volume Down sur Android, Power + Volume Up sur iOS)
4. **Résultat attendu :** Écran noir ou message de blocage

### Sur Web

1. Ouvrir l'application dans un navigateur
2. Naviguer vers une conversation
3. Essayer de :
   - Faire une capture d'écran (Print Screen)
   - Clic droit sur une image
   - Glisser-déposer une image
4. **Résultat attendu :**
   - Watermark invisible présent dans la capture
   - Clic droit désactivé
   - Impossible de glisser les images

## 🔧 Configuration

### Désactiver temporairement (pour debug)

```typescript
// Dans Chat.tsx, changer true en false
usePrivacyScreen(false)  // Désactive la protection
```

### Ajouter la protection à d'autres pages

```typescript
import { usePrivacyScreen } from '@/hooks'

export const MySecurePage = () => {
  usePrivacyScreen(true)

  // Votre composant...
}
```

## ⚠️ Limitations

### Ce qui est bloqué ✅

- Screenshots natives sur iOS/Android
- Enregistrement d'écran sur iOS/Android (écran noir)
- Clic droit sur les images (web)
- Glisser-déposer des images (web)
- Sélection du texte des images (web)

### Ce qui n'est PAS bloqué ❌

- Screenshots sur navigateur web (mais avec watermark)
- Photo d'écran avec un autre appareil
- Capture via ADB ou outils de développement
- Screenshots avec des apps modifiées (root/jailbreak)

## 🔐 Sécurité additionnelle

En complément de la protection contre les captures d'écran, l'application utilise aussi :

1. **URLs signées** - Les médias sont accessibles uniquement via des URLs temporaires avec signature HMAC
2. **Photos éphémères** - Mode "vue unique" avec compte à rebours
3. **Modération automatique** - NSFW.js pour détecter le contenu sensible
4. **Traçabilité** - Watermark avec ID utilisateur sur web

## 📚 Ressources

- [Plugin Capacitor Privacy Screen](https://github.com/capacitor-community/privacy-screen)
- [Documentation Capacitor](https://capacitorjs.com/)
- [CSS user-select MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select)

## 🆘 Dépannage

### La protection ne fonctionne pas sur Android

1. Vérifier que le plugin est bien installé : `npm list @capacitor-community/privacy-screen`
2. Re-synchroniser : `npx cap sync android`
3. Rebuild l'app native

### La protection ne fonctionne pas sur iOS

1. Vérifier que le Podfile existe : `ls ios/App/Podfile`
2. Installer les pods : `cd ios/App && pod install`
3. Re-synchroniser : `npx cap sync ios`

### Le watermark n'apparaît pas sur web

1. Vérifier que `data-user-id` est bien défini sur `.chat-container`
2. Vérifier le CSS dans l'inspecteur : `.chat-container::after`
3. Faire une vraie capture d'écran (Print Screen) pour voir le watermark

## 📝 Notes de développement

- La protection est activée **uniquement** dans la page Chat
- Sur d'autres pages (Discover, Matches), la protection n'est pas active
- Le service détecte automatiquement la plateforme (native vs web)
- Aucune configuration manuelle requise après installation
