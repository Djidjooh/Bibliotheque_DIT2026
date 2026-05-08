pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'bibliotheque_dit'
        DOCKER_BUILDKIT       = '1'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log --oneline -5'
            }
        }

        stage('Lint & Validate') {
            parallel {
                stage('Docker Compose Validate') {
                    steps {
                        sh 'docker compose config --quiet'
                    }
                }
                stage('Python Syntax') {
                    steps {
                        sh '''
                            python3 -m py_compile service-recommandation/main.py
                            python3 -m py_compile service-recommandation/api/routes.py
                            python3 -m py_compile service-recommandation/api/schemas.py
                            python3 -m py_compile service-recommandation/ml/recommender.py
                            python3 -m py_compile service-recommandation/ml/loader.py
                            echo "Python syntax OK"
                        '''
                    }
                }
                stage('Node.js Syntax') {
                    steps {
                        sh '''
                            node --check service-livres/src/app.js
                            node --check service-utilisateurs/src/app.js
                            node --check service-emprunts/src/app.js
                            echo "Node.js syntax OK"
                        '''
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                sh 'docker compose build --parallel'
            }
        }

        stage('Start Services') {
            steps {
                sh 'docker compose up -d'
                sh '''
                    echo "Attente readiness base de donnees..."
                    timeout 60 sh -c "until docker compose exec -T db pg_isready -U postgres; do sleep 2; done"
                    echo "Attente readiness services (30s)..."
                    sleep 30
                '''
            }
        }

        stage('Health Checks') {
            steps {
                sh '''
                    echo "=== Health checks ==="
                    curl -sf http://localhost:3001/health || (echo "FAIL service-livres" && exit 1)
                    echo "service-livres OK"
                    curl -sf http://localhost:3002/health || (echo "FAIL service-utilisateurs" && exit 1)
                    echo "service-utilisateurs OK"
                    curl -sf http://localhost:3003/health || (echo "FAIL service-emprunts" && exit 1)
                    echo "service-emprunts OK"
                    curl -sf http://localhost:3004/health || (echo "FAIL service-recommandation" && exit 1)
                    echo "service-recommandation OK"
                '''
            }
        }

        stage('Integration Tests') {
            steps {
                sh '''
                    echo "=== Test: catalogue livres ==="
                    curl -sf http://localhost:3001/api/livres | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert 'livres' in data, 'Champ livres manquant'
assert len(data['livres']) > 0, 'Catalogue vide'
print(f\"OK - {len(data[\'livres\'])} livres trouves\")
"

                    echo "=== Test: statistiques emprunts ==="
                    curl -sf http://localhost:3003/api/emprunts/stats | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert 'total' in data, 'Champ total manquant'
print(f\"OK - {data[\'total\']} emprunt(s) total\")
"

                    echo "=== Test: info modele recommandation ==="
                    STATUS=$(curl -so /dev/null -w "%{http_code}" http://localhost:3004/api/model/info)
                    if [ "$STATUS" = "200" ]; then
                        echo "OK - modele charge"
                    else
                        echo "WARN - modele non charge (status $STATUS) - normal si premier demarrage"
                    fi

                    echo "=== Test: creation utilisateur ==="
                    RESULT=$(curl -sf -X POST http://localhost:3002/api/auth/register \
                        -H "Content-Type: application/json" \
                        -d "{\"nom\":\"Test\",\"prenom\":\"CI\",\"email\":\"ci_test_$$@dit.sn\",\"mot_de_passe\":\"password123\",\"type_utilisateur\":\"etudiant\"}")
                    echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert 'id' in data, 'ID absent de la reponse'
print(f\"OK - utilisateur cree: {data[\'email\']}\")
"

                    echo "=== Tous les tests passes ==="
                '''
            }
        }

        stage('DVC Pipeline Check') {
            steps {
                sh '''
                    if command -v dvc > /dev/null 2>&1; then
                        dvc status || echo "DVC: modifications detectees"
                        dvc metrics show || true
                    else
                        echo "DVC non installe sur cet agent, verification ignoree"
                    fi
                '''
            }
        }
    }

    post {
        always {
            sh 'docker compose logs --tail=50 || true'
            sh 'docker compose down -v || true'
        }
        success {
            echo 'Pipeline CI/CD termine avec succes - Bibliotheque DIT'
        }
        failure {
            echo 'ECHEC du pipeline - consultez les logs ci-dessus'
            sh 'docker compose logs || true'
        }
    }
}
