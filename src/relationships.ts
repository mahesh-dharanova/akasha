export type RelationshipKind = 'physical-pair' | 'same-region' | 'comparison';

export interface LearningLesson {
  title: string;
  summary: string;
  steps: string[];
}

export interface ObjectRelationship {
  targetId: string;
  kind: RelationshipKind;
  lessonId: string;
  label: string;
  explanation: string;
}

// These are application-authored observing connections, not claims that every
// target in the same region is physically associated.
export const LEARNING_LESSONS: Record<string, LearningLesson> = {
  'm81-m82': {
    title: 'Compare an interacting galaxy pair',
    summary: 'Use the pair to separate a true physical relationship from a simple line-of-sight grouping.',
    steps: ['Find M81 first as the brighter oval glow.', 'Move to M82 and compare its narrower, edge-on shape.', 'Notice that both galaxies occupy one compact field and are gravitationally interacting.'],
  },
  'm8-m20': {
    title: 'Trace the Sagittarius nebulae',
    summary: 'Follow a rich Milky Way region and compare two kinds of illuminated gas and dust.',
    steps: ['Start with the Sagittarius star clouds as your wide-field landmark.', 'Locate the Lagoon Nebula, then sweep toward the Trifid Nebula.', 'Compare their shapes, brightness, and dark dust structure through binoculars or a telescope.'],
  },
  'm16-m17': {
    title: 'Follow a star-forming sequence',
    summary: 'Use two nearby Sagittarius targets to practise moving between bright emission nebulae.',
    steps: ['Begin at the Eagle Nebula in the Sagittarius Milky Way.', 'Sweep to the Omega Nebula using a low-power view.', 'Compare how nebular shape and contrast change with magnification and filters.'],
  },
  'm6-m7': {
    title: 'Compare southern open clusters',
    summary: 'Bright open clusters make a useful first lesson in comparing star density and field size.',
    steps: ['Use Scorpius as the shared southern landmark.', 'Observe M7 as the broad, loose cluster.', 'Compare it with the more compact butterfly-like pattern of M6.'],
  },
  'm35-m37': {
    title: 'Compare winter star fields',
    summary: 'Two open clusters show how different densities can look even at similar observing difficulty.',
    steps: ['Find Auriga and Gemini in the winter sky.', 'Observe the broad field of M35 first.', 'Compare its pattern with the denser, richer appearance of M37.'],
  },
  'm3-m13': {
    title: 'Compare ancient globular clusters',
    summary: 'Globular clusters are compact populations of old stars, ideal for a before-and-after telescope lesson.',
    steps: ['Use Arcturus or Hercules as the first navigation landmark.', 'Observe the soft, unresolved glow of one cluster.', 'Compare the second cluster and look for the point where a telescope begins resolving stars.'],
  },
  'm42-m78': {
    title: 'Explore contrasting Orion clouds',
    summary: 'The Orion region lets you compare glowing emission gas with reflected starlight.',
    steps: ['Start with Orion’s Belt and locate the bright Orion Nebula.', 'Move north-east to the fainter M78 region.', 'Compare the broad emission glow of M42 with the compact reflection glow of M78.'],
  },
};

export const OBJECT_RELATIONSHIPS: Record<string, ObjectRelationship[]> = {
  m81: [{ targetId: 'm82', kind: 'physical-pair', lessonId: 'm81-m82', label: 'Interacting galaxy pair', explanation: 'M81 and M82 are gravitationally interacting galaxies that share the same binocular or telescope field.' }],
  m82: [{ targetId: 'm81', kind: 'physical-pair', lessonId: 'm81-m82', label: 'Interacting galaxy pair', explanation: 'M81 and M82 are gravitationally interacting galaxies that share the same binocular or telescope field.' }],
  m8: [{ targetId: 'm20', kind: 'same-region', lessonId: 'm8-m20', label: 'Same Sagittarius region', explanation: 'The Lagoon and Trifid nebulae are rewarding targets along the Sagittarius Milky Way star clouds.' }],
  m20: [{ targetId: 'm8', kind: 'same-region', lessonId: 'm8-m20', label: 'Same Sagittarius region', explanation: 'The Trifid and Lagoon nebulae can be explored together in the Sagittarius Milky Way.' }],
  m16: [{ targetId: 'm17', kind: 'same-region', lessonId: 'm16-m17', label: 'Same Sagittarius region', explanation: 'The Eagle and Omega nebulae form a useful emission-nebula sequence through the Sagittarius star clouds.' }],
  m17: [{ targetId: 'm16', kind: 'same-region', lessonId: 'm16-m17', label: 'Same Sagittarius region', explanation: 'The Omega and Eagle nebulae form a useful emission-nebula sequence through the Sagittarius star clouds.' }],
  m6: [{ targetId: 'm7', kind: 'comparison', lessonId: 'm6-m7', label: 'Southern cluster comparison', explanation: 'M6 and M7 are bright southern open clusters that make a useful binocular comparison near Scorpius.' }],
  m7: [{ targetId: 'm6', kind: 'comparison', lessonId: 'm6-m7', label: 'Southern cluster comparison', explanation: 'M7 and M6 are bright southern open clusters that make a useful binocular comparison near Scorpius.' }],
  m35: [{ targetId: 'm37', kind: 'comparison', lessonId: 'm35-m37', label: 'Winter open-cluster comparison', explanation: 'Compare the broad star field of M35 with the denser, richer appearance of M37.' }],
  m37: [{ targetId: 'm35', kind: 'comparison', lessonId: 'm35-m37', label: 'Winter open-cluster comparison', explanation: 'Compare the dense star field of M37 with the broader, brighter appearance of M35.' }],
  m3: [{ targetId: 'm13', kind: 'comparison', lessonId: 'm3-m13', label: 'Globular-cluster comparison', explanation: 'M3 and M13 are excellent northern globular clusters for comparing compact, ancient stellar populations.' }],
  m13: [{ targetId: 'm3', kind: 'comparison', lessonId: 'm3-m13', label: 'Globular-cluster comparison', explanation: 'M13 and M3 are excellent northern globular clusters for comparing compact, ancient stellar populations.' }],
  m42: [{ targetId: 'm78', kind: 'same-region', lessonId: 'm42-m78', label: 'Orion observing sequence', explanation: 'The Orion Nebula and M78 offer contrasting views of illuminated gas and dust in the Orion region.' }],
  m78: [{ targetId: 'm42', kind: 'same-region', lessonId: 'm42-m78', label: 'Orion observing sequence', explanation: 'M78 and the Orion Nebula offer contrasting views of illuminated gas and dust in the Orion region.' }],
};
