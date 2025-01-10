import { InteractiveManager } from "../interactiveManager";
import { ElementWrapper } from "./element";
import { GraphLink } from "src/types/link";


export abstract class LinkWrapper extends ElementWrapper {
    link: GraphLink;
    name: string;

    // ============================== CONSTRUCTOR ==============================

    constructor(link: GraphLink, types: Set<string>, manager: InteractiveManager) {
        super(getLinkID(link), types, manager);

        this.link = link;
        this.types = types;
        this.manager = manager;

        this.initGraphics();
        this.updateGraphics();

        this.connect();
    }
    
    // ========================== CONNECT/DISCONNECT ===========================

    updateLink(): void {
        if (!this.link.line) {
            const newLink = this.link.renderer.links.find(l => l.source.id === this.link.source.id && l.target.id === this.link.target.id);
            if (newLink && this.link !== newLink) {
                this.disconnect();
                this.link = newLink;
            }
        }
    }

    abstract connect(): void;

    disconnect(): void {
        this.removeFromParent();
    }

    // ============================= INITALIZATION =============================

    initGraphics(): void {}

    // ============================ CLEAR GRAPHICS =============================

    clearGraphics(): void {
        this.clear();
    }

    // ============================ ENABLE/DISABLE =============================

    toggleType(type: string, enable: boolean): void {
        this.updateGraphics();
    }
}

export class LineLinkWrapper extends LinkWrapper {
    connect(): void {
        if (this.link.line && !this.link.line.getChildByName(this.name)) {
            this.link.line.addChild(this);
        }
    }

    updateGraphics(): void {
        const type = this.getActiveType();
        if (!type) return;

        this.clear();
        this.lineStyle({width: 16, color: this.manager.getColor(type)})
            .moveTo(0, 8)
            .lineTo(16, 8);
        this.alpha = 0.6;
    }
}

export function getLinkID(link: {source: {id: string}, target: {id: string}}): string {
    return link.source.id + "--to--" + link.target.id;
}