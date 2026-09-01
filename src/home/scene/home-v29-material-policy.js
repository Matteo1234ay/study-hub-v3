export const HOME_V29_PHYSICAL_FAMILIES = Object.freeze([
  "walnut",
  "graphite",
  "fabric",
  "paper",
  "glass",
  "plaster"
]);

export const HOME_V29_BLUE_USAGE = Object.freeze([
  "screen-accent",
  "led-accent",
  "archive-emissive"
]);

export function isAllowedBlueUsage(label = "") {
  const value = String(label).toLowerCase();
  return HOME_V29_BLUE_USAGE.some(token => value.includes(token));
}
