import { createVideo } from "./engine";
import { table, rows, codePanel, type Val, type RowKey } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const RC = ["rgba(88,196,221,0.22)", "rgba(131,193,103,0.24)", "rgba(244,211,94,0.24)", "rgba(224,122,159,0.24)", "rgba(199,125,255,0.22)"];

v.centerTitle("Sessionizing a Clickstream", 0.2, 7.6, 70, 60, 640);
life(text("Raw events have timestamps but no notion of a {green:visit}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Rule: a gap of more than 30 minutes starts a new session.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 160,
  size: 21,
  width: 900,
  lines: [
    "WITH flagged AS (",
    "  SELECT *,",
    "    CASE WHEN LAG(event_time) OVER w IS NULL",
    "           OR event_time - LAG(event_time) OVER w",
    "              > INTERVAL 30 MINUTE",
    "         THEN 1 ELSE 0 END AS new_session",
    "  FROM ev",
    "  WINDOW w AS (PARTITION BY customer_id ORDER BY event_time)",
    ")",
    "SELECT *, SUM(new_session) OVER (",
    "  PARTITION BY customer_id ORDER BY event_time) AS session_no",
    "FROM flagged;",
  ],
});
code.at(
  [
    { t: 8, on: [7] },
    { t: 13, on: [2, 3, 4] },
    { t: 22, on: [5] },
    { t: 31, on: [9, 10] },
  ],
  [8.2, 49.6]
);

const EV: Val[][] = [
  ["11-01 13:17", "view", "", "", ""],
  ["11-02 16:25", "view", "", "", ""],
  ["11-03 18:19", "view", "", "", ""],
  ["11-03 18:20", "view", "", "", ""],
  ["11-03 18:24", "cart", "", "", ""],
  ["11-04 17:36", "view", "", "", ""],
  ["11-04 17:40", "cart", "", "", ""],
  ["11-04 17:47", "checkout", "", "", ""],
];
const GAP = ["NULL", "27 h", "26 h", "2 min", "4 min", "23 h", "5 min", "6 min"];
const NEW = [1, 1, 1, 0, 0, 1, 0, 0];
const SES = NEW.map((_, i) => NEW.slice(0, i + 1).reduce((a, b) => a + b, 0));
const T = table(v, {
  x: 1010,
  y: 160,
  rowH: 54,
  size: 24,
  title: "customer 127",
  titleColor: C.blue,
  cols: [
    { key: "event_time", w: 190 },
    { key: "type", w: 140 },
    { key: "gap", w: 120, align: "right" },
    { key: "new", w: 110, align: "center" },
    { key: "session_no", w: 150, align: "center" },
  ],
  rows: EV,
});
const k: RowKey[] = [{ t: 0, cols: [true, true, false, false, false], dur: 0.01 }];
k.push({ t: 13.5, cols: [true, true, true, false, false] });
EV.forEach((_, i) => k.push({ t: 14 + i * 0.8, set: [[i, 2, GAP[i]]], dur: 0.2 }));
k.push({ t: 22.5, cols: [true, true, true, true, false] });
EV.forEach((_, i) => k.push({ t: 23 + i * 0.8, set: [[i, 3, NEW[i]]], bg: EV.map((_, j) => (j <= i && NEW[j] ? "rgba(244,211,94,0.2)" : null)), dur: 0.2 }));
k.push({ t: 31.5, cols: [true, true, true, true, true], bg: EV.map(() => null) });
EV.forEach((_, i) => k.push({ t: 32 + i * 0.8, set: [[i, 4, SES[i]]], bg: EV.map((_, j) => (j <= i ? RC[(SES[j] - 1) % 5] : null)), dur: 0.2 }));
rows(v, T, k, [9, 49.6]);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 900, color }), a, b, "fade");
L("{blue:1.} Per customer, in time order: that's the WINDOW.", 9, 49.6, 680);
L("{blue:2.} LAG gives the previous event's time; subtract to get the gap.", 14, 49.6, 735);
L("{blue:3.} Flag the first event, and any event after a gap over 30 min.", 23, 49.6, 790);
L("{blue:4.} A running SUM of the flags numbers the sessions: 1, 2, 3, 3, 3, 4...", 32, 49.6, 845);
L("Then GROUP BY customer, session_no for start, end, event count.", 41, 49.6, 910, C.green);

// cohorts
v.centerTitle("Retention Cohorts in Three Steps", 50.2, 71.6, 70, 52, 600);
const CS: [string, string][] = [
  ["Cohort", "each customer's first-order month:  MIN(order_date), truncated to month"],
  ["Age", "for every order, months since that cohort:  date_diff('month', cohort, order_month)"],
  ["Count", "distinct customers per (cohort, age), divided by the cohort's size at age 0"],
];
CS.forEach(([a, b], i) => {
  life(text(`{blue:${a}}`, { x: 160, y: 190 + i * 80 }, { size: 34 }), 51 + i * 1.6, 71.6, "fade");
  life(text(b, { x: 400, y: 192 + i * 80 }, { size: 30 }), 51.2 + i * 1.6, 71.6, "fade");
});
const CO = table(v, {
  x: 460,
  y: 470,
  rowH: 56,
  size: 26,
  cols: [
    { key: "cohort", w: 200 },
    { key: "customers", w: 190, align: "right" },
    { key: "month 1", w: 170, align: "right" },
    { key: "month 2", w: 170, align: "right" },
    { key: "month 3", w: 170, align: "right" },
  ],
  rows: [
    ["2025-08", 8, "25%", "38%", "25%"],
    ["2025-09", 6, "0%", "33%", "33%"],
    ["2025-10", 11, "36%", "36%", null],
    ["2025-11", 20, "30%", null, null],
    ["2025-12", 21, null, null, null],
  ],
});
rows(v, CO, [{ t: 0, dur: 0.01 }], [56, 71.6]);
life(text("Use NULL, not 0, for months that haven't happened yet. Small cohorts swing wildly: 1 customer of 6 is 17 points.", { x: W / 2, y: 820 }, { size: 28, ax: 0.5, color: C.yellow }), 60, 71.6, "fade");

// A/B
v.centerTitle("An A/B Test in SQL", 72.2, 92.6, 70, 52, 420);
const AB = [
  ["{blue:Unit}", "one row per session: variant, and converted = 1 if any purchase event"],
  ["{blue:Join}", "LEFT JOIN events, so sessions with no events still count as 0"],
  ["{blue:Rates}", "A 16.58% (157 / 947),  B 17.37% (165 / 950):  +0.79 points"],
  ["{blue:z}", "(p_B − p_A) / SQRT(p(1 − p)(1/n_A + 1/n_B))  =  0.46"],
  ["{blue:95% CI}", "−2.59 to +4.17 points: includes 0, so no detectable effect"],
  ["{blue:SRM check}", "947 vs 950 sessions: the 50/50 split looks healthy"],
];
AB.forEach(([a, b], i) => {
  life(text(a, { x: 160, y: 180 + i * 88 }, { size: 32 }), 73 + i * 1.5, 92.6, "fade");
  life(text(b, { x: 420, y: 182 + i * 88 }, { size: 30 }), 73.2 + i * 1.5, 92.6, "fade");
});
life(text("SQL produces the counts. The statistics (why 1.96, what a p-value means) are in the A/B testing post.", { x: W / 2, y: 760 }, { size: 28, ax: 0.5, color: C.dim }), 83, 92.6, "fade");

v.endCard(93.2, 99.6, [
  { text: "Events in, decisions out: GROUP BY plus windows.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
