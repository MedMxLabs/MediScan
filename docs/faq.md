# Self-hosting FAQ

## Where does pharmacy data come from?

MedScan scrapes third-party pharmacy sites for medicine prices.
Before running scrapers, check those sites' terms of service and applicable law.
As the operator, you're responsible for complying with them. See [NOTICE](../NOTICE).

## Can I use a lighter setup for local development?

Set `SKIP_PLAYWRIGHT=1` in your backend environment for lightweight local/dev use.
This skips the Playwright scrapers (Tata 1mg and Apollo).
The HTTPX scrapers stay active, so this setting still allows requests to live sites.

## How can I reduce load on pharmacy sites?

Let caching reuse results to reduce requests to live sites.
Search and compare accept `refresh=1`, which clears that day's cache and requests a new scrape.
Use it sparingly. Don't hammer live sites with `refresh=1` loops.

## Is MedScan medical advice?

No. MedScan is informational software and does not provide medical advice, diagnosis, or treatment.
Consult a qualified clinician; see [NOTICE](../NOTICE).
