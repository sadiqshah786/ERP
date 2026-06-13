import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserPlus, Plus, Pencil, Trash2, Shield, Users as UsersIcon, Wrench, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import { Doc, listDocs, createDoc, updateDocById, deleteDocById } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

// ── Permission matrix definition ──────────────────────────────
const PERMISSION_TABS: { key: string; label: string; modules: string[] }[] = [
  { key: "master", label: "Master Data", modules: ["Chart of Accounts", "Customers", "Vendors", "Banks", "Items / Products", "Inventory Locations", "Employees", "Regions", "Jobs / Projects", "Opening Balances", "Import Charge Templates", "Units of Measure"] },
  { key: "transactions", label: "Transactions", modules: ["Purchase Order", "Goods Receipt (GRN)", "Purchase Invoice", "Purchase Return", "Quotation", "Sale Order", "Delivery Challan", "Sale Invoice", "Sale Return", "Cash / Bank Receipt", "Cash / Bank Payment", "General Journal"] },
  { key: "store", label: "Store", modules: ["Purchase Requisition", "Inward Gate Pass", "Outward Gate Pass", "Bill of Materials", "Production Order", "Add Stock", "Reduce Stock", "Stock Transfer"] },
  { key: "salary", label: "Salary", modules: ["Salary Staff", "Advance", "Loan", "Payroll Run", "Final Settlement"] },
  { key: "assets", label: "Fixed Assets", modules: ["Asset Register", "Asset Categories", "Depreciation Run", "Asset Disposal"] },
  { key: "whatsapp", label: "WhatsApp", modules: ["Send Messages", "Message Templates", "Auto Notifications"] },
  { key: "reports", label: "Reports", modules: ["Financial Reports", "Sale Reports", "Purchase Reports", "Inventory Reports", "Salary Reports", "Fixed Asset Reports"] },
  { key: "settings", label: "Settings", modules: ["My Company", "Users & Roles", "Financial Year", "Document Settings", "Backup"] },
  { key: "widgets", label: "Dashboard Widgets", modules: ["Business Health", "Sales Intelligence", "Inventory Intelligence", "Cash Flow", "Decision Support", "Operational Metrics"] },
];

type Perm = { view?: boolean; edit?: boolean; delete?: boolean };
type Permissions = Record<string, Record<string, Perm>>;

const DEFAULT_ROLES = [
  { name: "Admin", description: "Full access to all company modules and user management", system: true },
  { name: "Accountant", description: "Access to financial and accounting modules" },
  { name: "Cashier", description: "POS counter sale access only" },
  { name: "Sales", description: "Access to sales and customer modules" },
  { name: "Store Keeper", description: "Access to inventory and store modules" },
  { name: "Viewer", description: "Read-only access to all modules" },
];

