import {moduleName} from "../dsa5-traveller.js";

const COLOR_ARRAY = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

const DRAWING_FORMATS = {
    stadt: {
        textColor: "#ffffff",
        fontSize: 24,
        strokeColor: "#cc3228",
        strokeWidth: 8,
        fillType: 2,
        fillColor: '#cc3228',
        fillAlpha: 1,
        texture: "modules/dsa5-traveller/images/background.jpg"
    },
    land: {
        textColor: "#000000",
        fontSize: 24,
        strokeColor: "#00ff00",
        strokeWidth: 8,
        fillType: 2,
        fillColor: '',
        fillAlpha: 0.5,
        texture: "modules/dsa5-traveller/images/background.jpg"
    },
    politik: () => {
        const colorIndex = Math.floor(Math.random() * COLOR_ARRAY.length)
        return {
            fillType: 1,
            fontSize: 48,
            textColor: COLOR_ARRAY[Math.floor(colorIndex * 1.5) % colorIndex],
            fillColor: COLOR_ARRAY[colorIndex]
        }
    },
    reset: {
        strokeColor: "#0000ff", strokeWidth: 8, fillAlpha: 1, fillColor: "#cc3228",
        textColor: "#ffffff", fillType: 0, fontSize: 48,
    },
}

export class LocationManager extends Application {

    constructor() {
        super();
        /*
                game.settings.set(moduleName, "settings", undefined)
                game.settings.set(moduleName, "regions", undefined)
        */


        /* read settings */
        this._loadSettings(['general', 'regions', 'location', 'biomes'])

        //this.regions = LocationManager.getDefaultSettings().regions //game.settings.set(moduleName, 'regions')
        //game.settings.set(moduleName, 'regions', LocationManager.getDefaultSettings().regions)

        Hooks.on("canvasInit", () => this.render());
        Hooks.on("controlToken", () => this.render());

    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.title = `Regionen verwalten`;
        options.id = `${moduleName}.manage-regions`;
        options.template = `modules/${moduleName}/templates/location-manager.html`;
        options.tabs = [{navSelector: ".tabs", contentSelector: ".content"}]
        options.resizable = true;
        options.top = 50;
        options.left = 100;
        options.width = 600;
        options.height = 800;
        return options;
    }


    /* collect and provide data for the template */
    async getData() {
        const status = {
            controlsOneToken: (canvas.tokens?.controlled.length === 1),
            viewsLocatorScene: (this.settings.general.locatorScene._id === canvas.scene._id),
            viewsLocatorToken: (this.settings.general.locatorToken._id === canvas.tokens.controlled[0]?.data._id)
        }

        return mergeObject(super.getData(), {
            settings: this.settings,
            status,
        })
    }


    activateListeners(html) {
        super.activateListeners(html);
        html.find("button[name='set-locator-scene']").click(event => this._setLocatorScene());
        html.find("button[name='set-locator-token']").click(event => this._setLocatorToken());
        html.find("button[name='parse-drawing']").click(event => this._parseDrawings(event, html));
        html.find("button[name='rename-region-entry']").click(event => this._renameRegionEntry(event, html));
        html.find("button[name='remove-region-entry']").click(event => this._removeRegionEntry(event, html));
        html.find("button.add-region-entry").click(event => this._addRegionEntry(event, html));

        html.find("button[name='update-location']").click(event => this._updateLocation());
        html.find("button[name='toggle-region']").click(event => this._toggleRegion(event));
        html.find("button[name='unset-flags']").click(event => this._unsetFlags(event, html));
        html.find("button[name='reset-regions']").click(event => this._resetRegions(event, html));
        html.find("button[name='add-biome']").click(event => this._addBiome(event, html));

        html.find("button[name='remove-biome']").click(event => this._removeBiome(event, html));
        html.find("select[name='update-current-biome']").change(event => this._updateCurrentBiome(event, html));
        html.find("button[name='view-scene']").click(event => this._viewLocatorScene(event, html));


        // helper during development
        html.find("button[name='show-flags']").click(event => this._showFlags(event, html));

        // todo
        html.find("button[name='delete-region']").click(event => this._deleteRegion(event, html));
    }


