import {LocationManager} from "./module/location-manager.js";
import {ItemManager} from "./module/item-manager.js";
import Dsa5Availability from "./module/dsa5-availability.js";

export const moduleName = "dsa5-traveller";
export const meistertoolsModuleName = 'dsa5-meistertools'


/**
 * updates the current location when the token that is marked as locator token in the settings is moved
 */
Hooks.on("preUpdateToken", async (scene, token, delta, id) => {
    if (!delta.x && !delta.y) return
    if (game.settings.get(moduleName, "general")?.locatorToken?._id === token._id) {
        token.x = delta.x || token.x
        token.y = delta.y || token.y
        await Dsa5Availability.updateLocationFromTokenAndMap({scene, token})
    }
});

Hooks.once('init', () => {
    console.log(moduleName, "| Initializing")
    registerSettings()

    Handlebars.registerHelper('locationToString', function (location) {
        let result = ""
        if (location && Array.isArray(location))
            for (let entry of location.sort((a, b) => b[1] - a[1]))
                result += `<p>${entry[1]} <i>${entry[0]}</i></p>`
        return result
    });

    Handlebars.registerHelper('sortingHeader', function (sorting, name, key) {
        if (!key) key = name.toLowerCase()
        let result = `<a name="sorter" data-sort-key="${key}"><b>${name}</b></a>`
        if (sorting.key === key) {
            if (sorting.direction === 1)
                result = "<i class=\"fas fa-sort-up\"></i> " + result
            else
                result = "<i class=\"fas fa-sort-down\"></i> " + result
        }
        return result
    });

    Handlebars.registerHelper('showStarRating', function (weight) {
        let value = Array.isArray(weight)
            ? parseInt(weight[1])
            : parseInt(weight)
        switch (value) {
            case 0:
                return `<i style="color: red" class="far fa-times-circle"></i>`
            case 1:
                return `<i style="color: lightblue;" class="far fa-star"></i>`
            case 2:
                return `<i style="color: blue" class="far fa-star"></i>`
            case 3:
                return `<i style="color: blue" class="fas fa-star-half-alt"></i>`
            case 4:
                return `<i style="color: blue" class="fas fa-star"></i>`
            case 5:
                return `<i style="color: green" class="fas fa-star"></i>`
        }
        return ''
    });

    Handlebars.registerHelper('index_of', function(context,ndx) {
        return context[ndx];
    });
})

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
