import {moduleName} from "../dsa5-traveller.js";

//import  DSA5_Utility from "../../../systems/dsa5/modules/system/utility-dsa5";

export class Dsa5Nightwatch extends Application {

    constructor() {
        super();
        this._loadSettings(['location'])
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = `Nachtwache`;
        options.id = `${moduleName}.nightwatch`;
        options.template = `modules/${moduleName}/templates/nightwatch.html`;
        options.tabs = [{navSelector: ".tabs", contentSelector: ".content"}]
        options.resizable = true;
        options.top = 50;
        options.left = 100;
        options.width = 400;
        options.height = 600;
        return options;
    }


    /* collect and provide data for the template */
    async getData() {
        const status = {
            location: this.settings.location
        }
        return mergeObject(super.getData(), {
            settings: this.settings,
            tokens: game.scenes.active.data.tokens,
            status,
        })
    }


    activateListeners(html) {
        super.activateListeners(html);
        html.find("button[name=make-fire]").click(event => this._makeFire(event))
        html.find("button[name=place-tile]").click(event => this._placeTile(event, html))
        html.find("button[name=request-roll]").click(event => this._requestRoll(event))
    }


    /**
     *
     * @param keys
     * @private
     */
    _loadSettings(keys = ['general']) {
        if (typeof keys === 'string') keys = [keys]
        if (!this.settings)
            this.settings = {}
        for (let key of keys)
            this.settings[key] = game.settings.get(moduleName, key)
    }

    /**
     *
     * @param keys
     * @return {Promise<void>}
     * @private
     */
    async _saveSettings(keys = ['general']) {
        if (typeof keys === 'string') keys = [keys]
        for (let key of keys)
            await game.settings.set(moduleName, key, this.settings[key])
    }


    _requestRoll(modifier = 1, target = 'Wildnisleben') {
        const mod = modifier < 0 ? ` ${modifier}` : (modifier > 0 ? ` +${modifier}` : "")
        const msg = game.i18n.format("CHATNOTIFICATION.requestRoll", {
            user: game.user.name,
            item: `<a class="roll-button request-roll" data-type="skill" data-modifier="${modifier}" data-name="${target}"><i class="fas fa-dice"></i> ${target}${mod}</a>`
        })
        ChatMessage.create({content: msg});
    }

    _placeTent(event) {
        const tokenId = $(event.currentTarget).attr("data-token-id")
        const elem = game.scenes.active.data.tokens.find(t => t._id === tokenId)
        Tile.create({
            img: `modules/${moduleName}/images/zelt.png`,
            width: 400,
            height: 500,
            scale: 1,
            x: elem.x - 200,
            y: elem.y - 250,
            z: 370,
            rotation: 0,
            hidden: false,
            locked: false
        });

    }

    _placeBag(event) {
        const tokenId = $(event.currentTarget).attr("data-token-id")
        const elem = game.scenes.active.data.tokens.find(t => t._id === tokenId)
        Tile.create({
            img: `modules/${moduleName}/images/schlafsack.png`,
            width: 100,
            height: 200,
            scale: 1,
            x: elem.x - 100,
            y: elem.y - 150,
            z: 370,
            rotation: 0,
            hidden: false,
            locked: false
        });

    }

    _placeFire(position) {
        if (!position) return

        AmbientLight.create({
            "t": "l",
            "x": position.x,
            "y": position.y,
            "hidden": false,
            "rotation": 0,
            "dim": 25,
            "bright": 10,
            "angle": 360,
            "darknessThreshold": 0,
            "tintColor": "#FF0000",
            "tintAlpha": 0.04,
            "lightAnimation": {"type": "torch", "speed": 2, "intensity": 2}
        });

        Tile.create({
            img: `modules/${moduleName}/images/feuerstelle.png`,
            width: 100,
            height: 100,
            scale: 1,
            x: position.x - 50,
            y: position.y - 50,
            z: 370,
            rotation: 0,
            hidden: false,
            locked: false
        });

        AmbientSound.create({
            t: "l",
            x: position.x,
            y: position.y,
            radius: 60,
            easing: true,
            path: `modules/${moduleName}/sounds/feuer.mp3`,
            repeat: true,
            volume: 1
        });
    }

    _makeFire(event) {
        const tokenId = $(event.currentTarget).attr("data-token-id")
        const elem = game.scenes.active.data.tokens.find(t => t._id === tokenId)
        this._placeFire({x: elem.x, y: elem.y})
    }

    _placeTile(event, html) {
        const tile = $(event.currentTarget).attr("data-token-tile")
        if (tile === 'zelt')
            this._placeTent(event)
        else
            this._placeBag(event)
    }
}
