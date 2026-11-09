"use client";

import { declareComponent } from "@webflow/react";
import { RevrebelTaskSetupMFA } from "./ClerkComponents";
import { baseAuthProps, completionUrlProp } from "./webflow-props";

export default declareComponent(RevrebelTaskSetupMFA, {
  name: "Clerk Setup MFA",
  description: "Resolve Clerk setup-mfa session tasks",
  group: "Authentication",
  props: {
    ...baseAuthProps,
    redirectUrlComplete: completionUrlProp,
  },
});
