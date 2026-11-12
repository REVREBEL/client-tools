"use client";

import "./clerk-auth.css";
import { declareComponent } from "@webflow/react";
import { RevrebelSignIn } from "./ClerkComponents";
import { baseAuthProps, routePathProp } from "./webflow-props";

export default declareComponent(RevrebelSignIn, {
  name: "Clerk Sign In",
  description: "REVREBEL styled Clerk sign-in surface",
  group: "Authentication",
  props: {
    ...baseAuthProps,
    path: routePathProp("/client-hub/sign-in"),
  },
});
