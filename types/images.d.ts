/**
 * Type declarations for image file imports
 *
 * This file enables TypeScript to recognize image file imports
 * (e.g., import logo from '@/public/logo.png')
 *
 * These declarations work with Next.js's image optimization system
 * and allow static image imports to be type-checked correctly.
 */

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

declare module '*.bmp' {
  const content: string
  export default content
}
