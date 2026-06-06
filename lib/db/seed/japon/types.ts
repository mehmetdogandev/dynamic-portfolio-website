export type PartSeed = {
  brand: string | null
  partNo: string | null
  partName: string
  quantity: number
  unitPrice: string
}

export type JobSeedTemplate = {
  formen: string | null
  serviceNames: string[]
  parts: PartSeed[]
  notes?: string
  /** completed | in_progress | cancelled | none */
  status?: 'completed' | 'in_progress' | 'cancelled' | 'none'
}

export type CustomerFixture = {
  key: string
  name: string
  surname: string
  phone: string
  address: string | null
  notes?: string
}

export type CarFixture = {
  plate: string
  vehicleType: string
  color: string
  initialKm: number
  ownerKey: string
  notes?: string
  isStoryPlate?: boolean
}

export type SeededCustomer = {
  key: string
  id: string
  customerNo: string
}

export type SeededCar = {
  plate: string
  id: string
  ownerKey: string
  isStoryPlate: boolean
}

export type SeedContext = {
  customerIdByKey: Map<string, string>
  carIdByPlate: Map<string, string>
  serviceIdByName: Map<string, string>
  formenIdByFullName: Map<string, string>
  stats: {
    customers: number
    cars: number
    jobs: number
    parts: number
    ownershipRows: number
  }
}
