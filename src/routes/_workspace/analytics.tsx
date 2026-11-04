import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsTables } from "@/components/notes/analytics-tables";
import { IosPageScreen } from "@/components/notes/ios/page-screen";
import { MacPagePane } from "@/components/notes/mac/page-pane";
import { ByLayout } from "@/components/notes/notes-layout";

export const Route = createFileRoute("/_workspace/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <ByLayout
      mac={
        <MacPagePane title="Analytics">
          <AnalyticsTables variant="mac" />
        </MacPagePane>
      }
      ios={
        <IosPageScreen title="Analytics">
          <AnalyticsTables variant="ios" />
        </IosPageScreen>
      }
    />
  );
}
