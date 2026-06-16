const BRAND_NAME = 'HR API';
const BRAND_COLOR = '#4640de';
const TEXT_COLOR = '#25324b';
const MUTED_COLOR = '#7c8493';
const BG_COLOR = '#f8f8fd';

export function renderLayout(params: {
  title: string;
  preheader: string;
  content: string;
}): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${params.title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BG_COLOR};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${params.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e5e7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <tr>
              <td style="background-color:${BRAND_COLOR};padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.4px;">${BRAND_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
                ${params.content}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e4e5e7;color:${MUTED_COLOR};font-size:12px;line-height:1.5;">
                You are receiving this email because an action was requested on your ${BRAND_NAME} account.
                If you did not request it, you can safely ignore this message.
                <br /><br />
                &copy; ${year} ${BRAND_NAME}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderCode(code: string): string {
  return `<div style="margin:24px 0;text-align:center;">
    <span style="display:inline-block;background-color:${BG_COLOR};border:1px solid #e4e5e7;border-radius:10px;padding:16px 28px;font-size:30px;font-weight:700;letter-spacing:8px;color:${TEXT_COLOR};">${code}</span>
  </div>`;
}
