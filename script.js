// My Class Timetable — weekly planner saved in localStorage
const STORAGE_KEY = "classTimetableClassesV1";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Sample demo timetable — clearly labelled "Sample" in the UI.
// Replace these with your real classes: delete them and add your own.
const SAMPLE_CLASSES = [
  { id: "sample-1", subject: "Web Development", day: 1, start: "09:00", end: "10:30", room: "Room 4", teacher: "Miss Ayesha", sample: true },
  { id: "sample-2", subject: "Database Systems", day: 1, start: "11:00", end: "12:30", room: "Lab 2", teacher: "Sir Bilal", sample: true },
  { id: "sample-3", subject: "Data Structures", day: 2, start: "09:00", end: "10:30", room: "Room 2", teacher: "Miss Sana", sample: true },
  { id: "sample-4", subject: "Operating Systems", day: 3, start: "10:00", end: "11:30", room: "Room 5", teacher: "Sir Ahmed", sample: true },
  { id: "sample-5", subject: "English", day: 4, start: "09:00", end: "10:00", room: "Room 1", teacher: "Miss Fatima", sample: true },
  { id: "sample-6", subject: "Software Engineering", day: 5, start: "11:00", end: "12:30", room: "Room 3", teacher: "Sir Usman", sample: true }
];

let classes = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmtTime(t) {
  let [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + String(m).padStart(2, "0") + " " + ampm;
}

function fmtDuration(mins) {
  if (mins < 60) return mins + "m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? h + "h " + m + "m" : h + "h";
}

function todayDayIndex() {
  // JS: 0 = Sunday ... 6 = Saturday. Our days: 1 = Monday ... 6 = Saturday.
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 0 : jsDay; // 0 means Sunday (no classes)
}

function sorted(list) {
  return [...list].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

function render() {
  const today = todayDayIndex();
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const todayClasses = sorted(classes.filter(c => c.day === today));

  // --- Header date ---
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  document.getElementById("todayDate").textContent = dateStr;
  document.getElementById("todayTitle").textContent = today === 0 ? "Today is Sunday — no classes" : "Today — " + DAYS[today - 1];

  // --- Stats ---
  document.getElementById("statToday").textContent = todayClasses.length;
  document.getElementById("statWeek").textContent = classes.length;
  const totalMins = classes.reduce((sum, c) => sum + (toMinutes(c.end) - toMinutes(c.start)), 0);
  document.getElementById("statHours").textContent = Math.round(totalMins / 60 * 10) / 10 + "h";

  // --- Next class / happening now ---
  const nextBox = document.getElementById("nextClass");
  nextBox.textContent = "";
  if (today !== 0 && todayClasses.length) {
    const ongoing = todayClasses.find(c => nowMins >= toMinutes(c.start) && nowMins < toMinutes(c.end));
    const upcoming = todayClasses.find(c => toMinutes(c.start) > nowMins);
    if (ongoing) {
      nextBox.textContent = "▶ Happening now: " + ongoing.subject + " (" + fmtTime(ongoing.start) + " – " + fmtTime(ongoing.end) + ") — ends in " + fmtDuration(toMinutes(ongoing.end) - nowMins) + ".";
    } else if (upcoming) {
      nextBox.textContent = "⏰ Next: " + upcoming.subject + " at " + fmtTime(upcoming.start) + (upcoming.room ? " (" + upcoming.room + ")" : "") + " — starts in " + fmtDuration(toMinutes(upcoming.start) - nowMins) + ".";
    } else {
      nextBox.textContent = "✅ All of today's classes are done. Well done!";
    }
  }

  // --- Today list ---
  const todayList = document.getElementById("todayList");
  todayList.innerHTML = "";
  document.getElementById("todayEmpty").hidden = todayClasses.length > 0;
  todayClasses.forEach(c => {
    const li = document.createElement("li");
    const isNow = nowMins >= toMinutes(c.start) && nowMins < toMinutes(c.end);
    const isNext = !isNow && toMinutes(c.start) > nowMins && todayClasses.find(x => toMinutes(x.start) > nowMins) === c;
    li.innerHTML =
      '<span class="class-time">' + fmtTime(c.start) + " – " + fmtTime(c.end) + "</span>" +
      '<span class="class-subject">' + escapeHtml(c.subject) + "</span>" +
      (c.room ? '<span class="class-meta">' + escapeHtml(c.room) + "</span>" : "") +
      (c.teacher ? '<span class="class-meta">' + escapeHtml(c.teacher) + "</span>" : "") +
      (isNow ? '<span class="badge now-badge">Now</span>' : "") +
      (isNext ? '<span class="badge next-badge">Next</span>' : "") +
      (c.sample ? '<span class="badge sample-badge">Sample</span>' : "");
    todayList.appendChild(li);
  });

  // --- Weekly grid ---
  const grid = document.getElementById("weekGrid");
  grid.innerHTML = "";
  DAYS.forEach((name, i) => {
    const dayNum = i + 1;
    const col = document.createElement("div");
    col.className = "day-col" + (dayNum === today ? " today" : "");
    const dayClasses = sorted(classes.filter(c => c.day === dayNum));
    let html = "<h3>" + name + "</h3>";
    if (!dayClasses.length) {
      html += '<p class="day-empty">No classes</p>';
    } else {
      dayClasses.forEach(c => {
        html += '<div class="class-block">' +
          '<span class="cb-time">' + fmtTime(c.start) + " – " + fmtTime(c.end) + "</span>" +
          '<span class="cb-subject">' + escapeHtml(c.subject) + "</span>" +
          ((c.room || c.teacher) ? '<span class="cb-meta">' + escapeHtml([c.room, c.teacher].filter(Boolean).join(" • ")) + "</span>" : "") +
          (c.sample ? '<span class="badge sample-badge">Sample</span>' : "") +
          "</div>";
      });
    }
    col.innerHTML = html;
    grid.appendChild(col);
  });

  // --- All classes list ---
  const allList = document.getElementById("allList");
  allList.innerHTML = "";
  document.getElementById("allEmpty").hidden = classes.length > 0;
  sorted(classes).sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start)).forEach(c => {
    const li = document.createElement("li");
    li.innerHTML =
      '<span class="class-time">' + DAYS[c.day - 1] + " • " + fmtTime(c.start) + " – " + fmtTime(c.end) + "</span>" +
      '<span class="class-subject">' + escapeHtml(c.subject) + "</span>" +
      (c.room ? '<span class="class-meta">' + escapeHtml(c.room) + "</span>" : "") +
      (c.teacher ? '<span class="class-meta">' + escapeHtml(c.teacher) + "</span>" : "") +
      (c.sample ? '<span class="badge sample-badge">Sample</span>' : "");
    const del = document.createElement("button");
    del.className = "btn danger-ghost small";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      classes = classes.filter(x => x.id !== c.id);
      save();
      render();
    });
    li.appendChild(del);
    allList.appendChild(li);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function showMsg(text, kind) {
  const el = document.getElementById("formMsg");
  el.textContent = text;
  el.className = "form-msg " + (kind || "");
}

// --- Add class ---
document.getElementById("classForm").addEventListener("submit", e => {
  e.preventDefault();
  const subject = document.getElementById("subject").value.trim();
  const day = Number(document.getElementById("day").value);
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const room = document.getElementById("room").value.trim();
  const teacher = document.getElementById("teacher").value.trim();

  if (!subject || !start || !end) {
    showMsg("Please fill in the subject, start time and end time.", "error");
    return;
  }
  if (toMinutes(end) <= toMinutes(start)) {
    showMsg("End time must be after the start time.", "error");
    return;
  }
  const overlap = classes.find(c => c.day === day && toMinutes(start) < toMinutes(c.end) && toMinutes(end) > toMinutes(c.start));
  if (overlap) {
    showMsg("Heads up: this overlaps with " + overlap.subject + " (" + fmtTime(overlap.start) + " – " + fmtTime(overlap.end) + ") on " + DAYS[day - 1] + ". Added anyway.", "error");
  } else {
    showMsg("Added: " + subject + " on " + DAYS[day - 1] + ", " + fmtTime(start) + " – " + fmtTime(end) + ".", "ok");
  }
  classes.push({ id: "c-" + Date.now(), subject, day, start, end, room, teacher, sample: false });
  save();
  render();
  document.getElementById("subject").value = "";
  document.getElementById("room").value = "";
  document.getElementById("teacher").value = "";
  document.getElementById("subject").focus();
});

// --- Sample timetable ---
document.getElementById("loadSample").addEventListener("click", () => {
  if (classes.some(c => c.sample)) {
    showMsg("Sample timetable is already loaded.", "error");
    return;
  }
  if (classes.length && !confirm("Add the sample timetable alongside your existing classes?")) return;
  classes = classes.concat(SAMPLE_CLASSES.map(c => ({ ...c })));
  save();
  render();
  showMsg("Sample timetable loaded — sample classes are marked “Sample”. Delete them and add your real classes.", "ok");
});

// --- Clear all ---
document.getElementById("clearAll").addEventListener("click", () => {
  if (!classes.length) return;
  if (!confirm("Delete all classes from your timetable?")) return;
  classes = [];
  save();
  render();
  showMsg("Timetable cleared.", "ok");
});

render();
setInterval(render, 60000); // refresh the next-class countdown every minute
