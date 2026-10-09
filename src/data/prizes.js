// Zukas Kitchen Spin & Win Central Prize Configuration
const prizes = [
  {
    id: "25-off-2-medium-pizza",
    label: "₹25 OFF ON ORDER 2 MEDIUM (8 inch) PIZZA",
    wheelLabel: "₹25 OFF",
    subLabel: "ON ORDER 2 MEDIUM (8 inch) PIZZA",
    type: "discount",
    value: 25,
    weight: 10, // 10% probability
    enabled: true,
    isWinningPrize: true,
    bgColor: "#198C09", // Zukas Green
    textColor: "#FFFFFF",
    badge: "2 PIZZA DEAL",
    accentColor: "#FFD700"
  },
  {
    id: "10-off",
    label: "₹10 OFF",
    wheelLabel: "₹10 OFF",
    subLabel: "On Any Order",
    type: "discount",
    value: 10,
    weight: 55, // 55% probability (most frequent)
    enabled: true,
    isWinningPrize: true,
    bgColor: "#FF9F1C", // Warm Amber
    textColor: "#1E293B",
    badge: "SAVINGS",
    accentColor: "#FFFFFF"
  },
  {
    id: "20-off",
    label: "₹20 OFF ON ANY MEDIUM (8 inch) PIZZA",
    wheelLabel: "₹20 OFF",
    subLabel: "On Any Medium (8 inch) Pizza",
    type: "discount",
    value: 20,
    weight: 12, // 12% probability
    enabled: true,
    isWinningPrize: true,
    bgColor: "#FFB703", // Golden Yellow
    textColor: "#1E293B",
    badge: "BONUS",
    accentColor: "#198C09"
  },
  {
    id: "better-luck",
    label: "BETTER LUCK NEXT TIME",
    wheelLabel: "BETTER LUCK",
    subLabel: "NEXT TIME",
    type: "no_win",
    value: null,
    weight: 10, // 10% probability
    enabled: true,
    isWinningPrize: false,
    bgColor: "#334155", // Charcoal Slate
    textColor: "#F8FAFC",
    badge: "TRY AGAIN",
    accentColor: "#94A3B8"
  },
  {
    id: "15-off",
    label: "₹15 OFF",
    wheelLabel: "₹15 OFF",
    subLabel: "Super Saver",
    type: "discount",
    value: 15,
    weight: 8, // 8% probability
    enabled: true,
    isWinningPrize: true,
    bgColor: "#2A9D8F", // Fresh Teal
    textColor: "#FFFFFF",
    badge: "BIG DEAL",
    accentColor: "#FFD700"
  },
  {
    id: "30-off",
    label: "₹30 OFF ON ORDER 3 ANY MEDIUM (8 inch) PIZZA",
    wheelLabel: "₹30 OFF",
    subLabel: "ON ORDER 3 ANY MEDIUM (8 inch) PIZZA",
    type: "discount",
    value: 30,
    weight: 5, // 5% probability
    enabled: true,
    isWinningPrize: true,
    bgColor: "#F4A261", // Sunset Orange
    textColor: "#1E293B",
    badge: "YUMMY",
    accentColor: "#198C09"
  },
  {
    id: "free-campa-10",
    label: "FREE CAMPA WORTH ₹10",
    wheelLabel: "FREE CAMPA",
    subLabel: "Worth ₹10",
    type: "freebie",
    value: 10,
    weight: 60,
    enabled: true,
    isWinningPrize: true,
    bgColor: "#E63946", // Red for Campa
    textColor: "#FFFFFF",
    badge: "FREE DRINK",
    accentColor: "#F1FAEE"
  }
];

export default prizes;
