# Robocoupler Document Management System

A modern web-based document management system for Robocoupler Techno Solutions Pvt Ltd. This project allows you to create, manage, and export invoices and quotations, track performance, and view company stats—all in a single-page application.

## Features

- **Dashboard:** Company overview, KPIs, and quick actions.
- **Invoice & Quotation:** Create, save, and export documents as PDFs. Add multiple items/services, calculate taxes (CGST/SGST), and include terms, bank details, and company stamp/signature.
- **Performance:** View revenue summaries and itemized reports from saved invoices/quotations.
- **Responsive Design:** Works well on desktop and mobile.
- **Local Storage:** Documents are saved in your browser for privacy and offline access.

## Technologies Used

- HTML5, CSS3 (custom styles, responsive layout)
- JavaScript (vanilla, no frameworks)
- [jsPDF](https://github.com/parallax/jsPDF) and [html2canvas](https://github.com/niklasvh/html2canvas) for PDF export
- Font Awesome for icons
- Google Fonts (Poppins)

## How to Run Locally

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/robocoupler-inv.git
   cd robocoupler-inv
   ```
2. **Open `index.html` in your browser.**
   - No build step or server required; all logic runs client-side.
   - For best results, use Chrome or Edge.

## Folder Structure

```
robocoupler-inv/
├── index.html
├── styles.css
├── script.js
├── robocoupler_logo.jpg
└── README.md
```

## Usage

- **Dashboard:** View company info and KPIs.
- **Invoice/Quotation:**
  - Fill in customer/project details.
  - Add items/services, adjust quantities/prices.
  - Save to local storage or export as PDF.
- **Performance:** See revenue breakdowns and itemized history.

## Customization

- Update company info, GSTIN, and branding in `index.html`.
- Change color scheme in `styles.css`.
- Add/remove payment modes or terms as needed.

## License

This project is open source under the MIT License. See `LICENSE` for details.

## Credits

- Robocoupler Techno Solutions Pvt Ltd
- jsPDF, html2canvas, Font Awesome



