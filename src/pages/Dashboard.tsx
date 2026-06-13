import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Wallet, TrendingUp, ArrowUpRight, Sparkles, Plus, ShoppingCart, FileText, Download,
  UserPlus, Building2, Package, Briefcase, FileSpreadsheet, Receipt, Banknote, BookOpen,
  Activity, Heart, BarChart3, Boxes, ExternalLink, AlertTriangle, Lightbulb, Gauge as GaugeIcon,
  CheckCircle2, Star, ChevronRight,
} from "lucide-react";
import { Gauge, Meter, MiniGauge, StatBar, SectionCard } from "@/components/dashboard/widgets";
import { exportToCsv } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

const flowData = [
  { name: "Opening", inflow: 0, balance: 0 },
  { name: "Week 1", inflow: 0, balance: 0 },
  { name: "Week 2", inflow: 0, balance: 0 },
  { name: "Closing", inflow: 0, balance: 0 },
];

const quickActions = [
  { label: "Add Customer", icon: UserPlus, to: "/master/customers" },
  { label: "Add Vendor", icon: Building2, to: "/master/vendors" },
  { label: "Add Item", icon: Package, to: "/master/chart-of-inventory" },
  { label: "Add Employee", icon: Briefcase, to: "/master/employees" },
  { label: "Purchase Invoice", icon: FileSpreadsheet, to: "/purchases/purchase-invoice" },
  { label: "Sale Invoice", icon: FileText, to: "/sales/sale-invoice" },
  { label: "Quotation", icon: FileText, to: "/sales/quotation" },
  { label: "Purchase Order", icon: ShoppingCart, to: "/purchases/purchase-order" },
  { label: "Cash Receipt", icon: Receipt, to: "/receipts/cash-receipt" },
  { label: "Cash Payment", icon: Banknote, to: "/payments/cash-payment" },
  { label: "Journal Voucher", icon: BookOpen, to: "/journal/general" },
  { label: "Chart of Accounts", icon: BarChart3, to: "/master/chart-of-accounts" },
];

