import assert from 'node:assert/strict';
import test from 'node:test';

test('une lecture remplacée ou arrêtée avant son départ ne se prononce pas', async () => {
  const anciennes = { window: globalThis.window, utterance: globalThis.SpeechSynthesisUtterance };
  const prononces = [];
  const voixFr = { lang: 'fr-FR', name: 'Voix française' };
  let voixChargees = false;
  const synthese = {
    cancel() {},
    getVoices: () => voixChargees ? [{ lang: 'en-US', name: 'English' }, voixFr] : [],
    addEventListener() {},
    speak(utterance) { prononces.push(utterance); utterance.onend?.(); },
  };
  globalThis.window = { speechSynthesis: synthese };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; }
  };

  try {
    const { dire, taire } = await import(`../src/voix.js?test=${Date.now()}`);
    const ancienne = dire('ancien mot');
    const nouvelle = dire('nouveau mot');
    voixChargees = true;
    await Promise.all([ancienne, nouvelle]);
    assert.deepEqual(prononces.map((u) => u.text), ['nouveau mot']);
    assert.equal(prononces[0].voice, voixFr);

    const annulee = dire('mot annulé');
    taire();
    await annulee;
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.deepEqual(prononces.map((u) => u.text), ['nouveau mot']);
  } finally {
    if (anciennes.window === undefined) delete globalThis.window;
    else globalThis.window = anciennes.window;
    if (anciennes.utterance === undefined) delete globalThis.SpeechSynthesisUtterance;
    else globalThis.SpeechSynthesisUtterance = anciennes.utterance;
  }
});
