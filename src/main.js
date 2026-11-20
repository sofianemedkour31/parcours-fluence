// Console Lecto Color : un texte commun, cinq cartouches et des récompenses de séance.
import { el, vider, remplir, iconePixel } from './ui.js';
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
import { mascotte, etoile, piece } from './sprites.js';
import { surChangement, pieces, etoilesDe, etoilesTexte } from './jeu.js';

const MOTEURS = {
  lecture: monterLecture,
  dictee: monterDictee,
  comprehension: monterComprehension,
  motsMeles: monterMotsMeles,
  maze: monterMaze,
};

let contenu = null;
let nettoyage = null;
let demarre = false;
try { demarre = sessionStorage.getItem('ulis-demarre') === '1'; } catch { /* démarrage sans stockage */ }
const racine = document.getElementById('app');
racine.textContent = '';

// ---------------------------------------------------------------------------
// Coque « console »
// ---------------------------------------------------------------------------
const touche = (classe, etiquette, action, contenu = '') => el('button', {
  class: `touche-console ${classe}`, 'aria-label': etiquette, title: etiquette,
  onpointerdown: (e) => { e.preventDefault(); e.currentTarget.classList.add('enfonce'); },
  onpointerup: (e) => e.currentTarget.classList.remove('enfonce'),
  onpointerleave: (e) => e.currentTarget.classList.remove('enfonce'),
  onpointercancel: (e) => e.currentTarget.classList.remove('enfonce'),
  onclick: action,
}, contenu);
const boutonSon = touche('btn-select', 'Activer ou couper les sons', () => { basculerMuet(); majBoutonSon(); jouer('choisir'); });
function majBoutonSon() {
  boutonSon.classList.toggle('muet', estMuet());
  boutonSon.setAttribute('aria-pressed', String(estMuet()));
}

const boutonRetour = el('button', { class: 'hud-retour', onclick: () => retour(), 'aria-label': 'Retour au texte' },
  el('span', { class: 'pastille-b' }, 'B'), el('span', {}, 'Retour'));
const filAriane = el('nav', { class: 'hud-lieu', 'aria-label': 'Où suis-je ?' });
const hudPieces = el('span', { class: 'hud-compteur' });
const hudEtoiles = el('span', { class: 'hud-compteur' });
const vue = el('main', { class: 'vue', tabindex: '-1' });
const bandeauApercu = el('div', { class: 'bandeau-apercu', hidden: true },
  'Aperçu enseignant. ',
  el('button', { onclick: () => { sessionStorage.removeItem(CLE_APERCU); location.hash = '#/studio'; } }, 'Revenir au studio'));

const croix = el('div', { class: 'croix', role: 'group', 'aria-label': 'Croix directionnelle' },
  touche('croix-h', 'Haut', () => diriger(-1)),
  touche('croix-g', 'Gauche', () => diriger(-1)),
  el('span', { class: 'croix-c', 'aria-hidden': 'true' }),
  touche('croix-d', 'Droite', () => diriger(1)),
  touche('croix-b', 'Bas', () => diriger(1)));
const consoleJeu = el('div', { class: 'console' },
  el('div', { class: 'console-cote cote-gauche' }, croix, el('div', { class: 'grille-hp', 'aria-hidden': 'true' })),
  el('div', { class: 'console-centre' },
    el('div', { class: 'ecran-cadre' },
      el('div', { class: 'ecran-etiquette', 'aria-hidden': 'true' }, el('span', { class: 'led' }), 'POWER',
        el('span', { class: 'logo-cadre' }, 'LECTO', el('i', {}, 'COLOR'))),
      el('div', { class: 'ecran' }, bandeauApercu,
        el('header', { class: 'hud' }, boutonRetour, filAriane,
          el('div', { class: 'hud-scores', 'aria-label': 'Récompenses de cette séance', 'aria-live': 'polite' },
            el('span', { class: 'hud-bloc' }, piece(20), el('span', { class: 'sr-only' }, 'Pièces : '), hudPieces),
            el('span', { class: 'hud-bloc' }, etoile(true, 20), el('span', { class: 'sr-only' }, 'Étoiles : '), hudEtoiles))),
        vue)),
    el('div', { class: 'console-milieu' },
      el('div', { class: 'mini-touche' }, boutonSon, el('span', {}, 'SON')),
      el('div', { class: 'mini-touche' }, touche('btn-start', 'START : ouvrir le texte de la semaine', () => {
        if (!demarre) demarrer(); else { jouer('choisir'); aller([]); }
      }), el('span', {}, 'START')))),
  el('div', { class: 'console-cote cote-droit' },
    el('div', { class: 'ab' }, el('div', { class: 'bouton-rond b' }, touche('btn-b', 'B : retour', retour, 'B')),
      el('div', { class: 'bouton-rond a' }, touche('btn-a', 'A : valider', validerConsole, 'A'))),
    el('div', { class: 'grille-hp', 'aria-hidden': 'true' })));
