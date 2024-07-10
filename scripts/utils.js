import menulib from './api.js';
import * as SWPT from './constants.js'
const MODULE_ID = "menu-lib";
/**
 * //获取第一个活跃GM的id
 * @returns {string} GM的id
 */
export function getActiveGM() { 
  let gm = Array.from(game.users).find(u => u.isGM && u.active);
  if (gm) return gm._id;
}
/**
 * 检查该用户是否在线
 * @param {string} id 用户id
 * @returns {boolean} 是否在线
 */
export function userIsActive(id) { 
  return Array.from(game.users).find(u => (u._id == id)).active;
}
/**
 * 获取鼠标在地图上的位置。
 * @param {Object} object - 需要获取鼠标位置的对象。
 * @returns {Object} 返回包含鼠标在对象上的x和y坐标的对象。
 */
export function getMouseStagePos(object) {
  // 根据游戏发布版本的不同，选择合适的方式获取鼠标指针信息
  const mouse = game.release?.generation >= 11 ? canvas.app.renderer.events.pointer : canvas.app.renderer.plugins.interaction.pointer;
  // this.debug(mouse);
  // 获取鼠标在指定对象上的本地位置，并返回这个位置对象
  return mouse.getLocalPosition(object);
}
/**
 * 创建一个节流函数。
 * @param {Function} func 要节流的函数。
 * @param {number} wait 等待时间，单位为毫秒。
 * @returns {Function} 返回一个节流函数。
 */
export function debounce(func, wait) {
  let timeout;
  // 返回一个闭包函数，确保调用时的this指向不变
  return function (...args) {
    // 清除上一次的timeout，避免重复执行
    clearTimeout(timeout);
    // 设置新的timeout，实现节流逻辑
    timeout = setTimeout(() => {
      try {
        // 使用try-catch处理函数执行时可能发生的异常
        func.apply(this, args);
      } catch (error) {
        console.error('Debounced function threw an error:', error);
        // 异常的进一步处理，比如调用错误处理函数，可根据需求定制
      }
    }, wait);
  };
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
 * 根据输入数据生成对话框的HTML代码。
 * @param {Array} data - 包含对话框输入元素配置的数组。
 * @returns {string} - 包含生成的HTML代码的字符串。
 */
export function dialogInputs(data) {
  // 遍历数据数组，处理每个输入元素
  data.forEach((inputData) => {
    if (inputData.type === "select") {
      inputData.options.forEach((e, i) => {
        switch (typeof e) {
          case "string":
            inputData.options[i] = { value: e, html: e };
            break;
          case "object":
            /* 如果没有html属性，则使用value作为html属性的值 */
            inputData.options[i].html ??= inputData.options[i].value;
            if (
              !!inputData.options[i].html &&
              inputData.options[i].value != undefined
            ) {
              break;
            }
          default:
            const emsg = "select的options数组值不符合要求";
            logger.error(emsg);
            throw new Error(emsg);
        }
      });
    }
  });

  // 将数据数组映射为HTML代码字符串
  const mapped = data
    .map(({ type, label, options }, i) => {
      type = type.toLowerCase();
      switch (type) {
        case "header":
          return `<tr><td colspan = "2"><h2>${label}</h2></td></tr>`;
        case "button":
          return "";
        case "info":
          return `<tr><td colspan="2">${label}</td></tr>`;
        case "select": {
          const optionString = options
            .map((e, i) => {
              return `<option value="${i}" ${e.selected ? 'selected' : ''}>${e.html}</option>`;
            })
            .join("");

          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><select id="${i}qd">${optionString}</select></td></tr>`;
        }
        case "radio":
          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" ${(options instanceof Array ? options[1] : false)
            ? "checked"
            : ""
            } value="${i}" name="${options instanceof Array ? options[0] : options ?? "radio"
            }"/></td></tr>`;
        case "checkbox":
          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" ${(options instanceof Array ? options[0] : options ?? false)
            ? "checked"
            : ""
            } value="${i}"/></td></tr>`;
        default:
          return `<tr><th style="width:50%"><label for="${i}qd">${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" value="${options instanceof Array ? options[0] : options
            }"/></td></tr>`;
      }
    })
    .join("");

  // 构建完整的HTML表格内容
  const content = ``
    + `<table style="width:100%">`
    + `${mapped}`
    + `</table>`;

  return content;
};
/**
 * 根据数据和HTML内容，解析出相应的值。
 * 这个函数主要用于处理不同类型的表单字段，从给定的HTML片段中提取出对应的值。
 * @param {Array} data 表单数据数组，每个元素包含字段类型和选项。
 * @param {Object} html jQuery对象，表示包含表单字段的HTML片段。
 * @param {Object} options 配置对象，目前只支持一个选项checkedText，用于指示是否返回选中文字。
 * @returns {Array} 返回一个包含所有字段解析后值的数组。
 */
export function _innerValueParse(data, html, { checkedText = false }) {
  // 创建一个与data长度相同的数组，并通过map函数逐个处理每个元素。
  return Array(data.length)
    .fill()
    .map((e, i) => {
      // 解构获取当前字段的类型。
      let { type } = data[i];
      // 根据字段类型进行不同的处理。
      if (type.toLowerCase() === `select`) {
        // 如果是select类型，根据选中的选项获取值。
        return data[i].options[html.find(`select#${i}qd`).val()].value;
      } else {
        switch (type.toLowerCase()) {
          case `text`:
          case `password`:
            // 对于text和password类型，直接获取输入框的值。
            return html.find(`input#${i}qd`)[0].value;
          case `radio`:
          case `checkbox`: {
            // 对于radio和checkbox类型，判断是否选中，并根据checkedText配置决定返回值。
            const ele = html.find(`input#${i}qd`)[0];
            if (checkedText) {
              const label = html.find(`[for="${i}qd"]`)[0];
              // 如果checkedText为true且字段被选中，返回对应的标签文字。
              return ele.checked ? label.innerText : '';
            }
            // 默认情况下，返回字段的选中状态。
            return ele.checked;
          }
          case `number`:
            // 对于number类型，获取输入框的数值值。
            return html.find(`input#${i}qd`)[0].valueAsNumber;
        }
      }
    });
}
