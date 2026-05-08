// =============================================================================
// PRESING ŠTAMPARIJA — BACKEND ZA AI RAZGOVOR
// =============================================================================
// Ovaj fajl ide na Vercel kao serverless funkcija na putanji /api/chat
// Komunicira sa Anthropic API i vraća odgovore klijentu
// API ključ se čuva u Vercel Environment Variables (bezbedno)
// =============================================================================

// =============================================================================
// 1. KOMPAKTAN SISTEM PROMPT (~800 tokena)
// =============================================================================
const SYSTEM_PROMPT = `Ti si Presingov AI asistent za štampariju. Odgovaraš na pitanja o štampi knjiga.

PRAVILA:
- Jezik: ISKLJUČIVO ekavica (uvek "lepo" ne "lijepo", "rešenje" ne "rješenje")
- Tema: SAMO o štampi knjiga u Presingu (formati, cene, papir, korice, rok, dostava, priprema)
- Ako pitaju o nečem drugom (politika, lični saveti, druge usluge) — ljubazno preusmeri: "Mogu da pomognem samo oko štampe knjiga u Presingu."
- Ton: profesionalno-toplo, kratko i jasno
- Format: kratki odgovori sa primerima, koristi listu kad ima više stavki
- Terminologija: "premijum" ne "premium", "mejl" ne "email", "rikna" ne "hrbat", "knjige malog obima" ne "kratke knjige", "više od" ne "preko"
- NE izmišljaj cene, rokove, usluge — ako nisi siguran, kaži: "Za to specifično pitanje kontaktirajte urednika na 064/637-90-78 ili kr.presing@gmail.com"

PRESING ŠTAMPARIJA — KLJUČNE INFORMACIJE:

FORMATI:
- B6: 125x175 mm
- A5: 140x200 mm (najpopularniji)
- B5: 175x250 mm
- A4: 208x291 mm

CENE ŠTAMPE (RSD/strana):
- B6: 0,80 (CB) | 5 (kolor do 30%) | 3 (kolor cela)
- A5: 1,10 | 6 | 4
- B5: 1,40 | 7 | 5
- A4: 2,20 | 12 | 8

KORICE MEK POVEZ (RSD/komad):
- B6: 60 (sa klapnom 80)
- A5: 60 (klapne +20, dvostrano +40)
- B5: 80
- A4: 80

TIRAŽNI POPUSTI (samo CB + mek):
- 300+ kom: -0,10 RSD/strana, -10 RSD/korice
- 500+ kom: -0,20 RSD/strana, -20 RSD/korice

PARAMETRI:
- Min tiraž: 4 primerka. Max: 1.000 (preko — kontakt sa urednikom)
- Rok: 10 radnih dana od potvrde pripreme
- Papir: premijum 80g iz Nemačke i Norveške (beli ili voluminozni)
- Dostava: CC Paket ili Post Express
- Tvrd povez: po dogovoru sa urednikom
- ISBN/CIP: autorsko izdanje (klijent sam) ili Presing izdanje (uz procenu)
- Plaćanje: filozofija dogovora, "krug poverenja"
- Tehnička priprema: PDF u CMYK, 3mm bleed, 300dpi

ISKUSTVO:
- Štamparija postoji od 2015.
- Više od 2.000 različitih izdanja
- Ukupan tiraž: pola miliona primeraka
- Partneri: Alma, Bedem, Štrik, Poetikum, Ključ, MUK, Litera, Šraf, fakulteti, časopisi, biblioteke

KONTAKT URBANIK:
- Mejl: kr.presing@gmail.com
- Telefon: 064/637-90-78
- Adresa: Drvarska 7, Mladenovac

VAŽNO ZA ODGOVORE:
- Tačan predračun se uvek šalje nakon konsultacije sa urednikom
- Klijent može da koristi kalkulator ili formular u prozoru
- Za specifična/složena pitanja preusmeri na urednika`;


