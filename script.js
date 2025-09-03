/*******************
       * Small helpers
       *******************/
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

       /* ID Generator: prefix + zero-padded 3-digit counter */
 const IDGenerator = (() => {
   const getNextId = (prefix, key) => {
     const count = parseInt(localStorage.getItem(key) || "0", 10);
     const next = count + 1;
     localStorage.setItem(key, next.toString());
     return `${prefix}${String(next).padStart(3, "0")}`;
   };
   
   const generateCustomerId = () =>
     `CUST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
   
   // Clear existing storage and start fresh
   const clearStorage = () => {
     localStorage.removeItem("invoice-count");
     localStorage.removeItem("quotation-count");
     localStorage.removeItem("invoices");
     localStorage.removeItem("quotations");
     console.log("Local storage cleared. Starting fresh with AINV001 and AQUT001");
   };
   
   return { getNextId, generateCustomerId, clearStorage };
 })();

/*******************
 * Document manager
 *******************/
const DocumentManager = (() => {
  const saveDocument = (type, data) => {
    const documents = JSON.parse(localStorage.getItem(type) || "[]");
    documents.push(data);
    localStorage.setItem(type, JSON.stringify(documents));
    updateDashboardCounts();
  };

  const updateDashboardCounts = () => {
    let invoices = [];
    let quotations = [];
    try {
      invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
    } catch (e) {
      invoices = [];
    }
    try {
      quotations = JSON.parse(localStorage.getItem("quotations") || "[]");
    } catch (e) {
      quotations = [];
    }
    // Update dashboard stats
    document.getElementById("stat-invoices").textContent =
      invoices.length || 0;
    document.getElementById("stat-quotations").textContent =
      quotations.length || 0;
  };

  return { saveDocument, updateDashboardCounts };
})();

/*******************
 * PDF Generator (single page A4)
 *******************/
const PDFGenerator = (() => {
  const { jsPDF } = window.jspdf;

           async function generatePdf(containerId, filename) {
     const element = document.getElementById(containerId);
     if (!element) {
       alert("PDF target not found");
       return;
     }

     // Clone and prepare for rendering (remove interactive parts)
     const clone = element.cloneNode(true);
     // Apply compact styling for PDF to fit on single A4 page
     clone.classList.add("pdf-compact");
     clone
       .querySelectorAll("button, .remove-item-btn")
       .forEach((b) => b.remove());
     
     // Improve PDF styling
     clone.style.background = "#ffffff";
     clone.style.color = "#000";
     clone.style.boxShadow = "none";
     clone.style.position = "absolute";
     clone.style.left = "-9999px";
     clone.style.width = "800px"; // Set fixed width for consistent rendering
     document.body.appendChild(clone);

     const canvas = await html2canvas(clone, { 
       scale: 2, 
       useCORS: true,
       backgroundColor: "#ffffff",
       width: 800,
       height: clone.scrollHeight
     });
     document.body.removeChild(clone);

     const pdf = new jsPDF("p", "mm", "a4");
     const pdfWidth = pdf.internal.pageSize.getWidth();
     const pdfHeight = pdf.internal.pageSize.getHeight();

     const imgWidthPx = canvas.width;
     const imgHeightPx = canvas.height;
     const dispHAtFullWidth = (imgHeightPx * pdfWidth) / imgWidthPx;
     const imgData = canvas.toDataURL("image/png", 1.0);

     if (dispHAtFullWidth <= pdfHeight) {
       // Fits as-is across width
       pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, dispHAtFullWidth);
     } else {
       // Scale down proportionally to fit height, centered horizontally
       const scale = pdfHeight / dispHAtFullWidth;
       const newW = pdfWidth * scale;
       const x = (pdfWidth - newW) / 2;
       pdf.addImage(imgData, "PNG", x, 0, newW, pdfHeight);
     }

     pdf.save(filename || "document.pdf");
   }

  return { generatePdf };
})();

/*******************
 * Page manager (navigation)
 *******************/
const PageManager = (() => {
  const pages = document.querySelectorAll(".page-content");
  // only select links that actually have data-page
  const navLinks = document.querySelectorAll(".nav-link[data-page]");
  const createToggle = document.getElementById("create-toggle");
  const createMenu = document.querySelector(".create-menu");
  const createArrow = document.getElementById("create-arrow");

  const showPage = (pageId) => {
    pages.forEach((p) => p.classList.add("hidden"));
    const pageEl = document.getElementById(`${pageId}-page`);
    if (pageEl) pageEl.classList.remove("hidden");

    // update active link visuals (only for nav links with data-page)
    navLinks.forEach((l) => l.classList.remove("active"));
    const link = document.querySelector(
      `.nav-link[data-page="${pageId}"]`
    );
    if (link) link.classList.add("active");
  };

  const setupListeners = () => {
    // nav links: only those with data-page attribute
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        // default anchor behaviour isn't desired here
        if (e && e.preventDefault) e.preventDefault();
        const page = link.getAttribute("data-page");
        if (page) {
          // Auto-expand the Create menu for sub-pages
          if (page === "invoice" || page === "quotation") {
            if (createMenu && createArrow && createToggle) {
              createMenu.classList.remove("hidden");
              createToggle.classList.add("active");
              createArrow.classList.remove("fa-chevron-right");
              createArrow.classList.add("fa-chevron-down");
            }
          }
          showPage(page);
          try {
            window.location.hash = `#${page}`;
          } catch (_) {}
        }
      });
    });

    // create-toggle separate handler
    if (createToggle) {
      createToggle.addEventListener("click", (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!createMenu || !createArrow) return;
        createMenu.classList.toggle("hidden");
        createToggle.classList.toggle("active");
        if (createMenu.classList.contains("hidden")) {
          createArrow.classList.remove("fa-chevron-down");
          createArrow.classList.add("fa-chevron-right");
        } else {
          createArrow.classList.remove("fa-chevron-right");
          createArrow.classList.add("fa-chevron-down");
        }
      });
    }

    // initial page (honor hash if present)
    const initial = (window.location.hash || "").replace("#", "");
    if (
      initial === "invoice" ||
      initial === "quotation" ||
      initial === "performance" ||
      initial === "dashboard"
    ) {
      if (
        (initial === "invoice" || initial === "quotation") &&
        createMenu &&
        createArrow &&
        createToggle
      ) {
        createMenu.classList.remove("hidden");
        createToggle.classList.add("active");
        createArrow.classList.remove("fa-chevron-right");
        createArrow.classList.add("fa-chevron-down");
      }
      showPage(initial);
    } else {
      showPage("dashboard");
    }
  };

  return { init: setupListeners, showPage };
})();

