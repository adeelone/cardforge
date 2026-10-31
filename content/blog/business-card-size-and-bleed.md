---
title: Business Card Size and Bleed: The Print-Ready Guide (US, EU, Japan)
description: Standard business card dimensions by country, how much bleed to add, where the safe zone is, and how to export a PDF your print shop will accept the first time.
date: 2026-10-31
keyword: business card size and bleed
tags: printing, sizes, pdf
---

Most print problems with business cards come down to three numbers: the **trim size**, the **bleed**, and the **safe zone**. Get those right and a print shop can cut your card cleanly. Get them wrong and you end up with a thin white sliver along one edge, or a phone number that disappears into the cut.

This guide covers the standard sizes, why bleed exists, and a checklist for exporting a file that passes a printer's preflight the first time.

## Standard business card sizes

There is no single worldwide size. Use the one your printer and your recipients expect.

| Region | Trim size (mm) | Trim size (inches) | Notes |
| --- | --- | --- | --- |
| United States and Canada | 88.9 × 50.8 | 3.5 × 2 | The most common size online |
| Europe | 85 × 55 | 3.35 × 2.17 | Standard across most of the EU |
| United Kingdom | 85 × 55 | 3.35 × 2.17 | Same as the European standard |
| Japan | 91 × 55 | 3.58 × 2.17 | Slightly wider than the EU card |
| Square | 65 × 65 | 2.56 × 2.56 | A distinctive choice for creative work |
| Mini or slim | 70 × 28 | 2.76 × 1.1 | Good for a single name and QR code |

Portrait cards use the same dimensions turned on their side. In the [CardForge business card maker](/new) you pick a preset and orientation, and the canvas takes on the true proportions of that card instead of squeezing everything into one rectangle.

## What bleed is, and how much to add

Commercial cutters cut stacks of cards, and every cut can drift by a fraction of a millimeter. If your background color stops exactly at the trim line, any drift shows up as a hairline of bare paper.

**Bleed** is extra artwork that extends past the trim line on every side, so a small drift cuts through color instead of exposing white paper.

- **3 mm** on each side is the usual standard for metric printers.
- **0.125 in (1/8 in)** on each side is the usual US standard. That is about 3.2 mm.

So a US card with bleed is 3.75 × 2.25 in in your file, and an EU card is 91 × 61 mm. Always check your printer's spec sheet: a few ask for 2 mm, and some large-format shops ask for 5 mm.

## The safe zone: keep text away from the edge

Bleed protects your background. The **safe zone** protects your content. Keep names, phone numbers, and logos at least **3–5 mm (about 1/8–3/16 in)** inside the trim line. Anything closer risks being trimmed off or looking cramped once it is cut.

A good habit is to switch on your editor's safe-area guide before you start placing text, rather than fixing things afterwards. CardForge shows a safe-area outline that follows the card's corner radius and padding.

## Resolution and color

- **Vector is best.** Text and shapes exported as vectors stay sharp at any size. A PDF built from vector elements avoids most resolution problems.
- **Raster images need 300 DPI at print size.** A logo that fills a third of a US card (about 1.2 in wide) needs to be at least 360 px wide. A full-bleed photo for a US card needs about 1125 × 675 px.
- **RGB vs. CMYK.** Screens mix light (RGB); presses mix ink (CMYK). Most online printers convert RGB files automatically, but bright greens, electric blues, and neon pinks will look duller on paper. If exact color matters, order a single proof before printing hundreds.

## Fonts and minimum sizes

- Keep body text at **7–8 pt or larger**. Under 7 pt, phone numbers become hard to read, especially in light weights.
- Hairline weights can break up when printed. For small text, use regular or medium weights.
- Check text contrast against the background. A WCAG AA contrast ratio (4.5:1 for small text) is a reliable benchmark for print too.

## Export checklist

Before you upload to a printer, confirm:

1. The **page size** equals the trim size plus bleed on all sides.
2. Background color and images **extend into the bleed**.
3. All text sits **inside the safe zone**.
4. The PDF includes **crop marks**, or the printer has said they don't want them.
5. Raster images are **300 DPI** at their printed size.
6. Any **QR code** is at least 2 cm (0.8 in) wide and scans from a printed proof. Our [QR code guide](/blog/digital-business-card-qr-code) covers this in detail.
7. Front and back are **separate pages** in the correct order.

CardForge exports PDFs with true bleed, a trim box, and crop marks for every card preset, so the file already matches this checklist. [Open the editor](/new), pick a size, and export a print-ready PDF in a minute. It's free, and no account is needed.

## Frequently asked questions

### Is 3.5 × 2 inches the same as 85 × 55 mm?

No. The US card (88.9 × 50.8 mm) is about 4 mm wider and 4 mm shorter than the EU card. Designs usually survive the switch, but always re-check text spacing after changing the preset.

### Do I need bleed if my card has a white background?

If nothing touches the edge, bleed won't show. Most printers still require the file to include it, though, so export with bleed anyway.

### What file format should I send?

A PDF with crop marks and bleed is the safest choice for almost every printer. Send PNG only if the printer specifically asks for an image, and then export at 600 DPI.
