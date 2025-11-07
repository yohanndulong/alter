# 📦 Assets pour Google Play Store - Alter

Ce dossier contient tous les éléments visuels nécessaires pour la publication sur Google Play Store.

---

## 📋 CONTENU

### 1. 🎨 Bannière Feature Graphic (1024 x 500 px)

**Fichier :** `feature-graphic.html`

**Comment l'utiliser :**
```bash
# Ouvrir dans un navigateur
start feature-graphic.html   # Windows
open feature-graphic.html    # Mac
```

Ensuite :
1. Appuyez sur F11 (plein écran)
2. Zoom à 100% (Ctrl+0 ou Cmd+0)
3. Capturez uniquement la zone colorée
4. Enregistrez en PNG : `feature-graphic.png`

**Résultat :**
- Design moderne avec dégradé violet-rose
- Logo Alter
- Tagline : "Votre Coach IA pour des Rencontres Authentiques"
- Mockup de téléphone avec aperçu de l'app
- 3 features principales (Agent IA, 3 Scores, Authenticité)

---

### 2. 📸 Screenshots de l'application (1080 x 1920 px)

**Guide complet :** `GUIDE_SCREENSHOTS.md`

**8 screenshots requis (dans l'ordre) :**
1. AlterChat - Agent IA ⭐ **PRIORITÉ**
2. AlterChat - Intentions & Profil
3. Discover - Mode Swipe avec Scores ⭐ **IMPORTANT**
4. Discover - Mode Liste
5. Filtres de Compatibilité
6. Chat - Conversation
7. Matches - Liste
8. Onboarding - Question

**Méthodes disponibles :**
- Émulateur Android Studio (recommandé)
- Téléphone Android réel
- Détails dans le guide

---

### 3. 🎯 Icône de l'application (512 x 512 px)

**Fichier source :** `../resources/icon.svg`

**Conversion nécessaire :**
Le SVG existe déjà, il faut le convertir en PNG 512x512 :

**Options :**
- En ligne : https://cloudconvert.com/svg-to-png
- Inkscape : `inkscape resources/icon.svg --export-type=png --export-width=512 -o icon-512.png`
- Outils en ligne : svgtopng.com, convertio.co

---

## ✅ CHECKLIST COMPLÈTE

### Assets graphiques
- [ ] Bannière feature graphic (1024x500) générée depuis HTML
- [ ] Icône PNG 512x512 convertie depuis SVG
- [ ] 8 screenshots (1080x1920) de l'application

### Captures d'écran prises
- [ ] 01 - AlterChat Agent IA
- [ ] 02 - AlterChat Intentions
- [ ] 03 - Discover Swipe avec 3 scores
- [ ] 04 - Discover Liste
- [ ] 05 - Filtres compatibilité
- [ ] 06 - Chat conversation
- [ ] 07 - Matches liste
- [ ] 08 - Onboarding question

### Vérifications qualité
- [ ] Toutes les images au bon format (PNG)
- [ ] Toutes les images aux bonnes dimensions
- [ ] Pas d'informations personnelles
- [ ] Cohérence visuelle entre les screenshots
- [ ] Agent IA et scores de compatibilité bien visibles
- [ ] Texte lisible, images nettes

---

## 📐 DIMENSIONS RÉCAPITULATIF

| Élément | Dimensions | Format | Obligatoire |
|---------|-----------|--------|-------------|
| Icône | 512 x 512 px | PNG | ✅ Oui |
| Feature Graphic | 1024 x 500 px | PNG/JPG | ⚠️ Recommandé |
| Screenshots | 1080 x 1920 px | PNG/JPG | ✅ Oui (min 2) |

---

## 🎨 CHARTE GRAPHIQUE UTILISÉE

**Couleurs principales :**
- Violet : `#9333EA`
- Magenta : `#C026D3`
- Rose : `#EC4899`
- Dégradé : `linear-gradient(135deg, #9333EA 0%, #C026D3 50%, #EC4899 100%)`

**Police suggérée :**
- Sans-serif moderne (Inter, SF Pro, Segoe UI)
- Poids : 400 (Regular), 600 (Semibold), 800 (Extrabold)

**Icônes/Emojis utilisés :**
- 🤖 Agent IA / Coaching
- ❤️ Amour (compatibilité)
- 🤝 Amitié (compatibilité)
- 🔥 Charnel (compatibilité)
- ✨ Authenticité

---

## 🚀 PROCHAINES ÉTAPES

1. **Générer la bannière**
   - Ouvrir `feature-graphic.html`
   - Capturer et enregistrer en PNG

2. **Convertir l'icône**
   - Convertir `../resources/icon.svg` en PNG 512x512

3. **Prendre les screenshots**
   - Suivre le guide dans `GUIDE_SCREENSHOTS.md`
   - Utiliser le compte de test
   - Respecter l'ordre de priorité

4. **Organiser les fichiers**
   ```
   store-assets/
   ├── feature-graphic.png        (1024x500)
   ├── icon-512.png               (512x512)
   └── screenshots/
       ├── 01-alterchat-agent.png (1080x1920)
       ├── 02-alterchat-intentions.png
       ├── 03-discover-swipe.png
       ├── 04-discover-liste.png
       ├── 05-filtres.png
       ├── 06-chat.png
       ├── 07-matches.png
       └── 08-onboarding.png
   ```

5. **Upload sur Google Play Console**
   - Fiche du Play Store > Images
   - Upload dans l'ordre

---

## 💡 CONSEILS IMPORTANTS

### À mettre en avant
- 🤖 **Agent IA Alter** (votre différenciateur principal)
- 💕 **3 scores de compatibilité** (Amour, Amitié, Charnel)
- ✨ **Authenticité** et accompagnement personnalisé

### Points clés pour Google
- Qualité visuelle professionnelle
- Cohérence graphique
- Mise en avant des fonctionnalités uniques
- Clarté du message

---

## 🆘 BESOIN D'AIDE ?

Consultez les guides :
- `GUIDE_SCREENSHOTS.md` - Détails sur les captures d'écran
- `../GUIDE_PLAY_STORE.md` - Guide complet de publication

**Compte de test :**
- Email : `gp-internal-d4f7b2c9e1a8@alterapp-test.review`
- Code : `999999`

---

**Tout est prêt pour créer des assets professionnels ! 🎨**
