import { Plus, Trash2 } from "lucide-react";
import { newId } from "@/lib/plan";
import { tags, type Adaptation, type Block, type ChecklistItem, type Tag } from "@/lib/rotina";
import { Input } from "@/components/ui/input";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
      <Plus className="size-4" />{label}
    </button>
  );
}

function DeleteBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive">
      <Trash2 className="size-4" />
    </button>
  );
}

/** Edits the daily routine: time (e.g. 5:00-5:10 or 22:00), activity, method, tip and tag. */
export function RotinaEditor({ rows, onChange }: { rows: Block[]; onChange: (rows: Block[]) => void }) {
  const set = (i: number, patch: Partial<Block>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div>
      <div className="hidden grid-cols-[7.5rem_1.4fr_1.2fr_1fr_8.5rem_2.25rem] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <div>Horário</div><div>Atividade</div><div>Método</div><div>Dica chave</div><div>Tipo</div><div />
      </div>
      <div className="grid gap-3">
        {rows.map((r, i) => (
          <div key={r.id} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[7.5rem_1.4fr_1.2fr_1fr_8.5rem_2.25rem] md:items-center md:border-0 md:p-0">
            <Input aria-label={`Horário, linha ${i + 1}`} placeholder="5:00-5:10" className="font-mono" value={r.time} onChange={(e) => set(i, { time: e.target.value })} />
            <Input aria-label={`Atividade, linha ${i + 1}`} placeholder="Atividade" value={r.activity} onChange={(e) => set(i, { activity: e.target.value })} />
            <Input aria-label={`Método, linha ${i + 1}`} placeholder="Método" value={r.method} onChange={(e) => set(i, { method: e.target.value })} />
            <Input aria-label={`Dica chave, linha ${i + 1}`} placeholder="Dica chave" value={r.tip} onChange={(e) => set(i, { tip: e.target.value })} />
            <select aria-label={`Tipo, linha ${i + 1}`} className={selectCls} value={r.tag} onChange={(e) => set(i, { tag: e.target.value as Tag })}>
              {tags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <DeleteBtn label={`Remover linha ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <AddRow label="Adicionar bloco" onClick={() => onChange([...rows, { id: newId(), time: "", activity: "", method: "", tip: "", tag: "Foco" }])} />
      <p className="mt-3 text-xs text-muted-foreground">Horário no formato 5:00-5:10 (início menor que o fim) ou só 22:00. Ao salvar, os blocos são ordenados por horário.</p>
    </div>
  );
}

type Field<T> = { key: keyof T & string; label: string; placeholder: string };

/** Generic three-column editor used by Adaptações and Checklist. */
function ListEditor<T extends { id: string }>({ rows, fields, onChange, blank, addLabel }: {
  rows: T[]; fields: Field<T>[]; onChange: (rows: T[]) => void; blank: () => T; addLabel: string;
}) {
  const set = (i: number, key: keyof T, value: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  return (
    <div>
      <div className="hidden grid-cols-[1fr_1fr_1fr_2.25rem] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        {fields.map((f) => <div key={f.key}>{f.label}</div>)}<div />
      </div>
      <div className="grid gap-3">
        {rows.map((r, i) => (
          <div key={r.id} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-[1fr_1fr_1fr_2.25rem] md:items-center md:border-0 md:p-0">
            {fields.map((f) => (
              <Input key={f.key} aria-label={`${f.label}, linha ${i + 1}`} placeholder={f.placeholder}
                value={String(r[f.key] ?? "")} onChange={(e) => set(i, f.key, e.target.value)} />
            ))}
            <DeleteBtn label={`Remover linha ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <AddRow label={addLabel} onClick={() => onChange([...rows, blank()])} />
    </div>
  );
}

export function AdaptacoesEditor({ rows, onChange }: { rows: Adaptation[]; onChange: (rows: Adaptation[]) => void }) {
  return (
    <ListEditor<Adaptation> rows={rows} onChange={onChange} addLabel="Adicionar adaptação"
      fields={[
        { key: "scenario", label: "Cenário", placeholder: "Cenário" },
        { key: "adjustment", label: "Ajuste", placeholder: "Ajuste" },
        { key: "alternative", label: "Alternativa", placeholder: "Alternativa" },
      ]}
      blank={() => ({ id: newId(), scenario: "", adjustment: "", alternative: "" })} />
  );
}

export function ChecklistEditor({ rows, onChange }: { rows: ChecklistItem[]; onChange: (rows: ChecklistItem[]) => void }) {
  return (
    <ListEditor<ChecklistItem> rows={rows} onChange={onChange} addLabel="Adicionar item"
      fields={[
        { key: "day", label: "Dia", placeholder: "Segunda-feira" },
        { key: "action", label: "Ação", placeholder: "Ação" },
        { key: "duration", label: "Duração", placeholder: "30min" },
      ]}
      blank={() => ({ id: newId(), day: "", action: "", duration: "" })} />
  );
}
