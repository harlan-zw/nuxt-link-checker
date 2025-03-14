const html = String.raw

export const htmlTemplate = html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Checker Report</title>
  <style>
  :root {
    --color-bg: #ffffff;
    --color-text: #333333;
    --color-muted: #6b7280;
    --color-border: #e5e7eb;
    --color-primary: #3b82f6;
    --color-error: #ef4444;
    --color-error-bg: #fee2e2;
    --color-warning: #f59e0b;
    --color-warning-bg: #fef3c7;
    --color-success: #10b981;
    --color-success-bg: #d1fae5;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #1f2937;
      --color-text: #f3f4f6;
      --color-muted: #9ca3af;
      --color-border: #374151;
      --color-primary: #60a5fa;
      --color-error: #f87171;
      --color-error-bg: rgba(239, 68, 68, 0.2);
      --color-warning: #fbbf24;
      --color-warning-bg: rgba(245, 158, 11, 0.2);
      --color-success: #34d399;
      --color-success-bg: rgba(16, 185, 129, 0.2);
    }
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    color: var(--color-text);
    background-color: var(--color-bg);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .summary {
    background-color: var(--color-primary);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .route-section {
    margin-bottom: 2rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .route-header {
    padding: 1rem;
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid var(--color-border);
  }

  .route-link {
    color: var(--color-primary);
    text-decoration: none;
    word-break: break-all;
  }

  .route-link:hover {
    text-decoration: underline;
  }

  .route-status {
    font-size: 0.9rem;
    font-weight: normal;
  }

  .status-error .route-status {
    color: var(--color-error);
  }

  .status-warning .route-status {
    color: var(--color-warning);
  }

  .route-issues {
    padding: 1rem;
  }

  .link-item {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.375rem;
    border-left: 4px solid transparent;
  }

  .link-error {
    background-color: var(--color-error-bg);
    border-left-color: var(--color-error);
  }

  .link-warning {
    background-color: var(--color-warning-bg);
    border-left-color: var(--color-warning);
  }

  .link-header {
    margin-bottom: 0.75rem;
  }

  .link-url {
    display: block;
    font-weight: bold;
    word-break: break-all;
    color: var(--color-primary);
    text-decoration: none;
  }

  .link-url:hover {
    text-decoration: underline;
  }

  .link-text {
    font-style: italic;
    color: var(--color-muted);
    margin-top: 0.25rem;
  }

  .issues-list {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
  }

  .error, .warning {
    padding: 0.75rem 0;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
    align-items: start;
  }

  .error-icon, .warning-icon {
    font-size: 1.125rem;
    line-height: 1.5;
  }

  .error-icon {
    color: var(--color-error);
  }

  .warning-icon {
    color: var(--color-warning);
  }

  .error-type, .warning-type {
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .fix-suggestion {
    grid-column: 2 / span 2;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }

  .fix-label {
    font-weight: bold;
  }

  .valid-message {
    color: var(--color-success);
    font-weight: bold;
  }

  .no-issues {
    color: var(--color-success);
    text-align: center;
    padding: 1rem;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    .error, .warning {
      grid-template-columns: auto 1fr;
    }

    .error-type, .warning-type {
      grid-column: 2;
      margin-top: -0.5rem;
    }
  }
  .table-of-contents {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background-color: rgba(0, 0, 0, 0.02);
  }

  .table-of-contents h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .toc-list {
    list-style-type: none;
    padding-left: 0;
    margin-bottom: 0;
  }

  .toc-list li {
    margin-bottom: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.25rem;
  }

  .toc-list li:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .toc-list a {
    text-decoration: none;
    color: var(--color-primary);
  }

  .toc-status {
    font-size: 0.85rem;
    margin-left: 0.5rem;
    color: var(--color-muted);
  }

  .toc-error a {
    font-weight: bold;
    color: var(--color-error);
  }

  .toc-warning a {
    color: var(--color-warning);
  }

  .back-to-top {
    margin-top: 1rem;
    text-align: right;
    font-size: 0.875rem;
  }

  .back-to-top a {
    color: var(--color-muted);
    text-decoration: none;
  }

  .back-to-top a:hover {
    text-decoration: underline;
    color: var(--color-primary);
  }

  @media (min-width: 768px) {
    .toc-list {
      column-count: 2;
      column-gap: 2rem;
    }
  }

  @media (min-width: 1200px) {
    .toc-list {
      column-count: 3;
    }
  }
  </style>
</head>
<body>
<div class="container">
  <h1>Nuxt Link Checker Report</h1>
  <!-- REPORT -->
</div>
<script>
// Add basic interactivity if desired
document.addEventListener('DOMContentLoaded', () => {
  // Count and display summary information
  const errors = document.querySelectorAll('.error').length;
  const warnings = document.querySelectorAll('.warning').length;
  const routes = document.querySelectorAll('.route-section').length;

  if (routes > 0) {
    const summary = document.createElement('div');
    summary.className = 'summary';
    summary.innerHTML = \`<strong>Summary:</strong> Found \${errors} error\${errors !== 1 ? 's' : ''} and \${warnings} warning\${warnings !== 1 ? 's' : ''} across \${routes} page\${routes !== 1 ? 's' : ''}.\`;
    document.querySelector('h1').insertAdjacentElement('afterend', summary);
  }
</script>
</body>
</html>
`
