# Tick Tock Inc. Catalogs

Two separate editable catalog sites in one Vercel project.

| Section | URL | Data |
|---|---|---|
| Tick Tock Inc. Catalogs (25 catalogs + ticktockinc.com list) | `/` | `api/main.js`, Blob `main/` |
| Adult Day Care Catalog | `/adult-day-care/` | `api/catalog.js`, Blob `adult-day-care/` |

Anyone can view. Tap "Unlock editing", enter the edit password, then change prices and photos. Both sections use the same password.

- Env vars: `EDIT_PASSWORD`, `BLOB_READ_WRITE_TOKEN`
- The two sections never share data. Adult Day Care prices do not sync with the main catalogs.
