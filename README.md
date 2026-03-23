# ISO 27005:2022 — Quiz & Révisions

Outil d'entraînement statique pour la gestion des risques de sécurité de l'information.

## Lancer en local

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Puis ouvrir : http://localhost:8080

> ⚠️ Ne pas ouvrir `index.html` directement dans le navigateur (le `fetch` du JSON sera bloqué par les restrictions CORS).

## Déployer sur GitHub Pages

1. Créer un repo GitHub public
2. Pousser tous les fichiers
3. Settings → Pages → Source : `main` branch, `/ (root)`
4. L'outil sera disponible sur `https://[username].github.io/[repo]/`

## Ajouter des questions

### Option 1 — Éditer directement `questions.json`

Respecter le format :

```json
{
  "id": "Q036",
  "type": "mcq",
  "theme": "traitement",
  "subtheme": "options-traitement",
  "difficulty": 2,
  "source": "ISO 27005:2022, §10",
  "question": "Votre question ici ?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0,
  "explanation": "Explication détaillée de la bonne réponse."
}
```

### Option 2 — Éditer le CSV puis convertir

1. Ouvrir `questions-source.csv` dans Excel ou Google Sheets
2. Ajouter des lignes
3. Convertir en JSON sur https://csvjson.com/csv2json
4. Remplacer le contenu de `questions.json`

### Types disponibles

| type | Description | options | answer |
|------|-------------|---------|--------|
| `mcq` | QCM (2 à 4 options) | `["A","B","C","D"]` | index (0-3) |
| `true_false` | Vrai ou Faux | `["Vrai","Faux"]` | `0` ou `1` |
| `flashcard` | Recto/Verso | `[]` | `null` |

### Thèmes disponibles

| slug | Libellé |
|------|---------|
| `fondamentaux` | Fondamentaux & normes |
| `definitions` | Terminologie clé |
| `composantes-risque` | Composantes du risque |
| `contexte` | Contexte |
| `identification` | Identification des risques |
| `estimation` | Estimation |
| `evaluation` | Évaluation |
| `traitement` | Traitement des risques |
| `acceptation` | Acceptation du risque |
| `communication` | Communication & concertation |
| `surveillance` | Surveillance & revue |
| `smsi` | Alignement SMSI / 27001 |
| `examen` | Simulation d'examen |

Pour ajouter un nouveau thème : utiliser un nouveau slug, la carte apparaît automatiquement sur l'accueil.

## Réinitialiser la progression

Depuis la console du navigateur (F12) :

```javascript
clearErrors()   // efface les erreurs enregistrées
clearAll()      // efface toute la progression (scores + erreurs)
```

## Structure du projet

```
iso27005-quiz/
├── index.html          — Structure HTML (4 écrans)
├── style.css           — Design mobile-first, zéro dépendance
├── app.js              — Moteur de quiz, localStorage
├── questions.json      — Base de questions (source de vérité)
├── questions-source.csv — Version CSV pour édition en tableur
└── README.md
```
