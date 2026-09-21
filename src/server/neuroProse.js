// Neuro-experiential prose model for AstroWalk.
// This module does NOT claim that astrological factors activate brain regions or
// cranial nerves. It uses established sensory, language, and motor functions as
// a disciplined narration framework: perception -> recognition -> decision ->
// speech/motor response.

const uniq = values => [...new Set((values || []).filter(Boolean))];
const cap = value => {
  const s = String(value || '').trim();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
};

const MASS_OR_PLURAL = new Set(['money','paperwork','directions','information','equipment','machinery','music','water','food','technology','documents','credentials','rules']);
function phrase(value, fallback='something important') {
  const s=String(value||fallback).trim();
  if(!s)return fallback;
  if(/^(a|an|the|your|another|someone|something|some|shared|private|public|work)\b/i.test(s))return s;
  if(MASS_OR_PLURAL.has(s.toLowerCase())||/s$/i.test(s))return s;
  const article=/^[aeiou]/i.test(s)?'an':'a';
  return `${article} ${s}`;
}

const CHANNELS = {
  visual: {
    lobe: 'occipital',
    cranialNerves: ['II'],
    notice: ({ object, actor }) => `You may first notice ${phrase(object || actor, 'a visible detail')} before anyone fully explains it`,
  },
  auditory: {
    lobe: 'temporal',
    cranialNerves: ['VIII'],
    notice: ({ object, actor }) => `Something you hear from ${phrase(actor, 'another person')} about ${phrase(object, 'the situation')} may be the first clue`,
  },
  olfactory: {
    lobe: 'temporal/limbic',
    cranialNerves: ['I'],
    notice: () => 'A smell or environmental cue may be what first draws your attention',
  },
  facial_tactile: {
    lobe: 'parietal',
    cranialNerves: ['V'],
    notice: ({ object }) => `Direct contact with ${phrase(object, 'something you are handling')} may make the issue immediately noticeable`,
  },
  spatial: {
    lobe: 'parietal',
    cranialNerves: ['II','III','IV','VI','VIII','XI'],
    notice: () => 'A change in direction, spacing, orientation, or the behavior of the route may be the first thing that alerts you',
  },
  oral_taste: {
    lobe: 'insula/parietal operculum',
    cranialNerves: ['VII','IX','X'],
    notice: () => 'An oral, taste, food, or throat-related cue may be what first makes the situation noticeable',
  },
  social_face: {
    lobe: 'temporal/frontal',
    cranialNerves: ['V','VII'],
    notice: ({ actor }) => `The expression, tone, or behavior of ${phrase(actor, 'another person')} may tell you something is changing before the facts are stated directly`,
  },
};

const SPEECH_OUTPUTS = {
  clarify: ['ask for clarification','repeat the important detail back','question what does not add up'],
  negotiate: ['state your terms clearly','negotiate a change','ask the other person to confirm the agreement'],
  instruct: ['give a direct instruction','explain what needs to be corrected','tell someone what you need next'],
  warn: ['warn someone about the problem','say what needs immediate attention','make the risk explicit'],
  agree: ['confirm the useful part of the offer','accept help while clarifying the conditions','state what you are willing to agree to'],
  decline: ['refuse the part that does not work for you','set a boundary','say that the arrangement needs to change'],
};

const MOTOR_OUTPUTS = {
  inspect: ['stop and inspect the detail','check the object, document, device, or vehicle involved','look more closely before continuing'],
  reroute: ['change direction','take a different route','reposition yourself before continuing'],
  wait: ['pause before acting','wait for confirmation','hold position until the missing information arrives'],
  approach: ['approach the relevant person or place','move closer to verify what is happening','go directly to the source of the issue'],
  leave: ['step away from the situation','leave the setting if the terms become unworkable','disengage and continue elsewhere'],
  correct: ['correct the detail immediately','make the practical adjustment','handle the problem before it grows'],
};

const textHas = (value, words) => words.some(w => String(value || '').toLowerCase().includes(w));

function chooseChannel(candidate) {
  const all = `${candidate.object || ''} ${candidate.action || ''} ${candidate.terminologyEvent || ''} ${candidate.modifier || ''} ${candidate.place || ''} ${candidate.actor || ''}`.toLowerCase();
  const nak = String(candidate.context?.nakshatra || '').toLowerCase();
  const pid = candidate.planetId;

  if (nak === 'shravana' || textHas(all,['call','conversation','message','announcement','music','sound','instruction','listen','speech'])) return 'auditory';
  if (textHas(all,['sign','screen','document','phone','display','ticket','book','receipt','light','appearance','visible','read'])) return 'visual';
  if (textHas(all,['food','taste','restaurant','meal','drink','throat','swallow'])) return 'oral_taste';
  if (textHas(all,['smell','smoke','odor','perfume','chemical'])) return 'olfactory';
  if (textHas(all,['turn','route','direction','vehicle','parking','street','detour','balance','orientation','driver'])) return 'spatial';
  if (textHas(all,['touch','face','jaw','pressure','handle','tool','machinery','repair item'])) return 'facial_tactile';
  if (candidate.house === 7 || textHas(all,['partner','client','customer','stranger','person','negotiat','agreement'])) return 'social_face';
  if (pid === 'mercury') return 'visual';
  if (pid === 'moon' || pid === 'venus') return 'social_face';
  if (pid === 'mars' || candidate.house === 3 || candidate.house === 9) return 'spatial';
  return 'visual';
}

