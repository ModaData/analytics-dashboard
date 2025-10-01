import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DenimSupplierWizard.tsx
 * One-file, dependency-free React component for denim supplier onboarding (engineer-facing).
 * - No Tailwind, no external libs
 * - Sequential flow with concealed advanced UI
 * - Autosave + JSON export
 */

type StepKey =
  | "warp"
  | "indigo"
  | "shade"
  | "etp"
  | "footprints"
  | "safety"
  | "handover";

const STEPS: { key: StepKey; label: string; icon: string }[] = [
  { key: "warp", label: "Warp & Range", icon: "🧵" },
  { key: "indigo", label: "Indigo & Sizing", icon: "🧪" },
  { key: "shade", label: "Shade & Finish", icon: "🎨" },
  { key: "etp", label: "Effluent / ETP", icon: "💧" },
  { key: "footprints", label: "Footprints", icon: "🌍" },
  { key: "safety", label: "Safety", icon: "🛡️" },
  { key: "handover", label: "Handover", icon: "📄" }
];

type WizardState = {
  warp_range: {
    mode?: "rope" | "slasher";
    inline_mercerize?: boolean;
    box_oxidation?: string;
    ropes?: number;
    ends_per_rope?: number;
    speed_mpm?: number;
    immersion_s?: number;
  };
  indigo_control: {
    reduction?: "Hydrosulfite" | "Electrochemical" | "Bioreduction" | "Mixed";
    ph_window?: "10.0–10.4" | "10.5–11.5" | "11.6–12.0";
    orp_logging?: "Inline" | "ORP+Lab" | "Lab only";
    size_pickup?: "9–10%" | "10–12%" | "Other";
    notes?: string;
  };
  shade_finish: {
    stack?:
      | "Indigo only"
      | "Indigo + sulphur top"
      | "Sulphur bottom + indigo"
      | "Sandwich"
      | "Overdye";
    handle_goal?: "Flat" | "Soft" | "Unwashed stiff";
    desize?: "Enzymatic" | "Oxidative" | "Acid" | "Water only";
    options?: string[]; // Tinted effects, Anti-backstain, Heat-set elastane, Mercerize
  };
  etp: {
    blocks?: string[]; // Physical, Chemical, Biological, Tertiary (UF/RO), ZLD
    logs?: string[]; // pH, EC, COD, BOD, TDS, TSS
    color_removal?: string[]; // Ozone, Electrolysis, Photocatalysis, Sonolysis, Radiolysis, UF reuse
    point_recovery?: string[]; // Caustic (mercerizer), etc.
  };
  footprints: {
    water_boundary?: "Process only" | "Full (green/blue/grey)" | "In development";
    unit?: "m³/ton" | "L/kg" | "gal/lb";
    carbon_boundary?: "7 systems (Levi’s)" | "Cradle-to-gate" | "Other";
    energy_mix_grid_pct?: number;
    energy_mix_thermal_pct?: number;
    intensity_unit?: "kWh/kg" | "MJ/piece";
    intensity_value?: number;
    consumer_region?: string;
  };
  safety: {
    controls?: string[]; // Hydro storage vent, ORP/pH interlocks, Ozone off-gas, Enzyme dust containment, Laser guarding
    sanforize_chain?: "Sanforize + Palmer" | "Rubber-belt only" | "Other";
  };
  handover: {
    items?: string[]; // flow diagrams, logs, hydrosulfite usage, etc
  };
};

const DEFAULT_STATE: WizardState = {
  warp_range: {},
  indigo_control: {},
  shade_finish: {},
  etp: {},
  footprints: {},
  safety: {},
  handover: {}
};

