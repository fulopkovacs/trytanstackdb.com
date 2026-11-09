import { createFileRoute } from "@tanstack/react-router";

import { IosPageScreen } from "@/components/notes/ios/page-screen";
import { MacPagePane } from "@/components/notes/mac/page-pane";
import { ByLayout } from "@/components/notes/notes-layout";
import { SettingsForm } from "@/components/notes/settings-form";

export const Route = createFileRoute("/_workspace/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <ByLayout
      mac={
        <MacPagePane title="Settings">
          <SettingsForm variant="mac" />
        </MacPagePane>
      }
      ios={
        <IosPageScreen title="Settings">
          <SettingsForm variant="ios" />
        </IosPageScreen>
      }
    />
  );
}
