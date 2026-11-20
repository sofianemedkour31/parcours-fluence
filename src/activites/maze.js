// Labyrinthe de lecture : choix dans le texte, ou phrases à compléter pour les listes de mots.
import { el, ajouter, remplir } from '../ui.js';
import { jetons, melanger } from '../lib/texte.js';
import { erreursMaze, erreursMazePhrases } from '../lib/activites-lecture.js';
import { jouer } from '../sons.js';
import { creerPiste, finDeNiveau, gagner, etoilesPour } from '../jeu.js';

export function monterMaze(zone, { texte, finir }) {
  const maze = texte.activites.maze;
  const parPhrases = maze.mode === 'phrases';
  const items = parPhrases ? maze.phrases : maze.trous;
  const erreurs = parPhrases
    ? erreursMazePhrases(texte.texte, items)
    : erreursMaze(texte.texte, items);
  if (erreurs.length) {
    ajouter(zone, el('p', { class: 'alerte' }, 'Ce labyrinthe doit être complété dans le studio.'));
    return () => {};
  }

  const parIndex = parPhrases ? null : new Map(items.map((trou) => [trou.index, trou]));
  const rates = new Set();
  let resolus = 0;
  let reussis = 0;
  let motIndex = 0;
  let finDifferee = null;
  const compteur = el('p', { class: 'compteur', 'aria-live': 'polite' });
  const retour = el('p', { class: 'maze-retour', role: 'status', 'aria-live': 'polite' });
  const papier = el('div', { class: 'papier maze-texte' });
  const piste = creerPiste(items.length);

  function choisir(trou, index, bouton, cadre) {
    if (cadre.classList.contains('resolu')) return;
    if (bouton.textContent !== trou.choix[0]) {
      rates.add(index);
      bouton.disabled = true;
      bouton.classList.add('faux');
      remplir(retour, 'Ce mot ne convient pas. Essaie un autre choix.');
      jouer('faux');
      return;
    }
    resolus++;
    gagner(rates.has(index) ? 5 : 10, bouton);
    piste.avancer(resolus);
    if (!rates.has(index)) reussis++;
    cadre.classList.add('resolu');
    remplir(cadre, el('strong', {}, trou.choix[0]));
    remplir(retour, 'Bien joué !');
    compteur.textContent = `${resolus} / ${items.length} mots trouvés`;
    jouer('juste');
    if (resolus === items.length) finDifferee = setTimeout(victoire, 500);
  }

  function creerChoix(trou, index) {
    const cadre = el('span', { class: 'maze-choix', role: 'group', 'aria-label': `Choisis le mot du choix ${index + 1}` });
    for (const proposition of melanger(trou.choix)) {
      const bouton = el('button', { type: 'button', onclick: () => choisir(trou, index, bouton, cadre) }, proposition);
      cadre.append(bouton);
    }
    return cadre;
  }

  if (parPhrases) {
    items.forEach((item, index) => {
      const [avant, apres] = item.phrase.split('___');
      papier.append(el('p', { class: 'maze-phrase' }, avant, creerChoix(item, index), apres));
    });
  } else {
    for (const paragraphe of jetons(texte.texte)) {
      const ligne = el('p');
      for (const jeton of paragraphe) {
        if (jeton.type === 'sep') { ligne.append(jeton.v); continue; }
        const index = motIndex++;
        const trou = parIndex.get(index);
        ligne.append(trou ? creerChoix(trou, index) : jeton.v);
      }
      papier.append(ligne);
    }
  }

  compteur.textContent = `0 / ${items.length} mots trouvés`;
  ajouter(zone,
    el('div', { class: 'activite-entete' },
      el('h2', {}, 'Labyrinthe de lecture'),
      el('p', { class: 'consigne' }, parPhrases
        ? 'Lis chaque phrase et choisis le mot du support qui la complète.'
        : 'Lis le texte. À chaque choix, touche le seul mot qui convient.')),
    compteur,
    retour,
    piste.el,
    papier);

  function victoire() {
    finDeNiveau({ texteId: texte.id, activite: 'maze', etoiles: etoilesPour(reussis / items.length), titre: 'Labyrinthe terminé !',
      lignes: [`${reussis} mot${reussis > 1 ? 's' : ''} trouvé${reussis > 1 ? 's' : ''} du premier coup sur ${items.length}.`],
      boutons: [{ texte: 'Autre activité', action: finir, principal: true }],
    });
  }

  return () => clearTimeout(finDifferee);
}
