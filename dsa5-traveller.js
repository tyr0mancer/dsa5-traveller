import {Dsa5Locations} from "./module/dsa5-locations.js";
import {Dsa5Nightwatch} from "./module/dsa5-nightwatch.js";

export const moduleName = "dsa5-traveller";
export const meistertoolsModuleName = 'dsa5-meistertools'


Hooks.on("preUpdateToken", async (scene, token, delta, id) => {
    const tokenId = game.settings.get(moduleName, "general").locatorToken._id
    if (delta.x || delta.y) {
        if (tokenId === token._id) {
            token.x = delta.x || token.x
            token.y = delta.y || token.y
            await Dsa5Locations.updateLocation(scene,token)
        }
    }
});

Hooks.once('init', () => {
    console.log(moduleName, "| Initializing")
    registerSettings()
});

Hooks.once('ready', function () {
    console.log(moduleName, "| Ready")
});

Hooks.on("getSceneControlButtons", (controls) => {
    const meisterPanel = controls.find(c => (c.name === meistertoolsModuleName))
    if (game.user.isGM)
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

    controls = controls.filter(c => (c.name !== meistertoolsModuleName))
    controls.push(meisterPanel)
});


function registerSettings() {
    const defaultSettings = Dsa5Locations.getDefaultSettings()

    game.settings.register(moduleName, "general", {
        scope: "world",
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.general
    });

    game.settings.register(moduleName, "regions", {
        scope: "world",
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.regions
    });

    game.settings.register(moduleName, "biomes", {
        scope: "world",
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.biomes
    });

    game.settings.register(moduleName, "location", {
        scope: "world",
        config: false,
        type: Object,
        restricted: true,
        default: defaultSettings.location
    });

}
