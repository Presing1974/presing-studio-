import { useState, useEffect, useRef } from "react";
import Head from "next/head";



const CENE = {
  B6: { stampa: { cb: 0.80, kolor_malo: 5, kolor_cela: 3 }, korice: 60 },
  A5: { stampa: { cb: 1.10, kolor_malo: 6, kolor_cela: 4 }, korice: 60 },
  B5: { stampa: { cb: 1.40, kolor_malo: 7, kolor_cela: 5 }, korice: 80 },
  A4: { stampa: { cb: 2.20, kolor_malo: 12, kolor_cela: 8 }, korice: 80 }
};

const popustiZaTiraz = (tiraz) => {
  if (tiraz >= 500) return { stampa: 0.20, korice: 20 };
  if (tiraz >= 300) return { stampa: 0.10, korice: 10 };
  return { stampa: 0, korice: 0 };
};

const izracunajCenu = (params) => {
  const { format, strana, tiraz, korice, boja, klapne, dvostrano } = params;
  if (!format || !strana || !tiraz || !korice || !boja) return null;
  const f = CENE[format];
  if (!f) return null;
  const s = parseInt(strana);
  const t = parseInt(tiraz);
  if (isNaN(s) || isNaN(t) || s < 1 || t < 4) return null;
  if (korice === "tvrd") return { tvrdPovez: true, format, strana: s, tiraz: t };
  let cenaPoStrani = f.stampa[boja];
  const popust = boja === "cb" ? popustiZaTiraz(t) : { stampa: 0, korice: 0 };
  cenaPoStrani -= popust.stampa;
  const ukupnoStampa = cenaPoStrani * s * t;
  let cenaKorica = f.korice;
  if (klapne && (format === "B6" || format === "A5")) cenaKorica += 20;
  if (dvostrano) cenaKorica += 40;
  if (boja === "cb") cenaKorica -= popust.korice;
  const ukupnoKorice = cenaKorica * t;
  const ukupno = Math.round(ukupnoStampa + ukupnoKorice);
  return {
    format, strana: s, tiraz: t, korice, boja, klapne, dvostrano,
    cenaStampaPoStrani: cenaPoStrani.toFixed(2),
    cenaKoricaPoKomadu: cenaKorica,
    ukupnoStampa: Math.round(ukupnoStampa),
    ukupnoKorice: Math.round(ukupnoKorice),
    ukupno, poKomadu: Math.round(ukupno / t),
    popustPrimijenjen: popust.stampa > 0
  };
};

const BAZA_ZNANJA = {
  formati: { p: ["formate", "format", "veličina", "dimenzij"], o: `Radimo četiri formata knjiga:\n\n• B6 — 125×175 mm\n• A5 — 140×200 mm ili 145×205 mm\n• B5 — 175×250 mm\n• A4 — 208×291 mm\n\nTvrde korice se rade za sve formate, po dogovoru s urednikom.` },
  cena: { p: ["cena", "cene", "košta", "koliko", "skupo"], o: `Cene zavise od formata. Okvirno za štampu:\n\n• B6 — od 0,80 RSD/strana\n• A5 — od 1,10 RSD/strana\n• B5 — od 1,40 RSD/strana\n• A4 — od 2,20 RSD/strana\n\nPlus korice (60-80 RSD/komad). Hoćete tačnu procenu?` },
  papir: { p: ["papir", "kvalitet"], o: `Štampamo na premijum papiru 80g iz Nemačke i Norveške:\n\n• Beli 80g — klasičan, beli ton\n• Voluminozni 80g — toplije nijanse\n\nCena je ista za oba tipa.` },
  rok: { p: ["rok", "vreme", "traje", "kada", "isporuk"], o: `Od trenutka kada potvrdimo da je priprema za štampu pravilno urađena, rok je 10 radnih dana.\n\nZa hitne slučajeve — javite nam.` },
  kolor: { p: ["kolor", "boja", "boje", "crno-bel"], o: `Da, radimo i kolor štampu. Okvirno za celu knjigu u koloru:\n\n• B6 — 3 RSD/strana\n• A5 — 4 RSD/strana\n• B5 — 5 RSD/strana\n• A4 — 8 RSD/strana` },
  korice: { p: ["korice", "povez", "tvrd", "mek"], o: `Radimo oba tipa korica:\n\n📕 MEK POVEZ\nKolor štampa, mat ili sjaj laminacija, papir 300g.\n60-80 RSD po komadu.\n\n📗 TVRD POVEZ\nIde po dogovoru s urednikom.` },
  tiraz: { p: ["tiraž", "primerak", "minim"], o: `Najmanji tiraž je 4 primerka. Veći tiraž obara cenu po komadu:\n\n• 300+ primeraka: -0,10 RSD/strana, -10 RSD/korice\n• 500+ primeraka: -0,20 RSD/strana, -20 RSD/korice` },
  priprema: { p: ["priprema", "PDF", "Word", "fajl", "rukopis"], o: `Idealno je da nam pošaljete PDF spreman za štampu — knjižni blok i korice.\n\nAko nemate pripremu — pošaljite Word fajl + sliku za korice.` },
  dostava: { p: ["dostav", "šalj", "isporuk", "kurir"], o: `Šaljemo svuda preko dve poštanske usluge:\n\n• CC Paket (Pošta) — jeftinije\n• Post Express — brže\n\nTačnu cenu šaljemo sa predračunom.` },
  isbn: { p: ["ISBN", "CIP"], o: `Zavisi koji put birate:\n\n📕 AUTORSKO IZDANJE — Vi sami nabavljate ISBN/CIP\n📗 PRESING IZDANJE — Mi obezbeđujemo, uz procenu rukopisa.` },
  reference: { p: ["referenc", "iskustv", "ko ste", "godin"], o: `Presing štamparija postoji od 2015. godine. Iza nas je više od 2.000 odštampanih izdanja sa ukupnim tiražom od pola miliona primeraka.\n\nTo znači da imamo iskustva sa svakim mogućim tipom knjige.` }
};

