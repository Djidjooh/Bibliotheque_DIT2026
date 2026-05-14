/**
 * fix-passwords.js — Réinitialise les mots de passe non hachés en base de données.
 * Compatible Windows / Linux / macOS.
 *
 * Prérequis : les conteneurs Docker doivent être démarrés (docker-compose up -d)
 *
 * Utilisation :
 *   node scripts/fix-passwords.js
 *
 * Ce script met à jour uniquement les lignes dont le mot de passe n'est pas un
 * hash bcrypt (ne commence pas par "$2"). Tous ces utilisateurs reçoivent le
 * mot de passe par défaut : dit2026
 */

const { execSync } = require('child_process');

const DB_CONTAINER = 'bibliotheque_db';
const DB_USER      = 'postgres';
const DB_NAME      = 'bibliotheque';

function psql(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  return execSync(
    `docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "${escaped}"`,
    { encoding: 'utf8' }
  );
}

function main() {
  console.log('Bibliothèque DIT — Correction des mots de passe\n');

  // 1. S'assurer que pgcrypto est activé
  console.log('1. Activation de pgcrypto...');
  psql("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
  console.log('   OK');

  // 2. Compter les utilisateurs avec des mots de passe non hachés
  const countResult = psql(
    "SELECT COUNT(*) FROM utilisateurs WHERE mot_de_passe NOT LIKE '$2%';"
  );
  const match = countResult.match(/(\d+)/);
  const count = match ? parseInt(match[1]) : 0;
  console.log(`\n2. Utilisateurs avec mots de passe invalides : ${count}`);

  if (count === 0) {
    console.log('   Aucune correction nécessaire.');
    return;
  }

  // 3. Corriger les mots de passe (sauf admin@dit.sn)
  console.log('\n3. Mise à jour des mots de passe → dit2026 ...');
  const updateResult = psql(
    "UPDATE utilisateurs SET mot_de_passe = crypt('dit2026', gen_salt('bf', 10)) " +
    "WHERE mot_de_passe NOT LIKE '$2%' AND email != 'admin@dit.sn';"
  );
  console.log('   ' + updateResult.trim());

  // 4. Créer l'administrateur s'il n'existe pas
  console.log('\n4. Vérification du compte admin...');
  const adminCheck = psql(
    "SELECT COUNT(*) FROM utilisateurs WHERE email = 'admin@dit.sn';"
  );
  const adminExists = parseInt(adminCheck.match(/(\d+)/)[1]) > 0;

  if (!adminExists) {
    console.log('   Création du compte admin@dit.sn (mot de passe: admin2026)...');
    psql(
      "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, type_utilisateur) " +
      "VALUES ('Admin', 'Système', 'admin@dit.sn', " +
      "crypt('admin2026', gen_salt('bf', 10)), 'personnel');"
    );
    console.log('   Compte créé.');
  } else {
    console.log('   Compte admin existant — aucune modification.');
  }

  // 5. Résumé final
  console.log('\n5. Vérification finale...');
  const finalCheck = psql(
    "SELECT COUNT(*) FROM utilisateurs WHERE mot_de_passe NOT LIKE '$2%';"
  );
  const remaining = parseInt(finalCheck.match(/(\d+)/)[1]);

  if (remaining === 0) {
    console.log('\n✓ Tous les mots de passe sont correctement hachés.');
    console.log('\nComptes disponibles :');
    console.log('  • Utilisateurs seed  : <email>  /  dit2026');
    console.log('  • Administrateur     : admin@dit.sn  /  admin2026');
  } else {
    console.log(`\n⚠  ${remaining} mots de passe restent incorrects. Vérifiez les logs.`);
  }
}

try {
  main();
} catch (err) {
  console.error('\nErreur :', err.message);
  console.error('\nVérifiez que les conteneurs Docker sont démarrés :');
  console.error('  docker-compose up -d');
  process.exit(1);
}
