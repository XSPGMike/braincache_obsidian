import { App, Editor, Modal, Notice, Plugin } from 'obsidian';
import { cardTemplate, processDecks, postProcess } from './process'
import { checkAuth, uploadCards } from './api';

export default class Braincache extends Plugin {

	async onload() {
    this.addRibbonIcon('sync', 'braincache', (_ : MouseEvent) => {
      checkAuth()
        .then((authStatus) => {
          authStatus 
          ? this.syncDecks()
          : new LoginModal(this.app).open()
        })
		});

    this.addCommand({
      id: 'braincache-create-card',
      name: 'create card',
      editorCallback: (editor: Editor) => {
        const doc = editor.getValue()
        if(doc.includes('#deck')){
          editor.replaceRange(cardTemplate(), editor.getCursor())
          return
        }
        editor.replaceRange(cardTemplate(true), editor.getCursor())
        editor.setCursor(editor.getCursor().line - 5, 0)
      }
    })

		const cardCountEl = this.addStatusBarItem();
		cardCountEl.setText('0 cards');
	}

  async syncDecks() {
    const authStatus = await checkAuth()
    if(!authStatus) return

    const { vault } = this.app;

    let MDFiles: string[] = await Promise.all(
      vault.getMarkdownFiles().map((MDFile) => vault.cachedRead(MDFile))
    )

    const decks = processDecks(MDFiles)
    console.log(decks)

    let cardCount = 0;

    /*

    const processedCards = cardFiles
      .filter((el) => el.includes('#deck'))
      .map((file) => {
        const deckName = file.split('\n')[0].replace('#deck_', '')
        const cards = file.split('---')
          .filter((el) => el.includes('#q'))
          .map((card) => ({
            question: card.split('#q\n')[1].split('#a\n')[0],
            answer: card.split('#a\n')[1].split('\n---')[0]
          }))
        cardCount += cards.length

        return {
          deckName,
          cards
        }
      })

    await uploadCards(processedCards)

    */

    new Notice(`Synced ${cardCount} cards to braincache`)
  }

	onunload() {

	}

}

class LoginModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { titleEl, contentEl } = this;
        const title = titleEl.createDiv('login-title')

		title.createEl('img', { attr: 
            {src: 'https://braincache.co/android-chrome-192x192.baef1f58.png'}
        })

		title.createEl('p', { text: 'login'})
		contentEl.createEl('p', { text: 'paste your braincache token to continue' });

        const form = contentEl.createDiv('login-form')
        const input = form.createEl('input', { attr: { type: 'password', placeholder: 'obsidian-token' }})
        const buttonLogin = form.createEl('button', { text: 'save'})

        buttonLogin.onclick = async() => {
            globalThis.localStorage.setItem('braincache-token', input.value)
			this.close()
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

}