    /**
     *
     * @param scene
     * @private
     */
    _setLocatorScene(scene) {
        if (!scene)
            scene = canvas.scene
        this.settings.general.locatorScene._id = scene._id
        this.settings.general.locatorScene.name = scene.data.name
        this._saveSettings()
        this.render()
    }


    /**
     *
     * @param event
     * @param html
     * @private
     */
    _setLocatorToken(token) {
        if (!token)
            token = canvas.tokens.controlled[0]
        if (!token) return
        this.settings.general.locatorToken._id = token.data._id
        this.settings.general.locatorToken.name = token.data.name
        this._saveSettings()
        this.render()
    }


    _resetRegions() {
        this.settings.regions = this.settings.regions.map(r => {
            return {...r, index: []}
        })
        this._saveSettings('regions')
        this.render()
    }

    /**
     * removes all associations of drawings to region information
     * makes all drawings visible and unlocked
     * @private
     */
    _unsetFlags() {
        this.updateDrawings(drawing => {
            /*
                const oldText = drawing.text.split(',');
                drawing.text = capitalize(oldText[oldText.length - 1])
                return [drawing]
            */
            // no flags to remove
            let flags = drawing.flags[moduleName]
            if (!flags) return undefined

            // apply style
            mergeObject(drawing, this.getDrawingStyle("reset"))

            // restore text of the drawing
            drawing.text = Object.values(flags).join(',')
            drawing.hidden = false
            drawing.locked = false
            delete drawing.flags[moduleName]

            return drawing
        })
    }

    _showFlags(event, html) {
        this.updateDrawings(d => console.log(d.flags))
    }


    async _updateCurrentBiome(event, html) {
        const key = $(event.currentTarget)[0].value
        const name = this.settings.biomes.find(b => b.key === key).name
        this.settings.location.biome = {key, name}
        await this._saveSettings('location')
        this.render()
    }

    async _removeBiome(event, html) {
        const biomeKey = $(event.currentTarget).attr("data-biome-key")
        this.settings.biomes = this.settings.biomes.filter(b => b.key !== biomeKey)
        await this._saveSettings('biomes')
        this.render()
    }


    /**
     *
     * @param event
     * @param html
     * @private
     */
    async _addBiome(event, html) {
        const newBiomeName = html.find("input[name='new-biome-name']")[0].value
        this.settings.biomes.push({
            key: keyify(newBiomeName),
            name: capitalize(newBiomeName)
        })
        await this._saveSettings('biomes')
        this.render()
    }

    async _addRegionEntry(event, html) {
        let regions = game.settings.get(moduleName, 'regions')
        const regionKey = $(event.currentTarget).attr("data-region-kategorie-key")
        const newRegionEntryName = html.find("input[name='new-region-entry-name-" + regionKey + "']")[0].value
        regions.find(r => r.key === regionKey).index.push({
            key: keyify(newRegionEntryName),
            name: capitalize(newRegionEntryName)
        })
        this.settings.regions = regions
        await this._saveSettings('regions')
        this.render()
    }


    /**
     *
     * @param event
     * @return {Promise<void>}
     * @private
     */
    async _toggleRegion(event) {
        const regionKey = $(event.currentTarget).attr("data-region-key")
        if (!regionKey) return
        const regionId = $(event.currentTarget).attr("data-region-id")

        const showDrawing = $(event.currentTarget).attr("data-show-region")
        const toggleVisibility = (showDrawing === undefined)
        const hidden = !(showDrawing === "true")
        await this.updateDrawings(drawing => {
            if (!drawing.flags || !drawing.flags[moduleName]) return undefined // no flags
            if (!drawing.flags[moduleName][regionKey]) return undefined // flagged with another regionKey
            if (regionId && (drawing.flags[moduleName][regionKey] !== regionId)) return undefined // wrong regionId
            if (toggleVisibility)
                drawing.hidden = !drawing.hidden
            else
                drawing.hidden = hidden
            return drawing
        })
    }


