const html = String.raw

export const htmlTemplate = html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- SiteName --></title>
  <style>
  :root {
    --color-bg: #121212;
    --color-bg-secondary: #1e1e1e;
    --color-text: #e0e0e0;
    --color-muted: #a0a0a0;
    --color-border: #333333;
    --color-primary: #4f8ef7;
    --color-primary-dark: #3a6bc5;
    --color-error: #f44336;
    --color-error-bg: rgba(244, 67, 54, 0.15);
    --color-warning: #ff9800;
    --color-warning-bg: rgba(255, 152, 0, 0.15);
    --color-success: #00c853;
    --color-success-bg: rgba(0, 200, 83, 0.15);
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --border-radius: 0.5rem;
  }

  @media (prefers-color-scheme: light) {
    :root {
      --color-bg: #f8f9fa;
      --color-bg-secondary: #ffffff;
      --color-text: #212529;
      --color-muted: #6c757d;
      --color-border: #dee2e6;
      --color-primary: #3a6bc5;
      --color-primary-dark: #2a4d8f;
      --color-error: #dc3545;
      --color-error-bg: rgba(220, 53, 69, 0.1);
      --color-warning: #fd7e14;
      --color-warning-bg: rgba(253, 126, 20, 0.1);
      --color-success: #20c997;
      --color-success-bg: rgba(32, 201, 151, 0.1);
      --box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
    }
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: var(--color-primary-dark);
    text-decoration: none;
  }

  body {
    font-family: var(--font-sans);
    line-height: 1.6;
    margin: 0;
    padding: 0;
    color: var(--color-text);
    background-color: var(--color-bg);
    font-size: 15px;
  }

  .container {
    max-width: 1140px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0;
    padding-bottom: 0;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .report-header {
    margin-bottom: 2.5rem;
  }

  .timestamp {
    font-size: 0.875rem;
    color: var(--color-muted);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
  }

  .timestamp::before {
    content: '⏱️';
    margin-right: 0.5rem;
  }

  .report-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .report-meta .version {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .report-meta .version::before {
    content: "🔍";
  }

  .report-meta .timestamp {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .report-meta .timestamp::before {
    content: "⏱️";
  }

  .summary {
    margin-bottom: 2.5rem;
  }

  .summary h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .summary-stats li {
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--box-shadow);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .summary-stats li:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .summary-stats li::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: var(--color-primary);
  }

  .summary-stats li:nth-child(2)::before {
    background-color: var(--color-error);
  }

  .summary-stats li:nth-child(3)::before {
    background-color: var(--color-warning);
  }

  .stat-label {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .stat-value {
    font-size: 2.25rem;
    line-height: 1.2;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0.25rem;
  }

  .error-count {
    color: var(--color-error);
  }

  .warning-count {
    color: var(--color-warning);
  }

  .stat-icon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.25rem;
    opacity: 0.15;
  }

  .table-of-contents {
    margin-bottom: 2.5rem;
    padding: 1.5rem;
    border-radius: var(--border-radius);
    background-color: var(--color-bg-secondary);
    box-shadow: var(--box-shadow);
  }

  .table-of-contents h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.25rem;
  }

  .toc-list {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
  }

  .toc-list li {
    margin-bottom: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease;
  }

  .toc-list li:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .toc-list a {
    text-decoration: none;
    color: var(--color-primary);
    display: inline-flex;
    align-items: center;
  }

  .toc-status {
    font-size: 0.75rem;
    margin-left: 0.5rem;
    color: var(--color-muted);
    font-weight: 500;
  }

  .toc-error a {
    font-weight: 600;
    color: var(--color-error);
  }

  .toc-warning a {
    color: var(--color-warning);
  }

  .route-section {
    margin-bottom: 2rem;
    border-radius: var(--border-radius);
    overflow: hidden;
    background-color: var(--color-bg-secondary);
    box-shadow: var(--box-shadow);
  }

  .route-header {
    padding: 1rem 1.5rem;
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid var(--color-border);
    font-size: 1.125rem;
  }

  .route-link {
    color: var(--color-primary);
    text-decoration: none;
    word-break: break-all;
    font-weight: 600;
  }

  .route-status {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
  }

  .status-error .route-status {
    color: var(--color-error);
    background: var(--color-error-bg);
  }

  .status-warning .route-status {
    color: var(--color-warning);
    background: var(--color-warning-bg);
  }

  .route-issues {
    padding: 1.5rem;
  }

  .link-item {
    padding: 1.25rem;
    margin-bottom: 1.25rem;
    border-radius: 0.375rem;
    border-left: 4px solid transparent;
    background-color: rgba(255, 255, 255, 0.02);
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
    margin-bottom: 1rem;
  }

  .link-url {
    display: block;
    font-weight: 600;
    word-break: break-all;
    color: var(--color-primary);
    text-decoration: none;
    padding-bottom: 0.5rem;
  }

  .link-text {
    font-style: italic;
    color: var(--color-muted);
    margin-top: 0.375rem;
    font-size: 0.9375rem;
  }

  .issues-list {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
  }

  .error, .warning {
    padding: 0.875rem 0;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: start;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .error:last-child, .warning:last-child {
    border-bottom: none;
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
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .fix-suggestion {
    grid-column: 2 / span 2;
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 0.375rem;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  .fix-label {
    font-weight: 600;
    color: var(--color-primary);
  }

  .valid-message {
    color: var(--color-success);
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .valid-message::before {
    content: "✅";
    margin-right: 0.5rem;
  }

  .no-issues {
    color: var(--color-success);
    text-align: center;
    padding: 2rem;
    font-weight: 600;
    font-size: 1.125rem;
  }

  .back-to-top {
    margin-top: 1.5rem;
    text-align: right;
    font-size: 0.875rem;
  }

  .back-to-top a {
    color: var(--color-muted);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: color 0.2s ease;
  }

  .back-to-top a::before {
    content: "↑";
    margin-right: 0.375rem;
  }

  .back-to-top a:hover {
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

  @media (max-width: 768px) {
    .error, .warning {
      grid-template-columns: auto 1fr;
    }

    .error-type, .warning-type {
      grid-column: 2;
      margin-top: -0.5rem;
    }

    .summary-stats {
      grid-template-columns: 1fr;
    }
  }
  .issues-summary {
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: var(--box-shadow);
    background-color: var(--color-bg-secondary);
  }

  .common-issues-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .common-issue {
    display: flex;
    align-items: flex-start;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .common-issue:last-child {
    border-bottom: none;
  }

  .common-issue.error {
    color: var(--color-error);
  }

  .common-issue.warning {
    color: var(--color-warning);
  }

  .issue-count {
    font-weight: bold;
    margin-right: 0.75rem;
    min-width: 2em;
    text-align: right;
  }

  .error-icon, .warning-icon {
    margin-right: 0.5rem;
  }

  .issue-text {
    flex: 1;
  }
  </style>
</head>
<body>
<div class="container">
  <h1><!-- SiteName --></h1>
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
