---
layout: home
title: Revocable sessions for stateless authentication
hero:
  name: SessionForge / v0.1.0
  text: Stateless access. Stateful control.
  tagline: Keep API requests decentralized. Bring refresh sessions, token rotation, and revocation under your control.
  image:
    src: /sessionforge-logo.png
    alt: SessionForge
  actions:
    - theme: brand
      text: Get started →
      link: /guide/getting-started
    - theme: alt
      text: Explore the API
      link: /reference/session-forge
features:
  - title: Rotate. Detect. Revoke.
    details: Replace refresh credentials on use. Detect consumed-token replay and revoke the entire session family.
    link: /guide/token-lifecycle
    linkText: Understand the lifecycle
  - title: Your storage, your boundary.
    details: Start with the included SQLite adapter, or implement the SessionStore interface for your own database.
    link: /guide/sqlite
    linkText: Set up persistence
  - title: Small core. Explicit tradeoffs.
    details: Manage refresh sessions separately from JWT issuance, user accounts, and application authorization.
    link: /guide/architecture
    linkText: Explore the architecture
---

<div class="home-example">
<div>
<span class="eyebrow">A SMALL API FOR A BIG BOUNDARY</span>
<h2>Trust can expire.<br>Sessions can be revoked.</h2>
<p>Create a named session, rotate its refresh token, and sign a user out across devices. You own the access-token layer; SessionForge manages the long-lived session state.</p>
<a href="/guide/getting-started">Build your first session →</a>
</div>
<div>

```ts
import { SessionForge } from 'session-forge';

const sessions = new SessionForge({
  store, // Your SessionStore implementation
  expiryTTL: 30 * 24 * 60 * 60 * 1000,
});

const token = await sessions.createSession({
  userId,
  sessionName: 'Chrome on macOS',
});

const result = await sessions.rotateRefreshToken(token);
await sessions.revokeAllSessionsForUser(userId);
```

</div>
</div>
