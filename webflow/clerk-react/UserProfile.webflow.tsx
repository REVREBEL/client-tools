"use client";

import { declareComponent } from "@webflow/react";
import { RevrebelUserProfile } from "./ClerkComponents";
import { baseAuthProps, routePathProp } from "./webflow-props";

export default declareComponent(RevrebelUserProfile, {
  name: "Clerk User Profile",
  description: "REVREBEL styled Clerk user profile surface",
  group: "Authentication",
  props: {
    ...baseAuthProps,
    path: routePathProp("/client-hub/profile"),
  },
});
