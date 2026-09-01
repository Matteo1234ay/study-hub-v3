export const HOME_V30_ASSET_ID = "study-hub-home-v30";

export const HOME_V30_NODES = Object.freeze([
  "V30_Root",
  "Desk_Root",
  "Drawer_Primary",
  "Drawer_Secondary",
  "Chair_Root",
  "Lamp_Root",
  "Cabinet_Root",
  "Cabinet_Door",
  "Monitor_Root",
  "Monitor_Screen_Anchor",
  "Paper_Stack",
  "Notebook_Root",
  "ArchiveOrigin_Paths",
  "ArchiveOrigin_Review",
  "ArchiveOrigin_Progress",
  "ArchiveOrigin_Assessment",
  "ArchiveOrigin_Search"
]);

export const HOME_V30_CLIPS = Object.freeze([
  "Drawer_Primary_Open",
  "Drawer_Secondary_Open",
  "Cabinet_Door_Open",
  "Lamp_Adjust",
  "Chair_Shift",
  "Paper_Lift",
  "Notebook_Lift",
  "Monitor_Info_Reveal"
]);

export const HOME_V30_WINDOWS = Object.freeze({
  Drawer_Primary_Open: Object.freeze([.15, .28]),
  Drawer_Secondary_Open: Object.freeze([.20, .34]),
  Cabinet_Door_Open: Object.freeze([.24, .38]),
  Lamp_Adjust: Object.freeze([.18, .36]),
  Chair_Shift: Object.freeze([.20, .36]),
  Paper_Lift: Object.freeze([.38, .54]),
  Notebook_Lift: Object.freeze([.43, .58]),
  Monitor_Info_Reveal: Object.freeze([.40, .60])
});

export const HOME_V30_ARCHIVE_ORIGINS = Object.freeze({
  "future-paths": "ArchiveOrigin_Paths",
  memory: "ArchiveOrigin_Review",
  progress: "ArchiveOrigin_Progress",
  assessment: "ArchiveOrigin_Assessment",
  search: "ArchiveOrigin_Search"
});