const funnel = [
  { stage: "Quotations", count: 0 },
  { stage: "Accepted", count: 0 },
  { stage: "Sale Orders", count: 0 },
  { stage: "Approved", count: 0 },
  { stage: "Invoiced", count: 0 },
];

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 24" className="h-6 w-full" preserveAspectRatio="none">
      <path d="M0 18 L20 14 L40 16 L60 8 L80 12 L100 6" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function KpiCard({ icon, label, value, color, spark }: any) {
  return (
    <div className="rounded-xl border bg-card p-5 card-shadow">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${color}1a`, color }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2"><Sparkline color={color} /></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#066a97] text-white card-shadow-lg">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-3xl font-extrabold tabular-nums">
                {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-sm text-white/80">
                {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="mt-1 text-sm font-medium">{greeting}, {user?.name ?? "there"}!</div>
            </div>
            <div className="hidden items-center gap-3 border-l border-white/20 pl-6 sm:flex">
              <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-white/30 text-lg font-extrabold">35</div>
              <div>
                <div className="text-xs text-white/70">Business Health</div>
                <div className="font-bold">Needs Attention</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="bg-white text-primary hover:bg-white/90">
              <Link to="/sales/sale-invoice"><Plus className="h-4 w-4" /> New Sale</Link>
            </Button>
            <Button asChild size="sm" className="bg-white/15 text-white hover:bg-white/25">
              <Link to="/purchases/purchase-invoice"><ShoppingCart className="h-4 w-4" /> Purchase</Link>
            </Button>
            <Button asChild size="sm" className="bg-white/15 text-white hover:bg-white/25">
              <Link to="/reports/profit-loss"><FileText className="h-4 w-4" /> Reports</Link>
            </Button>
            <Button
              size="sm" className="bg-white/15 text-white hover:bg-white/25"
              onClick={() => exportToCsv("dashboard-summary", [
                { Metric: "Cash & Bank", Value: 0 },
                { Metric: "Receivable", Value: 0 },
                { Metric: "Payable", Value: 0 },
                { Metric: "Business Health", Value: 35 },
              ])}
            ><Download className="h-4 w-4" /> Export</Button>
          </div>
        </div>
      </div>

      {/* KPIs + sidebars row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard icon={<Wallet className="h-5 w-5" />} label="Cash & Bank" value={formatCurrency(0)} color="#2563eb" />
            <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Receivable" value={formatCurrency(0)} color="#f59e0b" />
            <KpiCard icon={<ArrowUpRight className="h-5 w-5" />} label="Payable" value={formatCurrency(0)} color="#8b5cf6" />
          </div>

          {/* Activity feed */}
          <SectionCard
            title="Activity Feed" subtitle="Recent transactions and system activities" icon={<Activity className="h-4 w-4 text-primary" />}
            action={<Button asChild variant="outline" size="sm"><Link to="/reports/journal">View More <ExternalLink className="h-3.5 w-3.5" /></Link></Button>}
          >
            <Tabs defaultValue="tx">
              <TabsList>
                <TabsTrigger value="tx">Transactions</TabsTrigger>
                <TabsTrigger value="act">Activities</TabsTrigger>
                <TabsTrigger value="users">Active Users</TabsTrigger>
              </TabsList>
              <TabsContent value="tx"><EmptyFeed text="No recent transactions yet." /></TabsContent>
              <TabsContent value="act"><EmptyFeed text="No activities recorded." /></TabsContent>
              <TabsContent value="users"><EmptyFeed text="No active users right now." /></TabsContent>
            </Tabs>
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <SectionCard title="What's New" icon={<Sparkles className="h-4 w-4 text-primary" />}>
            <p className="py-4 text-center text-sm text-muted-foreground">✨ You're all caught up.</p>
          </SectionCard>
          <SectionCard title="Quick Actions" icon={<Sparkles className="h-4 w-4 text-amber-500" />}>
            <div className="space-y-0.5">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.to} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted">
                  <span className="flex items-center gap-3"><a.icon className="h-4 w-4 text-muted-foreground" /> {a.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Business Health + Sales Intelligence */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Business Health" icon={<Heart className="h-4 w-4 text-primary" />}
          subtitle="Live from your Chart of Accounts — updated with every posted transaction"
          action={<Button asChild variant="outline" size="sm"><Link to="/reports/financial-health">View More</Link></Button>}
        >
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-4">
              <Gauge value={35} size={96} sublabel="out of 100" />
              <div className="flex-1 space-y-2">
                <div className="text-sm font-bold text-destructive">At Risk</div>
                <Meter label="Liquidity" value={0} color="hsl(0 72% 51%)" />
                <Meter label="Profitability" value={0} color="hsl(0 72% 51%)" />
                <Meter label="Solvency" value={100} />
                <Meter label="Cash Flow" value={50} color="hsl(142 71% 45%)" />
                <Meter label="AR Efficiency" value={50} color="hsl(38 92% 50%)" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniGauge value="0.00" target="1.50" title="Current Ratio" subtitle="Liquidity measure" />
            <MiniGauge value="0.00" target="1.00" title="Quick Ratio" subtitle="Acid-test ratio" />
            <MiniGauge value="0.00" target="1.00" title="Debt to Equity" subtitle="Leverage ratio" ok />
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-sm font-semibold">📊 Profit Margins</p>
            <StatBar label="Gross Margin" value={0} />
            <StatBar label="Operating Margin" value={0} />
            <StatBar label="Net Margin" value={0} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">💰 Working Capital</p>
            <div className="rounded-xl bg-gradient-to-r from-primary to-[#066a97] p-5 text-white">
              <div className="text-2xl font-extrabold">{formatCurrency(0)}</div>
              <div className="text-xs text-white/80">{formatCurrency(0)} vs previous month</div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border-l-4 border-destructive bg-destructive/5 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span><strong>LIQUIDITY RISK</strong> — current ratio 0.00 below 1.0. Short-term obligations exceed current assets.</span>
          </div>
        </SectionCard>

        <SectionCard
          title="Sales Intelligence" icon={<TrendingUp className="h-4 w-4 text-primary" />}
          subtitle="Sales pipeline and performance analysis"
          action={<Button asChild variant="outline" size="sm"><Link to="/reports/sales-intelligence">View More</Link></Button>}
        >
          <Tabs defaultValue="funnel">
            <TabsList>
              <TabsTrigger value="funnel">Funnel</TabsTrigger>
              <TabsTrigger value="regions">Regions</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>
            <TabsContent value="funnel">
              <div className="space-y-2">
                {funnel.map((f) => (
                  <div key={f.stage} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <span className="text-sm font-medium">{f.stage}</span>
                    <span className="text-sm font-bold">{f.count}</span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(0)}</span>
                    <span className="text-xs text-muted-foreground">0.0%</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="regions"><EmptyFeed text="No regional data yet." /></TabsContent>
            <TabsContent value="products"><EmptyFeed text="No product data yet." /></TabsContent>
            <TabsContent value="customers"><EmptyFeed text="No customer data yet." /></TabsContent>
          </Tabs>
        </SectionCard>
      </div>

      {/* Inventory + Cash flow */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Inventory Intelligence" icon={<Boxes className="h-4 w-4 text-primary" />}
          subtitle="Stock levels, alerts, and optimization"
          action={<Button asChild variant="outline" size="sm"><Link to="/reports/inventory-intelligence">View More</Link></Button>}
        >
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="loc">Locations</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="mb-2 text-sm font-semibold">Stock Levels by Category</p>
              <EmptyFeed text="No Data" />
              <p className="mb-2 mt-4 text-sm font-semibold">Inventory Aging</p>
              <div className="space-y-2">
                {["0-30 days", "31-60 days", "61-90 days", "90+ days"].map((d, i) => (
                  <StatBar key={d} label={d} value={0} color={["#22c55e", "#f59e0b", "#ef4444", "#b91c1c"][i]} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="alerts"><EmptyFeed text="No low-stock alerts." /></TabsContent>
            <TabsContent value="loc"><EmptyFeed text="No locations configured." /></TabsContent>
          </Tabs>
        </SectionCard>

        <SectionCard
          title="Cash Flow Management" icon={<Banknote className="h-4 w-4 text-primary" />}
          subtitle="Track inflows, outflows, and projections"
          action={<Button asChild variant="outline" size="sm"><Link to="/reports/cash-flow-management">View More</Link></Button>}
        >
          <Tabs defaultValue="flow">
            <TabsList>
              <TabsTrigger value="flow">Flow</TabsTrigger>
              <TabsTrigger value="pay">Payables</TabsTrigger>
              <TabsTrigger value="rec">Receivables</TabsTrigger>
              <TabsTrigger value="fc">Forecast</TabsTrigger>
            </TabsList>
            <TabsContent value="flow">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(198 90% 41%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(198 90% 41%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 13% 91%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="balance" stroke="hsl(198 90% 41%)" fill="url(#g)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">⊕ Total Inflow</div>
                  <div className="text-lg font-bold text-success">{formatCurrency(0)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">⊖ Total Outflow</div>
                  <div className="text-lg font-bold text-destructive">{formatCurrency(0)}</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pay"><EmptyFeed text="No payables data." /></TabsContent>
            <TabsContent value="rec"><EmptyFeed text="No receivables data." /></TabsContent>
            <TabsContent value="fc"><EmptyFeed text="No forecast available." /></TabsContent>
          </Tabs>
        </SectionCard>
      </div>

      {/* Decision support + Operational metrics */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Decision Support" icon={<Lightbulb className="h-4 w-4 text-primary" />}
          subtitle="AI-powered insights and action items"
          action={<Button asChild variant="outline" size="sm"><Link to="/reports/financial-health">View More</Link></Button>}
        >
          <Tabs defaultValue="insights">
            <TabsList>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="insights">
              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="font-semibold">Review Pricing Strategy</div>
                      <div className="text-xs text-success">Opportunity</div>
                    </div>
                  </div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">MEDIUM</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Analyze product margins and consider adjusting prices for low-margin items.
                </p>
                <div className="mt-2 text-xs font-medium text-primary">↗ Improve profitability</div>
              </div>
            </TabsContent>
            <TabsContent value="actions"><EmptyFeed text="No pending actions." /></TabsContent>
            <TabsContent value="approvals"><EmptyFeed text="No approvals waiting." /></TabsContent>
            <TabsContent value="alerts"><EmptyFeed text="No alerts." /></TabsContent>
          </Tabs>
        </SectionCard>

        <SectionCard
          title="Operational Metrics" icon={<GaugeIcon className="h-4 w-4 text-primary" />}
          subtitle="Performance and efficiency indicators"
          action={<Button asChild variant="outline" size="sm"><Link to="/reports/operational-metrics">View More</Link></Button>}
        >
          <div className="grid grid-cols-2 gap-3">
            <MetricTile icon={<CheckCircle2 className="h-4 w-4 text-success" />} label="Order Fulfillment" value="0.0%" note="Target: 95.0%" />
            <MetricTile icon={<Activity className="h-4 w-4 text-primary" />} label="Avg Delivery Time" value="3 days" note="SLA: 4 days" />
            <MetricTile icon={<ArrowUpRight className="h-4 w-4 text-amber-500" />} label="Return Rate" value="0.0%" note="Improving" />
            <MetricTile icon={<Star className="h-4 w-4 text-amber-400" />} label="Customer Satisfaction" value="4 / 5" note="NPS: 60" />
          </div>
          <p className="mb-2 mt-5 text-sm font-semibold">Delivery Time Distribution</p>
          <div className="grid grid-cols-4 gap-2">
            {[{ l: "1-2 days", v: 35, c: "#22c55e" }, { l: "2-3 days", v: 40, c: "#16a34a" }, { l: "3-4 days", v: 18, c: "#06b6d4" }, { l: "4+ days", v: 7, c: "#f59e0b" }].map((b) => (
              <div key={b.l} className="text-center">
                <div className="flex h-20 items-end justify-center">
                  <div className="w-8 rounded-t" style={{ height: `${b.v * 2}%`, background: b.c }} />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{b.l}</div>
                <div className="text-xs font-semibold">{b.v}%</div>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-5 text-sm font-semibold">Rating Distribution</p>
          <div className="space-y-1.5">
            {[{ s: 5, v: 40 }, { s: 4, v: 30 }, { s: 3, v: 20 }, { s: 2, v: 7 }, { s: 1, v: 3 }].map((r) => (
              <div key={r.s} className="flex items-center gap-2 text-xs">
                <span className="w-6">{r.s}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${r.v}%` }} />
                </div>
                <span className="w-8 text-right">{r.v}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function EmptyFeed({ text }: { text: string }) {
  return <div className="grid h-32 place-items-center text-sm text-muted-foreground">{text}</div>;
}

function MetricTile({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}
