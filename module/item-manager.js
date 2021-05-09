import {moduleName} from "../dsa5-traveller.js";
import Dsa5Availability from "./dsa5-availability.js";

export class ItemManager extends Application {

    constructor() {
        super();
        this.itemCompendiaOptions = game.packs.filter(p => p.metadata.entity === 'Item')
        this.itemFolderOptions = game.folders.filter(f => (f.data.type === "Item"));
        this.filter = {img: {}, name: {}, description: {show: false}, general: {}, regions: {}, biomes: {},}
        this.tag = {}
        this.sorting = {key: 'name', direction: 1}
        this.currentLocation = Dsa5Availability.currentLocation
        Hooks.on(moduleName + ".update-location", () => {
            console.log(Dsa5Availability.currentLocation)
            this.currentLocation = Dsa5Availability.currentLocation
            this.render()
        });

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
        options.width = 1200;
        options.height = 800;
        return options;
    }

    /* collect and provide data for the template */
    async getData() {
        return {
            itemCompendiaOptions: this.itemCompendiaOptions,
            itemFolderOptions: this.itemFolderOptions,
            currentPack: this.currentPack,
            currentFolder: this.currentFolder,
            filter: this.filter,
            tag: this.tag,
            sorting: this.sorting,
            mainIndex: this.itemList,
            filteredIndex: this.filteredIndex,
            currentLocation: this.currentLocation
        }
    }

