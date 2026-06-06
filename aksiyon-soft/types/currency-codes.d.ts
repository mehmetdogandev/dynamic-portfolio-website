declare module 'currency-codes' {
  interface Currency {
    code: string
    number: string
    digits: number
    currency: string
    countries: string[]
  }

  interface CurrencyCodes {
    codes(): string[]
    code(code: string): Currency | null
    number(number: string): Currency | null
    currency(currency: string): Currency | null
    country(country: string): Currency[]
  }

  const currencyCodes: CurrencyCodes
  export default currencyCodes
}
