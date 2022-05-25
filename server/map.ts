type Platform = { x: number; y: number; width: number };

export const BORDER_RADIUS = 100;
export const PLATFORM_WIDTHS = [50, 150, 300];

export function generatePlatforms(mapWidth: number, mapHeight: number, chance: Chance.Chance): Platform[] {
  const numPlatforms = Math.round((mapWidth * mapHeight) / 100000);
  const platforms: Platform[] = [];
  for (let i = 0; i < numPlatforms; i++) {
    const x = chance.natural({ max: mapWidth });
    const y = chance.natural({ min: BORDER_RADIUS, max: mapHeight - BORDER_RADIUS });
    const width = chance.pickone(PLATFORM_WIDTHS);
    platforms.push({ x, y, width });
  }
  return platforms;
}
