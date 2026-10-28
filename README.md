# Daylight

Daylight is a small, installable task and habit tracker designed for Android-sized screens. It is a dependency-free static web app: no build step or account is required.

## Run it

Serve this folder from a local web server for development, or deploy it to a static host over HTTPS. Service workers and Android installation require `localhost` or a secure HTTPS origin; opening `index.html` directly still works, but offline support and installation are unavailable.

On Android, open the deployed HTTPS address in Chrome or Edge, open the browser menu, and choose **Install app** or **Add to Home screen**.

## Use it

- Add tasks with a due date, category, and optional priority; complete, filter, or remove tasks.
- Create daily habits, choose a frequency label, and check off today's practice.
- Review the week, current consistency streak, task progress, and simple all-time insights.
- Your tasks and habit check-ins are stored in this browser on this device using `localStorage`; they are not synced across devices.
- The app shell is cached for offline use after the first visit from a secure origin.
