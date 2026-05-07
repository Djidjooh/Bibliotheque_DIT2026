-- =============================================
-- Bibliothèque Numérique DIT — Schéma PostgreSQL
-- =============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE : utilisateurs
-- =============================================
CREATE TABLE utilisateurs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom           VARCHAR(100) NOT NULL,
    prenom        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe  VARCHAR(255) NOT NULL,
    type_utilisateur VARCHAR(20) NOT NULL
                  CHECK (type_utilisateur IN ('etudiant', 'professeur', 'personnel')),
    actif         BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE : livres
-- =============================================
CREATE TABLE livres (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre         VARCHAR(255) NOT NULL,
    auteur        VARCHAR(255) NOT NULL,
    isbn          VARCHAR(20) UNIQUE NOT NULL,
    categorie     VARCHAR(100),
    editeur       VARCHAR(150),
    annee_publication INT,
    nombre_exemplaires INT DEFAULT 1,
    exemplaires_disponibles INT DEFAULT 1,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE : emprunts
-- =============================================
CREATE TABLE emprunts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    livre_id        UUID NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
    date_emprunt    DATE NOT NULL DEFAULT CURRENT_DATE,
    date_retour_prevue DATE NOT NULL,
    date_retour_effective DATE,
    statut          VARCHAR(20) NOT NULL DEFAULT 'en_cours'
                    CHECK (statut IN ('en_cours', 'retourne', 'en_retard')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE : notes (pour le système de recommandation)
-- =============================================
CREATE TABLE notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    livre_id        UUID NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
    note            NUMERIC(2,1) NOT NULL CHECK (note BETWEEN 1 AND 5),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(utilisateur_id, livre_id)
);

-- =============================================
-- INDEX pour les performances
-- =============================================
CREATE INDEX idx_emprunts_utilisateur ON emprunts(utilisateur_id);
CREATE INDEX idx_emprunts_livre       ON emprunts(livre_id);
CREATE INDEX idx_emprunts_statut      ON emprunts(statut);
CREATE INDEX idx_livres_isbn          ON livres(isbn);
CREATE INDEX idx_livres_auteur        ON livres(auteur);
CREATE INDEX idx_notes_utilisateur    ON notes(utilisateur_id);

-- =============================================
-- FONCTION : mise à jour automatique updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_utilisateurs_updated
  BEFORE UPDATE ON utilisateurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_livres_updated
  BEFORE UPDATE ON livres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_emprunts_updated
  BEFORE UPDATE ON emprunts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- DONNÉES DE TEST
-- =============================================
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, type_utilisateur) VALUES
  ('Diallo',  'Mamadou',  'mamadou@dit.sn',  'hashed_pwd_1', 'etudiant'),
  ('Ndiaye',  'Fatou',    'fatou@dit.sn',    'hashed_pwd_2', 'etudiant'),
  ('Sarr',    'Ibrahima', 'ibrahima@dit.sn', 'hashed_pwd_3', 'professeur'),
  ('Fall',    'Aminata',  'aminata@dit.sn',  'hashed_pwd_4', 'personnel');

INSERT INTO livres (titre, auteur, isbn, categorie, annee_publication, nombre_exemplaires, exemplaires_disponibles) VALUES
  ('Intelligence Artificielle : une approche moderne', 'Russell & Norvig', '978-0134610993', 'IA',           2020, 3, 3),
  ('Deep Learning',                                    'Goodfellow et al.','978-0262035613', 'ML',           2016, 2, 2),
  ('Clean Code',                                       'Robert C. Martin', '978-0132350884', 'Génie Logiciel',2008, 4, 4),
  ('Docker en pratique',                               'Ian Miell',        '978-1617294808', 'DevOps',       2019, 2, 2),
  ('Designing Data-Intensive Applications',            'Martin Kleppmann', '978-1449373320', 'Systèmes',     2017, 3, 3);

INSERT INTO notes (utilisateur_id, livre_id, note)
SELECT u.id, l.id, ROUND((RANDOM() * 3 + 2)::numeric, 1)
FROM utilisateurs u
CROSS JOIN livres l
WHERE RANDOM() > 0.3;
