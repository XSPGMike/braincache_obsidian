import { App, addIcon, Modal, Notice, Plugin, TFile } from "obsidian";
import { extractDecksFromTaggedMarkdown, applyPatches } from "./process";
import { checkAuth, syncRemoteDecks } from "./api";
import { BCSetting } from "./settings";
import { BcCreateCard, BcSyncDecks } from "./commands";
import { ribbonIcon } from "./consts";

const DEFAULT_SETTINGS = {
	dateFormat: "testing",
};

const DEBUG = true;

export default class Braincache extends Plugin {
	settings: { dateFormat?: string } = {};

	async handleSync() {
		const authStatus = await checkAuth();
		if (authStatus) {
			this.syncDecks();
		} else {
			new LoginModal(this.app).open();
		}
	}

	async onload() {
		addIcon("braincache", ribbonIcon);
		this.addSettingTab(new BCSetting(this.app, this));
		await this.loadSettings();
		this.addRibbonIcon(
			"braincache",
			"braincache sync",
			async (_: MouseEvent) => {
				await this.handleSync();
			}
		);
		this.addCommand(BcCreateCard);
		this.addCommand(BcSyncDecks(this.handleSync));
		const cardCountEl = this.addStatusBarItem();
		cardCountEl.setText("0 cards");
	}

	async syncDecks() {
		DEBUG && console.time("auth check");
		const authStatus = await checkAuth();
		if (!authStatus) return;
		DEBUG && console.timeEnd("auth check");

		DEBUG && console.time("get md files and contents");
		const { vault } = this.app;

		let mdFiles: TFile[] = [];
		let mdFilesContents: string[] = [];

		for (const mdFile of vault.getMarkdownFiles()) {
			const mdFileContent = await vault.cachedRead(mdFile);
			if (mdFileContent.includes("#deck")) {
				mdFiles.push(mdFile);
				mdFilesContents.push(mdFileContent);
			}
		}
		DEBUG && console.timeEnd("get md files and contents");

		DEBUG && console.time("extract decks from tagged markdown");
		const decks = extractDecksFromTaggedMarkdown(mdFilesContents);
		const cardCount = decks.reduce((acc, el) => {
			return (acc += el.cards.length);
		}, 0);
		DEBUG && console.timeEnd("extract decks from tagged markdown");

		DEBUG && console.time("applying remote patches");
		const patches = await syncRemoteDecks(decks, vault);
		const patchedCount = patches.filter((el) => el !== undefined).length;
		DEBUG && console.timeEnd("applying remote patches");

		DEBUG && console.time("applying local patches");
		await applyPatches(patches, mdFiles, mdFilesContents, vault);
		DEBUG && console.timeEnd("applying local patches");

		new Notice(
			`Synced ${patchedCount} of ${cardCount} cards to braincache`
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {}
}

class LoginModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		const title = titleEl.createDiv("login-title");

		title.createEl("img", {
			attr: {
				src: "https://braincache.co/android-chrome-192x192.baef1f58.png",
			},
		});

		title.createEl("p", { text: "login" });
		contentEl.createEl("p", {
			text: "paste your braincache token to continue",
		});

		const form = contentEl.createDiv("login-form");
		const input = form.createEl("input", {
			attr: { type: "password", placeholder: "obsidian-token" },
		});
		const buttonLogin = form.createEl("button", { text: "save" });

		buttonLogin.onclick = async () => {
			globalThis.localStorage.setItem("braincache-token", input.value);
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
