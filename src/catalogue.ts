import { Body } from 'astronomy-engine';
import type { CatalogueObject } from './types';

export const CATALOGUE: CatalogueObject[] = [
  {
    id: 'sun', name: 'Sun', kind: 'sun', body: Body.Sun, magnitude: -26.74,
    classification: 'G-type main-sequence star',
    description: 'The star at the centre of the Solar System and the source of daylight.',
    guidance: 'Never look at the Sun through optics without a certified solar filter.', color: '#ffd36a',
  },
  {
    id: 'moon', name: 'Moon', kind: 'moon', body: Body.Moon, magnitude: -12.7,
    classification: 'Natural satellite',
    description: 'Earth’s natural satellite. Its changing phase and position are calculated for this observation time.',
    guidance: 'Easy naked-eye target. Binoculars reveal craters along the terminator.', color: '#e6e8ed',
  },
  {
    id: 'mercury', name: 'Mercury', kind: 'planet', body: Body.Mercury, magnitude: -0.4,
    classification: 'Terrestrial planet',
    description: 'The innermost planet, usually found low in the twilight sky near the Sun.',
    guidance: 'Look only when the Sun is safely below the horizon and use a clear horizon.', color: '#b9a78f',
  },
  {
    id: 'venus', name: 'Venus', kind: 'planet', body: Body.Venus, magnitude: -4.2,
    classification: 'Terrestrial planet',
    description: 'A cloud-covered world and the brightest planet seen from Earth.',
    guidance: 'A superb naked-eye target near sunset or sunrise; binoculars can reveal its phase.', color: '#f7d7a1',
  },
  {
    id: 'mars', name: 'Mars', kind: 'planet', body: Body.Mars, magnitude: 1.0,
    classification: 'Terrestrial planet',
    description: 'The red planet, whose apparent brightness changes with its distance from Earth.',
    guidance: 'Naked-eye target when bright; a telescope may show a small disk and polar features.', color: '#dc7958',
  },
  {
    id: 'jupiter', name: 'Jupiter', kind: 'planet', body: Body.Jupiter, magnitude: -2.4,
    classification: 'Gas giant',
    description: 'The largest planet in the Solar System, bright enough to stand out among the stars.',
    guidance: 'Easy naked-eye target. Binoculars may show the four largest moons.', color: '#e4c39b',
  },
  {
    id: 'saturn', name: 'Saturn', kind: 'planet', body: Body.Saturn, magnitude: 0.7,
    classification: 'Gas giant with a ring system',
    description: 'A ringed world whose slow orbital motion is distinct from its nightly apparent motion.',
    guidance: 'Naked-eye target when above the horizon; a small telescope reveals the rings.', color: '#e3c27b',
  },
  {
    id: 'uranus', name: 'Uranus', kind: 'planet', body: Body.Uranus, magnitude: 5.7,
    classification: 'Ice giant',
    description: 'A distant ice giant near the naked-eye limit under dark skies.',
    guidance: 'Use binoculars or a telescope and a precise finder chart.', color: '#a9d9db',
  },
  {
    id: 'neptune', name: 'Neptune', kind: 'planet', body: Body.Neptune, magnitude: 7.8,
    classification: 'Ice giant',
    description: 'The farthest major planet, visible as a tiny blue disk through a telescope.',
    guidance: 'Requires a telescope and a detailed finder chart; it is not a naked-eye target.', color: '#6586d8',
  },
  {
    id: 'sirius', name: 'Sirius', kind: 'star', raJ2000: 6.75248, decJ2000: -16.7161, distanceLightYears: 8.6, magnitude: -1.46,
    classification: 'A-type main-sequence star', description: 'The brightest star in Earth’s night sky, in Canis Major.',
    guidance: 'An excellent naked-eye starting point; its brightness makes it easy to identify.', color: '#dce8ff',
  },
  {
    id: 'canopus', name: 'Canopus', kind: 'star', raJ2000: 6.3992, decJ2000: -52.6957, distanceLightYears: 310, magnitude: -0.74,
    classification: 'F-type bright giant', description: 'A luminous southern star and the second-brightest star in the night sky.',
    guidance: 'Best seen from southern latitudes or low southern horizons.', color: '#fff2d4',
  },
  {
    id: 'arcturus', name: 'Arcturus', kind: 'star', raJ2000: 14.261, decJ2000: 19.1825, distanceLightYears: 36.7, magnitude: -0.05,
    classification: 'K-type red giant', description: 'A bright orange giant in Boötes and a useful guide star for spring skies.',
    guidance: 'Follow the arc of the Big Dipper’s handle to reach Arcturus.', color: '#ffc487',
  },
  {
    id: 'vega', name: 'Vega', kind: 'star', raJ2000: 18.61565, decJ2000: 38.7837, distanceLightYears: 25, magnitude: 0.03,
    classification: 'A-type main-sequence star', description: 'A bright blue-white star in Lyra and one corner of the Summer Triangle.',
    guidance: 'Easy naked-eye target; use it to orient toward the Summer Triangle.', color: '#dce8ff',
  },
  {
    id: 'capella', name: 'Capella', kind: 'star', raJ2000: 5.27815, decJ2000: 45.998, distanceLightYears: 42.9, magnitude: 0.08,
    classification: 'Multiple-star system', description: 'A bright multiple system in Auriga, prominent in northern winter skies.',
    guidance: 'Naked-eye target with a warm white colour; binoculars help reveal its field.', color: '#fff0c2',
  },
  {
    id: 'rigel', name: 'Rigel', kind: 'star', raJ2000: 5.2423, decJ2000: -8.2016, distanceLightYears: 860, magnitude: 0.13,
    classification: 'Blue supergiant', description: 'The bright blue-white foot of Orion and one of the most luminous nearby stars.',
    guidance: 'Find Orion first; Rigel is the bright star at the hunter’s lower-right foot.', color: '#c8dcff',
  },
  {
    id: 'betelgeuse', name: 'Betelgeuse', kind: 'star', raJ2000: 5.9195, decJ2000: 7.4071, distanceLightYears: 640, magnitude: 0.5,
    classification: 'Red supergiant', description: 'An orange-red supergiant marking Orion’s shoulder.',
    guidance: 'Compare its orange colour with Rigel across Orion.', color: '#ffae78',
  },
  {
    id: 'aldebaran', name: 'Aldebaran', kind: 'star', raJ2000: 4.5987, decJ2000: 16.5093, distanceLightYears: 65.3, magnitude: 0.85,
    classification: 'K-type giant', description: 'An orange giant that marks the eye of Taurus.',
    guidance: 'Use the three stars of Orion’s Belt to point toward the V-shaped Hyades field.', color: '#ffc284',
  },
  {
    id: 'polaris', name: 'Polaris', kind: 'star', raJ2000: 2.5303, decJ2000: 89.2641, distanceLightYears: 433, magnitude: 1.98,
    classification: 'Multiple-star system / Cepheid variable', description: 'The North Star, close to the north celestial pole.',
    guidance: 'Its altitude is approximately your latitude, making it a useful orientation check.', color: '#f4f1dc',
  },
  {
    id: 'antares', name: 'Antares', kind: 'star', raJ2000: 16.4901, decJ2000: -26.4319, distanceLightYears: 550, magnitude: 1.06,
    classification: 'Red supergiant', description: 'An orange-red supergiant and the heart of Scorpius.',
    guidance: 'Look low in the southern sky during the warmer months in the northern hemisphere.', color: '#ff9a70',
  },
  {
    id: 'altair', name: 'Altair', kind: 'star', raJ2000: 19.8464, decJ2000: 8.8683, distanceLightYears: 16.7, magnitude: 0.77,
    classification: 'A-type main-sequence star', description: 'A rapidly rotating bright star in Aquila and part of the Summer Triangle.',
    guidance: 'Look for a bright star flanked by two fainter stars in Aquila.', color: '#e9edff',
  },
  {
    id: 'spica', name: 'Spica', kind: 'star', raJ2000: 13.4199, decJ2000: -11.1614, distanceLightYears: 250, magnitude: 0.98,
    classification: 'Massive binary star system', description: 'A blue-white binary system and the brightest star in Virgo.',
    guidance: 'Follow the arc from the Big Dipper toward Arcturus, then continue to Spica.', color: '#cbdcff',
  },
  {
    id: 'deneb', name: 'Deneb', kind: 'star', raJ2000: 20.6905, decJ2000: 45.2803, distanceLightYears: 2600, magnitude: 1.25,
    classification: 'Blue-white supergiant', description: 'A distant luminous supergiant forming the northern point of the Summer Triangle.',
    guidance: 'Find the Summer Triangle with Vega and Altair; Deneb is its northern point.', color: '#d7e2ff',
  },
  {
    id: 'fomalhaut', name: 'Fomalhaut', kind: 'star', raJ2000: 22.9608, decJ2000: -29.6222, distanceLightYears: 25.1, magnitude: 1.16,
    classification: 'A-type main-sequence star', description: 'A bright solitary star in Piscis Austrinus with a debris disk.',
    guidance: 'Look for a single bright star low in the southern sky during autumn evenings.', color: '#e3ecff',
  },
];

export const DEFAULT_OBJECT_ID = 'vega';

export function getObject(id: string): CatalogueObject {
  return CATALOGUE.find((object) => object.id === id) ?? CATALOGUE[0];
}
