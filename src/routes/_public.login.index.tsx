import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/_public/login/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-svh flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden p-2 w-full flex items-center justify-center">
        <div className="w-96">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
