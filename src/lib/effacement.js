export const GIF_LECTURE = '/images/ryu-lecture.gif';

/** Le fichier transparent suit notre repère, sans iframe Tenor. */
export function sourceGif(valeur) {
  if (!valeur) return null;
  if (valeur === GIF_LECTURE) return valeur;
  try {
    const url = new URL(valeur);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Les rectangles viennent du DOM, jamais d'un nombre de caractères par ligne. */
export function positionEffacement(rectangles, progression) {
  if (!rectangles.length) return null;
  progression = Math.max(0, Math.min(rectangles.length, progression));
  const index = Math.min(Math.floor(progression), rectangles.length - 1);
  const lettre = rectangles[index];
  const suivante = rectangles[index + 1];
  const memeLigne = suivante && Math.abs(suivante.top - lettre.top) < Math.min(lettre.height, suivante.height) / 2;
  const fin = memeLigne ? suivante.left : lettre.right;
  const fraction = progression === rectangles.length ? 1 : progression - index;
  // Effacer dès le franchissement du bord gauche : aucune lettre à lire sous le GIF.
  return { cachees: Math.ceil(progression), x: lettre.left + (fin - lettre.left) * fraction, top: lettre.top, height: lettre.height };
}

export function creerEffacement({ papier, lettres, personnage, image, nbMots, vitesse, surEtat, surProgression, surFin }) {
  let statut = 'pret';
  let progression = 0;
  let duree = 0;
  let dernierTemps = null;
  let frame = null;
  let mesureNecessaire = true;
  let rectangles = [];
  let cachees = 0;
  let detruit = false;
  let derniereLigne = null;
  let hauteurLigne = 0;

  function planifier() {
    if (!detruit && frame === null) frame = requestAnimationFrame(animer);
  }
  function mesurer() {
    const base = papier.getBoundingClientRect();
    hauteurLigne = parseFloat(getComputedStyle(papier).lineHeight) || 0;
    rectangles = lettres.map((lettre) => {
      const r = lettre.getBoundingClientRect();
      return { left: r.left - base.left + papier.scrollLeft - papier.clientLeft,
        right: r.right - base.left + papier.scrollLeft - papier.clientLeft,
        top: r.top - base.top + papier.scrollTop - papier.clientTop, height: r.height };
    });
    mesureNecessaire = false;
  }
  function dessiner() {
    const position = positionEffacement(rectangles, progression);
    if (!position) { personnage.hidden = true; return; }
    while (cachees < position.cachees) lettres[cachees++].style.visibility = 'hidden';
    while (cachees > position.cachees) lettres[--cachees].style.visibility = '';
    personnage.hidden = false;
    const hauteur = Math.min(hauteurLigne || position.height, position.height * 1.65);
    const haut = position.top - (hauteur - position.height) / 2;
    personnage.style.height = `${hauteur}px`;
    personnage.style.width = `${hauteur * (image.naturalWidth / image.naturalHeight || 0.428125)}px`;
    personnage.style.transform = `translate3d(${position.x}px, ${haut}px, 0) translateX(-100%)`;
    // La boîte du GIF se termine au repère et tient dans la hauteur de la ligne.
    if ((statut === 'lecture' || statut === 'pause') && derniereLigne !== position.top) {
      papier.scrollTo({ top: Math.max(0, position.top - papier.clientHeight * 0.35), behavior: 'instant' });
      derniereLigne = position.top;
    }
    surProgression(lettres.length ? progression / lettres.length : 0, duree);
  }
  function avancer(temps) {
    if (statut !== 'lecture' || dernierTemps === null) return;
    const ecoule = Math.max(0, temps - dernierTemps);
    // Durée totale : nbMots / vitesse minutes, ponctuation comprise.
    const restant = (lettres.length - progression) * nbMots * 60000 / (vitesse * lettres.length);
    const pas = Math.min(ecoule, restant);
    progression = Math.min(lettres.length, progression + pas * vitesse * lettres.length / (60000 * nbMots));
    if (restant <= ecoule) progression = lettres.length;
    duree += pas;
    dernierTemps = temps;
  }
  function animer(temps) {
    frame = null;
    if (detruit) return;
    if (mesureNecessaire) mesurer();
    if (statut === 'lecture') { avancer(temps); dernierTemps = temps; }
    dessiner();
    if (statut === 'lecture' && progression >= lettres.length) {
      statut = 'termine'; dernierTemps = null;
      surEtat(statut); surFin(duree);
    }
    if (statut === 'lecture') planifier();
  }
  function pause() {
    if (statut !== 'lecture') return;
    statut = 'pause'; dernierTemps = null;
    surEtat(statut); planifier();
  }
  function reprendre() {
    if (statut !== 'pause' && statut !== 'pret') return;
    if (!nbMots || !lettres.length) return;
    statut = 'lecture'; dernierTemps = null; derniereLigne = null;
    surEtat(statut); planifier();
  }
  function recalculer() { mesureNecessaire = true; planifier(); }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(recalculer) : null;
  observer?.observe(papier);
  window.addEventListener('resize', recalculer);
  surEtat(statut); surProgression(0, 0); planifier();
  return {
    demarrer: () => { if (statut === 'pret') reprendre(); }, pause, reprendre, recalculer,
    changerVitesse: (valeur) => {
      if (statut === 'lecture' && dernierTemps !== null) avancer(performance.now());
      vitesse = Math.max(10, Math.min(300, Number(valeur) || 60));
      planifier();
    },
    reinitialiser: () => {
      statut = 'pret'; progression = 0; duree = 0; dernierTemps = null; derniereLigne = null;
      papier.scrollTop = 0;
      surEtat(statut); recalculer();
    },
    detruire: () => {
      detruit = true;
      if (frame !== null) cancelAnimationFrame(frame);
      observer?.disconnect(); window.removeEventListener('resize', recalculer);
    },
  };
}
