import { PluginSettingTab, Setting, ToggleComponent } from "obsidian";
import {
    SettingFocus,
    SettingFolders,
    SettingImages,
    SettingLinks,
    SettingElementsStats,
    SettingPerformance,
    SettingPropertiesArray,
    SettingShapes,
    SettingsSection,
    SettingTags,
    SettingZoom,
    PluginInstances,
    SettingNames,
    SettingIcons,
    SettingArrows,
    ExtendedGraphSettings,
    SettingQuery,
    SettingAutomation,
    SettingDisplay,
    SettingBeta
} from "src/internal";
import ExtendedGraphPlugin from "src/main";
import STRINGS from "src/Strings";

export class ExtendedGraphSettingTab extends PluginSettingTab {
    sections: SettingsSection[] = [];
    originalSettings: ExtendedGraphSettings;
    showResetModalToggle: ToggleComponent;

    constructor(plugin: ExtendedGraphPlugin) {
        super(PluginInstances.app, plugin);

        this.sections.push(new SettingAutomation(this));
        this.sections.push(new SettingTags(this));
        this.sections.push(new SettingPropertiesArray(this));
        this.sections.push(new SettingLinks(this));
        this.sections.push(new SettingArrows(this));
        this.sections.push(new SettingFolders(this));
        this.sections.push(new SettingImages(this));
        this.sections.push(new SettingIcons(this));
        this.sections.push(new SettingFocus(this));
        this.sections.push(new SettingShapes(this));
        this.sections.push(new SettingElementsStats(this));
        this.sections.push(new SettingNames(this));
        this.sections.push(new SettingZoom(this));
        this.sections.push(new SettingDisplay(this));
        this.sections.push(new SettingPerformance(this));
        this.sections.push(new SettingBeta(this));
    }

    display(): void {
        this.originalSettings = structuredClone(PluginInstances.settings);
        this.containerEl.empty();
        this.containerEl.addClass("extended-graph-settings");

        this.addNav();
        this.addDisableNodes();

        // FEATURES
        for (const section of this.sections) {
            section.display();
        }
    }

    private addNav(): void {
        const nav = this.containerEl.createDiv({ cls: "extended-graph-nav-settings" });

        const label = nav.createDiv({ cls: "nav-label" });
        label.innerText = "Go to";
    }

    private addDisableNodes() {
        new Setting(this.containerEl)
            .setName(STRINGS.features.disableNodes)
            .setDesc(STRINGS.features.disableNodesDesc)
            .addToggle(cb => {
                cb.setValue(!PluginInstances.settings.fadeOnDisable);
                cb.onChange(value => {
                    PluginInstances.settings.fadeOnDisable = !value;
                    PluginInstances.plugin.saveSettings();
                })
            });
    }

    hide(): void {
        if (PluginInstances.graphsManager && PluginInstances.settings.resetAfterChanges) {
            if (SettingQuery.needReload(this.originalSettings, 'graph')) {
                PluginInstances.graphsManager.resetAllPlugins('graph');
            }
            if (SettingQuery.needReload(this.originalSettings, 'localgraph')) {
                PluginInstances.graphsManager.resetAllPlugins('localgraph');
            }
        }
        super.hide();
    }

}