import { Page, expect } from '@playwright/test'

/**
 * Responsive testing helpers
 * Provides utilities for testing across different viewport sizes
 */

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export const VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLarge: { width: 1024, height: 1366 }, // iPad Pro
  desktop: { width: 1920, height: 1080 }, // Desktop HD
  desktopSmall: { width: 1366, height: 768 }, // Laptop
} as const

export class ResponsiveHelper {
  constructor(private page: Page) {}

  /**
   * Set viewport to specific size
   */
  async setViewport(size: keyof typeof VIEWPORTS) {
    await this.page.setViewportSize(VIEWPORTS[size])
  }

  /**
   * Test element visibility across different viewports
   */
  async testElementVisibilityAcrossViewports(
    selector: string,
    viewports: (keyof typeof VIEWPORTS)[]
  ) {
    const results: Record<string, boolean> = {}

    for (const viewport of viewports) {
      await this.setViewport(viewport)
      await this.page.waitForTimeout(300) // Wait for responsive animations

      const element = this.page.locator(selector)
      const isVisible = await element.isVisible().catch(() => false)
      results[viewport] = isVisible
    }

    return results
  }

  /**
   * Take screenshots across different viewports
   */
  async screenshotAcrossViewports(
    name: string,
    viewports: (keyof typeof VIEWPORTS)[] = ['mobile', 'tablet', 'desktop']
  ) {
    const screenshots: Record<string, Buffer> = {}

    for (const viewport of viewports) {
      await this.setViewport(viewport)
      await this.page.waitForTimeout(500) // Wait for responsive animations

      const screenshot = await this.page.screenshot({
        fullPage: true,
        animations: 'disabled',
      })

      screenshots[`${name}-${viewport}`] = screenshot
    }

    return screenshots
  }

  /**
   * Test mobile navigation (hamburger menu, bottom nav, etc.)
   */
  async testMobileNavigation() {
    await this.setViewport('mobile')

    // Check for bottom navigation
    const bottomNav = this.page.locator('[class*="bottom-nav"]')
    await expect(bottomNav).toBeVisible()

    return {
      hasBottomNav: await bottomNav.isVisible(),
    }
  }

  /**
   * Test desktop navigation
   */
  async testDesktopNavigation() {
    await this.setViewport('desktop')

    // Desktop might have different navigation
    // Adjust based on your actual implementation
    return true
  }

  /**
   * Test touch interactions on mobile
   */
  async testTouchInteractions(selector: string) {
    await this.setViewport('mobile')

    const element = this.page.locator(selector)

    // Simulate touch events
    await element.tap()

    return true
  }

  /**
   * Test swipe gestures (for cards, carousels, etc.)
   */
  async testSwipeGesture(
    selector: string,
    direction: 'left' | 'right' | 'up' | 'down'
  ) {
    const element = this.page.locator(selector)
    const box = await element.boundingBox()

    if (!box) {
      throw new Error('Element not found')
    }

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    let endX = startX
    let endY = startY

    switch (direction) {
      case 'left':
        endX = startX - box.width / 2
        break
      case 'right':
        endX = startX + box.width / 2
        break
      case 'up':
        endY = startY - box.height / 2
        break
      case 'down':
        endY = startY + box.height / 2
        break
    }

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(endX, endY)
    await this.page.mouse.up()
  }

  /**
   * Check if element has responsive CSS (media queries)
   */
  async checkResponsiveStyles(
    selector: string,
    property: string,
    expectedValues: Record<ViewportSize, string>
  ) {
    const results: Record<string, string> = {}

    for (const [viewport, expectedValue] of Object.entries(expectedValues)) {
      await this.setViewport(viewport as keyof typeof VIEWPORTS)
      await this.page.waitForTimeout(300)

      const element = this.page.locator(selector)
      const computedValue = await element.evaluate(
        (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
        property
      )

      results[viewport] = computedValue
    }

    return results
  }

  /**
   * Test text truncation on different screen sizes
   */
  async testTextTruncation(selector: string) {
    const results: Record<string, boolean> = {}

    for (const viewport of ['mobile', 'tablet', 'desktop'] as const) {
      await this.setViewport(viewport)

      const element = this.page.locator(selector)
      const isTruncated = await element.evaluate((el) => {
        return el.scrollWidth > el.clientWidth
      })

      results[viewport] = isTruncated
    }

    return results
  }

  /**
   * Verify mobile-friendly touch targets (minimum 44x44px)
   */
  async verifyTouchTargetSize(selector: string) {
    await this.setViewport('mobile')

    const element = this.page.locator(selector)
    const box = await element.boundingBox()

    if (!box) {
      return { valid: false, reason: 'Element not found' }
    }

    const minSize = 44 // WCAG recommendation for touch targets

    return {
      valid: box.width >= minSize && box.height >= minSize,
      width: box.width,
      height: box.height,
      minRequired: minSize,
    }
  }

  /**
   * Test orientation changes (portrait <-> landscape)
   */
  async testOrientation() {
    // Portrait
    await this.page.setViewportSize({ width: 375, height: 667 })
    await this.page.waitForTimeout(300)
    const portraitScreenshot = await this.page.screenshot()

    // Landscape
    await this.page.setViewportSize({ width: 667, height: 375 })
    await this.page.waitForTimeout(300)
    const landscapeScreenshot = await this.page.screenshot()

    return {
      portrait: portraitScreenshot,
      landscape: landscapeScreenshot,
    }
  }
}

/**
 * Helper to create responsive helper instance
 */
export function createResponsiveHelper(page: Page): ResponsiveHelper {
  return new ResponsiveHelper(page)
}
