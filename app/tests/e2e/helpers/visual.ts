import { Page, Locator, expect } from '@playwright/test'

/**
 * Visual and Design testing helpers
 * Provides utilities for testing UI/UX consistency
 */

export class VisualHelper {
  constructor(private page: Page) {}

  /**
   * Verify color contrast for accessibility (WCAG AA)
   */
  async verifyColorContrast(
    selector: string,
    minContrast = 4.5 // WCAG AA for normal text
  ) {
    const element = this.page.locator(selector)

    const result = await element.evaluate((el, minRatio) => {
      const style = window.getComputedStyle(el)
      const color = style.color
      const backgroundColor = style.backgroundColor

      // Simple RGB to luminance calculation
      function getLuminance(rgb: string): number {
        const match = rgb.match(/\d+/g)
        if (!match) return 0

        const [r, g, b] = match.map((val) => {
          const v = parseInt(val) / 255
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
        })

        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }

      const l1 = getLuminance(color)
      const l2 = getLuminance(backgroundColor)

      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      const contrast = (lighter + 0.05) / (darker + 0.05)

      return {
        contrast: parseFloat(contrast.toFixed(2)),
        passes: contrast >= minRatio,
        color,
        backgroundColor,
      }
    }, minContrast)

    return result
  }

  /**
   * Check if CSS custom properties (variables) are applied
   */
  async verifyCSSVariables(expectedVariables: string[]) {
    const results: Record<string, string | null> = {}

    for (const varName of expectedVariables) {
      const value = await this.page.evaluate((variable) => {
        return getComputedStyle(document.documentElement).getPropertyValue(variable)
      }, varName)

      results[varName] = value || null
    }

    return results
  }

  /**
   * Verify font sizes meet minimum accessibility standards
   */
  async verifyFontSize(
    selector: string,
    minSize = 16 // Minimum recommended for body text
  ) {
    const element = this.page.locator(selector)

    const fontSize = await element.evaluate((el, min) => {
      const style = window.getComputedStyle(el)
      const size = parseFloat(style.fontSize)

      return {
        fontSize: size,
        passes: size >= min,
        minRequired: min,
      }
    }, minSize)

    return fontSize
  }

  /**
   * Check element spacing (padding, margin) consistency
   */
  async verifySpacing(selector: string) {
    const element = this.page.locator(selector)

    return await element.evaluate((el) => {
      const style = window.getComputedStyle(el)

      return {
        padding: {
          top: style.paddingTop,
          right: style.paddingRight,
          bottom: style.paddingBottom,
          left: style.paddingLeft,
        },
        margin: {
          top: style.marginTop,
          right: style.marginRight,
          bottom: style.marginBottom,
          left: style.marginLeft,
        },
      }
    })
  }

  /**
   * Verify image loading and alt text
   */
  async verifyImage(selector: string) {
    const image = this.page.locator(selector)

    const result = await image.evaluate((img: HTMLImageElement) => {
      return {
        loaded: img.complete && img.naturalHeight !== 0,
        src: img.src,
        alt: img.alt,
        hasAlt: !!img.alt && img.alt.trim().length > 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
    })

    return result
  }

  /**
   * Check for CSS animations/transitions
   */
  async verifyAnimations(selector: string) {
    const element = this.page.locator(selector)

    return await element.evaluate((el) => {
      const style = window.getComputedStyle(el)

      return {
        transition: style.transition,
        animation: style.animation,
        hasTransition: style.transition !== 'all 0s ease 0s',
        hasAnimation: style.animation !== 'none 0s ease 0s normal none running none',
      }
    })
  }

  /**
   * Verify button states (hover, active, disabled)
   */
  async verifyButtonStates(selector: string) {
    const button = this.page.locator(selector)

    // Normal state
    const normalState = await this.captureElementStyles(button)

    // Hover state
    await button.hover()
    await this.page.waitForTimeout(100)
    const hoverState = await this.captureElementStyles(button)

    // Focus state
    await button.focus()
    await this.page.waitForTimeout(100)
    const focusState = await this.captureElementStyles(button)

    return {
      normal: normalState,
      hover: hoverState,
      focus: focusState,
    }
  }

  /**
   * Capture element styles helper
   */
  private async captureElementStyles(element: Locator) {
    return await element.evaluate((el) => {
      const style = window.getComputedStyle(el)

      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        transform: style.transform,
        opacity: style.opacity,
      }
    })
  }

