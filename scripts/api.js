import * as Utilities from './utils.js'
import Socket from "./function/socket.js";
import { Propagator } from './function/propagator.js'
import { Crosshairs } from './function/template.js'
import Spell from './precode/spells.js'
import * as SWPT from './constants.js'
import { MissileDialog } from "./function/missile-dialog.js";
import { MultiChooseDialog } from "./function/multichoose-dialog.js";
import * as Ammo from "./function/ammo_management.js";
import { PreparSlot } from "./function/prepar-slot.js";
import { SpellBook } from "./function/spell-book.js";
import { Backpack } from './function/backpack.js';
import { ScrollSlot } from './function/scroll-slot.js';
import SWPTRoll from './function/roll.js';
import ItemDialog from './function/roll-dialog.js';
import Socket from './function/socket.js';
const MODULE_ID = "menu-lib";

export default class menulib {
  /**
   * 选择复数token作为目标并标记（抄自ase的魔法飞弹功能）
   * @param {number} num 选择的目标数量
   * @param {boolean} unique token是否只能被选择1次，默认为否
   * @param {object} options 播放的特效选项
   * @param {string} options.markerAnim 标记特效路径，使用sequence进行播放
   * @returns {Promise<Token[]>} 返回选择的token数组
   */
  static async multiTargetTokens(num = 1, unique = true, options = { markerAnim: "jb2a.shield.02.loop.red", targetMarkerHue: 0, targetMarkerSaturation: 0, baseScale: 0.05 }) {
    let app = new MissileDialog({ numMissiles: num, effectOptions: options, unique: unique });
    let result = await app.drawPreview();
    if (result.cancelled) {
      return false;
    } else {
      let tokens = result.data.returnTargets;
      tokens.forEach(token => {
        token.setTarget(true, { releaseOthers: false, groupSelection: true });
      })
      return tokens;
    }
  }
  /**
   * 弹出一个输入框提示玩家输入咒文，若预设答案则进行比对并返回布尔值（是否等于答案），若不预设答案则返回输入的内容
   * 关键词key则是检测输入内容中是否包含某种关键词，并返回其中包含的关键词数组。keys参数需要为字符串数组。keys参数和answer参数同时存在时，先判断答案，如果对不上才会识别关键词
   * @param {object} option 选项对象
   * @param {string} option.title 窗口标题
   * @param {string} option.label 输入框的标签
   * @param {string} option.info 输入框的提示信息
   * @param {string | false} option.answer 预设答案，若预设答案则进行比对并返回布尔值（是否等于答案）
   * @param {string | string[]} option.keys 关键词，检测输入内容中是否包含某种关键词，并返回其中包含的关键词数组
   * @param {'text' | 'number' | 'select'} option.type 输入框的类型，默认为text
   * @param {string | {value:string,html:string}[]} option.options 输入框中的默认值，当type为select时则为下拉选项的数组
   * @param {string} option.button 确定按钮的文本
   * @returns {Promise<string | boolean | string[]>} 返回输入的内容或布尔值或关键词数组
   */
  static async mantra(option = { label: "咒文：", info: "请输入咒文", answer: false, keys: false, type: 'text', options: "", button: "确定", title: "咒文" }) {
    let inputs = [];
    let options = option.options ?? false;
    if (options == false) {
      switch (option.type ?? 'text') {
        case 'text': options = ''; break;
        case 'number': options = 0; break;
        case 'select': options = [{ value: '正面', html: '正面' }, { value: '反面', html: '反面' }]; break;
        default: options = ''; break;
      }
    }
    inputs.push({
      type: option.type ?? 'text',
      label: option.label ?? "咒文：",
      options: options
    });
    if (typeof option.info == "string") {
      inputs.push({
        type: 'info',
        label: option.info ?? "请输入咒文"
      });
    }
    const results = await menulib.menu({
      inputs: inputs,
      buttons: [
        { label: option.button ?? '确定', value: "OK" },
        { label: '取消', value: "cancel" }
      ]
    }, {
      title: option.title ?? '咒文'
    });

    if (results.buttons === "OK") {
      if (option.answer ?? false) {
        if (results.inputs[0] == option.answer) {
          return true;
        } else {
          return false;
        }
      }
      if (option.keys ?? false) {
        if (typeof option.keys == 'string') {
          if (results.inputs[0].includes(option.keys)) {
            return option.keys;
          } else {
            return false;
          }
        } else if (Array.isArray(option.keys)) {
          let output = [];
          option.keys.forEach(key => {
            if (results.inputs[0].includes(key)) {
              output.push(key);
            }
          })
          if (output.length <= 0) {
            return false;
          } else {
            return output;
          }
        } else {
          if (results.inputs[0] == option.keys) {
            return option.keys;
          } else {
            return false;
          }
        }
      }
      return results.inputs[0];
    }
  }
  /**
   * 弹出一个选择框提示玩家选择选项，需要提供传入参数为预设选项，返回被选择的选项。
   * 若选项参数为某种对象的数组而非字符串数组，则还需要传入路径参数指出界面上的各选项显示的内容。
   * 比如当选项数组为物品数组，物品数组作为非字符串对象无法显示，需要传入'name'参数指出显示的内容为物品的名称。
   * 你也可以更深度的传参路径，比如传参为['system','name']或'system.name'，则会依次取出system.name的值作为显示的内容。
   * @param {object} option 选项对象
   * @param {string} option.title 窗口标题
   * @param {string} option.label 选择框的标签
   * @param {string} option.info 选择框的提示信息
   * @param {any[]} option.options 选项数组
   * @param {string | string[]} option.path 路径参数
   * @param {string} option.button 确定按钮的文本
   * @param {boolean} option.mode 选择模式，true为按钮模式，false为下拉框模式，默认根据选项数量自动选择，大于6个为下拉框模式
   * @returns {Promise<any>} 返回被选择的选项
   */
  static async choose(option = { label: "选择：", info: "请选择选项", options: [], path: false, button: "确定", title: "选择", mode: undefined }) {
    let options = option.options ?? [];
    if (options.length <= 0) {
      menulib.notice("warn", "未传递选项内容！");
      return false;
    }
    if (typeof options[0] != 'string' && option.path) {
      if (typeof option.path == 'string') {
        keys = option.path.split('.');
        keys.forEach(key => {
          options = options.map(o => o[key]);
        })
      } else if (Array.isArray(option.path)) {
        let keys = option.path.join('.');
        keys = keys.split('.');
        keys.forEach(key => {
          options = options.map(o => o[key]);
        })
      }
    }
    if (option?.mode === undefined) {
      option.mode = options.length > 6 ? false : true;
    }
    if (option.mode ?? true) {
      let buttons = [];
      for (let i = 0; i < options.length; i++) {
        buttons.push({ label: options[i], value: option.options[i] });
      }
      return await menulib.buttonDialog({ buttons: buttons, title: option.title ?? "选择", content: option.info ?? "请选择选项" });
    } else {
      let inputs = [];
      let selects = [];
      for (let i = 0; i < options.length; i++) {
        selects.push({ html: options[i], value: option.options[i] });
      }
      inputs.push({
        type: 'select',
        label: option.label ?? "选择：",
        options: selects
      });
      if (typeof option.info == "string") {
        inputs.push({
          type: 'info',
          label: option.info ?? "请选择选项"
        });
      }
      const results = await menulib.menu({
        inputs: inputs,
        buttons: [
          { label: option.button ?? '确定', value: "OK" },
          { label: '取消', value: "cancel" }
        ]
      }, {
        title: option.title ?? '选择'
      });

      if (results.buttons === "OK") {
        // if (typeof options[0] != 'string' && option.path) {
        //   return option.options[options.findIndex(results.inputs[0])];
        // } else {
        return results.inputs[0];
        // }
      }
    }
  }
  //选择多次，不重复选择
  static async chooseMulti(num = 2, option = { label: "选择：", info: "请选择选项", options: [], path: false, button: "确定", title: "选择", mode: undefined }) {
    let choosed = [];
    for (let i = 0; i < num; i++) {
      let options = option.options ?? [];
      if (options.length <= 0) {
        menulib.notice("warn", "未传递选项内容！");
        return false;
      }
      //不重复
      options = options.filter(o => !choosed.includes(o));
      let result = await menulib.choose({ label: option.label ?? "选择：", info: option.info ?? "请选择选项", options: options, path: option.path ?? false, button: option.button ?? "确定", title: option.title ?? "选择", mode: option.mode ?? undefined });
      if (result === false) {
        break;
      } else {
        choosed.push(result);
      }
    }
    return choosed;
  }
  /**
   * @typedef {Object} MenuOption
   * @property {string} label 此选项的标签元素的显示文本。接受HTML。
   * @property {string} name 此选项的名称属性。用于标识此选项以支持前置需求，默认等于label。
   * @property {string} requirement 此选项的前置需求。如果为空，则此选项始终可用。如果为字符串则指向一个名称属性，如果该属性被选中一定次数，则此选项可用。
   * @property {number} requirementNum 此选项的前置需求的数量，默认为1。如果为正整数，则此选项的前置需求的数量必须达到此值，此选项才可用。
   * @property {string} description 此选项的描述。接受HTML。
   * @property {number} cost 选择此选项的花费。默认为1。
   * @property {number} max 此选项的最大可选次数。默认为1。
   * @property {number} min 此选项的最小可选次数。默认为0。
   * @property {boolean} disabled 此选项是否禁用。默认为false。
   * @property {number} num 此选项的当前选中次数。默认为min。
   */
  /**
   * 复杂选择，总点数池和每个选项消耗的点数及可选择次数
   * @param {object} options 选项对象
   * @param {number} options.num 总点数池
   * @param {MenuOption[]} options.options 选项数组
   * @param {string} options.title 窗口标题
   * @param {string} options.content 窗口内容
   * @returns {Promise<{num:number,options:MenuOption[]} | false>} 返回选择结果和剩余点数
   */
  static async multiChooseDialog(options = { num: 1, options: {}, title: "选择", content: "请选择选项" }) {
    let app = new MultiChooseDialog({ num: options.num, options: options.options, title: options.title, content: options.content });
    let result = await app.drawPreview();
    if (result.cancelled) {
      return false;
    } else {
      return result.data;
    }
  }
  /**
   * 以角色的身份发一段文字
   * @param {Actor} speaker 角色
   * @param {string} content 发言内容
   * @param {boolean} chatBubble 是否显示聊天气泡
   * @returns {Promise<ChatMessage>} 聊天信息
   */
  static async say(speaker, content, chatBubble = false) {
    let speakerData = ChatMessage.getSpeaker({ actor: menulib.getActor(speaker) });
    let chatData = {
      user: game.user.id,
      speaker: speakerData,
      content: content,
      type: 2,
    };
    let createOptions = {};
    if (chatBubble && menulib.getToken(speaker)) {
      createOptions = { chatBubble: true };
    }
    return await ChatMessage.create(chatData, createOptions);
  }
  //给指定的token弹框选择，并返回他们的选择结果
  static async AskTokensChoose(tokens, option = { label: "选择：", info: "请选择选项", options: [], path: false, button: "确定", title: "选择", mode: true, chat: true }) {
    let results = [];
    //数组处理
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }
    //逐一弹框
    tokens.forEach(async token => {
      let userId = await menulib.getTokenUserId(token);
      let choosed;
      if (userId && Utilities.userIsActive(userId)) {
        choosed = await Socket.executeAsUser("choose", userId, option);
      } else if (Utilities.getActiveGM()) {
        choosed = await Socket.executeAsGM("choose", option);
      } else {
        ui.notifications.warn("找不到可以投骰的用户！只能由你来选择了！");
        choosed = await menulib.choose(option);
      }
      let result = {
        token: token,
        choosed: choosed
      }
      //输出到聊天框
      if (option.chat ?? true) {
        let message = `<p>${token.name} 选择了 ${choosed}</p>`;
        await menulib.say(token, message);
      }
      // menulib.debug(result);
      results.push(result);
    });
    // menulib.debug(results.length == tokens.length, results);
    await menulib.waitFor(() => (results.length == tokens.length), -1);
    return results;
  }
  /**
   * 获取token的actor数据，如果传入的本就是actor则返回其本身
   * @param {Actor|Token|TokenDocument|SwadeActor|PrototypeToken} tokenD token数据
   * @returns {Actor} 返回actor数据
   */
  static getActor(tokenD) { //当传递的actor是token时也能正确获取到对应的actor
    // let actor = tokenD;
    if (tokenD?.constructor?.name == "Token" || tokenD?.constructor?.name == "SwadeToken" || tokenD?.constructor?.name == "TokenDocument") {
      return tokenD.actor;
    }
    if (tokenD?.constructor?.name == "SwadeActor") {
      return tokenD;
    }
    if (tokenD?.constructor?.name == "PrototypeToken") {
      return tokenD.parent;
    }
    menulib.debug("getActor", tokenD, tokenD?.constructor, tokenD?.constructor?.name);
    menulib.notice('error', `错误的数据类型：${tokenD?.constructor?.name}`);
    return tokenD?.actor;
  }
  /**
   * 获取actor的token数据，从地图上找到对应的token，如果找到多个则返回数组，如果传入的本就是token则返回其本身
   * @param {Actor|Token|TokenDocument|SwadeActor|PrototypeToken} actor actor数据
   * @returns {Token} 返回token数据
   */
  static getToken(actor) {
    // let actor = tokenD;
    if (actor?.constructor?.name == "Token" || actor?.constructor?.name == "SwadeToken") {
      return actor;
    }
    if (actor?.constructor?.name == "TokenDocument") {
      return actor._object;
    }
    if (actor?.constructor?.name == "SwadeActor") {
      if (actor.token == null) {
        let result = canvas.tokens.placeables.filter(token => {
          return token.actor == actor;
        })
        if (result.length >= 1) {
          return result[0];
        } else {
          menulib.notice('error', `找不到对应的token：${actor.name}`);
          return undefined;
        }
      } else {
        return actor.token._object;
      }
    }
    if (actor?.constructor.name == "PrototypeToken") {
      let result = canvas.tokens.placeables.filter(token => {
        return token.actor.prototypeToken == actor;
      })
      if (result.length >= 1) {
        return result[0];
      } else {
        menulib.notice('error', `找不到对应的token：${actor.name}`);
        return undefined;
      }
    }
    menulib.debug("getToken", actor, actor?.constructor, actor?.constructor?.name);
    menulib.notice('error', `错误的数据类型：${actor?.constructor?.name}`);
    return actor;
  }
  /**
   * 获取token的当前在线的拥有者，返回用户id，当拥有者不在线时返回GM的id，当拥有者离线且GM也离线时返回undefined，当存在多名拥有者在线时弹出窗口由当前用户选择哪个用户进行操作
   * @param {Token|Actor} tokenD token数据
   * @param {string} operate 操作名称，默认为"投骰"，只影响弹出窗口的提示信息
   * @returns 
   */
  static async getTokenUserId(tokenD, operate = "投骰") {
    let users = Array.from(game.users).filter(u => (u.active && menulib.getActor(tokenD).ownership[u._id] == 3));
    let ActiveGM = Utilities.getActiveGM();
    // this.debug("getTokenUserId",users,ActiveGM)
    if (users.length == 0) {
      return ActiveGM;
    } else if (users.length == 1) {
      return users[0]._id;
    } else {
      let usersN = users.map(u => { return { value: u.id, html: u.name } });
      if (ActiveGM) {
        usersN.unshift({ value: ActiveGM, html: "GM" });
      }
      const results = await menulib.menu({
        inputs: [
          { type: 'info', label: `<h2 style="text-align:center;">选择由谁为 ${tokenD.name} 进行 ${operate}</h2>` },
          { type: 'select', label: `选择 ${operate} 的用户：`, options: usersN }
        ],
        buttons: [
          { label: `要求 ${operate}`, value: "OK" },
          { label: '取消', value: "cancel" }
        ]
      }, {
        title: `选择 ${operate} 用户`
      });

      if (results.buttons === "OK") {
        return results.inputs[1];
        // if (results.inputs[1] === "GM") {
        //   return ActiveGM;
        // } else {
        //   return users.filter(u => (u.name == results.inputs[1]))[0]._id;
        // }
      } else {
        return undefined
      }
    }
  }
  /**
   * 向当前用户弹出消息提示，类型可以为info、warn或error（默认），返回字符串"end"
   * @param {'error' | 'warn' | 'info' | string} type 消息类型，默认为error
   * @param {string} message 消息内容
   * @returns {"end"} 返回字符串"end"
   */
  static async notice(type, message) {
    switch (type) {
      case "warn": ui.notifications.warn(message); break;
      case "info": ui.notifications.info(message); break;
      default: ui.notifications.error(message); break;
    }
    return "end";
  }
  /**
   * 向所有GM用户弹出消息提示，类型可以为info、warn或error（默认），返回字符串"end"
   * @param {'error' | 'warn' | 'info' | string} type 消息类型，默认为error
   * @param {string} message 消息内容
   * @returns {"end"} 返回字符串"end"
   */
  static async noticeAllGMs(type, message) {
    return Socket.executeForAllGMs("notice", type, message);
  }
  /**
   * 在控制台打印信息，用于debug，同console.log
   * @param  {...any} args 任意需要打印的内容
   */
  static debug(...args) {
    console.log('-----------------------------');
    args.forEach(arg => console.log(arg));
    console.log('-----------------------------');
  }
  /**
   * 异步函数wait，用于等待一定时间。
   * @param {number} ms 等待的时间，以毫秒为单位。
   * @returns {Promise} 返回一个无意义Promise对象。
   */
  static async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
 * 等待直到给定的函数返回true，或者达到最大迭代次数
 * @param {() => boolean} fn 要等待的函数，返回true时停止等待
 * @param {number} maxIter 最大迭代次数
 * @param {number} iterWaitTime 每次迭代的等待时间
 * @param {number} i 迭代次数
 * @returns {Promise<boolean>} 是否等待成功
 */
  static async waitFor(fn, maxIter = 600, iterWaitTime = 100, i = 0) {
    const continueWait = (current, max) => {
      // 负的最大迭代次数表示无限等待
      if (maxIter < 0) return true;
      return current < max;
    }
    while (!fn(i, ((i * iterWaitTime) / 100)) && continueWait(i, maxIter)) {
      // 当函数返回false，并且还未达到最大迭代次数时，执行以下操作
      i++;
      await menulib.wait(iterWaitTime);
    }
    // 如果达到最大迭代次数，则返回false，否则返回true
    return i === maxIter ? false : true;
  }

  /**
   * __`options` 属性详情__
   * | 输入类型 | 选项类型 | 默认值 | 描述 |
   * |--|--|--|--|
   * | header, info | `无` | `undefined` | 被忽略 |
   * | text, password, number | `string` | `''` | 输入的初始值 |
   * | checkbox | `boolean` | `false` | 初始选中状态 |
   * | radio | `[string, boolean]` | `['radio', false]` | 分别为组名和初始选中状态 |
   * | select | `{html: string, value: 任意类型, selected: boolean}[]` 或 `string[]` | `[]` | 选择项元素的HTML字符串，如果选中将返回的值，以及初始状态。如果仅提供了字符串，它将同时作为HTML和返回值使用。 |
   * @typedef {Object} MenuInput
   * @property {string} type 输入类型，控制显示和返回值。参见上方的“options属性详情”，以及 {@link MenuResult MenuResult.button}。
   * @property {string} label 此输入的标签元素的显示文本。接受HTML。
   * @property {boolean|string|Array<string|boolean>} [options] 参见上方的“options属性详情”。
   */
  /**
   * @callback MenuCallback
   * @param {MenuResult} result 用户为此菜单选择的值（通过引用）。可用于修改或扩展返回值。
   * @param {HTMLElement} html 菜单DOM元素。
   */
  /**
   * @typedef {object} MenuButton
   * @property {string} label 此按钮的显示文本，接受HTML。
   * @property {*} value 如果选中，将返回的任意对象。
   * @property {MenuCallback} [callback] 当此按钮被选中时额外执行的回调。可用于修改菜单的结果对象。
   * @property {boolean} [default] 任何真值将设置此按钮为‘提交’或‘ENTER’对话事件的默认按钮。如果没有提供，则使用最后一个提供的按钮。
   */
  /**
   * @typedef {object} MenuConfig
   * @property {string} title='Prompt' 对话框标题
   * @property {string} defaultButton='Ok' 如果没有提供其他按钮，则为按钮的标签
   * @property {boolean} checkedText=false 对于类型为`'checkbox'`或`'radio'`的输入，返回相关标签的`innerText`（不含HTML）而不是其选中状态。
   * @property {Function} close=((resolve)=>resolve({buttons:false})) 如果在没有选择按钮的情况下关闭菜单时，覆盖默认行为和返回值。
   * @property {function(HTMLElement):void} render=()=>{} 
   * @property {object} options 传递给Dialog选项参数。
   */
  /**
   * __`inputs` 返回详情__
   * | 输入类型 | 返回类型 | 描述 |
   * |--|--|--|
   * | header, info | `undefined` | 无返回值 |
   * | text, password, number | `string` | 最终输入的值 |
   * | checkbox, radio | `boolean\|string` | 最终选中状态。使用`checkedText`时，未选中结果为`""`，选中结果为`label`。 |
   * | select | `任意类型` | 所选下拉选项的`value`，由 {@link MenuInput MenuInput.options[i].value} 提供 |
   * @typedef {object} MenuResult
   * @property {Array} inputs 参见上方的“inputs返回详情”。
   * @property {*} buttons 所选菜单按钮的`value`，由 {@link MenuButton MenuButton.value} 提供
   */
  /**
   * 异步创建一个对话框，该对话框包含一组按钮，点击按钮将返回按钮预定义的返回值。
   * 
   * @param {Object} data - 对话框的配置数据。
   * @param {string} data.title - 对话框的标题。
   * @param {string} data.content - 对话框的内容。
   * @param {Array<{label: string, value:*}>} data.buttons - 按钮的配置数组，每个元素包含label和value属性。
   * @param {string} [direction="row"] - 按钮排列的方向，默认为水平排列。
   * @param {Object} [data.options] - 对话框的其他配置选项。
   * @returns {Promise} 返回一个Promise对象，当点击按钮或关闭对话框时解析。
   */
  static async buttonDialog(data, direction = "row") {
    return await new Promise(async (resolve) => {
      /** 
       * 存储按钮配置的对象，键为按钮标签，值为包含标签和回调函数的对象。 
       * @type {Object<string, object>}
       */
      let buttons = {},
        dialog;

      // 遍历data.buttons，构建buttons对象
      data.buttons.forEach((button) => {
        buttons[button.label] = {
          label: button.label,
          callback: () => resolve(button?.value ?? button.label),
        };
      });

      // 创建对话框实例，配置包括标题、内容、按钮和关闭回调
      dialog = new Dialog(
        {
          title: data.title ?? "",
          content: data.content ?? "",
          buttons,
          close: () => resolve(false),
        },
        {
          /*width: '100%',*/
          height: "100%",
          ...data.options,
        }
      );

      // 等待对话框渲染完成
      await dialog._render(true);
      // 根据direction调整按钮的排列方向
      dialog.element.find(".dialog-buttons").css({
        "flex-direction": direction,
      });
    });
  }
  /**
 * 异步创建一个自定义对话框，用于显示输入字段和按钮。
 * @param {Object} prompts - 包含输入字段定义的对象，默认为空对象。
 * @param {Array<MenuInput>} [prompts.inputs] - 输入字段的数组。
 * @param {Array<MenuButton>} [prompts.buttons] - 按钮的数组。
 * @param {MenuConfig} config - 配置对话框行为和外观的对象，默认为空对象。
 * @returns {Promise<MenuResult>} 返回一个Promise，解析为包含用户输入和按钮点击结果的对象。
 */
  static async menu(prompts = {}, config = {}) {
    /* 定义对话框的默认配置 */
    /* 添加默认的可选参数 */
    const configDefaults = {
      title: "Prompt",
      defaultButton: "Ok",
      render: null,
      close: (resolve) => resolve({ buttons: false }),
      options: {},
    };

    /* 合并用户配置和默认配置 */
    const { title, defaultButton, render, close, checkedText, options } =
      foundry.utils.mergeObject(configDefaults, config);
    /* 合并用户定义的输入字段和按钮与默认值 */
    const { inputs, buttons } = foundry.utils.mergeObject(
      { inputs: [], buttons: [] },
      prompts
    );

    /* 返回一个Promise，处理对话框的显示和用户交互 */
    return await new Promise((resolve) => {
      /* 根据输入字段定义生成对话框内容 */
      let content = Utilities.dialogInputs(inputs);
      /* 用于存储按钮的定义 */
      /** @type Object<string, object> */
      let buttonData = {};
      /* 默认选中的按钮标签 */
      let def = buttons.at(-1)?.label;
      /* 遍历按钮列表，定义按钮的行为 */
      buttons.forEach((button) => {
        /* 设置默认按钮 */
        if ("default" in button) def = button.label;
        /* 为按钮定义回调函数，处理用户点击 */
        buttonData[button.label] = {
          label: button.label,
          callback: (html) => {
            /* 解析用户输入并准备结果 */
            const results = {
              inputs: Utilities._innerValueParse(inputs, html, { checkedText }),
              buttons: button.value,
            };
            /* 如果按钮定义了回调函数，则调用该函数 */
            if (button.callback instanceof Function)
              button.callback(results, html);
            /* 解析Promise，传递结果 */
            return resolve(results);
          },
        };
      });

      /* 如果没有定义任何按钮，添加一个默认按钮 */
      /* 插入标准确认按钮 */
      if (buttons.length < 1) {
        def = defaultButton;
        buttonData = {
          [defaultButton]: {
            label: defaultButton,
            callback: (html) =>
              resolve({
                inputs: Utilities._innerValueParse(inputs, html, { checkedText }),
                buttons: true,
              }),
          },
        };
      }

      /* 创建并渲染对话框 */
      new Dialog(
        {
          title,
          content,
          default: def,
          close: (...args) => close(resolve, ...args),
          buttons: buttonData,
          render,
        },
        { focus: true, ...options }
      ).render(true);
    });
  }
}