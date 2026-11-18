# Canyon Church monthly calendar widget

This starter project turns a public Apple iCloud calendar subscription (ICS) feed into a responsive monthly calendar that can be embedded in a Subsplash SnapPages Code block.

## What it does

- Shows a Sunday–Saturday monthly grid with previous/next month controls.
- Displays event titles on their dates.
- Opens event details in a dialog when an event is clicked.
- Imports event title, description, location, URL, date/time, and all-day status.
- Expands recurring events for a rolling window (2 months back through 18 months ahead).
- Refreshes the feed nightly using GitHub Actions.
- Publishes a static widget and JSON file using GitHub Pages.

The iCloud feed URL is stored as a GitHub Actions secret and is not placed in the public website files.

## Setup (free GitHub hosting)

1. Sign in to GitHub and create a **new private repository** named `canyon-church-calendar`.
2. Upload the contents of this folder to the repository, keeping the folder structure.
3. In the repository, open **Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `ICLOUD_CALENDAR_URL`
   - Value: your full iCloud published calendar URL. Use the `https://...` version (not `webcal://...`).
4. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
5. Open the **Actions** tab, select **Sync iCloud calendar and publish widget**, and click **Run workflow**.
6. Wait for the run to finish successfully. The deployed site URL will appear in the workflow run (usually `https://YOUR-USERNAME.github.io/canyon-church-calendar/`).
7. Open that URL. Confirm the calendar and event list look right.

The scheduled workflow runs nightly at 08:15 UTC (about 2:15 AM Central during standard time / 3:15 AM during daylight time). You can change the cron expression in `.github/workflows/sync-and-publish.yml`.

## Subsplash embed code

After GitHub Pages is deployed, replace `YOUR-USERNAME` below with your GitHub username and paste this into a Subsplash SnapPages **Code** block:

```html
<iframe
  src="https://YOUR-USERNAME.github.io/canyon-church-calendar/"
  title="Canyon Church Events Calendar"
  width="100%"
  height="850"
  style="border:0; width:100%; max-width:1100px; min-height:650px;"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin">
</iframe>
```

Adjust the iframe height to suit the page layout. If SnapPages strips iframe markup from a Code block, ask Subsplash support which embed/code block accepts an external iframe.

## Customization

- Change Canyon Church blue in `docs/index.html` under `--canyon-blue`.
- Change the visible label in the `.brand` element.
- Change how many events appear per date by changing `dayEvents.slice(0,3)`.
- Change the feed window in `scripts/sync-calendar.mjs`.

## Important notes

- The feed is fetched by GitHub Actions, not by each website visitor's browser. This avoids browser cross-origin restrictions and keeps the iCloud feed URL out of the public embed.
- GitHub Actions scheduled runs are not guaranteed to start at the exact minute; they can be delayed during busy periods.
- GitHub Pages is a static host. The widget reads the latest generated `events.json`; it does not contact iCloud on every page view.
- The provided iCloud calendar is public. Anyone who has the subscription URL may be able to view its contents. Keep private appointments off that calendar.
- The first deployment must be triggered manually from the Actions tab. After that, the nightly schedule runs automatically.
- This project is a starter implementation. Verify recurring events, time zones, all-day events, and any special calendar exceptions against your Apple Calendar before relying on it for public event information.
