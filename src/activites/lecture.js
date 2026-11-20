// Lecture au prompteur : progression mot à mot ou par groupes de souffle.
import { el, remplir, ajouter, iconePixel, formaterDuree } from '../ui.js';
import { jetons } from '../lib/texte.js';
import { bornesGroupes } from '../lib/activites-lecture.js';
import { jouer } from '../sons.js';
import { dire, taire } from '../voix.js';
import { creerPiste, finDeNiveau, gagner, lectureTerminee } from '../jeu.js';

const VITESSES = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140];
const TAILLES = [24, 28, 32, 38, 44];

export function monterLecture(zone, { texte, parcours, finir }) {
  let aides = {};
  try { aides = JSON.parse(sessionStorage.getItem('ulis-aides-lecture')) || {}; } catch { /* aides par défaut */ }
  const conseil = texte.activites?.lecture?.vitesse || parcours.reglages?.vitesse || 60;
  let vitesse = VITESSES.reduce((a, b) => (Math.abs(b - conseil) < Math.abs(a - conseil) ? b : a));
  let taille = Number.isInteger(aides.taille) && aides.taille >= 0 && aides.taille < TAILLES.length ? aides.taille : 1;
  let index = 0;
  let enCours = false;
  let minuterie = null;
  let debut = 0;
  let cumul = 0;
  let horloge = null;
  let modeLigne = aides.ligne === true;
  let espacement = aides.espacement === true;
  const groupes = bornesGroupes(texte.texte, texte.activites?.lecture?.groupes);
  let parGroupes = Boolean(groupes) && aides.groupes !== false;

  // Texte découpé en mots cliquables
  const mots = [];
  const signes = [];
  const papier = el('div', { class: 'papier prompteur', style: { '--taille': `${TAILLES[taille]}px` } },
    jetons(texte.texte).map((paragraphe) => el('p', {},
      paragraphe.map((j) => {
        if (j.type === 'sep') { const sp = el('span', { class: 'sep' }, j.v); signes.push({ element: sp, avant: mots.length - 1 }); return sp; }
        const span = el('span', { class: 'mot', onclick: () => { allerA(mots.indexOf(span)); } }, j.v);
        mots.push(span);
        return span;
      }))));
  let unites = parGroupes ? groupes : mots.map((_, i) => ({ debut: i, fin: i }));
  papier.classList.toggle('mode-ligne', modeLigne);
  papier.classList.toggle('mots-espaces', espacement);

  const chrono = el('span', { class: 'chrono', 'aria-live': 'off', 'aria-label': 'Durée du guide de lecture', title: 'Durée du guide de lecture' }, '0:00');
  const piste = creerPiste(mots.length);
  const affVitesse = el('span', { class: 'vitesse-valeur' });
  const btnLire = el('button', { class: 'btn-px btn-principal', onclick: () => (enCours ? pause() : lancer()) });
  const btnMots = el('button', { class: 'btn-px', onclick: () => changerMode(false) }, 'Mot à mot');
  const btnGroupes = el('button', {
    class: 'btn-px', disabled: !groupes,
    title: groupes ? 'Avancer par groupes de sens' : 'Groupes de souffle à préparer dans le studio',
    onclick: () => changerMode(true),
  }, 'Groupes de souffle');
  const consigne = el('p', { class: 'consigne' });

  const barre = el('div', { class: 'commandes' },
    btnLire,
    el('button', { class: 'btn-px', onclick: () => { recommencer(); }, title: 'Recommencer' }, '↺ Début'),
    el('button', { class: 'btn-px', onclick: ecouterModele }, iconePixel('son', { taille: 18, contour: 'currentColor', fond: 'currentColor' }), ' Écouter le modèle'),
    chrono);
  const reglages = el('details', { class: 'aides-lecture' },
    el('summary', {}, 'Mes aides de lecture'),
    el('div', { class: 'commandes' },
    el('div', { class: 'groupe-vitesse', role: 'group', 'aria-label': 'Vitesse' },
      el('button', { class: 'btn-px btn-carre', 'aria-label': 'Moins vite', onclick: () => changerVitesse(-1) }, '−'),
      el('span', { class: 'vitesse' }, affVitesse, el('small', {}, 'mots/min')),
      el('button', { class: 'btn-px btn-carre', 'aria-label': 'Plus vite', onclick: () => changerVitesse(1) }, '+')),
    el('div', { class: 'groupe-vitesse', role: 'group', 'aria-label': 'Taille du texte' },
      el('button', { class: 'btn-px btn-carre', 'aria-label': 'Texte plus petit', onclick: () => changerTaille(-1) }, 'a'),
      el('button', { class: 'btn-px btn-carre grand', 'aria-label': 'Texte plus grand', onclick: () => changerTaille(1) }, 'A')),
    el('div', { class: 'mode-lecture', role: 'group', 'aria-label': 'Mode de lecture' }, btnMots, btnGroupes),
    el('button', {
      class: 'btn-px', 'aria-pressed': String(modeLigne),
      onclick: (e) => { modeLigne = !modeLigne; e.currentTarget.setAttribute('aria-pressed', String(modeLigne)); papier.classList.toggle('mode-ligne', modeLigne); majLigne(); sauverAides(); },
    }, 'Suivre une ligne'),
    el('button', { class: 'btn-px', 'aria-pressed': String(espacement), onclick: (e) => {
      espacement = !espacement;
      e.currentTarget.setAttribute('aria-pressed', String(espacement));
      papier.classList.toggle('mots-espaces', espacement);
      requestAnimationFrame(majMots); sauverAides();
    } }, 'Espacer les mots')));

  ajouter(zone, 
    el('div', { class: 'activite-entete' },
      el('h2', {}, texte.titre),
      consigne),
    barre,
    reglages,
    piste.el,
    papier,
  );
  majVitesse();
  majMode();
  majBouton();
  majMots();

  function dureeMot(i) {
    const base = 60000 / vitesse;
    const m = mots[i].textContent;
    let d = base * (0.75 + Math.min(m.length, 12) * 0.05);
    const suite = mots[i].nextElementSibling?.classList.contains('sep') ? mots[i].nextElementSibling.textContent : '';
    if (/[.!?…]/.test(suite)) d += base * 0.9;
    else if (/[,;:]/.test(suite)) d += base * 0.4;
    return d;
  }

  function dureeUnite(i) {
    const { debut: premier, fin: dernier } = unites[i];
    let duree = 0;
    for (let mot = premier; mot <= dernier; mot++) duree += dureeMot(mot);
    return duree;
  }

  function lancer() {
    taire();
    if (index >= unites.length) recommencer();
    enCours = true;
    debut = performance.now();
    horloge = setInterval(majChrono, 250);
    jouer('choisir');
    majBouton();
    avancer(true);
  }

  function avancer(premier = false) {
    if (!enCours) return;
    if (!premier) index++;
    majMots();
    if (index >= unites.length) return terminer();
    minuterie = setTimeout(() => avancer(), dureeUnite(index));
  }

  function pause() {
    if (!enCours) return;
    enCours = false;
    clearTimeout(minuterie);
    clearInterval(horloge);
    cumul += performance.now() - debut;
    majChrono();
    majBouton();
  }

  function recommencer() {
    pause();
    index = 0;
    cumul = 0;
    majChrono();
    majMots();
    papier.scrollTop = 0;
  }

  function allerA(i) {
    if (i < 0) return;
    const reprendre = enCours;
    pause();
    index = unites.findIndex((u) => i >= u.debut && i <= u.fin);
    if (index < 0) index = 0;
    majMots();
    if (reprendre) lancer();
  }

  function terminer() {
    enCours = false;
    clearInterval(horloge);
    cumul += performance.now() - debut;
    majChrono();
    majBouton();
    const lectures = lectureTerminee(texte.id);
    gagner(20, btnLire);
    finDeNiveau({ texteId: texte.id, activite: 'lecture', etoiles: Math.min(3, lectures),
      titre: lectures === 1 ? 'Premier entraînement terminé !' : `Entraînement n° ${lectures} terminé !`,
      lignes: [`Durée du guide : ${formaterDuree(cumul)}.`, lectures < 3 ? 'Relis le texte pour gagner une étoile de plus.' : 'Bravo pour tes relectures ! Tu peux continuer à t’entraîner.'],
      boutons: [{ texte: 'Relire', action: recommencer }, { texte: 'Autre activité', action: finir, principal: true }],
    });
  }

  function majMots() {
    const premier = unites[index]?.debut ?? mots.length;
    const dernier = unites[index]?.fin ?? -1;
    piste.avancer(premier);
    mots.forEach((m, i) => {
      m.classList.toggle('lu', i < premier);
      m.classList.toggle('courant', i >= premier && i <= dernier);
    });
    signes.forEach(({ element, avant }) => element.classList.toggle('courant', avant >= premier && avant < dernier));
    const courant = mots[premier];
    if (courant) {
      const haut = courant.offsetTop - papier.clientHeight * 0.35;
      papier.scrollTo({ top: Math.max(0, haut), behavior: 'smooth' });
    }
    majLigne();
  }

  function majLigne() {
    const tous = [...mots, ...signes.map((s) => s.element)];
    if (!modeLigne) { tous.forEach((m) => m.classList.remove('meme-ligne')); return; }
    const ref = mots[Math.min(unites[index]?.debut ?? mots.length - 1, mots.length - 1)];
    const y = ref ? ref.offsetTop : -1;
    tous.forEach((m) => m.classList.toggle('meme-ligne', Math.abs(m.offsetTop - y) < 4));
  }

  function changerMode(avecGroupes) {
    if (avecGroupes && !groupes) return;
    const position = unites[Math.min(index, unites.length - 1)]?.debut ?? 0;
    pause();
    parGroupes = avecGroupes;
    sauverAides();
    unites = parGroupes ? groupes : mots.map((_, i) => ({ debut: i, fin: i }));
    index = Math.max(0, unites.findIndex((u) => position >= u.debut && position <= u.fin));
    majMode();
    majMots();
    majBouton();
  }

  function majMode() {
    btnMots.setAttribute('aria-pressed', String(!parGroupes));
    btnGroupes.setAttribute('aria-pressed', String(parGroupes));
    consigne.textContent = parGroupes
      ? 'Appuie sur Lire, puis lis tout le groupe qui s’allume. Touche un mot pour repartir de son groupe.'
      : 'Appuie sur Lire, puis lis le mot qui s’allume. Touche un mot pour repartir de là.';
  }

  function changerVitesse(d) {
    const i = Math.min(VITESSES.length - 1, Math.max(0, VITESSES.indexOf(vitesse) + d));
    vitesse = VITESSES[i];
    jouer('deplacer');
    majVitesse();
  }

  function changerTaille(d) {
    taille = Math.min(TAILLES.length - 1, Math.max(0, taille + d));
    papier.style.setProperty('--taille', `${TAILLES[taille]}px`);
    sauverAides();
    requestAnimationFrame(majMots);
  }

  function ecouterModele() {
    pause();
    dire(texte.texte, { vitesse: 0.85 });
  }

  function sauverAides() {
    try {
      sessionStorage.setItem('ulis-aides-lecture', JSON.stringify({ taille, ligne: modeLigne, espacement, groupes: groupes ? parGroupes : aides.groupes }));
    } catch { /* la lecture reste utilisable sans stockage */ }
  }

  function majVitesse() { affVitesse.textContent = String(vitesse); }
  function majChrono() { chrono.textContent = formaterDuree(cumul + (enCours ? performance.now() - debut : 0)); }
  function majBouton() {
    remplir(btnLire, enCours ? '❚❚ Pause' : (index > 0 && index < unites.length ? '▶ Reprendre' : '▶ Lire'));
  }

  const surRedim = () => majMots();
  window.addEventListener('resize', surRedim);
  return () => {
    pause();
    taire();
    window.removeEventListener('resize', surRedim);
  };
}
