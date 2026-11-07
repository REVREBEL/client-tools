export {};

declare global {
  interface ClerkAuthorization {
    permission:
      | "org:admin:code_editor"
      | "admin:code_editor"
      | "org:admin:google_sheet_url"
      | "admin:google_sheet_url";
    role: "org:admin" | "org:member";
  }
}
