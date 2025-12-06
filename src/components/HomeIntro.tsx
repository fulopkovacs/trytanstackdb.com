import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, DatabaseZap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
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

export function HomeIntro({
  activeStep,
  show_home_intro,
}: {
  activeStep: string | null;
  show_home_intro: "true" | "false" | undefined;
}) {
  const [open, setOpen] = useState(
    activeStep === null ||
    // used for debugging
    show_home_intro === "true",
  );

  const navigate = useNavigate();

  const startTutorial = useCallback(() => {
    setOpen(false);
    navigate({ to: ".", search: ({ show_home_intro, ...o }) => o });
  }, [navigate]);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 p-6 bottom-0 bg-black/80 z-52 flex items-center justify-center",
          )}
        >
          <Card className="w-lg p-6 gap-10 max-h-full overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-center">
                <div className="text-sm bg-linear-to-r from-orange-500 to-orange-700 flex gap-2 items-center text-black px-4 py-1 rounded-full">
                  <DatabaseZap className="h-4" /> trytanstackdb.com{" "}
                  <span className="text-white">ALPHA</span>
                </div>
              </CardTitle>
              <CardDescription className="text-center">
                An interactive tutorial for learning{" "}
                <a
                  href="https://tanstack.com/db/latest"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-orange-500 transition-colors cursor-pointer"
                >
                  TanStack DB
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8">
                <p>
                  What is{" "}
                  <a
                    href="https://tanstack.com/db/latest"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    TanStack DB
                  </a>
                  ?
                </p>
                <p className="border-l border-orange-500 pl-4 italic font-bold text-2xl">
                  "The reactive client-first store for your API"
                </p>

                <p>Still confused? Click the button below!</p>
              </div>
              <div className="text-sm text-muted-foreground mt-6 flex flex-col gap-2">
                <p>
                  Open up the <span className="italic">Network tab</span> in the
                  dev tools panel, and get started!
                </p>
                <p>Here's what you'll get:</p>
                <ul className="pl-4">
                  {[
                    "a short interactive guide (6-7 mins)",
                    "with a demo app using TanStack DB",
                    "and the source code for all of it.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500">★</span> {item}
                    </li>
                  ))}
                </ul>
                <p>
                  Follow the guide, inspect the requests, check the source code,
                  have fun!
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center items-center flex-col gap-10">
              <Button
                onClick={startTutorial}
                className="bg-orange-500 text-black hover:bg-orange-600 cursor-pointer transition-colors"
              >
                Start tutorial <ArrowRightIcon />
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
                    className="inline h-10 w-10 rounded-full"
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
