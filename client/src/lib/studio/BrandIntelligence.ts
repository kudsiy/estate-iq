import { DesignState, BrandTheme } from "./types";

/**
 * BrandIntelligence: Automates accessible design decisions.
 */

interface ContrastResult {
  ratio: number;
  isLarge: boolean;
  isNormal: boolean;
  score: "Fail" | "AA" | "AAA";
}

/**
 * WCAG 2.1 Contrast Ratio Calculator
 */
export function getContrast(hex1: string, hex2: string): ContrastResult {
  const getRGB = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const luminal = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * luminal(r) + 0.7152 * luminal(g) + 0.0722 * luminal(b);
  };

  const l1 = getRGB(hex1);
  const l2 = getRGB(hex2);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  let score: ContrastResult["score"] = "Fail";
  if (ratio >= 7) score = "AAA";
  else if (ratio >= 4.5) score = "AA";

  return {
    ratio,
    isLarge: ratio >= 3,
    isNormal: ratio >= 4.5,
    score
  };
}

/**
 * Automatically applies brand colors to a set of studio elements based on their layer and role.
 */
export function applyBrandTheme(design: DesignState, theme: BrandTheme): DesignState {
  return {
    ...design,
    theme,
    elements: design.elements.map(el => {
      // 1. Backgrounds use secondary or white
      if (el.layer === "background" && el.type === "rect") {
        return { ...el, style: { ...el.style, fill: theme.secondary } };
      }
      
      // 2. Primary text uses primary color
      if (el.layer === "component" && el.type === "text") {
        // Check if white or black text is better for contrast with the current background
        const bgColor = design.elements.find(e => e.layer === "background")?.style.fill || "#ffffff";
        const contrastWithPrimary = getContrast(theme.primary, bgColor);
        
        const finalColor = contrastWithPrimary.ratio > 4.5 ? theme.primary : "#ffffff";
        return { ...el, style: { ...el.style, color: finalColor, fontFamily: theme.fonts.heading } };
      }
      
      // 3. Overlays use primary color (dark)
      if (el.layer === "overlay" && el.type === "rect") {
         return { ...el, style: { ...el.style, fill: theme.primary, opacity: 0.9 } };
      }

      return el;
    })
  };
}

/**
 * Predicts the best text color (black or white) for a given background color.
 */
export function getSafeTextColor(bgColor: string): string {
  const whiteContrast = getContrast("#ffffff", bgColor).ratio;
  const blackContrast = getContrast("#000000", bgColor).ratio;
  return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}