    async activateListeners(html) {
        super.activateListeners(html);
        html.find("nav.help-icon").click((event) => $('.help-info.help-' + $(event.currentTarget).attr("data-help")).toggle())
        html.find("a[name=sorter]").click((event) => {
            let key = $(event.currentTarget).attr("data-sort-key")
            if (this.sorting.key === key)
                this.sorting.direction *= -1
            else
                this.sorting = {key, direction: 1}
            this._applySort()
        })

        html.find("button[name=apply-filter]").click(() => this._applyFilter())
        html.find("button[name=reset-filter]").click(() => this._resetFilter())
        html.find("select[name=select-folder]").change(event => this._selectFolder(event))
        html.find("select[name=select-pack]").change(event => this._selectPack(event))
        html.find(".filter").change((event) => this._setFilter(event))
        html.find("select.tag").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.tag[type=text]").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.tag[type=checkbox]").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.checked === true)
        html.find("button[name=apply-current-location]").click((event) => this._applyCurrentLocation(event))
        html.find("td.apply-tag").mousedown((event) => {
            //event.preventDefault();
            let isRightMB = false;
            if ("which" in event) { // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                isRightMB = event.which == 3;
            } else if ("button" in event) { // IE, Opera
                isRightMB = event.button == 2;
            }
            if (isRightMB) {
                this._copyTag(event)
            } else {
                this._applyTag(event)
            }
        })
    }

    _applyCurrentLocation(event) {
        let cloc = JSON.stringify(Dsa5Availability.currentLocation)
        alert('todo: _applyCurrentLocation(event): ' + cloc)
    }

    async _setFilter(event) {
        let obj = {}
        obj[event.currentTarget.name] = (event.currentTarget.type === "checkbox")
            ? event.currentTarget.checked === true
            : event.currentTarget.value
        this.filter = mergeObject(this.filter, expandObject(obj))
        await this._applyFilter()
    }

    _applySort(event) {
        let {key, direction} = this.sorting
        this.filteredIndex = this.filteredIndex?.sort((e1, e2) => {
            let a
            let b
            if (key === 'description') {
                a = (e1.data?.description?.value || e1.data?.data?.description?.value) ? 1 : 0
                b = (e2.data?.description?.value || e2.data?.data?.description?.value) ? 1 : 0
            } else if (key === 'general') {
                a = e1.data?.availability?.general || e1.data?.data?.availability?.general || -1
                b = e2.data?.availability?.general || e1.data?.data?.availability?.general || -1
            } else {
                a = e1[key]
                b = e2[key]
            }
            let result = 0
            if (a > b)
                result = 1;
            else if (b > a)
                result = -1;
            if (direction) result *= direction
            return result
        })
        this.render()
    }

    async _applyFilter() {
        this.filteredIndex = this.itemList?.filter(item => {
                if (!this.filter || !Object.keys(this.filter).length)
                    return true

                // filter name
                if (this.filter?.name?.keyword && !item.name.toLowerCase().includes(this.filter.name.keyword.toLowerCase())) return false

                // filter description
                if (this.filter?.description?.keyword) {
                    const description = item.data?.description?.value || item.data?.data?.description?.value
                    if (!description || !description.toLowerCase().includes(this.filter.description.keyword.toLowerCase()))
                        return false
                }

                // checking for availability now
                const availability = item.data?.availability || item.data?.data?.availability

                // general availability
                if (this.filter?.general?.max && (availability?.general > this.filter.general.max)) return false
                if (this.filter?.general?.min && (!availability?.general || availability.general < this.filter.general.min)) return false

                // regional availability
                if (this.filter?.regions?.filtertype) {
                    // check if any region definition at all
                    if (this.filter.regions.filtertype === 'empty')
                        return (!availability?.regions || availability.regions.length === 0)
                    if (this.filter.regions.filtertype === 'defined')
                        return (availability?.regions && availability.regions.length > 0)
                    // check for specific region
                    let foundAny = false
                    for (let regionKey of this.filter?.regions?.keywords.toLowerCase().split(',')) {
                        if (availability?.regions.find(r => r[0].includes(regionKey))) {
                            if (this.filter.regions.filtertype === 'any') {
                                foundAny = true
                                break
                            }
                            if (this.filter.regions.filtertype === 'none')
                                return false
                        } else {
                            if (this.filter.regions.filtertype === 'all')
                                return false
                        }
                    }
                    if (this.filter.regions.filtertype === 'any' && !foundAny)
                        return false
                }

                // biome availability
                if (this.filter?.biomes?.filtertype) {
                    // check if any region definition at all
                    if (this.filter.biomes.filtertype === 'empty')
                        return (!availability?.biomes || availability.biomes.length === 0)
                    if (this.filter.biomes.filtertype === 'defined')
                        return (availability?.biomes && availability.biomes.length > 0)
                    // check for specific region
                    let foundAny = false
                    for (let regionKey of this.filter?.biomes?.keywords.toLowerCase().split(',')) {
                        if (availability?.biomes.find(r => r[0].includes(regionKey))) {
                            if (this.filter.biomes.filtertype === 'any') {
                                foundAny = true
                                break
                            }
                            if (this.filter.biomes.filtertype === 'none')
                                return false
                        } else {
                            if (this.filter.biomes.filtertype === 'all')
                                return false
                        }
                    }
                    if (this.filter.biomes.filtertype === 'any' && !foundAny)
                        return false
                }

                return true
            }
        )
        this._applySort()
    }

    async _resetFilter() {
        this.filter = {description: {show: this.filter.description.show}}
        await this._applyFilter()
    }

    async _selectFolder(event) {
        this.currentFolder = game.folders.find(f => f._id === event.currentTarget.value);
        this.itemList = this.currentFolder?.content
        await this._applyFilter()
    }

    async _selectPack(event) {
        this.currentPack = this.itemCompendiaOptions.find(p => p.collection === event.currentTarget.value);
        await this.currentPack?.getIndex()
        let newItemList = []
        for (let e of this.currentPack?.index) {
            let item = await this.currentPack.getEntry(e._id)
            newItemList.push(item)
        }
        this.itemList = newItemList
        await this._applyFilter()
    }

    async _copyTag(event) {
        const itemId = $(event.currentTarget).attr("data-item-id")
        const item = this.itemList.find(i => i._id === itemId);
        let availability = item.data.data?.availability ? item.data.data?.availability : item.data?.availability
        if (!availability) return

        let newTag = {general: availability.general, overwrite: this.tag.overwrite}
        for (let e of availability.regions)
            newTag['region' + e[1]] = e[0]
        for (let e of availability.biomes)
            newTag['biome' + e[1]] = e[0]
        this.tag = newTag
        this.render()
    }

    async _applyTag(event) {
        const itemId = $(event.currentTarget).attr("data-item-id")
        const item = this.itemList.find(i => i._id === itemId);
        let availability = item.data.data?.availability ? item.data.data?.availability : item.data?.availability
        if (!availability) availability = {}

        let general = (this.tag.overwrite && this.tag.general || !availability.general) ? this.tag.general : availability.general
        let regions = this.tag.overwrite ? [] : availability.regions || []
        let biomes = this.tag.overwrite ? [] : availability.biomes || []
        for (let [k, v] of Object.entries(this.tag)) {
            if (k.substr(0, 6) === 'region') {
                let values = v.split(',') || [];
                for (let value of values)
                    if (value) regions.push([value, parseInt(k.substr(6))])
            } else if (k.substr(0, 5) === 'biome') {
                let values = v.split(',') || [];
                for (let value of values)
                    if (value) biomes.push([value, parseInt(k.substr(5))])
            }
        }
        // local item
        if (item.data.data?.availability) {
            await item.update({"data.availability": {general, regions, biomes}})
        } else {
            /*
                // temporary hack to migrate from old format
                if (item.data.location) {
                    regions = []
                    biomes = []
                    for (let weight = 1; weight <= 5; weight++) {
                        let regionString = item.data.location['rarity' + weight]?.region.value || ''
                        for (let region of regionString?.split(','))
                            if (region) {
                                if (region === 'sonst')
                                    general = weight
                                else
                                    regions.push([region, weight])
                            }

                        let biomeString = item.data.location['rarity' + weight]?.biome.value || ''
                        for (let biome of biomeString?.split(','))
                            if (biome)
                                biomes.push([biome, weight])
                    }
                    delete item.data.location
                    delete item.data.data
                }
            */

            item.data.availability = {general, regions, biomes}
            await this.currentPack.updateEntity(item);
        }
        await this._applyFilter()
    }

}
