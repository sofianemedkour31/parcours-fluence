import assert from 'node:assert/strict';
import test from 'node:test';
import { completerPeriodes, deplacerTexteVersPeriode } from '../src/lib/periodes.js';
import { trouverTexteSemaine } from '../src/lib/semaine.js';

test('les anciens brouillons deviennent cinq périodes sans perdre leurs textes ni le choix de la semaine', () => {
  const texte = { id: 'mon-texte', titre: 'Mon texte', valide: true, activites: { lecture: { vitesse: 40 } } };
  const contenu = { parcours: [{ id: 1, nom: 'Parcours 1', textes: [] }, { id: 5, nom: 'Parcours NMD', textes: [texte], reglages: { vitesse: 40 } }], texteSemaine: { parcoursId: 5, texteId: texte.id } };
  assert.equal(completerPeriodes(contenu), true);
  assert.deepEqual(contenu.parcours.map((p) => p.nom), ['Période 1', 'Période 2', 'Période 3', 'Période 4', 'Période 5']);
  assert.equal(trouverTexteSemaine(contenu).texte, texte);
  assert.equal(contenu.parcours[4].reglages.vitesse, 40);
  assert.equal(completerPeriodes(contenu), false);
});

test('un fichier sans textes dispose des cinq périodes, y compris la cinquième', () => {
  const contenu = {};
  completerPeriodes(contenu);
  assert.equal(contenu.parcours.length, 5);
  assert.ok(contenu.parcours.every((p) => p.textes.length === 0));
});

test('déplacer le texte de la semaine conserve sa validation, ses activités et son accès élève', () => {
  const contenu = {};
  completerPeriodes(contenu);
  const texte = { id: 'semaine', valide: true, activites: { lecture: { actif: true } } };
  contenu.parcours[0].textes.push(texte);
  contenu.texteSemaine = { parcoursId: 1, texteId: texte.id };
  assert.equal(deplacerTexteVersPeriode(contenu, texte, contenu.parcours[0], contenu.parcours[2]), true);
  assert.equal(contenu.parcours[0].textes.length, 0);
  assert.equal(trouverTexteSemaine(contenu).parcours.id, 3);
  assert.equal(trouverTexteSemaine(contenu).texte, texte);
  assert.equal(texte.valide, true);
  assert.equal(texte.activites.lecture.actif, true);
});

test('un déplacement refuse un identifiant déjà présent sans écraser aucun texte', () => {
  const texte = { id: 'identique', texte: 'Source' };
  const source = { id: 1, textes: [texte] };
  const destination = { id: 2, textes: [{ id: 'identique', texte: 'Destination' }] };
  assert.equal(deplacerTexteVersPeriode({ parcours: [source, destination] }, texte, source, destination), false);
  assert.equal(source.textes[0], texte);
  assert.equal(destination.textes[0].texte, 'Destination');
});