/*******************
 * Shared helper to create an item row (with delete button)
 *******************/
function createItemRowHtml(sno) {
  return `
    <tr>
      <td class="sno-cell">${sno}</td>
      <td><input type="text" class="item-duration" placeholder="e.g. 2 weeks"></td>
      <td><input type="text" class="item-description" placeholder="Service description"></td>
      <td><input type="number" class="item-qty" value="1" min="1"></td>
      <td><input type="number" class="item-price" value="0.00" min="0" step="0.01"></td>
      <td class="subtotal-cell">0.00</td>
      <td><button type="button" class="remove-item-btn" title="Remove row">&times;</button></td>
    </tr>
  `;
}

/*******************
 * Form Handler factory (invoice/quotation)
 *******************/
const FormHandler = (type, prefix) => {
  const itemsTable = document.getElementById(`${type}-items-table`);
  const addItemBtn = document.getElementById(`add-${type}-item`);
  const saveBtn = document.getElementById(`save-${type}`);
  const clearBtn = document.getElementById(`clear-${type}`);
  const generatePdfBtn = document.getElementById(`generate-${type}-pdf`);

  let snoCounter = 1;

  const recalcSnos = () => {
    const rows = itemsTable.querySelectorAll("tbody tr");
    let i = 1;
    rows.forEach((row) => {
      const cell = row.querySelector(".sno-cell");
      if (cell) cell.textContent = i++;
    });
    snoCounter = i;
  };

  const updateTotals = () => {
    const rows = itemsTable.querySelectorAll("tbody tr");
    let subtotal = 0;
    rows.forEach((row) => {
      const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
      const price =
        parseFloat(row.querySelector(".item-price").value) || 0;
      const itemSubtotal = qty * price;
      const subCell = row.querySelector(".subtotal-cell");
      if (subCell) subCell.textContent = itemSubtotal.toFixed(2);
      subtotal += itemSubtotal;
    });

    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText(`${type}-subtotal-val`, subtotal.toFixed(2));
    setText(`${type}-cgst-val`, cgst.toFixed(2));
    setText(`${type}-sgst-val`, sgst.toFixed(2));
    setText(`${type}-total-val`, total.toFixed(2));
  };

  const addEmptyRow = () => {
    const tbody = itemsTable.querySelector("tbody");
    const rowHtml = createItemRowHtml(snoCounter++);
    tbody.insertAdjacentHTML("beforeend", rowHtml);
    updateTotals();
  };

  const clearForm = () => {
    const page = document.getElementById(`${type}-page`);
    if (!page) return;
    // clear inputs (not readonly)
    page
      .querySelectorAll("input:not([readonly]), textarea, select")
      .forEach((el) => (el.value = ""));
    // reset numbers/ids/dates
    const custIdEl = document.getElementById(`${type}-customer-id`);
    if (custIdEl) custIdEl.value = IDGenerator.generateCustomerId();
    const dateEl = document.getElementById(`${type}-date`);
    if (dateEl)
      dateEl.value = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const numEl = document.getElementById(`${type}-number`);
    if (numEl)
      numEl.value = IDGenerator.getNextId(prefix, `${type}-count`);

    // reset items
    const tbody = itemsTable.querySelector("tbody");
    tbody.innerHTML = "";
    snoCounter = 1;
    addEmptyRow();
    updateTotals();
  };

   // Function to reset counter when form is cleared
   const resetCounter = () => {
     // Don't reset the counter - let it increment naturally
     // localStorage.removeItem(`${type}-count`);
   };

  const setupListeners = () => {
    if (addItemBtn) {
      addItemBtn.addEventListener("click", (e) => {
        if (e && e.preventDefault) e.preventDefault();
        addEmptyRow();
      });
    }

    // Delegated input listener to update totals on quantity/price change
    if (itemsTable) {
      itemsTable.addEventListener("input", (e) => {
        if (e.target.matches(".item-qty, .item-price")) updateTotals();
      });

      // Delegated click for remove buttons
      itemsTable.addEventListener("click", (e) => {
        if (e.target.matches(".remove-item-btn")) {
          const tr = e.target.closest("tr");
          if (tr) {
            tr.remove();
            recalcSnos();
            updateTotals();
          }
        }
      });
    }

               // Save
     if (saveBtn) {
       saveBtn.addEventListener("click", (e) => {
         if (e && e.preventDefault) e.preventDefault();
         const data = {
           number:
             (document.getElementById(`${type}-number`) || {}).value || "",
           date:
             (document.getElementById(`${type}-date`) || {}).value || "",
           projectName:
             (document.getElementById(`${type}-project-name`) || {})
               .value || "",
           hsnCode:
             (document.getElementById(`${type}-hsn-code`) || {}).value ||
             "",
           customerName:
             (document.getElementById(`${type}-customer-name`) || {})
               .value || "",
           customerId:
             (document.getElementById(`${type}-customer-id`) || {})
               .value || "",
           billingAddress:
             (document.getElementById(`${type}-billing-address`) || {})
               .value || "",
           items: [],
           totals: {
             subtotal:
               parseFloat(
                 (document.getElementById(`${type}-subtotal-val`) || {})
                   .textContent
               ) || 0,
             cgst:
               parseFloat(
                 (document.getElementById(`${type}-cgst-val`) || {})
                   .textContent
               ) || 0,
             sgst:
               parseFloat(
                 (document.getElementById(`${type}-sgst-val`) || {})
                   .textContent
               ) || 0,
             total:
               parseFloat(
                 (document.getElementById(`${type}-total-val`) || {})
                   .textContent
               ) || 0,
           },
         };

         itemsTable.querySelectorAll("tbody tr").forEach((row) => {
           data.items.push({
             sno: parseInt(
               row.querySelector(".sno-cell").textContent || "0",
               10
             ),
             duration: row.querySelector(".item-duration").value,
             description: row.querySelector(".item-description").value,
             qty: parseFloat(row.querySelector(".item-qty").value) || 0,
             price:
               parseFloat(row.querySelector(".item-price").value) || 0,
             subtotal:
               parseFloat(
                 row.querySelector(".subtotal-cell").textContent
               ) || 0,
           });
         });

         if (type === "invoice") {
           data.paymentMethod = (
             document.getElementById("invoice-payment-method") || {}
           ).value;
         }

         DocumentManager.saveDocument(`${type}s`, data);
         // Show success message
         alert(`${type === "invoice" ? "Invoice" : "Quotation"} saved successfully!`);
       });
     }

               // Clear button
     if (clearBtn) {
       clearBtn.addEventListener("click", (e) => {
         if (e && e.preventDefault) e.preventDefault();
         // Reset the counter when manually clearing
         localStorage.removeItem(`${type}-count`);
         clearForm();
       });
     }

               // Generate PDF
     if (generatePdfBtn) {
       generatePdfBtn.addEventListener("click", async (e) => {
         if (e && e.preventDefault) e.preventDefault();
         
         // Show alert
         alert(`${type === "invoice" ? "Invoice" : "Quotation"} PDF is being generated and downloaded!`);
         
         const fileName = `${
           type === "invoice" ? "Invoice" : "Quotation"
         }_${
           (document.getElementById(`${type}-number`) || {}).value ||
           Date.now()
         }.pdf`;
         
         // Generate and download PDF
         await PDFGenerator.generatePdf(`${type}-form-container`, fileName);
         
         // Clear form data
         clearForm();
       });
     }

    // Initial defaults
    const dateEl = document.getElementById(`${type}-date`);
    if (dateEl)
      dateEl.value = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const custIdEl = document.getElementById(`${type}-customer-id`);
    if (custIdEl) custIdEl.value = IDGenerator.generateCustomerId();
    const numEl = document.getElementById(`${type}-number`);
     if (numEl) {
       // Ensure we start with 001 if no counter exists
       const currentCount = localStorage.getItem(`${type}-count`);
       if (!currentCount) {
         localStorage.setItem(`${type}-count`, "0");
       }
      numEl.value = IDGenerator.getNextId(prefix, `${type}-count`);
     }

    itemsTable.querySelector("tbody").innerHTML = "";
    snoCounter = 1;
    addEmptyRow();
    updateTotals();
  };

  return { init: setupListeners, updateTotals };
};

