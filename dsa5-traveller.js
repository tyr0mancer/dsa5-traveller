import {LocationManager} from "./module/location-manager.js";
import {ItemManager} from "./module/item-manager.js";

export const moduleName = "dsa5-traveller";
export const meistertoolsModuleName = 'dsa5-meistertools'


/**
 * updates the current location when the token that is marked as locator token in the settings is moved
 */
Hooks.on("preUpdateToken", async (scene, token, delta, id) => {
    if (!delta.x && !delta.y)
        return
    if (game.settings.get(moduleName, "general").locatorToken._id === token._id) {
        token.x = delta.x || token.x
        token.y = delta.y || token.y
        await LocationManager.updateLocation(scene, token)
    }
});

Hooks.once('init', () => {
    console.log(moduleName, "| Initializing")
    registerSettings()

    Handlebars.registerHelper('locationToString', function (location, opts) {
        let result = ""
        if (location && Array.isArray(location))
            for (let entry of location.sort((a, b) => b[1] - a[1]))
                result += `<p><b>${entry[1]}</b> <i>${entry[0]}</i></p>`
        return result
    });

});

/**
 * adds entries to MeisterTools Menubar. Should update this to make this mod independent
 */
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


/**
 * we will manage all settings through the application, no entry in the settings menu needed
 */
function registerSettings() {
    const defaultSettings = LocationManager.defaultSettings

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
