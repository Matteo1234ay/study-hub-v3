export const HOME_V29_RELEASE = "20260901-29";

export const HOME_V29_NODES = Object.freeze([
  "DeskRoot",
  "DrawerTop",
  "DrawerMiddle",
  "ChairRoot",
  "LampRoot",
  "LampJointLower",
  "LampJointUpper",
  "LampHead",
  "CabinetDoor",
  "PulloutShelf",
  "MonitorScreenAnchor"
]);

export const HOME_V29_CLIPS = Object.freeze([
  "LampWake",
  "ChairClear",
  "DrawerReveal",
  "DrawerSecondary",
  "CabinetOpen",
  "ShelfPull",
  "BooksRelease",
  "PaperLift"
]);

export const HOME_V29_WINDOWS = Object.freeze({
  LampWake: Object.freeze([0.12, 0.22]),
  ChairClear: Object.freeze([0.14, 0.27]),
  DrawerReveal: Object.freeze([0.18, 0.31]),
  DrawerSecondary: Object.freeze([0.23, 0.32]),
  CabinetOpen: Object.freeze([0.27, 0.39]),
  ShelfPull: Object.freeze([0.31, 0.43]),
  BooksRelease: Object.freeze([0.40, 0.58]),
  PaperLift: Object.freeze([0.43, 0.60])
});
