import {moduleName} from "../dsa5-traveller.js";


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
            status,
        })
    }


    activateListeners(html) {
        super.activateListeners(html);
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


}
