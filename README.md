# Elbo Records

Static vinyl/records/gear store — San Diego.

## Data

The source CSV lives **outside this repo** to keep personal data out of version control. The conversion script looks for it at:

```
~/Documents/elbo-records/catalog.csv
```

To use a different path, set the `CSV_PATH` environment variable, or edit the constant at the top of `scripts/csv-to-json.js`.

## Building the catalog

```bash
node scripts/csv-to-json.js
# or with a custom path:
CSV_PATH=/path/to/your.csv node scripts/csv-to-json.js
```

This reads the CSV, filters to items with a price set, and writes `data/catalog.json`. Check the console output for a summary.

The CSV should have these columns (Discogs export format works):

| Column | Field |
|---|---|
| Artist | Artist name |
| Title | Album/item title |
| Label | Record label |
| Format | LP, CD, etc. |
| Released | Year |
| CollectionFolder | Category (Sell, Gear, etc.) |
| Collection Media Condition | Vinyl/disc grade |
| Collection Sleeve Condition | Sleeve grade |
| Collection My Price | Listing price (required — items without a price are excluded) |
| photo_file | Image filename in `images/records/` |
| Collection Notes | Optional description |

## Photos

Drop album cover images into `images/records/`. Filenames should match the `photo_file` column in the CSV. Items without a matching photo fall back to `images/placeholder.jpg`.

## PayPal

Open `js/app.js` and replace `YOUR_PAYPAL_EMAIL` at the top of the file with your PayPal business email.

## Marking items as sold

In `data/catalog.json`, find the item and set `"sold": true`. The card stays visible with a SOLD overlay.

## Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# From the project root
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys on push.
