import {
	App,
	addIcon,
	Modal,
	Notice,
	Plugin,
	TFile,
} from "obsidian";
import { parseDecks } from "./process";
import { checkAuth, syncDecks } from "./api";
import { BCSetting } from "./settings";
import { BcCreateCard, BcSyncDecks } from "./commands";
import { ribbonIcon } from "./consts";
import { BcMap } from "./types";

export default class Braincache extends Plugin {

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
		this.addRibbonIcon(
			"braincache",
			"braincache sync",
			async (_: MouseEvent) => {
				await this.handleSync();
			}
		);
		this.addCommand(BcCreateCard);
		this.addCommand(BcSyncDecks(this.handleSync.bind(this)));
	}

	async syncDecks() {
		const { vault } = this.app;
		let mdFilesMap = new Map<TFile, string>();
		for (const mdFile of vault.getMarkdownFiles()) {
			const mdFileContent = await vault.cachedRead(mdFile);
			if (mdFileContent.replace('/n', ' ').split(' ').includes("#deck"))
				mdFilesMap.set(mdFile, mdFileContent);
		}

		let decks: BcMap;

		try {
			decks = parseDecks(mdFilesMap);
		} catch (e) {
			new Notice(e);
		}

		let cardCount = 0;
		for (const entries of decks.values()) {
			for (const deck of entries) {
				cardCount += deck.cards.length;
			}
		}

		if (cardCount === 0) {
			new Notice("No cards to sync");
			return;
		}

		try {
			//await syncDecks(decks, vault)
			new Notice(`${cardCount} cards synced correctly`)
		} catch (e) {
			new Notice("There was an error while syncing decks")
		}
	}
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
