// Application élève : parcours → texte → activité, avec retour arrière à chaque étape.
import { el, vider, remplir, ajouter, iconePixel } from './ui.js';
import { jouer, basculerMuet, estMuet } from './sons.js';
import { dire, taire } from './voix.js';
import {
  chargerPourEleve, couleurDe, ACTIVITES, activitesDisponibles, modeApercu, CLE_APERCU,
} from './donnees.js';
import { monterLecture } from './activites/lecture.js';
import { monterDictee } from './activites/dictee.js';
import { monterComprehension } from './activites/comprehension.js';
import { monterMotsMeles } from './activites/motsmeles.js';
import { monterMaze } from './activites/maze.js';
import { trouverTexteSemaine } from './lib/semaine.js';

const MOTEURS = {
  lecture: monterLecture,
  dictee: monterDictee,
  comprehension: monterComprehension,
  motsMeles: monterMotsMeles,
  maze: monterMaze,
};

let contenu = null;
let nettoyage = null;
const racine = document.getElementById('app');
racine.textContent = '';

// ---------------------------------------------------------------------------
// Coque « console »
// ---------------------------------------------------------------------------
const boutonSon = el('button', {
  class: 'console-son',
  'aria-label': 'Activer ou couper les sons',
  onclick: () => { basculerMuet(); majBoutonSon(); jouer('choisir'); },
});
function majBoutonSon() {
  remplir(boutonSon, iconePixel(estMuet() ? 'muet' : 'son', { taille: 26, contour: 'currentColor', fond: 'currentColor' }));
  boutonSon.setAttribute('aria-pressed', String(estMuet()));
}

const boutonRetour = el('button', { class: 'btn-retour', onclick: () => retour() },
  iconePixel('retour', { taille: 20, contour: 'currentColor', fond: 'currentColor' }), el('span', {}, 'Retour'));
const filAriane = el('nav', { class: 'fil', 'aria-label': 'Où suis-je ?' });
const vue = el('main', { class: 'vue', tabindex: '-1' });
const bandeauApercu = el('div', { class: 'bandeau-apercu', hidden: true },
  'Aperçu enseignant : les textes non validés sont visibles. ',
  el('button', { onclick: () => { sessionStorage.removeItem(CLE_APERCU); location.hash = '#/studio'; } }, 'Revenir au studio'));

racine.append(
  el('div', { class: 'console' },
    el('div', { class: 'console-haut' },
      el('span', { class: 'led', 'aria-hidden': 'true' }),
      el('span', { class: 'marque' }, 'MA SEMAINE ', el('b', {}, 'DE LECTURE')),
      boutonSon),
    el('div', { class: 'ecran' },
      bandeauApercu,
      el('header', { class: 'barre' }, boutonRetour, filAriane),
      vue),
    el('div', { class: 'console-bas', 'aria-hidden': 'true' },
      el('span', { class: 'croix' }), el('span', { class: 'fentes' }, el('i'), el('i'), el('i')),
      el('span', { class: 'ab' }, el('i', {}, 'B'), el('i', {}, 'A')))),
);
majBoutonSon();

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function route() {
  const morceaux = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return morceaux;
}

function aller(chemin) { location.hash = `#/${chemin.map(encodeURIComponent).join('/')}`; }

function retour() {
  const r = route();
  jouer('retour');
  if (!modeApercu()) return aller([]);
  if (r[0] !== 'p') return aller([]);
  if (r.length >= 5) return aller(r.slice(0, 4));   // activité → choix des activités
  if (r.length >= 4) return aller(r.slice(0, 2));   // texte → liste des textes
  return aller([]);                                  // parcours → accueil
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.querySelector('.fenetre-fond')) retour();
});

async function afficher() {
  if (route()[0] === 'studio') {
    nettoyage?.(); nettoyage = null;
    const { monterStudio } = await import('./studio/studio.js');
    document.body.classList.add('mode-studio');
    remplir(racine, el('div', { id: 'studio' }));
    monterStudio(document.getElementById('studio'));
    return;
  }
  if (document.body.classList.contains('mode-studio')) { location.reload(); return; }

  taire();
  nettoyage?.();
  nettoyage = null;
  document.querySelectorAll('.fenetre-fond').forEach((f) => f.remove());
  bandeauApercu.hidden = !modeApercu();
  if (!contenu) {
    remplir(vue, el('p', { class: 'chargement' }, 'Chargement…'));
    try { contenu = await chargerPourEleve(); } catch (e) {
      remplir(vue, el('div', { class: 'erreur' }, 'Le contenu n\'a pas pu être chargé. ', e.message));
      return;
    }
  }
  const [, idP, , idT, act] = route();
  const r = route();
  vider(vue);
  vue.scrollTop = 0;

  if (r[0] !== 'p') return ecranAccueil();
  const parcours = contenu.parcours.find((p) => String(p.id) === idP);
  if (!parcours) return aller([]);
  const c = couleurDe(parcours);
  document.documentElement.style.setProperty('--p-fond', c.fond);
  document.documentElement.style.setProperty('--p-sombre', c.sombre);
  document.documentElement.style.setProperty('--p-clair', c.clair);

  if (!idT) return aller([]);
  const index = parcours.textes.findIndex((t) => t.id === idT);
  const texte = parcours.textes[index];
  if (!texte) return aller(['p', idP]);
  if (!act) return ecranActivites(parcours, texte, index);
  if (!MOTEURS[act] || !activitesDisponibles(texte)[act]) return aller(['p', idP, 't', idT]);
  ecranActivite(parcours, texte, index, act);
}

