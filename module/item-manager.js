import {moduleName} from "../dsa5-traveller.js";

export class ItemManager extends Application {

    constructor() {
        super();
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = `Items verwalten`;
        options.id = `${moduleName}.item-manager`;
        options.template = `modules/${moduleName}/templates/item-manager.html`;
        options.tabs = [{navSelector: ".tabs", contentSelector: ".content"}]
        options.resizable = true;
        options.top = 50;
        options.left = 200;
        options.width = 600;
        options.height = 800;
        return options;
    }

    /* collect and provide data for the template */
    async getData() {
        return {}
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

}