/*******************
 * Initialize app
 *******************/
document.addEventListener("DOMContentLoaded", () => {
  // Performance page table and revenue summary
  function updatePerformanceTableAndRevenue() {
    const tbody = document.getElementById("performance-tbody");
    tbody.innerHTML = "";
    let allRows = [];
    let revenueInvoices = 0,
      revenueQuotations = 0,
      revenueToday = 0,
      revenueMonth = 0;
    const todayStr = new Date().toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const now = new Date();
    const monthStr =
      `${now.getMonth() + 1}`.padStart(2, "0") + "/" + now.getFullYear();

    function processDocs(docs, type) {
      docs.forEach((doc, idx) => {
        if (!doc.items || !Array.isArray(doc.items)) return;
        let docTotal = 0;
        doc.items.forEach((item) => {
          docTotal +=
            (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
        });
        if (type === "invoice") revenueInvoices += docTotal;
        if (type === "quotation") revenueQuotations += docTotal;
        // Date checks
        let docDate = doc.date || "";
        if (docDate === todayStr) revenueToday += docTotal;
        if (docDate.endsWith(monthStr)) revenueMonth += docTotal;
        // Add rows for each item
        doc.items.forEach((item, i) => {
          allRows.push({
            sno: allRows.length + 1,
            invoiceNo: doc.number || "-",
            project: doc.projectName || "-",
            duration: item.duration || "-",
            description: item.description || "-",
            qty: item.qty || "-",
            price: item.price || "-",
            total: (
              (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)
            ).toFixed(2),
          });
        });
      });
    }

    let invoices = [];
    let quotations = [];
    try {
      invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
    } catch (e) {}
    try {
      quotations = JSON.parse(localStorage.getItem("quotations") || "[]");
    } catch (e) {}
    processDocs(invoices, "invoice");
    processDocs(quotations, "quotation");

    allRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.sno}</td><td>${row.invoiceNo}</td><td>${
        row.project
      }</td><td>${row.duration}</td><td>${row.description}</td><td>${
        row.qty
      }</td><td>₹${parseFloat(row.price).toFixed(2)}</td><td>₹${
        row.total
      }</td>`;
      tbody.appendChild(tr);
    });

    document.getElementById(
      "revenue-invoices"
    ).innerHTML = `Revenue from Invoices:<br>₹${revenueInvoices.toFixed(
      2
    )}`;
    document.getElementById(
      "revenue-quotations"
    ).innerHTML = `Revenue from Quotations:<br>₹${revenueQuotations.toFixed(
      2
    )}`;
    document.getElementById(
      "revenue-today"
    ).innerHTML = `Revenue Today:<br>₹${revenueToday.toFixed(2)}`;
    document.getElementById(
      "revenue-month"
    ).innerHTML = `Revenue This Month:<br>₹${revenueMonth.toFixed(2)}`;
  }

  // Update performance page on navigation
  const perfLink = document.querySelector(
    '.nav-link[data-page="performance"]'
  );
  if (perfLink)
    perfLink.addEventListener("click", updatePerformanceTableAndRevenue);

  // Also update when view report card is clicked
  const viewReportCard = document.getElementById("view-report-card");
  if (viewReportCard) {
    viewReportCard.addEventListener("click", () => {
      updatePerformanceTableAndRevenue();
      PageManager.showPage("performance");
    });
  }

  // Dashboard CTA buttons
  const btnCreateQuotation = document.getElementById(
    "btn-create-quotation"
  );
  if (btnCreateQuotation) {
    btnCreateQuotation.addEventListener("click", () => {
      PageManager.showPage("quotation");
      // Optionally expand the 'Create' menu if it's collapsed
      const createMenu = document.querySelector(".create-menu");
      const createToggle = document.getElementById("create-toggle");
      const createArrow = document.getElementById("create-arrow");
      if (createMenu.classList.contains("hidden")) {
        createMenu.classList.remove("hidden");
        createToggle.classList.add("active");
        createArrow.classList.remove("fa-chevron-right");
        createArrow.classList.add("fa-chevron-down");
      }
    });
  }

  const btnContact = document.getElementById("btn-contact");
  if (btnContact) {
    btnContact.addEventListener("click", () => {
      alert(
        "Contact Sales: PH: +91 81426 78901 | Email: info@robocoupler.com"
      );
    });
  }

           // Clear storage and start fresh
   IDGenerator.clearStorage();

  PageManager.init();
  DocumentManager.updateDashboardCounts();

  // Make dashboard update on storage change
  window.addEventListener("storage", () => {
    DocumentManager.updateDashboardCounts();
  });

  const invoiceHandler = FormHandler("invoice", "AINV");
  invoiceHandler.init();

  const quotationHandler = FormHandler("quotation", "AQUT");
  quotationHandler.init();
});