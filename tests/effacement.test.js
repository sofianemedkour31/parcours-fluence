import test from 'node:test';
import assert from 'node:assert/strict';
import { creerEffacement, positionEffacement, sourceGif, GIF_LECTURE } from '../src/lib/effacement.js';

const rect = (left, top = 20, width = 10) => ({ left, right: left + width, top, height: 28 });

test('le bord avant efface dès le franchissement et laisse les lettres suivantes dégagées', () => {
  const lettres = [rect(40), rect(50), rect(80)];
  assert.deepEqual(positionEffacement(lettres, 0), { cachees: 0, x: 40, top: 20, height: 28 });
  for (const progression of [0.1, 0.5, 1, 1.1, 1.9, 2, 2.99, 3]) {
    const p = positionEffacement(lettres, progression);
    assert.equal(p.cachees, Math.ceil(progression));
    for (const visible of lettres.slice(p.cachees)) assert.ok(visible.left >= p.x);
  }
});

test('les retours visuels et les paragraphes sautent directement à la première lettre suivante', () => {
  const lettres = [rect(40), rect(120), rect(40, 72), rect(55, 72), rect(40, 150)];
  assert.equal(positionEffacement(lettres, 1.99).top, 20);
  assert.deepEqual(positionEffacement(lettres, 2), { cachees: 2, x: 40, top: 72, height: 28 });
  assert.deepEqual(positionEffacement(lettres, 4), { cachees: 4, x: 40, top: 150, height: 28 });
  assert.equal(positionEffacement([], 0), null);
});

function banc(t) {
  const originaux = new Map(['window', 'requestAnimationFrame', 'cancelAnimationFrame', 'ResizeObserver', 'getComputedStyle'].map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const frames = new Map();
  let identifiant = 0;
  const ecouteurs = new Map();
  globalThis.getComputedStyle = () => ({ lineHeight: '28px' });
  globalThis.window = { addEventListener: (nom, fn) => ecouteurs.set(nom, fn), removeEventListener: (nom) => ecouteurs.delete(nom) };
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.requestAnimationFrame = (fn) => { frames.set(++identifiant, fn); return identifiant; };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  t.after(() => {
    for (const [nom, descriptor] of originaux) {
      if (descriptor) Object.defineProperty(globalThis, nom, descriptor);
      else delete globalThis[nom];
    }
  });
  let geometrie = [rect(40), rect(50), rect(40, 72), rect(50, 72)];
  const lettres = geometrie.map((_, i) => ({ style: {}, getBoundingClientRect: () => geometrie[i] }));
  const personnage = { style: {} };
  const papier = { scrollLeft: 0, scrollTop: 0, clientLeft: 0, clientTop: 0, clientHeight: 260,
    getBoundingClientRect: () => ({ left: 0, top: 0 }), scrollTo: () => {} };
  const etats = [];
  const progres = [];
  const fins = [];
  const moteur = creerEffacement({ papier, lettres, personnage, image: { naturalWidth: 68, naturalHeight: 158 }, nbMots: 2, vitesse: 60,
    surEtat: (s) => etats.push(s), surProgression: (p, d) => progres.push({ p, d }), surFin: (d) => fins.push(d) });
  const tick = (temps) => {
    const courantes = [...frames.values()]; frames.clear();
    for (const fn of courantes) fn(temps);
  };
  return { moteur, lettres, personnage, etats, progres, fins, frames, ecouteurs, tick,
    redimensionner: () => { geometrie = [rect(25, 10), rect(25, 60), rect(25, 110), rect(25, 160)]; ecouteurs.get('resize')(); } };
}

test('une seule boucle synchronise déplacement, effacement, pause, reprise et réaffichage', (t) => {
  const b = banc(t);
  b.tick(0);
  assert.equal(b.lettres.filter((l) => l.style.visibility === 'hidden').length, 0);
  b.moteur.demarrer(); b.moteur.demarrer();
  assert.equal(b.frames.size, 1);
  b.tick(0); b.tick(750);
  assert.equal(b.lettres.filter((l) => l.style.visibility === 'hidden').length, 2);
  const position = b.personnage.style.transform;
  b.moteur.pause(); b.tick(50000);
  assert.equal(b.personnage.style.transform, position);
  assert.equal(b.progres.at(-1).d, 750);
  assert.equal(b.frames.size, 0);
  b.moteur.reprendre(); b.tick(60000); b.tick(60250);
  assert.equal(b.progres.at(-1).d, 1000);
  assert.match(b.personnage.style.transform, /40px, 72px/);
  b.moteur.reinitialiser(); b.tick(61000);
  assert.equal(b.lettres.filter((l) => l.style.visibility === 'hidden').length, 0);
  assert.deepEqual(b.progres.at(-1), { p: 0, d: 0 });
  assert.equal(b.etats.at(-1), 'pret');
  b.moteur.detruire();
});

test('la nouvelle géométrie conserve la progression et le saut de ligne, même en pause', (t) => {
  const b = banc(t);
  b.moteur.demarrer(); b.tick(0); b.tick(1000); b.moteur.pause(); b.tick(1100);
  b.redimensionner(); b.tick(20000);
  assert.match(b.personnage.style.transform, /25px, 110px/);
  assert.equal(b.lettres.filter((l) => l.style.visibility === 'hidden').length, 2);
  assert.equal(b.progres.at(-1).d, 1000);
  b.moteur.detruire();
  assert.equal(b.frames.size, 0);
  assert.equal(b.ecouteurs.size, 0);
});

test('la durée en mots par minute reste exacte, y compris après un changement de vitesse', (t) => {
  const b = banc(t);
  b.tick(0); b.moteur.changerVitesse(120);
  b.moteur.demarrer(); b.tick(0); b.tick(250);
  b.moteur.pause(); b.tick(300); b.moteur.changerVitesse(60); b.tick(400);
  b.moteur.reprendre(); b.tick(50000); b.tick(55000);
  assert.equal(b.etats.at(-1), 'termine');
  assert.equal(b.lettres.every((l) => l.style.visibility === 'hidden'), true);
  assert.deepEqual(b.fins, [1750]);
  b.tick(60000);
  assert.equal(b.fins.length, 1);
  assert.equal(b.frames.size, 0);
  b.moteur.detruire();
});

test('les GIF remplaçables acceptent HTTPS et refusent les protocoles exécutables', () => {
  assert.equal(sourceGif(GIF_LECTURE), GIF_LECTURE);
  assert.equal(sourceGif('https://exemple.fr/ryu.gif'), 'https://exemple.fr/ryu.gif');
  for (const valeur of ['', '<script>', 'javascript:alert(1)', 'file:///secret', 'http://exemple.fr/a.gif', 'https://login:secret@exemple.fr/a.gif']) assert.equal(sourceGif(valeur), null);
});
