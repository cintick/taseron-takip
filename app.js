const SHEET_ID = "1DerOnCwzvDWcwwkVmPf2uYGFTY972eXDCnK4wIYACH0";
const SHEET_NAME = "GEÇİCİ KABUL ÖZETİ";
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const { useState, useEffect, useMemo } = React;

function Badge({ val, type }) {
  if (type === "gk") {
    const ok = val === "VAR";
    return React.createElement("span", {
      style: {
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
        letterSpacing: 1, fontFamily: "'Courier New', monospace",
        background: ok ? "#d1fae5" : "#fef3c7",
        color: ok ? "#065f46" : "#92400e",
        border: `1px solid ${ok ? "#6ee7b7" : "#fcd34d"}`
      }
    }, ok ? "✓ VAR" : "— YOK");
  }
  if (type === "kh") {
    const ok = val === "ONAYLI";
    return React.createElement("span", {
      style: {
        display: "inline-flex", alignItems: "center",
        padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
        letterSpacing: 1, fontFamily: "'Courier New', monospace",
        background: ok ? "#dbeafe" : "#f1f5f9",
        color: ok ? "#1e40af" : "#64748b",
        border: `1px solid ${ok ? "#93c5fd" : "#cbd5e1"}`
      }
    }, ok ? "✓ ONAYLI" : "— —");
  }
  return null;
}

function parseSheetData(raw) {
  try {
    const json = JSON.parse(raw.substring(47).slice(0, -2));
    const cols = json.table.cols.map(c => c.label);
    const rows = json.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
        obj[cols[i]] = cell ? (cell.f || cell.v || "") : "";
      });
      return obj;
    });
    return rows.filter(r => r[cols[1]] && String(r[cols[1]]).trim() !== "");
  } catch(e) {
    return [];
  }
}

