const SHEET_ID = "1DerOnCwzvDWcwwkVmPf2uYGFTY972eXDCnK4wIYACH0";
const SHEET_NAME = "GEÇİCİ KABUL ÖZETİ";
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
const SIFRE = "bomonti";

const { useState, useEffect, useMemo } = React;

function Badge({ val, type }) {
  if (type === "gk") {
    const ok = val === "VAR";
    return React.createElement("span", {
      style: {
        display:"inline-flex", alignItems:"center", gap:4,
        padding:"3px 10px", borderRadius:4, fontSize:11, fontWeight:700,
        letterSpacing:1, fontFamily:"'Courier New', monospace",
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
        display:"inline-flex", alignItems:"center",
        padding:"3px 10px", borderRadius:4, fontSize:11, fontWeight:700,
        letterSpacing:1, fontFamily:"'Courier New', monospace",
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
      row.c.forEach((cell, i) => { obj[cols[i]] = cell ? (cell.f || cell.v || "") : ""; });
      return obj;
    });
    return rows.filter(r => r[cols[1]] && String(r[cols[1]]).trim() !== "");
  } catch(e) { return []; }
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
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [girilen, setGirilen] = useState("");
  const [hata, setHata] = useState(false);

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.text())
      .then(raw => {
        const rows = parseSheetData(raw);
        if (rows.length === 0) { setError("Veri okunamadı."); setLoading(false); return; }
        const cols = Object.keys(rows[0]);
        setData(rows.map(r => mapRow(r, cols)));
        setLoading(false);
      })
      .catch(() => { setError("Bağlantı hatası."); setLoading(false); });
  }, []);

  const filtered = useMemo(() => data.filter(d => {
    const matchSearch = d.firma.toLowerCase().includes(search.toLowerCase()) ||
                        d.is_konusu.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "TÜMÜ" ? true :
      filter === "GEÇİCİ KABUL VAR" ? d.gecici_kabul_durumu === "VAR" :
      filter === "GEÇİCİ KABUL YOK" ? d.gecici_kabul_durumu === "YOK" :
      filter === "KESİN HESAP ONAYLI" ? d.kesin_hesap_durumu === "ONAYLI" : true;
    return matchSearch && matchFilter;
  }), [data, search, filter]);

  const stats = useMemo(() => ({
    toplam: data.length,
    gkVar: data.filter(d => d.gecici_kabul_durumu === "VAR").length,
    khOnayli: data.filter(d => d.kesin_hesap_durumu === "ONAYLI").length,
  }), [data]);

  const detail = selected !== null ? data[selected] : null;

  // Şifre ekranı
  if (!girisYapildi) {
    return React.createElement("div", {
      style: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f172a", padding:24 }
    },
      React.createElement("div", { style:{ fontSize:11, letterSpacing:3, color:"#475569", marginBottom:8, textTransform:"uppercase", textAlign:"center" } }, "Mahall Bomonti İzmir · Türkerler Holding"),
      React.createElement("div", { style:{ fontSize:20, fontWeight:700, color:"#fff", marginBottom:32, textAlign:"center" } }, "Taşeron Takip Paneli"),
      React.createElement("input", {
        type:"password", maxLength:6, placeholder:"Şifre",
        value:girilen,
        onChange: e => { setGirilen(e.target.value); setHata(false); },
        onKeyDown: e => { if (e.key==="Enter") { if (girilen===SIFRE) setGirisYapildi(true); else { setHata(true); setGirilen(""); } } },
        style: { padding:"12px 20px", fontSize:20, letterSpacing:8, textAlign:"center", borderRadius:8, border: hata ? "2px solid #ef4444" : "2px solid #334155", background:"#1e293b", color:"#fff", outline:"none", width:180, marginBottom:12 }
      }),
      React.createElement("button", {
        onClick: () => { if (girilen===SIFRE) setGirisYapildi(true); else { setHata(true); setGirilen(""); } },
        style: { padding:"10px 28px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:6, fontSize:14, cursor:"pointer", fontWeight:600 }
      }, "Giriş"),
      hata && React.createElement("div", { style:{ color:"#ef4444", fontSize:12, marginTop:8 } }, "Yanlış şifre")
    );
  }

  if (loading) return React.createElement("div", {
    style:{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontSize:14, color:"#64748b" }
  }, "Veriler yükleniyor...");

  if (error) return React.createElement("div", {
    style:{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontSize:14, color:"#ef4444" }
  }, error);

  // HEADER
  const header = React.createElement("div", {
    style:{ background:"linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: isMobile ? "16px 20px" : "24px 32px", color:"#fff" }
  },
    // Mobilde detay açıkken geri butonu göster
    isMobile && detail
      ? React.createElement("button", {
          onClick: () => setSelected(null),
          style:{ background:"none", border:"none", color:"#94a3b8", fontSize:13, cursor:"pointer", marginBottom:12, padding:0, display:"flex", alignItems:"center", gap:6 }
        }, "← Listeye Dön")
      : null,
    React.createElement("div", { style:{ fontSize:10, letterSpacing:3, color:"#94a3b8", marginBottom:4, textTransform:"uppercase" } }, "Mahall Bomonti İzmir · Türkerler Holding"),
    React.createElement("div", { style:{ fontSize: isMobile ? 16 : 22, fontWeight:700 } },
      isMobile && detail ? detail.firma : "Taşeron Takip Paneli"
    ),
    // Stats — sadece liste görünümünde göster
    (!isMobile || !detail) && React.createElement("div", {
      style:{ display:"flex", gap: isMobile ? 8 : 16, marginTop: isMobile ? 12 : 20, flexWrap:"wrap" }
    },
      ...[
        { label:"Toplam", val:stats.toplam, color:"#38bdf8" },
        { label:"GK VAR", val:stats.gkVar, color:"#34d399" },
        { label:"KH Onaylı", val:stats.khOnayli, color:"#a78bfa" },
      ].map(s => React.createElement("div", {
        key:s.label,
        style:{ background:"rgba(255,255,255,0.07)", borderRadius:8, padding: isMobile ? "8px 12px" : "10px 18px", border:"1px solid rgba(255,255,255,0.1)" }
      },
        React.createElement("div", { style:{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:s.color } }, s.val),
        React.createElement("div", { style:{ fontSize:9, color:"#94a3b8", letterSpacing:1, textTransform:"uppercase", marginTop:2 } }, s.label)
      ))
    )
  );

  // LİSTE PANELİ
  const listPanel = React.createElement("div", {
    style:{
      width: isMobile ? "100%" : 380,
      borderRight: isMobile ? "none" : "1px solid #e2e8f0",
      background:"#fff",
      display: isMobile && detail ? "none" : "flex",
      flexDirection:"column",
      height: isMobile ? "calc(100vh - 130px)" : "auto"
    }
  },
    React.createElement("div", { style:{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0" } },
      React.createElement("input", {
        placeholder:"Firma veya iş konusu ara...",
        value:search,
        onChange: e => { setSearch(e.target.value); setSelected(null); },
        style:{ width:"100%", padding:"8px 12px", borderRadius:6, border:"1px solid #cbd5e1", fontSize:13, outline:"none", boxSizing:"border-box", background:"#f8fafc" }
      }),
      React.createElement("div", { style:{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" } },
        ...["TÜMÜ","GEÇİCİ KABUL VAR","GEÇİCİ KABUL YOK","KESİN HESAP ONAYLI"].map(f =>
          React.createElement("button", {
            key:f, onClick:()=>setFilter(f),
            style:{
              padding:"3px 8px", fontSize:10, borderRadius:4, cursor:"pointer",
              fontWeight:filter===f?700:400, letterSpacing:0.5,
              border:filter===f?"1px solid #1e293b":"1px solid #cbd5e1",
              background:filter===f?"#1e293b":"#fff",
              color:filter===f?"#fff":"#64748b",
            }
          }, f)
        )
      )
    ),
    React.createElement("div", { style:{ overflowY:"auto", flex:1 } },
      filtered.length === 0
        ? React.createElement("div", { style:{ padding:24, color:"#94a3b8", fontSize:13, textAlign:"center" } }, "Sonuç bulunamadı")
        : filtered.map(d => {
            const idx = data.indexOf(d);
            const isSelected = selected === idx;
            return React.createElement("div", {
              key:idx,
              onClick:() => setSelected(isSelected && !isMobile ? null : idx),
              style:{
                padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f1f5f9",
                background:isSelected?"#eff6ff":"transparent",
                borderLeft:isSelected?"3px solid #3b82f6":"3px solid transparent",
              }
            },
              React.createElement("div", { style:{ fontSize:12, fontWeight:600, color:"#1e293b", lineHeight:1.3, marginBottom:4 } }, d.firma),
              React.createElement("div", { style:{ fontSize:10, color:"#94a3b8", marginBottom:8, lineHeight:1.4 } }, d.is_konusu),
              React.createElement("div", { style:{ display:"flex", gap:6 } },
                React.createElement(Badge, { val:d.gecici_kabul_durumu, type:"gk" }),
                React.createElement(Badge, { val:d.kesin_hesap_durumu, type:"kh" })
              )
            );
          })
    )
  );

  // DETAY PANELİ
  const detailPanel = React.createElement("div", {
    style:{
      flex:1,
      overflowY:"auto",
      padding: detail ? (isMobile ? "20px 16px" : 32) : 0,
      display: isMobile && !detail ? "none" : "block"
    }
  },
    !detail
      ? React.createElement("div", {
          style:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#94a3b8" }
        },
          React.createElement("div", { style:{ fontSize:40, marginBottom:12 } }, "←"),
          React.createElement("div", { style:{ fontSize:14 } }, "Bir firma seçin")
        )
      : React.createElement("div", null,
          React.createElement("div", { style:{ fontSize:11, color:"#94a3b8", letterSpacing:2, textTransform:"uppercase", marginBottom:6 } }, "Firma Detayı"),
          React.createElement("div", { style:{ fontSize: isMobile ? 16 : 20, fontWeight:800, color:"#0f172a", marginBottom:4 } }, detail.firma),
          React.createElement("div", { style:{ fontSize:13, color:"#64748b", marginBottom:24, lineHeight:1.5 } }, detail.is_konusu),
          React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 } },
            ...[
              { title:"Geçici Kabul", status:detail.gecici_kabul_durumu, date:detail.gecici_kabul_tarihi,
                color:detail.gecici_kabul_durumu==="VAR"?"#065f46":"#92400e",
                bg:detail.gecici_kabul_durumu==="VAR"?"#ecfdf5":"#fffbeb",
                border:detail.gecici_kabul_durumu==="VAR"?"#6ee7b7":"#fcd34d" },
              { title:"Kesin Hesap", status:detail.kesin_hesap_durumu||"—", date:detail.kesin_hesap_onay,
                color:detail.kesin_hesap_durumu==="ONAYLI"?"#1e40af":"#64748b",
                bg:detail.kesin_hesap_durumu==="ONAYLI"?"#eff6ff":"#f8fafc",
                border:detail.kesin_hesap_durumu==="ONAYLI"?"#93c5fd":"#e2e8f0" },
            ].map(c => React.createElement("div", {
              key:c.title,
              style:{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:"14px 16px" }
            },
              React.createElement("div", { style:{ fontSize:9, letterSpacing:2, color:"#94a3b8", textTransform:"uppercase", marginBottom:6 } }, c.title),
              React.createElement("div", { style:{ fontSize:16, fontWeight:800, color:c.color } }, c.status),
              c.date && React.createElement("div", { style:{ fontSize:11, color:c.color, marginTop:4, opacity:.8 } }, "📅 "+c.date)
            ))
          ),
          React.createElement("div", { style:{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:"16px", marginBottom:16 } },
            React.createElement("div", { style:{ fontSize:9, letterSpacing:2, color:"#94a3b8", textTransform:"uppercase", marginBottom:12 } }, "Teminat Bilgileri"),
            React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 } },
              ...[
                { label:"Nakit Teminat", val:detail.nakit_teminat },
                { label:"Kesin Teminat", val:detail.kesin_teminat },
                { label:"Nakit İade", val:detail.nakit_iade },
                { label:"Kesin İade", val:detail.kesin_iade },
              ].map(t => React.createElement("div", {
                key:t.label,
                style:{ background:"#f8fafc", borderRadius:6, padding:"10px 12px" }
              },
                React.createElement("div", { style:{ fontSize:9, color:"#94a3b8", marginBottom:4 } }, t.label),
                React.createElement("div", { style:{ fontSize:12, fontWeight:700, color:t.val?"#0f172a":"#cbd5e1", fontFamily:"'Courier New', monospace" } }, t.val||"—")
              ))
            )
          ),
          detail.aciklama && React.createElement("div", {
            style:{ background:"#fef9c3", border:"1px solid #fde047", borderRadius:8, padding:"12px 14px" }
          },
            React.createElement("div", { style:{ fontSize:9, letterSpacing:1, color:"#854d0e", textTransform:"uppercase", marginBottom:4 } }, "⚠ Açıklama"),
            React.createElement("div", { style:{ fontSize:13, color:"#713f12", lineHeight:1.5 } }, detail.aciklama)
          )
        )
  );

  // MASAÜSTÜ: yan yana | MOBİL: üst üste (sadece biri görünür)
  return React.createElement("div", { style:{ fontFamily:"'Segoe UI', sans-serif", background:"#f8fafc", minHeight:"100vh" } },
    header,
    React.createElement("div", {
      style:{
        display:"flex",
        flexDirection: isMobile ? "column" : "row",
        height: isMobile ? "auto" : "calc(100vh - 170px)"
      }
    },
      listPanel,
      detailPanel
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
