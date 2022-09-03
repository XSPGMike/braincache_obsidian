import {
	App,
	addIcon,
	Modal,
	Notice,
	Plugin,
	TFile,
} from "obsidian";
import { parseDecks, applyPatches } from "./process";
import { checkAuth, syncDecks } from "./api";
import { BCSetting } from "./settings";
import { BcCreateCard, BcSyncDecks } from "./commands";
import { ribbonIcon } from "./consts";

const DEFAULT_SETTINGS = {
	dateFormat: "testing",
};

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
		this.addCommand(BcSyncDecks(this.handleSync.bind(this)));
		const cardCountEl = this.addStatusBarItem();
		cardCountEl.setText("0 cards");
	}

	async syncDecks() {
		const { vault } = this.app;
		let mdFilesMap = new Map<TFile, string>();
		for (const mdFile of vault.getMarkdownFiles()) {
			const mdFileContent = await vault.cachedRead(mdFile);
			if (mdFileContent.includes("#deck")) {
				mdFilesMap.set(mdFile, mdFileContent);
			}
		}

		let decks;
		try {
			decks = parseDecks(mdFilesMap);
		} catch (e) {
			new Notice(e);
		}
		let cardCount = 0;
		for (const [_, entries] of decks.entries()) {
			for (const e of entries) {
				cardCount += e.cards.length;
			}
		}

		if (cardCount === 0) {
			new Notice("No cards to sync");
			return;
		}

		/*DEBUG && console.time("applying remote patches");
	  const { patches, del, results } = await syncRemoteDecks(decks, vault);
	  DEBUG && console.timeEnd("applying remote patches");

	  DEBUG && console.time("applying local patches");
	  await applyPatches(patches, mdFiles, mdFilesContents, vault);
	  DEBUG && console.timeEnd("applying local patches");

	  let totCount = 0;
	  let finals = [];
	  for (let i = 0; i < decks.length; i++) {
		finals.push({
		  name: decks[i].deckName,
		  synced: 0,
		  error: 0,
		});
		for (let y = 0; y < decks[i].cards.length; y++) {
		  if (results[totCount]) {
			finals.at(-1).synced++;
		  } else {
			finals.at(-1).error++;
		  }
		  totCount++;
		}
	  }

	  // notice that some decks have been deleted remotely
	  if (del) {
		new Notice(
		  `Some cards or decks were deleted remotely, delete local ids to sync them again!`
		);
	  }
	  new Notice(
		`total cards: ${cardCount}\n${finals
		  .map((d) => `${d.name}: ${d.synced} synced, ${d.error} errors`)
		  .join("\n")}`
	  );*/
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

	onunload() { }
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