export default function DenimSupplierWizard() {
  const [step, setStep] = useState<StepKey>("warp");
  const [state, setState] = useState<WizardState>(() => {
    try {
      const raw = localStorage.getItem("denimWizard");
      return raw ? (JSON.parse(raw) as WizardState) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const paletteRef = useRef<HTMLDialogElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<number | null>(null);

  // Autosave debounced
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem("denimWizard", JSON.stringify(state));
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const within = containerRef.current?.contains(target);
      if (!within) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        paletteRef.current?.showModal();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        localStorage.setItem("denimWizard", JSON.stringify(state));
      }
      if (e.key === "Escape") {
        setAdvancedOpen(false);
        setOpenAccordion(null);
        setWhyOpen(false);
      }
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const idx = STEPS.findIndex((s) => s.key === step);
        if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
      }
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const idx = STEPS.findIndex((s) => s.key === step);
        if (idx > 0) setStep(STEPS[idx - 1].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown, onKey");
  }, [step, state]);

  const onSelect = (path: string, value: any) => {
    setState((prev) => setAt(prev, path, value));
  };

  const next = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };
  const back = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "denim_onboarding.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={containerRef} style={styles.app}>
      <style>{baseCSS}</style>

      {/* Top bar */}
      <header style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <span style={styles.title}>
            {STEPS.find((s) => s.key === step)?.label}
          </span>
          <span style={styles.subtle}>
            • Step {STEPS.findIndex((s) => s.key === step) + 1} of {STEPS.length}
          </span>
        </div>
        <div style={styles.topbarRight}>
          <button
            className="btn"
            onClick={() => setAdvancedOpen(true)}
            title="Advanced (drawer)"
          >
            Advanced
          </button>
          <button className="btn btnPrimary" onClick={downloadJSON}>
            Download JSON
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Left rail */}
        <nav style={styles.rail}>
          {STEPS.map((s) => (
            <button
              key={s.key}
              title={s.label}
              onClick={() => setStep(s.key)}
              className={`railBtn ${step === s.key ? "railBtnActive" : ""}`}
            >
              <span aria-hidden>{s.icon}</span>
            </button>
          ))}
        </nav>

        {/* Main panel */}
        <main style={styles.main}>
          <section className="card">
            <StepContent
              step={step}
              state={state}
              onSelect={onSelect}
              whyOpen={whyOpen}
              setWhyOpen={setWhyOpen}
              openAccordion={openAccordion}
              setOpenAccordion={setOpenAccordion}
            />
          </section>

          {/* Step controls */}
          <div style={styles.navRow}>
            <button className="btn" onClick={back}>
              Back
            </button>
            <button className="btn btnPrimary" onClick={next}>
              Next
            </button>
          </div>
        </main>
      </div>

      {/* Advanced Drawer */}
      {advancedOpen && (
        <div className="drawerBackdrop" onClick={() => setAdvancedOpen(false)}>
          <aside
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Advanced"
          >
            <div style={styles.drawerHeader}>
              <strong>Advanced • {STEPS.find((s) => s.key === step)?.label}</strong>
              <button className="btn" onClick={() => setAdvancedOpen(false)}>
                Close
              </button>
            </div>
            <AdvancedPanel step={step} state={state} onSelect={onSelect} />
          </aside>
        </div>
      )}

      {/* Command Palette */}
      <dialog ref={paletteRef} className="palette">
        <div className="paletteInner">
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            Jump to step (Enter to go)
          </div>
          {STEPS.map((s) => (
            <button
              key={s.key}
              className="paletteItem"
              onClick={() => {
                setStep(s.key);
                paletteRef.current?.close();
              }}
            >
              <span style={{ marginRight: 8 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => paletteRef.current?.close()}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

/* ---------- Step Content ---------- */

function StepContent(props: {
  step: StepKey;
  state: WizardState;
  onSelect: (path: string, value: any) => void;
  whyOpen: boolean;
  setWhyOpen: (v: boolean) => void;
  openAccordion: string | null;
  setOpenAccordion: (k: string | null) => void;
}) {
  const {
    step,
    state,
    onSelect,
    whyOpen,
    setWhyOpen,
    openAccordion,
    setOpenAccordion
  } = props;

  if (step === "warp") {
    return (
      <>
        <H3> Dyeing configuration </H3>
        <OptionGrid
          options={[
            {
              id: "rope",
              title: "Rope",
              subtitle: "ball warp → rope dye → open → size",
              svg: ropeSVG
            },
            {
              id: "slasher",
              title: "Slasher/Sheet",
              subtitle: "prewet → dye → size (one pass)",
              svg: slasherSVG
            }
          ]}
          value={state.warp_range.mode}
          onChange={(v) => onSelect("warp_range.mode", v as any)}
        />

        <Row>
          <Toggle
            label="Mercerize inline?"
            checked={!!state.warp_range.inline_mercerize}
            onChange={(v) => onSelect("warp_range.inline_mercerize", v)}
          />
          <Select
            label="Boxes / Oxidations"
            options={["4–6 / 3", "6–8 / 4–5", "8–12 / 6–8", "Other"]}
            value={state.warp_range.box_oxidation || ""}
            onChange={(v) => onSelect("warp_range.box_oxidation", v)}
          />
        </Row>

        <Accordion
          title="Show lab knobs"
          open={openAccordion === "warp"}
          onToggle={() =>
            setOpenAccordion(openAccordion === "warp" ? null : "warp")
          }
        >
          <Field
            label="Ropes per run"
            type="number"
            placeholder="24"
            value={numOrEmpty(state.warp_range.ropes)}
            onChange={(v) => onSelect("warp_range.ropes", toNum(v))}
          />
          <Field
            label="Ends per rope"
            type="number"
            placeholder="380"
            value={numOrEmpty(state.warp_range.ends_per_rope)}
            onChange={(v) => onSelect("warp_range.ends_per_rope", toNum(v))}
          />
          <Field
            label="Line speed (m/min)"
            type="number"
            placeholder="30"
            value={numOrEmpty(state.warp_range.speed_mpm)}
            onChange={(v) => onSelect("warp_range.speed_mpm", toNum(v))}
          />
          <Field
            label="Immersion (s)"
            type="number"
            placeholder="25"
            value={numOrEmpty(state.warp_range.immersion_s)}
            onChange={(v) => onSelect("warp_range.immersion_s", toNum(v))}
          />
        </Accordion>

        <Why
          open={whyOpen}
          onToggle={() => setWhyOpen(!whyOpen)}
          text="Rope vs slasher changes squeeze uniformity, shade build and reproducibility; slasher often integrates quick oxidation + sizing, sometimes mercerization."
        />
      </>
    );
  }

  if (step === "indigo") {
    return (
      <>
        <H3> Indigo reduction & sizing </H3>
        <Select
          label="Reducing system"
          options={["Hydrosulfite", "Electrochemical", "Bioreduction", "Mixed"]}
          value={state.indigo_control.reduction || ""}
          onChange={(v) =>
            onSelect("indigo_control.reduction", v as WizardState["indigo_control"]["reduction"])
          }
        />
        <Select
          label="pH window"
          options={["10.0–10.4", "10.5–11.5 (mono-enolate)", "11.6–12.0"]}
          value={state.indigo_control.ph_window || ""}
          onChange={(v) => onSelect("indigo_control.ph_window", mapPh(v))}
        />
        <Select
          label="Redox monitoring"
          options={["Inline", "ORP+Lab", "Lab only"]}
          value={state.indigo_control.orp_logging || ""}
          onChange={(v) =>
            onSelect("indigo_control.orp_logging", v as any)
          }
        />
        <Select
          label="Warp size add-on"
          options={["9–10%", "10–12%", "Other"]}
          value={state.indigo_control.size_pickup || ""}
          onChange={(v) => onSelect("indigo_control.size_pickup", v as any)}
        />

        <Accordion
          title="Show lab knobs"
          open={openAccordion === "indigo"}
          onToggle={() =>
            setOpenAccordion(openAccordion === "indigo" ? null : "indigo")
          }
        >
          <Field
            label="Stock-vat / recipe notes"
            placeholder="NaOH, Na2S2O4, wetting, temp/time…"
            value={state.indigo_control.notes || ""}
            onChange={(v) => onSelect("indigo_control.notes", v)}
          />
        </Accordion>

        <Why
          open={whyOpen}
          onToggle={() => setWhyOpen(!whyOpen)}
          text="Colour yield correlates with the mono-enolate fraction (peak ~pH 10.5–11.5). Inline ORP logging improves reproducibility and indigo economy. Typical size pickup ~9–10% for warp denim."
        />
      </>
    );
  }

  if (step === "shade") {
    return (
      <>
        <H3> Shade engineering & handle </H3>
        <Select
          label="Shade build"
          options={[
            "Indigo only",
            "Indigo + sulphur top",
            "Sulphur bottom + indigo",
            "Sandwich",
            "Overdye"
          ]}
          value={state.shade_finish.stack || ""}
          onChange={(v) => onSelect("shade_finish.stack", v as any)}
        />
        <Select
          label="Handle goal"
          options={["Flat", "Soft", "Unwashed stiff"]}
          value={state.shade_finish.handle_goal || ""}
          onChange={(v) => onSelect("shade_finish.handle_goal", v as any)}
        />

        <Accordion
          title="Show lab knobs"
          open={openAccordion === "shade"}
          onToggle={() =>
            setOpenAccordion(openAccordion === "shade" ? null : "shade")
          }
        >
          <Select
            label="Desize route"
            options={["Enzymatic", "Oxidative", "Acid", "Water only"]}
            value={state.shade_finish.desize || ""}
            onChange={(v) => onSelect("shade_finish.desize", v as any)}
          />
          <Checkset
            label="Options"
            options={[
              "Tinted effects",
              "Anti-backstain",
              "Heat-set elastane",
              "Mercerize"
            ]}
            values={state.shade_finish.options || []}
            onChange={(vals) => onSelect("shade_finish.options", vals)}
          />
        </Accordion>

        <Why
          open={whyOpen}
          onToggle={() => setWhyOpen(!whyOpen)}
          text="Desize/wash choices shape hand and downstream wash loads; mercerize + heat-set support flat-look aesthetics and elastane stability."
        />
      </>
    );
  }

  if (step === "etp") {
    return (
      <>
        <H3> Effluent treatment (ETP) </H3>
        <Checkset
          label="ETP blocks"
          options={[
            "Physical",
            "Chemical",
            "Biological",
            "Tertiary (UF/RO)",
            "ZLD"
          ]}
          values={state.etp.blocks || []}
          onChange={(vals) => onSelect("etp.blocks", vals)}
        />
        <Checkset
          label="Routine logs"
          options={["pH", "EC", "COD", "BOD", "TDS", "TSS"]}
          values={state.etp.logs || []}
          onChange={(vals) => onSelect("etp.logs", vals)}
        />
        <Accordion
          title="Show lab knobs"
          open={openAccordion === "etp"}
          onToggle={() =>
            setOpenAccordion(openAccordion === "etp" ? null : "etp")
          }
        >
          <Checkset
            label="Colour removal"
            options={[
              "Ozone",
              "Electrolysis",
              "Photocatalysis",
              "Sonolysis",
              "Radiolysis",
              "UF reuse"
            ]}
            values={state.etp.color_removal || []}
            onChange={(vals) => onSelect("etp.color_removal", vals)}
          />
          <Checkset
            label="Point-source recovery"
            options={["Caustic (mercerizer)", "Acid neutralizer", "Other"]}
            values={state.etp.point_recovery || []}
            onChange={(vals) => onSelect("etp.point_recovery", vals)}
          />
        </Accordion>

        <Why
          open={whyOpen}
          onToggle={() => setWhyOpen(!whyOpen)}
          text="Indigo effluent resists biodegradation; advanced oxidation and UF recovery reduce colour, COD/TDS and sludge."
        />
      </>
    );
  }

  if (step === "footprints") {
    return (
      <>
        <H3> Water & carbon footprints </H3>
        <Select
          label="Water boundary"
          options={["Process only", "Full (green/blue/grey)", "In development"]}
          value={state.footprints.water_boundary || ""}
          onChange={(v) => onSelect("footprints.water_boundary", v as any)}
        />
        <Select
          label="Unit"
          options={["m³/ton", "L/kg", "gal/lb"]}
          value={state.footprints.unit || ""}
          onChange={(v) => onSelect("footprints.unit", v as any)}
        />
        <Select
          label="Carbon boundary"
          options={["7 systems (Levi’s)", "Cradle-to-gate", "Other"]}
          value={state.footprints.carbon_boundary || ""}
          onChange={(v) => onSelect("footprints.carbon_boundary", v as any)}
        />

        <Accordion
          title="Show lab knobs"
          open={openAccordion === "footprints"}
          onToggle={() =>
            setOpenAccordion(openAccordion === "footprints" ? null : "footprints")
          }
        >
          <Field
            label="Energy mix (% grid)"
            type="number"
            placeholder="60"
            value={numOrEmpty(state.footprints.energy_mix_grid_pct)}
            onChange={(v) =>
              onSelect("footprints.energy_mix_grid_pct", clampPct(toNum(v)))
            }
          />
          <Field
            label="Energy mix (% thermal)"
            type="number"
            placeholder="40"
            value={numOrEmpty(state.footprints.energy_mix_thermal_pct)}
            onChange={(v) =>
              onSelect(
                "footprints.energy_mix_thermal_pct",
                clampPct(toNum(v))
              )
            }
          />
          <Select
            label="Intensity unit"
            options={["kWh/kg", "MJ/piece"]}
            value={state.footprints.intensity_unit || ""}
            onChange={(v) => onSelect("footprints.intensity_unit", v as any)}
          />
          <Field
            label="Intensity value"
            type="number"
            placeholder="e.g., 2.4"
            value={numOrEmpty(state.footprints.intensity_value)}
            onChange={(v) => onSelect("footprints.intensity_value", toNum(v))}
          />
          <Field
            label="Consumer wash assumptions (region)"
            placeholder="US / EU / CN …"
            value={state.footprints.consumer_region || ""}
            onChange={(v) => onSelect("footprints.consumer_region", v)}
          />
        </Accordion>

        <Why
          open={whyOpen}
          onToggle={() => setWhyOpen(!whyOpen)}
          text="Declare water footprint (green/blue/grey) + units; align carbon boundary (e.g., Levi’s 7 systems). Consumer care can dominate climate impact."
        />
      </>
    );
  }

  if (step === "safety") {
    return (
      <>
        <H3> Process safety </H3>
        <Checkset
          label="Controls"
          options={[
            "Hydro storage vent",
            "ORP/pH interlocks",
            "Ozone off-gas",
            "Enzyme dust containment",
            "Laser guarding"
          ]}
          values={state.safety.controls || []}
          onChange={(vals) => onSelect("safety.controls", vals)}
        />
        <Select
          label="Sanforizing chain"
          options={["Sanforize + Palmer", "Rubber-belt only", "Other"]}
          value={state.safety.sanforize_chain || ""}
          onChange={(v) => onSelect("safety.sanforize_chain", v as any)}
        />
        <Why
          open={whyOpen}
          onToggle={() => setWhyOpen(!whyOpen)}
          text="Handling reducing agents, ozone and singeing/finishing requires engineering controls. Chain choice also shapes hand and exposure."
        />
      </>
    );
  }

  // handover
  return (
    <>
      <H3> Data & documentation handover </H3>
      <Checkset
        label="Include with quote"
        options={[
          "Flow diagrams (boxes/oxidation)",
          "pH/ORP logs",
          "Hydrosulfite usage (kg/ton)",
          "Shade reproducibility",
          "ETP mass-balance (COD/BOD/TDS/TSS)",
          "Advanced treatment datasheets (ozone/UF)",
          "Water footprint statement",
          "LCA boundary & assumptions",
          "Laundry menu (enzyme/ozone/laser/LR)"
        ]}
        values={state.handover.items || []}
        onChange={(vals) => onSelect("handover.items", vals)}
      />
      <Why
        open={whyOpen}
        onToggle={() => setWhyOpen(!whyOpen)}
        text="Standardized handover speeds tech evaluation and reduces back-and-forth during RFQ."
      />
    </>
  );
}

/* ---------- Advanced Drawer Panels ---------- */

function AdvancedPanel(props: {
  step: StepKey;
  state: WizardState;
  onSelect: (path: string, value: any) => void;
}) {
  const { step, state, onSelect } = props;
  if (step === "warp") {
    return (
      <div className="stack">
        <p className="subtle">
          These fields are optional and stay off-screen until requested.
        </p>
        <Field
          label="Notes for range configuration"
          placeholder="oxidation towers vs cylinders, squeeze nip settings, etc."
          value={(state as any).warp_range?.notes || ""}
          onChange={(v) => onSelect("warp_range.notes", v)}
        />
      </div>
    );
  }
  if (step === "indigo") {
    return (
      <div className="stack">
        <Field
          label="Sequestering & antifoam routine"
          placeholder="e.g., SHMP + silicone defoamer schedule"
          value={state.indigo_control.notes || ""}
          onChange={(v) => onSelect("indigo_control.notes", v)}
        />
      </div>
    );
  }
  if (step === "shade") {
    return (
      <div className="stack">
        <Field
          label="Flat/soft finish recipe references"
          placeholder="lot refs, temperature windows, resin/softener IDs…"
          value={(state as any).shade_finish?.adv || ""}
          onChange={(v) => onSelect("shade_finish.adv", v)}
        />
      </div>
    );
  }
  if (step === "etp") {
    return (
      <div className="stack">
        <Field
          label="ETP mass-balance URL/Doc ID"
          placeholder="link or identifier"
          value={(state as any).etp?.doc || ""}
          onChange={(v) => onSelect("etp.doc", v)}
        />
      </div>
    );
  }
  if (step === "footprints") {
    return (
      <div className="stack">
        <Field
          label="Methodology notes"
          placeholder="ISO refs, LCA tool version, allocation choices…"
          value={(state as any).footprints?.notes || ""}
          onChange={(v) => onSelect("footprints.notes", v)}
        />
      </div>
    );
  }
  if (step === "safety") {
    return (
      <div className="stack">
        <Field
          label="SOP references"
          placeholder="SOP-ETP-ozone-01, Laser-Guard-03…"
          value={(state as any).safety?.sop || ""}
          onChange={(v) => onSelect("safety.sop", v)}
        />
      </div>
    );
  }
  // handover
  return (
    <div className="stack">
      <Field
        label="Upload manifest ID"
        placeholder="blob store / doc id"
        value={(state as any).handover?.manifest || ""}
        onChange={(v) => onSelect("handover.manifest", v)}
      />
    </div>
  );
}

/* ---------- Small UI primitives (no external CSS) ---------- */

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{children}</h3>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>{children}</div>;
}

function Field(props: {
  label: string;
  placeholder?: string;
  type?: "text" | "number";
  value: string;
  onChange: (v: string) => void;
}) {
  const { label, placeholder, type = "text", value, onChange } = props;
  return (
    <label className="field">
      <div className="label">{label}</div>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { label, checked, onChange } = props;
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Select(props: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { label, options, value, onChange } = props;
  return (
    <label className="field">
      <div className="label">{label}</div>
      <div className="selectWrap">
        <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Select…
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function Checkset(props: {
  label: string;
  options: string[];
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const { label, options, values, onChange } = props;
  const toggle = (o: string) => {
    const set = new Set(values);
    if (set.has(o)) set.delete(o);
    else set.add(o);
    onChange(Array.from(set));
  };
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="pillRow">
        {options.map((o) => (
          <button
            key={o}
            className={`pill ${values.includes(o) ? "pillActive" : ""}`}
            onClick={() => toggle(o)}
            type="button"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionGrid(props: {
  options: { id: string; title: string; subtitle?: string; svg?: string }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  const { options, value, onChange } = props;
  return (
    <div className="grid">
      {options.map((o) => (
        <button
          key={o.id}
          className={`cardRow ${value === o.id ? "cardRowActive" : ""}`}
          onClick={() => onChange(o.id)}
          type="button"
        >
          <div className="thumb" dangerouslySetInnerHTML={{ __html: o.svg || placeholderSVG }} />
          <div>
            <div className="cardTitle">{o.title}</div>
            {o.subtitle && <div className="subtle">{o.subtitle}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

function Accordion(props: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { title, open, onToggle, children } = props;
  return (
    <div className="accordion">
      <button className="accordionHeader" onClick={onToggle} type="button">
        {title}
        <span className="subtle">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="accordionBody">{children}</div>}
    </div>
  );
}

function Why(props: { text: string; open: boolean; onToggle: () => void }) {
  const { text, open, onToggle } = props;
  return (
    <div className="why">
      <button className="whyBadge" onClick={onToggle} type="button">
        Why
      </button>
      {open && <div className="whyText">{text}</div>}
    </div>
  );
}

/* ---------- Utils ---------- */

function setAt<T extends object>(obj: T, path: string, value: any): T {
  const parts = path.split(".");
  const clone: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  let cur: any = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] = cur[k] ?? {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return clone as T;
}
const toNum = (s: string) => (s === "" ? undefined : Number(s));
const numOrEmpty = (n?: number) => (typeof n === "number" ? String(n) : "");
const clampPct = (n?: number) =>
  typeof n === "number" ? Math.max(0, Math.min(100, n)) : undefined;
function mapPh(v: string): any {
  if (v.startsWith("10.0")) return "10.0–10.4";
  if (v.startsWith("10.5")) return "10.5–11.5";
  if (v.startsWith("11.6")) return "11.6–12.0";
  return v as any;
}

/* ---------- Inline CSS ---------- */

const baseCSS = `
:root{
  --ink:#0A0A0A; --muted:#6B7280; --line:#E5E7EB; --bg:#FFFFFF; --rail:#F5F5F5; --accent:#111827;
  --radius:16px; --radius-sm:10px; --shadow:0 1px 3px rgba(0,0,0,.08);
}
*{box-sizing:border-box} html,body,#root{height:100%}
.btn{border:1px solid var(--line); border-radius:10px; padding:.5rem .75rem; background:#fff; cursor:pointer}
.btn:hover{background:#fafafa}
.btnPrimary{background:var(--ink); color:#fff; border-color:var(--ink)}
.card{border:1px solid var(--line); border-radius:var(--radius); padding:20px; box-shadow:var(--shadow); background:#fff}
.field{margin-bottom:10px}
.label{font-size:12px; color:#111827; margin-bottom:4px}
.input, .select{width:100%; border:1px solid var(--line); border-radius:10px; padding:.5rem .6rem; font-size:14px}
.selectWrap{position:relative}
.pillRow{display:flex; flex-wrap:wrap; gap:8px}
.pill{border:1px solid var(--line); border-radius:999px; padding:.35rem .7rem; background:#fff; font-size:13px}
.pillActive{background:#111827; color:#fff; border-color:#111827}
.accordion{border:1px solid var(--line); border-radius:var(--radius-sm); margin-top:12px; overflow:hidden}
.accordionHeader{display:flex; justify-content:space-between; width:100%; text-align:left; padding:.5rem .75rem; background:#fff; border:none; font-weight:600}
.accordionBody{border-top:1px solid var(--line); padding:.75rem}
.why{display:flex; align-items:center; gap:8px; margin-top:10px}
.whyBadge{border:none; background:#EAEAEA; border-radius:8px; padding:.25rem .5rem; font-size:12px}
.whyText{font-size:12px; color:#222}
.subtle{color:var(--muted); font-size:12px}
.grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:10px; margin-bottom:8px}
.cardRow{display:flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:10px; background:#fff}
.cardRowActive{outline:2px solid #111827}
.cardTitle{font-size:14px; font-weight:600}
.thumb{width:48px; height:48px}
.toggle{display:flex; align-items:center; gap:8px; font-size:14px}

.drawerBackdrop{position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; justify-content:flex-end; z-index:100}
.drawer{background:#fff; width:min(480px, 100%); height:100%; border-left:1px solid var(--line); padding:16px; overflow:auto}
.stack > * + *{margin-top:10px}

.palette{border:none; border-radius:14px; padding:0}
.palette::backdrop{background:rgba(0,0,0,.35)}
.paletteInner{padding:16px; min-width:320px}
.paletteItem{display:flex; align-items:center; width:100%; text-align:left; padding:.5rem; border:1px solid var(--line); background:#fff; margin-bottom:6px; border-radius:10px}
.paletteItem:hover{background:#FAFAFA}

.rail{position:sticky; top:56px; height:calc(100vh - 56px); width:56px; background:var(--rail); border-right:1px solid var(--line); display:flex; flex-direction:column; align-items:center; padding-top:8px; gap:6px}
.railBtn{width:40px; height:40px; border-radius:999px; border:1px solid var(--line); background:#fff; font-size:18px; display:flex; align-items:center; justify-content:center}
.railBtnActive{background:#111827; color:#fff; border-color:#111827}
`;

/* ---------- Simple styles obj for layout ---------- */

const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "Inter, system-ui, Arial, sans-serif" },
  topbar: {
    position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)",
    borderBottom: "1px solid var(--line)", padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between"
  },
  topbarLeft: { display: "flex", alignItems: "center", gap: 8 },
  topbarRight: { display: "flex", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: 700 },
  subtle: { color: "var(--muted)", fontSize: 12 },
  layout: { display: "grid", gridTemplateColumns: "56px 1fr", maxWidth: 1200, margin: "0 auto" },
  rail: {},
  main: { padding: 16 },
  navRow: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" },
  drawerHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }
};

/* ---------- Inline SVG thumbs (replace with images if desired) ---------- */

const placeholderSVG = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect x="1" y="1" width="46" height="46" rx="8" stroke="#E5E7EB" stroke-width="2"/>
  <circle cx="16" cy="18" r="6" stroke="#9CA3AF" stroke-width="2"/>
  <path d="M8 40c4-7 10-10 16-10s12 3 16 10" stroke="#9CA3AF" stroke-width="2" fill="none"/>
</svg>
`;

const ropeSVG = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect x="1" y="1" width="46" height="46" rx="8" stroke="#E5E7EB" stroke-width="2"/>
  <path d="M10 12c6 0 6 24 12 24s6-24 12-24" stroke="#111827" stroke-width="2" fill="none"/>
</svg>
`;

const slasherSVG = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect x="1" y="1" width="46" height="46" rx="8" stroke="#E5E7EB" stroke-width="2"/>
  <rect x="10" y="12" width="28" height="8" rx="4" fill="#111827"/>
  <rect x="10" y="28" width="28" height="8" rx="4" fill="#9CA3AF"/>
</svg>
`;

