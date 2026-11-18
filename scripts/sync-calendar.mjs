import fs from "node:fs/promises";
import ICAL from "ical.js";

const feedUrl = process.env.ICLOUD_CALENDAR_URL;
if (!feedUrl) throw new Error("Missing ICLOUD_CALENDAR_URL environment variable.");

const response = await fetch(feedUrl, {
  headers: { "User-Agent": "CanyonChurchCalendar/1.0" }
});
if (!response.ok) throw new Error(`Calendar feed request failed: ${response.status} ${response.statusText}`);

const icsText = await response.text();
if (!icsText.includes("BEGIN:VCALENDAR")) {
  throw new Error("The supplied URL did not return a valid iCalendar (ICS) feed.");
}

const jcal = ICAL.parse(icsText);
const root = new ICAL.Component(jcal);
const vevents = root.getAllSubcomponents("vevent");

const now = new Date();
const rangeStart = new Date(now);
rangeStart.setMonth(rangeStart.getMonth() - 2);
rangeStart.setHours(0, 0, 0, 0);
const rangeEnd = new Date(now);
rangeEnd.setMonth(rangeEnd.getMonth() + 18);
rangeEnd.setHours(23, 59, 59, 999);

function asDate(value) {
  return value ? value.toJSDate() : null;
}
function safeText(value) {
  return typeof value === "string" ? value : "";
}
function makeRecord(item, startTime, endTime, uid, allDay) {
  const start = asDate(startTime);
  const end = asDate(endTime) || start;
  if (!start || !end || end < rangeStart || start > rangeEnd) return null;

  const status = safeText(item.getFirstPropertyValue("status")).toUpperCase();
  if (status === "CANCELLED") return null;

  const url = safeText(item.getFirstPropertyValue("url"));
  return {
    id: `${uid || "event"}-${start.toISOString()}`,
    uid: uid || "",
    title: safeText(item.getFirstPropertyValue("summary")) || "Untitled event",
    description: safeText(item.getFirstPropertyValue("description")),
    location: safeText(item.getFirstPropertyValue("location")),
    url,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: Boolean(allDay)
  };
}

const output = [];
for (const component of vevents) {
  const event = new ICAL.Event(component);
  const uid = safeText(component.getFirstPropertyValue("uid"));
  const status = safeText(component.getFirstPropertyValue("status")).toUpperCase();
  if (status === "CANCELLED" || !event.startDate) continue;

  if (event.isRecurring()) {
    const iterator = event.iterator();
    let occurrence;
    let safety = 0;
    while ((occurrence = iterator.next()) && safety < 5000) {
      safety++;
      const occurrenceDate = occurrence.toJSDate();
      if (occurrenceDate > rangeEnd) break;
      if (occurrenceDate < rangeStart) continue;
      const details = event.getOccurrenceDetails(occurrence);
      const record = makeRecord(
        details.item,
        details.startDate,
        details.endDate,
        uid,
        details.startDate.isDate
      );
      if (record) output.push(record);
    }
  } else {
    const record = makeRecord(
      component,
      event.startDate,
      event.endDate,
      uid,
      event.startDate.isDate
    );
    if (record) output.push(record);
  }
}

output.sort((a, b) => new Date(a.start) - new Date(b.start));
await fs.mkdir("docs", { recursive: true });
await fs.writeFile(
  "docs/events.json",
  JSON.stringify({
    updatedAt: new Date().toISOString(),
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    events: output
  }, null, 2)
);
console.log(`Published ${output.length} event occurrences.`);
