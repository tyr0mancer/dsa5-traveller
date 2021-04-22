import {Dsa5Locations} from "./module/dsa5-locations.js";
import {Dsa5Nightwatch} from "./module/dsa5-nightwatch.js";

export const moduleName = "dsa5-traveller";
export const meistertoolsModuleName = 'dsa5-meistertools'

Hooks.once('init', () => {
    console.log(moduleName, "| Initializing")
    registerSettings()
});

Hooks.once('ready', function () {
    console.log(moduleName, "| Ready")
});

Hooks.on("getSceneControlButtons", (controls) => {
    const meisterPanel = controls.find(c => (c.name === meistertoolsModuleName))
    meisterPanel['tools'].push({
        name: "locator",
        title: 'Locator',
        icon: "fas fa-street-view",
        visible: true,
        button: true,
        onClick: () => new Dsa5Locations().render(true)
    })
    meisterPanel['tools'].push({
        name: "nightwatch",
        title: 'Nachtwache',
        icon: "fas fa-campground",
        visible: true,
        button: true,
        onClick: () => new Dsa5Nightwatch().render(true)
    })

/*
    meisterPanel['tools'].push({
        name: "draw",
        title: 'Malen',
        icon: "fas fa-pen",
        visible: true,
        button: true,
        onClick: () => {
            Drawing.create({
                type: CONST.DRAWING_TYPES.RECTANGLE,
                author: game.user._id,
                x: 1000,
                y: 1000,
                width: 800,
                height: 600,
                fillType: CONST.DRAWING_FILL_TYPES.SOLID,
                fillColor: "#0000FF",
                fillAlpha: 0.5,
                strokeWidth: 4,
                strokeColor: "#FF0000",
                strokeAlpha: 0.75,
                texture: "ui/parchment.jpg",
                textureAlpha: 0.5,
                text: "HELLO DRAWINGS!",
                fontSize: 48,
                textColor: "#00FF00",
                points: []
            });

        }
    })
*/

    controls = controls.filter(c => (c.name !== meistertoolsModuleName))
    controls.push(meisterPanel)
});


function registerSettings() {
    const defaultSettings = Dsa5Locations.getDefaultSettings()

    game.settings.register(moduleName, "general", {
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.general
    });

    game.settings.register(moduleName, "regions", {
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.regions
    });

    game.settings.register(moduleName, "biomes", {
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.biomes
    });

    game.settings.register(moduleName, "location", {
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.location
    });

}