function majFil(elements) {
  vider(filAriane);
  boutonRetour.hidden = elements.length === 0;
  elements.forEach((e, i) => {
    if (i) filAriane.append(el('span', { class: 'fil-sep', 'aria-hidden': 'true' }, '›'));
    filAriane.append(el('span', { class: i === elements.length - 1 ? 'fil-ici' : '' }, e));
  });
}

// ---------------------------------------------------------------------------
// Écrans
// ---------------------------------------------------------------------------
function ecranAccueil() {
  majFil([]);
  const semaine = trouverTexteSemaine(contenu);
  if (semaine) {
    const c = couleurDe(semaine.parcours);
    document.documentElement.style.setProperty('--p-fond', c.fond);
    document.documentElement.style.setProperty('--p-sombre', c.sombre);
    document.documentElement.style.setProperty('--p-clair', c.clair);
    ecranActivites(semaine.parcours, semaine.texte, 0, true);
  } else {
    vue.append(el('div', { class: 'semaine-attente' },
      iconePixel('lecture', { taille: 84, contour: 'var(--or)', fond: '#5dbb63' }),
      el('h1', {}, 'Ma semaine de lecture'),
      el('p', {}, 'Ton texte arrive bientôt.'),
      el('p', {}, 'Ton enseignant prépare le texte et les activités de la semaine.'),
      boutonEcouter('Ton texte arrive bientôt. Ton enseignant prépare le texte et les activités de la semaine.')));
  }
  vue.append(
    el('footer', { class: 'semaine-pied' }, el('a', { href: '#/studio' }, 'Espace enseignant')),
  );
}

function ecranActivites(parcours, texte, index, accueil = false) {
  majFil(accueil ? [] : ['Notre texte', texte.titre]);
  const dispo = activitesDisponibles(texte);
  vue.append(
    el('div', { class: 'entete-ecran' },
      el('p', { class: 'surtitre' }, accueil ? 'Notre texte de la semaine' : 'Notre texte'),
      el('h1', {}, texte.titre),
      !texte.valide ? el('p', { class: 'alerte' }, 'Aperçu : ce texte est encore en brouillon.') : null,
      el('p', {}, 'Je retrouve le même texte toute la semaine.'),
      boutonEcouter(`${texte.titre}. Je retrouve le même texte toute la semaine. Je m’entraîne à lire et je choisis une activité.`)),
    el('div', { class: 'grille-activites grille-semaine' },
      ACTIVITES.map((a) => el('div', { class: `cartouche-wrap ${a.cle === 'lecture' ? 'fluence-prioritaire' : ''}` },
        el('button', {
          class: `cartouche cartouche-${a.cle}`,
          disabled: !dispo[a.cle],
          onclick: () => { jouer('choisir'); aller(['p', String(parcours.id), 't', texte.id, a.cle]); },
          onpointerenter: () => jouer('deplacer'),
        },
        a.cle === 'lecture' ? el('span', { class: 'etiquette-fluence' }, 'Fluence') : null,
        el('span', { class: 'cartouche-icone' }, iconePixel(a.cle, { taille: 64, contour: '#1b1626', fond: 'var(--fond-icone)', reflet: '#ffffffaa' })),
        el('span', { class: 'cartouche-nom' }, a.nom),
        el('span', { class: 'cartouche-aide' }, a.aide)),
        boutonEcouter(`${a.nom}. ${a.aide}`, 'petit')))),
  );
}

function ecranActivite(parcours, texte, index, act) {
  const a = ACTIVITES.find((x) => x.cle === act);
  majFil(['Notre texte', a.nom]);
  const zone = el('section', { class: `activite activite-${act}` });
  vue.append(zone);
  nettoyage = MOTEURS[act](zone, {
    texte,
    parcours,
    finir: () => aller(modeApercu() ? ['p', String(parcours.id), 't', texte.id] : []),
  });
}

function boutonEcouter(phrase, taille = '') {
  return el('button', {
    class: `btn-ecouter ${taille}`,
    'aria-label': `Écouter : ${phrase}`,
    onclick: (e) => { e.stopPropagation(); dire(phrase); },
  }, iconePixel('son', { taille: taille ? 18 : 22, contour: 'currentColor', fond: 'currentColor' }));
}

window.addEventListener('hashchange', afficher);
afficher();
