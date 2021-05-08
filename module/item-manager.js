import {moduleName} from "../dsa5-traveller.js";
import Dsa5Availability from "./dsa5-availability.js";

export class ItemManager extends Application {

    constructor() {
        super();
        this.itemCompendiaOptions = game.packs.filter(p => p.metadata.entity === 'Item')
        this.itemFolderOptions = game.folders.filter(f => (f.data.type === "Item"));
        this.hideFiltered = false
        this.filter = {}
        this.tag = {}
        this.currentLocation = Dsa5Availability.currentLocation
        Hooks.on(moduleName + ".update-location", () => {
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
            hideFiltered: this.hideFiltered,
            filter: this.filter,
            tag: this.tag,
            itemsLeft: this.mainIndex,
            itemsRight: this.filteredIndex,
            currentLocation: this.currentLocation
        }
    }


    async activateListeners(html) {
        super.activateListeners(html);
        html.find("nav.help-icon").click((event) => $('.help-info.help-' + $(event.currentTarget).attr("data-help")).toggle())
        html.find("button[name=filter-apply]").click(() => this._applyFilter())
        html.find("button[name=filter-reset]").click(() => this._resetFilter())
        html.find("select[name=select-folder]").change(event => this._selectFolder(event))
        html.find("select[name=select-pack]").change(event => this._selectPack(event))
        html.find("input[name=hide-filtered]").change(event => {
            this.hideFiltered = event.currentTarget.checked === true
            this._applyFilter()
        })
        html.find("input.filter[type=text]").change((event) => this.filter[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.filter[type=checkbox]").change((event) => this.filter[event.currentTarget.name] = event.currentTarget.checked === true)
        html.find("select.tag").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.tag[type=text]").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.tag[type=checkbox]").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.checked === true)
        //html.find("tr.apply-tag").click((event) => this._applyTag(event))
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


    async _applyFilter() {
        this.filteredIndex = this.itemList?.filter(item => {
                if (!this.filter || !Object.keys(this.filter).length)
                    return false
                let availability = item.data.data?.availability ? item.data.data?.availability : item.data?.availability
                /*
                    // temporary hack to migrate from old format
                    if (this.filter.omit_general) {
                        if (item.data.location) return true
                        return false
                    }
                */
                if (this.filter.omit_general && availability?.general) return false
                if (this.filter.omit_biomes && availability?.biomes?.length) return false
                if (this.filter.omit_regions && availability?.regions?.length) return false
                if (this.filter.region) {
                    return (availability?.regions.find(e => e[0].toLowerCase().includes(this.filter.region.toLowerCase())))
                }
                if (this.filter.biome)
                    return (availability?.biomes.find(e => e[0] === this.filter.biome))
                return true
            }
        )
        const filteredIdList = this.filteredIndex?.map(item => item._id)
        this.mainIndex = !this.hideFiltered
            ? this.itemList
            : this.itemList?.filter((item) => !filteredIdList.includes(item._id))
        this.render()
    }

    async _resetFilter() {
        this.filter = {}
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