export default function UsersRoles() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [users, setUsers] = useState<Doc[]>([]);
  const [roles, setRoles] = useState<Doc[]>([]);
  const [userModal, setUserModal] = useState<UserModalState>({ open: false, editing: null });
  const [roleModal, setRoleModal] = useState<RoleModalState>({ open: false, editing: null });
  const [userDelete, setUserDelete] = useState<Doc | null>(null);
  const [roleDelete, setRoleDelete] = useState<Doc | null>(null);

  const loadUsers = useCallback(async () => setUsers(await listDocs("users")), []);
  const loadRoles = useCallback(async () => {
    let r = await listDocs("roles");
    if (r.length === 0) {
      // seed default roles on first run
      for (const dr of DEFAULT_ROLES) await createDoc("roles", { ...dr, permissions: {} });
      r = await listDocs("roles");
    }
    setRoles(r);
  }, []);

  useEffect(() => { loadUsers().catch(() => {}); loadRoles().catch(() => {}); }, [loadUsers, loadRoles]);

  const usersByRole = (roleName: string) => users.filter((u) => u.role === roleName).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Users &amp; Roles</h2>
          <p className="text-sm text-muted-foreground">Manage team members and their permissions in this company.</p>
        </div>
        <HeaderActions tab={tab} onAddUser={() => setUserModal({ open: true, editing: null })}
          onRepair={async () => {
            for (const dr of DEFAULT_ROLES) {
              if (!roles.some((r) => r.name === dr.name)) await createDoc("roles", { ...dr, permissions: {} });
            }
            await loadRoles();
            toast({ title: "Permissions repaired", description: "Default roles restored.", type: "success" });
          }}
          onCreateRole={() => setRoleModal({ open: true, editing: null })}
        />
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl border bg-card p-1 card-shadow">
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={<UsersIcon className="h-4 w-4" />}>Users ({users.length})</TabBtn>
        <TabBtn active={tab === "roles"} onClick={() => setTab("roles")} icon={<Shield className="h-4 w-4" />}>Roles ({roles.length})</TabBtn>
      </div>

      {tab === "users" ? (
        <UsersTable users={users} onEdit={(u) => setUserModal({ open: true, editing: u })} onDelete={(u) => setUserDelete(u)} />
      ) : (
        <RolesTable roles={roles} usersByRole={usersByRole} onEdit={(r) => setRoleModal({ open: true, editing: r })} onDelete={(r) => setRoleDelete(r)} />
      )}

      {/* Modals */}
      <UserModal
        state={userModal} roles={roles}
        onClose={() => setUserModal({ open: false, editing: null })}
        onSaved={async () => { await loadUsers(); setUserModal({ open: false, editing: null }); }}
      />
      <RoleModal
        state={roleModal}
        onClose={() => setRoleModal({ open: false, editing: null })}
        onSaved={async () => { await loadRoles(); setRoleModal({ open: false, editing: null }); }}
      />

      <ConfirmDialog open={!!userDelete} onOpenChange={(v) => !v && setUserDelete(null)}
        title="Delete user?" description={`"${userDelete?.name}" will lose access. This cannot be undone.`}
        confirmLabel="Delete user"
        onConfirm={async () => { await deleteDocById("users", userDelete!.id); await loadUsers(); toast({ title: "User deleted", type: "success" }); }}
      />
      <ConfirmDialog open={!!roleDelete} onOpenChange={(v) => !v && setRoleDelete(null)}
        title="Delete role?" description={`The "${roleDelete?.name}" role will be removed.`}
        confirmLabel="Delete role"
        onConfirm={async () => { await deleteDocById("roles", roleDelete!.id); await loadRoles(); toast({ title: "Role deleted", type: "success" }); }}
      />
    </div>
  );
}

function HeaderActions({ tab, onAddUser, onRepair, onCreateRole }: {
  tab: "users" | "roles"; onAddUser: () => void; onRepair: () => Promise<void>; onCreateRole: () => void;
}) {
  const [repairing, setRepairing] = useState(false);
  if (tab === "users") {
    return <Button className="w-full sm:w-auto" onClick={onAddUser}><UserPlus className="h-4 w-4" /> Add User</Button>;
  }
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Button variant="secondary" className="flex-1 sm:flex-none" disabled={repairing} onClick={async () => { setRepairing(true); try { await onRepair(); } finally { setRepairing(false); } }}>
        {repairing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />} Repair Permissions
      </Button>
      <Button className="flex-1 sm:flex-none" onClick={onCreateRole}><Plus className="h-4 w-4" /> Create Role</Button>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    )}>{icon}{children}</button>
  );
}