    /**
     *
     * @param event
     * @private
     */
    async _parseDrawings(event) {
        const regionKey = $(event.currentTarget).attr("data-region-key")
        if (!regionKey) return
        if (!this.settings.regions.find(r => r.key === regionKey)) return
        await this.updateDrawings(drawing => {
            // this is not a new drawing
            if (drawing.flags && drawing.flags[moduleName]) {
                return undefined
            }
            // is this region already part of another drawing?
            let regionId = keyify(drawing.text)
            let regionName = capitalize(drawing.text)
            if (!regionId || regionId === '') return undefined
            // find regionEntry or create a new one if key doesnt exist yet
            let regionEntry = this.settings.regions.find(r => r.key === regionKey).index.find(e => e.key === regionId)
            if (!regionEntry) {
                regionEntry = {
                    key: regionId, name: regionName
                }
                this.settings.regions.find(r => r.key === regionKey).index.push(regionEntry)
            }
            // remove text from drawing
            drawing.text = regionEntry.name
            // hide and lock
            drawing.hidden = true
            drawing.locked = true
            // and add the found region to the drawing as a flag
            let flags = {}
            flags[moduleName] = {}
            flags[moduleName][regionKey] = regionEntry.key

            mergeObject(drawing, {flags: flags})
            return mergeObject(drawing, this.getDrawingStyle(regionKey))


        })
        await this._saveSettings('regions')
        this.render()
    }


    async _renameRegionEntry(event, html) {
        const regionKey = $(event.currentTarget).attr("data-region-key")
        const regionEntryKey = $(event.currentTarget).attr("data-region-entry-key")
        const newRegionEntryName = html.find("input[data-region-id='" + regionEntryKey + "']")[0].value
        const newRegionEntryRegion = html.find("select[data-region-id='" + regionEntryKey + "']")[0].value
        if (newRegionEntryRegion !== regionKey) {
            const oldRegion = this.settings.regions.find(r => r.key === regionKey)
            const newRegion = this.settings.regions.find(r => r.key === newRegionEntryRegion)
            const regionEntry = duplicate(oldRegion?.index.find(i => i.key === regionEntryKey))
            regionEntry.name = newRegionEntryName
            oldRegion.index = oldRegion.index.filter(r => r.key !== regionEntry.key)
            newRegion.index.push(regionEntry)
        } else {
            const region = this.settings.regions.find(r => r.key === regionKey)
            const index = region.index.find(i => i.key === regionEntryKey)
            index.name = newRegionEntryName
        }
        await this._saveSettings('regions')
        this.render()
    }


    /**
     * removes an entry from region.index and unflags and styles drawings accordingly
     * @param event
     * @param html
     * @return {Promise<void>}
     */
    async _removeRegionEntry(event, html) {
        const regionKey = $(event.currentTarget).attr("data-region-key")
        const regionEntryKey = $(event.currentTarget).attr("data-region-entry-key")
        if (!regionKey || !regionEntryKey) return
        if (!this.settings.regions.find(r => r.key === regionKey)) return
        await this.updateDrawings(drawing => {
            if (!drawing.flags || !drawing.flags[moduleName]) return undefined      // a new drawing
            if (!drawing.flags[moduleName][regionKey]) return undefined     // flagged with another region type
            if (regionEntryKey !== drawing.flags[moduleName][regionKey]) return undefined   // different region entry
            delete drawing.flags[moduleName]
            drawing.hidden = false
            drawing.locked = false
            return mergeObject(drawing, this.getDrawingStyle('reset'))
        })
        this.settings.regions.find(r => r.key === regionKey).index = this.settings.regions
            .find(r => r.key === regionKey).index
            .filter(i => i.key !== regionEntryKey)
        await this._saveSettings('regions')
        this.render()
    }

    static async updateLocation(scene, token, location = undefined, regions = undefined) {
        if (location === undefined)
            location = game.settings.get(moduleName, 'location')
        if (regions === undefined)
            regions = game.settings.get(moduleName, 'regions')

        const gridSize = scene.data.grid
        const tokenX = token.x + (0.5 * gridSize)
        const tokenY = token.y + (0.5 * gridSize)
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
        return location
    }


    async _updateLocation(scene, token) {
        if (!scene && this.settings.general.locatorScene._id) {
            scene = game.scenes.entities.find(s => s._id === this.settings.general.locatorScene._id);
        }
        if (!scene)
            scene = game.scenes.active
        if (!token)
            token = scene.data.tokens.find(t => t._id === this.settings.general.locatorToken._id)
        if (!token) {
            // ui.notifications.error(`locator token unavailable`);
            //return Error(`locator token unavailable`)
            return this._pickRegionDialog()
        }
        this.settings.location = await LocationManager.updateLocation(scene, token, this.settings.location, this.settings.regions)
        this.render()
    }


