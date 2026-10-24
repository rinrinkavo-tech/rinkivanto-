# Zalo OA webhook receiver (starter)

This is a small Node.js HTTP receiver intended for deployment as a Render Web Service.
It provides:
- `GET /` service status
- `GET /health` health check
- `POST /webhook` to receive Zalo OA webhook JSON and acknowledge it with HTTP 200

**Important:** this starter receives and acknowledges events. It does NOT send automatic replies, and it does not claim to verify Zalo signatures. Configure signature verification against the exact current Zalo OA documentation before production use. Never paste an access token or app secret into source code or public repositories.

## Deploy for a free HTTPS URL

1. Create a GitHub account if needed.
2. Create a new repository, for example `zalo-oa-webhook`, and upload these project files to the repository root.
3. Sign in to Render and choose **New + → Web Service**.
4. Connect the GitHub repository.
5. Use:
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free
6. Deploy. Render will provide a service URL like `https://your-service-name.onrender.com`.
7. Test `https://your-service-name.onrender.com/health` in a browser. Expected response: `{"ok":true}`.
8. The webhook URL to configure in the Zalo app is `https://your-service-name.onrender.com/webhook` (replace with your actual Render domain).
9. In Zalo Developers / OA OpenAPI settings, register that URL and enable the relevant webhook events as directed by Zalo's current documentation.

You cannot know the real URL until Render deploys the service. Do not use the example domain literally.

## Test locally (optional)

Requires Node.js 18+:
```sh
npm start
```
Then:
```sh
curl http://localhost:3000/health
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{"event_name":"test_event","app_id":"demo"}'
```

## Free-tier notes

Free Render web services may sleep after inactivity and take around a minute to wake on the next request. This can make webhook delivery less reliable for production. See Render's official free service limitations.

## Zalo documentation

- Zalo OA Open APIs: https://docs.zaloplatforms.com/docs/OA
- Automatic chatbot overview: https://docs.zaloplatforms.com/docs/OA/phu-luc/lam-the-nao-de-tao-chatbot-tra-loi-tu-dong-voi-zalo-api
- Webhook user message event: https://stc-developers.zdn.vn/docs/v2/official-account/webhook/tin-nhan/su-kien-nguoi-dung-gui-tin-nhan
