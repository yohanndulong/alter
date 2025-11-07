# Configuration Firebase pour les notifications push

## Étape 1 : Préparer le JSON Firebase

Vous avez téléchargé le fichier `google-services.json` depuis Firebase Console.
Ce fichier contient les credentials nécessaires pour Firebase Admin SDK.

## Étape 2 : Ajouter au fichier .env

### Option 1 : JSON sur une seule ligne (recommandé)

Ouvrez le fichier `google-services.json` et copiez tout son contenu, puis minifiez-le sur une seule ligne.

Ajoutez ceci dans votre fichier `.env` :

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"votre-projet","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

### Option 2 : Utiliser un script pour générer la variable

Créez un fichier temporaire `generate-env.js` :

```javascript
const fs = require('fs');
const path = require('path');

// Chemin vers votre fichier téléchargé
const jsonPath = 'C:\\Users\\Yohann\\Downloads\\google-services.json';

// Lire et minifier le JSON
const jsonContent = fs.readFileSync(jsonPath, 'utf8');
const minified = JSON.stringify(JSON.parse(jsonContent));

// Afficher la ligne à ajouter dans .env
console.log('\nAjoutez cette ligne dans votre fichier .env :\n');
console.log(`FIREBASE_SERVICE_ACCOUNT=${minified}`);
console.log('\n');
```

Puis exécutez :
```bash
node generate-env.js
```

Copiez la ligne générée dans votre `.env`.

## Étape 3 : Vérifier la configuration

Redémarrez votre backend :
```bash
npm run start:dev
```

Vous devriez voir dans les logs :
```
✅ Firebase Admin SDK initialisé
```

Si vous voyez une erreur, vérifiez que :
1. Le JSON est valide (pas de caractères échappés manquants)
2. Les `\n` dans la clé privée sont bien présents
3. Aucun guillemet n'est manquant

## Notes importantes

⚠️ **Sécurité** :
- Ne commitez JAMAIS le fichier `.env` dans git
- Ajoutez `.env` dans votre `.gitignore`
- Sur production, utilisez des variables d'environnement sécurisées (secrets manager)

⚠️ **Format de la clé privée** :
La clé privée dans le JSON contient des `\n` qui doivent être préservés.
Exemple : `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`
