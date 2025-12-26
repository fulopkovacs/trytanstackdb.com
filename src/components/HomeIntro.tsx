import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, DatabaseZap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

function Bold({ children }: { children: ReactNode }) {
  return <span className="font-bold text-foreground">{children}</span>;
}

function FeatureItem({ children }: { children: ReactNode }) {
  return (
    <li className="text-muted-foreground">
      <span className="text-primary">★</span> {children}
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
          <Card className="w-lg p-6 gap-10 max-h-full overflow-y-auto">
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
              <p className="text-xl font-bold">
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
              <ul className="pl-4">
                <FeatureItem>
                  <Bold>user actions feel instant</Bold> – updates show
                  immediately while sync happens in the background
                </FeatureItem>
                <FeatureItem>
                  <Bold>fetch data once, use everywhere</Bold> – Tanstack DB
                  keeps it up to date
                </FeatureItem>
                <FeatureItem>
                  <Bold>use any database and language on the backend</Bold> – no
                  new libs needed
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
