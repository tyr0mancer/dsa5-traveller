import {moduleName} from "../dsa5-traveller.js";

export class ItemManager extends Application {

    constructor() {
        super();
        this.itemCompendiaOptions = game.packs.filter(p => p.metadata.entity === 'Item')
        this.currentPack = undefined

        this.itemFolderOptions = game.folders.filter(f => (f.data.type === "Item"));
        this.hideFiltered = false
        this.filter = {}
        this.tag = {}
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
        options.width = 1000;
        options.height = 800;
        return options;
    }

    /* collect and provide data for the template */
    async getData() {
        return {
            itemCompendiaOptions: this.itemCompendiaOptions,
            currentPack: this.currentPack,

            itemFolderOptions: this.itemFolderOptions,
            currentFolder: this.currentFolder,
            hideFiltered: this.hideFiltered,
            filter: this.filter,
            tag: this.tag,

            itemsLeft: this.mainIndex,
            itemsRight: this.filteredIndex,
        }
    }


    async activateListeners(html) {
        super.activateListeners(html);
        html.find("nav.help-icon").click((event) => $('.help-info.help-' + $(event.currentTarget).attr("data-help")).toggle())
        html.find("button[name=filter-apply]").click(() => this._applyFilter())
        html.find("button[name=filter-reset]").click(() => this._resetFilter())
        html.find("select[name=select-folder]").change(event => this._selectFolder(event))
        html.find("input[name=hide-filtered]").change(event => {
            this.hideFiltered = event.currentTarget.checked === true
            this._applyFilter()
        })
        html.find("input.filter[type=text]").change((event) => this.filter[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.filter[type=checkbox]").change((event) => this.filter[event.currentTarget.name] = event.currentTarget.checked === true)
        html.find("select.tag").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.tag[type=text]").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.value)
        html.find("input.tag[type=checkbox]").change((event) => this.tag[event.currentTarget.name] = event.currentTarget.checked === true)
        html.find("tr.apply-tag").click((event) => this._applyTag(event))
    }


    async _applyFilter() {
        this.filteredIndex = this.currentFolder?.content.filter(item => {
                if (!this.filter || !Object.keys(this.filter).length)
                    return false
                console.log(this.filter)

                let availability = item.data.data.availability
                if (this.filter.omit_general && availability?.general) return false
                if (this.filter.omit_biomes && availability?.biomes?.length) return false
                if (this.filter.omit_regions && availability?.regions?.length) return false

                if (this.filter.region) {
                    console.log(this.filter.region)
                    console.log(availability)
                    return (availability === undefined || availability.regions.find(e => e[0] === this.filter.region))
                }
                if (this.filter.biome) {
                    return availability !== undefined
                }

                return true
            }
        )
        const
            filteredIdList = this.filteredIndex?.map(item => item._id)
        this
            .mainIndex = !this.hideFiltered
            ? this.currentFolder?.content
            : this.currentFolder?.content.filter((item) => !filteredIdList.includes(item._id))

        this
            .render()
    }

    async _resetFilter() {
        this.filter = {}
        await this._applyFilter()
    }

    async _selectFolder(event) {
        const folderId = event.currentTarget.value
        this.currentFolder = game.folders.find(f => f._id === folderId);
        await this._applyFilter()
    }

    async _applyTag(event) {
        const itemId = $(event.currentTarget).attr("data-item-id")
        const item = await this.currentFolder?.content.find(i => i._id === itemId);
        let general = (this.tag.overwrite && this.tag.general || !item.data.data.availability?.general) ? this.tag.general : item.data.data.availability?.general
        let regions = this.tag.overwrite ? [] : item.data.data.availability?.regions || []
        let biomes = this.tag.overwrite ? [] : item.data.data.availability?.biomes || []
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
        await item.update({"data.availability": {general, regions, biomes}})
        await this._applyFilter()
    }
}
