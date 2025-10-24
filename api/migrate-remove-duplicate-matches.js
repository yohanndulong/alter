const { Client } = require('pg');

/**
 * Script de migration pour nettoyer les matches en doublon
 *
 * Chaque match devrait exister une seule fois, mais actuellement
 * il y a deux entrées pour chaque match (une dans chaque direction).
 *
 * Ce script :
 * 1. Trouve tous les doublons
 * 2. Pour chaque paire, garde le plus ancien et supprime le plus récent
 * 3. Met à jour les messages pour pointer vers le match conservé
 */

async function migrateMatches() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/alter_db'
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Commencer une transaction
    await client.query('BEGIN');

    // 1. Trouver tous les doublons
    console.log('🔍 Recherche des matches en doublon...\n');

    const duplicatesQuery = `
      SELECT
        m1.id as match1_id,
        m1."userId" as user1_id,
        m1."matchedUserId" as user2_id,
        m1."matchedAt" as match1_date,
        m1."isActive" as match1_active,
        m2.id as match2_id,
        m2."matchedAt" as match2_date,
        m2."isActive" as match2_active
      FROM matches m1
      INNER JOIN matches m2
        ON m1."userId" = m2."matchedUserId"
        AND m1."matchedUserId" = m2."userId"
        AND m1.id < m2.id  -- Pour éviter les doublons dans les résultats
      ORDER BY m1."matchedAt"
    `;

    const duplicates = await client.query(duplicatesQuery);

    console.log(`📊 Trouvé ${duplicates.rows.length} paires de matches en doublon\n`);

    if (duplicates.rows.length === 0) {
      console.log('✅ Aucun doublon trouvé, rien à migrer');
      await client.query('COMMIT');
      return;
    }

    let keptCount = 0;
    let deletedCount = 0;
    let messagesUpdated = 0;

    // 2. Pour chaque paire de doublons
    for (const duplicate of duplicates.rows) {
      const { match1_id, user1_id, user2_id, match1_date, match1_active, match2_id, match2_date, match2_active } = duplicate;

      console.log(`\n--- Traitement de la paire ---`);
      console.log(`Match 1: ${match1_id} (${user1_id} -> ${user2_id}) - ${match1_date} - Active: ${match1_active}`);
      console.log(`Match 2: ${match2_id} (${user2_id} -> ${user1_id}) - ${match2_date} - Active: ${match2_active}`);

      // Déterminer quel match garder (le plus ancien, ou celui qui est actif si l'autre ne l'est pas)
      let matchToKeep, matchToDelete;

      if (match1_active && !match2_active) {
        // Garder match1 car il est actif
        matchToKeep = match1_id;
        matchToDelete = match2_id;
      } else if (!match1_active && match2_active) {
        // Garder match2 car il est actif
        matchToKeep = match2_id;
        matchToDelete = match1_id;
      } else {
        // Les deux ont le même statut, garder le plus ancien
        if (new Date(match1_date) <= new Date(match2_date)) {
          matchToKeep = match1_id;
          matchToDelete = match2_id;
        } else {
          matchToKeep = match2_id;
          matchToDelete = match1_id;
        }
      }

      console.log(`  ✅ Garde: ${matchToKeep}`);
      console.log(`  ❌ Supprime: ${matchToDelete}`);

      // 3. Mettre à jour les messages qui pointent vers le match à supprimer
      const updateMessagesResult = await client.query(
        'UPDATE messages SET "matchId" = $1 WHERE "matchId" = $2',
        [matchToKeep, matchToDelete]
      );

      const messagesAffected = updateMessagesResult.rowCount || 0;
      messagesUpdated += messagesAffected;

      if (messagesAffected > 0) {
        console.log(`  📝 ${messagesAffected} message(s) réassigné(s) vers ${matchToKeep}`);
      }

      // 4. Supprimer le doublon
      await client.query(
        'DELETE FROM matches WHERE id = $1',
        [matchToDelete]
      );

      keptCount++;
      deletedCount++;
    }

    // Commit la transaction
    await client.query('COMMIT');

    console.log(`\n\n========== RÉSUMÉ ==========`);
    console.log(`✅ ${keptCount} matches conservés`);
    console.log(`❌ ${deletedCount} doublons supprimés`);
    console.log(`📝 ${messagesUpdated} messages réassignés`);
    console.log(`============================\n`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la migration:', err);
    throw err;
  } finally {
    await client.end();
    console.log('✅ Connexion fermée');
  }
}

// Exécuter la migration
console.log('🚀 Démarrage de la migration des matches...\n');
migrateMatches()
  .then(() => {
    console.log('\n✅ Migration terminée avec succès !');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Migration échouée:', err.message);
    process.exit(1);
  });
