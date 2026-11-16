// Mots mêlés : glisser du premier au dernier mot, ou toucher la première puis la dernière lettre.
import { el, vider, remplir, ajouter, iconePixel, fenetre } from '../ui.js';
import { genererGrille } from '../lib/grille.js';
import { jouer } from '../sons.js';
import { dire } from '../voix.js';

const TEINTES = ['#ffd23f', '#7ee0a0', '#8fc3ff', '#ff9fb7', '#c9a2ff', '#ffb36b', '#7fe3e0', '#e6f07a', '#f6a5ff', '#b5e48c', '#ffc8a2', '#a0c4ff'];

export function monterMotsMeles(zone, { texte, parcours, finir }) {
  const reglage = texte.activites.motsMeles;
  const grille = genererGrille(reglage.mots, {
    directions: reglage.directions || parcours.reglages?.directions || 'simple',
    cle: `${texte.id}|${reglage.mots.join(',')}`,
  });
  const n = grille.taille;
  const trouves = new Map(); // mot -> teinte
  let debut = null;          // [l, c] de la première lettre choisie
  let survol = null;
  let glisse = false;

  const cases = [];
  const plateau = el('div', { class: 'plateau', style: { '--n': n }, role: 'grid', 'aria-label': 'Grille de mots mêlés' });
  grille.lettres.forEach((ligne, l) => {
    cases[l] = [];
    ligne.forEach((lettre, c) => {
      const cellule = el('div', { class: 'case', 'data-l': l, 'data-c': c, role: 'gridcell' }, lettre);
      cases[l][c] = cellule;
      plateau.append(cellule);
    });
  });

  const liste = el('ul', { class: 'liste-mots' });
  const compteur = el('p', { class: 'compteur' });
  const emplacement = document.createComment('emplacement de la grille');
  let agrandie = false;
  let ancienDebordement = '';
  let zoom = 1;
  const boutonTaille = el('button', {
    class: 'btn-px', 'aria-pressed': 'false',
    onclick: () => changerTaille(),
  }, '⛶ Agrandir la grille');
  const valeurZoom = el('span', { class: 'mm-zoom-valeur' });
  const boutonMoins = el('button', { class: 'btn-px btn-carre', 'aria-label': 'Réduire la grille', onclick: () => reglerZoom(-0.1) }, '−');
  const boutonPlus = el('button', { class: 'btn-px btn-carre', 'aria-label': 'Agrandir la grille', onclick: () => reglerZoom(0.1) }, '+');
  const outilsZoom = el('div', { class: 'mm-zoom' },
    boutonMoins, valeurZoom, boutonPlus);
  const cadre = el('div', { class: 'plateau-cadre' }, plateau);
  const cote = el('aside', { class: 'mm-cote' },
    el('div', { class: 'mm-commandes' },
      compteur,
      boutonTaille,
      outilsZoom,
      el('button', { class: 'btn-px', onclick: indice }, '💡 Un indice')),
    liste);
  const zoneGrille = el('div', { class: 'mm-zone' },
    cadre, cote);

  ajouter(zone, 
    el('div', { class: 'activite-entete' },
      el('h2', {}, 'Mots mêlés'),
      el('p', { class: 'consigne' }, 'Retrouve les mots du texte cachés dans la grille. Glisse ton doigt sur un mot, ou touche sa première lettre puis sa dernière.'),
      el('p', { class: 'consigne-dir' }, sensLecture(reglage.directions || parcours.reglages?.directions))),
    zoneGrille,
  );
  majListe();
  ajusterPlateau();

  function ajusterPlateau() {
    const largeur = Math.max(1, cadre.clientWidth - 8);
    const hauteur = agrandie ? Math.max(1, cadre.clientHeight - 8) : Infinity;
    const cote = Math.min(largeur, hauteur, agrandie ? 820 : 760);
    plateau.style.setProperty('--cote', `${Math.floor(cote * (agrandie ? zoom : 1))}px`);
    valeurZoom.textContent = `${Math.round(zoom * 100)} %`;
    boutonMoins.disabled = zoom <= 0.7;
    boutonPlus.disabled = zoom >= 1;
  }

  function reglerZoom(delta) {
    zoom = Math.max(0.7, Math.min(1, Math.round((zoom + delta) * 10) / 10));
    ajusterPlateau();
  }

  function changerTaille(forcerFermeture = false) {
    const ouvrir = !forcerFermeture && !agrandie;
    if (ouvrir) {
      zoneGrille.replaceWith(emplacement);
      document.body.append(zoneGrille);
      ancienDebordement = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      agrandie = true;
      zoneGrille.classList.add('agrandie');
    } else {
      agrandie = false;
      zoneGrille.classList.remove('agrandie');
      if (emplacement.isConnected) emplacement.replaceWith(zoneGrille);
      else zoneGrille.remove();
      document.body.style.overflow = ancienDebordement;
    }
    ajusterPlateau();
    boutonTaille.setAttribute('aria-pressed', String(ouvrir));
    boutonTaille.textContent = ouvrir ? '↙ Réduire la grille' : '⛶ Agrandir la grille';
    if (!ouvrir && !forcerFermeture) boutonTaille.focus();
  }

  const fermerAvecEchap = (e) => {
    if (agrandie && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      changerTaille(true);
      boutonTaille.focus();
    }
  };
  document.addEventListener('keydown', fermerAvecEchap, true);
  const surRedim = () => ajusterPlateau();
  window.addEventListener('resize', surRedim);
  window.visualViewport?.addEventListener('resize', surRedim);
  const observateur = typeof ResizeObserver === 'function' ? new ResizeObserver(surRedim) : null;
  observateur?.observe(cadre);

  // --- Sélection -----------------------------------------------------------
  function caseDepuis(e) {
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const cell = t?.closest?.('.case');
    if (!cell || !plateau.contains(cell)) return null;
    return [Number(cell.dataset.l), Number(cell.dataset.c)];
  }

  function ligneEntre(a, b) {
    const dl = Math.sign(b[0] - a[0]);
    const dc = Math.sign(b[1] - a[1]);
    const longL = Math.abs(b[0] - a[0]);
    const longC = Math.abs(b[1] - a[1]);
    if (!(longL === 0 || longC === 0 || longL === longC)) return null;
    const lg = Math.max(longL, longC);
    return Array.from({ length: lg + 1 }, (_, k) => [a[0] + dl * k, a[1] + dc * k]);
  }

  function surligner(chemin) {
    plateau.querySelectorAll('.case.choisie').forEach((x) => x.classList.remove('choisie'));
    (chemin || []).forEach(([l, c]) => cases[l][c].classList.add('choisie'));
  }

  plateau.addEventListener('pointerdown', (e) => {
    const p = caseDepuis(e);
    if (!p) return;
    e.preventDefault();
    plateau.setPointerCapture?.(e.pointerId);
    if (debut && (debut[0] !== p[0] || debut[1] !== p[1])) {
      // Deuxième toucher : on valide de la première à cette lettre.
      verifier(debut, p);
      debut = null;
      return;
    }
    debut = p;
    survol = p;
    glisse = true;
    jouer('deplacer');
    surligner([p]);
  });

  plateau.addEventListener('pointermove', (e) => {
    if (!glisse || !debut) return;
    const p = caseDepuis(e);
    if (!p || (survol && p[0] === survol[0] && p[1] === survol[1])) return;
    survol = p;
    surligner(ligneEntre(debut, p) || [debut]);
  });

  const lacher = (e) => {
    if (!glisse) return;
    glisse = false;
    const p = caseDepuis(e) || survol;
    if (debut && p && (p[0] !== debut[0] || p[1] !== debut[1])) {
      verifier(debut, p);
      debut = null;
    }
    // Sinon : simple toucher, la première lettre reste choisie en attendant la dernière.
  };
  plateau.addEventListener('pointerup', lacher);
  plateau.addEventListener('pointercancel', () => { glisse = false; debut = null; surligner(); });

  function verifier(a, b) {
    const chemin = ligneEntre(a, b);
    surligner();
    if (!chemin) { jouer('faux'); return; }
    const lu = chemin.map(([l, c]) => grille.lettres[l][c]).join('');
    const place = grille.places.find((pl) => !trouves.has(pl.mot)
      && (pl.mot === lu || pl.mot === [...lu].reverse().join(''))
      && memesCases(pl.cases, chemin));
    if (!place) {
      jouer('faux');
      chemin.forEach(([l, c]) => { cases[l][c].classList.remove('rate'); void cases[l][c].offsetWidth; cases[l][c].classList.add('rate'); });
      return;
    }
    const teinte = TEINTES[trouves.size % TEINTES.length];
    trouves.set(place.mot, teinte);
    place.cases.forEach(([l, c]) => {
      const x = cases[l][c];
      x.classList.add('trouvee');
      const deja = x.style.getPropertyValue('--t');
      x.style.setProperty('--t', deja ? '#ffffff' : teinte);
      if (deja) x.classList.add('croise');
    });
    jouer('trouve');
    dire(place.affiche);
    majListe();
    if (trouves.size === grille.places.length) setTimeout(victoire, 700);
  }

  function memesCases(a, b) {
    const k = (x) => x.map(([l, c]) => `${l}.${c}`).sort().join('|');
    return a.length === b.length && k(a) === k(b);
  }

  function indice() {
    const reste = grille.places.find((p) => !trouves.has(p.mot));
    if (!reste) return;
    const [l, c] = reste.cases[0];
    const x = cases[l][c];
    x.classList.remove('indice'); void x.offsetWidth; x.classList.add('indice');
    jouer('deplacer');
  }

  function majListe() {
    remplir(liste, grille.places.map((p) => el('li', {
      class: trouves.has(p.mot) ? 'trouve' : '',
      style: trouves.has(p.mot) ? { '--t': trouves.get(p.mot) } : null,
    }, p.mot)));
    compteur.textContent = `${trouves.size} / ${grille.places.length} trouvés`;
  }

  function victoire() {
    jouer('victoire');
    const { fermer } = fenetre(el('div', { class: 'bravo' },
      iconePixel('etoile', { taille: 72, contour: '#1b1626', fond: '#ffd23f' }),
      el('h2', {}, 'Tous les mots sont trouvés !'),
      el('div', { class: 'boutons' },
        el('button', { class: 'btn-px btn-principal', onclick: () => { fermer(); finir(); } }, 'Autre activité'))));
  }

  return () => {
    document.removeEventListener('keydown', fermerAvecEchap, true);
    window.removeEventListener('resize', surRedim);
    window.visualViewport?.removeEventListener('resize', surRedim);
    observateur?.disconnect();
    if (agrandie) changerTaille(true);
  };
}

function sensLecture(directions) {
  if (directions === 'completes') return 'Les mots peuvent être dans tous les sens, même à l\'envers.';
  if (directions === 'diagonales') return 'Les mots se lisent → vers la droite, ↓ vers le bas ou ↘ en diagonale.';
  return 'Les mots se lisent → vers la droite ou ↓ vers le bas.';
}
