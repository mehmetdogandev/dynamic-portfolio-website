/**
 * CSS styles for PDF rendering
 */

export const pdfStyles = `
	/* Reset and base styles */
	html, body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
	}

	* {
		box-sizing: border-box;
	}

	/* Ensure body and direct children have no margins */
	body {
		display: block;
		margin: 0;
		padding: 0;
		/* Prevent body from extending beyond last page */
		height: auto;
		min-height: 0;
	}

	/* Direct page children should have no margins */
	body > .pm-page {
		margin: 0;
		padding: 0;
	}

	/* Remove any whitespace after last page */
	body > .pm-page:last-child ~ * {
		display: none;
	}

	body {
		/* Default font settings - can be overridden by page nodes */
		font-family: Arial, sans-serif;
		font-size: 12pt;
		/* Line height is set by .pm-page inline styles - don't set default here to avoid inheritance issues */
		/* If .pm-page doesn't have line-height, browser default will be used */
		color: #000;
		background: #fff;
		white-space: pre-wrap; /* Preserve whitespace and line breaks */
		/* Improve font rendering for PDF - match editor rendering */
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
		font-smoothing: antialiased;
		/* Ensure consistent line height calculation */
		-webkit-text-size-adjust: 100%;
		-moz-text-size-adjust: 100%;
		text-size-adjust: 100%;
	}

	/* Page nodes can override font family and line height via inline styles */
	.pm-page {
		/* Font family, font size, and line height are set via inline style from page node attributes */
		/* These values will be inherited by all child elements including .pm-content */
	}
	
	/* Ensure page content inherits line height from page */
	.pm-content {
		/* Inherit line height from .pm-page (which has inline style) */
		line-height: inherit;
		/* If .pm-page doesn't have line-height, inherit from body (which has no line-height, so browser default) */
	}

	/* Page container - each page is exactly A4 size */
	@page {
		size: A4;
		margin: 0;
	}

	.pm-page {
		width: 210mm;
		height: 297mm; /* Fixed A4 height - each page div is exactly one PDF page */
		margin: 0;
		/* Padding (margins) are set dynamically via inline styles from page node attributes */
		/* marginTop, marginBottom, marginLeft, marginRight are applied as padding */
		background: white;
		position: relative;
		box-sizing: border-box;
		overflow: hidden; /* Prevent content overflow to avoid extra pages */
		display: block;
		page-break-inside: avoid; /* Prevent breaking inside a page div */
		break-inside: avoid;
		/* Only add page break after pages that are NOT the last one */
		page-break-after: auto;
		break-after: auto;
		transition: width 0.3s ease; /* Smooth transition for orientation change */
	}

	/* Each page except the last should create a new PDF page */
	.pm-page:not(:last-child) {
		page-break-after: always;
		break-after: page;
	}

	/* Landscape orientation */
	.pm-page[data-orientation="landscape"] {
		width: 297mm; /* A4 Landscape width */
		min-height: 210mm; /* A4 Landscape height */
	}

	.pm-page:first-child {
		margin-top: 0;
		page-break-before: avoid;
		break-before: avoid;
	}

	.pm-page:last-child {
		margin-bottom: 0;
		page-break-after: avoid !important;
		break-after: avoid !important;
		/* Force no page break after last page */
	}
	
	/* Prevent any content after last page from creating new page */
	body > .pm-page:last-child::after {
		display: none;
		content: none;
	}

	/* Content */
	/* Height is dynamically calculated based on page padding (margins) */
	/* Page margins are applied as padding on .pm-page, so content fills remaining space */
	.pm-content {
		width: 100%;
		/* Height is automatically calculated: 297mm (A4) minus page padding (margins) */
		/* No fixed height - margins are managed dynamically via page node attributes */
		padding: 5mm;
		overflow: visible; /* Allow content to overflow for page breaking */
		box-sizing: border-box;
		page-break-inside: auto;
	}

	/* Dynamic repeat table - allow page breaking */
	.pm-dynamic-table {
		width: 100%;
		border-collapse: collapse;
		page-break-inside: auto;
		break-inside: auto;
		/* Font size and line height are set via inline style in render.ts - don't use inherit to allow inline style to work */
	}

	.pm-dynamic-table thead {
		display: table-header-group; /* Repeat header on each page */
	}

	.pm-dynamic-table tbody tr {
		page-break-inside: avoid;
		break-inside: avoid;
	}
	
	.pm-dynamic-table th,
	.pm-dynamic-table td {
		/* Font size and line height are set via inline style in render.ts - don't use inherit to allow inline style to work */
	}
	
	.pm-dynamic-table th p,
	.pm-dynamic-table td p {
		margin: 0;
		/* Font size and line height inherit from parent cell (which has inline style for font-size and line-height) */
		line-height: inherit;
		font-size: inherit;
	}

	/* Page break */
	.pm-page-break {
		border-top: 2px dashed #ccc;
		margin: 10mm 0;
		height: 1px;
		page-break-after: always;
	}

	/* Placeholder styling - removed for PDF (placeholders are replaced with actual values) */
	.pm-placeholder {
		background: transparent;
		padding: 0;
		border-radius: 0;
		font-family: inherit;
		font-size: inherit;
	}

	/* Typography */
	p {
		margin: 0;
		padding: 0;
		white-space: pre-wrap; /* Preserve whitespace in paragraphs */
		/* Line height is inherited from page - ensure it's applied correctly */
		line-height: inherit;
		/* Ensure consistent font rendering */
		-webkit-font-smoothing: inherit;
		-moz-osx-font-smoothing: inherit;
	}
	
	/* Paragraph spacing proportional to line-height */
	.pm-content p + p {
		margin-top: 0.1em; /* Small spacing between paragraphs, proportional to line-height */
	}
	
	/* Ensure text elements inherit line height correctly */
	.pm-content p,
	.pm-content li,
	.pm-content td,
	.pm-content th,
	.pm-content span {
		line-height: inherit;
	}
	
	/* Override for elements that should use their own line height (headings, etc) */
	.pm-content h1,
	.pm-content h2,
	.pm-content h3,
	.pm-content h4,
	.pm-content h5,
	.pm-content h6 {
		line-height: 1.2; /* Tighter line height for headings */
	}
	
	/* Ensure line height marks work correctly */
	.pm-content span[style*="line-height"] {
		/* Mark's inline style will override inherited value */
	}

	/* Preserve visibly empty paragraphs as blank lines */
	.pm-content p:empty::after {
		content: "\\00a0";
		white-space: pre-wrap;
	}

	h1, h2, h3, h4, h5, h6 {
		margin: 0 0 0.5em 0;
		font-weight: bold;
	}

	h1 { font-size: 24pt; }
	h2 { font-size: 20pt; }
	h3 { font-size: 18pt; }
	h4 { font-size: 16pt; }
	h5 { font-size: 14pt; }
	h6 { font-size: 12pt; }

	/* Lists */
	ul, ol {
		margin: 0 0 1em 1.5em;
		padding: 0;
	}

	li {
		margin: 0.25em 0;
	}

	/* Tables */
	table {
		border-collapse: collapse;
		width: 100%;
		margin: 1em 0;
		table-layout: fixed;
	}

	th, td {
		border: 1px solid #333;
		padding: 8px 12px;
		text-align: left;
		vertical-align: top;
		/* Inherit font size and line height from page for consistency */
		font-size: inherit;
		line-height: inherit;
	}

	th {
		background: var(--table-header-bg, #f0f0f0);
		font-weight: bold;
	}

	th p, td p {
		margin: 0;
		/* Inherit line height and font size from cell */
		line-height: inherit;
		font-size: inherit;
	}
	
	/* Mark styles (font-size, line-height) in table cells should use their own values */
	/* Inline styles from marks will override inherited values automatically */

	/* Borderless table */
	table.pm-table-border-none th,
	table.pm-table-border-none td {
		border: none !important;
	}

	/* Print media */
	@media print {
		@page {
			size: A4;
			margin: 0;
		}

		html, body {
			margin: 0;
			padding: 0;
			width: 100%;
			height: 100%;
		}

		body {
			display: block;
		}

		.pm-page {
			margin: 0;
			padding: 0;
			box-shadow: none;
			page-break-inside: avoid;
			break-inside: avoid;
			/* Only add page break after pages that are NOT the last one */
			page-break-after: auto;
			break-after: auto;
		}

		/* Each page except the last should create a new PDF page */
		.pm-page:not(:last-child) {
			page-break-after: always;
			break-after: page;
		}

		.pm-page:first-child {
			margin-top: 0;
			page-break-before: avoid;
			break-before: avoid;
		}

		.pm-page:last-child {
			margin-bottom: 0;
			page-break-after: avoid !important;
			break-after: avoid !important;
			/* Force no page break after last page in print */
		}
		
		/* Ensure body ends exactly at last page */
		body {
			height: auto;
			min-height: 0;
		}

		.pm-page-break {
			page-break-after: always;
		}

		/* Landscape support for print */
		@page {
			size: auto; /* Let browser handle size based on content or specific page settings */
			margin: 0;
		}

		.pm-page[data-orientation="landscape"] {
			width: 297mm;
			min-height: 210mm;
		}
	}
`
