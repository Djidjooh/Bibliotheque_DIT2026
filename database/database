-- =============================================
-- Bibliothèque Numérique DIT — Schéma PostgreSQL
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    model_id      VARCHAR(10) UNIQUE,
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
  ('Diallo', 'Mamadou', 'mamadou1@dit.sn', 'hashed_pwd_1', 'etudiant'),
  ('Ndiaye', 'Fatou', 'fatou2@dit.sn', 'hashed_pwd_2', 'etudiant'),
  ('Sarr', 'Ibrahima', 'ibrahima3@dit.sn', 'hashed_pwd_3', 'professeur'),
  ('Fall', 'Aminata', 'aminata4@dit.sn', 'hashed_pwd_4', 'personnel'),
  ('Ba', 'Ousmane', 'ousmane5@dit.sn', 'hashed_pwd_5', 'etudiant'),
  ('Sy', 'Mariama', 'mariama6@dit.sn', 'hashed_pwd_6', 'etudiant'),
  ('Diop', 'Cheikh', 'cheikh7@dit.sn', 'hashed_pwd_7', 'professeur'),
  ('Kane', 'Awa', 'awa8@dit.sn', 'hashed_pwd_8', 'personnel'),
  ('Gueye', 'Moussa', 'moussa9@dit.sn', 'hashed_pwd_9', 'etudiant'),
  ('Seck', 'Rokhaya', 'rokhaya10@dit.sn', 'hashed_pwd_10', 'etudiant'),
  ('Lo', 'Abdou', 'abdou11@dit.sn', 'hashed_pwd_11', 'professeur'),
  ('Faye', 'Khady', 'khady12@dit.sn', 'hashed_pwd_12', 'personnel'),
  ('Thiam', 'Babacar', 'babacar13@dit.sn', 'hashed_pwd_13', 'etudiant'),
  ('Sow', 'Ndeye', 'ndeye14@dit.sn', 'hashed_pwd_14', 'etudiant'),
  ('Mbaye', 'Alioune', 'alioune15@dit.sn', 'hashed_pwd_15', 'professeur'),
  ('Camara', 'Assetou', 'assetou16@dit.sn', 'hashed_pwd_16', 'personnel'),
  ('Cisse', 'Lamine', 'lamine17@dit.sn', 'hashed_pwd_17', 'etudiant'),
  ('Toure', 'Aissatou', 'aissatou18@dit.sn', 'hashed_pwd_18', 'etudiant'),
  ('Barry', 'Mory', 'mory19@dit.sn', 'hashed_pwd_19', 'professeur'),
  ('Balde', 'Kadiatou', 'kadiatou20@dit.sn', 'hashed_pwd_20', 'personnel'),
  ('Keita', 'Sekou', 'sekou21@dit.sn', 'hashed_pwd_21', 'etudiant'),
  ('Traore', 'Binta', 'binta22@dit.sn', 'hashed_pwd_22', 'etudiant'),
  ('Konate', 'Adama', 'adama23@dit.sn', 'hashed_pwd_23', 'professeur'),
  ('Coulibaly', 'Salimata', 'salimata24@dit.sn', 'hashed_pwd_24', 'personnel'),
  ('Ouattara', 'Mahamadou', 'mahamadou25@dit.sn', 'hashed_pwd_25', 'etudiant'),
  ('Yao', 'Clarisse', 'clarisse26@dit.sn', 'hashed_pwd_26', 'etudiant'),
  ('Kouassi', 'Jean', 'jean27@dit.sn', 'hashed_pwd_27', 'professeur'),
  ('Mensah', 'Akosua', 'akosua28@dit.sn', 'hashed_pwd_28', 'personnel'),
  ('Agossou', 'Brice', 'brice29@dit.sn', 'hashed_pwd_29', 'etudiant'),
  ('Hounkpe', 'Sonia', 'sonia30@dit.sn', 'hashed_pwd_30', 'etudiant'),
  ('Adjovi', 'Rodrigue', 'rodrigue31@dit.sn', 'hashed_pwd_31', 'professeur'),
  ('Dossou', 'Mireille', 'mireille32@dit.sn', 'hashed_pwd_32', 'personnel'),
  ('Kiki', 'Ulrich', 'ulrich33@dit.sn', 'hashed_pwd_33', 'etudiant'),
  ('Tossou', 'Naomie', 'naomie34@dit.sn', 'hashed_pwd_34', 'etudiant'),
  ('Ahouansou', 'Maurice', 'maurice35@dit.sn', 'hashed_pwd_35', 'professeur'),
  ('Boko', 'Esther', 'esther36@dit.sn', 'hashed_pwd_36', 'personnel'),
  ('Adjanohoun', 'Wilfried', 'wilfried37@dit.sn', 'hashed_pwd_37', 'etudiant'),
  ('Houssou', 'Mariam', 'mariam38@dit.sn', 'hashed_pwd_38', 'etudiant'),
  ('Azon', 'Christian', 'christian39@dit.sn', 'hashed_pwd_39', 'professeur'),
  ('Fanou', 'Carine', 'carine40@dit.sn', 'hashed_pwd_40', 'personnel'),
  ('Babatounde', 'Armel', 'armel41@dit.sn', 'hashed_pwd_41', 'etudiant'),
  ('Houngbedji', 'Felicite', 'felicite42@dit.sn', 'hashed_pwd_42', 'etudiant'),
  ('Sodjinou', 'Patrick', 'patrick43@dit.sn', 'hashed_pwd_43', 'professeur'),
  ('Gnangnon', 'Judith', 'judith44@dit.sn', 'hashed_pwd_44', 'personnel'),
  ('Koudande', 'Serge', 'serge45@dit.sn', 'hashed_pwd_45', 'etudiant'),
  ('Adekambi', 'Olivia', 'olivia46@dit.sn', 'hashed_pwd_46', 'etudiant'),
  ('Tognon', 'Blaise', 'blaise47@dit.sn', 'hashed_pwd_47', 'professeur'),
  ('Degboe', 'Sandrine', 'sandrine48@dit.sn', 'hashed_pwd_48', 'personnel'),
  ('Gandonou', 'Hervé', 'herve49@dit.sn', 'hashed_pwd_49', 'etudiant'),
  ('Ahouandjinou', 'Flore', 'flore50@dit.sn', 'hashed_pwd_50', 'etudiant'),
  ('Yedomon', 'Cedric', 'cedric51@dit.sn', 'hashed_pwd_51', 'professeur'),
  ('Dovonou', 'Brigitte', 'brigitte52@dit.sn', 'hashed_pwd_52', 'personnel'),
  ('Lokossou', 'Arnaud', 'arnaud53@dit.sn', 'hashed_pwd_53', 'etudiant'),
  ('Assogba', 'Rachel', 'rachel54@dit.sn', 'hashed_pwd_54', 'etudiant'),
  ('Avocetien', 'Jonas', 'jonas55@dit.sn', 'hashed_pwd_55', 'professeur'),
  ('Hounsinou', 'Elodie', 'elodie56@dit.sn', 'hashed_pwd_56', 'personnel'),
  ('Kpognon', 'Kevin', 'kevin57@dit.sn', 'hashed_pwd_57', 'etudiant'),
  ('Tchibozo', 'Murielle', 'murielle58@dit.sn', 'hashed_pwd_58', 'etudiant'),
  ('Awanou', 'Didier', 'didier59@dit.sn', 'hashed_pwd_59', 'professeur'),
  ('Gbaguidi', 'Clarisse', 'clarisse60@dit.sn', 'hashed_pwd_60', 'personnel'),
  ('Akakpo', 'Benoit', 'benoit61@dit.sn', 'hashed_pwd_61', 'etudiant'),
  ('Adje', 'Vanessa', 'vanessa62@dit.sn', 'hashed_pwd_62', 'etudiant'),
  ('Kiki', 'Donald', 'donald63@dit.sn', 'hashed_pwd_63', 'professeur'),
  ('Ahoyo', 'Ruth', 'ruth64@dit.sn', 'hashed_pwd_64', 'personnel'),
  ('Zannou', 'Luc', 'luc65@dit.sn', 'hashed_pwd_65', 'etudiant'),
  ('Hounmenou', 'Tatiana', 'tatiana66@dit.sn', 'hashed_pwd_66', 'etudiant'),
  ('Agbanrin', 'Franck', 'franck67@dit.sn', 'hashed_pwd_67', 'professeur'),
  ('Atchade', 'Noella', 'noella68@dit.sn', 'hashed_pwd_68', 'personnel'),
  ('Sohou', 'Emmanuel', 'emmanuel69@dit.sn', 'hashed_pwd_69', 'etudiant'),
  ('Dossa', 'Lydia', 'lydia70@dit.sn', 'hashed_pwd_70', 'etudiant'),
  ('Ahoueya', 'Marcel', 'marcel71@dit.sn', 'hashed_pwd_71', 'professeur'),
  ('Ahouandogbo', 'Suzanne', 'suzanne72@dit.sn', 'hashed_pwd_72', 'personnel'),
  ('Hountondji', 'Eric', 'eric73@dit.sn', 'hashed_pwd_73', 'etudiant'),
  ('Tchekpo', 'Monique', 'monique74@dit.sn', 'hashed_pwd_74', 'etudiant'),
  ('Sossa', 'Romuald', 'romuald75@dit.sn', 'hashed_pwd_75', 'professeur'),
  ('Adomou', 'Jennifer', 'jennifer76@dit.sn', 'hashed_pwd_76', 'personnel'),
  ('Tchanou', 'Pascal', 'pascal77@dit.sn', 'hashed_pwd_77', 'etudiant'),
  ('Biaou', 'Jessica', 'jessica78@dit.sn', 'hashed_pwd_78', 'etudiant'),
  ('Houeto', 'Firmin', 'firmin79@dit.sn', 'hashed_pwd_79', 'professeur'),
  ('Hounkpati', 'Aurelie', 'aurelie80@dit.sn', 'hashed_pwd_80', 'personnel'),
  ('Dandjinou', 'Michel', 'michel81@dit.sn', 'hashed_pwd_81', 'etudiant'),
  ('Kassa', 'Prudence', 'prudence82@dit.sn', 'hashed_pwd_82', 'etudiant'),
  ('Vodouhe', 'Thierry', 'thierry83@dit.sn', 'hashed_pwd_83', 'professeur'),
  ('Ahouangonou', 'Sophie', 'sophie84@dit.sn', 'hashed_pwd_84', 'personnel'),
  ('Hounye', 'Joel', 'joel85@dit.sn', 'hashed_pwd_85', 'etudiant'),
  ('Aholoukpè', 'Estelle', 'estelle86@dit.sn', 'hashed_pwd_86', 'etudiant'),
  ('Gnonlonfin', 'Landry', 'landry87@dit.sn', 'hashed_pwd_87', 'professeur'),
  ('Kpodekon', 'Nadine', 'nadine88@dit.sn', 'hashed_pwd_88', 'personnel'),
  ('Adjibade', 'Boris', 'boris89@dit.sn', 'hashed_pwd_89', 'etudiant'),
  ('Dohou', 'Alice', 'alice90@dit.sn', 'hashed_pwd_90', 'etudiant'),
  ('Savi', 'Frederic', 'frederic91@dit.sn', 'hashed_pwd_91', 'professeur'),
  ('Boco', 'Micheline', 'micheline92@dit.sn', 'hashed_pwd_92', 'personnel'),
  ('Kouhounde', 'Raoul', 'raoul93@dit.sn', 'hashed_pwd_93', 'etudiant'),
  ('Glele', 'Patricia', 'patricia94@dit.sn', 'hashed_pwd_94', 'etudiant'),
  ('Adjevi', 'Simon', 'simon95@dit.sn', 'hashed_pwd_95', 'professeur'),
  ('Ayinla', 'Deborah', 'deborah96@dit.sn', 'hashed_pwd_96', 'personnel'),
  ('Kouton', 'Stephane', 'stephane97@dit.sn', 'hashed_pwd_97', 'etudiant'),
  ('Tovignan', 'Helena', 'helena98@dit.sn', 'hashed_pwd_98', 'etudiant'),
  ('Bodjrenou', 'Germain', 'germain99@dit.sn', 'hashed_pwd_99', 'professeur'),
  ('Dossa', 'Rachel', 'rachel100@dit.sn', 'hashed_pwd_100', 'personnel');

