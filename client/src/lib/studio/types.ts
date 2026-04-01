// ─── STUDIO TYPES: Constraint-Based Architecture ──────────────────────────────

export type AspectRatio = "1:1" | "9:16" | "4:5" | "16:9" | "A4";

export type Anchor = "top" | "bottom" | "left" | "right" | "center" | "middle";

export interface Constraint {
  anchor: Anchor;
  margin: number; // Stored as a % of the canvas dimension (0 to 1)
  priority: number;
}

export type LayerSegment = "background" | "image" | "component" | "overlay" | "ui";

export interface StudioElement {
  id: string;
  type: "text" | "rect" | "ellipse" | "image" | "video" | "smart-component";
  componentType?: "price-chip" | "agent-badge" | "amenities-grid" | "cta-button";
  layer: LayerSegment;
  
  // Video-specific configuration
  videoConfig?: {
    src: string;
    startTime: number;
    duration: number;
    muted: boolean;
    loop: boolean;
  };

  // Layout Rules (Constraints)
  constraints: {
    x: Constraint;
    y: Constraint;
  };
  
  // Base Proportional Dimensions (Reference width: 1000px)
  baseWidth: number;
  baseHeight: number;
  
  // Content & Styles
  content: Record<string, any>;
  style: {
    color?: string;
    fill?: string;
    fontSize?: number; // Base font size
    fontWeight?: string;
    opacity?: number;
    borderRadius?: number;
    textAlign?: "left" | "center" | "right";
    letterSpacing?: string;
    fontFamily?: string;
  };


  
  // Instance state (Calculated pixels)
  resolvedX?: number;
  resolvedY?: number;
  resolvedWidth?: number;
  resolvedHeight?: number;
  
  locked?: boolean;
  visible?: boolean;
}

export interface BrandTheme {
  primary: string;
  secondary: string;
  accent: string;
  fonts: {
    heading: string;
    body: string;
  };
}

export interface DesignState {
  version: string;
  id: string;
  name: string;
  format: AspectRatio;
  theme: BrandTheme;
  elements: StudioElement[];
}

export interface LayoutResolution {
  width: number;
  height: number;
  scale: number; // Ratio of current pixels to base (1000px)
}
