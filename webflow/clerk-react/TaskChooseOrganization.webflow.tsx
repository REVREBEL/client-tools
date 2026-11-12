"use client";

import "./clerk-auth.css";
import { declareComponent } from "@webflow/react";
import { RevrebelTaskChooseOrganization } from "./ClerkComponents";
import { baseAuthProps, completionUrlProp } from "./webflow-props";

export default declareComponent(RevrebelTaskChooseOrganization, {
  name: "Clerk Choose Organization",
  description: "Resolve Clerk choose-organization session tasks",
  group: "Authentication",
  props: {
    ...baseAuthProps,
    redirectUrlComplete: completionUrlProp,
  },
});