-- Compte administrateur
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, type_utilisateur) VALUES
  ('Admin', 'Système', 'admin@dit.sn', 'admin_placeholder', 'personnel');

-- Assignation automatique des model_id (u001, u002, ...)
DO $$
DECLARE
  r RECORD;
  n INT := 1;
BEGIN
  FOR r IN SELECT id FROM utilisateurs ORDER BY email LOOP
    UPDATE utilisateurs SET model_id = 'u' || LPAD(n::text, 3, '0') WHERE id = r.id;
    n := n + 1;
  END LOOP;
END $$;

-- Hachage bcrypt de tous les mots de passe (mot de passe par défaut : dit2026)
UPDATE utilisateurs
  SET mot_de_passe = crypt('dit2026', gen_salt('bf', 10))
  WHERE email != 'admin@dit.sn';

-- Mot de passe administrateur : admin2026
UPDATE utilisateurs
  SET mot_de_passe = crypt('admin2026', gen_salt('bf', 10))
  WHERE email = 'admin@dit.sn';

INSERT INTO livres (titre, auteur, isbn, categorie, annee_publication, nombre_exemplaires, exemplaires_disponibles) VALUES
('Intelligence Artificielle : une approche moderne', 'Russell & Norvig', '978-0134610993', 'IA', 2020, 3, 3),
('Deep Learning', 'Goodfellow, Bengio & Courville', '978-0262035613', 'Deep Learning', 2016, 2, 2),
('Clean Code', 'Robert C. Martin', '978-0132350884', 'Génie Logiciel', 2008, 4, 4),
('Docker en pratique', 'Ian Miell', '978-1617294808', 'DevOps', 2019, 2, 2),
('Designing Data-Intensive Applications', 'Martin Kleppmann', '978-1449373320', 'Data Engineering', 2017, 3, 3),
('Python pour la Data Science', 'Jake VanderPlas', '978-1491912058', 'Data Science', 2017, 4, 4),
('Hands-On Machine Learning', 'Aurélien Géron', '978-1098125974', 'Machine Learning', 2022, 5, 5),
('Pattern Recognition and Machine Learning', 'Christopher Bishop', '978-0387310732', 'Machine Learning', 2006, 2, 2),
('Machine Learning Yearning', 'Andrew Ng', '978-1999579500', 'Machine Learning', 2018, 3, 3),
('The Hundred-Page Machine Learning Book', 'Andriy Burkov', '978-1999579517', 'Machine Learning', 2019, 3, 3),
('Deep Learning with Python', 'François Chollet', '978-1617296864', 'Deep Learning', 2021, 4, 4),
('Neural Networks and Deep Learning', 'Michael Nielsen', '978-0990583508', 'Deep Learning', 2015, 2, 2),
('Grokking Deep Learning', 'Andrew Trask', '978-1617293702', 'Deep Learning', 2019, 3, 3),
('Deep Reinforcement Learning Hands-On', 'Maxim Lapan', '978-1838826994', 'Deep Learning', 2020, 2, 2),
('Natural Language Processing with Transformers', 'Lewis Tunstall et al.', '978-1098103248', 'IA', 2022, 3, 3),
('Data Science from Scratch', 'Joel Grus', '978-1492041139', 'Data Science', 2019, 4, 4),
('Python Data Science Handbook', 'Jake VanderPlas', '978-1491912051', 'Data Science', 2016, 3, 3),
('R for Data Science', 'Hadley Wickham', '978-1492097402', 'Data Science', 2023, 2, 2),
('Practical Statistics for Data Scientists', 'Peter Bruce', '978-1492072942', 'Data Science', 2020, 3, 3),
('Introduction to Statistical Learning', 'Gareth James et al.', '978-1071614174', 'Data Science', 2021, 4, 4),
('Data Analytics Made Accessible', 'Anil Maheshwari', '978-1546224467', 'Data Analyste', 2018, 3, 3),
('Storytelling with Data', 'Cole Nussbaumer Knaflic', '978-1119002253', 'Data Analyste', 2015, 4, 4),
('Data Analysis with Python', 'Wes McKinney', '978-1098104030', 'Data Analyste', 2022, 3, 3),
('SQL for Data Analysis', 'Cathy Tanimura', '978-1492088783', 'Data Analyste', 2021, 3, 3),
('Excel Data Analysis', 'Michael Alexander', '978-1119844426', 'Data Analyste', 2022, 2, 2),
('Fundamentals of Data Engineering', 'Joe Reis & Matt Housley', '978-1098108304', 'Data Engineering', 2022, 4, 4),
('Streaming Systems', 'Tyler Akidau et al.', '978-1491983874', 'Data Engineering', 2018, 2, 2),
('Kafka: The Definitive Guide', 'Neha Narkhede et al.', '978-1491936160', 'Data Engineering', 2017, 3, 3),
('Spark: The Definitive Guide', 'Bill Chambers & Matei Zaharia', '978-1491912218', 'Data Engineering', 2018, 3, 3),
('Learning Spark', 'Jules Damji et al.', '978-1492050049', 'Data Engineering', 2020, 3, 3),
('Internet of Things: Principles and Paradigms', 'Rajkumar Buyya', '978-0128053959', 'IoT', 2016, 3, 3),
('IoT Fundamentals', 'David Hanes et al.', '978-1587144561', 'IoT', 2017, 3, 3),
('Designing Connected Products', 'Claire Rowland et al.', '978-1449372569', 'IoT', 2015, 2, 2),
('Building the Internet of Things', 'Maciej Kranz', '978-1119285663', 'IoT', 2016, 3, 3),
('Practical Internet of Things Security', 'Brian Russell', '978-1788625821', 'IoT', 2018, 2, 2),
('Introduction to Robotics', 'John J. Craig', '978-0133489798', 'Robotique', 2017, 3, 3),
('Robotics, Vision and Control', 'Peter Corke', '978-3319544120', 'Robotique', 2017, 2, 2),
('Probabilistic Robotics', 'Thrun, Burgard & Fox', '978-0262201629', 'Robotique', 2005, 2, 2),
('Modern Robotics', 'Lynch & Park', '978-1107156302', 'Robotique', 2017, 3, 3),
('Robot Operating System Basics', 'Anis Koubaa', '978-3319260525', 'Robotique', 2016, 2, 2),

