import type {Database} from '#shared/types/database.generated'
type Workspace=Database['public']['Tables']['quolyn_workspaces']['Row']
export function useDb() {
  const db = useNuxtApp().$supabase
  if (!db) throw createError({ statusCode: 503, message: 'Configure the Supabase URL and publishable key in .env, then restart.' })
  return db
}
export function useWorkspace() { return useState<Workspace | null>('workspace', () => null) }
export function useAction() {
  const error = ref(''), busy = ref(false), notice = ref('')
  async function run(fn: () => Promise<void>) { error.value='';notice.value='';busy.value=true; try { await fn() } catch(e: any) { error.value=e.data?.message ?? e.message ?? 'Something went wrong. Please try again.' } finally { busy.value=false } }
  return { error,busy,notice,run }
}
export function check<R extends {data: unknown; error: {message: string} | null}>(result: R): NonNullable<R['data']> { if(result.error) throw new Error(result.error.message); return result.data as NonNullable<R['data']> }
