import { Dashboard } from '@/components/dashboard';
import { Shell } from '@/components/shell';
export default function Page() {
 const retrievalOnly=process.env.NEXT_PUBLIC_CHAT_USE_MOCK==='false';
 return <Shell active="dashboard">{retrievalOnly ? <section className="panel p-8"><h1 className="text-2xl font-semibold">Owner workspace is not connected yet</h1><p className="muted mt-3">Persistent leads and owner alerts are unfinished. Use customer chat to try hotel FAQ retrieval.</p></section> : <Dashboard />}</Shell>;
}