function recognitionSentence(c, channel) {
  const object = phrase(c.object, 'the detail');
  const actor = phrase(c.actor, 'another person');
  const condition = c.condition || 'changing circumstances';
  const source = channel === 'auditory' ? 'what you hear' : channel === 'visual' ? 'what you see' : channel === 'spatial' ? 'the change in the situation around you' : 'the cue';

  if (c.tone === 'challenging') {
    return `It may become clear from ${source} that ${object} needs correction, verification, or firmer boundaries because ${condition} is complicating the situation`;
  }
  if (c.tone === 'constructive') {
    return `It may become clear from ${source} that ${actor} or ${object} can be useful if you recognize the opening and respond directly`;
  }
  return `You may recognize that ${object} is more important than it first appears, and that a decision or clarification is needed`;
}

function speechMode(c) {
  if(c.tone==='challenging') return c.planetId==='saturn'?'clarify':'warn';
  const text = `${c.action || ''} ${c.condition || ''} ${c.terminologyEvent || ''}`.toLowerCase();
  if (textHas(text,['agree','contract','cooperat','offer','help'])) return 'agree';
  if (textHas(text,['negotiat','terms','payment','price','agreement'])) return 'negotiate';
  if (textHas(text,['conflict','argument','risk','urgent','pressure'])) return 'warn';
  if (textHas(text,['refuse','restrict','withdraw','separat','delay'])) return 'decline';
  if (textHas(text,['repair','correct','instruction','work','service'])) return 'instruct';
  return 'clarify';
}

function motorMode(c) {
  const text = `${c.action || ''} ${c.object || ''} ${c.place || ''} ${c.condition || ''}`.toLowerCase();
  if (textHas(text,['route','direction','detour','vehicle','parking','street'])) return 'reroute';
  if (textHas(text,['delay','wait','restriction','bureaucracy'])) return 'wait';
  if (textHas(text,['repair','correct','fix','tool','machinery'])) return 'correct';
  if (textHas(text,['leave','withdraw','separation','disengage'])) return 'leave';
  if (textHas(text,['person','counter','office','shop','business','meeting'])) return 'approach';
  return 'inspect';
}

function deterministicChoice(list, seed = '') {
  if (!list?.length) return '';
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

export function buildExperienceSequence(candidate) {
  if (!candidate) return null;
  const channelId = chooseChannel(candidate);
  const channel = CHANNELS[channelId] || CHANNELS.visual;
  const speech = deterministicChoice(SPEECH_OUTPUTS[speechMode(candidate)], `${candidate.id}|speech`);
  const motor = deterministicChoice(MOTOR_OUTPUTS[motorMode(candidate)], `${candidate.id}|motor`);
  const notice = channel.notice(candidate);
  const recognition = recognitionSentence(candidate, channelId);

  let decision;
  if (candidate.tone === 'challenging') decision = `The useful decision is likely to be to verify the facts before committing, then ${motor}`;
  else if (candidate.tone === 'constructive') decision = `The opening is most useful if you act on it deliberately rather than passively, then ${motor}`;
  else decision = `You may need to choose between continuing as planned and making a practical adjustment, then ${motor}`;

  const speechOutput = candidate.house === 2 || candidate.house === 3 || candidate.house === 7 || candidate.house === 9 || candidate.planetId === 'mercury'
    ? `If another person is involved, you may ${speech}`
    : '';

  return {
    sensoryEntry: { channel: channelId, lobe: channel.lobe, cranialNerves: channel.cranialNerves, text: notice },
    recognition: { lobe: channelId === 'spatial' ? 'parietal' : 'temporal/frontal integration', text: recognition },
    decision: { lobe: 'frontal', text: decision },
    speechOutput: speechOutput ? { systems: ['auditory','somatosensory','motor'], cranialNerves: ['V','VII','IX','X','XII'], text: speechOutput } : null,
    motorOutput: { text: motor },
  };
}

export function experienceProse(candidate) {
  const seq = buildExperienceSequence(candidate);
  if (!seq) return '';
  const parts = [
    `${seq.sensoryEntry.text}.`,
    `${seq.recognition.text}.`,
    `${seq.decision.text}.`,
    seq.speechOutput ? `${seq.speechOutput.text}.` : '',
  ].filter(Boolean);

  if (candidate.terminologyEvent) parts.push(`A concrete form of this could be ${candidate.terminologyEvent}.`);
  return parts.join(' ');
}

export function experienceSummary(candidate) {
  const seq = buildExperienceSequence(candidate);
  if (!seq) return null;
  return {
    notice: seq.sensoryEntry.text,
    recognize: seq.recognition.text,
    decide: seq.decision.text,
    speak: seq.speechOutput?.text || '',
    act: seq.motorOutput.text,
    sensoryChannel: seq.sensoryEntry.channel,
  };
}

export const NEURO_PROSE_MODEL = {
  name: 'perception-recognition-decision-response',
  disclaimer: 'Brain and cranial-nerve functions are used as a narration framework only; AstroWalk does not claim astrological factors activate, diagnose, or alter specific neural structures.',
  stages: ['sensory entry','recognition','decision','speech/motor response'],
};
