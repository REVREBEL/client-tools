"use client";

import "./clerk-auth.css";
import { declareComponent } from "@webflow/react";
import { RevrebelSignUp } from "./ClerkComponents";
import { baseAuthProps, routePathProp } from "./webflow-props";

export default declareComponent(RevrebelSignUp, {
  name: "Clerk Sign Up",
  description: "REVREBEL styled Clerk sign-up surface",
  group: "Authentication",
  props: {
    ...baseAuthProps,
    path: routePathProp("/client-hub/sign-up"),
  },
});
