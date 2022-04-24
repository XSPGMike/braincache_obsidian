import { App, MarkdownView, Modal, Notice, Plugin } from 'obsidian';

const token = () => globalThis.localStorage.getItem('braincache-token');

export default class Braincache extends Plugin {

	async onload() {
        this.addRibbonIcon('sync', 'braincache', (_ : MouseEvent) => {
            document.cookie = `session=${token()}`
            if(!token){
              new LoginModal(this.app).open()
            } else {
              this.syncDecks()
            }
		});

		const cardCountEl = this.addStatusBarItem();
		cardCountEl.setText('0 cards');

	}

  async syncDecks() {
    new Notice("syncing braincache decks...")

    const res = await fetch("https://api.braincache.co/auth/status", {
      headers: {
        cookie: `session=${token()}`
      },
      credentials: 'include'
    })

    if(res.status !== 200){
      localStorage.removeItem('braincache-token');
      new Notice("failed to sync decks, login again")
    }

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
