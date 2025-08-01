import { createContext, type ReactNode } from 'react';
import { useContext, useEffect, useMemo, useRef } from 'react';
import type {
  PluginUserMessage,
  ToolbarContext,
  ToolbarPlugin,
} from '@/plugin-sdk/plugin';
import { useConfig } from './use-config';
import type { UserMessage } from '@stagewise/agent-interface/toolbar';
import { useAgentMessaging } from './agent/use-agent-messaging';
import {
  collectUserMessageMetadata,
  generateId,
  getIFrameWindow,
} from '@/utils';
import { usePanels } from './use-panels';

export interface PluginContextType {
  plugins: ToolbarPlugin[];
  toolbarContext: ToolbarContext;
}

const PluginContext = createContext<PluginContextType>({
  plugins: [],
  toolbarContext: {
    sendPrompt: () => {},
    mainAppWindow: getIFrameWindow(),
  },
});

export function PluginProvider({ children }: { children?: ReactNode }) {
  const { config } = useConfig();

  const { sendMessage } = useAgentMessaging();

  const { openChat } = usePanels();

  const plugins = config?.plugins || [];

  const toolbarContext = useMemo(() => {
    return {
      sendPrompt: async (prompt: PluginUserMessage) => {
        const userMessage: UserMessage = {
          ...prompt,
          id: generateId(),
          createdAt: new Date(),
          sentByPlugin: true,
          metadata: collectUserMessageMetadata([]),
          pluginContent: {},
        };
        sendMessage(userMessage);
        openChat();
      },
      mainAppWindow: getIFrameWindow(),
    };
  }, [sendMessage]);

  // call plugins once on initial load
  const pluginsLoadedRef = useRef(false);
  useEffect(() => {
    if (pluginsLoadedRef.current) return;
    pluginsLoadedRef.current = true;
    plugins.forEach((plugin) => {
      plugin.onLoad?.(toolbarContext);
    });
  }, [plugins, toolbarContext]);

  const value = useMemo(() => {
    return {
      plugins,
      toolbarContext,
    };
  }, [plugins, toolbarContext]);

  return (
    <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
  );
}

export function usePlugins() {
  return useContext(PluginContext);
}
