export type GC = {
  id: string
  nome: string
  endereco: string
  lat: number
  lng: number
  created_at: string
}

export type Pessoa = {
  id: string
  nome: string
  endereco: string
  lat: number
  lng: number
  gc_id: string | null
  created_at: string
  gc?: GC | null
}

export type GCComPessoas = GC & {
  pessoas: Pessoa[]
}
