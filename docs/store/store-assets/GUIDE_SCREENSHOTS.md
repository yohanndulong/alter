# 📸 Guide pour créer les Screenshots Google Play Store

## 🎯 Format requis : 1080 x 1920 pixels (portrait)

---

## 📱 MÉTHODE 1 : Émulateur Android (RECOMMANDÉE)

### Configuration de l'émulateur

1. **Ouvrez Android Studio**
   ```bash
   npx cap open android
   ```

2. **Créez un émulateur avec les bonnes dimensions**
   - Ouvrir AVD Manager
   - Create Virtual Device
   - Choisir : **Pixel 5** ou **Pixel 6**
   - Résolution : 1080 x 2400 (sera cropée à 1920)

3. **Lancez l'app sur l'émulateur**
   ```bash
   npm run build
   npx cap sync
   # Puis Run dans Android Studio
   ```

4. **Connectez-vous avec le compte de test**
   - Email : `gp-internal-d4f7b2c9e1a8@alterapp-test.review`
   - Code : `999999`

5. **Prenez les screenshots**
   - Bouton caméra dans la barre d'outils de l'émulateur
   - Ou : Menu ... > Take Screenshot
   - Fichiers sauvegardés automatiquement

---

## 📱 MÉTHODE 2 : Téléphone Android Réel

### Prérequis
- Téléphone Android avec résolution proche de 1080 x 1920
- Mode développeur activé
- Débogage USB activé

### Étapes

1. **Connectez le téléphone en USB**

2. **Lancez l'app**
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

3. **Prenez les screenshots**
   - Sur le téléphone : Volume bas + Power
   - Screenshots dans : `DCIM/Screenshots/`

4. **Transférez les fichiers**
   ```bash
   # Via ADB
   adb pull /sdcard/DCIM/Screenshots/ ./store-assets/screenshots/
   ```

5. **Redimensionnez si nécessaire**
   - Utilisez un outil comme Photoshop, GIMP ou en ligne
   - Taille finale : **1080 x 1920 pixels**

---

## 📋 SCREENSHOTS À CRÉER (dans cet ordre)

### 1️⃣ AlterChat - Agent IA (PRIORITÉ #1)
**Ce screenshot montre votre fonctionnalité différenciante**

**Que capturer :**
- Conversation avec l'agent IA
- Questions avec options de réponse visibles
- Barre de progression du profil en haut (%)
- Logo Alter visible
- Au moins 2-3 messages échangés

**Navigation :**
- Connectez-vous
- Allez dans l'onglet "Alter" (bas de l'écran)
- Scrollez pour avoir une belle conversation

**💡 Astuce :** Si besoin, réinitialisez le chat pour avoir une conversation propre

---

### 2️⃣ AlterChat - Intentions & Profil
**Montre les 4 modes d'accompagnement**

**Que capturer :**
- Les 4 icônes d'intention (🧠 🤝 ❤️ 🔥) en haut à droite
- Le cercle de progression du profil avec le %
- Menu des intentions déroulé (si possible)

**Navigation :**
- Page AlterChat
- Cliquez sur l'icône d'intention (en haut à droite)
- Screenshot avec le menu ouvert

---

### 3️⃣ Discover - Mode Swipe avec Scores
**Montre les 3 scores de compatibilité**

**Que capturer :**
- Profil en mode carte
- LES 3 SCORES DE COMPATIBILITÉ bien visibles :
  - ❤️ Amour : XX%
  - 🤝 Amitié : XX%
  - 🔥 Charnel : XX%
- Photo de profil de qualité
- Bio et informations visibles
- Boutons d'action en bas

**Navigation :**
- Onglet "Découvrir"
- Assurez-vous d'être en mode Swipe (icône en haut)
- Trouvez un profil avec de bons scores (>70%)

---

### 4️⃣ Discover - Mode Liste
**Montre plusieurs profils avec compatibilité**

**Que capturer :**
- Au moins 3-4 profils visibles
- Scores de compatibilité pour chaque profil
- Toggle Swipe/Liste en haut
- Filtres de compatibilité visibles (si possible)

**Navigation :**
- Onglet "Découvrir"
- Cliquez sur l'icône Liste (en haut à droite)

---

### 5️⃣ Filtres de Compatibilité
**Montre la possibilité de filtrer**

**Que capturer :**
- Onglets de filtre : Tous / Amour / Amitié / Charnel
- Profils filtrés selon un critère
- Scores visibles

**Navigation :**
- Mode Liste dans Découvrir
- Cliquez sur les filtres en haut (Amour, Amitié, Charnel)

---

### 6️⃣ Chat - Conversation avec horodatage
**Montre la messagerie**

**Que capturer :**
- Conversation avec plusieurs messages
- Horodatage visible sur les messages
- Header avec nom et statut
- Champ de saisie en bas

