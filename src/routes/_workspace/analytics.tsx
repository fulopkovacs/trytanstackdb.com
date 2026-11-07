import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsCharts } from "@/components/notes/analytics-charts";
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
          <AnalyticsCharts variant="mac" />
        </MacPagePane>
      }
      ios={
        <IosPageScreen title="Analytics">
          <AnalyticsCharts variant="ios" />
        </IosPageScreen>
      }
    />
  );
}
