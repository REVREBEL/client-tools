"use client";

import "./clerk-auth.css";
import { declareComponent } from "@webflow/react";
import { RevrebelTaskResetPassword } from "./ClerkComponents";
import { baseAuthProps, completionUrlProp } from "./webflow-props";

export default declareComponent(RevrebelTaskResetPassword, {
  name: "Clerk Reset Password",
  description: "Resolve Clerk reset-password session tasks",
  group: "Authentication",
  props: {
    ...baseAuthProps,
    redirectUrlComplete: completionUrlProp,
  },
});
