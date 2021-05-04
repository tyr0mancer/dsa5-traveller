import {LocationManager} from "./module/location-manager.js";
import {ItemManager} from "./module/item-manager.js";

export const moduleName = "dsa5-traveller";
export const meistertoolsModuleName = 'dsa5-meistertools'


Hooks.on("preUpdateToken", async (scene, token, delta, id) => {
    const tokenId = game.settings.get(moduleName, "general").locatorToken._id
    if (delta.x || delta.y) {
        if (tokenId === token._id) {
            token.x = delta.x || token.x
            token.y = delta.y || token.y
            await LocationManager.updateLocation(scene,token)
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
    if (!meisterPanel) return
    if (game.user.isGM) {
        meisterPanel['tools'].push({
            name: "locator",
            title: 'Locator',
            icon: "fas fa-street-view",
            visible: true,
            button: true,
            onClick: () => new LocationManager().render(true)
        })
        meisterPanel['tools'].push({
            name: "item-manager",
            title: 'Locations in Items verwalten',
            icon: "fas fa-tags",
            visible: true,
            button: true,
            onClick: () => new ItemManager().render(true)
        })
    }
    controls = controls.filter(c => (c.name !== meistertoolsModuleName))
    controls.push(meisterPanel)
});


function registerSettings() {
    const defaultSettings = LocationManager.getDefaultSettings()

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
