# Printing

## Sizes

CardForge supports these presets:

- US: 3.5 x 2 in
- EU: 85 x 55 mm
- JP: 91 x 55 mm
- UK: 85 x 55 mm
- Square: 65 x 65 mm
- Mini: 70 x 28 mm

## Bleed and Safe Area

The default bleed is 3 mm. The PDF exporter creates a bleed box and trim box and draws crop marks. Keep important text inside the safe-area guide.

## DPI

PNG export targets 300 DPI by default. Use 600 DPI when a printer asks for higher raster resolution.

## CMYK

The browser preview and default exports are sRGB. For CMYK production, convert the exported PDF with a print profile using Ghostscript:

```bash
gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
  -sColorConversionStrategy=CMYK \
  -dProcessColorModel=/DeviceCMYK \
  -sOutputFile=card-cmyk.pdf cardforge-export.pdf
```

Ask the print shop for their preferred ICC profile before final production.
