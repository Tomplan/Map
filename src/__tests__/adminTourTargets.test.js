const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..');
const TOUR_FILE = path.join(SRC, 'config/tourSteps/adminTourSteps.js');

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' || entry.name === 'tourSteps' ? [] : listSourceFiles(full);
    }
    return /\.(jsx?|tsx?)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });
}

describe('admin tour targets', () => {
  it('every data-testid used as a tour target is rendered by a component', () => {
    const tourSource = fs.readFileSync(TOUR_FILE, 'utf8');
    const targets = [
      ...new Set(
        [...tourSource.matchAll(/element:\s*'\[data-testid="([^"]+)"\]'/g)].map((m) => m[1]),
      ),
    ];
    expect(targets.length).toBeGreaterThan(0);

    const componentSource = listSourceFiles(SRC)
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    const dynamicPrefixes = Array.from(
      componentSource.matchAll(/data-testid=\{`([^`$]*)\$\{/g),
      (m) => m[1],
    ).filter(Boolean);

    const missing = targets.filter((id) => {
      const literal = new RegExp(`data-testid=(?:"${id}"|'${id}'|\\{['"\`]${id}['"\`]\\})`);
      return !literal.test(componentSource) && !dynamicPrefixes.some((p) => id.startsWith(p));
    });

    expect(missing).toEqual([]);
  });
});
