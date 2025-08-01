import * as vscode from 'vscode';
import { AuthService } from './auth-service';
import { StorageService } from './storage-service';

export type PreferredAgent = 'stagewise-agent' | 'ide-chat';

export class AgentSelectorService {
  private static instance: AgentSelectorService;
  private statusbar: vscode.StatusBarItem | undefined;
  private authService: AuthService = AuthService.getInstance();
  private onAgentSelectionChanged:
    | ((agentName: PreferredAgent) => void)
    | undefined;
  private storageService: StorageService = StorageService.getInstance();

  private readonly PREFERRED_AGENT_STORAGE_KEY = 'stagewise.preferredAgent';

  private preferredAgent: PreferredAgent | undefined;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance() {
    if (!AgentSelectorService.instance) {
      AgentSelectorService.instance = new AgentSelectorService();
    }
    return AgentSelectorService.instance;
  }

  public async initialize() {
    this.statusbar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );

    this.statusbar.tooltip =
      'Set the preferred agent you want to use with stagewise';
    this.statusbar.command = 'stagewise.setAgent';
    this.updateStatusbarText('stagewise agent');
    this.statusbar.show();

    // load the preferred agent from the config
    this.preferredAgent =
      (await this.storageService.get(this.PREFERRED_AGENT_STORAGE_KEY)) ??
      'stagewise-agent';
  }

  public updateStatusbarText(text: string) {
    if (!this.statusbar) {
      return;
    }

    this.statusbar.text = `$(stagewise-icon) ${text}`;
  }

  public async showAgentPicker() {
    // TODO Depending on the auth state, show the stagewise agent - or not.
    const agentPicker = vscode.window.createQuickPick();
    const items: vscode.QuickPickItem[] = [];

    if (await this.authService.isAuthenticated()) {
      items.push({
        label: '$(stagewise-icon) stagewise agent',
        description:
          '(Recommended) A coding agent built to design and implement great frontends.',
      });
    }

    items.push({
      label: '$(chat-editor-label-icon) Forward to IDE Chat',
      description: "Forward your messages to the IDE's chat agent.",
    });

    agentPicker.items = items;
    agentPicker.onDidChangeSelection((selection) => {
      if (this.onAgentSelectionChanged) {
        if (selection[0].label.toLowerCase().includes('stagewise agent')) {
          void this.setPreferredAgent('stagewise-agent');
        } else {
          void this.setPreferredAgent('ide-chat');
        }
      }
      agentPicker.hide();
    });
    agentPicker.show();
  }

  public onPreferredAgentChanged(
    callback: (agentName: PreferredAgent) => void,
  ) {
    this.onAgentSelectionChanged = callback;
  }

  public getPreferredAgent(): PreferredAgent {
    // TODO Return the agent that's in the config. If no agent is configured, return the stagewise agent.
    return this.preferredAgent ?? 'stagewise-agent';
  }

  public async setPreferredAgent(agentName: PreferredAgent) {
    this.preferredAgent = agentName;
    await this.storageService.set(this.PREFERRED_AGENT_STORAGE_KEY, agentName);
    this.onAgentSelectionChanged?.(agentName);
  }
}
