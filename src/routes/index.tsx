import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getApexDomainRedirectHref } from "@/utils/server/getApexDomainRedirectHref";
import { createTempDbAndRedirectToIt } from "@/server/functions/createTempDbAndRedirectToIt";
import { getSubdomainAndApexFromHost } from "@/server/functions/getSubdomainAndApexFromHost";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { subdomain, apex, protocol } = await getSubdomainAndApexFromHost();
    if (subdomain) {
      throw redirect({
        href: getApexDomainRedirectHref(apex, protocol),
      });
    }
  },
  component: App,
});

function App() {
  const redirectToNewDemoApp = useServerFn(createTempDbAndRedirectToIt);

  const redirectToNewDemoAppM = useMutation({
    mutationFn: redirectToNewDemoApp,
    onError: () => {
      // TODO: show error message on the UI
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button
        onClick={() => {
          redirectToNewDemoAppM.mutate({});
        }}
      >
        Start the demo app
      </Button>
    </div>
  );
}
