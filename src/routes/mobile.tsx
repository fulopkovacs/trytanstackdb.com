import { createFileRoute } from "@tanstack/react-router";
import { HomeIntro } from "@/components/HomeIntro";

export const Route = createFileRoute("/mobile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background">
      <HomeIntro activeStep={null} showIntro={true} isMobile={true} />
    </div>
  );
}
