
import { Component } from "obsidian";
import { getColor, hex2rgb } from "../colors/colors";
import { INVALID_KEYS, NONE_COLOR } from "src/globalVariables";
import { GraphViewData } from "src/views/viewData";
import { ExtendedGraphSettings } from "src/settings/settings";
import { GraphEventsDispatcher } from "./graphEventsDispatcher";

class Interactive {
    type: string;
    color: Uint8Array;
    isActive: boolean;

    constructor(type: string, color: Uint8Array) {
        this.type = type;
        this.color = color;
        this.isActive = true;
    }

    setColor(color: Uint8Array) {
        this.color = color;
    }
}

export class InteractiveManager extends Component {
    interactives: Map<string, Interactive>;
    settings: ExtendedGraphSettings;
    name: string;
    dispatcher: GraphEventsDispatcher;
    
    constructor(dispatcher: GraphEventsDispatcher, settings: ExtendedGraphSettings, name: string) {
        super();
        this.interactives = new Map<string, Interactive>();
        this.dispatcher = dispatcher;
        this.settings = settings;
        this.name = name;
    }

    disable(types: string[]): void {
        const disabledTypes: string[] = [];
        types.forEach(type => {
            const interactive = this.interactives.get(type);
            if (interactive) {
                interactive.isActive = false;
                disabledTypes.push(type);
            }
        });
        if (disabledTypes.length > 0) this.dispatcher.onInteractivesDisabled(this.name, disabledTypes);
    }

    enable(types: string[]): void {
        const enabledTypes: string[] = [];
        types.forEach(type => {
            const interactive = this.interactives.get(type);
            if (interactive) {
                interactive.isActive = true;
                enabledTypes.push(type);
            }
        });
        if (enabledTypes.length > 0) this.dispatcher.onInteractivesEnabled(this.name, enabledTypes);
    }

    loadView(viewData: GraphViewData): void {
        const viewTypesToDisable: string[] = viewData.disabledTypes[this.name];
        // Enable/Disable tags
        const toDisable: string[] = [];
        const toEnable: string[] = [];
        this.getTypes().forEach(type => {
            const interactive = this.interactives.get(type);
            if (!interactive) return;
            if (interactive.isActive && viewTypesToDisable?.includes(type)) {
                interactive.isActive = false;
                toDisable.push(type);
            }
            else if (!interactive.isActive && !viewTypesToDisable?.includes(type)) {
                interactive.isActive = true;
                toEnable.push(type);
            }
        });

        if (toDisable.length > 0) this.dispatcher.onInteractivesDisabled(this.name, toDisable);
        if (toEnable.length > 0) this.dispatcher.onInteractivesEnabled(this.name, toEnable);
    }

    isActive(type: string): boolean {
        const interactive = this.interactives.get(type);
        if (!interactive) return false;

        return interactive.isActive;
    }

    setColor(type: string, color: Uint8Array): void {
        const interactive = this.interactives.get(type);
        if (!interactive) return;

        interactive.setColor(color);
        this.dispatcher.onInteractiveColorChanged(this.name, type, color);
    }

    removeTypes(types: Set<string>) {
        types.forEach(type => {
            this.interactives.delete(type);
        });
        this.dispatcher.onInteractivesRemoved(this.name, types);
    }

    addTypes(types: Set<string>): void {
        const colorsMaps = new Map<string, Uint8Array>();
        const allTypes = new Set<string>([...this.interactives.keys(), ...types]);
        const allTypesWithoutNone = new Set<string>(allTypes);
        allTypesWithoutNone.delete(this.settings.interactiveSettings[this.name].noneType);
        types.forEach(type => {
            if (INVALID_KEYS[this.name]?.includes(type) && this.settings.interactiveSettings[this.name].unselected.includes(type)) {
                return;
            }
            if (this.interactives.has(type)) return;

            let color = this.tryComputeColorFromType(type);
            if (!color) {
                const nColors = allTypesWithoutNone.size;
                const i = [...allTypesWithoutNone].indexOf(type);
                color = this.computeColorFromIndex(i, nColors);
            }

            colorsMaps.set(type, color);
            this.interactives.set(type, new Interactive(type, color));
        });
        this.interactives = new Map([...this.interactives.entries()].sort());
        if (colorsMaps.size > 0)
            this.dispatcher.onInteractivesAdded(this.name, colorsMaps);
    }

    getColor(type: string): Uint8Array {
        const interactive = this.interactives.get(type);
        return interactive ? interactive.color : new Uint8Array([0, 0, 0]);
    }

    getTypes(): string[] {
        return Array.from(this.interactives.keys());
    }

    getTypesWithoutNone(): string[] {
        const types = this.getTypes();
        types.remove(this.settings.interactiveSettings[this.name].noneType);
        return types;
    }
    
    update(types: Set<string>): void {
        this.interactives.clear();
        this.addTypes(types);
    }

    recomputeColors(): void {
        this.interactives.forEach((interactive, type) => {
            const color = this.tryComputeColorFromType(type);
            if (color) this.setColor(type, color);
        });
    }

    recomputeColor(type: string): void {
        if (!this.interactives.has(type)) return;

        const color = this.tryComputeColorFromType(type);
        if (color) this.setColor(type, color);
    }

    private tryComputeColorFromType(type: string): Uint8Array | null{
        let color: Uint8Array;
        const colorSettings = this.settings.interactiveSettings[this.name].colors.find(p => p.type === type)?.color;
        if (colorSettings) {
            color = hex2rgb(colorSettings);
        }
        else if (type === this.settings.interactiveSettings[this.name].noneType) {
            color = NONE_COLOR;
        }
        else {
            const allTypesWithoutNone = [...this.interactives.keys()];
            allTypesWithoutNone.remove(this.settings.interactiveSettings[this.name].noneType);
            const nColors = allTypesWithoutNone.length;
            const i = allTypesWithoutNone.indexOf(type);
            if (i < 0) {
                return null;
            }
            color = this.computeColorFromIndex(i, nColors);
        }

        return color;
    }

    private computeColorFromIndex(index: number, nColors: number) {
        const x = index / nColors;
        return getColor(this.settings.interactiveSettings[this.name].colormap, x);
    }
}