// =============================================================================
// 2. STANDARDNI ODGOVORI (BAZA ZNANJA — pre AI poziva, BESPLATNO)
// =============================================================================
const STANDARDNI_ODGOVORI = {
  formati: {
    pitanja: ["formate", "format", "veličina", "dimenzij", "dimenzije"],
    odgovor: `Radimo četiri formata knjiga:

• B6 — 125×175 mm
• A5 — 140×200 mm ili 145×205 mm
• B5 — 175×250 mm
• A4 — 208×291 mm

Tvrde korice se rade za sve formate, po dogovoru sa urednikom.`
  },
  cena_okvirno: {
    pitanja: ["okvirno", "orijentaciono", "koliko otprilike"],
    odgovor: `Okvirno za štampu (po strani):

• B6 — od 0,80 RSD/strana
• A5 — od 1,10 RSD/strana
• B5 — od 1,40 RSD/strana
• A4 — od 2,20 RSD/strana

Plus korice (60-80 RSD/komad). Za tačnu procenu možete koristiti kalkulator u ovom prozoru.`
  },
  papir: {
    pitanja: ["papir", "kvalitet papira", "tip papira"],
    odgovor: `Štampamo na premijum papiru 80g iz Nemačke i Norveške:

• Beli 80g — klasičan, beli ton
• Voluminozni 80g — toplije nijanse, knjiga deluje malo deblja

Cena je ista za oba tipa.`
  },
  rok: {
    pitanja: ["rok", "koliko traje", "kada gotovo"],
    odgovor: `Od trenutka kada potvrdimo da je priprema za štampu pravilno urađena, rok je 10 radnih dana.

Za hitne slučajeve — javite nam, pa ćemo videti šta možemo da uradimo.`
  },
  korice: {
    pitanja: ["korice", "povez"],
    odgovor: `Radimo oba tipa korica:

📕 MEK POVEZ
Standardna ponuda. Kolor štampa, mat ili sjaj laminacija, papir 300g.
60-80 RSD po komadu, zavisno od formata.

📗 TVRD POVEZ
Tvrd povez ide po dogovoru sa urednikom — javite nam, pa ćemo poslati ponudu.`
  },
  tiraz: {
    pitanja: ["minimalan tiraž", "minimum primeraka", "najmanji tiraž"],
    odgovor: `Najmanji tiraž je 4 primerka. Veći tiraž obara cenu po komadu:

• 300+ primeraka: -0,10 RSD/strana, -10 RSD/korice
• 500+ primeraka: -0,20 RSD/strana, -20 RSD/korice

Popusti važe za crno-belu štampu i mek povez.

Maksimalan tiraž koji nudimo automatski je 1.000 — za veće tiraže javite se uredniku direktno.`
  },
  dostava: {
    pitanja: ["dostav", "isporuk", "kurir", "slanje"],
    odgovor: `Šaljemo svuda u Srbiji i inostranstvu, preko dve poštanske usluge:

• CC Paket (Pošta Srbije) — jeftinije
• Post Express — brže

Tačnu cenu dostave šaljemo zajedno sa predračunom.`
  },
  isbn: {
    pitanja: ["ISBN", "CIP", "katalogizacija"],
    odgovor: `Zavisi koji put birate:

📕 AUTORSKO IZDANJE
Vi ste izdavač, sami nabavljate ISBN i CIP u Narodnoj biblioteci Srbije.

📗 PRESING IZDANJE
Ako želite da knjiga izađe pod imenom Presinga, mi obezbeđujemo ISBN i CIP. To podrazumeva procenu rukopisa i ponudu za uređivanje. Javite se ako Vas ovo zanima.`
  },
  reference: {
    pitanja: ["referenc", "iskustv", "ko ste vi", "od kada postoji"],
    odgovor: `Presing štamparija postoji od 2015. godine. Iza nas je više od 2.000 odštampanih različitih izdanja sa ukupnim tiražom od pola miliona primeraka.

Među našim partnerima su izdavači (Alma, Bedem, Štrik, Poetikum, Ključ, MUK, Litera, Šraf), književni časopisi, kulturne institucije i fakulteti.`
  }
};

// Funkcija za proveru baze znanja
function proveriBazu(pitanje) {
  const p = pitanje.toLowerCase();
  for (const [, vrednost] of Object.entries(STANDARDNI_ODGOVORI)) {
    for (const term of vrednost.pitanja) {
      if (p.includes(term.toLowerCase())) {
        return vrednost.odgovor;
      }
    }
  }
  return null;
}


// =============================================================================
// 3. ZAŠTITA — VALIDACIJA UNOSA
// =============================================================================
function validirajPitanje(pitanje) {
  if (!pitanje || typeof pitanje !== 'string') {
    return { valid: false, greska: 'Pitanje je obavezno' };
  }
  if (pitanje.length > 500) {
    return { valid: false, greska: 'Pitanje je predugačko (max 500 znakova)' };
  }
  if (pitanje.length < 2) {
    return { valid: false, greska: 'Pitanje je prekratko' };
  }
  
  // Anti-prompt-injection
  const sumnjive = ['ignore previous', 'ignore instructions', 'system:', 'role:', 'assistant:', 'jailbreak'];
  const lp = pitanje.toLowerCase();
  for (const s of sumnjive) {
    if (lp.includes(s)) {
      return { valid: false, greska: 'Pitanje sadrži nedozvoljen sadržaj' };
    }
  }
  
  return { valid: true };
}