  /**
   * Verify z-index layering (modals, dropdowns, etc.)
   */
  async verifyZIndex(elements: { selector: string; expectedLayer: number }[]) {
    const results: Record<string, { zIndex: string; layer: number }> = {}

    for (const { selector, expectedLayer } of elements) {
      const element = this.page.locator(selector)

      const zIndex = await element.evaluate((el) => {
        return window.getComputedStyle(el).zIndex
      })

      results[selector] = {
        zIndex,
        layer: expectedLayer,
      }
    }

    return results
  }

  /**
   * Check for text overflow and ellipsis
   */
  async verifyTextOverflow(selector: string) {
    const element = this.page.locator(selector)

    return await element.evaluate((el) => {
      const style = window.getComputedStyle(el)

      return {
        textOverflow: style.textOverflow,
        overflow: style.overflow,
        whiteSpace: style.whiteSpace,
        hasEllipsis: style.textOverflow === 'ellipsis',
        isOverflowing: el.scrollWidth > el.clientWidth,
      }
    })
  }

  /**
   * Verify form input styles and states
   */
  async verifyInputStates(selector: string) {
    const input = this.page.locator(selector)

    // Normal state
    const normalState = await this.captureElementStyles(input)

    // Focus state
    await input.focus()
    await this.page.waitForTimeout(100)
    const focusState = await this.captureElementStyles(input)

    // Error state (if applicable)
    const errorClass = await input.getAttribute('class')
    const hasError = errorClass?.includes('error') || false

    return {
      normal: normalState,
      focus: focusState,
      hasError,
    }
  }

  /**
   * Check loading states (spinners, skeletons)
   */
  async verifyLoadingState(selector: string) {
    const element = this.page.locator(selector)

    const isVisible = await element.isVisible().catch(() => false)

    if (!isVisible) {
      return { visible: false }
    }

    return await element.evaluate((el) => {
      const style = window.getComputedStyle(el)

      return {
        visible: true,
        animation: style.animation,
        hasAnimation: style.animation !== 'none 0s ease 0s normal none running none',
      }
    })
  }

  /**
   * Verify card component consistency
   */
  async verifyCardDesign(selector: string) {
    const card = this.page.locator(selector)

    return await card.evaluate((el) => {
      const style = window.getComputedStyle(el)

      return {
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        padding: style.padding,
        backgroundColor: style.backgroundColor,
        border: style.border,
      }
    })
  }

  /**
   * Take full page screenshot with element highlighting
   */
  async screenshotWithHighlight(
    selector: string,
    options?: { name?: string }
  ) {
    const element = this.page.locator(selector)

    // Add highlight to element
    await element.evaluate((el) => {
      el.style.outline = '3px solid red'
      el.style.outlineOffset = '2px'
    })

    const screenshot = await this.page.screenshot({
      fullPage: true,
      animations: 'disabled',
    })

    // Remove highlight
    await element.evaluate((el) => {
      el.style.outline = ''
      el.style.outlineOffset = ''
    })

    return screenshot
  }

  /**
   * Compare two screenshots (pixel by pixel)
   * Note: This is a basic implementation, consider using a visual regression tool
   */
  async compareScreenshots(
    selector: string,
    baselineName: string
  ) {
    const element = this.page.locator(selector)

    // Take current screenshot
    const currentScreenshot = await element.screenshot({
      animations: 'disabled',
    })

    // In a real implementation, you would compare with a baseline
    // For now, just return the screenshot
    return {
      current: currentScreenshot,
      baselineName,
    }
  }
}

/**
 * Helper to create visual helper instance
 */
export function createVisualHelper(page: Page): VisualHelper {
  return new VisualHelper(page)
}
