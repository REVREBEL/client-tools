import { props } from "@webflow/data-types";

export const baseAuthProps = {
  publishableKey: props.Text({
    name: "Clerk Publishable Key",
    defaultValue: "pk_live_Y2xlcmsucmV2cmViZWwuaW8k",
  }),
  signInUrl: props.Text({
    name: "Sign In URL",
    defaultValue: "/client-hub/sign-in",
  }),
  signUpUrl: props.Text({
    name: "Sign Up URL",
    defaultValue: "/client-hub/sign-up",
  }),
  waitlistUrl: props.Text({
    name: "Waitlist URL",
    defaultValue: "/client-hub/request-access",
  }),
  afterAuthUrl: props.Text({
    name: "After Auth URL",
    defaultValue: "/client-hub",
  }),
  chooseOrganizationUrl: props.Text({
    name: "Choose Organization URL",
    defaultValue: "/client-hub/tasks/choose-organization",
  }),
  resetPasswordUrl: props.Text({
    name: "Reset Password URL",
    defaultValue: "/client-hub/tasks/reset-password",
  }),
  setupMfaUrl: props.Text({
    name: "Setup MFA URL",
    defaultValue: "/client-hub/tasks/setup-mfa",
  }),
};

export const routePathProp = (defaultValue: string) =>
  props.Text({ name: "Component Path", defaultValue });

export const completionUrlProp = props.Text({
  name: "Completion URL",
  defaultValue: "/client-hub",
});
