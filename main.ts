import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as electron from 'electron';

export default class Braincache extends Plugin {

	async onload() {
        this.addRibbonIcon('sync', 'braincache', (evt: MouseEvent) => {
			electron.remote.app.commandLine.appendSwitch('allow-insecure-localhost', 'true')
            const token = globalThis.localStorage.getItem('braincache-token')
            if(!token){
                new LoginModal(this.app).open()
            } else {
                fetch("https://localhost:8000/auth/status", {
                  headers; {

                  }
                }).then((res) => {
                    if(res.status == 401){
                      console.log("401")
                    } else {
                      console.log("200")
                    }
                })
                //new Notice('syncing decks...');
            }
		});

		const cardCountEl = this.addStatusBarItem();
		cardCountEl.setText('0 cards');

		this.addCommand({
			id: 'open-login-modal',
			name: 'login',
			callback: () => {
				console.log("login")
				//new LoginModal(this.app).open();
			}
		});

		/* editor callback 
		
			this.addCommand({
				id: 'sample-editor-command',
				name: 'Sample editor command',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					console.log(editor.getSelection());
					editor.replaceSelection('Sample Editor Command');
				}
			}); 

		*/

		/* check app status before callback
   
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new LoginModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

    */

		/* add settings
     
		this.addSettingTab(new SampleSettingTab(this.app, this));

    async saveSettings() {
      await this.saveData(this.settings);
    }

    */

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		});

    // cleanup
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

	}

	onunload() {

	}

}

type loginArgs = (email: string, password: string) => Promise<{status: boolean, token?: string}>

const login: loginArgs = async(email, password) => {
    const res = await fetch('https://api.braincache.co/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            })
    const json = await res.json()
    console.log(json)

    return {
        status: true,
        token: 'testing'
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

class BraincacheSettingTab extends PluginSettingTab {
	plugin: Braincache;

	constructor(app: App, plugin: Braincache) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}