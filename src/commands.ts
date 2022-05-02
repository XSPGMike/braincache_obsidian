import { Editor } from 'obsidian'
import { cardTemplate } from './process'

export const BcCreateCard = {
    id: "braincache-create-card",
    name: "create card",
    editorCallback: (editor: Editor) => {
    const doc = editor.getValue()
    if(doc.includes('#deck')){
        editor.replaceRange(cardTemplate(), editor.getCursor())
        editor.setCursor(editor.getCursor().line - 3, 0)
        return
    }
    editor.replaceRange(cardTemplate(true), editor.getCursor())
    editor.setCursor(editor.getCursor().line - 3, 0)
    }
}

export const BcSyncDecks = (handleSync: () => void) => ({
    id: "braincache-sync-decks",
    name: "sync decks",
    callback: () => {
        handleSync()
    }
})