const KAPCA = [
  { p: "Ko je napisao 'Na Drini ćuprija'?", o: ["Ivo Andrić", "Vuk Karadžić", "Branko Ćopić"], t: 0 },
  { p: "Ko je napisao 'Hamleta'?", o: ["Vilijam Šekspir", "Lav Tolstoj", "Ivo Andrić"], t: 0 },
  { p: "Ko je sakupljao srpske narodne pesme?", o: ["Vuk Karadžić", "Branko Radičević", "Petar Petrović Njegoš"], t: 0 },
  { p: "Ko je autor 'Gorskog vijenca'?", o: ["Petar Petrović Njegoš", "Branko Ćopić", "Đura Jakšić"], t: 0 },
  { p: "Ko je napisao 'Mali princ'?", o: ["Antoan de Sent-Egziperi", "Hans Kristijan Andersen", "Braća Grim"], t: 0 },
  { p: "Ko je napisao 'Rat i mir'?", o: ["Lav Tolstoj", "Fjodor Dostojevski", "Miloš Crnjanski"], t: 0 }
];

const proveriBazu = (pit) => {
  const lp = pit.toLowerCase();
  for (const [, v] of Object.entries(BAZA_ZNANJA)) {
    for (const t of v.p) if (lp.includes(t.toLowerCase())) return v.o;
  }
  return null;
};

const validMejl = (m) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
const validTel = (t) => { const c = t.replace(/[\s\-\/\+]/g, ''); return c.length >= 8 && /^\d+$/.test(c); };
const fmt = (n) => n.toLocaleString('sr-RS').replace(/,/g, '.') + ' RSD';