function UsersTable({ users, onEdit, onDelete }: { users: Doc[]; onEdit: (u: Doc) => void; onDelete: (u: Doc) => void }) {
  return (
    <div className="rounded-2xl border bg-card card-shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No users yet. Click “Add User”.</TableCell></TableRow>
          ) : users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                    {(u.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell><Badge variant="secondary">{u.role || "—"}</Badge></TableCell>
              <TableCell><Badge variant={u.status === "Disabled" ? "destructive" : "success"}>{u.status || "Active"}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.lastLogin ? formatDate(u.lastLogin) : "—"}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(u)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RolesTable({ roles, usersByRole, onEdit, onDelete }: {
  roles: Doc[]; usersByRole: (n: string) => number; onEdit: (r: Doc) => void; onDelete: (r: Doc) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card card-shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead><TableHead>Description</TableHead>
            <TableHead>Users</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="flex items-center gap-2 font-semibold">
                  {r.name}
                  {r.system && <Badge variant="warning" className="text-[10px]">SYSTEM</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.description}</TableCell>
              <TableCell><Badge variant="success">{usersByRole(r.name)} users</Badge></TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  {!r.system && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── User modal ────────────────────────────────────────────────
type UserModalState = { open: boolean; editing: Doc | null };
function UserModal({ state, roles, onClose, onSaved }: {
  state: UserModalState; roles: Doc[]; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (state.open) setForm(state.editing ? { ...state.editing } : { status: "Active" }); }, [state]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name || "", email: form.email || "", role: form.role || "", status: form.status || "Active" };
      if (state.editing) await updateDocById("users", state.editing.id, payload);
      else await createDoc("users", payload);
      toast({ title: state.editing ? "User updated" : "User added", type: "success" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err?.message, type: "error" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{state.editing ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Full Name *</Label><Input required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" required value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role ?? ""} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue placeholder="Select role…" /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status ?? "Active"} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Disabled">Disabled</SelectItem></SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{state.editing ? "Save changes" : "Add User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Role modal with permission matrix ─────────────────────────
type RoleModalState = { open: boolean; editing: Doc | null };
function RoleModal({ state, onClose, onSaved }: { state: RoleModalState; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [perms, setPerms] = useState<Permissions>({});
  const [activeTab, setActiveTab] = useState(PERMISSION_TABS[0].key);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.open) {
      setName(state.editing?.name ?? "");
      setDescription(state.editing?.description ?? "");
      setPerms(state.editing?.permissions ?? {});
      setActiveTab(PERMISSION_TABS[0].key);
    }
  }, [state]);

  const current = PERMISSION_TABS.find((t) => t.key === activeTab)!;
  const get = (m: string, a: keyof Perm) => !!perms[activeTab]?.[m]?.[a];
  const toggle = (m: string, a: keyof Perm) =>
    setPerms((p) => ({ ...p, [activeTab]: { ...p[activeTab], [m]: { ...p[activeTab]?.[m], [a]: !p[activeTab]?.[m]?.[a] } } }));

  const allOn = current.modules.every((m) => get(m, "view") && get(m, "edit") && get(m, "delete"));
  const toggleAll = () => setPerms((p) => ({
    ...p,
    [activeTab]: Object.fromEntries(current.modules.map((m) => [m, { view: !allOn, edit: !allOn, delete: !allOn }])),
  }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, description, permissions: perms };
      if (state.editing) await updateDocById("roles", state.editing.id, payload);
      else await createDoc("roles", { ...payload, system: false });
      toast({ title: state.editing ? "Role updated" : "Role created", type: "success" });
      onSaved();
    } catch (err: any) { toast({ title: "Save failed", description: err?.message, type: "error" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{state.editing ? `Edit Role — ${state.editing.name}` : "Create Role"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Role Name *</Label><Input required placeholder="e.g., Sales Manager" value={name} onChange={(e) => setName(e.target.value)} disabled={state.editing?.system} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input placeholder="Brief description of this role" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>

          {/* Permission tabs */}
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted p-1.5">
            {PERMISSION_TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeTab === t.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{current.label} Permissions</p>
            <button type="button" onClick={toggleAll} className="text-sm font-semibold text-primary hover:underline">
              {allOn ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="max-h-[42vh] overflow-y-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 text-left">Module</th>
                  <th className="p-3 text-center w-24">View</th>
                  <th className="p-3 text-center w-24">Edit</th>
                  <th className="p-3 text-center w-24">Delete</th>
                </tr>
              </thead>
              <tbody>
                {current.modules.map((m) => (
                  <tr key={m} className="border-t">
                    <td className="p-3 font-medium">{m}</td>
                    {(["view", "edit", "delete"] as (keyof Perm)[]).map((a) => (
                      <td key={a} className="p-3 text-center">
                        <input type="checkbox" checked={get(m, a)} onChange={() => toggle(m, a)}
                          className="h-4 w-4 cursor-pointer accent-primary" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}><X className="h-4 w-4" /> Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{state.editing ? "Save Role" : "Create Role"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