function mapRow(row, cols) {
  return {
    firma: String(row[cols[1]] || "").trim(),
    is_konusu: String(row[cols[2]] || "").trim(),
    gecici_kabul_tarihi: String(row[cols[3]] || "").trim(),
    gecici_kabul_durumu: String(row[cols[4]] || "").trim().toUpperCase(),
    gecici_kabul_olur: String(row[cols[5]] || "").trim(),
    kesin_kabule_uygunluk: String(row[cols[6]] || "").trim(),
    kesin_kabul_onay: String(row[cols[7]] || "").trim(),
    kesin_kabul_durumu: String(row[cols[8]] || "").trim().toUpperCase(),
    kesin_hesap_onay: String(row[cols[10]] || "").trim(),
    kesin_hesap_durumu: String(row[cols[11]] || "").trim().toUpperCase(),
    nakit_teminat: String(row[cols[12]] || "").trim(),
    nakit_iade: String(row[cols[13]] || "").trim(),
    kesin_teminat: String(row[cols[14]] || "").trim(),
    kesin_iade: String(row[cols[15]] || "").trim(),
    aciklama: String(row[cols[16]] || "").trim(),
  };
}

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("TÜMÜ");

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.text())
      .then(raw => {
        const rows = parseSheetData(raw);
        if (rows.length === 0) { setError("Veri okunamadı."); setLoading(false); return; }
        const cols = Object.keys(rows[0]);
        const mapped = rows.map(r => mapRow(r, cols));
        setData(mapped);
        setLoading(false);
      })
      .catch(() => { setError("Bağlantı hatası."); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return data.filter(d => {
      const matchSearch = d.firma.toLowerCase().includes(search.toLowerCase()) ||
                          d.is_konusu.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "TÜMÜ" ? true :
        filter === "GEÇİCİ KABUL VAR" ? d.gecici_kabul_durumu === "VAR" :
        filter === "GEÇİCİ KABUL YOK" ? d.gecici_kabul_durumu === "YOK" :
        filter === "KESİN HESAP ONAYLI" ? d.kesin_hesap_durumu === "ONAYLI" : true;
      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  const stats = useMemo(() => ({
    toplam: data.length,
    gkVar: data.filter(d => d.gecici_kabul_durumu === "VAR").length,
    khOnayli: data.filter(d => d.kesin_hesap_durumu === "ONAYLI").length,
  }), [data]);

  const detail = selected !== null ? data[selected] : null;

  if (loading) return React.createElement("div", {
    style: { display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontSize:14, color:"#64748b" }
  }, "Veriler yükleniyor...");

  if (error) return React.createElement("div", {
    style: { display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontSize:14, color:"#ef4444" }
  }, error);

  return React.createElement("div", { style: { fontFamily:"'Segoe UI', sans-serif", background:"#f8fafc", minHeight:"100vh" } },
    // Header
    React.createElement("div", {
      style: { background:"linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding:"24px 32px", color:"#fff" }
    },
      React.createElement("div", { style:{ fontSize:11, letterSpacing:3, color:"#94a3b8", marginBottom:6, textTransform:"uppercase" } },
        "Mahall Bomonti İzmir · Türkerler Holding"),
      React.createElement("div", { style:{ fontSize:22, fontWeight:700 } }, "Taşeron Takip Paneli"),
      React.createElement("div", { style:{ fontSize:12, color:"#64748b", marginTop:4 } },
        "Geçici & Kesin Kabul · Teminat Durumları"),
      React.createElement("div", { style:{ display:"flex", gap:16, marginTop:20 } },
        ...[
          { label:"Toplam Firma", val: stats.toplam, color:"#38bdf8" },
          { label:"Geçici Kabul VAR", val: stats.gkVar, color:"#34d399" },
          { label:"Kesin Hesap Onaylı", val: stats.khOnayli, color:"#a78bfa" },
        ].map(s => React.createElement("div", {
          key: s.label,
          style: { background:"rgba(255,255,255,0.07)", borderRadius:8, padding:"10px 18px", border:"1px solid rgba(255,255,255,0.1)" }
        },
          React.createElement("div", { style:{ fontSize:22, fontWeight:800, color:s.color } }, s.val),
          React.createElement("div", { style:{ fontSize:10, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase", marginTop:2 } }, s.label)
        ))
      )
    ),

    // Body
    React.createElement("div", { style:{ display:"flex", height:"calc(100vh - 170px)" } },

      // Left panel
      React.createElement("div", { style:{ width:380, borderRight:"1px solid #e2e8f0", background:"#fff", display:"flex", flexDirection:"column" } },
        React.createElement("div", { style:{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0" } },
          React.createElement("input", {
            placeholder: "Firma veya iş konusu ara...",
            value: search,
            onChange: e => { setSearch(e.target.value); setSelected(null); },
            style: { width:"100%", padding:"8px 12px", borderRadius:6, border:"1px solid #cbd5e1", fontSize:13, outline:"none", boxSizing:"border-box", background:"#f8fafc" }
          }),
          React.createElement("div", { style:{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" } },
            ...["TÜMÜ","GEÇİCİ KABUL VAR","GEÇİCİ KABUL YOK","KESİN HESAP ONAYLI"].map(f =>
              React.createElement("button", {
                key: f, onClick: () => setFilter(f),
                style: {
                  padding:"3px 8px", fontSize:10, borderRadius:4, cursor:"pointer",
                  fontWeight: filter===f ? 700 : 400, letterSpacing:0.5,
                  border: filter===f ? "1px solid #1e293b" : "1px solid #cbd5e1",
                  background: filter===f ? "#1e293b" : "#fff",
                  color: filter===f ? "#fff" : "#64748b",
                }
              }, f)
            )
          )
        ),
        React.createElement("div", { style:{ overflowY:"auto", flex:1 } },
          filtered.length === 0
            ? React.createElement("div", { style:{ padding:24, color:"#94a3b8", fontSize:13, textAlign:"center" } }, "Sonuç bulunamadı")
            : filtered.map((d, i) => {
                const idx = data.indexOf(d);
                const isSelected = selected === idx;
                return React.createElement("div", {
                  key: idx,
                  onClick: () => setSelected(isSelected ? null : idx),
                  style: {
                    padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f1f5f9",
                    background: isSelected ? "#eff6ff" : "transparent",
                    borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                  }
                },
                  React.createElement("div", { style:{ fontSize:12, fontWeight:600, color:"#1e293b", lineHeight:1.3, marginBottom:4 } }, d.firma),
                  React.createElement("div", { style:{ fontSize:10, color:"#94a3b8", marginBottom:8, lineHeight:1.4 } }, d.is_konusu),
                  React.createElement("div", { style:{ display:"flex", gap:6 } },
                    React.createElement(Badge, { val: d.gecici_kabul_durumu, type:"gk" }),
                    React.createElement(Badge, { val: d.kesin_hesap_durumu, type:"kh" })
                  )
                );
              })
        )
      ),

      // Right detail panel
      React.createElement("div", { style:{ flex:1, overflowY:"auto", padding: detail ? 32 : 0 } },
        !detail
          ? React.createElement("div", {
              style:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#94a3b8" }
            },
              React.createElement("div", { style:{ fontSize:40, marginBottom:12 } }, "←"),
              React.createElement("div", { style:{ fontSize:14 } }, "Bir firma seçin")
            )
          : React.createElement("div", null,
              React.createElement("div", { style:{ fontSize:11, color:"#94a3b8", letterSpacing:2, textTransform:"uppercase", marginBottom:6 } }, "Firma Detayı"),
              React.createElement("div", { style:{ fontSize:20, fontWeight:800, color:"#0f172a", marginBottom:4 } }, detail.firma),
              React.createElement("div", { style:{ fontSize:13, color:"#64748b", marginBottom:28, lineHeight:1.5 } }, detail.is_konusu),

              React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 } },
                ...[
                  { title:"Geçici Kabul", status: detail.gecici_kabul_durumu, date: detail.gecici_kabul_tarihi,
                    ok: detail.gecici_kabul_durumu==="VAR",
                    color: detail.gecici_kabul_durumu==="VAR" ? "#065f46" : "#92400e",
                    bg: detail.gecici_kabul_durumu==="VAR" ? "#ecfdf5" : "#fffbeb",
                    border: detail.gecici_kabul_durumu==="VAR" ? "#6ee7b7" : "#fcd34d" },
                  { title:"Kesin Hesap", status: detail.kesin_hesap_durumu || "—", date: detail.kesin_hesap_onay,
                    ok: detail.kesin_hesap_durumu==="ONAYLI",
                    color: detail.kesin_hesap_durumu==="ONAYLI" ? "#1e40af" : "#64748b",
                    bg: detail.kesin_hesap_durumu==="ONAYLI" ? "#eff6ff" : "#f8fafc",
                    border: detail.kesin_hesap_durumu==="ONAYLI" ? "#93c5fd" : "#e2e8f0" },
                ].map(c => React.createElement("div", {
                  key: c.title,
                  style: { background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:"18px 20px" }
                },
                  React.createElement("div", { style:{ fontSize:10, letterSpacing:2, color:"#94a3b8", textTransform:"uppercase", marginBottom:8 } }, c.title),
                  React.createElement("div", { style:{ fontSize:18, fontWeight:800, color:c.color } }, c.status),
                  c.date && React.createElement("div", { style:{ fontSize:12, color:c.color, marginTop:4, opacity:0.8 } }, "📅 " + c.date)
                ))
              ),

              React.createElement("div", { style:{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:"18px 20px", marginBottom:16 } },
                React.createElement("div", { style:{ fontSize:10, letterSpacing:2, color:"#94a3b8", textTransform:"uppercase", marginBottom:14 } }, "Teminat Bilgileri"),
                React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 } },
                  ...[
                    { label:"Nakit Teminat", val: detail.nakit_teminat },
                    { label:"Kesin Teminat", val: detail.kesin_teminat },
                    { label:"Nakit İade", val: detail.nakit_iade },
                    { label:"Kesin İade", val: detail.kesin_iade },
                  ].map(t => React.createElement("div", {
                    key: t.label,
                    style: { background:"#f8fafc", borderRadius:6, padding:"10px 14px" }
                  },
                    React.createElement("div", { style:{ fontSize:10, color:"#94a3b8", marginBottom:4 } }, t.label),
                    React.createElement("div", { style:{ fontSize:13, fontWeight:700, color: t.val ? "#0f172a" : "#cbd5e1", fontFamily:"'Courier New', monospace" } }, t.val || "—")
                  ))
                )
              ),

              detail.aciklama && React.createElement("div", {
                style: { background:"#fef9c3", border:"1px solid #fde047", borderRadius:8, padding:"12px 16px" }
              },
                React.createElement("div", { style:{ fontSize:10, letterSpacing:1, color:"#854d0e", textTransform:"uppercase", marginBottom:4 } }, "⚠ Açıklama"),
                React.createElement("div", { style:{ fontSize:13, color:"#713f12", lineHeight:1.5 } }, detail.aciklama)
              )
            )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
