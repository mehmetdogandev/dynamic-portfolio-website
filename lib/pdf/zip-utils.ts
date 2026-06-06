/**
 * ZIP file creation utilities
 */

import * as archiver from 'archiver'
import { Readable } from 'stream'

/**
 * Create a ZIP file from multiple PDF buffers
 * @param pdfs Array of { name: string, buffer: Buffer } objects
 * @returns Promise<Buffer> ZIP file as buffer
 */
export async function createZipFromPdfs(
  pdfs: Array<{ name: string; buffer: Buffer }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    // @ts-expect-error - archiver types are not correct
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    archive.on('error', (err: Error) => {
      reject(err)
    })

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    archive.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    // Add each PDF to the archive
    for (const pdf of pdfs) {
      // Ensure filename ends with .pdf
      const filename = pdf.name.endsWith('.pdf') ? pdf.name : `${pdf.name}.pdf`
      archive.append(Readable.from(pdf.buffer), { name: filename })
    }

    // Finalize the archive
    archive.finalize()
  })
}