    _pickRegionDialog() {
        const regions = game.settings.get(moduleName, 'regions')
        const location = game.settings.get(moduleName, 'location')

        console.clear()
        console.log(location)
        console.log(regions)

        let content = ``
        for (let category of regions) {
            content += `<h2>${category.name}</h2>`
            for (let entry of category.index) {
                let checked = (location.region.find(r => r.key === category.key)?.index.find(e => e.key === entry.key) !== undefined) ? 'checked="checked"' : ''
                content += `<input type="checkbox" id="${category.key}-${entry.key}" name="${category.key}.${entry.key}" ${checked} /><label for="${category.key}-${entry.key}">${entry.name}</label>`
            }
        }

        let types = ['one']
        let d = new Dialog({
            title: "Region auswählen",
            content,
            buttons: {},
            default: types[0],
            close: () => {
            }
        });

        types.forEach(x => {
            d.data.buttons[x] = {
                label: 'OK',
                callback: (html) => {
                    let regionSelection = []
                    for (let data of html.find('input[type=checkbox]')) {
                        if (!data.checked) continue
                        let e = data.name.split('.')
                        let regionCategory = regions.find(r => r.key === e[0])
                        let region = regionCategory.index.find(c => c.key === e[1])
                        let selectedCategory = regionSelection.find(r => r.key === e[0])
                        if (!selectedCategory) {
                            regionSelection.push({...regionCategory, index: []})
                            selectedCategory = regionSelection.find(r => r.key === e[0])
                        }
                        selectedCategory.index.push(region)
                    }
                    let newLocation = {
                        biome: location.biome,
                        region: regionSelection
                    }
                    game.settings.set(moduleName, 'location', newLocation)
                    this.settings.location = newLocation
                    this.render()
                }
            }
        });
        d.render(true);
    }


    _addRegion(event, html) {

    }

    _deleteRegion(event, html) {

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


    getDrawingStyle(style = '') {
        let styleFormat = DRAWING_FORMATS[style] || {}
        if (typeof styleFormat === 'function')
            return styleFormat(style)
        return styleFormat
    }


    /**
     *
     * @param callback
     * @param scene
     * @return {Promise<void>}
     */
    async updateDrawings(callback, scene = undefined) {
        if (!scene && this.settings.general.locatorScene._id) {
            scene = game.scenes.entities.find(s => s._id === this.settings.general.locatorScene._id);
        }
        if (!scene)
            scene = game.scenes.active
        let newDrawings = []
        const remainingDrawings = scene.data.drawings
            .filter((e) => {
                const newElement = callback(e)
                if (newElement !== undefined) {
                    newDrawings.push(newElement)
                    return false
                }
                return true
            })

        if (scene._id === game.scenes.viewed._id) {
            scene.update({drawings: remainingDrawings})
            for (let drawing of newDrawings)
                await Drawing.create(drawing)
        } else
            scene.update({drawings: remainingDrawings.concat(newDrawings)})
    }

    /**
     *
     * @return Object
     */
    static getDefaultSettings() {
        return {
            regions: [
                {key: "stadt", name: "Städte", index: [{key: 'gareth', name: 'Gareth und Umgebung'}]},
                {key: "land", name: "Landschaften", index: []},
                {key: "politik", name: "Politisch", index: []}
            ],
            biomes: [
                {key: 'steppe', name: 'Steppe'},
                {key: 'wald', name: 'Wald'},
                {key: 'regenwald', name: 'Regenwald'},
                {key: 'wueste', name: 'Wüste'},
                {key: 'gebirge', name: 'Gebirge'},
            ],
            location: null,
            general: {
                locatorScene: {},
                locatorToken: {}
            }
        }
    }

    _viewLocatorScene(event, html) {
        const scene = game.scenes.entities.find(s => s._id === this.settings.general.locatorScene._id);
        scene.view()
    }
}


// todo terrible naming and should be in meistertools util
const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

const keyify = (s) => {
    let result = s.toLowerCase()
    result = result.replace(/[^\w_-]/g, '');
    return result
}
