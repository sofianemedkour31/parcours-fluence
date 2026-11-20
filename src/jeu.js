// Mécanique de jeu de la séance : pièces, étoiles, écran « niveau terminé ».
// Rien n'est enregistré : tout repart à zéro quand on recharge la page.
import { el, ajouter } from './ui.js';
import { etoile, mascotte, piece } from './sprites.js';
import { jouer } from './sons.js';

const session = { pieces: 0, etoiles: new Map() };
const abonnes = new Set();

export function surChangement(fn) { abonnes.add(fn); return () => abonnes.delete(fn); }
function prevenir() { abonnes.forEach((fn) => fn(session)); }

export function pieces() { return session.pieces; }

/** Ajoute des pièces et fait jaillir « +n » depuis un élément. */
export function gagner(n, depuis) {
  session.pieces += n;
  if (depuis?.getBoundingClientRect) {
    const r = depuis.getBoundingClientRect();
    const bulle = el('div', { class: 'gain', style: { left: `${r.left + r.width / 2}px`, top: `${r.top}px` } }, piece(18), `+${n}`);
    document.body.append(bulle);
    setTimeout(() => bulle.remove(), 1100);
  }
  jouer('piece');
  prevenir();
}

const cle = (texteId, act) => `${texteId}|${act}`;

export function etoilesDe(texteId, act) { return session.etoiles.get(cle(texteId, act)) || 0; }

export function etoilesTexte(texte) {
  return ['lecture', 'dictee', 'comprehension', 'motsMeles', 'maze'].reduce((s, a) => s + etoilesDe(texte.id, a), 0);
}

function retenir(texteId, act, n) {
  const k = cle(texteId, act);
  session.etoiles.set(k, Math.max(session.etoiles.get(k) || 0, n));
  prevenir();
}

/** Calcule 1 à 3 étoiles à partir d'un taux de réussite (0 à 1). */
export function etoilesPour(taux) {
  if (taux >= 0.9) return 3;
  if (taux >= 0.6) return 2;
  return 1;
}

/**
 * Écran de fin de niveau.
 * @param {{ texteId, activite, etoiles, titre, lignes?: string[], boutons: {texte, action, principal?}[] }} o
 */
export function finDeNiveau({ texteId, activite, etoiles: n, titre = 'Activité terminée !', lignes = [], contenu, boutons = [] }) {
  const retourFocus = document.activeElement;
  retenir(texteId, activite, n);
  jouer('victoire');
  const rangee = el('div', { class: 'fin-etoiles' });
  for (let i = 0; i < 3; i++) {
    const e = etoile(i < n, 64);
    e.style.animationDelay = `${0.35 + i * 0.28}s`;
    rangee.append(e);
  }
  const fond = el('div', { class: 'fin-fond', role: 'dialog', 'aria-modal': 'true', 'aria-label': titre });
  let attenteFocus;
  const fermer = () => { clearTimeout(attenteFocus); fond.remove(); document.removeEventListener('keydown', clavier, true); if (retourFocus?.isConnected) retourFocus.focus(); };
  const actions = boutons.map((b, i) => el('button', {
    class: `btn-px ${b.principal ? 'btn-principal' : ''}`,
    onclick: () => { fermer(); b.action(); },
    'data-ordre': i,
  }, b.texte));
  const clavier = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); actions[0]?.click(); return; }
    if (e.key === 'Tab' && actions.length) {
      const position = actions.indexOf(document.activeElement);
      e.preventDefault(); e.stopPropagation();
      actions[(position + (e.shiftKey ? -1 : 1) + actions.length) % actions.length].focus();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      const p = actions.find((a) => a === document.activeElement) || actions.find((a, i) => boutons[i].principal) || actions[0];
      e.preventDefault(); e.stopPropagation(); p?.click();
    }
  };
  ajouter(fond,
    el('div', { class: 'fin-boite' },
      el('div', { class: 'fin-bandeau' }, 'MISSION ACCOMPLIE'),
      mascotte({ taille: 84, humeur: 'content', classe: 'saute' }),
      el('h2', {}, titre.replace(/\s+([!?])/g, '\u00a0$1')),
      rangee,
      lignes.length ? el('div', { class: 'fin-lignes' }, lignes.map((l) => el('p', {}, l))) : null,
      contenu,
      el('div', { class: 'boutons' }, actions)));
  document.body.append(fond);
  document.addEventListener('keydown', clavier, true);
  fond.nettoyer = fermer;
  attenteFocus = setTimeout(() => { if (fond.isConnected) (actions.find((a, i) => boutons[i].principal) || actions[0])?.focus(); }, 100);
  return fermer;
}

/** Petite étiquette « +n » sans pièce, pour un succès ponctuel. */
export function eclat(depuis, texte = 'Bravo !') {
  if (!depuis?.getBoundingClientRect) return;
  const r = depuis.getBoundingClientRect();
  const bulle = el('div', { class: 'gain eclat', style: { left: `${r.left + r.width / 2}px`, top: `${r.top}px` } }, texte);
  document.body.append(bulle);
  setTimeout(() => bulle.remove(), 1000);
}

// Lectures complètes d'un même texte pendant la séance (lecture répétée).
const lectures = new Map();
export function lectureTerminee(texteId) {
  const n = (lectures.get(texteId) || 0) + 1;
  lectures.set(texteId, n);
  return n;
}

/**
 * Piste de progression : la mascotte avance vers le drapeau en ramassant des pièces.
 * @param {number} etapes nombre d'étapes (mots, questions…)
 */
export function creerPiste(etapes) {
  const nbPieces = Math.max(1, Math.min(etapes, 10));
  const lesPieces = Array.from({ length: nbPieces }, () => piece(18));
  const heros = mascotte({ taille: 40, classe: 'marche' });
  const racine = el('div', { class: 'piste', 'aria-hidden': 'true' },
    el('div', { class: 'piste-pieces' }, lesPieces),
    el('div', { class: 'piste-sol' }),
    el('div', { class: 'piste-drapeau' }),
    heros);
  function avancer(fait) {
    const ratio = etapes ? Math.min(1, fait / etapes) : 0;
    racine.style.setProperty('--avance', ratio);
    lesPieces.forEach((p, i) => p.classList.toggle('prise', (i + 1) / nbPieces <= ratio + 1e-9));
  }
  avancer(0);
  return { el: racine, avancer };
}
