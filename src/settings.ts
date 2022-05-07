import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import Braincache from "./main";

export class BCSetting extends PluginSettingTab {
	plugin: Braincache;

	constructor(app: App, plugin: Braincache) {
		super(app, plugin);
		this.plugin = plugin;
	}

	handleLogout = () => {
		const authToken = localStorage.getItem("braincache-token");
		if (authToken) {
			localStorage.removeItem("braincache-token");
			new Notice("braincache user logged out");
			console.log("bc user logged out");
		} else {
			new Notice("no user logged in");
			console.log("no bc user is logged");
		}
	};

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Logout")
			.setDesc("logout from braincache")
			.addButton((btn) => {
				btn.setButtonText("logout").onClick(() => {
					this.handleLogout();
				});
			});
	}
}
