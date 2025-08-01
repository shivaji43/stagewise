import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelFooter,
} from '@/components/ui/panel';
import { useAgents } from '@/hooks/agent/use-agent-provider';
import { useMemo } from 'react';
import { cn } from '@/utils';
import { SelectAgent } from './select-agent';
import { NoAgentFound } from './no-agent-found';
import { AgentDisconnected } from './agent-disconnected';
import {
  TriangleAlertIcon,
  MessageCircleQuestionMarkIcon,
  WifiOffIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuContent,
  DropdownMenuLinkItem,
} from '@/components/ui/dropdown-menu';
import { useAgentAvailability } from '@/hooks/agent/use-agent-availability';
import { BadAgentAvailability } from './bad-agent-availability';
import { AgentAvailabilityError } from '@stagewise/agent-interface/toolbar';

export function AgentConnectivityPanel() {
  const { availableAgents, connectedUnavailable, connected, isAppHostedAgent } =
    useAgents();

  const availabilityStatus = useAgentAvailability();

  const shouldRenderAsWarning = useMemo(() => {
    // For app-hosted agents, show warning if not connected (initial connection or disconnected)
    if (isAppHostedAgent && !connected) {
      return true;
    }

    return (
      availableAgents.length === 0 ||
      connectedUnavailable ||
      !availabilityStatus.isAvailable
    );
  }, [
    availableAgents,
    connectedUnavailable,
    availabilityStatus,
    isAppHostedAgent,
    connected,
  ]);

  const title = useMemo(() => {
    // Special handling for app-hosted agents
    if (isAppHostedAgent) {
      if (connectedUnavailable) {
        return 'CLI disconnected';
      }
      if (!connected) {
        return 'Connecting to CLI';
      }
    }

    if (availableAgents.length === 0) {
      return 'No agents available';
    }

    if (connectedUnavailable) {
      return 'Agent disconnected';
    }

    if (connected && !availabilityStatus.isAvailable) {
      return 'Agent not ready to use';
    }

    return 'Select an agent to connect to';
  }, [
    availableAgents,
    connectedUnavailable,
    availabilityStatus,
    isAppHostedAgent,
    connected,
  ]);

  const renderedIcon = useMemo(() => {
    if (!shouldRenderAsWarning) {
      return null;
    }

    if (
      connectedUnavailable ||
      (connected &&
        'error' in availabilityStatus &&
        availabilityStatus.error === AgentAvailabilityError.NO_CONNECTION)
    ) {
      return <WifiOffIcon className="size-6" />;
    }

    return <TriangleAlertIcon className="size-6" />;
  }, [connectedUnavailable, connected, availabilityStatus]);

  return (
    <Panel
      className={cn(
        shouldRenderAsWarning &&
          '[--color-foreground:var(--color-orange-700)] [--color-muted-foreground:var(--color-orange-600)] before:bg-orange-50/80',
      )}
    >
      <PanelHeader
        title={title}
        actionArea={shouldRenderAsWarning && renderedIcon}
      />
      <PanelContent>
        {/* Special content for app-hosted agents */}
        {isAppHostedAgent && !connected && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {connectedUnavailable
                ? 'The connection to the Stagewise CLI has been lost. The toolbar is attempting to reconnect automatically.'
                : 'Establishing connection to the Stagewise CLI...'}
            </p>
            <p className="text-muted-foreground text-sm">Please ensure that:</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
              <li>The CLI application is still running</li>
              <li>The development server hasn't crashed</li>
              <li>Your network connection is stable</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              If the problem persists, try restarting the CLI application.
            </p>
          </div>
        )}

        {/* Regular agent selection UI for non-app-hosted agents */}
        {!isAppHostedAgent && (
          <>
            {availableAgents.length > 0 &&
              !connectedUnavailable &&
              !connected && <SelectAgent />}
            {connectedUnavailable && <AgentDisconnected />}
            {availableAgents.length === 0 && !connectedUnavailable && (
              <NoAgentFound />
            )}
            {!connectedUnavailable &&
              connected &&
              !availabilityStatus.isAvailable && <BadAgentAvailability />}
          </>
        )}
      </PanelContent>
      <PanelFooter>
        <DropdownMenu>
          <DropdownMenuButton>
            <Button glassy size="sm" variant="secondary">
              <MessageCircleQuestionMarkIcon className="mr-2 size-4" />
              Need help?
            </Button>
          </DropdownMenuButton>
          <DropdownMenuContent>
            <DropdownMenuLinkItem
              href="https://stagewise.io/docs"
              target="_blank"
            >
              Read the docs
            </DropdownMenuLinkItem>
            <DropdownMenuLinkItem
              href="https://discord.gg/y8gdNb4D"
              target="_blank"
            >
              Join the community
            </DropdownMenuLinkItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PanelFooter>
    </Panel>
  );
}