export default function App() {
  const [otv, setOtv] = useState(false);
  const [pog, setPog] = useState("meni");
  const [poruke, setPoruke] = useState([]);
  const [unos, setUnos] = useState("");
  const [tipka, setTipka] = useState(false);
  const [brP, setBrP] = useState(0);
  const [kProsla, setKProsla] = useState(false);
  const [kPit, setKPit] = useState(null);
  const [njP, setNjP] = useState(false);
  const [zav, setZav] = useState(false);
  const [toast, setToast] = useState("");
  const ref = useRef(null);

  const [fD, setFD] = useState({ ime: "", mejl: "", telefon: "", format: "", strana: "", tiraz: "", korice: "", klapne: false, dvostrano: false, boja: "", papir: "", priprema: "", napomene: "" });
  const [kD, setKD] = useState({ ime: "", mejl: "", telefon: "", tema: "Upit za štampu knjiga", poruka: "" });
  const [nD, setND] = useState({ imePrezime: "", mejl: "" });
  const [calcD, setCalcD] = useState({ format: "A5", strana: "", tiraz: "", korice: "mek", boja: "cb", klapne: false, dvostrano: false });

  const calcR = izracunajCenu(calcD);

  useEffect(() => {
    if (otv && pog === "razgovor" && poruke.length === 0) {
      setTimeout(() => setPoruke([{ tip: "ai", tekst: "🖨 Zdravo! Ja sam Presingov AI asistent. Odgovaram na pitanja u vezi sa štampom knjiga.\n\nPostavite mi bilo koje pitanje o ceni, rokovima, kvalitetu papira, dostavi ili drugim stvarima povezanim sa štampom knjiga." }]), 300);
    }
  }, [otv, pog]);

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [poruke, tipka]);

  const sT = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const dP = (tip, tekst) => setPoruke(p => [...p, { tip, tekst }]);

  // Funkcija za poziv pravog AI-a preko backend-a
  const pozoviAI = async (pitanje, istorijaPoruka) => {
    try {
      const istorija = istorijaPoruka
        .filter(p => p.tip === "user" || p.tip === "ai")
        .map(p => ({
          role: p.tip === "user" ? "user" : "assistant",
          content: p.tekst
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitanje, istorija })
      });

      if (!response.ok) {
        const greska = await response.json();
        return greska.greska || "Trenutno imamo tehnički problem. Kontaktirajte urednika na 064/637-90-78.";
      }

      const data = await response.json();
      return data.odgovor;
    } catch (e) {
      console.error('Greška pri pozivu AI:', e);
      return "Trenutno imamo tehnički problem. Kontaktirajte urednika na 064/637-90-78 ili kr.presing@gmail.com.";
    }
  };

  const slPit = async () => {
    if (!unos.trim() || tipka || zav) return;
    if (unos.length > 500) { sT("Poruka je predugačka"); return; }
    const pit = unos;
    setUnos("");
    dP("user", pit);
    const nb = brP + 1;
    setBrP(nb);

    if (nb === 3 && !kProsla) {
      setTipka(true); await new Promise(r => setTimeout(r, 1000)); setTipka(false);
      const sl = KAPCA[Math.floor(Math.random() * KAPCA.length)];
      setKPit(sl);
      dP("ai-kapca", `Pre nego što nastavimo, mala književna provera — da znamo da pričamo sa pravim ljubiteljem knjiga 😊\n\n${sl.p}`);
      return;
    }
    if (nb === 5 && !njP) {
      setNjP(true);
      setTipka(true);
      const odgovor = await pozoviAI(pit, poruke);
      setTipka(false);
      dP("ai", odgovor);
      await new Promise(r => setTimeout(r, 1500));
      dP("ai-njuzleter", "Usput, ako Vas zanimaju vesti iz Presingove štamparije i izdavačke kuće — možete da se prijavite za naš njuzleter.\n\nNije obavezno, uvek se može prijaviti kasnije.");
      return;
    }
    if (nb === 14) {
      setTipka(true);
      const odgovor = await pozoviAI(pit, poruke);
      setTipka(false);
      dP("ai", odgovor);
      await new Promise(r => setTimeout(r, 1500));
      dP("ai-upozorenje", "Vidim da imamo dosta detalja u razgovoru!\nImamo još jedno pitanje pre kraja sesije.\n\nMožda je najbolje da ostavite svoje podatke pa da Vas naš urednik pozove i da razgovor nastavite direktno sa njim?");
      return;
    }
    if (nb >= 15) {
      setTipka(true);
      const odgovor = await pozoviAI(pit, poruke);
      setTipka(false);
      dP("ai", odgovor);
      await new Promise(r => setTimeout(r, 1500));
      dP("ai-kraj", "Razgovor je opsežan — molim Vas popunite formular ili nas pozovite na 064/637-90-78.");
      setZav(true);
      return;
    }
    setTipka(true);
    const odgovor = await pozoviAI(pit, poruke);
    setTipka(false);
    dP("ai", odgovor);
  };

  const odgK = (idx) => {
    if (!kPit) return;
    const t = idx === kPit.t;
    dP("user", kPit.o[idx]);
    setTimeout(() => {
      if (t) {
        setKProsla(true); setKPit(null);
        dP("ai", "Tačno! 😊 Hvala. Nastavimo razgovor — šta Vas još zanima?");
      } else {
        dP("ai", `Nije baš... Tačan odgovor je: ${kPit.o[kPit.t]}.\n\nPokušajte sa drugim pitanjem ili pošaljite upit kroz formular.`);
        setZav(true);
      }
    }, 800);
  };

  const slF = () => {
    if (fD.ime.length < 3) return sT("Ime min 3 znaka");
    if (!validMejl(fD.mejl)) return sT("Neispravan mejl");
    if (!validTel(fD.telefon)) return sT("Neispravan telefon");
    if (!fD.format) return sT("Izaberite format");
    if (!fD.strana || fD.strana < 1) return sT("Unesite broj strana");
    if (!fD.tiraz || fD.tiraz < 4) return sT("Tiraž min 4");
    if (fD.tiraz > 1000) return sT("Za tiraž preko 1000, kontaktirajte urednika");
    sT("✓ Vaš upit je poslat! Predračun stiže u toku dana.");
    setTimeout(() => { setOtv(false); setPog("meni"); }, 2000);
  };

  const slK = () => {
    if (kD.ime.length < 3) return sT("Ime min 3 znaka");
    if (!validMejl(kD.mejl)) return sT("Neispravan mejl");
    if (kD.telefon && !validTel(kD.telefon)) return sT("Neispravan telefon");
    if (kD.poruka.length < 10) return sT("Poruka prekratka");
    sT("✓ Vaša poruka je poslata uredniku!");
    setTimeout(() => { setOtv(false); setPog("meni"); }, 2000);
  };

  const slN = () => {
    if (nD.imePrezime.length < 3) return sT("Ime i prezime obavezno");
    if (!validMejl(nD.mejl)) return sT("Neispravan mejl");
    sT("✓ Hvala! Prijavljeni ste za njuzleter.");
    setTimeout(() => { setND({ imePrezime: "", mejl: "" }); setPog("razgovor"); }, 2000);
  };

  const genPDF = () => {
    if (!calcR || calcR.tvrdPovez) return;
    const r = calcR;
    const danas = new Date().toLocaleDateString('sr-RS');
    const dim = { B6: "125×175 mm", A5: "140×200 mm", B5: "175×250 mm", A4: "208×291 mm" };
    const bt = { cb: "Crno-bela", kolor_malo: "Kolor (manji broj strana)", kolor_cela: "Kolor (cela knjiga)" };
    
    const html = `
      <!DOCTYPE html>
      <html lang="sr">
      <head>
        <meta charset="UTF-8">
        <title>Presing procena cene</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Inter', Arial, sans-serif; color: #111; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #374151; }
          .header h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
          .header p { margin: 0.2rem 0; font-size: 0.85rem; color: #555; }
          .upozorenje { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem 1.25rem; margin: 1.5rem 0; }
          .upozorenje strong { color: #78350f; display: block; margin-bottom: 0.5rem; }
          .upozorenje p { margin: 0; font-size: 0.9rem; color: #78350f; }
          h2 { font-size: 1.2rem; margin: 1.5rem 0 0.75rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid #ddd; }
          .datum { text-align: center; font-size: 0.9rem; color: #666; margin-bottom: 1.5rem; }
          .red { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px dotted #eee; }
          .red.bold { font-weight: 700; font-size: 1.1rem; padding: 0.75rem 0; border-top: 2px solid #374151; border-bottom: 2px solid #374151; margin: 0.5rem 0; }
          .napomene { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.85rem; color: #666; }
          .napomene p { margin: 0.3rem 0; }
          .footer { margin-top: 3rem; text-align: center; font-size: 0.75rem; color: #999; }
          @media print { .no-print { display: none; } }
          .no-print { background: #374151; color: white; padding: 1rem; text-align: center; margin-bottom: 1rem; border-radius: 8px; }
          .no-print button { background: white; color: #374151; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; margin: 0 0.25rem; font-size: 0.95rem; }
        </style>
      </head>
      <body>
        <div class="no-print">
          <p style="margin: 0 0 0.75rem 0;">Klikni "Štampaj / Sačuvaj kao PDF" da preuzmeš procenu</p>
          <button onclick="window.print()">📥 Štampaj / Sačuvaj kao PDF</button>
        </div>

        <div class="header">
          <h1>PRESING IZDAVAŠTVO</h1>
          <p>Drvarska 7, Mladenovac</p>
          <p>📞 064/637-90-78  ✉ kr.presing@gmail.com  🌐 presing.org</p>
        </div>

        <div class="upozorenje">
          <strong>⚠ VAŽNA NAPOMENA</strong>
          <p>Ovo NIJE predračun. Ovo je orijentaciona procena cene. Tačan predračun ćemo Vam poslati nakon konsultacije sa našim urednikom.</p>
        </div>

        <h2 style="text-align: center; border: none;">PROCENA CENE ŠTAMPE</h2>
        <p class="datum">Datum: ${danas}</p>

        <h2>PARAMETRI</h2>
        <div class="red"><span>Format:</span><span>${r.format} (${dim[r.format]})</span></div>
        <div class="red"><span>Broj strana:</span><span>${r.strana}</span></div>
        <div class="red"><span>Tiraž:</span><span>${r.tiraz} primeraka</span></div>
        <div class="red"><span>Korice:</span><span>Mek povez</span></div>
        <div class="red"><span>Boja štampe:</span><span>${bt[r.boja]}</span></div>
        ${r.klapne ? '<div class="red"><span>Klapne:</span><span>Da</span></div>' : ''}
        ${r.dvostrano ? '<div class="red"><span>Dvostrana štampa korica:</span><span>Da</span></div>' : ''}

        <h2>KALKULACIJA</h2>
        <div class="red"><span>Štampa knjižnog bloka:</span><span>${r.strana} × ${r.cenaStampaPoStrani} RSD × ${r.tiraz} = ${fmt(r.ukupnoStampa)}</span></div>
        <div class="red"><span>Korice:</span><span>${r.cenaKoricaPoKomadu} RSD × ${r.tiraz} = ${fmt(r.ukupnoKorice)}</span></div>
        ${r.popustPrimijenjen ? '<div class="red" style="color: #6b7280; font-size: 0.85rem;"><span>(Tiražni popust primenjen)</span><span></span></div>' : ''}
        
        <div class="red bold"><span>PROCENA UKUPNO:</span><span>${fmt(r.ukupno)}</span></div>
        <div class="red"><span>Po komadu:</span><span>${fmt(r.poKomadu)}</span></div>
        <div class="red"><span>Rok izrade:</span><span>10 radnih dana od potvrde pripreme</span></div>

        <div class="napomene">
          <p>• Cena dostave nije uračunata.</p>
          <p>• Dostava: CC Paket (Pošta) ili Post Express, po cenovniku.</p>
          <p>• Tačan predračun šaljemo nakon konsultacije sa urednikom.</p>
          <p>• Ova procena je orijentaciona i ne predstavlja zvaničnu ponudu.</p>
        </div>

        <div class="footer">
          © Presing izdavaštvo, 2026 &nbsp;|&nbsp; presing.org
        </div>
      </body>
      </html>
    `;
    
    try {
      // Generišem download direktno bez pop-up-a
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Presing_procena_${danas.replace(/\./g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      sT("✓ Procena preuzeta! Otvori fajl i klikni Štampaj za PDF");
    } catch (e) {
      sT("Greška: " + e.message);
      console.error(e);
    }
  };

  const otvForm = () => {
    setFD({ ...fD, format: calcD.format, strana: calcD.strana, tiraz: calcD.tiraz, korice: calcD.korice, boja: calcD.boja, klapne: calcD.klapne, dvostrano: calcD.dvostrano });
    setPog("formular");
  };

  return (
    <>
      <Head>
        <title>Presing štamparija</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </Head>
      {!otv && (
        <button onClick={() => setOtv(true)} style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem",
          background: "#374151", color: "white", border: "none",
          borderRadius: "50%", width: 64, height: 64, fontSize: "1.6rem",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          zIndex: 100, fontFamily: "'Inter', sans-serif"
        }}>🖨</button>
      )}
      {otv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "'Inter', sans-serif" }} onClick={() => setOtv(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", width: "100%", maxWidth: 480, height: "92vh", borderRadius: "16px 16px 0 0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 -8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ background: "#374151", color: "white", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {pog !== "meni" && (
                <button onClick={() => { setPog("meni"); setPoruke([]); setBrP(0); setKProsla(false); setNjP(false); setZav(false); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontSize: "1rem" }}>‹</button>
              )}
              <div style={{ background: "white", color: "#374151", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🖨</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Presing štamparija</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.85, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}></span>
                  AI asistent · online
                </div>
              </div>
              <button onClick={() => setOtv(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontSize: "1.1rem" }}>×</button>
            </div>
            <div style={{ background: "#f9fafb", padding: "0.55rem 1rem", borderBottom: "1px solid #e5e7eb", fontSize: "0.7rem", color: "#6b7280", display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
              <span>📚 2.000+ izdanja</span><span>·</span>
              <span>⏱ Od 2015.</span><span>·</span>
              <span>🇩🇪🇳🇴 Premijum papir</span>
            </div>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {pog === "meni" && (
                <div style={{ padding: "1.25rem", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>Kako mogu da Vam pomognem?</h2>
                  <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6, marginBottom: "1.25rem" }}>Možete da:</p>
                  <Md ikona="💬" naslov="1. Postavite pitanje" opis="Bilo koje pitanje u vezi sa cenom štampe, rokovima, kvalitetom papira, dostavom ili drugim stvarima." onClick={() => setPog("razgovor")} />
                  <Md ikona="🧮" naslov="2. Izračunajte cenu" opis="Brzi kalkulator — unesite parametre i odmah vidite procenu cene. Možete preuzeti PDF." onClick={() => setPog("kalkulator")} />
                  <Md ikona="📋" naslov="3. Popunite formular" opis="Ostavite podatke o formatu, broju strana, pripremi za štampu — dobijate predračun." onClick={() => setPog("formular")} />
                  <Md ikona="✉" naslov="4. Kontaktirajte urednika" opis="Pošaljite poruku, pišite na kr.presing@gmail.com ili pozovite 064/637-90-78." onClick={() => setPog("kontakt")} />
                </div>
              )}
              {pog === "razgovor" && (
                <>
                  <div ref={ref} style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#f9fafb" }}>
                    {poruke.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: m.tip === "user" ? "flex-end" : "flex-start", marginBottom: "0.7rem" }}>
                        <div style={{ background: m.tip === "user" ? "#374151" : "white", color: m.tip === "user" ? "white" : "#111827", padding: "0.7rem 0.95rem", borderRadius: m.tip === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", maxWidth: "82%", fontSize: "0.88rem", lineHeight: 1.55, whiteSpace: "pre-wrap", border: m.tip === "user" ? "none" : "1px solid #e5e7eb" }}>{m.tekst}</div>
                      </div>
                    ))}
                    {kPit && !kProsla && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.7rem" }}>
                        {kPit.o.map((opc, idx) => (
                          <button key={idx} onClick={() => odgK(idx)} style={{ background: "white", border: "1px solid #d1d5db", padding: "0.65rem 0.9rem", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: "0.85rem", color: "#111827", fontFamily: "inherit" }}>📖 {opc}</button>
                        ))}
                      </div>
                    )}
                    {poruke.some(m => m.tip === "ai-njuzleter") && njP && (
                      <button onClick={() => setPog("njuzleter")} style={{ background: "white", border: "1px solid #d1d5db", padding: "0.55rem 0.9rem", borderRadius: 8, cursor: "pointer", fontSize: "0.82rem", color: "#111827", fontFamily: "inherit", marginBottom: "0.7rem" }}>✉ Prijavi me za njuzleter</button>
                    )}
                    {poruke.some(m => m.tip === "ai-upozorenje") && (
                      <button onClick={() => setPog("kontakt")} style={{ background: "white", border: "1px solid #d1d5db", padding: "0.65rem 0.9rem", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", color: "#111827", fontFamily: "inherit", marginBottom: "0.7rem", width: "100%", textAlign: "left" }}>📋 Ostavi podatke za urednika</button>
                    )}
                    {zav && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
                        <button onClick={() => setPog("formular")} style={{ background: "#374151", color: "white", border: "none", padding: "0.7rem", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: "0.88rem", fontFamily: "inherit" }}>📋 Popuni formular</button>
                        <button onClick={() => setPog("kontakt")} style={{ background: "white", color: "#111827", border: "1px solid #d1d5db", padding: "0.7rem", borderRadius: 8, cursor: "pointer", fontSize: "0.88rem", fontFamily: "inherit" }}>✉ Kontaktiraj urednika</button>
                      </div>
                    )}
                    {tipka && (
                      <div style={{ display: "flex", gap: "4px", padding: "0.7rem 0.95rem", background: "white", borderRadius: 12, width: "fit-content", border: "1px solid #e5e7eb" }}>
                        <span style={{ width: 6, height: 6, background: "#9ca3af", borderRadius: "50%", animation: "bn 1.2s infinite" }}></span>
                        <span style={{ width: 6, height: 6, background: "#9ca3af", borderRadius: "50%", animation: "bn 1.2s infinite 0.2s" }}></span>
                        <span style={{ width: 6, height: 6, background: "#9ca3af", borderRadius: "50%", animation: "bn 1.2s infinite 0.4s" }}></span>
                      </div>
                    )}
                  </div>
                  <style>{`@keyframes bn { 0%,80%,100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }`}</style>
                  {!zav && !kPit && (
                    <div style={{ padding: "0.75rem", borderTop: "1px solid #e5e7eb", background: "white" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input value={unos} onChange={(e) => setUnos(e.target.value)} onKeyDown={(e) => e.key === "Enter" && slPit()} placeholder="Postavite pitanje..." maxLength={500} disabled={tipka} style={{ flex: 1, padding: "0.7rem 0.85rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.9rem", fontFamily: "inherit", outline: "none" }} />
                        <button onClick={slPit} disabled={tipka || !unos.trim()} style={{ background: "#374151", color: "white", border: "none", padding: "0.7rem 1.1rem", borderRadius: 8, cursor: tipka || !unos.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "inherit", opacity: tipka || !unos.trim() ? 0.5 : 1 }}>→</button>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.4rem", textAlign: "right" }}>Pitanja: {brP}/15</div>
                    </div>
                  )}
                </>
              )}
              {pog === "kalkulator" && (
                <div style={{ padding: "1.25rem", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem" }}>🧮 Kalkulator cene</h2>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 }}>Unesite parametre — odmah vidite procenu cene.</p>
                  <Fs label="Format" value={calcD.format} onChange={v => setCalcD({ ...calcD, format: v })} options={[{ v: "B6", l: "B6 (125×175 mm)" }, { v: "A5", l: "A5 (140×200 mm)" }, { v: "B5", l: "B5 (175×250 mm)" }, { v: "A4", l: "A4 (208×291 mm)" }]} />
                  <Fp label="Broj strana" type="number" value={calcD.strana} onChange={v => setCalcD({ ...calcD, strana: v })} />
                  <Fp label="Tiraž (4 - 1.000)" type="number" value={calcD.tiraz} onChange={v => setCalcD({ ...calcD, tiraz: v })} />
                  <Fs label="Korice" value={calcD.korice} onChange={v => setCalcD({ ...calcD, korice: v })} options={[{ v: "mek", l: "Mek povez" }, { v: "tvrd", l: "Tvrd povez (po dogovoru)" }]} />
                  <Fs label="Boja štampe" value={calcD.boja} onChange={v => setCalcD({ ...calcD, boja: v })} options={[{ v: "cb", l: "Crno-bela" }, { v: "kolor_malo", l: "Kolor (manji broj strana)" }, { v: "kolor_cela", l: "Kolor (cela knjiga)" }]} />
                  {(calcD.format === "B6" || calcD.format === "A5") && calcD.korice === "mek" && (
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", fontSize: "0.85rem", color: "#374151" }}>
                      <input type="checkbox" checked={calcD.klapne} onChange={e => setCalcD({ ...calcD, klapne: e.target.checked })} />
                      Sa klapnama (+20 RSD/komad)
                    </label>
                  )}
                  {calcD.korice === "mek" && (
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", fontSize: "0.85rem", color: "#374151" }}>
                      <input type="checkbox" checked={calcD.dvostrano} onChange={e => setCalcD({ ...calcD, dvostrano: e.target.checked })} />
                      Dvostrana štampa korica (+40 RSD/komad)
                    </label>
                  )}
                  {calcR && calcR.tvrdPovez && (
                    <div style={{ marginTop: "1rem", padding: "1rem", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 10 }}>
                      <p style={{ fontSize: "0.88rem", color: "#78350f", lineHeight: 1.5 }}>
                        <strong>Tvrd povez</strong> ide po dogovoru s urednikom. Javite nam kroz formular ili pozovite 064/637-90-78 — pripremićemo Vam ponudu.
                      </p>
                    </div>
                  )}
                  {calcR && !calcR.tvrdPovez && (
                    <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10 }}>
                      <div style={{ fontSize: "0.7rem", color: "#92400e", background: "#fef3c7", padding: "0.4rem 0.6rem", borderRadius: 4, marginBottom: "0.85rem" }}>
                        ⚠ Ovo nije predračun. Ovo je orijentaciona procena.
                      </div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem" }}>📊 Procena cene</h3>
                      <Rr l="Štampa knjižnog bloka" v={fmt(calcR.ukupnoStampa)} />
                      <Rr l="Korice" v={fmt(calcR.ukupnoKorice)} />
                      <div style={{ borderTop: "1px solid #d1d5db", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                        <Rr l="UKUPNO" v={fmt(calcR.ukupno)} bold />
                        <Rr l="Po komadu" v={fmt(calcR.poKomadu)} />
                        <Rr l="Rok" v="10 radnih dana" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                        <button onClick={genPDF} style={{ background: "#374151", color: "white", border: "none", padding: "0.7rem", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: "0.88rem", fontFamily: "inherit" }}>📥 Preuzmi PDF</button>
                        <button onClick={otvForm} style={{ background: "white", color: "#111827", border: "1px solid #d1d5db", padding: "0.7rem", borderRadius: 8, cursor: "pointer", fontSize: "0.88rem", fontFamily: "inherit" }}>📋 Pošalji upit za potvrdu</button>
                        <button onClick={() => setPog("razgovor")} style={{ background: "white", color: "#111827", border: "1px solid #d1d5db", padding: "0.7rem", borderRadius: 8, cursor: "pointer", fontSize: "0.88rem", fontFamily: "inherit" }}>💬 Imam pitanje</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {pog === "formular" && (
                <div style={{ padding: "1.25rem", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem" }}>📋 Formular za predračun</h2>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 }}>Popunite podatke i poslaćemo Vam tačan predračun.</p>
                  <Fp label="Ime i prezime" value={fD.ime} onChange={v => setFD({ ...fD, ime: v })} />
                  <Fp label="Mejl" type="email" value={fD.mejl} onChange={v => setFD({ ...fD, mejl: v })} />
                  <Fp label="Telefon" type="tel" value={fD.telefon} onChange={v => setFD({ ...fD, telefon: v })} />
                  <Fs label="Format" value={fD.format} onChange={v => setFD({ ...fD, format: v })} options={[{ v: "", l: "Izaberite..." }, { v: "B6", l: "B6" }, { v: "A5", l: "A5" }, { v: "B5", l: "B5" }, { v: "A4", l: "A4" }, { v: "specifican", l: "Specifičan" }]} />
                  <Fp label="Broj strana" type="number" value={fD.strana} onChange={v => setFD({ ...fD, strana: v })} />
                  <Fp label="Tiraž (4 - 1.000)" type="number" value={fD.tiraz} onChange={v => setFD({ ...fD, tiraz: v })} />
                  <Fs label="Korice" value={fD.korice} onChange={v => setFD({ ...fD, korice: v })} options={[{ v: "", l: "..." }, { v: "mek", l: "Mek povez" }, { v: "tvrd", l: "Tvrd povez" }]} />
                  <Fs label="Boja" value={fD.boja} onChange={v => setFD({ ...fD, boja: v })} options={[{ v: "", l: "..." }, { v: "cb", l: "Crno-bela" }, { v: "kolor_malo", l: "Kolor (manji broj)" }, { v: "kolor_cela", l: "Kolor (cela)" }]} />
                  <Fs label="Papir" value={fD.papir} onChange={v => setFD({ ...fD, papir: v })} options={[{ v: "", l: "..." }, { v: "beli", l: "Beli 80g" }, { v: "voluminozni", l: "Voluminozni 80g" }, { v: "savetuj", l: "Savetujte" }]} />
                  <Fs label="Imam pripremu" value={fD.priprema} onChange={v => setFD({ ...fD, priprema: v })} options={[{ v: "", l: "..." }, { v: "imam", l: "Da, PDF spreman" }, { v: "nemam", l: "Ne, treba mi pomoć" }]} />
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.82rem", color: "#374151", marginBottom: "0.35rem", display: "block", fontWeight: 500 }}>Napomene</label>
                    <textarea value={fD.napomene} onChange={e => setFD({ ...fD, napomene: e.target.value })} maxLength={500} rows={3} style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.88rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={slF} style={{ background: "#374151", color: "white", border: "none", padding: "0.85rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", width: "100%", fontFamily: "inherit" }}>Pošalji upit</button>
                </div>
              )}
              {pog === "kontakt" && (
                <div style={{ padding: "1.25rem", overflowY: "auto" }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827", marginBottom: "0.4rem" }}>✉ Kontakt sa urednikom</h2>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 }}>1. Pošaljete poruku preko formulara<br />2. Pišete na: <strong>kr.presing@gmail.com</strong><br />3. Pozovete: <strong>064/637-90-78</strong></p>
                  <Fp label="Ime i prezime" value={kD.ime} onChange={v => setKD({ ...kD, ime: v })} />
                  <Fp label="Mejl" type="email" value={kD.mejl} onChange={v => setKD({ ...kD, mejl: v })} />
                  <Fp label="Telefon (opciono)" type="tel" value={kD.telefon} onChange={v => setKD({ ...kD, telefon: v })} />
                  <Fs label="Tema" value={kD.tema} onChange={v => setKD({ ...kD, tema: v })} options={[{ v: "Upit za štampu knjiga", l: "Upit za štampu knjiga" }, { v: "Slanje rukopisa na razmatranje", l: "Slanje rukopisa na razmatranje" }, { v: "Saradnja", l: "Saradnja" }, { v: "Drugo", l: "Drugo" }]} />
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.82rem", color: "#374151", marginBottom: "0.35rem", display: "block", fontWeight: 500 }}>Vaša poruka</label>
                    <textarea value={kD.poruka} onChange={e => setKD({ ...kD, poruka: e.target.value })} maxLength={1000} rows={5} placeholder="Detaljno opišite Vaš upit..." style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.88rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={slK} style={{ background: "#374151", color: "white", border: "none", padding: "0.85rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", width: "100%", fontFamily: "inherit" }}>Pošalji uredniku</button>
                </div>
              )}
              {pog === "njuzleter" && (
                <div style={{ padding: "1.5rem", overflowY: "auto" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✉</div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>Presing njuzleter</h2>
                  <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1.5rem", lineHeight: 1.6 }}>Vesti iz Presingove štamparije i izdavačke kuće. Šaljemo jednom mesečno.</p>
                  <Fp label="Ime i prezime" value={nD.imePrezime} onChange={v => setND({ ...nD, imePrezime: v })} />
                  <Fp label="Mejl" type="email" value={nD.mejl} onChange={v => setND({ ...nD, mejl: v })} />
                  <button onClick={slN} style={{ background: "#374151", color: "white", border: "none", padding: "0.85rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", width: "100%", fontFamily: "inherit" }}>Prijavi me</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#111827", color: "white", padding: "0.85rem 1.25rem", borderRadius: 8, fontSize: "0.88rem", zIndex: 2000, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", fontFamily: "'Inter', sans-serif", maxWidth: "90%", textAlign: "center" }}>{toast}</div>
      )}
    </>
  );
}

function Md({ ikona, naslov, opis, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "white", border: "1px solid #e5e7eb", padding: "1rem", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: "0.65rem" }}>
      <div style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>{ikona}</div>
      <div style={{ fontWeight: 600, color: "#111827", marginBottom: "0.25rem", fontSize: "0.95rem" }}>{naslov}</div>
      <div style={{ fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.5 }}>{opis}</div>
    </button>
  );
}

function Fp({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <label style={{ fontSize: "0.82rem", color: "#374151", marginBottom: "0.35rem", display: "block", fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.88rem", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
    </div>
  );
}

function Fs({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <label style={{ fontSize: "0.82rem", color: "#374151", marginBottom: "0.35rem", display: "block", fontWeight: 500 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.88rem", fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "white" }}>
        {options.map((opt, i) => <option key={i} value={opt.v}>{opt.l}</option>)}
      </select>
    </div>
  );
}

function Rr({ l, v, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: bold ? "0.95rem" : "0.85rem", fontWeight: bold ? 700 : 400, color: "#111827" }}>
      <span>{l}</span>
      <span>{v}</span>
    </div>
  );
}
