export type RelationshipKind = 'physical-pair' | 'same-region' | 'comparison';

export interface ObjectRelationship {
  targetId: string;
  kind: RelationshipKind;
  label: string;
  explanation: string;
}

// These are application-authored observing connections, not claims that every
// target in the same region is physically associated.
export const OBJECT_RELATIONSHIPS: Record<string, ObjectRelationship[]> = {
  m81: [{ targetId: 'm82', kind: 'physical-pair', label: 'Interacting galaxy pair', explanation: 'M81 and M82 are gravitationally interacting galaxies that share the same binocular or telescope field.' }],
  m82: [{ targetId: 'm81', kind: 'physical-pair', label: 'Interacting galaxy pair', explanation: 'M81 and M82 are gravitationally interacting galaxies that share the same binocular or telescope field.' }],
  m8: [{ targetId: 'm20', kind: 'same-region', label: 'Same Sagittarius region', explanation: 'The Lagoon and Trifid nebulae are rewarding targets along the Sagittarius Milky Way star clouds.' }],
  m20: [{ targetId: 'm8', kind: 'same-region', label: 'Same Sagittarius region', explanation: 'The Trifid and Lagoon nebulae can be explored together in the Sagittarius Milky Way.' }],
  m16: [{ targetId: 'm17', kind: 'same-region', label: 'Same Sagittarius region', explanation: 'The Eagle and Omega nebulae form a useful emission-nebula sequence through the Sagittarius star clouds.' }],
  m17: [{ targetId: 'm16', kind: 'same-region', label: 'Same Sagittarius region', explanation: 'The Omega and Eagle nebulae form a useful emission-nebula sequence through the Sagittarius star clouds.' }],
  m6: [{ targetId: 'm7', kind: 'comparison', label: 'Southern cluster comparison', explanation: 'M6 and M7 are bright southern open clusters that make a useful binocular comparison near Scorpius.' }],
  m7: [{ targetId: 'm6', kind: 'comparison', label: 'Southern cluster comparison', explanation: 'M7 and M6 are bright southern open clusters that make a useful binocular comparison near Scorpius.' }],
  m35: [{ targetId: 'm37', kind: 'comparison', label: 'Winter open-cluster comparison', explanation: 'Compare the broad star field of M35 with the denser, richer appearance of M37.' }],
  m37: [{ targetId: 'm35', kind: 'comparison', label: 'Winter open-cluster comparison', explanation: 'Compare the dense star field of M37 with the broader, brighter appearance of M35.' }],
  m3: [{ targetId: 'm13', kind: 'comparison', label: 'Globular-cluster comparison', explanation: 'M3 and M13 are excellent northern globular clusters for comparing compact, ancient stellar populations.' }],
  m13: [{ targetId: 'm3', kind: 'comparison', label: 'Globular-cluster comparison', explanation: 'M13 and M3 are excellent northern globular clusters for comparing compact, ancient stellar populations.' }],
  m42: [{ targetId: 'm78', kind: 'same-region', label: 'Orion observing sequence', explanation: 'The Orion Nebula and M78 offer contrasting views of illuminated gas and dust in the Orion region.' }],
  m78: [{ targetId: 'm42', kind: 'same-region', label: 'Orion observing sequence', explanation: 'M78 and the Orion Nebula offer contrasting views of illuminated gas and dust in the Orion region.' }],
};
