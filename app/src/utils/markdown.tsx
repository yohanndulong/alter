import React from 'react'

/**
 * Parse le markdown simple pour le rendu dans ALTER Chat
 * Supporte : **bold**, ligne vide = paragraphe
 */
export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null

  // Normaliser les retours à la ligne (Windows CRLF -> LF, multiples LF)
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Séparer en paragraphes (lignes vides = \n\n)
  const paragraphs = normalized.split('\n\n').filter(p => p.trim())

  return paragraphs.map((paragraph, pIndex) => {
    // Traiter chaque ligne du paragraphe
    const lines = paragraph.split('\n')

    return (
      <p key={pIndex} style={{ marginBottom: pIndex < paragraphs.length - 1 ? '1em' : '0' }}>
        {lines.map((line, lIndex) => (
          <span key={lIndex}>
            {parseLine(line)}
            {lIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

/**
 * Parse une ligne pour gérer le gras
 */
function parseLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let currentText = ''
  let isBold = false
  let i = 0

  while (i < line.length) {
    // Vérifier si on a **
    if (line[i] === '*' && line[i + 1] === '*') {
      // Sauvegarder le texte précédent
      if (currentText) {
        parts.push(isBold ? <strong key={parts.length}>{currentText}</strong> : currentText)
        currentText = ''
      }
      // Basculer le mode gras
      isBold = !isBold
      i += 2 // Sauter les deux **
    } else {
      currentText += line[i]
      i++
    }
  }

  // Ajouter le dernier morceau de texte
  if (currentText) {
    parts.push(isBold ? <strong key={parts.length}>{currentText}</strong> : currentText)
  }

  return parts
}