**Navigation :**
- Onglet "Chat"
- Ouvrez une conversation existante
- Scrollez pour montrer plusieurs messages avec heures

---

### 7️⃣ Matches - Liste des matches
**Montre les connexions**

**Que capturer :**
- Au moins 2-3 matches visibles
- Photos et noms
- Scores de compatibilité (si affichés)
- Interface claire

**Navigation :**
- Onglet "Matches"

---

### 8️⃣ Onboarding - Question avec progression
**Montre le processus d'inscription**

**Que capturer :**
- Une question avec barre de progression en haut
- Options de réponse (boutons ou slider)
- Logo Alter
- Boutons Retour/Suivant

**Navigation :**
- Créez un nouveau compte ou réinitialisez l'onboarding
- Avancez jusqu'à une question visuellement intéressante
- Ex : question avec choix multiples ou slider

---

## ✅ CHECKLIST AVANT EXPORT

Pour chaque screenshot, vérifiez :

- [ ] **Résolution exacte** : 1080 x 1920 pixels
- [ ] **Format** : PNG (pas JPG)
- [ ] **Contenu lisible** : Texte net, pas flou
- [ ] **Pas d'infos personnelles** : Utilisez les données de test
- [ ] **Bonne luminosité** : Interface claire, pas de parties sombres
- [ ] **Pas de bugs visuels** : Pas de texte coupé, layout correct
- [ ] **Cohérence** : Même compte utilisé (celui de test)
- [ ] **Heure/batterie/réseau** : Cachés si possible (ou 100% / bon signal)

---

## 🎨 RETOUCHE (OPTIONNEL)

### Ajouter un cadre de téléphone (recommandé)

Utilisez un outil comme :
- **Mockuphone.com** - Gratuit, simple
- **Smartmockups.com** - Payant mais pro
- **Figma** - Gratuit avec templates

### Nettoyage

Si besoin, utilisez un éditeur pour :
- Masquer l'heure/batterie
- Unifier la barre de statut
- Améliorer le contraste
- Ajouter un léger ombre portée

**⚠️ IMPORTANT : Ne modifiez PAS le contenu de l'app (pas de fausses données)**

---

## 📂 ORGANISATION DES FICHIERS

Nommez vos fichiers clairement :

```
store-assets/screenshots/
├── 01-alterchat-agent-ia.png
├── 02-alterchat-intentions.png
├── 03-discover-swipe-scores.png
├── 04-discover-liste.png
├── 05-filtres-compatibilite.png
├── 06-chat-conversation.png
├── 07-matches-liste.png
├── 08-onboarding-question.png
```

---

## 🚀 UPLOAD SUR GOOGLE PLAY CONSOLE

1. Connectez-vous à Google Play Console
2. Allez dans votre app > Fiche du Play Store
3. Section "Images"
4. Uploadez dans l'ordre :
   - Screenshot 1 (AlterChat) sera l'image principale
   - Screenshots 2-8 suivent

**Ordre d'affichage = Ordre d'upload**

---

## 💡 CONSEILS PROFESSIONNELS

### ✅ À FAIRE
- Utilisez des profils de test avec de vraies photos (libres de droits)
- Montrez les scores de compatibilité partout
- Mettez l'accent sur l'agent IA (screenshot #1)
- Gardez une cohérence visuelle entre tous les screenshots
- Testez sur plusieurs tailles d'écran si possible

### ❌ À ÉVITER
- Données personnelles réelles
- Contenu inapproprié
- Screenshots flous ou pixelisés
- Trop de texte explicatif sur les images
- Mélange de thèmes sombre/clair (gardez le même)

---

## 🆘 PROBLÈMES COURANTS

### "Mes screenshots sont de mauvaise qualité"
→ Vérifiez que vous exportez en PNG, pas JPG
→ Utilisez un émulateur plutôt qu'un vrai téléphone

### "Les dimensions ne correspondent pas"
→ Utilisez un outil de redimensionnement : https://www.iloveimg.com/resize-image
→ Ciblez exactement 1080 x 1920 px

### "Je n'ai pas assez de contenu de test"
→ Allez dans AdminTestData pour générer plus de profils
→ Créez plusieurs conversations de test

### "L'interface n'est pas en français"
→ Vérifiez les paramètres de langue de l'app
→ Vérifiez que les fichiers i18n sont bien chargés

---

## 📞 BESOIN D'AIDE ?

Si vous avez des difficultés :
1. Vérifiez que l'app fonctionne correctement en dev
2. Testez avec le compte : gp-internal-d4f7b2c9e1a8@alterapp-test.review / 999999
3. Relancez l'app si besoin

---

**Bon courage ! Vos screenshots sont la vitrine de votre app sur le Play Store.** 🎯

**Priorisez l'AlterChat (Agent IA) et les scores de compatibilité - ce sont vos atouts !**
