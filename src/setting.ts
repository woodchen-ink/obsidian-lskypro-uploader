import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import imageAutoUploadPlugin from "./main";
import { t } from "./lang/helpers";

export interface PluginSettings {
  uploadByClipSwitch: boolean;
  uploadServer: string;
  token: string;
  strategy_id: string;
  uploader: string;
  workOnNetWork: boolean;
  newWorkBlackDomains: string;
  fixPath: boolean;
  applyImage: boolean;
  deleteSource: boolean;
  isPublic: boolean;
  albumId: string;
  [propName: string]: any;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  uploadByClipSwitch: true,
  uploader: "LskyPro",
  token: "",
  strategy_id:"",
  uploadServer: "https://img.czl.net",
  workOnNetWork: false,
  fixPath: false,
  applyImage: true,
  newWorkBlackDomains: "",
  deleteSource: false,
  isPublic: false,
  albumId: "",
};

export class SettingTab extends PluginSettingTab {
  plugin: imageAutoUploadPlugin;

  constructor(app: App, plugin: imageAutoUploadPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName(t("Auto pasted upload"))
      .setDesc(
        "启用该选项后，黏贴图片时会自动上传到lsky图床"
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.uploadByClipSwitch)
          .onChange(async value => {
            this.plugin.settings.uploadByClipSwitch = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Default uploader"))
      .setDesc(t("Default uploader"))
      .addDropdown(cb =>
        cb
          .addOption("LskyPro", "LskyPro")
          .setValue(this.plugin.settings.uploader)
          .onChange(async value => {
            this.plugin.settings.uploader = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    if (this.plugin.settings.uploader === "LskyPro") {
      new Setting(containerEl)
        .setName("LskyPro 域名")
        .setDesc("LskyPro 域名（不需要填写完整的API路径）")
        .addText(text =>
          text
            .setPlaceholder("请输入LskyPro 域名(例如:https://img.czl.net)")
            .setValue(this.plugin.settings.uploadServer)
            .onChange(async key => {
              this.plugin.settings.uploadServer = key;
              await this.plugin.saveSettings();
            })
        );
        new Setting(containerEl)
        .setName("LskyPro Token")
        .setDesc("LskyPro Token(不需要包含Bearer)")
        .addText(text =>
          text
            .setPlaceholder("请输入LskyPro Token")
            .setValue(this.plugin.settings.token)
            .onChange(async key => {
              this.plugin.settings.token = key;
              await this.plugin.saveSettings();
            })
        );
        new Setting(containerEl)
        .setName("LskyPro Strategy id")
        .setDesc("LskyPro 存储策略ID（非必填）")
        .addText(text =>
          text
            .setPlaceholder("存储策略ID")
            .setValue(this.plugin.settings.strategy_id)
            .onChange(async key => {
              this.plugin.settings.strategy_id = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("图片是否公开")
        .setDesc("设置上传图片的权限（开启=公开，关闭=私有）")
        .addToggle(toggle =>
          toggle
            .setValue(this.plugin.settings.isPublic)
            .onChange(async value => {
              this.plugin.settings.isPublic = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("相册ID")
        .setDesc("指定上传到的相册ID（可选）")
        .addText(text =>
          text
            .setPlaceholder("相册ID")
            .setValue(this.plugin.settings.albumId)
            .onChange(async value => {
              this.plugin.settings.albumId = value;
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName(t("Work on network"))
      .setDesc(t("Work on network Description"))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.workOnNetWork)
          .onChange(async value => {
            this.plugin.settings.workOnNetWork = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Network Domain Black List"))
      .setDesc(t("Network Domain Black List Description"))
      .addTextArea(textArea =>
        textArea
          .setValue(this.plugin.settings.newWorkBlackDomains)
          .onChange(async value => {
            this.plugin.settings.newWorkBlackDomains = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Upload when clipboard has image and text together"))
      .setDesc(
        t(
          "When you copy, some application like Excel will image and text to clipboard, you can upload or not."
        )
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.applyImage)
          .onChange(async value => {
            this.plugin.settings.applyImage = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Delete source file after you upload file"))
      .setDesc(t("Delete source file in ob assets after you upload file."))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.deleteSource)
          .onChange(async value => {
            this.plugin.settings.deleteSource = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );
  }
}
