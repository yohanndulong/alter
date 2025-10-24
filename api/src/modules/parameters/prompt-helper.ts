/**
 * Remplace les placeholders dans un prompt avec les valeurs fournies
 * Les placeholders utilisent la syntaxe {{placeholder_name}}
 *
 * @param template Le template de prompt avec placeholders
 * @param values Objet contenant les valeurs à injecter
 * @returns Le prompt avec tous les placeholders remplacés
 *
 * @example
 * const template = "Bonjour {{name}}, tu as {{age}} ans";
 * const result = replacePlaceholders(template, { name: "Alice", age: 25 });
 * // result: "Bonjour Alice, tu as 25 ans"
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, any>,
): string {
  let result = template;

  // Remplacer tous les placeholders {{key}}
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = value !== null && value !== undefined ? String(value) : '';
    result = result.split(placeholder).join(replacement);
  });

  return result;
}

/**
 * Vérifie si un template contient des placeholders non remplacés
 *
 * @param text Le texte à vérifier
 * @returns Array des placeholders non remplacés
 */
export function findUnreplacedPlaceholders(text: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

/**
 * Extrait tous les placeholders d'un template
 *
 * @param template Le template à analyser
 * @returns Array des noms de placeholders trouvés
 */
export function extractPlaceholders(template: string): string[] {
  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  return Array.from(placeholders);
}
