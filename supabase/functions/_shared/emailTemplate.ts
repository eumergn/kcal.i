import { LOGO_BASE64 } from './logoBase64.ts';

export function deletionConfirmationEmail(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F2F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td align="center" style="background-color:#000000;padding:40px 24px;">
              <img src="data:image/png;base64,${LOGO_BASE64}" width="88" height="88" alt="kcal.i" style="display:block;border-radius:18px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:1.5px;color:#DC2626;text-transform:uppercase;">Account deletion requested</p>
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#0A0A0A;">Confirm deletion of your kcal.i account</h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:22px;color:#52525B;">
                We received a request to permanently delete your kcal.i account, including your profile, meal history, weight log and everything else tied to it. This cannot be undone.
              </p>
              <p style="margin:0 0 28px 0;font-size:14px;line-height:22px;color:#52525B;">
                To confirm, tap the button below. This link expires in <strong>1 hour</strong> and can only be used once.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 32px 32px;">
              <a href="${confirmUrl}" style="display:inline-block;background-color:#DC2626;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:14px;">
                Confirm account deletion
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;border-top:1px solid #E4E4E7;">
              <p style="margin:20px 0 0 0;font-size:12px;line-height:18px;color:#9CA3AF;">
                Didn't request this? You can safely ignore this email - your account will stay exactly as it is, and this link will simply expire.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FAFAFA;padding:24px 32px;border-top:1px solid #E4E4E7;">
              <p style="margin:0 0 4px 0;font-size:13px;font-weight:800;color:#0A0A0A;">kcal.i</p>
              <p style="margin:0;font-size:11px;line-height:16px;color:#A1A1AA;">Nutrition and grocery budget, personalized to you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
