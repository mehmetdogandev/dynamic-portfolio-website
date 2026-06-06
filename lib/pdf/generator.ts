/**
 * Server-side PDF generation using Puppeteer
 */

import puppeteer from 'puppeteer'
import { pdfStyles } from './styles'

/**
 * Generate PDF from HTML content
 */
export async function generatePdfFromTemplate(
  html: string,
  _year?: string
): Promise<Buffer> {
  let browser

  try {
    // Try to get the executable path from Puppeteer's cache
    // This ensures we use the downloaded Chrome binary
    // Try to get the executable path from Puppeteer's cache or environment
    // This ensures we use the downloaded Chrome binary or the system-installed one in Docker
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu', // Helper for headless
      ],
      pipe: true, // often helps with connection issues in Docker
    })

    const page = await browser.newPage()

    // Combine HTML with CSS styles
    // Ensure no extra spacing around content - pages should be direct children of body
    const fullHTML = `<!DOCTYPE html>
<html style="margin: 0; padding: 0;">
<head>
<meta charset="UTF-8">
<style>
${pdfStyles}
</style>
</head>
<body style="margin: 0; padding: 0;">${html}</body>
</html>`

    await page.setContent(fullHTML, {
      waitUntil: 'networkidle0',
    })

    // Wait for fonts to load and layout to settle
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait for fonts to be ready
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            setTimeout(resolve, 200)
          })
        } else {
          setTimeout(resolve, 300)
        }
      })
    })

    // Remove any trailing content that might cause extra pages
    await page.evaluate(() => {
      // Remove any whitespace or empty elements after the last page
      const body = document.body
      const lastPage = body.querySelector('.pm-page:last-child')
      if (lastPage) {
        // Remove any text nodes or empty elements after last page
        let node = lastPage.nextSibling
        while (node) {
          const next = node.nextSibling
          if (
            node.nodeType === 3 && // Text node
            (node.textContent?.trim() === '' || !node.textContent?.trim())
          ) {
            body.removeChild(node)
          } else if (
            node.nodeType === 1 && // Element node
            (node as HTMLElement).textContent?.trim() === ''
          ) {
            body.removeChild(node)
          }
          node = next
        }
      }
    })

    // Detect orientation from HTML content
    const isLandscape = html.includes('data-orientation="landscape"')

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: isLandscape, // Enable landscape mode if detected
      printBackground: true,
      displayHeaderFooter: false, // No header/footer to avoid extra pages
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
      preferCSSPageSize: true, // Use CSS @page rules to respect page breaks
      omitBackground: false,
    })

    return Buffer.from(pdfBuffer)
  } catch (error) {
    throw new Error(`PDF generation failed: ${error}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
