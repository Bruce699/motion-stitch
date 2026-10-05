# Temporary phone access

The normal browser runtime binds to loopback. `localhost` and `127.0.0.1`
on a phone refer to the phone, not the Mac. Keep the Electron runtime on the
Mac and put an HTTPS tunnel in front of the temporary phone proxy.

`scripts/phone-preview-proxy.mjs` exports `createPhonePreviewProxy`:

```js
const proxy = await createPhonePreviewProxy({
  upstream: 'http://127.0.0.1:56410',
  publicOrigin: () => assignedHttpsOrigin,
  accessKey: randomBytes(32).toString('base64url'),
  expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  projectRoot: process.cwd(),
  port: 47840,
  bufferedEvents: true,
});
```

The tunnel targets the proxy's loopback port, never the raw Tilt runtime.
Configure its exact assigned HTTPS origin before sharing
`https://<assigned-host>/phone#<accessKey>`. The key is exchanged for a
secure, HttpOnly cookie and removed from the browser's current URL. Treat
the complete link as a temporary password. Keep keys and launch metadata
under ignored `.tilt/phone-access/`, with owner-only file permissions.

The adapter retains Tilt's own browser cookie, validates the remote host
and origin before rewriting them for loopback, and blocks desktop actions
and opening other projects. The editor uses the existing raster fallback
instead of sending the phone to source iframe servers on the Mac.

Use `bufferedEvents` for tunnels that buffer streaming responses: finite
event batches preserve one upstream viewer connection and native event
IDs across reconnects. Ordinary streaming tunnels can leave it off.

Leave the Mac powered on, connected, and awake while using the phone.
Close the proxy and tunnel when finished; the configured expiry revokes
access even if the tunnel remains connected. No scene or export settings
change when using this adapter.
