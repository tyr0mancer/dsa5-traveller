import {moduleName} from "../dsa5-traveller.js";

export default class Dsa5Availability {
    static MAX_AVAILABILITY = 5
    static DEFAULT_AVAILABILITY = 3
    static AVAILABILITY_OPTIONS = [
        {key: 0, short: "nie", name: 'nie'},
        {key: 1, short: "1/5", name: 'fast nie'},
        {key: 2, short: "2/5", name: 'selten'},
        {key: 3, short: "3/5", name: 'normal'},
        {key: 4, short: "4/5", name: 'oft'},
        {key: 5, short: "5/5", name: 'sehr oft'}
    ]

    static get currentLocation() {
        return game.settings.get(moduleName, 'location')
    }

    static get regions() {
        return game.settings.get(moduleName, 'regions') || []
    }

    static get locatorScene() {
        const {locatorScene} = game.settings.get(moduleName, 'general')
        return (locatorScene?._id)
            ? game.scenes.entities.find(e => e._id === locatorScene._id)
            : game.scenes.active
    }

    static get locatorToken() {
        const {locatorToken} = game.settings.get(moduleName, 'general')
        const result = this.locatorScene?.data.tokens.find(e => e._id === locatorToken._id)
        if (!result) {
            const general = game.settings.get(moduleName, 'general')
            delete general.locatorToken
            game.settings.set(moduleName, 'general', general)
        }
        return result
    }


    /**
     *
     * @param scene
     * @param token
     * @param location
     * @param regions
     * @return {Promise<*>}
     */
    static async updateLocationFromTokenAndMap({scene = Dsa5Availability.locatorScene, token = Dsa5Availability.locatorToken, location = Dsa5Availability.currentLocation, regions = Dsa5Availability.regions}) {
        if (!scene || !token) return Promise.reject('locator token or map missing');

        const tokenX = token.x + (0.5 * scene.data.grid)
        const tokenY = token.y + (0.5 * scene.data.grid)
        let locations = {}
        for (let drawing of scene.data.drawings) {
            let points = [];
            for (let i = 0; i < drawing.points.length; i++) {
                points.push(drawing.points[i][0] + drawing.x);
                points.push(drawing.points[i][1] + drawing.y);
            }
            let polygon = new PIXI.Polygon(points)
            let flags = drawing.flags[moduleName]
            if (flags && polygon.contains(tokenX, tokenY)) {
                for (let key in flags) {
                    if (!locations[key])
                        locations[key] = []
                    locations[key].push(flags[key])
                }
            }
        }
        let result = []
        for (let regionKey of Object.keys(locations)) {
            const region = regions.find(r => r.key === regionKey)
            if (!region) continue
            result.push({
                ...region,
                index: region.index.filter(i => locations[regionKey].includes(i.key))
            })
        }
        location.region = result
        await game.settings.set(moduleName, 'location', location)
        Hooks.call(moduleName + ".update-location", null)
        return location
    }


    static flattenAvailability(availability) {
        let result = {regions: [], biomes: []}
        console.log(availability, result)
        return result
    }

    static expandAvailability(availability) {
        let result = {regions: [], biomes: []}
        console.log(availability, result)
        return result
    }


}


/**
 * Note: this ignores different region categories and namespaces might overlap. might fix this later
 * @param currentLocation
 * @return {string[]} an array of region keys from the current location format
 */
export const getRegionKeysFromLocation = (currentLocation) => currentLocation.region?.reduce((accumulator, currentValue) => {
    return accumulator.concat(currentValue.index.map(i => i.key))
}, []) || []

/**
 * @param currentLocation
 * @return {string} the current biome key from the current location format
 */
export const getBiomeKeyFromLocation = (currentLocation) => currentLocation.biome?.key

/**
 * returns general availability and availability depending on region and / or biome
 * assuming item.data.availability is of type
 * @example
 {
        general: number
        regions: [regionKey,weight][]
        biomes: [biomeKey,weight][]
    }
 * @param applicableLocation location to check against (only needed if applicableBiomeKey or applicableRegionKeys are not set)
 * @param item item to check
 * @param applicableBiomeKey {string} the biome to check against
 * @param applicableRegionKeys {string[]} the region keys to check against
 * @return {number} overall availability score
 */
export function getItemAvailability({applicableLocation, item, applicableBiomeKey = getBiomeKeyFromLocation(applicableLocation), applicableRegionKeys = getRegionKeysFromLocation(applicableLocation)}) {
    // try to get availability info from item object
    const availability = item?.data?.availability ? item?.data?.availability : item?.data?.data?.availability
    if (!availability)
        return -1 // todo would  false, undefined, null ? or should it be a promise?
    // check availability data against region and biome
    const generalAvailability = availability.general || Dsa5Availability.DEFAULT_AVAILABILITY
    const regionAvailability = Math.max(availability.regions?.filter(e => {
        return applicableRegionKeys.includes(e[0])
    }).map(e => e[1])) || generalAvailability
    const biomeAvailability = (availability.biomes?.find(e => applicableBiomeKey === e[0]) || ['', Dsa5Availability.MAX_AVAILABILITY])[1]
    return Math.max(generalAvailability, Math.min(regionAvailability, biomeAvailability))
}


