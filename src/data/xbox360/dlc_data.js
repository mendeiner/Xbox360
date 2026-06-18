// DLC_DATA: maps game id (number) → array of DLC entries.
// Only entries with a non-null "dl" field are shown in the modal.
// "dl" shape is identical to game.dl — fill in later when you have links.
// Example dl: { part: "xbla", file: "filename.zip" }
//             { url: "https://...", file: "filename.zip" }
export const DLC_DATA = {
  // Minecraft: Xbox 360 Edition (id 432)
  432: [
    { title: "Skyrim Mash-Up Pack",         dl: null },
    { title: "Star Wars Rebels Skin Pack",   dl: null },
    { title: "Steampunk Texture Pack",       dl: null },
    { title: "Natural Texture Pack",         dl: null },
    { title: "City Texture Pack",            dl: null },
    { title: "Pattern Texture Pack",         dl: null },
    { title: "Festive 2012 Skin Pack",       dl: null },
    { title: "Candy Texture Pack",           dl: null },
    { title: "Halo Mash-Up Pack",            dl: null },
    { title: "Battle & Beasts Skin Pack",    dl: null },
  ],
};
