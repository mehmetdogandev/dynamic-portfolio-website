import type { CarFixture, CustomerFixture } from './types'

/** Plates that go through 5 transfers → 6 ownership periods with 5 jobs each. */
export const STORY_PLATES = [
  '68 DEMO 001',
  '34 DEMO 002',
  '06 DEMO 003',
] as const

export const BASE_CUSTOMERS: CustomerFixture[] = [
  {
    key: 'ali',
    name: 'Ali',
    surname: 'Öztürk',
    phone: '+90 532 100 20 30',
    address: 'Aksaray merkez',
  },
  {
    key: 'ayse',
    name: 'Ayşe',
    surname: 'Kara',
    phone: '+90 533 222 33 44',
    address: null,
  },
  {
    key: 'mehmet',
    name: 'Mehmet',
    surname: 'Yıldız',
    phone: '+90 534 333 44 55',
    address: 'Aksaray, Sanayi sitesi',
  },
  {
    key: 'fatma',
    name: 'Fatma',
    surname: 'Çelik',
    phone: '+90 535 444 55 66',
    address: 'Aksaray',
  },
  {
    key: 'hasan',
    name: 'Hasan',
    surname: 'Arslan',
    phone: '+90 536 555 66 77',
    address: null,
  },
  {
    key: 'zeynep',
    name: 'Zeynep',
    surname: 'Aydın',
    phone: '+90 537 666 77 88',
    address: 'Kayseri yolu',
  },
  {
    key: 'emre',
    name: 'Emre',
    surname: 'Koç',
    phone: '+90 538 777 88 99',
    address: 'Aksaray OSB',
  },
  {
    key: 'selin',
    name: 'Selin',
    surname: 'Demir',
    phone: '+90 539 888 99 00',
    address: null,
  },
  {
    key: 'burak',
    name: 'Burak',
    surname: 'Şahin',
    phone: '+90 541 999 00 11',
    address: 'Merkez',
  },
  {
    key: 'deniz',
    name: 'Deniz',
    surname: 'Kurt',
    phone: '+90 542 111 22 33',
    address: 'Aksaray',
  },
  {
    key: 'can',
    name: 'Can',
    surname: 'Polat',
    phone: '+90 543 222 33 44',
    address: null,
  },
  {
    key: 'elif',
    name: 'Elif',
    surname: 'Güneş',
    phone: '+90 544 333 44 55',
    address: 'Sanayi',
  },
]

/** Extra customers created during ownership transfers (phase 4). */
export const TRANSFER_CUSTOMERS: CustomerFixture[] = [
  {
    key: 'transfer_1',
    name: 'Murat',
    surname: 'Tekin',
    phone: '+90 545 444 55 66',
    address: 'Aksaray',
  },
  {
    key: 'transfer_2',
    name: 'Seda',
    surname: 'Akın',
    phone: '+90 546 555 66 77',
    address: null,
  },
  {
    key: 'transfer_3',
    name: 'Oğuz',
    surname: 'Bayrak',
    phone: '+90 547 666 77 88',
    address: 'Merkez',
  },
  {
    key: 'transfer_4',
    name: 'Gizem',
    surname: 'Özkan',
    phone: '+90 548 777 88 99',
    address: 'Aksaray',
  },
  {
    key: 'transfer_5',
    name: 'Kemal',
    surname: 'Usta',
    phone: '+90 549 888 99 00',
    address: 'Sanayi',
  },
]