racine.append(consoleJeu);
majBoutonSon();
function majHud() {
  hudPieces.textContent = String(pieces()).padStart(4, '0');
  const total = (contenu?.parcours || []).reduce((n, p) => n + p.textes.reduce((s, t) => s + etoilesTexte(t), 0), 0);
  hudEtoiles.textContent = String(total).padStart(2, '0');
}
surChangement(majHud);
majHud();

function zoneActive() { return document.querySelector('.fin-fond, .fenetre-fond') || vue; }
function diriger(pas) {
  const zone = zoneActive();
  const cibles = [...zone.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, a[href], [tabindex="0"]')].filter((n) => n.offsetParent !== null);
  if (!cibles.length) return;
  const i = cibles.indexOf(document.activeElement);
  const cible = cibles[(i + pas + cibles.length) % cibles.length];
  cible.focus(); cible.scrollIntoView({ block: 'nearest' }); jouer('deplacer');
}
function validerConsole() {
  const zone = zoneActive();
  const actif = document.activeElement;
  if (zone.contains(actif) && /^(BUTTON|A|SUMMARY)$/.test(actif.tagName)) { actif.click(); return; }
  const cible = zone.querySelector('.btn-principal:not(:disabled)')
    || zone.querySelector('.cartouche:not(:disabled)')
    || zone.querySelector('button:not(:disabled)');
  cible?.click();
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function route() {
  const morceaux = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return morceaux;
}

function aller(chemin) { location.hash = `#/${chemin.map(encodeURIComponent).join('/')}`; }

function retour() {
  const fin = document.querySelector('.fin-fond');
  if (fin) { fin.querySelector('button')?.click(); return; }
  const fenetre = document.querySelector('.fenetre-fond');
  if (fenetre) { fenetre.click(); return; }
  const r = route();
  jouer('retour');
  if (!modeApercu()) return aller([]);
  if (r[0] !== 'p') return aller([]);
  if (r.length >= 5) return aller(r.slice(0, 4));   // activité → choix des activités
  if (r.length >= 4) return aller(r.slice(0, 2));   // texte → liste des textes
  return aller([]);                                  // parcours → accueil
}

document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('mode-studio') || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (/^Arrow(Up|Down|Left|Right)$/.test(e.key)) { e.preventDefault(); diriger(/Up|Left/.test(e.key) ? -1 : 1); }
  else if (e.key === 'Escape' && !document.querySelector('.fenetre-fond, .fin-fond')) { e.preventDefault(); retour(); }
  else if ((e.key === 'Enter' || e.key === ' ') && (e.target === document.body || e.target === vue)) { e.preventDefault(); validerConsole(); }
});

async function afficher() {
  if (route()[0] === 'studio') {
    taire();
    document.querySelectorAll('.fin-fond, .fenetre-fond').forEach((f) => f.nettoyer ? f.nettoyer() : f.remove());
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
  document.querySelectorAll('.fin-fond').forEach((f) => f.nettoyer?.());
  document.querySelectorAll('.fenetre-fond').forEach((f) => f.nettoyer ? f.nettoyer() : f.remove());
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
  consoleJeu.dataset.ecran = 'cartouches';
  majHud();

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
  if (!demarre) return ecranDemarrage();
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
      el('p', { class: 'surtitre-retro' }, 'MISSION DE LA SEMAINE'),
      mascotte({ taille: 96, classe: 'saute' }),
      el('h1', {}, 'Ton texte arrive bientôt'),
      el('p', {}, 'Lecto attend ton prochain texte ! Ton enseignant prépare les cinq activités de la semaine.'),
      boutonEcouter('Ton texte arrive bientôt. Ton enseignant prépare le texte et les activités de la semaine.')));
  }
  vue.append(
    el('footer', { class: 'semaine-pied' }, el('a', { href: '#/studio' }, 'Espace enseignant')),
  );
}

