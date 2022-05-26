import { PLATFORM_HEIGHT } from "../shared/constants";

type Platform = { x: number; y: number; width: number };

export const BORDER_RADIUS = 64;
export const PLATFORM_WIDTHS = [64, 160, 320];

export function generatePlatforms(mapWidth: number, mapHeight: number, chance: Chance.Chance): Platform[] {
  const numPlatforms = Math.round((mapWidth * mapHeight) / 100000);
  const platforms: Platform[] = [];
  for (let i = 0; i < numPlatforms; i++) {
    const x = chance.natural({ max: mapWidth });
    const y =
      (chance.natural({ min: BORDER_RADIUS, max: mapHeight - BORDER_RADIUS }) / PLATFORM_HEIGHT) * PLATFORM_HEIGHT;
    const width = chance.pickone(PLATFORM_WIDTHS);
    platforms.push({ x, y, width });
  }
  return platforms;
}
