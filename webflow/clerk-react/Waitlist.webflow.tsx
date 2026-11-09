"use client";

import { declareComponent } from "@webflow/react";
import { RevrebelWaitlist } from "./ClerkComponents";
import { baseAuthProps } from "./webflow-props";

export default declareComponent(RevrebelWaitlist, {
  name: "Clerk Waitlist",
  description: "REVREBEL client access request waitlist",
  group: "Authentication",
  props: baseAuthProps,
});
