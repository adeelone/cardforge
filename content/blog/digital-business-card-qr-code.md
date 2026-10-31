---
title: How to Make a Digital Business Card with a QR Code (Without Oversharing)
description: The difference between vCard and link QR codes, how big a QR code needs to be on a card, and how to share a digital business card you can update or switch off later.
date: 2026-10-30
keyword: digital business card qr code
tags: qr codes, digital cards, privacy
---

A QR code turns a paper business card into a digital one: someone scans it and gets your details on their phone without retyping anything. But not all QR codes behave the same way, and the choices you make decide how easy your code is to scan, and how much of your information travels with it.

## Two kinds of business card QR code

### 1. A vCard QR code

The code itself contains your contact details in vCard format: name, title, phone, email, website. When someone scans it, their phone offers to save a new contact directly.

- **Pros:** works offline, and needs no website.
- **Cons:** the code gets dense, because every character you add makes it larger. Once it's printed it can never change, so a new phone number means reprinting.

### 2. A link QR code

The code contains a short URL that opens a **digital business card**: a web page with your details, tap-to-call and tap-to-email buttons, and a "save contact" button.

- **Pros:** small, easy-to-scan codes. If the link points to a page you control, you can update your details after printing.
- **Cons:** it needs an internet connection, and the page has to stay online.

For most people, a **short link to a hosted card you control** is the best of both: the printed code stays tiny, and your details can change without a reprint.

## How big should a QR code be on a business card?

QR codes are made of small squares called modules. More data means more modules, and smaller modules are harder for a camera to read.

- **Minimum printed size:** about **2 × 2 cm (0.8 × 0.8 in)** for a short URL. Dense vCard codes need more room, so aim for 2.5 cm or more.
- **Quiet zone:** leave a clear margin around the code. The QR specification calls for four modules; two works with most phone cameras, but less is risky.
- **Contrast:** dark ink on a light background. Light-on-dark and low-contrast brand colors fail more often, especially under dim event lighting.
- **Error correction:** level **Q** or **H** helps if the card gets scuffed, or if you place a small logo in the center.

Test it the boring way: print one proof at final size, then scan it with two different phones in ordinary indoor light.

## Share only what you mean to

A digital card can expose more than a paper card, because it can be forwarded, screenshotted, and indexed. Before you share one, decide which fields belong in it:

- **Email and website:** almost always.
- **Mobile number:** only if you're happy for people you met once to text you.
- **Office address:** usually only for businesses with a storefront.
- **Pronouns and a tagline:** your choice, case by case.

In CardForge, the **Privacy & sharing** panel lets you switch each of these on or off, and only the fields you enable go into a share link or hosted card. You can also set a link to expire after 7, 30, or 90 days, which is useful for event cards.

## Embedded links vs. hosted cards

CardForge offers two ways to share a digital card:

| | Embedded link | Hosted card |
| --- | --- | --- |
| Account needed | No | Yes (free plan includes one) |
| Where the data lives | Compressed inside the link itself | On CardForge, filtered to the fields you chose |
| Link length | Long (a QR code falls back to a vCard if needed) | Short, e.g. `/c/ab12cd34` |
| Update after printing | No | Yes |
| Switch it off | No | Yes, in one tap |
| View counts | No | Daily counts, with no visitor tracking |

**Embedded links** keep everything in the URL fragment, which browsers don't send to the server. Nothing is stored anywhere, but nothing can be revoked either.

**Hosted cards** give you a short link and a much smaller QR code. You can update the card after you've printed 500 copies, or switch the link off if a card is lost or you change jobs. Pro plans also let you choose a custom link like `/c/your-name`.

## Step by step: a digital business card with a QR code

1. Open the [free business card maker](/new) and pick a [template](/templates).
2. Fill in your name, title, and contact details.
3. Open **Privacy & sharing**, and switch off anything you don't want to share.
4. Either copy the digital card link, or sign in and choose **Publish card** to get a short hosted link.
5. Add a QR element and set it to **Digital card**. Once the card is published, the QR code points to the short link automatically.
6. Export a print-ready PDF ([see our size and bleed guide](/blog/business-card-size-and-bleed)), and scan-test a printed proof.

That's it: one card that works on paper, on a phone, and, with a hosted link, keeps working after your details change.
