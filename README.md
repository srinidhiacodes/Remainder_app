# Remainder

Gentle reminders for the little things: Invisalign aligner changes, medicines, bills and credit cards, or anything else on any schedule. It also has a simple money tracker.

Open it on your phone: **https://srinidhiacodes.github.io/Remainder_app/**

## How notifications work

Each reminder can be added to your phone's calendar with one tap:

- **Android:** "Add to Google Calendar"
- **iPhone:** "Add to Apple / other calendar" (or Google Calendar)

Your calendar app then sends a normal notification at the right time, even when this app is closed. If you edit a reminder, add it again and delete the old calendar entry.

## Features

- **Reminders:** Invisalign (set tracking), medicine (several times a day, refill alerts), bills (monthly due day, heads-up days before), and custom reminders with any picture (characters, icons or your own photo), any colour and any schedule (once, daily, weekdays, weekly, monthly, yearly, every N days/weeks/months, end date or count).
- **Today list:** mark done, snooze (15 min, 1 hour, evening or a chosen time), skip, undo, and a celebration when everything is done.
- **Smile journey:** every Invisalign set, the next change and the finish date. If you change early or late, the dates move.
- **Medicine tracker:** a 7-day chart, a streak, and running-low alerts.
- **Bills:** what's left to pay this month. Marking a bill paid adds it to Money.
- **Money:** quick expense and income entry, categories (you can add your own), a monthly budget, insights by category and a CSV download.
- **Private:** everything is stored only on your phone. Backup and restore are in Settings.
- **Installable:** add it to your home screen, and it also works offline.

## Develop

No build step: it's plain HTML, CSS and JavaScript modules.

```bash
python3 -m http.server 8080   # then open http://localhost:8080
node --test tests/*.test.js   # schedule engine tests
```

| Path | What |
|---|---|
| `js/schedule.js` | Repeat rules → reminder times |
| `js/store.js` | Saved data, due/overdue/snooze logic, money |
| `js/calendar.js` | Google Calendar links and `.ics` files |
| `js/art.js` | Characters, icons, colours, scenes |
| `js/views/` | Screens |