export const PART_CATALOG: Array<{
  brand: string | null
  partNo: string | null
  partName: string
  unitPrice: string
}> = [
  {
    brand: 'Bosch',
    partNo: 'BO-1457436032',
    partName: 'Yağ filtresi',
    unitPrice: '380.00',
  },
  {
    brand: 'Mobil',
    partNo: 'MO-5W30-4L',
    partName: '5W30 Motor Yağı 4L',
    unitPrice: '1450.00',
  },
  {
    brand: 'Ferodo',
    partNo: 'FE-FDB1675',
    partName: 'Ön fren balatası',
    unitPrice: '890.00',
  },
  {
    brand: 'Mann',
    partNo: 'MN-C25114',
    partName: 'Polen filtresi',
    unitPrice: '220.00',
  },
  {
    brand: 'Varta',
    partNo: 'VA-E11',
    partName: 'Akü 60Ah',
    unitPrice: '3200.00',
  },
  {
    brand: 'Continental',
    partNo: 'CO-1956515',
    partName: 'Yaz lastiği',
    unitPrice: '2100.00',
  },
  {
    brand: 'NGK',
    partNo: 'NG-BKR6E',
    partName: 'Buji seti',
    unitPrice: '640.00',
  },
  {
    brand: 'Febi',
    partNo: 'FE-27412',
    partName: 'Triger gergi rulmanı',
    unitPrice: '450.00',
  },
  {
    brand: 'Mahle',
    partNo: 'MA-OC90',
    partName: 'Hava filtresi',
    unitPrice: '310.00',
  },
  {
    brand: 'TRW',
    partNo: 'TR-DF4023',
    partName: 'Arka fren diski',
    unitPrice: '1250.00',
  },
]

export const SERVICE_NAMES = [
  'Yağ ve filtre değişimi',
  'Fren balata değişimi',
  'Lastik rotasyonu',
  'Akü kontrolü ve değişimi',
  'Triger seti değişimi',
  'Klima bakımı',
  'Periyodik bakım',
  'Arıza tespiti (diagnostik)',
] as const

export const FORMEN_NAMES = [
  'Ahmet Yılmaz',
  'Mehmet Demir',
  'Hasan Kaya',
  'Murat Çelik',
] as const

export const INITIAL_CARS: CarFixture[] = [
  {
    plate: '68 DEMO 001',
    vehicleType: 'Toyota Corolla',
    color: 'Beyaz',
    initialKm: 85_000,
    ownerKey: 'ali',
    isStoryPlate: true,
  },
  {
    plate: '34 DEMO 002',
    vehicleType: 'Honda Civic',
    color: 'Siyah',
    initialKm: 62_000,
    ownerKey: 'ayse',
    isStoryPlate: true,
  },
  {
    plate: '06 DEMO 003',
    vehicleType: 'Volkswagen Golf',
    color: 'Gri',
    initialKm: 98_000,
    ownerKey: 'mehmet',
    isStoryPlate: true,
  },
  {
    plate: '68 ABC 456',
    vehicleType: 'Renault Clio',
    color: 'Kırmızı',
    initialKm: 120_400,
    ownerKey: 'fatma',
  },
  {
    plate: '34 KZN 9087',
    vehicleType: 'Fiat Egea',
    color: 'Mavi',
    initialKm: 45_200,
    ownerKey: 'hasan',
  },
  {
    plate: '68 XY 7788',
    vehicleType: 'Hyundai i20',
    color: 'Beyaz',
    initialKm: 33_100,
    ownerKey: 'zeynep',
  },
  {
    plate: '34 ST 1415',
    vehicleType: 'Seat Ibiza',
    color: 'Turuncu',
    initialKm: 19_800,
    ownerKey: 'emre',
  },
  {
    plate: '68 KB 1515',
    vehicleType: 'Tesla Model 3',
    color: 'Beyaz',
    initialKm: 28_400,
    ownerKey: 'selin',
  },
  {
    plate: '06 ANK 99',
    vehicleType: 'Ford Focus',
    color: 'Gümüş',
    initialKm: 156_000,
    ownerKey: 'burak',
  },
  {
    plate: '35 IZM 44',
    vehicleType: 'Opel Astra',
    color: 'Lacivert',
    initialKm: 88_500,
    ownerKey: 'deniz',
  },
  {
    plate: '16 BUR 77',
    vehicleType: 'Peugeot 301',
    color: 'Beyaz',
    initialKm: 72_300,
    ownerKey: 'can',
  },
  {
    plate: '07 ANT 12',
    vehicleType: 'Dacia Duster',
    color: 'Yeşil',
    initialKm: 41_000,
    ownerKey: 'elif',
  },
]
