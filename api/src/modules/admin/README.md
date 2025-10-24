# Module Admin - Gestion des Données de Test

## 📋 Vue d'ensemble

Le module Admin permet de générer et supprimer des données de test pour tester l'application ALTER dans tous les cas d'usage possibles.

## 🎯 Fonctionnalités

### 1. Génération de données de test

Génère automatiquement :
- **Utilisateurs** avec profils complets (nom, âge, ville, photos, bio)
- **Profils ALTER** avec données AI (personnalité, intention, identité, etc.)
- **Likes** aléatoires entre utilisateurs
- **Matches** mutuels (likes réciproques)
- **Messages** de conversation entre matches

### 2. Suppression des données

Trois niveaux de suppression :
- **Données de test** : Supprime uniquement les utilisateurs @alter.test
- **Reset ALTER** : Réinitialise le profil ALTER d'un utilisateur
- **Toutes les données** : ⚠️ SUPPRIME TOUT (à utiliser avec précaution)

## 🚀 Utilisation

### Via l'API (Backend)

#### Générer des données de test

```bash
POST /admin/generate-test-data
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "usersCount": 20,
  "withProfiles": true,
  "withMatches": true,
  "withLikes": true,
  "withMessages": true
}
```

**Paramètres :**
- `usersCount` (default: 20) : Nombre d'utilisateurs à créer
- `withProfiles` (default: true) : Générer des profils ALTER complets
- `withMatches` (default: true) : Créer des matches mutuels
- `withLikes` (default: true) : Générer des likes aléatoires
- `withMessages` (default: true) : Créer des messages de conversation

**Réponse :**
```json
{
  "users": 20,
  "message": "Données de test générées avec succès"
}
```

#### Supprimer les données de test

```bash
DELETE /admin/test-data
Authorization: Bearer YOUR_TOKEN
```

Supprime uniquement les utilisateurs avec `@alter.test` dans leur email.

#### Supprimer TOUTES les données

```bash
DELETE /admin/all-data?confirm=yes
Authorization: Bearer YOUR_TOKEN
```

⚠️ **ATTENTION** : Cette action est **IRRÉVERSIBLE** et supprime :
- Tous les utilisateurs
- Tous les matches
- Tous les likes
- Tous les messages

### Via l'interface web (Frontend)

Accédez à la page admin via :
```
http://localhost:5173/admin/test-data
```

**Prérequis :** Vous devez être connecté avec un compte admin (`isAdmin: true`)

L'interface permet de :
1. Configurer les paramètres de génération
2. Générer les données en un clic
3. Supprimer les données de test
4. ⚠️ Supprimer toutes les données (avec double confirmation)

## 📊 Données générées

### Utilisateurs

Chaque utilisateur généré possède :

**Informations de base :**
- Email : `test.user{N}@alter.test`
- Mot de passe : `Test1234!`
- Prénom/Nom aléatoires
- Date de naissance (18-43 ans)
- Genre (male/female/non-binary)
- Ville parmi 10 villes françaises

**Profil complet (si `withProfiles: true`) :**
- Objectifs de recherche
- Genre préféré
- Tranche d'âge
- Distance maximale
- 3-8 centres d'intérêt

**Profil ALTER :**
- Personnalité
- Intention
- Identité
- Style d'amitié
- Style amoureux
- Sexualité
- Résumé généré automatiquement
- Complétion à 85-100%

### Likes

- Chaque utilisateur like entre 5 et 15 profils
- Types : like, superlike, pass (aléatoire)

### Matches

- 30% de chance de match entre utilisateurs adjacents
- Date de match dans les 7 derniers jours

### Messages

- 70% des matches contiennent des messages
- 2-12 messages par conversation
- Messages espacés d'1 heure

## 🔐 Sécurité

- Tous les endpoints admin nécessitent une authentification JWT
- Seuls les utilisateurs avec `isAdmin: true` peuvent accéder
- Double confirmation pour la suppression totale

## 💡 Cas d'usage

### Tester le matching
```bash
# Générer 50 utilisateurs avec profils complets
POST /admin/generate-test-data
{
  "usersCount": 50,
  "withProfiles": true,
  "withLikes": false,
  "withMatches": false,
  "withMessages": false
}
```

### Tester les conversations
```bash
# Générer 20 utilisateurs avec matches et messages
POST /admin/generate-test-data
{
  "usersCount": 20,
  "withProfiles": true,
  "withMatches": true,
  "withMessages": true
}
```

### Tester l'algorithme de découverte
```bash
# Générer beaucoup d'utilisateurs avec likes
POST /admin/generate-test-data
{
  "usersCount": 100,
  "withProfiles": true,
  "withLikes": true
}
```

## 🧪 Tests recommandés

1. **Test de performance** : Générer 100+ utilisateurs pour tester les performances
2. **Test de matching** : Générer 20-30 utilisateurs avec profils variés
3. **Test de conversation** : Générer des matches avec messages
4. **Test de likes** : Vérifier le système de likes/superlikes/pass
5. **Test d'embeddings** : Avec profils complets pour tester la recherche vectorielle

## 🗑️ Nettoyage

Après vos tests, pensez à nettoyer :

```bash
# Supprimer uniquement les données de test
DELETE /admin/test-data
```

Les utilisateurs de test sont identifiables par :
- Email se terminant par `@alter.test`

## ⚠️ Avertissements

- Ne jamais exécuter `DELETE /admin/all-data` en production !
- Les données générées sont **aléatoires** et peuvent ne pas être totalement cohérentes
- La génération de beaucoup d'utilisateurs (100+) peut prendre plusieurs secondes
- Les embeddings ne sont pas générés automatiquement (nécessite appel API OpenAI)

## 🛠️ Développement

### Ajouter de nouveaux types de données

Modifiez `test-data.service.ts` pour ajouter :
- De nouveaux champs aux utilisateurs
- De nouveaux types de relations
- De nouvelles données métier

### Personnaliser les données générées

Les données aléatoires sont configurables dans :
- `generateUser()` : Profils utilisateurs
- `generateLikes()` : Stratégie de likes
- `generateMatches()` : Logique de matching
- `generateMessages()` : Messages de conversation

## 📚 Ressources

- [Documentation TypeORM](https://typeorm.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Faker.js](https://fakerjs.dev/) (alternative pour génération de données)
