import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, DatabaseZap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

function FeatureItem({
  children,
  title,
  emoji,
}: {
  title: string;
  children: ReactNode;
  emoji: string;
}) {
  return (
    <li className="text-muted-foreground h-full">
      <Card className="gap-3 h-full">
        <CardHeader className="font-bold text-pretty">
          {emoji} {title}
        </CardHeader>
        <CardContent>
          <CardDescription>{children}</CardDescription>
        </CardContent>
      </Card>
    </li>
  );
}

function WavyLine() {
  return <div className="text-muted-foreground text-center">〰〰 ★ 〰〰</div>;
}

export function HomeIntro({
  activeStep,
  intro,
}: {
  activeStep: string | null;
  intro: "true" | "false" | undefined;
}) {
  const [open, setOpen] = useState(
    activeStep === null ||
      // used for debugging
      intro === "true",
  );

  const navigate = useNavigate();

  const startTutorial = useCallback(() => {
    setOpen(false);
    navigate({
      to: ".",
      search: (o) => ({
        ...o,
        intro: "false",
      }),
    });
  }, [navigate]);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 p-6 bottom-0 bg-black/80 z-52 flex items-center justify-center backdrop-blur-xs",
          )}
        >
          <Card className="w-xl p-6 gap-10 max-h-full overflow-y-auto bg-background">
            <CardHeader>
              <CardTitle className="flex justify-center">
                <div className="text-sm flex gap-2 items-center px-4 py-1 rounded-full">
                  <DatabaseZap className="h-4 text-primary" /> trytanstackdb.com{" "}
                  <span className="text-muted-foreground">BETA</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <WavyLine />
              <p className="text-xl font-bold max-w-md text-pretty text-center">
                <a
                  className="text-primary hover:underline hover:cursor-pointer"
                  target="_blank"
                  rel="noreferrer"
                  href="https://tanstack.com/db"
                >
                  TanStack DB
                </a>{" "}
                is a library that makes it really easy to build ⚡blazing fast⚡
                front-ends.
              </p>
              <WavyLine />
              <ul className="grid grid-cols-2 gap-3">
                <FeatureItem emoji={"🚀"} title="User actions feel instant">
                  Updates show immediately while sync happens in the background.
                </FeatureItem>
                <FeatureItem
                  emoji={"🔄"}
                  title="Fetch data once, use everywhere"
                >
                  Tanstack DB keeps it up to date!
                </FeatureItem>
                <FeatureItem
                  emoji={"🤝"}
                  title="Use any database and language on the backend"
                >
                  No new libs needed.
                </FeatureItem>
              </ul>
              <p>
                Sounds amazing, right? Learn the basics with this interactive
                tutorial in 6-7 minutes!
              </p>
            </CardContent>
            <CardFooter className="flex justify-center items-center flex-col gap-10">
              <Button
                onClick={startTutorial}
                className="bg-primary cursor-pointer"
              >
                Get started <ArrowRightIcon />
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                by{" "}
                <a
                  className="flex items-center gap-2"
                  target="_blank"
                  rel="noreferrer"
                  href="https://fulop.dev"
                >
                  <img
                    alt="fuko"
                    src="https://avatars.githubusercontent.com/u/43729152?s=96&v=4"
                    className="inline h-10 w-10 rounded-full border"
                  />
                  fuko
                </a>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
