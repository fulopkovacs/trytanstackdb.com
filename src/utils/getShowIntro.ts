import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

// NOTE: when we'll have different users -> respect the user's id
const INTRO_COOKIE_NAME = "intro-visibility";

const showIntroSchema = z.enum(["hidden", "visible"]).catch("visible");

type ShowIntroUtils = {
  showIntroState: z.infer<typeof showIntroSchema>;
  updateShowIntro: (state: "hidden" | "visible") => void;
};

export const getShowIntro = createIsomorphicFn()
  .server((): ShowIntroUtils => {
    const showIntro = getCookie(INTRO_COOKIE_NAME);
    return {
      showIntroState: showIntroSchema.parse(showIntro),
      updateShowIntro: (state: "hidden" | "visible") => {
        setCookie(INTRO_COOKIE_NAME, state, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 1 year
        });
      },
    };
  })
  .client((): ShowIntroUtils => {
    const showIntro = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${INTRO_COOKIE_NAME}=`))
      ?.split("=")[1];

    return {
      showIntroState: showIntroSchema.parse(showIntro),
      updateShowIntro: (state: "hidden" | "visible") => {
        document.cookie = `${INTRO_COOKIE_NAME}=${state}; path=/; max-age=${
          // 1 year
          60 * 60 * 24 * 365
        }`;
      },
    };
  });
