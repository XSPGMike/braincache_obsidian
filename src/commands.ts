import { Editor } from "obsidian";
import { cardTemplate } from "./process";

export const BcCreateCard = {
	id: "braincache-create-card",
	name: "Create card",
	editorCallback: (editor: Editor) => {
		const doc = editor.getValue();
		const hasDeck = doc.includes("#deck");
		editor.replaceRange(cardTemplate(!hasDeck), editor.getCursor());
		editor.setCursor(editor.getCursor().line - 3, 0);
	},
};

export const BcSyncDecks = (handleSync: () => void) => ({
	id: "braincache-sync-decks",
	name: "Sync decks",
	callback: () => {
		handleSync();
	},
});
