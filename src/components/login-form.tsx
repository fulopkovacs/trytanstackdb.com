import { useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const userInputId = useId();
  const passwordInputId = useId();
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await authClient.signIn.email({
                email: email,
                password,
              });
              console.log({ email, password });

              if (result.error) {
                console.error(result.error);
              } else {
                router.navigate({
                  to: "/boards",
                });
                // You can redirect the user or update the UI here
              }
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={userInputId}>Email</FieldLabel>
                <Input
                  id={userInputId}
                  type="email"
                  placeholder=""
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
                  {/*
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                    */}
                </div>
                <Input
                  id={passwordInputId}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                {/*
                  <Button variant="outline" type="button">
                  Login with Google
                  </Button>
                  */}
                {/*
                    <FieldDescription className="text-center">
                    Don&apos;t have an account? <a href="#">Sign up</a>
                    </FieldDescription>
                  */}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
