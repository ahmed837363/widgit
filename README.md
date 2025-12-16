# Widget Site (standalone)

This folder contains a tiny host page for the chatbot widget. Use it to serve the widget as a standalone page you can iframe on other sites or host on Netlify/Vercel.

Usage

- Place a copy of `widget.js` (from `../widget/widget.js`) into this folder, or set the `widgetUrl` query param to point to a hosted copy.
- Open the page with query parameters. Example:

```
https://widget.example.com/?clientId=my_store_123&functionUrl=https%3A%2F%2Fapi.example.com%2Fchat
```

Query params

- `clientId` (required): the public client identifier stored in your DB.
- `functionUrl` (required): the backend function URL that receives chat messages.
- `widgetUrl` (optional): URL to `widget.js` (defaults to `widget.js` in same folder).
- `primaryColor`, `position`, `welcomeMessage` (optional): widget appearance overrides.

Iframe embed

Embed the hosted page using an iframe to isolate styles and scripts:

```html
<iframe src="https://widget.example.com/?clientId=my_store_123&functionUrl=https%3A%2F%2Fapi.example.com%2Fchat"
        style="width:380px;height:520px;border:0;"
        title="Chatbot">
</iframe>
```

Direct script embed

If you prefer not to use an iframe, host `widget.js` on a CDN and include it on the target site with data attributes:

```html
<script src="https://cdn.example.com/widget.js"
        data-function-url="https://api.example.com/chat"
        data-client-id="my_store_123"></script>
```

Deploying

- Netlify / Vercel: point to this folder as the site root. Make sure `widget.js` is present here or the `widgetUrl` points to a hosted copy.
- GitHub Pages: push this folder as part of a repo and enable Pages to serve it.

Security notes

- Never put secret keys in `widget.js`. Keep API keys and model keys only on server side.
- Prefer embedding via iframe to avoid host-page CSS/JS conflicts.

Setup page (only needs store URL)

If you want onboarding to be as easy as “paste store URL → get embed code”, use:

- `setup.html`

1) Set these env vars on your Appwrite `onboard` function:

- `WIDGET_URL` = public URL to the hosted `widget.js`
- `CHATBOT_FUNCTION_URL` = public URL to your deployed chatbot function execution endpoint

2) Open the setup page and pass your onboard function URL once:

```
https://widget.example.com/setup.html?onboardUrl=<URL_ENCODED_ONBOARD_FUNCTION_EXECUTION_URL>
```

3) Paste your store URL in the form. The response includes a fully ready `<script …>` snippet.
