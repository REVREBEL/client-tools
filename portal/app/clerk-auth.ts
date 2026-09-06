export const clerkAuthAppearance = {
  layout: {
    logoImageUrl:
      "https://res.cloudinary.com/revrebel/image/upload/v1761516148/RR/Logos/revrebel-logo.png",
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#163666",
    colorText: "#163666",
    colorTextSecondary: "#536782",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#163666",
    borderRadius: "0px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    cardBox: { boxShadow: "none" },
    card: { border: "2px solid #163666", boxShadow: "none" },
    headerTitle: {
      color: "#163666",
      fontFamily: "Khand, sans-serif",
      fontWeight: 700,
      textTransform: "uppercase" as const,
    },
    formButtonPrimary: {
      backgroundColor: "#163666",
      color: "#b2d3de",
      borderRadius: "0px",
    },
  },
};
