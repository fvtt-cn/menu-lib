import menulib from './api.js'
import * as Utilities from './utils.js'
import Socket from "./socket.js";

export class MissileDialog extends FormApplication {
    constructor(options) {
        super(options);
        foundry.utils.mergeObject(this.options, options);
        //console.log(this);
        this.data = {};
        this.data.numMissiles = options?.numMissiles;
        // this.data.numMissilesMax = options.numMissiles;
        // this.data.caster = options.casterId;
        // this.data.itemCardId = options.itemCardId;
        // this.data.item = options.item;
        // this.data.actionType = options?.actionType || "other";
        this.data.effectOptions = options?.effectOptions ?? {};
        this.data.targets = [];
        this.inFlight = false;
        this.cancelled = true;
        this.data.returnTargets = [];
        this.data.unique = options.unique ?? true;
    }

    static get defaultOptions() {
        //console.log(this);
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: './modules/menulib/templates/missile-dialog.html',
            id: 'missile-dialog',
            title: "选择目标",
            resizable: true,
            width: "auto",
            height: "auto",
            left: game.user?.getFlag("menulib", "missileDialogPos.left") ?? "auto",
            top: game.user?.getFlag("menulib", "missileDialogPos.top") ?? "auto",
            submitOnClose: true,
            close: () => { Hooks.call('closeMissileDialog'); }
        });
    }

    async _applyMarker(target) {
        //console.log('type: ',type);
        let markerAnim = this.data?.effectOptions?.markerAnim ?? "jb2a.shield.02.loop.red";
        // const markerSound = this.data.effectOptions.markerSound ?? "";
        // const markerSoundDelay = this.data.effectOptions.markerSoundDelay ?? 0;
        // const markerSoundVolume = this.data.effectOptions.markerVolume ?? 1;
        const markerAnimHue = this.data?.effectOptions?.targetMarkerHue ?? 0;
        const markerAnimSaturation = this.data?.effectOptions?.targetMarkerSaturation ?? 0;

        let baseScale = this.data?.effectOptions?.baseScale ?? 0.05;
        let currMissile = this.data.targets.map(targetData => {
            return { id: targetData.id, missilesAssigned: targetData.missilesAssigned };
        }).filter(t => t.id == target.id)[0]?.missilesAssigned ?? 0;//target.document.getFlag("advancedspelleffects", "missileSpell.missileNum") ?? 0;
        //console.log("Current missile number: ", currMissile);
        //console.log("Missiles currently assigned to target...", currMissile);
        let baseOffset = canvas.grid.size / 2;
        let offsetMod = (-(1 / 4) * currMissile) + 1;
        // console.log("offset Modifier: ", offsetMod);
        let offset = { x: -baseOffset * offsetMod * target.document.width, y: -baseOffset * target.document.height }
        let markerSeq = new Sequence("SWPT Target")
            // .sound()
            // .file(markerSound)
            // .delay(markerSoundDelay)
            // .volume(markerSoundVolume)
            // .playIf(markerSound != "")
            .effect()
            .file(markerAnim)
            .attachTo(target, { bindRotation: false, offset: offset })
            .aboveInterface()
            .filter("ColorMatrix", { hue: markerAnimHue, saturate: markerAnimSaturation })
            .locally()
            .scaleToObject(0.05)
            .name(`missile-target-${target.id}-${currMissile}`)
            // .offset(offset)
            .duration(300000)
            .animateProperty("sprite", "scale.x", { from: 1, to: baseScale * 100, delay: 200, duration: 700, ease: "easeOutBounce" })
            .animateProperty("sprite", "scale.y", { from: 1, to: baseScale * 100, duration: 900, ease: "easeOutBounce" })

        markerSeq.play();
        //await aseSocket.executeAsGM("updateFlag", target.document.id, "missileSpell.missileNum", currMissile + 1);
        //console.log("Total Missiles assigned: ", currMissile + 1);
        let inTargetList = this.data.targets.find(t => t.id == target.id);
        if (!inTargetList) {
            this.data.targets.push({ id: target.id, missilesAssigned: 1 });
        } else {
            inTargetList.missilesAssigned++;
        }
        this.data.returnTargets.push(target);
    }

    async _handleClick(event) {
        //console.log('Clicked: ', event);
        let parsedEventData = {
            // altKey: event.originalEvent.altKey,
            // ctrlKey: event.originalEvent.ctrlKey,
            button: event.originalEvent.button
        }
        //set attacktype to 1 if altkey and -1 if ctrlkey, 0 by default
        // let attackType = parsedEventData.altKey ? 'kh' : (parsedEventData.ctrlKey ? 'kl' : '');
        //console.log('Mouse Click Data: ', parsedEventData);
        let token = canvas.tokens.placeables.filter(token => {
            const mouseLocal = Utilities.getMouseStagePos(token);
            //console.log('Mouse Local: ', mouseLocal);
            return mouseLocal.x >= 0 && mouseLocal.x <= token.hitArea.width
                && mouseLocal.y >= 0 && mouseLocal.y <= token.hitArea.height;
        })[0];
        if (token) {
            //console.log('Target: ', token.name);
            if (parsedEventData.button == 0) {
                let numMissiles = this.data.numMissiles;
                //console.log('Missiles passed to target hook: ', numMissiles);
                if (numMissiles == 0) {
                    ui.notifications.info("达到目标数量上限!");
                }
                if (this.data.unique && this.data.returnTargets.includes(token)) {
                    ui.notifications.info("该目标已经被选中!");
                }
                else if (numMissiles > 0) {
                    const missileTextBox = document.getElementById("txtNumMissilesId");
                    if (missileTextBox) {
                        missileTextBox.value--;
                    }
                    await this._applyMarker(token);
                    this._addTargetToList(token);
                    this.data.numMissiles--;
                    // this.data.returnTargets.push(token);
                }
            }
            else if (parsedEventData.button == 2) {
                this._removeMissile(token);
            }
            //console.log(this);
        }

    }

    async _addTargetToList(target) {
        //console.log(`Adding ${target.document.name} to target list...`, target);
        //let missilesAssigned = target.document.getFlag("advancedspelleffects", "missileSpell.missileNum") ?? 1;
        let missilesAssigned = this.data.targets.find(t => t.id == target.id)?.missilesAssigned ?? 1;
        //console.log("Missles assigned: ", missilesAssigned);
        let targetsTable = document.getElementById("targetsTable").getElementsByTagName('tbody')[0];
        let targetAssignedMissiles = document.getElementById(`${target.document.id}-missiles`);
        if (!targetAssignedMissiles) {
            let newTargetRow = targetsTable.insertRow(-1);
            newTargetRow.id = `${target.document.id}-row`;
            let newLabel1 = newTargetRow.insertCell(0);
            let newMissilesAssignedInput = newTargetRow.insertCell(1);
            let newRemoveMissileButton = newTargetRow.insertCell(2);
            newLabel1.innerHTML = `<img src="${target.document.texture.src}" width="30" height="30" style="border:0px"> - ${target.document.name}`;
            newMissilesAssignedInput.innerHTML = `<input style='width: 2em;' type="number" id="${target.document.id}-missiles" readonly value="${missilesAssigned}"></input>`;
            newRemoveMissileButton.innerHTML = `<button id="${target.document.id}-removeMissile" class="btnRemoveMissile" type="button"><i class="fas fa-minus"></i></button>`;
            let btnRemoveMissile = document.getElementById(`${target.document.id}-removeMissile`);
            //console.log(btnRemoveMissile);
            btnRemoveMissile.addEventListener("click", this._removeMissile.bind(this));
            newTargetRow.addEventListener("mouseenter", function (e) {
                let token = canvas.tokens.get($(this).attr('id').split('-')[0]);
                token._onHoverIn(e);
            });
            newTargetRow.addEventListener("mouseleave", function (e) {
                let token = canvas.tokens.get($(this).attr('id').split('-')[0]);
                token._onHoverIn(e);
            });
            $("#missile-dialog").height("auto");

        }
        else {
            document.getElementById(`${target.document.id}-missiles`).value++;
        }

    }

    async _removeMarker(target) {
        /*let missilesAssigned = this.data.targets.map(targetData => {
            return { id: targetData.id, missilesAssigned: targetData.missilesAssigned };
        }).filter(t => t.id == target.id)[0].missilesAssigned;//Number(target.document.getFlag("advancedspelleffects", "missileSpell.missileNum")) ?? 0;
        console.log("Removing assigned missile...", missilesAssigned, target);*/
        const targetData = this.data.targets.find(t => t.id == target.id);
        const missilesAssigned = targetData.missilesAssigned;
        //console.log("Removing assigned missile...", missilesAssigned, target);
        await Sequencer.EffectManager.endEffects({ name: `missile-target-${target.id}-${missilesAssigned - 1}` });
        if (missilesAssigned > 0) {
            //await aseSocket.executeAsGM("updateFlag", target.id, "missileSpell.missileNum", missilesAssigned - 1);
            targetData.missilesAssigned--;
            let index = this.data.returnTargets.lastIndexOf(target);
            if (index != -1) {
                this.data.returnTargets.splice(index, 1);
            }
        }
        //console.log("Total missiles assigned: ", missilesAssigned - 1);
    }

    async _removeMissile(e) {

        let target = e.currentTarget ? canvas.tokens.get(e.currentTarget.id.split('-')[0]) : e;
        //console.log("Target: ", target);
        if (target) {
            //let missilesAssigned = target.document.getFlag("advancedspelleffects", "missileSpell.missileNum");
            let missilesAssigned = this.data.targets.find(t => t.id == target.id)?.missilesAssigned ?? 0;
            //console.log("Missles assigned: ", missilesAssigned);
            let targetAssignedMissiles = document.getElementById(`${target.document.id}-missiles`);
            if (targetAssignedMissiles) {
                document.getElementById(`${target.document.id}-missiles`).value = missilesAssigned - 1;
                this.data.numMissiles = Number(this.data.numMissiles) + 1;
                //console.log("this data num missiles: ", this.data.numMissiles);
                document.getElementById("txtNumMissilesId").value++;
                await this._removeMarker(target);
            }
            if (missilesAssigned == 1) {
                let targetRow = document.getElementById(`${target.document.id}-removeMissile`).closest('tr');
                targetRow.remove();
                let inTargetList = this.data.targets.find(t => t.id == target.id);
                if (inTargetList) {
                    this.data.targets.splice(this.data.targets.indexOf(inTargetList), 1);
                }
            }
        }
    }

    async getData() {
        //console.log("Getting data...", this);
        game.user.updateTokenTargets([]);
        let missilesNum = Number(this.object.numMissiles) ?? 0;
        Hooks.once('closeMissileDialog', async () => {
            const missileEffects = Sequencer.EffectManager.getEffects({ name: 'missile-target-*' });
            if (missileEffects.length > 0) {
                console.log("检测到残留的目标标记...", missileEffects);
                await Sequencer.EffectManager.endEffects({ name: 'missile-target-*' });
            }
            //console.log('Done clearing target markers...', ...arguments);
            //this.submit();
        });

        return {
            data: this.data,
            numMissiles: missilesNum,
        };
    }

    activateListeners(html) {
        //console.log(html);
        super.activateListeners(html);
        $(document.body).on("mouseup", this._handleClick.bind(this));
    }

    async _updateObject(event, formData) {
        //console.log('Event: ', event);
        // menulib.debug("_updateObject", event, formData, this.data.caster, this.data.targets)
        if (event.target) {
            //console.log("Inside update object if statement...");
            // let caster = canvas.tokens.get(this.data.caster);
            // const casterActor = game.actors.get(caster.data.actorId);
            // const item = this.data.item;
            //console.log(`${caster.name} is firing Missiles at Selected Targets...`);
            //console.log("Missile Data: ", this.data);
            this.cancelled = false;
            //console.log("Finished set up...");
            for await (let target of this.data.targets) {
                //console.log("Inside target loop...");
                let targetToken = canvas.tokens.get(target.id);
                //console.log("Target: ", targetToken);
                //let missileNum = targetToken.document.getFlag("advancedspelleffects", "missileSpell.missileNum") ?? 0;
                const missileNum = this.data.targets.find(t => t.id == target.id)?.missilesAssigned ?? 0;
                if (missileNum == 0) {
                    return;
                }

                const targetMarkers = Sequencer.EffectManager.getEffects({ object: targetToken }).filter(effect => effect.data.name?.startsWith(`missile-target`));
                for await (let targetMarker of targetMarkers) {
                    await Sequencer.EffectManager.endEffects({ name: targetMarker.data.name, object: targetToken });
                }
                //console.log("End of target loop...");
            }
        }
        $(document.body).off("mouseup", MissileDialog._handleClick);
        await Socket.executeAsGM("updateFlag", game.user.id, "missileDialogPos", { left: this.position.left, top: this.position.top });
        this.inFlight = false;
    }

    async drawPreview() {
        this.inFlight = true;
        await this.render(true);

        /* wait _indefinitely_ for placement to be decided. */
        await menulib.waitFor(() => !this.inFlight, -1);
        // if (this.activeHandlers) {
        //     this.clearHandlers();
        // }

        //END WARPGATE
        return this;
    }
}
export default MissileDialog;