function ecranDemarrage() {
  majFil([]);
  consoleJeu.dataset.ecran = 'demarrage';
  vue.append(el('section', { class: 'demarrage' },
    el('div', { class: 'demarrage-ciel', 'aria-hidden': 'true' }, Array.from({ length: 18 }, (_, i) => el('i', { style: { left: `${(i * 37) % 100}%`, top: `${(i * 53) % 70}%`, animationDelay: `${i % 6 * .3}s` } }))),
    el('h1', { class: 'logo', 'aria-label': 'Lecto — Ma semaine de lecture' },
      [...'LECTO'].map((l, i) => el('span', { 'aria-hidden': 'true', style: { animationDelay: `${i * .09}s` } }, l)),
      el('small', {}, 'Ma semaine de lecture')),
    mascotte({ taille: 96, classe: 'saute' }),
    el('button', { class: 'btn-px btn-principal bouton-demarrer', onclick: demarrer }, 'START — C’est parti !'),
    el('p', { class: 'demarrage-detail' }, 'Un texte pour la semaine · Cinq activités'),
    el('a', { class: 'lien-studio', href: '#/studio' }, 'Espace enseignant')));
}
function demarrer() {
  demarre = true;
  try { sessionStorage.setItem('ulis-demarre', '1'); } catch { /* séance sans stockage */ }
  jouer('demarrage');
  if (route().length) aller([]); else afficher();
}

function ecranActivites(parcours, texte, index, accueil = false) {
  majFil(accueil ? [] : ['Notre texte', texte.titre]);
  const dispo = activitesDisponibles(texte);
  vue.append(
    el('div', { class: 'ecran-titre' },
      el('p', { class: 'surtitre' }, accueil ? 'Notre texte de la semaine' : 'Notre texte'),
      el('h1', {}, texte.titre),
      !texte.valide ? el('p', { class: 'alerte' }, 'Aperçu : ce texte est encore en brouillon.') : null,
      boutonEcouter(`${texte.titre}. Je retrouve le même texte toute la semaine. Je m’entraîne à lire et je choisis une activité.`),
      el('p', { class: 'mission-texte' }, 'Je retrouve le même texte toute la semaine.')),
    el('div', { class: 'fente', 'aria-hidden': 'true' }, 'CHOISIS TA CARTOUCHE'),
    el('div', { class: 'rangee-cartouches semaine-cartouches' },
      ACTIVITES.map((a) => el('div', { class: `cartouche-wrap ${a.cle === 'lecture' ? 'mission-fluence' : ''}` },
        el('button', {
          class: `cartouche cartouche-${a.cle}`,
          style: { '--fond-icone': COULEURS_ACTIVITES[a.cle] },
          disabled: !dispo[a.cle],
          onclick: (e) => chargerCartouche(e.currentTarget, parcours, texte, a.cle),
          onpointerenter: () => jouer('deplacer'),
        },
        el('span', { class: 'cartouche-stries', 'aria-hidden': 'true' }),
        el('span', { class: 'cartouche-etiquette' },
          iconePixel(a.cle, { taille: 56, contour: '#1b1626', fond: COULEURS_ACTIVITES[a.cle], reflet: '#ffffffaa' }),
          el('span', { class: 'cartouche-nom' }, a.nom),
          el('span', { class: 'cartouche-aide' }, a.aide)),
        el('span', { class: 'cartouche-etoiles', 'aria-label': `${etoilesDe(texte.id, a.cle)} étoiles sur 3` }, [0, 1, 2].map((k) => etoile(k < etoilesDe(texte.id, a.cle), 22)))),
        boutonEcouter(`${a.nom}. ${a.aide}`, 'petit')))),
  );
}

const COULEURS_ACTIVITES = { lecture: '#ffd23f', dictee: '#8fc3ff', comprehension: '#ff9fb7', motsMeles: '#a8f0c0', maze: '#c9a2ff' };
function chargerCartouche(bouton, parcours, texte, cle) {
  if (bouton.classList.contains('insere')) return;
  bouton.classList.add('insere');
  jouer('chargement');
  const fente = vue.querySelector('.fente');
  fente.classList.add('charge');
  remplir(fente, 'CHARGEMENT', el('span', { class: 'barre-charge' }, el('i')));
  vue.querySelectorAll('.cartouche').forEach((b) => { b.disabled = true; });
  const attente = setTimeout(() => aller(['p', String(parcours.id), 't', texte.id, cle]), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
  nettoyage = () => clearTimeout(attente);
}

function ecranActivite(parcours, texte, index, act) {
  const a = ACTIVITES.find((x) => x.cle === act);
  consoleJeu.dataset.ecran = 'activite';
  majFil(['Notre texte', a.nom]);
  const zone = el('section', { class: `activite activite-${act}`, style: { '--act': COULEURS_ACTIVITES[act] } });
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
