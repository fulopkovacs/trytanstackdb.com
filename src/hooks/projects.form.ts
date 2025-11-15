import { createFormHook } from "@tanstack/react-form";

import {
  // Select,
  // SubscribeButton,
  // TextArea,
  TextField,
} from "../components/projects.FormComponents";
import { fieldContext, formContext } from "./projects.form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    // Select,
    // TextArea,
  },
  formComponents: {
    //   SubscribeButton,
  },
  fieldContext,
  formContext,
});
