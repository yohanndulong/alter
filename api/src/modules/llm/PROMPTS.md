# Système de Prompts Paramétrés

Tous les prompts LLM sont stockés dans la table `parameters` pour permettre leur modification sans redéploiement.

## Architecture

### Stockage
- **Emplacement** : Table `parameters` avec clés préfixées `prompts.*`
- **Initialisation** : Création automatique au démarrage via `default-parameters.ts`
- **Cache** : TTL 1 heure pour optimiser les performances
- **Versioning** : Chaque modification crée une nouvelle version

### Placeholders

Les prompts utilisent la syntaxe `{{placeholder_name}}` pour l'injection dynamique de données.

**Exemple** :
```
Bonjour {{user_name}}, tu as {{age}} ans.
```

## Prompts disponibles

### 1. ALTER System Prompt (`prompts.alter_system`)

Prompt complet pour le coach love ALTER avec gestion de profil structuré.

**Placeholders** :
- `{{max_questions_per_session}}` - Nombre max de questions par thème
- `{{personality_weight}}` - Poids personnalité (%)
- `{{intention_weight}}` - Poids intention (%)
- `{{identity_weight}}` - Poids identité (%)
- `{{friendship_weight}}` - Poids amitié (%)
- `{{love_weight}}` - Poids amour (%)
- `{{sexuality_weight}}` - Poids sexualité (%)
- `{{bio_weight}}` - Poids bio (%)
- `{{user_known_info}}` - Section d'informations utilisateur (générée dynamiquement)

**Utilisation** :
```typescript
const response = await llmService.generateAlterStructuredResponse(
  conversationHistory,
  currentProfileState,
  userData
);
```

**Valeurs injectées** :
- Les poids sont récupérés depuis les paramètres `alter.*`
- `user_known_info` est construit à partir des données d'onboarding de l'utilisateur
- Si l'utilisateur a déjà fourni certaines informations, elles sont listées pour éviter de les redemander

### 2. Compatibility Analysis (`prompts.compatibility_analysis`)

Analyse de compatibilité entre deux profils utilisateurs.

**Placeholders** :
- `{{user1_profile}}` - Profil utilisateur 1 (texte formaté)
- `{{user2_profile}}` - Profil utilisateur 2 (texte formaté)

**Utilisation** :
```typescript
const compatibility = await llmService.analyzeCompatibility(
  user1Profile,
  user2Profile
);
```

**Format de réponse** :
```json
{
  "global": 75,
  "love": 80,
  "friendship": 70,
  "carnal": 65,
  "insight": "Vous partagez des valeurs similaires..."
}
```

### 3. Conversation Quality (`prompts.conversation_quality`)

Analyse la qualité d'une conversation entre deux utilisateurs.

**Placeholders** :
- `{{conversation_history}}` - Historique de la conversation (texte)

**Utilisation** :
```typescript
const quality = await llmService.analyzeConversationQuality(
  conversationHistory
);
```

**Format de réponse** :
```json
{
  "score": 85,
  "feedback": "Bonne dynamique d'échange..."
}
```

## Modification des prompts

### Via l'interface Admin

1. Se connecter en tant qu'admin
2. Accéder à `/admin/parameters`
3. Chercher le paramètre `prompts.*`
4. Cliquer sur **Modifier**
5. Éditer le prompt (respecter les placeholders)
6. Enregistrer (crée une nouvelle version)

### Via l'API

```typescript
await parametersService.set(
  'prompts.alter_system',
  'Nouveau prompt avec {{placeholder}}...',
  'Description de la modification'
);
```

### Restaurer une ancienne version

```typescript
await parametersService.restoreVersion('prompts.alter_system', 2);
```

## Helpers disponibles

### `replacePlaceholders(template, values)`

Remplace tous les placeholders dans un template.

