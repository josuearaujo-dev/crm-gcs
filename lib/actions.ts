'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabase/server'

// ───── GCs ─────────────────────────────────────────────

export async function listarGCs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gcs')
    .select('*')
    .order('nome')
  if (error) throw new Error(error.message)
  return data
}

export async function buscarGC(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gcs')
    .select('*, pessoas(*)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function criarGC(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('gcs').insert({
    nome: formData.get('nome') as string,
    endereco: formData.get('endereco') as string,
    lat: parseFloat(formData.get('lat') as string),
    lng: parseFloat(formData.get('lng') as string),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/gcs')
  revalidatePath('/mapa')
}

export async function atualizarGC(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('gcs')
    .update({
      nome: formData.get('nome') as string,
      endereco: formData.get('endereco') as string,
      lat: parseFloat(formData.get('lat') as string),
      lng: parseFloat(formData.get('lng') as string),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/gcs')
  revalidatePath('/mapa')
}

export async function excluirGC(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('gcs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/gcs')
  revalidatePath('/mapa')
}

// ───── Pessoas ──────────────────────────────────────────

export async function listarPessoas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pessoas')
    .select('*, gc:gcs(id, nome)')
    .order('nome')
  if (error) throw new Error(error.message)
  return data
}

export async function criarPessoa(formData: FormData) {
  const supabase = await createClient()
  const gcId = formData.get('gc_id') as string | null
  const { error } = await supabase.from('pessoas').insert({
    nome: formData.get('nome') as string,
    endereco: formData.get('endereco') as string,
    lat: parseFloat(formData.get('lat') as string),
    lng: parseFloat(formData.get('lng') as string),
    gc_id: gcId || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/pessoas')
  revalidatePath('/gcs')
  revalidatePath('/mapa')
}

export async function atualizarPessoa(id: string, formData: FormData) {
  const supabase = await createClient()
  const gcId = formData.get('gc_id') as string | null
  const { error } = await supabase
    .from('pessoas')
    .update({
      nome: formData.get('nome') as string,
      endereco: formData.get('endereco') as string,
      lat: parseFloat(formData.get('lat') as string),
      lng: parseFloat(formData.get('lng') as string),
      gc_id: gcId || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/pessoas')
  revalidatePath('/gcs')
  revalidatePath('/mapa')
}

export async function excluirPessoa(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('pessoas').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/pessoas')
  revalidatePath('/gcs')
  revalidatePath('/mapa')
}
