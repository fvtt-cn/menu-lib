const MODULE_ID = 'menu-lib';
import menulib from './api.js'
import Socket from "./function/socket.js";
Hooks.once('init', function () {
    console.log("menulib init");
    window.menulib = menulib;
});

Hooks.once("socketlib.ready", () => {
    Socket.initialize();
});

// Hooks.on("updateToken", async (...args) => { if (!game.user.isGM) return; menulib.debug("updateToken", ...args); });
// Hooks.on("deleteToken", async (...args) => { if (!game.user.isGM) return; menulib.debug("deleteToken", ...args); });
// Hooks.on("updateTile", async (...args) => { if (!game.user.isGM) return; menulib.debug("updateTile", ...args); });
// Hooks.on("deleteTile", async (...args) => { if (!game.user.isGM) return; menulib.debug("deleteTile", ...args); });
// Hooks.on("updateMeasuredTemplate", async (...args) => { if (!game.user.isGM) return; menulib.debug("updateMeasuredTemplate", ...args); });
// Hooks.on("deleteMeasuredTemplate", async (...args) => { if (!game.user.isGM) return; menulib.debug("deleteMeasuredTemplate", ...args); });
// Hooks.on("updatePlaceableObject", async (...args) => { if (!game.user.isGM) return; menulib.debug("updatePlaceableObject", ...args); });
// Hooks.on("deletePlaceableObject", async (...args) => { if (!game.user.isGM) return; menulib.debug("deletePlaceableObject", ...args); });
// Hooks.on("updateItem", async (...args) => { if (!game.user.isGM) return; menulib.debug("updateItem", ...args); });
// Hooks.on("deleteItem", async (...args) => { if (!game.user.isGM) return; menulib.debug("deleteItem", ...args); });
// Hooks.on("createItem", async (...args) => { if (!game.user.isGM) return; menulib.debug("createItem", ...args); });
// Hooks.on("updateActiveEffect", async (...args) => { if (!game.user.isGM) return; menulib.debug("updateActiveEffect", ...args); });
// Hooks.on("deleteActiveEffect", async (...args) => { if (!game.user.isGM) return; menulib.debug("deleteActiveEffect", ...args); });
// Hooks.on("createActiveEffect", async (...args) => { if (!game.user.isGM) return; menulib.debug("createActiveEffect", ...args); });

// Hooks.on("applyActiveEffect", async (...args) => { if (!game.user.isGM) return; menulib.debug("applyActiveEffect", ...args); });  //没有用
// Hooks.on("dropActorSheetData", async (...args) => { if (!game.user.isGM) return; menulib.debug("dropActorSheetData", ...args); });
// Hooks.on("chatMessage", async (...args) => { if (!game.user.isGM) return; menulib.debug("chatMessage", ...args); });  //没有用
// Hooks.on("renderChatMessage", async (app, html, data) => { if (!game.user.isGM) return; menulib.debug("renderChatMessage", app, html, data); });
// Hooks.on('renderChatLog', async (app, html, data) => { if (!game.user.isGM) return; menulib.debug("renderChatLog", app, html, data); });
// Hooks.on('renderChatPopout', async (app, html, data) => { if (!game.user.isGM) return; menulib.debug("renderChatPopout", app, html, data); });
// Hooks.on("renderActorSheet", async (...args) => { if (!game.user.isGM) return; menulib.debug("renderActorSheet", ...args); });  //actorSheet, html
// Hooks.on("renderSidebarTab", async (...args) => { if (!game.user.isGM) return; menulib.debug("renderSidebarTab", ...args); });
// Hooks.on("renderItemSheet", async (...args) => { if (!game.user.isGM) return; menulib.debug("renderItemSheet", ...args); });
// Hooks.on("applyTokenStatusEffect", async (...args) => { if (!game.user.isGM) return; menulib.debug("applyTokenStatusEffect", ...args); });  //没有用

// Hooks.on("updateCombat", async (entity,data,options,userid) => { if (!game.user.isGM) return; menulib.debug("updateCombat", entity,data,options,userid); });