```typescript
import { replacePlaceholders } from '../parameters/prompt-helper';

const result = replacePlaceholders(
  'Bonjour {{name}}, tu as {{age}} ans',
  { name: 'Alice', age: 25 }
);
// result: "Bonjour Alice, tu as 25 ans"
```

### `findUnreplacedPlaceholders(text)`

Vérifie si des placeholders n'ont pas été remplacés (utile pour debug).

```typescript
import { findUnreplacedPlaceholders } from '../parameters/prompt-helper';

const unreplaced = findUnreplacedPlaceholders(
  'Bonjour {{name}}, tu as {{age}} ans'
);
// unreplaced: ['name', 'age']
```

### `extractPlaceholders(template)`

Extrait tous les placeholders d'un template.

```typescript
import { extractPlaceholders } from '../parameters/prompt-helper';

const placeholders = extractPlaceholders(
  'Bonjour {{name}}, tu as {{age}} ans'
);
// placeholders: ['name', 'age']
```

## Ajout d'un nouveau prompt

1. **Ajouter dans `default-parameters.ts`** :
```typescript
{
  key: 'prompts.my_new_prompt',
  value: `Prompt avec {{placeholder1}} et {{placeholder2}}`,
  description: 'Description du nouveau prompt',
}
```

2. **Créer une méthode dans `llm.service.ts`** :
```typescript
async myNewPrompt(data1: string, data2: string): Promise<any> {
  const promptTemplate = await this.parametersService.get<string>(
    'prompts.my_new_prompt'
  );

  const systemPrompt = replacePlaceholders(promptTemplate, {
    placeholder1: data1,
    placeholder2: data2,
  });

  const messages: LlmMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  const response = await this.chat(messages, {
    jsonMode: true,
    temperature: 0.7,
  });

  return JSON.parse(response.content);
}
```

3. **Redémarrer le serveur** - Le prompt sera créé automatiquement

## Bonnes pratiques

### Nommage des placeholders
- Utiliser `snake_case` : `{{user_name}}` ✅
- Éviter `camelCase` : `{{userName}}` ❌
- Être descriptif : `{{max_questions}}` ✅ vs `{{max}}` ❌

### Structure du prompt
- Définir clairement le rôle et contexte
- Spécifier le format de réponse attendu
- Inclure des exemples si nécessaire
- Utiliser des sections avec `##` pour organiser

### Placeholders
- Toujours documenter les placeholders disponibles
- Valider que tous les placeholders sont remplacés avant l'envoi
- Ne jamais hardcoder des valeurs qui pourraient changer

### Versioning
- Ajouter une description claire lors de chaque modification
- Tester le nouveau prompt avant de supprimer l'ancienne version
- Garder au moins 2-3 versions historiques pour rollback

## Sécurité

- ✅ Seuls les admins peuvent modifier les prompts
- ✅ Chaque modification est versionnée et traçable
- ✅ Impossible d'injecter du code via les placeholders (simple remplacement de texte)
- ✅ Cache invalidé automatiquement lors des modifications

## Performance

- **Cache** : Les prompts sont mis en cache pendant 1 heure
- **Lazy loading** : Les prompts sont chargés uniquement quand nécessaires
- **Réutilisation** : Un même template peut être utilisé plusieurs fois sans rechargement

## Debugging

### Vérifier les placeholders non remplacés

```typescript
import { findUnreplacedPlaceholders } from '../parameters/prompt-helper';

const prompt = await parametersService.get('prompts.alter_system');
const unreplaced = findUnreplacedPlaceholders(prompt);

if (unreplaced.length > 0) {
  console.warn('Unreplaced placeholders:', unreplaced);
}
```

### Logger le prompt final

```typescript
const systemPrompt = replacePlaceholders(template, values);
this.logger.debug('Final prompt:', systemPrompt);
```

### Tester localement

```typescript
const testValues = {
  max_questions_per_session: 10,
  personality_weight: 20,
  // ...
};

const result = replacePlaceholders(promptTemplate, testValues);
console.log(result);
```
