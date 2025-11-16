import { createFormHook } from "@tanstack/react-form";

import {
  // Select,
  // SubscribeButton,
  // TextArea,
  TextArea,
  TextField,
} from "../components/app.formComponents";
import { fieldContext, formContext } from "./app.form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    TextArea,
    // Select,
    // TextArea,
  },
  formComponents: {
    //   SubscribeButton,
  },
  fieldContext,
  formContext,
});
