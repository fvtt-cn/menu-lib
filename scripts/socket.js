import menulib from './api.js'
const MODULE_ID = "menu-lib";

export default class Socket {

  static _socket;

  static BINDINGS = {
    ["notice"]: (...args) => notice(...args),
    ["updateFlag"]: (...args) => updateFlag(...args),
    ["choose"]: (...args) => choose(...args),
  }

  static initialize() {
    this._socket = socketlib.registerModule("menulib");
    for (let [key, callback] of Object.entries(this.BINDINGS)) {
      this._socket.register(key, callback);
      menulib.debug(`Registered ${MODULE_ID} Socket: ${key}`);
    }
    menulib.debug(`Registered all ${MODULE_ID} sockets`);
  }

  static async executeAsGM(handler, ...args) {
    return await this._socket.executeAsGM(handler, ...args);
  }

  static async executeAsUser(handler, userId, ...args) {
    return await this._socket.executeAsUser(handler, userId, ...args);
  }

  static async executeForAllGMs(handler, ...args) {
    return await this._socket.executeForAllGMs(handler, ...args);
  }

  static async executeForOtherGMs(handler, ...args) {
    return await this._socket.executeForOtherGMs(handler, ...args);
  }

  static async executeForEveryone(handler, ...args) {
    return await this._socket.executeForEveryone(handler, ...args);
  }

  static async executeForOthers(handler, ...args) {
    return await this._socket.executeForOthers(handler, ...args);
  }

  static async executeForUsers(handler, userIds, ...args) {
    return await this._socket.executeForUsers(handler, userIds, ...args);
  }

  static callHook(hook, ...args) {
    if (!Helpers.hooks.run) return;
    return this._socket.executeForEveryone("callHook", hook, ...args);
  }

  static callHookForUsers(hook, users, ...args) {
    if (!Helpers.hooks.run) return;
    return this._socket.executeForUsers("callHook", users, hook, ...args);
  }

}

async function notice(type, message) {
  switch (type) {
    case "warn": ui.notifications.warn(message); break;
    case "info": ui.notifications.info(message); break;
    default: ui.notifications.error(message); break;
  }
  return "end";
}
async function updateFlag(objectId, flag, value) {
  let object = canvas.scene.tiles.get(objectId)
    || canvas.scene.tokens.get(objectId)
    || canvas.scene.drawings.get(objectId)
    || canvas.scene.walls.get(objectId)
    || canvas.scene.lights.get(objectId)
    || game.scenes.get(objectId)
    || game.users.get(objectId);
  if (object) {
    await object.setFlag("menulib", flag, value);
  }
}
async function choose(...args) {
  let result = await menulib.choose(...args);
  return result;
}