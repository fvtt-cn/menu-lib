import menulib from './api.js'
import Socket from "./socket.js";

export class MultiChooseDialog extends FormApplication {
    constructor(options) {
        super(options);
        foundry.utils.mergeObject(this.options, options);
        //console.log(this);
        this.data = {};
        this.data.num = options?.num ?? 1;
        /** @type {MenuOption[]} */
        let optionsData = options.options ?? [];
        optionsData = optionsData.map((option) => {
            option.label = option.label ?? option.name;
            option.name = option.name ?? option.label;
            option.requirement = option.requirement ?? "";
            option.requirementNum = option.requirementNum ?? 1;
            option.description = option.description ?? option.label;
            option.cost = option.cost ?? 1;
            option.max = option.max ?? 1;
            option.min = option.min ?? 0;
            option.disabled = option.disabled ?? false;
            option.num = option.num ?? option.min;
            return option;
        });
        //name必须唯一
        optionsData = optionsData.filter((option, index, self) => {
            return self.findIndex(o => o.name === option.name) === index;
        });
        this.data.options = optionsData;
        this.requirementHandle();
        this.inFlight = false;
        this.cancelled = true;
        if (options.title) this.showtitle = options.title;
        if (options.content) this.showData = options.content;
    }

    static get defaultOptions() {
        // menulib.debug("MultiChooseDialog", this);
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: './modules/menulib/templates/multichoose-dialog.hbs',
            // id: 'multichoose-dialog',
            title: "选择",
            resizable: true,
            width: 300,
            height: "auto",
            left: game.user?.getFlag("menulib", "multiChooseDialogPos.left") ?? "auto",
            top: game.user?.getFlag("menulib", "multiChooseDialogPos.top") ?? "auto",
            submitOnClose: true,
            // close: () => { Hooks.call('closeMultiChooseDialog'); }
        });
    }

    get title() {
        return this.showtitle ?? "选择";
    }
    // get id() {
    //     return "multichoose-dialog-" + this.title;
    // }

    async getData() {
        // menulib.debug("Getting data...", this);
        // let options = this.data.options;
        let content = this.showData;
        // Hooks.once('closeMultiChooseDialog', async () => {
        //     menulib.debug("closeMultiChooseDialog", this);
        // });
        return {
            data: this.data,
            content: content
        };
    }
    async _onPlus(event) {
        event.stopPropagation();
        let option = this.data.options.find((o) => o.name == event.currentTarget.dataset.id);
        // menulib.debug("_onPlus", event.currentTarget.dataset.id, option);
        if ((this.data.num <= 0) || (option.num >= option.max)) {
            menulib.notice('warn', "已达到最大可选次数");
        } else if (this.data.num < option.cost) {
            menulib.notice('warn', "剩余可选次数不足");
        } else {
            this.data.num -= option.cost;
            option.num++;
            this.requirementHandle();
            await this.render(true);
        }
    }
    async _onMinus(event) {
        event.stopPropagation();
        let option = this.data.options.find((o) => o.name == event.currentTarget.dataset.id);
        // menulib.debug("_onMinus", event.currentTarget.dataset.id, option);
        if (option.num <= option.min) {
            menulib.notice('warn', "无法减少更多次数");
        } else {
            this.data.num += option.cost;
            option.num--;
            this.requirementHandle();
            await this.render(true);
        }
    }
    activateListeners(html) {
        //console.log(html);
        super.activateListeners(html);
        html = html[0] ?? html;

        html.querySelectorAll(".btnPlusNum").forEach((btn) => {
            btn.addEventListener("click", this._onPlus.bind(this));
        });
        html.querySelectorAll(".btnMinusNum").forEach((btn) => {
            btn.addEventListener("click", this._onMinus.bind(this));
        });
    }
    async _updateObject(event, formData) {
        // menulib.debug("_updateObject", event, formData);
        if (event.target) {
            this.cancelled = false;
        }
        await Socket.executeAsGM("updateFlag", game.user.id, "multiChooseDialogPos", { left: this.position.left, top: this.position.top });
        this.inFlight = false;
    }
    async drawPreview() {
        this.inFlight = true;
        await this.render(true);
        await menulib.waitFor(() => !this.inFlight, -1);
        return this;
    }
    requirementHandle() {
        this.data.options.forEach((option) => {
            if (option.requirement) {
                let requirementOption = this.data.options.find((o) => o.name === option.requirement);
                if (requirementOption && (requirementOption?.num >= option?.requirementNum)) {
                    option.disabled = false;
                } else {
                    option.disabled = true;
                    if (option.num > option.min) {
                        this.data.num += (option.num - option.min) * option.cost;
                        option.num = option.min;
                    }
                }
            }
        });
    }
}
export default MultiChooseDialog;

/**
 * @typedef {Object} MenuOption
 * @property {string} label 此选项的标签元素的显示文本。接受HTML。
 * @property {string} name 此选项的名称属性。用于标识此选项以支持前置需求，默认等于label。必须唯一。
 * @property {string} requirement 此选项的前置需求。如果为空，则此选项始终可用。如果为字符串则指向一个名称属性，如果该属性被选中一定次数，则此选项可用。
 * @property {number} requirementNum 此选项的前置需求的数量，默认为1。如果为正整数，则此选项的前置需求的数量必须达到此值，此选项才可用。
 * @property {string} description 此选项的描述。接受HTML。
 * @property {number} cost 选择此选项的花费。默认为1。
 * @property {number} max 此选项的最大可选次数。默认为1。
 * @property {number} min 此选项的最小可选次数。默认为0。
 * @property {boolean} disabled 此选项是否禁用。默认为false。
 * @property {number} num 此选项的当前选中次数。默认为min。
 */