# rocketscience.pl

Static HTML site for Rocket Science Lab (kapoost).

## Stack

- Plain HTML / CSS, no JS, no framework
- Hosted on Cloudflare Pages (static directory deploy)
- DNS via Cloudflare (apex + subdomains); registrar: nazwa.pl

## Layout

```
/                  index.html (hero + featured projects)
/about.html        bio: CTO / sailor / poet / musician
/projects.html     Purrsonality, AdCP, Signals, humanMCP
/writing.html      short poems (PL + EN)
/privacy.html      AdSense + GDPR
/contact.html      email, humanMCP, AdCP routes
/ads.txt           AdSense seller declaration
/robots.txt
/sitemap.xml
/_headers          Cloudflare Pages security headers
```

## Local preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory .
# open http://127.0.0.1:8765/
```

## Deploy — first time

### 1. Replace AdSense publisher ID

Edit `ads.txt` and replace `PUB-PLACEHOLDER` with the real publisher ID:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

### 2. Push to GitHub

```sh
cd /Users/kapoost/rocketscience.pl
git init
git add .
git commit -m "feat: initial site"
gh repo create kapoost/rocketscience.pl --public --source=. --push
```

### 3. Move DNS to Cloudflare

Currently `rocketscience.pl` uses `ns{1,2,3}.nazwa.pl`. Move to Cloudflare:

1. Cloudflare dashboard → **Add site** → `rocketscience.pl` (Free plan is fine)
2. Cloudflare will copy existing records. **Verify the MX records** (aspmx.l.google.com + aspmx1.l.google.com) are present — Gmail must keep working.
3. Cloudflare shows two nameservers like `xyz.ns.cloudflare.com`. Copy them.
4. Log into **nazwa.pl** panel → DNS / domain settings for `rocketscience.pl` → replace nameservers with the two Cloudflare ones.
5. Wait for propagation (usually < 1 h, can take up to 24 h).

### 4. Deploy to Cloudflare Pages

In Cloudflare dashboard → **Pages** → **Create a project** → **Connect to Git**:

- Repository: `kapoost/rocketscience.pl`
- Production branch: `main`
- Build command: *(leave empty)*
- Build output directory: `/`

After the first build, Pages assigns a `*.pages.dev` URL. Verify it works.

### 5. Add custom domain — apex

Pages project → **Custom domains** → **Set up a custom domain** → `rocketscience.pl`.

Cloudflare auto-creates the apex CNAME flattening record. SSL is issued automatically.

### 6. AdSense site review

- AdSense dashboard → **Sites** → `rocketscience.pl` → request review.
- Review typically takes 1–14 days. The site needs to be reachable over HTTPS, have visible content, a privacy policy, and a valid `ads.txt`. All four are covered.

### 7. After approval — wire up Purrsonality subdomain

Once `rocketscience.pl` shows **Ready** in AdSense:

- In the existing Purrsonality CF Pages project (the `purrsonality.pages.dev` one), add custom domain `purrsonality.rocketscience.pl`.
- Cloudflare creates the CNAME automatically.
- Update Purrsonality's canonical URL across the codebase:
  - `cats/public/.well-known/brand.json` — `url`, `discovery.adcp`
  - `cats/public/.well-known/adagents.json` — agent URLs
  - `cats/src/config/purrsonality.ts` — `PUBLISHER.adcp_publisher`
- Keep `purrsonality.pages.dev` as an alias (do not delete the CF Pages binding).

## Updating the site

Push to `main` → Cloudflare Pages rebuilds and serves on commit.

## Notes

- MX records belong to Google Workspace. **Never touch them.** If Cloudflare import misses them, add manually before changing nameservers.
- Subdomains created later under `rocketscience.pl` must have their own privacy policy if they collect anything beyond the apex disclosures.
