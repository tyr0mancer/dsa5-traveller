import {moduleName} from "../dsa5-traveller.js";
import Dsa5Availability, {
    getBiomeKeyFromLocation,
    getRegionKeysFromLocation,
    getItemAvailability
} from "./dsa5-availability.js";


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
            availabilityOptions: Dsa5Availability.AVAILABILITY_OPTIONS,
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

        // datasource
        html.find("button[name=reset-filter]").click(() => this._resetFilter())
        html.find("button[name=select-folder]").click(event => this._selectFolder(event))
        html.find("select[name=select-folder]").change(event => this._selectFolder(event))
        html.find("button[name=select-pack]").click(event => this._selectPack(event))
        html.find("select[name=select-pack]").change(event => this._selectPack(event))

        html.find("button[name=calculate-availability]").click(event => this._calculateAvailability(event))


        // filter + sorter
        html.find(".filter").change((event) => this._setFilter(event))
        html.find("a[name=sorter]").click((event) => this._setSorter(event))

        // tag / label
        html.find(".tag").change((event) => this._setTag(event))
        html.find("button[name=apply-current-location]").click((event) => this._applyCurrentLocation(event))
        html.find(".tag-entry").mousedown((event) => this._changeEntryWeight(event))
        html.find("button[name=set-tag-value]").click((event) => this._setTagValue(event))

        html.find("button[name=filter-img]").click((event) => {
            const suffix = $(event.currentTarget).attr("data-suffix")
            this.filteredIndex = this.itemList.filter(i => {
                return i.img.endsWith(suffix)
            })
            this.render()
        })
        html.find("button[name=to-webp]").click(async (event) => {
            /*
                        for (let item of this.filteredIndex) {
                            if (item.data.data?.location !== undefined)
                                await item.update({"data.location": null})
                            if (item.data.data?.data !== undefined)
                                await item.update({"data.data": null})
                        }
                        this.render()
            */
        })

        html.find("td.apply-tag").mousedown((event) => {
            //event.preventDefault();
            let isRightMB = false;
            if ("which" in event) { // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                isRightMB = event.which == 3;
            } else if ("button" in event) { // IE, Opera
                isRightMB = event.button == 2;
            }
            if (isRightMB) {
                this._readTag(event)
            } else {
                this._applyTag(event)
            }
        })
    }

    _applyCurrentLocation(event) {
        this.tag.value = this.currentLocation
        this.tag.value = {
            general: 3,
            regions: getRegionKeysFromLocation(this.currentLocation).map(r => [r, 3]),
            biomes: [[getBiomeKeyFromLocation(this.currentLocation), 3]] || []
        }
        this.render()
    }

    async _setFilter(event) {
        let obj = {}
        obj[event.currentTarget.name] = (event.currentTarget.type === "checkbox")
            ? event.currentTarget.checked === true
            : event.currentTarget.value
        this.filter = mergeObject(this.filter, expandObject(obj))
        await this._applyFilter()
    }

    async _setTag(event) {
        let obj = {}
        obj[event.currentTarget.name] = (event.currentTarget.type === "checkbox")
            ? event.currentTarget.checked === true
            : event.currentTarget.value
        this.tag = mergeObject(this.tag, expandObject(obj))
        this.render()
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
                b = e2.data?.availability?.general || e2.data?.data?.availability?.general || -1
            } else if (key === 'current') {
                a = e1.data?.availability?.current || e1.data?.data?.availability?.current || -1
                b = e2.data?.availability?.current || e2.data?.data?.availability?.current || -1
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
        if (event.currentTarget.value)
            this.currentFolder = game.folders.find(f => f._id === event.currentTarget.value);
        this.itemList = this.currentFolder?.content
        await this._applyFilter()
    }

    async _selectPack(event) {
        if (event.currentTarget.value)
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


    _setSorter(event) {
        let key = $(event.currentTarget).attr("data-sort-key")
        if (this.sorting.key === key)
            this.sorting.direction *= -1
        else
            this.sorting = {key, direction: 1}
        this._applySort()
    }

    async _readTag(event) {
        const itemId = $(event.currentTarget).attr("data-item-id")
        const item = this.itemList.find(i => i._id === itemId);
        let availability = duplicate(item.data?.data?.availability || item.data?.availability)
        if (!availability) return
        this.tag.value = availability
        this.render()
    }

    async _applyTag(event) {

        const itemId = $(event.currentTarget).attr("data-item-id")
        const item = this.itemList.find(i => i._id === itemId);

        const mergeArray = (oldArray = [], newArray = []) => {
            let result = oldArray
            for (let entry of newArray) {
                let existingEntry = result.find(e => e[0] === entry[0])
                if (!existingEntry)
                    result.push(entry)
                else
                    existingEntry[1] = entry[1]
            }
            return result
        }

        const oldAvailability = item.data?.data?.availability || item.data?.availability || {}
        const newAvailability = {
            general: (this.tag.overwrite?.general)
                ? this.tag?.value?.general
                : (!oldAvailability?.general)
                    ? this.tag.value?.general
                    : oldAvailability?.general,
            regions: (this.tag.overwrite?.regions)
                ? this.tag?.value?.regions
                : (oldAvailability?.regions === undefined || !oldAvailability?.regions.length)
                    ? this.tag.value?.regions
                    : mergeArray(oldAvailability.regions, this.tag.value?.regions),
            biomes: (this.tag.overwrite?.biomes)
                ? this.tag?.value?.biomes
                : (oldAvailability?.biomes === undefined)
                    ? this.tag.value?.biomes
                    : mergeArray(oldAvailability.biomes, this.tag.value?.biomes),
        }


        // local item
        if (item.data.data) {
            await item.update({"data.availability": newAvailability})
        } else {
            item.data.availability = newAvailability
            await this.currentPack.updateEntity(item);
        }
        await this._applyFilter()
    }


    _changeEntryWeight(event) {
        //event.preventDefault();
        const regionId = $(event.currentTarget).attr("data-region-id")
        const biomeId = $(event.currentTarget).attr("data-biome-id")

        let isRightMB = false;
        if ("which" in event) { // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = event.which == 3;
        } else if ("button" in event) { // IE, Opera
            isRightMB = event.button == 2;
        }

        if (isRightMB) {
            if (regionId && this.tag.value.regions[regionId][1]-- === 0)
                this.tag.value.regions.splice(regionId)
            //this.tag.value.regions[regionId][1] = 0

            if (biomeId && this.tag.value.biomes[biomeId][1]-- === 0)
                this.tag.value.biomes.splice(biomeId)
            //this.tag.value.biomes[biomeId][1] = 0

            if (!biomeId && !regionId && this.tag.value.general-- === 0)
                this.tag.value.general = 0
        } else {
            if (regionId && this.tag.value.regions[regionId][1]++ === 5)
                this.tag.value.regions[regionId][1] = 5
            if (biomeId && this.tag.value.biomes[biomeId][1]++ === 5)
                this.tag.value.biomes[biomeId][1] = 5
            if (!biomeId && !regionId && this.tag.value.general++ === 5)
                this.tag.value.general = 5
        }

        this.render()

    }

    _setTagValue(event) {
        const dataType = $(event.currentTarget).attr("data-type")

        const regions = game.settings.get(moduleName, 'regions')
        const biomes = game.settings.get(moduleName, 'biomes')

        let content = ``

        if (dataType === 'regions')
            for (let category of regions) {
                content += `<h2>${category.name}</h2>`
                for (let entry of category.index) {
                    let checked = (this.tag.value && this.tag.value[dataType]?.find(r => r[0] === entry.key) !== undefined) ? 'checked' : ''
                    content += `<input type="checkbox" id="${category.key}-${entry.key}" name="${entry.key}" ${checked} /><label for="${category.key}-${entry.key}">${entry.name}</label>`
                }
            }
        else
            for (let entry of biomes) {
                let checked = (this.tag.value && this.tag.value[dataType]?.find(r => r[0] === entry.key) !== undefined) ? 'checked' : ''
                content += `<input type="checkbox" id="biome-${entry.key}" name="${entry.key}" ${checked} /><label for="biome-${entry.key}">${entry.name}</label>`
            }


        let types = ['one']
        const d = new Dialog({
            title: "Region / Landschaftstyp auswählen",
            content,
            buttons: {
                'ok': {
                    label: 'auswählen',
                    callback: async (html) => {
                        let selection = []
                        for (let data of html.find('input[type=checkbox]')) {
                            if (!data.checked) continue
                            let e = data.name.split('.')
                            selection.push([data.name, 3])
                        }
                        let newValue = {}
                        newValue[dataType] = selection
                        this.tag = mergeObject(this.tag, {value: newValue})
                        this.render()
                    }
                }
            },
            default: types[0],
        });
        d.render(true);


    }

    async _calculateAvailability() {
        for (let item of this.itemList) {
            /*
            // if you wanna use the tag info instead
                let applicableRegionKeys = this.tag?.value?.regions?.map(r => r[0]) || []
                let applicableBiomeKey = this.tag?.value?.biomes[0] ? this.tag.value.biomes[0][0] : ''
                let current = getItemAvailability({item, applicableRegionKeys, applicableBiomeKey})
            */
            let current = getItemAvailability({item})
            await this._updateItemAvailability(item, {current})
        }

        await this._applyFilter()
    }

    async _updateItemAvailability(item, obj) {
        if (item.data.data && !item.data.availability) {
            let availability = item.data?.data?.availability || {}
            mergeObject(availability, obj)
            await item.update({"data.availability": availability})
        } else if (item.data.availability) {
            let availability = item.data.availability || {}
            item.data.availability = mergeObject(availability, obj)
            await this.currentPack.updateEntity(item);
        }
    }

    _getItemAvailability(item) {
        return item.data?.availability || item.data?.data?.availability || {}
    }

}

