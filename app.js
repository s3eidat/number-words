/* Number to Words — English (cardinal, ordinal, cheque) and Arabic tafqeet with currency, gender and number agreement. */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$;
  var MAX_INT = 999999999999999n; // 999 trillion

  // ---------- currencies ----------
  // en: [singular, plural]; ar: {s: singular, d: dual, p: plural (3-10), a: accusative singular (11-99), f: feminine noun?}
  var CUR = {
    none: { label: "No currency" },
    JOD: { label: "Jordanian dinar (JOD)", per: 1000, en: ["dinar", "dinars"], enSub: ["fils", "fils"],
      ar: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً" }, arSub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً" } },
    USD: { label: "US dollar (USD)", per: 100, en: ["dollar", "dollars"], enSub: ["cent", "cents"],
      ar: { s: "دولار", d: "دولاران", p: "دولارات", a: "دولاراً" }, arSub: { s: "سنت", d: "سنتان", p: "سنتات", a: "سنتاً" } },
    SAR: { label: "Saudi riyal (SAR)", per: 100, en: ["riyal", "riyals"], enSub: ["halala", "halalas"],
      ar: { s: "ريال", d: "ريالان", p: "ريالات", a: "ريالاً" }, arSub: { s: "هللة", d: "هللتان", p: "هللات", a: "هللة", f: true } },
    AED: { label: "UAE dirham (AED)", per: 100, en: ["dirham", "dirhams"], enSub: ["fils", "fils"],
      ar: { s: "درهم", d: "درهمان", p: "دراهم", a: "درهماً" }, arSub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً" } },
    KWD: { label: "Kuwaiti dinar (KWD)", per: 1000, en: ["dinar", "dinars"], enSub: ["fils", "fils"],
      ar: { s: "دينار", d: "ديناران", p: "دنانير", a: "ديناراً" }, arSub: { s: "فلس", d: "فلسان", p: "فلوس", a: "فلساً" } },
    EGP: { label: "Egyptian pound (EGP)", per: 100, en: ["pound", "pounds"], enSub: ["piastre", "piastres"],
      ar: { s: "جنيه", d: "جنيهان", p: "جنيهات", a: "جنيهاً" }, arSub: { s: "قرش", d: "قرشان", p: "قروش", a: "قرشاً" } },
    GBP: { label: "British pound (GBP)", per: 100, en: ["pound", "pounds"], enSub: ["penny", "pence"],
      ar: { s: "جنيه", d: "جنيهان", p: "جنيهات", a: "جنيهاً" }, arSub: { s: "بنس", d: "بنسان", p: "بنسات", a: "بنساً" } }
  };

  // ---------- parsing ----------
  // Returns {neg, int: BigInt, frac: "digits as typed"} or {error}
  function parse(raw) {
    var s = String(raw).trim()
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x6F0); })
      .replace(/٫/g, ".").replace(/[,٬_\s']/g, "");
    if (!s) return { empty: true };
    var m = /^([-+−]?)(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (!m[2] && !m[3])) return { error: "That isn't a number. Use digits, with an optional decimal point." };
    var int = BigInt(m[2] || "0");
    if (int > MAX_INT) return { error: "Numbers up to 999 trillion (15 digits) are supported." };
    return { neg: m[1] === "-" || m[1] === "−", int: int, frac: m[3] || "" };
  }
  // Split into main units and sub-units, rounding half up to the currency's precision.
  function money(p, per) {
    var digits = per === 1000 ? 3 : 2, f = (p.frac + "000").slice(0, digits), next = +(p.frac.charAt(digits) || 0);
    var total = p.int * BigInt(per) + BigInt(f) + (next >= 5 ? 1n : 0n);
    return { main: total / BigInt(per), sub: Number(total % BigInt(per)) };
  }
  function groups(n) { var g = []; n = BigInt(n); do { g.push(Number(n % 1000n)); n /= 1000n; } while (n > 0n); return g; } // least significant first

  // ---------- English ----------
  var EN1 = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var EN10 = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  var ENS = ["", "thousand", "million", "billion", "trillion"];
  function en100(n) { return n < 20 ? EN1[n] : EN10[Math.floor(n / 10)] + (n % 10 ? "-" + EN1[n % 10] : ""); }
  function en1000(n, brit) {
    var h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(EN1[h] + " hundred");
    if (r) out.push((h && brit ? "and " : "") + en100(r));
    return out.join(" ");
  }
  function enInt(n, brit) {
    n = BigInt(n);
    if (n > MAX_INT) throw new Error("over 999 trillion");
    if (n === 0n) return "zero";
    var g = groups(n), parts = [];
    for (var i = g.length - 1; i >= 0; i--) {
      if (!g[i]) continue;
      var w = en1000(g[i], brit);
      // British: "one thousand and five" when the last group is under 100
      if (brit && i === 0 && g.length > 1 && g[0] < 100) w = "and " + w;
      parts.push(w + (i ? " " + ENS[i] : ""));
    }
    return parts.join(" ");
  }
  var ORD = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
  function enOrdinal(words) {
    return words.replace(/([a-z]+)$/, function (w) { return ORD[w] || (/y$/.test(w) ? w.slice(0, -1) + "ieth" : w + "th"); });
  }
  function ordSuffix(n) { n = BigInt(n); var t = Number(n % 100n), u = Number(n % 10n); return (t >= 11 && t <= 13) ? "th" : ["th", "st", "nd", "rd"][u] || "th"; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function enCheque(p, c, o) {
    var m = money(p, c.per), parts = [], digits = c.per === 1000 ? 3 : 2;
    if (o.subStyle === "fraction") {
      var main = enInt(m.main, o.brit), frac = String(m.sub).padStart(digits, "0") + "/" + c.per;
      return cap(main + " and " + frac + " " + (m.main === 1n ? c.en[0] : c.en[1])) + (o.only ? " only" : "");
    }
    if (m.main > 0n || m.sub === 0) parts.push(enInt(m.main, o.brit) + " " + (m.main === 1n ? c.en[0] : c.en[1]));
    if (m.sub) parts.push(enInt(m.sub, o.brit) + " " + (m.sub === 1 ? c.enSub[0] : c.enSub[1]));
    return cap(parts.join(" and ")) + (o.only ? " only" : "");
  }
  function enCardinal(p, brit) {
    var w = enInt(p.int, brit);
    if (p.frac) w += " point " + Array.from(p.frac).map(function (d) { return EN1[+d]; }).join(" ");
    return (p.neg && (p.int > 0n || /[1-9]/.test(p.frac)) ? "minus " : "") + w;
  }

  // ---------- Arabic ----------
  var AR_M = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"]; // forms used with a masculine noun
  var AR_F = ["", "واحدة", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثماني", "تسع", "عشر"];      // forms used with a feminine noun
  var AR_TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  var AR_H = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  var AR_SCALE = [null,
    { s: "ألف", d: "ألفان", dc: "ألفا", p: "آلاف", a: "ألفاً" },
    { s: "مليون", d: "مليونان", dc: "مليونا", p: "ملايين", a: "مليوناً" },
    { s: "مليار", d: "ملياران", dc: "مليارا", p: "مليارات", a: "ملياراً" },
    { s: "تريليون", d: "تريليونان", dc: "تريليونا", p: "تريليونات", a: "تريليوناً" }];

  function ar100(n, fem) {
    if (n <= 10) return (fem ? AR_F : AR_M)[n];
    if (n === 11) return fem ? "إحدى عشرة" : "أحد عشر";
    if (n === 12) return fem ? "اثنتا عشرة" : "اثنا عشر";
    if (n < 20) return (fem ? AR_F : AR_M)[n - 10] + (fem ? " عشرة" : " عشر");
    var u = n % 10, t = AR_TENS[Math.floor(n / 10)];
    if (!u) return t;
    var unit = u === 1 ? (fem ? "إحدى" : "واحد") : (fem ? AR_F : AR_M)[u];
    return unit + " و" + t;
  }
  // construct: "مائتان" becomes "مائتا" when a noun follows it directly (مائتا ألف، مائتا دينار)
  function ar1000(n, fem, construct) {
    var h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(h === 2 && !r && construct ? "مائتا" : AR_H[h]);
    if (r) out.push(ar100(r, fem));
    return out.join(" و");
  }
  // Number words; `fem` applies to the last (units) group, `nounFollows` turns a trailing dual into its construct form.
  function arInt(n, fem, nounFollows) {
    n = BigInt(n);
    if (n > MAX_INT) throw new Error("over 999 trillion");
    if (n === 0n) return "صفر";
    var g = groups(n), parts = [];
    var lowest = g.findIndex(function (x) { return x !== 0; });
    for (var i = g.length - 1; i >= 0; i--) {
      var v = g[i]; if (!v) continue;
      var last = i === lowest;
      if (i === 0) { parts.push(ar1000(v, fem, nounFollows && last)); continue; }
      var sc = AR_SCALE[i], r = v % 100, w;
      if (v === 1) w = sc.s;
      else if (v === 2) w = last && nounFollows ? sc.dc : sc.d;
      else if (v <= 10) w = ar100(v, false) + " " + sc.p;
      else if (v < 100) w = ar100(v, false) + " " + sc.a;
      else w = ar1000(v, false, true) + " " + (r === 0 || r <= 2 ? sc.s : r <= 10 ? sc.p : sc.a);
      parts.push(w);
    }
    return parts.join(" و");
  }
  // The counted noun's form depends on the number: 1 (noun + واحد), 2 (dual alone), 3-10 plural, 11-99 accusative, 100+ by the last two digits.
  function arCount(n, noun) {
    n = BigInt(n);
    var fem = !!noun.f;
    if (n === 1n) return noun.s + " " + (fem ? "واحدة" : "واحد");
    if (n === 2n) return noun.d;
    var r = Number(n % 100n);
    if (n < 100n) return arInt(n, fem) + " " + (n <= 10n ? noun.p : noun.a);
    if (r === 0) return arInt(n, fem, true) + " " + noun.s;
    return arInt(n, fem) + " " + (r <= 2 ? noun.s : r <= 10 ? noun.p : noun.a);
  }
  function arMoney(p, c, o) {
    var m = money(p, c.per), parts = [];
    if (m.main > 0n || m.sub === 0) parts.push(m.main === 0n ? "صفر " + c.ar.s : arCount(m.main, c.ar));
    if (m.sub) parts.push(arCount(m.sub, c.arSub));
    var s = parts.join(" و");
    if (o.only) s = "فقط " + s + " لا غير";
    return o.mia ? s.replace(/مائ/g, "مئ") : s;
  }
  function arCardinal(p, o) {
    var s = arInt(p.int, false);
    if (p.frac) {
      var lead = (/^0+/.exec(p.frac) || [""])[0], rest = p.frac.slice(lead.length);
      s += " فاصلة " + (Array.from(lead).map(function () { return "صفر"; }).concat(rest ? [arInt(BigInt(rest), false)] : [])).join(" ");
    }
    if (p.neg && (p.int > 0n || /[1-9]/.test(p.frac))) s = "سالب " + s;
    return o.mia ? s.replace(/مائ/g, "مئ") : s;
  }

  // ---------- UI ----------
  var DEF = { cur: "JOD", only: false, brit: false, subStyle: "words", mia: false };
  var o = Object.assign({}, DEF, S3.store("nw.opts") || {});
  if (!CUR[o.cur]) o.cur = "JOD";
  var sel = $("#cur");
  Object.keys(CUR).forEach(function (k) { sel.appendChild(S3.h("option", { value: k }, [CUR[k].label])); });
  sel.value = o.cur;
  $("#only").checked = o.only; $("#brit").checked = o.brit; $("#mia").checked = o.mia;
  $$("#substyle button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === o.subStyle)); });

  function fmtDigits(p) {
    var s = p.int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (p.neg ? "−" : "") + s + (p.frac ? "." + p.frac : "");
  }
  function setOut(id, text, dir) {
    var el = $("#" + id);
    el.textContent = text || "—";
    el.classList.toggle("nw-empty", !text);
    if (dir) el.dir = dir;
  }
  function render() {
    S3.store("nw.opts", o);
    var p = parse($("#num").value), err = $("#err"), c = CUR[o.cur], isMoney = o.cur !== "none";
    $("#substyle").hidden = !isMoney; $("#onlywrap").hidden = !isMoney;
    $$(".nw-money").forEach(function (el) { el.hidden = !isMoney; });
    err.hidden = true;
    if (p.empty || p.error) {
      ["en-card", "en-ord", "en-chq", "ar-money", "ar-card"].forEach(function (id) { setOut(id, ""); });
      $("#digits").textContent = "—";
      if (p.error) { err.hidden = false; err.textContent = p.error; }
      return;
    }
    $("#digits").textContent = fmtDigits(p) + (isMoney ? " " + o.cur : "");
    setOut("en-card", enCardinal(p, o.brit));
    var canOrd = !p.neg && !/[1-9]/.test(p.frac);
    setOut("en-ord", canOrd ? enOrdinal(enInt(p.int, o.brit)) + "  ·  " + p.int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ordSuffix(p.int) : "");
    setOut("ar-card", arCardinal(p, o), "rtl");
    if (isMoney) {
      var bad = p.neg ? "Amounts in words can't be negative." : money(p, c.per).main > MAX_INT ? "After rounding to " + c.per + " sub-units this is over 999 trillion." : "";
      if (bad) { err.hidden = false; err.textContent = bad; setOut("en-chq", ""); setOut("ar-money", ""); return; }
      setOut("en-chq", enCheque(p, c, o));
      setOut("ar-money", arMoney(p, c, o), "rtl");
    }
  }
  $("#num").addEventListener("input", S3.debounce(render, 60));
  sel.addEventListener("change", function () { o.cur = sel.value; render(); });
  $("#only").addEventListener("change", function () { o.only = this.checked; render(); });
  $("#brit").addEventListener("change", function () { o.brit = this.checked; render(); });
  $("#mia").addEventListener("change", function () { o.mia = this.checked; render(); });
  $$("#substyle button").forEach(function (b) {
    b.addEventListener("click", function () { o.subStyle = b.dataset.v; $$("#substyle button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render(); });
  });
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = $("#" + b.dataset.copy), t = el.textContent;
      if (!t || el.classList.contains("nw-empty")) { S3.toast("Nothing to copy yet", "error"); return; }
      S3.copy(b.dataset.copy === "en-ord" ? t.split("  ·  ")[0] : t); S3.done();
    });
  });
  $$(".nw-ex").forEach(function (b) { b.addEventListener("click", function () { $("#num").value = b.textContent; render(); }); });
  render();

  window.S3_DEMO = function () { $("#num").value = "1500.250"; o.cur = "JOD"; sel.value = "JOD"; render(); };

  window.S3_SELFTEST = function () {
    var fails = [];
    function eq(got, want, why) { if (got !== want) fails.push(why + ": got “" + got + "”"); }
    var JOD = CUR.JOD, SAR = CUR.SAR, USD = CUR.USD, opt = { only: false, brit: false, subStyle: "words" };
    function ar(x, c) { return arMoney(parse(x), c || JOD, opt); }
    eq(ar("1"), "دينار واحد", "1");
    eq(ar("2"), "ديناران", "2");
    eq(ar("3"), "ثلاثة دنانير", "3");
    eq(ar("10"), "عشرة دنانير", "10");
    eq(ar("11"), "أحد عشر ديناراً", "11");
    eq(ar("12"), "اثنا عشر ديناراً", "12");
    eq(ar("21"), "واحد وعشرون ديناراً", "21");
    eq(ar("100"), "مائة دينار", "100");
    eq(ar("103"), "مائة وثلاثة دنانير", "103");
    eq(ar("200"), "مائتا دينار", "200");
    eq(ar("1000"), "ألف دينار", "1000");
    eq(ar("2000"), "ألفا دينار", "2000");
    eq(ar("3000"), "ثلاثة آلاف دينار", "3000");
    eq(ar("1500.250"), "ألف وخمسمائة دينار ومائتان وخمسون فلساً", "1500.250");
    eq(ar("0.250"), "مائتان وخمسون فلساً", "0.250 only fils");
    eq(ar("1.001"), "دينار واحد وفلس واحد", "1 fils");
    eq(ar("5.002"), "خمسة دنانير وفلسان", "2 fils");
    eq(ar("1.0005"), "دينار واحد وفلس واحد", "rounding half up");
    eq(ar("0.03", SAR), "ثلاث هللات", "feminine 3");
    eq(ar("0.11", SAR), "إحدى عشرة هللة", "feminine 11");
    eq(ar("1.01", SAR), "ريال واحد وهللة واحدة", "feminine 1");
    eq(arMoney(parse("1500.25"), JOD, { only: true }), "فقط ألف وخمسمائة دينار ومائتان وخمسون فلساً لا غير", "only");
    eq(arInt(2000000n), "مليونان", "2 million");
    eq(arInt(11000n), "أحد عشر ألفاً", "11 thousand");
    eq(arInt(200000n), "مائتا ألف", "200 thousand");
    eq(arInt(150000n), "مائة وخمسون ألفاً", "150 thousand");
    eq(arInt(1234567n), "مليون ومائتان وأربعة وثلاثون ألفاً وخمسمائة وسبعة وستون", "1234567");
    eq(arInt(1000000000n), "مليار", "billion");
    eq(arCardinal(parse("3.05"), {}), "ثلاثة فاصلة صفر خمسة", "arabic decimal");
    eq(arMoney(parse("200"), JOD, { mia: true }), "مئتا دينار", "مئة spelling");
    eq(enInt(0n), "zero", "en 0");
    eq(enInt(21n), "twenty-one", "en 21");
    eq(enInt(105n), "one hundred five", "en 105");
    eq(enInt(105n, true), "one hundred and five", "en 105 british");
    eq(enInt(1005n, true), "one thousand and five", "en 1005 british");
    eq(enInt(1500n), "one thousand five hundred", "en 1500");
    eq(enInt(MAX_INT), "nine hundred ninety-nine trillion nine hundred ninety-nine billion nine hundred ninety-nine million nine hundred ninety-nine thousand nine hundred ninety-nine", "en max");
    eq(enOrdinal("twenty-one"), "twenty-first", "ord 21");
    eq(enOrdinal(enInt(12n)), "twelfth", "ord 12");
    eq(enOrdinal(enInt(40n)), "fortieth", "ord 40");
    eq(enOrdinal(enInt(100n)), "one hundredth", "ord 100");
    eq(ordSuffix(11n) + ordSuffix(22n) + ordSuffix(103n), "thndrd", "suffixes");
    eq(enCheque(parse("1500.25"), USD, opt), "One thousand five hundred dollars and twenty-five cents", "cheque");
    eq(enCheque(parse("1"), USD, opt), "One dollar", "cheque 1");
    eq(enCheque(parse("0.5"), USD, opt), "Fifty cents", "cheque cents only");
    eq(enCheque(parse("2.999"), USD, opt), "Three dollars", "cheque rounding");
    eq(enCheque(parse("1500.25"), USD, { subStyle: "fraction" }), "One thousand five hundred and 25/100 dollars", "cheque fraction");
    eq(enCheque(parse("1500.250"), JOD, { only: true }), "One thousand five hundred dinars and two hundred fifty fils only", "cheque JOD");
    eq(enCardinal(parse("-12.05")), "minus twelve point zero five", "cardinal decimal");
    eq(parse("١٬٥٠٠٫٢٥").int + "|" + parse("١٬٥٠٠٫٢٥").frac, "1500|25", "Arabic-Indic digits");
    if (!parse("1e5").error || !parse("1000000000000000").error) fails.push("invalid input accepted");
    if (!(money(parse("999999999999999.999"), 100).main > MAX_INT)) fails.push("rounding overflow not detectable");
    if (fails.length) console.error("selftest: " + fails.join("; "));
    return fails.length === 0;
  };
})();
