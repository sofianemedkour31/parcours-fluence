# Ma semaine de lecture — ULIS

Version dédiée au travail de fluence sur **un même texte pour tous les élèves**, conservé pendant la semaine. L’habillage console, Albert et les cinq activités sont conservés.

- [Site élève](https://parcours-fluence.vercel.app/)
- [Studio enseignant](https://parcours-fluence.vercel.app/#/studio)

## Utiliser la version ULIS

1. Ouvrez `/#/studio`. Le bandeau indique le texte commun choisi.
2. Choisissez l’un des cinq onglets **Période 1** à **Période 5**, puis cliquez sur **+ Nouveau texte de la semaine** et collez le texte travaillé dans le dispositif. Le texte est ajouté dans la période sélectionnée. Vous pouvez aussi utiliser un texte déjà présent ; le menu **Période du texte** permet de le ranger ailleurs.
3. Préparez les cinq activités avec Albert, relisez-les et cliquez sur **Valider ce texte**.
4. Cliquez sur **Utiliser cette semaine**. Ce choix unique remplace le texte de la semaine précédent sans supprimer les textes de la réserve.
5. Publiez, ou exportez `parcours.json` pour le déposer dans `public/contenu/`.

L’accueil élève présente directement les cinq activités du texte commun, avec **Lire et relire** mis en avant. Tant qu’aucun texte n’est choisi et validé, il affiche un message d’attente. Les autres textes, même validés, restent réservés au studio ; ils ne sont pas proposés dans la navigation élève. Le fichier JSON public contient toujours la réserve : ce filtrage ne constitue pas un contrôle d’accès à des données confidentielles.

**Mes aides de lecture** regroupe la vitesse, la taille, les groupes de souffle, le suivi d’une ligne et l’espacement des mots. La taille, l’espacement et les modes d’aide sont conservés dans l’onglet pendant la session, sans profil élève. Le modèle audio reste disponible. La durée affichée est celle du guide ; elle ne mesure pas les mots correctement lus par l’élève.

Le choix est enregistré à la racine du contenu sous `texteSemaine: { parcoursId, texteId }` (ou `null` avant sélection). Si ce texte repasse en brouillon, la publication est bloquée jusqu’à sa nouvelle validation. Les brouillons ULIS utilisent leurs propres clés de stockage, distinctes de celles du projet d’origine.

Cette copie utilise le dépôt [parcours-fluence](https://github.com/sofianemedkour31/parcours-fluence). Sur son projet Vercel distinct, configurez `GITHUB_REPO=sofianemedkour31/parcours-fluence` et un `GITHUB_TOKEN` autorisé sur **ce** dépôt. L’API refuse toute publication vers un autre dépôt, même si une ancienne configuration est réutilisée par erreur. Le dépôt et le déploiement du projet d’origine sont indépendants. Les modifications des variables d’environnement Vercel nécessitent un nouveau déploiement.

## Fonctionnement conservé

Application de lecture au look de console rétro. Le studio organise les textes dans les **cinq périodes de l’année scolaire**, avec cinq activités par texte :

| Activité | Ce que fait l'élève |
|---|---|
| **Lire** | Lecture au prompteur : progression mot à mot ou par groupes de souffle préparés par Albert. Vitesse réglable, mode « ligne », modèle lu à voix haute, chronomètre. |
| **Dictée** | Il écoute un mot (normalement, lentement ou dans une phrase), puis l'écrit. Au 1er essai faux, il voit les lettres bien placées. Au 2e, le mot est montré et il le recopie. |
| **Comprendre** | Questions à 3 choix, lues à voix haute sur demande. Après une erreur, il reçoit un indice et peut relire le texte avec le passage utile surligné. |
| **Mots mêlés** | Grille générée à partir des mots choisis. Il glisse le doigt sur un mot, ou touche la première puis la dernière lettre. Un mode agrandi permet de zoomer, avec la liste des mots toujours affichée. |
| **Labyrinthe de lecture (MAZE)** | L’élève choisit le mot qui convient parmi trois propositions, dans le texte ou dans de petites phrases à trou selon le support. |

Navigation élève : texte de la semaine → activité. Le bouton **Retour**, la touche Échap et le bouton retour d’Android permettent de revenir aux activités du texte commun.
Aucune donnée élève n'est enregistrée.

## Studio enseignant : `/#/studio`

1. Entrez le **code studio** (variable `STUDIO_CODE`).
2. Choisissez une période et un texte déjà présent. Le titre et le passage sont prêts ; vous pouvez aussi ajouter vos propres textes avec **+ Texte**.
3. Cliquez sur **Préparer les activités avec Albert**. Mistral Small choisit les mots de dictée, les mots mêlés, la vitesse et les groupes de souffle ; Gemma rédige les questions de compréhension et les distracteurs MAZE. Les deux appels sont effectués en parallèle, puis l'application vérifie et réunit leurs réponses. Un mot absent du texte est retiré et signalé.
4. Relisez et corrigez dans les cartes. Vous pouvez aussi désactiver une activité.
5. Cliquez sur **Valider ce texte**. Le studio vérifie les réponses et la grille ; toute modification ultérieure du texte ou de ses activités le repasse en brouillon.
6. Cliquez sur **Utiliser cette semaine**, puis sur **Publier pour les élèves**. Seul le texte commun choisi et validé devient visible dans le mode élève. Si la publication n'est pas configurée, utilisez **Exporter le fichier** (voir plus bas).

Les réglages des activités de chaque période (niveau, nombre de mots et de questions, sens de la grille, vitesse) servent à Albert. Le bouton « Préparer avec Albert les N textes sans activités » traite les textes de la période sélectionnée.
Les textes de l’ancienne réserve restent disponibles et peuvent être déplacés vers la période souhaitée. Les anciens brouillons sont automatiquement adaptés aux cinq périodes, sans effacer leurs textes, leurs activités ou le choix du texte de la semaine. Le travail en cours est gardé dans le navigateur de l’ordinateur enseignant. Une publication conserve aussi les textes sans activités dans le fichier de contenu ; le mode élève n’affiche que le texte de la semaine choisi et validé.

## Console Lecto Color

L’habillage reprend la console portable du dossier `mise-a-jour` : écran de démarrage, boutons **START**, **A**, **B**, croix directionnelle, chouette en pixels, cartouches et chargement animé. **START** ouvre le texte de la semaine ; **B** revient en arrière ; **A** active le bouton sélectionné. Les flèches déplacent le focus, et la navigation au clavier et au toucher reste disponible.

Les cinq activités donnent des pièces et des étoiles pendant la séance. Chaque entraînement complet au guide de lecture donne une étoile supplémentaire, jusqu’à trois, pour encourager la relecture. Ces récompenses décrivent la participation à l’application, sans mesurer la fluence réelle. Elles restent en mémoire et repartent à zéro au rechargement de la page, sans compte ni profil élève. Le réglage système de réduction des animations est respecté.

Le nouveau design utilise `src/retro.css`, `src/sprites.js` et `src/jeu.js`. Les aides de lecture, les groupes de souffle, le labyrinthe, le zoom des mots mêlés et les cinq périodes du studio sont conservés. Les anciennes fonctions de la version de référence (quatre mondes et quatre activités) ne remplacent pas cette organisation.

## Mise en ligne sur Vercel

1. Créez un dépôt GitHub avec ce dossier, puis importez-le dans Vercel. Le préréglage **Vite** est détecté automatiquement.
2. Dans **Settings → Environment Variables**, ajoutez :

| Variable | Rôle |
|---|---|
| `ALBERT_API_KEY` | Votre clé Albert (DINUM). Elle reste côté serveur. |
| `STUDIO_CODE` | Le code à saisir pour utiliser le studio. Il protège votre quota Albert. |
| `ALBERT_MODEL` | Modèle principal pour la dictée, les mots mêlés et la vitesse. Recommandé : `mistral-small-3-2-24b-instruct-2506`. Si vide, un modèle de génération disponible est choisi. |
| `ALBERT_COMPREHENSION_MODEL` | Modèle pour les questions de compréhension et les distracteurs MAZE. Recommandé : `gemma-4-31b-it`. Si vide, le modèle principal est utilisé. |
| `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` | Facultatif : active le bouton **Publier**. |

3. Redéployez.

**Bouton Publier.** Créez un jeton GitHub *fine-grained* limité à ce dépôt, avec le droit *Contents : Read and write*. Indiquez `GITHUB_REPO` sous la forme `proprietaire/nom`. Le bouton écrit alors `public/contenu/parcours.json` dans le dépôt, et Vercel redéploie seul en 1 à 2 minutes.

**Sans bouton Publier.** Cliquez sur **Exporter le fichier**, remplacez `public/contenu/parcours.json` dans le dépôt par le fichier téléchargé, puis poussez la modification.

## Tester sur votre ordinateur

Il suffit d'avoir Node.js 18 ou plus récent :

```bash
node scripts/serveur-local.mjs
```

Ouvrez ensuite http://localhost:5174. Créez un fichier `.env` sur le modèle de `.env.example`. Avec `ALBERT_MOCK=1`, Albert est simulé, ce qui permet de tester le studio sans clé.
Ce serveur écoute uniquement sur votre ordinateur et ne sert ni `.env`, ni les scripts, ni les fonctions API comme fichiers statiques.
`npm run dev` (Vite) affiche l'application, mais pas les fonctions `/api`. Pour avoir les deux, utilisez `vercel dev` ou le serveur ci-dessus.

Pour ouvrir directement le bon mode avec Python (sans dépendance Python supplémentaire) :

```bash
python lancer.py studio
python lancer.py eleve
```

Le mode studio est choisi par défaut avec `python lancer.py`. Le script ouvre le navigateur et garde le serveur actif jusqu'à `Ctrl+C`. Si le serveur est déjà lancé, il ouvre simplement la page choisie.

## Structure

```
api/albert.js            relais vers Albert (clé côté serveur, contrôle du code studio)
api/_lib/generation.js   prompt envoyé à Albert + vérification de sa réponse
api/publier.js           écriture de parcours.json dans GitHub
api/statut.js            vérification du code studio
public/contenu/parcours.json   tout le contenu (périodes, textes, activités)
src/main.js              navigation élève
src/activites/           lecture, dictée, compréhension, mots mêlés
src/studio/              studio enseignant
src/lib/                 traitement du texte, génération de la grille
```

## Format du contenu

```json
{
  "parcours": [{
    "id": 1, "nom": "Période 1", "couleur": "vert",
    "reglages": { "niveau": "CP", "nbMotsDictee": 6, "nbQuestions": 4, "nbMotsMeles": 6, "directions": "simple", "vitesse": 45 },
    "textes": [{
      "id": "…", "titre": "…", "texte": "…", "valide": true,
      "activites": {
        "lecture": { "actif": true, "vitesse": 45, "groupes": ["Le matin,", "Pilou dort", "sur le lit."] },
        "dictee": { "actif": true, "mots": [{ "mot": "chat", "phrase": "Léo a un petit chat gris." }] },
        "comprehension": { "actif": true, "questions": [{ "question": "…", "choix": ["juste", "faux", "faux"], "bonne": 0, "indice": "…", "extrait": "…" }] },
        "motsMeles": { "actif": true, "mots": ["chat", "pelote"], "directions": "simple" },
        "maze": { "actif": true, "trous": [{ "index": 6, "choix": ["dort", "court", "chante"], "bonne": 0 }] }
      }
    }]
  }]
}
```

La clé JSON `parcours` et les identifiants existants sont conservés pour que les anciens fichiers et liens restent utilisables ; l’interface présente uniquement des périodes. La réserve issue des livrets conserve ses textes, ses listes de syllabes et ses activités. Le rangement dans les périodes est modifiable depuis le studio.

Pour les phrases à trou, `maze` utilise `mode: "phrases"` et un tableau `phrases` d'objets `{ "phrase": "La ___ tourne.", "choix": ["roue", "lune", "jupe"], "bonne": 0 }`. Les trois choix doivent figurer dans le support ; le premier est la bonne réponse avant le mélange affiché à l'élève.
