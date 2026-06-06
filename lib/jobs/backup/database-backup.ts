/**
 * Database Backup Job
 *
 * Backs up the PostgreSQL database named by POSTGRES_DB using pg_dump.
 * Manual trigger only (admin Jobs panel); gzip output; retention via BACKUP_RETENTION_DAYS.
 */

import { BaseJob, type JobExecutionContext, type JobResult } from '../types'
import { logger } from '@/lib/logger'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'
import { createWriteStream, createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import { createGzip } from 'zlib'

interface BackupConfig {
  backupPath: string
  postgresHost: string
  postgresPort: string
  postgresUser: string
  postgresPassword: string
  postgresDatabase: string
  retentionDays: number
}

export class DatabaseBackupJob extends BaseJob {
  constructor() {
    super({
      id: 'database-backup',
      name: 'Veritabanı Yedekleme',
      description:
        'PostgreSQL veritabanını pg_dump ile sıkıştırılmış yedek olarak yazar. Yalnızca manuel tetikleme (zamanlama yok).',
      enabled: true,
      timezone: 'UTC',
    })
  }

  private getBackupConfig(): BackupConfig {
    const rawPath = process.env.BACKUP_PATH?.trim()
    const backupPath = rawPath
      ? resolve(rawPath)
      : join(tmpdir(), 'dynamic-portfolio-website-mehmetdogandev', 'backups')
    const postgresHost = process.env.POSTGRES_HOST || 'postgres'
    const postgresPort = process.env.POSTGRES_PORT || '5432'
    const postgresUser = process.env.POSTGRES_USER || 'postgres'
    const postgresPassword = process.env.POSTGRES_PASSWORD || ''
    const postgresDatabase =
      (process.env.POSTGRES_DB ?? 'mehmetdogandev_portfolio').trim() ||
      'mehmetdogandev_portfolio'

    if (!postgresPassword) {
      throw new Error('POSTGRES_PASSWORD environment variable is required')
    }

    return {
      backupPath,
      postgresHost,
      postgresPort,
      postgresUser,
      postgresPassword,
      postgresDatabase,
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    }
  }

  async execute(_context: JobExecutionContext): Promise<JobResult> {
    const startTime = Date.now()
    const config = this.getBackupConfig()

    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory(config.backupPath)

      const databases = [config.postgresDatabase]

      if (databases.length === 0) {
        return {
          success: false,
          message: 'No databases found to backup',
          duration: Date.now() - startTime,
        }
      }

      logger.info(`Starting backup for ${databases.length} database(s)`)

      const backupResults: Array<{
        database: string
        success: boolean
        filename?: string
        error?: string
      }> = []

      // Backup each database
      for (const database of databases) {
        try {
          const filename = await this.backupDatabase(database, config)
          backupResults.push({
            database,
            success: true,
            filename,
          })
          logger.info(
            `Successfully backed up database: ${database} -> ${filename}`
          )
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          backupResults.push({
            database,
            success: false,
            error: errorMessage,
          })
          logger.error(`Failed to backup database ${database}: ${errorMessage}`)
        }
      }

      // Clean up old backups
      const deletedCount = await this.cleanupOldBackups(config)

      const successCount = backupResults.filter((r) => r.success).length
      const failureCount = backupResults.filter((r) => !r.success).length

      const duration = Date.now() - startTime

      return {
        success: failureCount === 0,
        message: `Backed up ${successCount}/${databases.length} database(s). Deleted ${deletedCount} old backup(s).`,
        data: {
          backupResults,
          deletedCount,
          totalDatabases: databases.length,
          successCount,
          failureCount,
        },
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const err = error instanceof Error ? error : new Error(String(error))

      logger.error({ error: err }, `Database backup job failed: ${err.message}`)

      return {
        success: false,
        message: `Backup job failed: ${err.message}`,
        error: err,
        duration,
      }
    }
  }

  /**
   * Ensure backup directory exists, create if it doesn't
   */
  private async ensureBackupDirectory(backupPath: string): Promise<void> {
    try {
      await fs.access(backupPath)
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(backupPath, { recursive: true })
      logger.info(`Created backup directory: ${backupPath}`)
    }
  }

  /**
   * Backup a single database using streaming to handle large databases
   */
  private async backupDatabase(
    database: string,
    config: BackupConfig
  ): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19)
    const filename = `backup_${database}_${timestamp}.sql.gz`
    const filepath = join(config.backupPath, filename)
    const tempDumpPath = join(
      config.backupPath,
      `backup_${database}_${timestamp}.sql.tmp`
    )

    // Use spawn to stream pg_dump output directly to file (no memory buffering)
    // Remove password from command string - use only env.PGPASSWORD for security
    const pgDumpArgs = [
      '-h',
      config.postgresHost,
      '-p',
      config.postgresPort,
      '-U',
      config.postgresUser,
      '-d',
      database,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      '--verbose', // Add verbose flag for better debugging
    ]

    try {
      // Stream pg_dump output to temporary file
      await this.streamPgDumpToFile(
        pgDumpArgs,
        tempDumpPath,
        config.postgresPassword
      )

      // Log file size immediately after dump
      const dumpStats = await fs.stat(tempDumpPath)
      logger.debug(
        `Dump file created: ${tempDumpPath}, size: ${dumpStats.size} bytes`
      )

      // Validate the dump contains actual data
      await this.validateDumpContent(tempDumpPath)

      // Compress the dump file
      await this.compressDumpFile(tempDumpPath, filepath)

      // Clean up temporary file
      await fs.unlink(tempDumpPath)

      return filename
    } catch (error) {
      // Clean up temporary file on error
      try {
        await fs.unlink(tempDumpPath).catch(() => {
          // Ignore cleanup errors
        })
      } catch {
        // Ignore cleanup errors
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to backup database ${database}: ${errorMessage}`)
    }
  }

  /**
   * Stream pg_dump output directly to file using spawn (handles large databases)
   */
  private async streamPgDumpToFile(
    args: string[],
    outputPath: string,
    password: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stderrChunks: Buffer[] = []
      let hasError = false
      let processExited = false
      let streamFinished = false
      const TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 hours timeout for large databases

      // Create write stream for dump output
      const outputStream = createWriteStream(outputPath)

      // Spawn pg_dump process
      const pgDump = spawn('pg_dump', args, {
        env: {
          ...process.env,
          PGPASSWORD: password, // Only use env, not command string
        },
      })

      // Create timeout to prevent hanging forever
      const timeout = setTimeout(() => {
        if (!processExited || !streamFinished) {
          pgDump.kill('SIGTERM')
          outputStream.destroy()
          reject(
            new Error(
              `pg_dump timeout after ${TIMEOUT_MS / 1000 / 60} minutes. Process exited: ${processExited}, Stream finished: ${streamFinished}`
            )
          )
        }
      }, TIMEOUT_MS)

      let resolved = false

      // Helper to check if we can resolve (only once)
      const checkComplete = () => {
        if (resolved) return

        if (processExited && streamFinished) {
          resolved = true
          clearTimeout(timeout)
          const stderr = Buffer.concat(stderrChunks).toString()

          // Check for errors
          if (hasError) {
            reject(new Error(`pg_dump reported errors in stderr: ${stderr}`))
            return
          }

          // Log stderr even if no errors (might contain warnings)
          if (stderr.trim()) {
            logger.info(`pg_dump completed with warnings: ${stderr.trim()}`)
          }

          resolve()
        }
      }

      // Pipe stdout to file (don't auto-end stream)
      pgDump.stdout.pipe(outputStream, { end: false })

      // Capture stderr for error checking
      pgDump.stderr.on('data', (chunk: Buffer) => {
        stderrChunks.push(chunk)
        const stderrText = chunk.toString()

        // Log stderr output for debugging (verbose mode outputs to stderr)
        if (stderrText.trim()) {
          logger.debug(`pg_dump stderr: ${stderrText.trim()}`)
        }

        // Check for error patterns in stderr (but ignore verbose output)
        const lowerStderr = stderrText.toLowerCase()
        // Only mark as error if it's not just verbose progress messages
        if (
          (lowerStderr.includes('error') ||
            lowerStderr.includes('failed') ||
            lowerStderr.includes('fatal')) &&
          !lowerStderr.includes('dumping') &&
          !lowerStderr.includes('writing')
        ) {
          hasError = true
        }
      })

      // Handle process completion
      pgDump.on('close', (code) => {
        processExited = true

        // Check exit code first
        if (code !== 0) {
          resolved = true
          clearTimeout(timeout)
          outputStream.destroy()
          const stderr = Buffer.concat(stderrChunks).toString()
          reject(
            new Error(`pg_dump exited with code ${code}. stderr: ${stderr}`)
          )
          return
        }

        // End the output stream and wait for it to finish
        outputStream.end()
      })

      // Handle stream finish (all data written) - this fires before close
      outputStream.on('finish', () => {
        streamFinished = true
        checkComplete()
      })

      // Handle stream close (file descriptor closed) - backup check
      outputStream.on('close', () => {
        if (!streamFinished) {
          streamFinished = true
          checkComplete()
        }
      })

      // Handle spawn errors
      pgDump.on('error', (error) => {
        clearTimeout(timeout)
        outputStream.destroy()
        reject(new Error(`Failed to spawn pg_dump: ${error.message}`))
      })

      // Handle file stream errors
      outputStream.on('error', (error) => {
        clearTimeout(timeout)
        pgDump.kill('SIGTERM')
        reject(new Error(`Failed to write dump file: ${error.message}`))
      })

      // Handle stdout errors
      pgDump.stdout.on('error', (error) => {
        clearTimeout(timeout)
        outputStream.destroy()
        pgDump.kill('SIGTERM')
        reject(new Error(`pg_dump stdout error: ${error.message}`))
      })
    })
  }

  /**
   * Validate that dump file contains actual data (not just headers)
   */
  private async validateDumpContent(dumpPath: string): Promise<void> {
    const fileStats = await fs.stat(dumpPath)

    // Check if file is completely empty
    if (fileStats.size === 0) {
      throw new Error(
        'Backup file is empty (0 bytes). pg_dump may have failed silently.'
      )
    }

    // For very small files, check if they contain at least some valid SQL
    // This handles empty databases that still have schema
    const minSize = 256 // Reduced from 2048 to handle empty databases with minimal schema

    if (fileStats.size < minSize) {
      // For small files, still validate they contain valid SQL
      const buffer = Buffer.alloc(fileStats.size)
      const fileHandle = await fs.open(dumpPath, 'r')
      await fileHandle.read(buffer, 0, fileStats.size, 0)
      await fileHandle.close()

      const content = buffer.toString('utf8')
      logger.debug(
        `Validating small dump file: ${fileStats.size} bytes (full content will be checked)`
      )
      const hasValidSQL = this.hasValidSQLContent(content)

      if (!hasValidSQL) {
        const preview = content.substring(0, 200).replace(/\n/g, '\\n')
        const fullPreview = content.replace(/\n/g, '\\n')

        // Try to identify what's in the file
        const hasDrop = /DROP/i.test(content)
        const hasCreate = /CREATE/i.test(content)
        const hasComments = /--/.test(content)
        const hasSet = /SET/i.test(content)

        const foundPatterns = []
        if (hasDrop) foundPatterns.push('DROP')
        if (hasCreate) foundPatterns.push('CREATE')
        if (hasComments) foundPatterns.push('comments')
        if (hasSet) foundPatterns.push('SET')

        const patternInfo =
          foundPatterns.length > 0
            ? ` Found patterns: ${foundPatterns.join(', ')}.`
            : ' No recognizable SQL patterns.'

        logger.warn(
          `Small file validation failed. Size: ${fileStats.size} bytes.${patternInfo} Content: ${fullPreview}`
        )
        throw new Error(
          `Backup file too small (${fileStats.size} bytes) and does not contain valid SQL.${patternInfo} Preview: ${preview}`
        )
      }

      // Small file but has valid SQL - likely an empty database with minimal schema
      logger.debug(
        `Backup validation passed for small file: ${fileStats.size} bytes (likely empty database with minimal schema)`
      )
      return
    }

    // For large files, read multiple sections to ensure we catch SQL statements
    // Some dumps may have long comments or SET statements at the beginning
    const fileHandle = await fs.open(dumpPath, 'r')

    let content = ''
    let hasValidSQL = false
    let checkedSections: string[] = []

    try {
      // Read beginning (first 100KB for large files, or entire file if smaller)
      const beginningSize = Math.min(100 * 1024, fileStats.size)
      const beginningBuffer = Buffer.alloc(beginningSize)
      const { bytesRead: beginningBytesRead } = await fileHandle.read(
        beginningBuffer,
        0,
        beginningSize,
        0
      )

      content = beginningBuffer.subarray(0, beginningBytesRead).toString('utf8')

      // Try different encodings if UTF-8 fails
      if (content.includes('\uFFFD') || content.length === 0) {
        content = beginningBuffer
          .subarray(0, beginningBytesRead)
          .toString('latin1')
      }

      logger.debug(
        `Validating dump file: ${fileStats.size} bytes, checking beginning (${beginningBytesRead} bytes)`
      )
      hasValidSQL = this.hasValidSQLContent(content)
      checkedSections.push('beginning')

      // If validation fails on beginning, check middle and end sections
      // This is important for files that start with many DROP statements or comments
      // Previously only checked for files >10MB, but now check for any file that fails beginning validation
      if (!hasValidSQL) {
        logger.debug(
          `Beginning validation failed, checking additional sections for file size: ${fileStats.size} bytes`
        )

        // Check middle section (if file is large enough)
        if (fileStats.size > 200 * 1024) {
          const middleOffset = Math.floor(fileStats.size / 2)
          const middleSize = Math.min(100 * 1024, fileStats.size - middleOffset)
          const middleBuffer = Buffer.alloc(middleSize)
          const { bytesRead: middleBytesRead } = await fileHandle.read(
            middleBuffer,
            0,
            middleSize,
            middleOffset
          )
          let middleContent = middleBuffer
            .subarray(0, middleBytesRead)
            .toString('utf8')
          if (middleContent.includes('\uFFFD')) {
            middleContent = middleBuffer
              .subarray(0, middleBytesRead)
              .toString('latin1')
          }
          logger.debug(
            `Checking middle section at offset ${middleOffset} (${middleBytesRead} bytes)`
          )
          hasValidSQL = this.hasValidSQLContent(middleContent)
          checkedSections.push('middle')
          if (hasValidSQL) {
            content = middleContent
          }
        }

        // If still not found, check end section
        if (!hasValidSQL && fileStats.size > 100 * 1024) {
          const endOffset = Math.max(0, fileStats.size - 100 * 1024)
          const endSize = fileStats.size - endOffset
          const endBuffer = Buffer.alloc(endSize)
          const { bytesRead: endBytesRead } = await fileHandle.read(
            endBuffer,
            0,
            endSize,
            endOffset
          )
          let endContent = endBuffer.subarray(0, endBytesRead).toString('utf8')
          if (endContent.includes('\uFFFD')) {
            endContent = endBuffer.subarray(0, endBytesRead).toString('latin1')
          }
          logger.debug(
            `Checking end section at offset ${endOffset} (${endBytesRead} bytes)`
          )
          hasValidSQL = this.hasValidSQLContent(endContent)
          checkedSections.push('end')
          if (hasValidSQL) {
            content = endContent
          }
        }
      }

      if (!hasValidSQL) {
        // Create a more detailed error message
        const preview = content.substring(0, 500).replace(/\n/g, '\\n')

        // Try to identify what's actually in the file
        const hasDrop = /DROP/i.test(content)
        const hasCreate = /CREATE/i.test(content)
        const hasComments = /--/.test(content)
        const hasSet = /SET/i.test(content)
        const hasText = content.trim().length > 0

        const foundPatterns = []
        if (hasDrop) foundPatterns.push('DROP statements')
        if (hasCreate) foundPatterns.push('CREATE statements')
        if (hasComments) foundPatterns.push('comments')
        if (hasSet) foundPatterns.push('SET statements')
        if (!hasText) foundPatterns.push('empty content')

        const patternInfo =
          foundPatterns.length > 0
            ? ` Found: ${foundPatterns.join(', ')}.`
            : ' No recognizable SQL patterns found.'

        throw new Error(
          `Backup file does not contain expected SQL statements. Size: ${fileStats.size} bytes. Checked sections: ${checkedSections.join(', ')}.${patternInfo} First 500 chars: ${preview}`
        )
      }
    } finally {
      await fileHandle.close()
    }

    const hasTables = /CREATE TABLE/i.test(content)
    const hasData = /INSERT INTO|COPY /i.test(content)
    const hasSchema = /CREATE SCHEMA|CREATE EXTENSION/i.test(content)

    // Log file size category for debugging
    const sizeCategory =
      fileStats.size > 100 * 1024 * 1024
        ? 'very large (>100MB)'
        : fileStats.size > 10 * 1024 * 1024
          ? 'large (>10MB)'
          : fileStats.size > 1024 * 1024
            ? 'medium (>1MB)'
            : 'small'

    logger.debug(
      `Backup validation passed: ${fileStats.size} bytes (${sizeCategory}), contains tables: ${hasTables}, data: ${hasData}, schema: ${hasSchema}`
    )
  }

  /**
   * Check if content contains valid SQL statements
   */
  private hasValidSQLContent(content: string): boolean {
    // Check for various SQL patterns that pg_dump might produce
    const patterns = [
      // DROP statements (critical for --clean flag)
      /DROP TABLE/i,
      /DROP CONSTRAINT/i,
      /DROP SCHEMA/i,
      /DROP TYPE/i,
      /DROP FUNCTION/i,
      /DROP SEQUENCE/i,
      /DROP INDEX/i,
      /DROP TRIGGER/i,
      /DROP SEQUENCE OWNED BY/i,
      /DROP DEFAULT/i,
      /DROP SEQUENCE/i,
      // CREATE statements
      /CREATE TABLE/i,
      /CREATE SCHEMA/i,
      /CREATE EXTENSION/i,
      /CREATE TYPE/i,
      /CREATE FUNCTION/i,
      /CREATE SEQUENCE/i,
      /CREATE INDEX/i,
      /CREATE CONSTRAINT/i,
      // Data statements
      /INSERT INTO/i,
      /COPY /i,
      // ALTER statements
      /ALTER TABLE/i,
      /COMMENT ON/i,
      // Permission statements
      /GRANT /i,
      /REVOKE /i,
      // Configuration statements
      /SET /i,
      // Transaction statements
      /BEGIN/i,
      /COMMIT/i,
      // Other pg_dump patterns
      /SELECT pg_catalog/i,
      /LOCK TABLE/i,
      /ANALYZE /i,
      // SQL comments
      /--/i,
    ]

    const matchedPatterns: string[] = []
    const hasMatch = patterns.some((pattern) => {
      if (pattern.test(content)) {
        // Extract pattern name for debugging
        const patternStr = pattern.toString()
        matchedPatterns.push(patternStr)
        return true
      }
      return false
    })

    if (hasMatch) {
      logger.debug(
        `Validation matched patterns: ${matchedPatterns.slice(0, 3).join(', ')}${matchedPatterns.length > 3 ? '...' : ''}`
      )
    }

    return hasMatch
  }

  /**
   * Compress dump file using gzip streaming
   */
  private async compressDumpFile(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    const readStream = createReadStream(inputPath)
    const writeStream = createWriteStream(outputPath)
    const gzipStream = createGzip()

    try {
      await pipeline(readStream, gzipStream, writeStream)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to compress backup file: ${errorMessage}`)
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(config: BackupConfig): Promise<number> {
    try {
      const files = await fs.readdir(config.backupPath)
      const now = Date.now()
      const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000
      let deletedCount = 0

      for (const file of files) {
        // Only process backup files
        if (!file.startsWith('backup_') || !file.endsWith('.sql.gz')) {
          continue
        }

        const filepath = join(config.backupPath, file)

        try {
          const stats = await fs.stat(filepath)
          const fileAge = now - stats.mtime.getTime()

          if (fileAge > retentionMs) {
            await fs.unlink(filepath)
            deletedCount++
            logger.info(
              `Deleted old backup: ${file} (${Math.round(fileAge / (24 * 60 * 60 * 1000))} days old)`
            )
          }
        } catch (error) {
          logger.warn(`Failed to process file ${file} during cleanup: ${error}`)
        }
      }

      return deletedCount
    } catch (error) {
      logger.error(`Failed to cleanup old backups: ${error}`)
      return 0
    }
  }
}
