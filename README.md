# Velvet Vogue

A responsive women's fashion store built with plain HTML, CSS and JavaScript. No server, database or build step is needed:
open `index.html` or put the folder on any static host (GitHub Pages, Netlify, Vercel).

## Features

- **Catalogue**: 26 products (8 dresses, 18 denim pieces) with category filters, live search, price filter, sorting and pagination. Filter state lives in the URL, so views can be bookmarked.
- **Product pages**: size and colour selection, quantity, low-stock warnings, related items.
- **Cart**: add from any card or product page, change quantity, remove, promo codes (`VELVET10`, `VOGUE20`, `NEWUSER`), free delivery from LKR 5,000.
- **Accounts (demo)**: register, sign in, "keep me signed in", edit details, change password, profile photo, order history.
- **Checkout**: delivery form with validation, cash on delivery, order confirmation page, stock reduces after each order.
- **Wishlist**, **contact form**, **FAQ**, **shipping and returns**, **terms and privacy**, **404 page**.
- Accessible and responsive: skip link, keyboard-operable controls, visible focus, reduced-motion support, mobile menu.

## How it works

There is no backend. `js/backend.js` is a small in-browser "server" that keeps the same request and response shapes a real API would use,
and saves data in the browser's `localStorage`. The page scripts only ever call `VV.api(...)`, so pointing the site at a real server
later means replacing one function.

- Accounts, carts, wishlists and orders live on **this device only**. Passwords are salted and hashed (SHA-256) before saving; this is a demo and is not a substitute for server-side authentication.
- To wipe all saved shop data, run `VV_RESET()` in the browser console.

## Run it

- **Quickest:** double-click `index.html`.
- **Local server (recommended):** `python3 -m http.server 8000` in this folder, then open <http://localhost:8000>.
- **Online:** drag the folder onto Netlify Drop, or push to GitHub and enable Pages.

Fonts load from Google Fonts (with system fallbacks if offline). Icons are bundled in `vendor/`, so they work offline.

## Images

Put your photos in `img/`, then run `python3 check-images.py` to see what is missing or misnamed.

- Denim: `d1.jpg` to `d18.jpg`, in the numbering of `Img Decs.txt`
- Dresses: `t1.jpg` to `t5.jpg`, `s1.jpg` to `s3.jpg`
- Home and story pages: `poster.jpg`, `poster1.jpg` to `poster5.jpg`, `b1.jpg` (`poster2.jpg` is the home hero)
- `placeholder.svg` is included and shows automatically in place of any missing photo.

## Project structure

```
index.html shop.html product.html cart.html checkout.html order-confirmation.html
login.html profile.html wishlist.html contact.html ourstory.html
faq.html shipping-returns.html privacy-terms.html 404.html
css/style.css            shared styles          css/pages/*.css   page-specific styles
js/products.js           the catalogue (edit here to add or change products)
js/backend.js            in-browser data layer  js/app.js         shared UI (header, cards, toasts)
js/pages/*.js            one script per page
vendor/boxicons          icon font (MIT)        img/              your photos
build.py                 regenerates the HTML pages from one shared header/footer
check-images.py          reports missing images
```

To change the header, footer or a page's content, edit `build.py` (or the files in `_src/`), then run `python3 build.py`.
To change prices, stock or descriptions, edit `js/products.js`.

## Notes

- The star ratings and home-page reviews are placeholder content. Replace them before presenting the store as real.
- Policy pages are sample text.
- Payment is cash on delivery only; a card gateway would need a real backend.
- On 404: static hosts differ. Netlify and GitHub Pages serve `404.html` automatically.

## Testing

All 15 pages were run in a simulated browser through the full journey (browse, filter, cart, promo, register, checkout, order history,
wishlist, profile, password change, sign out and back in): 62 checks, no JavaScript errors. The data layer was also checked with browser
storage blocked (it falls back to in-memory). Visual appearance with your final photos has not been checked.

## CV / portfolio description

**Velvet Vogue: responsive e-commerce front end** (HTML, CSS, JavaScript)
- Built a 15-page fashion store with search, multi-filter product browsing, wishlist, cart with promo codes, validated checkout and order history, with no framework or server.
- Designed a clean data layer behind a single `VV.api` interface so the site can move to a real REST backend by swapping one function.
- Implemented accessible, responsive UI: keyboard navigation, focus states, reduced-motion support, mobile menu, loading skeletons and friendly empty and error states.
- Verified with a 62-check automated browser suite covering the whole shopper journey.
