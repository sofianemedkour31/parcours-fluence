import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { activitesDisponibles, fusionnerCorpus } from '../src/donnees.js';
import { erreursTexte } from '../src/lib/validation.js';

const corpus = JSON.parse(readFileSync(new URL('../public/contenu/parcours.json', import.meta.url), 'utf8'));

test('les cinq parcours conservent leurs textes et les textes validés sont publiables', () => {
  assert.deepEqual(corpus.parcours.map((p) => p.textes.length), [15, 15, 15, 15, 7]);
  assert.equal(corpus.parcours[4].nom, 'Parcours NMD');
  assert.deepEqual(corpus.parcours[4].textes.map((t) => t.titre.match(/support (\d+)/)?.[1]), ['1', '2', '3', '4', '5', '6', '7']);
  assert.deepEqual(corpus.parcours[4].textes.map((t) => t.id),
    ['p5-texte-06', 'p5-texte-07', 'p5-texte-01', 'p5-texte-02', 'p5-texte-03', 'p5-texte-04', 'p5-texte-05']);
  for (const p of corpus.parcours) for (const [index, t] of p.textes.entries()) {
    if (p.id !== 5) assert.equal(t.id, `p${p.id}-texte-${String(index + 1).padStart(2, '0')}`);
    assert.ok(t.titre && t.texte.length >= 100);
    if (t.valide) assert.deepEqual(erreursTexte(t, p), []);
    if (p.id === 5) assert.ok(Object.values(activitesDisponibles(t)).every(Boolean));
  }
});

test('un ancien brouillon reçoit les textes sans perdre ses changements', () => {
  const modifie = { ...structuredClone(corpus.parcours[0].textes[0]), texte: 'Ma correction locale.' };
  const personnel = { id: 'personnel', titre: 'Mon texte', texte: 'Un texte personnel.' };
  const brouillon = { version: 1, parcours: [{ id: 1, textes: [modifie, personnel] }] };

  assert.equal(fusionnerCorpus(brouillon, corpus), true);
  assert.equal(brouillon.corpusVersion, corpus.corpusVersion);
  assert.deepEqual(brouillon.parcours.map((p) => p.textes.length), [16, 15, 15, 15, 7]);
  assert.equal(brouillon.parcours[0].textes[0], modifie);
  assert.equal(brouillon.parcours[0].textes.at(-1), personnel);
  assert.equal(fusionnerCorpus(brouillon, corpus), false);
  assert.deepEqual(brouillon.parcours.map((p) => p.textes.length), [16, 15, 15, 15, 7]);
});

test('un brouillon NMD garde les supports 3 à 7 et reçoit les supports 1 et 2 en tête', () => {
  const anciens = structuredClone(corpus.parcours[4].textes.slice(2));
  anciens[0].titre = 'Titre corrigé dans le studio';
  const brouillon = { version: 1, corpusVersion: 2, parcours: [{ id: 5, textes: anciens }] };

  assert.equal(fusionnerCorpus(brouillon, corpus), true);
  assert.deepEqual(brouillon.parcours[0].textes.map((t) => t.id), corpus.parcours[4].textes.map((t) => t.id));
  assert.equal(brouillon.parcours[0].textes[2], anciens[0]);
  assert.equal(brouillon.parcours[0].textes[2].titre, 'Titre corrigé dans le studio');
});
