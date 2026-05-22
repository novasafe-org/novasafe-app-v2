import { useState } from "react";
import { useVault } from "@/lib/vault-store";
import { FileText, Image as ImageIcon, Download, Share2, Trash2, Upload } from "lucide-react";
import { useUI } from "@/lib/ui-store";
import { toast } from "sonner";

function fmt(n: number) { return n < 1024*1024 ? `${(n/1024).toFixed(0)} KB` : `${(n/1024/1024).toFixed(1)} MB`; }

export function DocumentsView() {
  const docs = useVault((s) => s.documents);
  const removeDocument = useVault((s) => s.removeDocument);
  const addDocument = useVault((s) => s.addDocument);
  const openShare = useUI((s) => s.openShare);
  const [folder, setFolder] = useState<string>("All");
  const folders = ["All", ...Array.from(new Set(docs.map((d) => d.folder)))];
  const [selectedId, setSelectedId] = useState<string | null>(docs[0]?.id ?? null);
  const filtered = folder === "All" ? docs : docs.filter((d) => d.folder === folder);
  const selected = filtered.find((d) => d.id === selectedId) ?? filtered[0];

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => addDocument({ name: f.name, folder: "Uploads", size: f.size, kind: f.type.includes("image") ? "image" : "pdf", shared: [], tags: [], versions: 1 }));
    if (files.length) toast.success(`${files.length} file(s) uploaded`);
  };

  return (
    <div className="h-full flex min-w-0">
      <div className="w-48 shrink-0 p-4 border-r border-hairline space-y-1">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint mb-2">Folders</div>
        {folders.map((f) => (
          <button key={f} onClick={() => setFolder(f)} className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg ${folder===f?"bg-accent text-brand-ink":"text-ink-muted hover:bg-muted"}`}>{f}</button>
        ))}
      </div>
      <div className="flex-1 min-w-0 flex flex-col" onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Documents</h1>
            <p className="text-xs text-ink-muted">Drop files anywhere to upload</p>
          </div>
          <label className="h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm inline-flex items-center gap-1.5 shadow-float cursor-pointer">
            <Upload className="size-4" />Upload
            <input type="file" multiple className="hidden" onChange={(e)=>{ const files = Array.from(e.target.files ?? []); files.forEach((f)=>addDocument({name:f.name,folder:"Uploads",size:f.size,kind:f.type.includes("image")?"image":"pdf",shared:[],tags:[],versions:1})); if(files.length) toast.success(`${files.length} uploaded`); }} />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
          <ul className="space-y-1">
            {filtered.map((d) => (
              <li key={d.id}>
                <button onClick={()=>setSelectedId(d.id)} className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl ${selected?.id===d.id?"bg-accent":"hover:bg-muted/70"}`}>
                  <span className="size-10 rounded-lg brand-gradient-soft grid place-items-center text-brand">{d.kind==="image"?<ImageIcon className="size-4" />:<FileText className="size-4" />}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{d.name}</span>
                    <span className="block text-xs text-ink-muted">{d.folder} · {fmt(d.size)} · v{d.versions}</span>
                  </span>
                  {d.shared.length > 0 && <span className="text-[11px] text-ink-muted">Shared</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="text-center py-12 text-sm text-ink-muted">No documents</li>}
          </ul>
        </div>
      </div>
      {selected && (
        <div className="hidden lg:flex w-[320px] shrink-0 border-l border-hairline flex-col bg-surface/40">
          <div className="p-5 border-b border-hairline">
            <div className="size-12 rounded-xl brand-gradient-soft grid place-items-center mb-3 text-brand">{selected.kind==="image"?<ImageIcon className="size-5" />:<FileText className="size-5" />}</div>
            <div className="text-sm font-semibold truncate">{selected.name}</div>
            <div className="text-xs text-ink-muted">{selected.folder} · {fmt(selected.size)}</div>
          </div>
          <div className="p-5 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-ink-muted">Uploaded</span><span>{new Date(selected.uploadedAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Versions</span><span>{selected.versions}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Shared with</span><span>{selected.shared.length || "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Encryption</span><span className="text-success">AES-256</span></div>
          </div>
          <div className="mt-auto p-4 grid grid-cols-3 gap-2">
            <button onClick={()=>toast.success("Downloaded")} className="h-9 rounded-lg hairline text-xs inline-flex items-center justify-center gap-1"><Download className="size-3.5" />Get</button>
            <button onClick={()=>openShare(selected.name)} className="h-9 rounded-lg hairline text-xs inline-flex items-center justify-center gap-1"><Share2 className="size-3.5" />Share</button>
            <button onClick={()=>{removeDocument(selected.id);toast.success("Deleted");}} className="h-9 rounded-lg text-xs inline-flex items-center justify-center gap-1 text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
