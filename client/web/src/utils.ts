export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;

export function formatTime(ms: number) {
  const seconds = ms / 1000;
  const mStr = Math.floor(seconds / 60).toString();
  const sStr = Math.floor(seconds % 60).toString();
  return `🕰️  ${mStr.padStart(2, "0")}:${sStr.padStart(2, "0")}`;
}
