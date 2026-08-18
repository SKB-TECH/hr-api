const BRAND_NAME = 'Fast2Hire';
const BRAND_COLOR = '#4640de';
const BRAND_DARK = '#17243e';
const TEXT_COLOR = '#4a4a4a';
const MUTED_COLOR = '#777777';
const BG_COLOR = '#f2f2f2';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });
}

export function renderLayout(params: {
  title: string;
  preheader: string;
  content: string;
  logoUrl?: string;
  unsubscribeUrl?: string;
}): string {
  const logo = params.logoUrl
    ? `<img src="${escapeHtml(params.logoUrl)}" width="190" alt="${BRAND_NAME}" style="display:block;width:190px;max-width:70%;height:auto;border:0;" />`
    : `<span style="color:${BRAND_DARK};font-size:28px;font-weight:800;">Fast<span style="color:${BRAND_COLOR};">2</span>Hire</span>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BG_COLOR};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(params.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${BG_COLOR};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
      <tr><td align="center" style="padding:28px 12px 18px;">${logo}</td></tr>
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:#ffffff;border-radius:4px;">
            <tr><td style="padding:38px 28px 40px;color:${TEXT_COLOR};font-size:15px;line-height:1.65;">${params.content}</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:24px 12px 32px;color:${MUTED_COLOR};font-size:12px;line-height:1.55;">
          <strong style="color:${TEXT_COLOR};font-size:13px;">FAST2HIRE</strong><br />
          <strong style="color:${TEXT_COLOR};">Fit not fight</strong><br /><br />
          Kinshasa, Democratic Republic of the Congo, Central Africa<br /><br />
          ${params.unsubscribeUrl ? `<a href="${escapeHtml(params.unsubscribeUrl)}" style="color:${MUTED_COLOR};text-decoration:underline;">Unsubscribe</a>` : ''}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderHeading(title: string): string {
  return `<h1 style="margin:0 0 24px;color:${BRAND_COLOR};font-size:24px;line-height:1.25;text-align:center;font-weight:700;">${escapeHtml(title)}</h1>`;
}

export function renderWelcome(): string {
  return `<p style="margin:0 0 24px;text-align:center;font-weight:700;color:${TEXT_COLOR};">Welcome to ${BRAND_NAME}!</p>`;
}

export function renderCode(code: string): string {
  return `<div style="margin:24px 0;text-align:center;"><span style="display:inline-block;background-color:#f5f7f8;border:1px solid #d7e2e5;border-radius:4px;padding:14px 24px;font-size:30px;font-weight:700;letter-spacing:7px;color:${BRAND_DARK};">${escapeHtml(code)}</span></div>`;
}

export function renderButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;"><tr><td bgcolor="${BRAND_COLOR}" style="border-radius:3px;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 34px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(label)}</a></td></tr></table>`;
}
