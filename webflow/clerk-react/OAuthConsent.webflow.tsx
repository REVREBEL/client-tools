"use client";

import "./clerk-auth.css";
import { declareComponent } from "@webflow/react";
import { RevrebelOAuthConsent } from "./ClerkComponents";
import { baseAuthProps } from "./webflow-props";

export default declareComponent(RevrebelOAuthConsent, {
  name: "Clerk OAuth Consent",
  description: "Clerk OAuth consent surface with REVREBEL styling",
  group: "Authentication",
  props: baseAuthProps,
});
