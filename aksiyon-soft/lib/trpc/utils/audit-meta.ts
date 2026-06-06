import type { PgTable } from 'drizzle-orm/pg-core'
import type { PgColumn } from 'drizzle-orm/pg-core'

type AnyObject = Record<string, unknown>

type AuditMetaValues = {
  createdBy?: string | null
  lastUpdatedBy?: string | null
  deletedBy?: string | null
  deletedAt?: Date | null
}

type AuditAwareTable = PgTable & {
  createdBy?: PgColumn
  lastUpdatedBy?: PgColumn
  deletedBy?: PgColumn
}

const hasAuditColumns = (table: PgTable): table is AuditAwareTable => {
  const candidate = table as AuditAwareTable

  return Boolean(
    candidate.createdBy && candidate.lastUpdatedBy && candidate.deletedBy
  )
}

const clone = (value: AnyObject): AnyObject => ({ ...value })

const applyCreateMeta = (
  value: AnyObject,
  table: AuditAwareTable,
  actorId: string | null
): AnyObject => {
  const next = clone(value)

  if (table.createdBy) {
    next.createdBy = actorId
  }

  if (table.lastUpdatedBy) {
    next.lastUpdatedBy = actorId
  }

  return next
}

const applyUpdateMeta = (
  value: AnyObject,
  table: AuditAwareTable,
  actorId: string | null
): AnyObject => {
  const next = clone(value)

  if (table.lastUpdatedBy) {
    next.lastUpdatedBy = actorId
  }

  if (table.deletedBy && 'deletedAt' in value) {
    next.deletedBy = actorId
  }

  return next
}

export type AuditToolkit = {
  actorId: string | null
  withCreateMeta<T extends AnyObject>(
    table: PgTable,
    value: T
  ): T & AuditMetaValues
  withUpdateMeta<T extends AnyObject>(
    table: PgTable,
    value: T
  ): T & AuditMetaValues
  softDelete<T extends AnyObject>(
    table: PgTable,
    extra?: T
  ): T & { deletedAt: Date }
}

export const createAuditToolkit = (actorId?: string | null): AuditToolkit => {
  const actor = actorId ?? null

  const toolkit: AuditToolkit = {
    actorId: actor,
    withCreateMeta<T extends AnyObject>(
      table: PgTable,
      value: T
    ): T & AuditMetaValues {
      if (!hasAuditColumns(table)) {
        return value
      }

      return applyCreateMeta(value, table, actor) as T & AuditMetaValues
    },
    withUpdateMeta<T extends AnyObject>(
      table: PgTable,
      value: T
    ): T & AuditMetaValues {
      if (!hasAuditColumns(table)) {
        return value
      }

      return applyUpdateMeta(value, table, actor) as T & AuditMetaValues
    },
    softDelete<T extends AnyObject>(table: PgTable, extra?: T) {
      const payload = {
        deletedAt: new Date(),
        ...(extra ?? {}),
      }

      return toolkit.withUpdateMeta(table, payload) as T & { deletedAt: Date }
    },
  }

  return toolkit
}

export const createAuditedDb = <TDb extends object>(
  db: TDb,
  toolkit: AuditToolkit
): TDb => {
  return new Proxy(db as object, {
    get(target, prop, receiver) {
      if (prop === 'insert') {
        return (table: PgTable) => {
          const builder = Reflect.get(target, prop, receiver).call(
            target,
            table
          )

          if (!hasAuditColumns(table)) {
            return builder
          }

          const originalValues = builder.values.bind(builder)

          builder.values = (values: unknown) => {
            if (Array.isArray(values)) {
              return originalValues(
                values.map((value) =>
                  toolkit.withCreateMeta(table, value as AnyObject)
                )
              )
            }

            return originalValues(
              toolkit.withCreateMeta(table, values as AnyObject)
            )
          }

          return builder
        }
      }

      if (prop === 'update') {
        return (table: PgTable) => {
          const builder = Reflect.get(target, prop, receiver).call(
            target,
            table
          )

          if (!hasAuditColumns(table)) {
            return builder
          }

          const originalSet = builder.set.bind(builder)

          builder.set = (values: unknown) =>
            originalSet(toolkit.withUpdateMeta(table, values as AnyObject))

          return builder
        }
      }

      return Reflect.get(target, prop, receiver)
    },
  }) as TDb
}