('Artificial Intelligence with Python', 'Prateek Joshi', '978-1786464392', 'IA', 2017, 3, 3),
('Applied Artificial Intelligence', 'Mariya Yao', '978-0998289021', 'IA', 2018, 3, 3),
('Human Compatible', 'Stuart Russell', '978-0525558613', 'IA', 2019, 2, 2),
('Artificial Intelligence Basics', 'Tom Taulli', '978-1484250273', 'IA', 2019, 4, 4),
('AI Superpowers', 'Kai-Fu Lee', '978-1328546395', 'IA', 2018, 2, 2),

('Computer Vision: Algorithms and Applications', 'Richard Szeliski', '978-1848829343', 'Vision par Ordinateur', 2010, 3, 3),
('Programming Computer Vision with Python', 'Jan Erik Solem', '978-1449316549', 'Vision par Ordinateur', 2012, 2, 2),
('Deep Learning for Computer Vision', 'Rajalingappaa Shanmugamani', '978-1788295628', 'Vision par Ordinateur', 2018, 3, 3),
('Learning OpenCV 4', 'Adrian Kaehler', '978-1491937990', 'Vision par Ordinateur', 2020, 3, 3),
('Computer Vision with Python', 'Joseph Howse', '978-1789537147', 'Vision par Ordinateur', 2019, 2, 2),
('Natural Language Processing with Python', 'Steven Bird et al.', '978-0596516499', 'NLP', 2009, 3, 3),
('Speech and Language Processing', 'Jurafsky & Martin', '978-0131873216', 'NLP', 2023, 2, 2),
('Practical Natural Language Processing', 'Sowmya Vajjala et al.', '978-1492054054', 'NLP', 2020, 3, 3),
('Transformers for Natural Language Processing', 'Denis Rothman', '978-1800565791', 'NLP', 2021, 3, 3),
('NLP in Action', 'Hobson Lane et al.', '978-1617294631', 'NLP', 2019, 2, 2),
('Python Crash Course', 'Eric Matthes', '978-1718502703', 'Programmation', 2023, 5, 5),
('Automate the Boring Stuff with Python', 'Al Sweigart', '978-1593279929', 'Programmation', 2019, 4, 4),
('Fluent Python', 'Luciano Ramalho', '978-1492056355', 'Programmation', 2022, 3, 3),
('Effective Python', 'Brett Slatkin', '978-0134853987', 'Programmation', 2019, 3, 3),
('Think Python', 'Allen B. Downey', '978-1491939369', 'Programmation', 2015, 4, 4),
('Introduction to Algorithms', 'Cormen et al.', '978-0262046305', 'Algorithmique', 2022, 3, 3),
('Algorithm Design Manual', 'Steven Skiena', '978-3030542559', 'Algorithmique', 2020, 2, 2),
('Grokking Algorithms', 'Aditya Bhargava', '978-1617292231', 'Algorithmique', 2016, 4, 4),
('Algorithms', 'Robert Sedgewick', '978-0321573513', 'Algorithmique', 2011, 3, 3),
('Data Structures and Algorithms in Python', 'Goodrich et al.', '978-1118290279', 'Algorithmique', 2013, 2, 2),
('Computer Networking: A Top-Down Approach', 'Kurose & Ross', '978-0136681557', 'Réseaux', 2021, 3, 3),
('Networking All-in-One', 'Doug Lowe', '978-1119689010', 'Réseaux', 2021, 2, 2),
('TCP/IP Illustrated', 'W. Richard Stevens', '978-0321336316', 'Réseaux', 2011, 2, 2),
('Network Programmability and Automation', 'Jason Edelman', '978-1491931257', 'Réseaux', 2018, 3, 3),
('Computer Networks', 'Andrew Tanenbaum', '978-0132126953', 'Réseaux', 2010, 3, 3),
('Database System Concepts', 'Silberschatz et al.', '978-0078022159', 'Bases de Données', 2019, 3, 3),
('SQL Performance Explained', 'Markus Winand', '978-3950307825', 'Bases de Données', 2012, 2, 2),
('Seven Databases in Seven Weeks', 'Eric Redmond', '978-1680502534', 'Bases de Données', 2018, 3, 3),
('Designing Data-Intensive Applications', 'Martin Kleppmann', '978-1449373321', 'Bases de Données', 2017, 4, 4),
('MongoDB: The Definitive Guide', 'Shannon Bradshaw', '978-1491954461', 'Bases de Données', 2019, 3, 3),
('Kubernetes in Action', 'Marko Luksa', '978-1617293726', 'DevOps', 2018, 3, 3),
('Docker Deep Dive', 'Nigel Poulton', '978-1521822807', 'DevOps', 2023, 3, 3),
('Terraform Up and Running', 'Yevgeniy Brikman', '978-1098116743', 'DevOps', 2022, 2, 2),
('The DevOps Handbook', 'Gene Kim et al.', '978-1950508402', 'DevOps', 2021, 3, 3),
('Site Reliability Engineering', 'Betsy Beyer et al.', '978-1491929124', 'DevOps', 2016, 2, 2),
('Cybersecurity Essentials', 'Charles Brooks', '978-1119362393', 'Cybersécurité', 2018, 3, 3),
('Hacking: The Art of Exploitation', 'Jon Erickson', '978-1593271442', 'Cybersécurité', 2008, 2, 2),
('Web Application Security', 'Andrew Hoffman', '978-1492053118', 'Cybersécurité', 2020, 3, 3),
('Practical Malware Analysis', 'Michael Sikorski', '978-1593272906', 'Cybersécurité', 2012, 2, 2),
('Cryptography Engineering', 'Ferguson, Schneier & Kohno', '978-0470474242', 'Cybersécurité', 2010, 2, 2),
('Software Engineering', 'Ian Sommerville', '978-0137035151', 'Génie Logiciel', 2015, 3, 3),
('Code Complete', 'Steve McConnell', '978-0735619678', 'Génie Logiciel', 2004, 2, 2),
('Refactoring', 'Martin Fowler', '978-0134757599', 'Génie Logiciel', 2018, 3, 3),
('The Pragmatic Programmer', 'Hunt & Thomas', '978-0135957059', 'Génie Logiciel', 2019, 3, 3),
('Clean Architecture', 'Robert C. Martin', '978-0134494166', 'Génie Logiciel', 2017, 3, 3),
('Big Data: Principles and Best Practices', 'Nathan Marz', '978-1617290343', 'Big Data', 2015, 3, 3),
('Hadoop: The Definitive Guide', 'Tom White', '978-1491901632', 'Big Data', 2015, 2, 2),
('Data Pipelines with Apache Airflow', 'Bas Harenslak', '978-1617296901', 'Data Engineering', 2021, 3, 3),
('The Data Warehouse Toolkit', 'Kimball & Ross', '978-1118530801', 'Data Engineering', 2013, 2, 2),
('Modern Data Engineering with Apache Spark', 'Scott Haines', '978-1484274517', 'Data Engineering', 2022, 3, 3),
('Applied Machine Learning', 'Kelleher, Namee & DArcy', '978-0262029445', 'Machine Learning', 2015, 3, 3),
('Interpretable Machine Learning', 'Christoph Molnar', '978-0244768522', 'Machine Learning', 2022, 2, 2),
('Feature Engineering for Machine Learning', 'Alice Zheng', '978-1491953242', 'Machine Learning', 2018, 3, 3),
('Machine Learning Design Patterns', 'Lakshmanan et al.', '978-1098115784', 'Machine Learning', 2020, 3, 3),
('Bayesian Reasoning and Machine Learning', 'David Barber', '978-0521518147', 'Machine Learning', 2012, 2, 2),
('Reinforcement Learning', 'Sutton & Barto', '978-0262039246', 'IA', 2018, 3, 3),
('Artificial Intelligence for Robotics', 'Sebastian Thrun', '978-0987289306', 'Robotique', 2012, 2, 2),
('ROS Robotics Projects', 'Lentin Joseph', '978-1783554713', 'Robotique', 2017, 3, 3),
('Learning Robotics using Python', 'Lentin Joseph', '978-1788623315', 'Robotique', 2018, 3, 3),
('Mastering ROS for Robotics Programming', 'Lentin Joseph', '978-1788478953', 'Robotique', 2019, 2, 2),
('Arduino Cookbook', 'Michael Margolis', '978-1491903520', 'IoT', 2020, 3, 3),
('Programming Arduino', 'Simon Monk', '978-1260143245', 'IoT', 2016, 3, 3),
('Raspberry Pi Cookbook', 'Simon Monk', '978-1492043225', 'IoT', 2019, 3, 3),
('ESP32 Development using Arduino', 'Neil Cameron', '978-1484255254', 'IoT', 2021, 4, 4),
('IoT with Python and Raspberry Pi', 'Maneesh Rao', '978-1789134802', 'IoT', 2018, 3, 3),
('Power BI Data Analysis', 'Daniil Maslyuk', '978-1617297741', 'Data Analyste', 2021, 3, 3),
('Analyzing Data with Power BI', 'Brett Powell', '978-1788290142', 'Data Analyste', 2018, 2, 2),
('Tableau Your Data!', 'Daniel Murray', '978-1119001195', 'Data Analyste', 2016, 3, 3),
('Data Visualization with Python and JavaScript', 'Kyran Dale', '978-1491920510', 'Data Analyste', 2016, 2, 2),
('Fundamentals of Data Visualization', 'Claus Wilke', '978-1492031086', 'Data Analyste', 2019, 3, 3),
('Mathematics for Machine Learning', 'Deisenroth, Faisal & Ong', '978-1108455145', 'Machine Learning', 2020, 3, 3),
('Linear Algebra and Learning from Data', 'Gilbert Strang', '978-0692196380', 'Machine Learning', 2019, 2, 2),
('Probabilistic Machine Learning', 'Kevin Murphy', '978-0262046824', 'Machine Learning', 2022, 3, 3),
('Information Theory, Inference, and Learning Algorithms', 'David MacKay', '978-0521642989', 'Machine Learning', 2003, 2, 2),
('Statistical Learning with Sparsity', 'Hastie, Tibshirani & Wainwright', '978-1498712163', 'Machine Learning', 2015, 2, 2),
('Cloud Native DevOps with Kubernetes', 'John Arundel', '978-1492040767', 'DevOps', 2019, 3, 3),
('Kubernetes Patterns', 'Bilgin Ibryam', '978-1492050285', 'DevOps', 2019, 2, 2),
('Docker in Action', 'Jeff Nickoloff', '978-1617294761', 'DevOps', 2019, 3, 3),
('Infrastructure as Code', 'Kief Morris', '978-1098114671', 'DevOps', 2020, 2, 2),
('Continuous Delivery', 'Jez Humble', '978-0321601919', 'DevOps', 2010, 2, 2),
('Learning SQL', 'Alan Beaulieu', '978-1492057611', 'Bases de Données', 2020, 4, 4),
('SQL Cookbook', 'Anthony Molinaro', '978-1492077442', 'Bases de Données', 2020, 3, 3),
('PostgreSQL Up and Running', 'Regina Obe', '978-1491963418', 'Bases de Données', 2017, 3, 3),
('MySQL Cookbook', 'Paul DuBois', '978-1492093169', 'Bases de Données', 2022, 2, 2),
('Database Internals', 'Alex Petrov', '978-1492040347', 'Bases de Données', 2019, 2, 2),
('Cloud Computing Concepts', 'Thomas Erl', '978-0133387520', 'Cloud Computing', 2013, 3, 3),
('AWS Certified Solutions Architect Guide', 'Ben Piper', '978-1119819474', 'Cloud Computing', 2022, 3, 3),
('Google Cloud Platform in Action', 'JJ Geewax', '978-1617293528', 'Cloud Computing', 2018, 2, 2),
('Microsoft Azure Fundamentals', 'Jim Cheshire', '978-0136877189', 'Cloud Computing', 2021, 3, 3),
('Cloud Native Patterns', 'Cornelia Davis', '978-1617294297', 'Cloud Computing', 2019, 2, 2),
('Learning TensorFlow', 'Tom Hope', '978-1491978511', 'Deep Learning', 2017, 3, 3),
('TensorFlow in Practice', 'Paolo Galeone', '978-1789615555', 'Deep Learning', 2019, 2, 2),
('PyTorch Deep Learning', 'Eli Stevens', '978-1788834131', 'Deep Learning', 2020, 3, 3),
('Deep Learning with PyTorch', 'Eli Stevens et al.', '978-1617295263', 'Deep Learning', 2020, 3, 3),
('Generative Deep Learning', 'David Foster', '978-1098134181', 'Deep Learning', 2023, 3, 3),
('MLOps Engineering at Scale', 'Carl Osipov', '978-1617297765', 'MLOps', 2022, 3, 3),
('Introducing MLOps', 'Mark Treveil et al.', '978-1492083290', 'MLOps', 2020, 3, 3),
('Designing Machine Learning Systems', 'Chip Huyen', '978-1098107963', 'MLOps', 2022, 4, 4),
('Machine Learning Engineering', 'Andriy Burkov', '978-1999579579', 'MLOps', 2020, 3, 3),
('Practical MLOps', 'Noah Gift & Alfredo Deza', '978-1098103019', 'MLOps', 2021, 3, 3),
('Data Mining: Concepts and Techniques', 'Han, Kamber & Pei', '978-0123814791', 'Data Science', 2011, 2, 2),
('Mining of Massive Datasets', 'Leskovec, Rajaraman & Ullman', '978-1108476348', 'Big Data', 2020, 3, 3),
('The Elements of Statistical Learning', 'Hastie, Tibshirani & Friedman', '978-0387848570', 'Data Science', 2009, 2, 2),
('Doing Data Science', 'Cathy ONeil & Rachel Schutt', '978-1449358655', 'Data Science', 2013, 3, 3),
('Build a Career in Data Science', 'Emily Robinson', '978-1617296246', 'Data Science', 2020, 3, 3);

INSERT INTO notes (utilisateur_id, livre_id, note)
SELECT u.id, l.id, ROUND((RANDOM() * 3 + 2)::numeric, 1)
FROM utilisateurs u
CROSS JOIN livres l
WHERE RANDOM() > 0.3;
