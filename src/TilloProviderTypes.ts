/* Copyright © 2022-2026 Seneca Project Contributors, MIT License. */

// Plugin Options

export type TilloProviderOptions = {
  url: string
  fetch: any
  entity: Record<string, any>
  debug: boolean
}

// Brand Entity Types

export type BrandListParams = {
  detail?: boolean
  currency?: string
  country?: string
}

export type BrandData = {
  name: string
  value: any
}

// Float Entity Types

export type FloatListParams = {
  currency?: string
}

export type FloatData = {
  currency: string
  [key: string]: any
}

// Digital Gift Card Entity Types

export type DgcSaveParams = {
  clientRequestId?: string
  user_id?: string
  brand: string
  currency?: string
  value: number
  sector?: string
}

export type DgcPayload = {
  client_request_id: string
  brand: string
  face_value: {
    amount: number
    currency: string
  }
  delivery_method: string
  fulfilment_by: string
  sector: string
}