// =============================================================================
// 4. RATE LIMITING (jednostavno — proverava IP)
// =============================================================================
const ipBrojanje = new Map();

function proveriRateLimit(ip) {
  const sad = Date.now();
  const minutu = 60 * 1000;
  
  if (!ipBrojanje.has(ip)) {
    ipBrojanje.set(ip, []);
  }
  
  const istorija = ipBrojanje.get(ip);
  // Ukloni stare zapise (starije od minut)
  const aktivni = istorija.filter(t => sad - t < minutu);
  
  if (aktivni.length >= 20) {
    return { valid: false, greska: 'Previše zahteva. Pokušajte za par minuta.' };
  }
  
  aktivni.push(sad);
  ipBrojanje.set(ip, aktivni);
  return { valid: true };
}


// =============================================================================
// 5. POZIV ANTHROPIC API
// =============================================================================
async function pozoviAI(pitanje, istorijaRazgovora = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('API ključ nije konfigurisan');
  }

  // Pravimo poruke za API
  const messages = [
    ...istorijaRazgovora,
    { role: 'user', content: pitanje }
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',  // Sonnet 4 — pravi balans cene i kvaliteta
      max_tokens: 500,  // Kratki odgovori — štedi novac
      
      // PROMPT CACHING — sistem prompt se kešuje za 90% jeftiniji input
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }  // Aktivira cache
        }
      ],
      
      messages: messages
    })
  });

  if (!response.ok) {
    const greska = await response.text();
    console.error('Anthropic API greška:', greska);
    throw new Error('Greška u komunikaciji sa AI');
  }

  const data = await response.json();
  
  // Vraćamo tekst odgovora + statistiku za praćenje troškova
  return {
    odgovor: data.content[0].text,
    upotreba: {
      input_tokens: data.usage.input_tokens,
      output_tokens: data.usage.output_tokens,
      cache_creation_tokens: data.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: data.usage.cache_read_input_tokens || 0
    }
  };
}


// =============================================================================
// 6. GLAVNA FUNKCIJA — VERCEL HANDLER
// =============================================================================
export default async function handler(req, res) {
  // Samo POST zahtevi
  if (req.method !== 'POST') {
    return res.status(405).json({ greska: 'Samo POST zahtevi su dozvoljeni' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { pitanje, istorija = [] } = req.body;
    
    // 1. Validacija pitanja
    const validacija = validirajPitanje(pitanje);
    if (!validacija.valid) {
      return res.status(400).json({ greska: validacija.greska });
    }

    // 2. Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const rateLimit = proveriRateLimit(ip);
    if (!rateLimit.valid) {
      return res.status(429).json({ greska: rateLimit.greska });
    }

    // 3. PROVERA BAZE ZNANJA — ako pitanje pokriveno, vrati odmah BESPLATNO
    const standardni = proveriBazu(pitanje);
    if (standardni) {
      return res.status(200).json({
        odgovor: standardni,
        izvor: 'baza',  // Klijent ne vidi, ali mi pratimo
        trosak: 0
      });
    }

    // 4. Ako nije u bazi, pozivamo AI
    const rezultat = await pozoviAI(pitanje, istorija);
    
    // Računamo trošak za praćenje
    const trosakUSD = (
      (rezultat.upotreba.input_tokens * 3 / 1_000_000) +
      (rezultat.upotreba.output_tokens * 15 / 1_000_000) +
      (rezultat.upotreba.cache_creation_tokens * 3.75 / 1_000_000) +
      (rezultat.upotreba.cache_read_tokens * 0.3 / 1_000_000)  // Cache je 90% jeftiniji
    );

    return res.status(200).json({
      odgovor: rezultat.odgovor,
      izvor: 'ai',
      trosak: trosakUSD,
      tokeni: rezultat.upotreba
    });

  } catch (greska) {
    console.error('Greška:', greska);
    return res.status(500).json({
      greska: 'Trenutno imamo tehnički problem. Pokušajte ponovo ili kontaktirajte urednika na 064/637-90-78.'
    });
  }
}
