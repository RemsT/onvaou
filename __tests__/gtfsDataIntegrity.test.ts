import * as fs from 'fs';
import * as path from 'path';

/**
 * Test de garde sur l'intégrité des données GTFS embarquées.
 *
 * Contexte : un export SNCF partiel (~17k horaires, périmé) avait remplacé
 * les données complètes (~500k horaires), causant "très peu de résultats".
 * Ces tests échouent si les données embarquées sont dégradées/incomplètes.
 */

const DATA_DIR = path.join(__dirname, '..', 'assets', 'sncf_data');

function countLines(file: string): number {
  const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  let n = 0;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) n++;
  }
  return n;
}

describe('Intégrité des données GTFS embarquées', () => {
  it('stop_times.txt contient un dataset complet (> 100 000 horaires)', () => {
    const lines = countLines('stop_times.txt');
    expect(lines).toBeGreaterThan(100_000);
  });

  it('trips.txt contient un nombre réaliste de trajets (> 10 000)', () => {
    const lines = countLines('trips.txt');
    expect(lines).toBeGreaterThan(10_000);
  });

  it('stops.txt contient un nombre réaliste de gares (> 5 000)', () => {
    const lines = countLines('stops.txt');
    expect(lines).toBeGreaterThan(5_000);
  });

  it('Lyon Part-Dieu (87723197) est présent dans stops.txt', () => {
    const content = fs.readFileSync(path.join(DATA_DIR, 'stops.txt'), 'utf8');
    expect(content).toContain('StopArea:OCE87723197');
  });

  it('Lyon Part-Dieu apparaît dans de nombreux horaires (> 500 passages)', () => {
    const content = fs.readFileSync(path.join(DATA_DIR, 'stop_times.txt'), 'utf8');
    const matches = content.match(/87723197/g) || [];
    expect(matches.length).toBeGreaterThan(500);
  });
});
