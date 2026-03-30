import { DesignState, StudioElement, LayoutResolution, Anchor } from "./types";

/**
 * LayoutResolver: The core positioning engine for Estate IQ Studio.
 * 
 * It converts abstract constraints and base proportions into 
 * absolute pixel coordinates for any given resolution and aspect ratio.
 */

export function resolveLayout(
  design: DesignState,
  resolution: LayoutResolution
): StudioElement[] {
  const { width: canvasW, height: canvasH, scale } = resolution;

  return design.elements.map((el) => {
    const resolved = { ...el };

    // 1. Resolve Dimensions (Scale base proportional width/height)
    // baseWidth of 1000 means 100% of the reference 1000px.
    // So current width = (baseWidth / 1000) * canvasRefWidth * scale?
    // Let's simplify: baseWidth/Height are scale-independent units where 1000 is the reference "full width".
    const resWidth = (el.baseWidth / 1000) * canvasW;
    const resHeight = (el.baseHeight / 1000) * canvasW; // Scale height by width to preserve aspect of the element? 
    // Actually, usually we scale both by the same 'scale' factor relative to the 1000px reference.
    // const resWidth = el.baseWidth * scale;
    // const resHeight = el.baseHeight * scale;
    
    // Using the user-provided 'scale' (ratio of current pixels to 1000px base)
    const finalizedWidth = el.baseWidth * scale;
    const finalizedHeight = el.baseHeight * scale;

    // 2. Resolve X Position
    let x = 0;
    const xMargin = el.constraints.x.margin * canvasW;
    
    switch (el.constraints.x.anchor) {
      case "left":
        x = xMargin;
        break;
      case "right":
        x = canvasW - finalizedWidth - xMargin;
        break;
      case "center":
        x = (canvasW / 2) - (finalizedWidth / 2) + xMargin;
        break;
      default:
        x = xMargin;
    }

    // 3. Resolve Y Position
    let y = 0;
    const yMargin = el.constraints.y.margin * canvasH;
    
    switch (el.constraints.y.anchor) {
      case "top":
        y = yMargin;
        break;
      case "bottom":
        y = canvasH - finalizedHeight - yMargin;
        break;
      case "middle":
      case "center": // Alias center for Y too
        y = (canvasH / 2) - (finalizedHeight / 2) + yMargin;
        break;
      default:
        y = yMargin;
    }

    // 4. Resolve Styles (Proportional Scaling)
    const resolvedStyle = { ...el.style };
    if (resolvedStyle.fontSize) {
      resolvedStyle.fontSize = resolvedStyle.fontSize * scale;
    }
    if (resolvedStyle.borderRadius) {
      resolvedStyle.borderRadius = resolvedStyle.borderRadius * scale;
    }

    return {
      ...resolved,
      resolvedX: x,
      resolvedY: y,
      resolvedWidth: finalizedWidth,
      resolvedHeight: finalizedHeight,
      style: resolvedStyle,
    };
  });
}

/**
 * Helper to get proper LayoutResolution for a given AspectRatio and target width.
 */
export function getResolution(format: string, targetWidth: number): LayoutResolution {
  let height = targetWidth;
  
  switch (format) {
    case "1:1": height = targetWidth; break;
    case "9:16": height = targetWidth * (16 / 9); break;
    case "4:5": height = targetWidth * (5 / 4); break;
    case "16:9": height = targetWidth * (9 / 16); break;
    case "A4": height = targetWidth * 1.414; break;
  }

  return {
    width: targetWidth,
    height: height,
    scale: targetWidth / 1000, 
  };
}
