/**
 * Email templates as HTML strings for Resend
 */

export function getAdminNotificationEmailHtml(data: {
  name: string
  email: string
  phone?: string
  message: string
  submittedAt: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>新しいお問い合わせ</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #357A35; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">新しいお問い合わせ</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">${data.name}様からお問い合わせが届きました</p>
        </div>
        
        <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; color: #333; margin-bottom: 15px; border-bottom: 2px solid #357A35; padding-bottom: 5px;">
              送信者情報
            </h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px; vertical-align: top;">
                  <strong>お名前:</strong>
                </td>
                <td style="padding: 8px 0; color: #333;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px; vertical-align: top;">
                  <strong>メールアドレス:</strong>
                </td>
                <td style="padding: 8px 0;">
                  <a href="mailto:${data.email}" style="color: #357A35;">${data.email}</a>
                </td>
              </tr>
              ${data.phone ? `
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px; vertical-align: top;">
                  <strong>電話番号:</strong>
                </td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="tel:${data.phone}" style="color: #357A35; text-decoration: none;">${data.phone}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px; vertical-align: top;">
                  <strong>送信日時:</strong>
                </td>
                <td style="padding: 8px 0; color: #333;">${data.submittedAt}</td>
              </tr>
            </table>
          </div>
          
          <div>
            <h2 style="font-size: 18px; color: #333; margin-bottom: 15px; border-bottom: 2px solid #357A35; padding-bottom: 5px;">
              お問い合わせ内容
            </h2>
            <div style="background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #e0e0e0; white-space: pre-wrap; word-wrap: break-word; color: #333; line-height: 1.6;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ 対応のお願い</strong><br>
              このメールは自動送信されています。お客様への返信をお願いいたします。
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 10px; text-align: center; color: #666; font-size: 12px;">
          <p>このメールは自動送信システムから送信されています。</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getUserConfirmationEmailHtml(data: {
  name: string
  message: string
  submittedAt: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>お問い合わせを受け付けました</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #357A35; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">お問い合わせありがとうございます</h1>
        </div>
        
        <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            ${data.name} 様
          </p>
          
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 25px;">
            この度は、お問い合わせいただき誠にありがとうございます。<br>
            お問い合わせ内容を確認させていただきました。
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 25px;">
            <h2 style="font-size: 16px; color: #333; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #357A35;">
              お問い合わせ内容
            </h2>
            <div style="font-size: 14px; color: #555; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            <p style="font-size: 13px; color: #666; margin-top: 15px; margin-bottom: 0;">
              送信日時: ${data.submittedAt}
            </p>
          </div>
          
          <div style="background-color: #E8F5E8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="font-size: 16px; color: #357A35; margin-top: 0; margin-bottom: 10px;">
              📧 今後の対応について
            </h3>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0;">
              担当者より、通常1-2営業日以内にご連絡させていただきます。<br>
              お急ぎの場合は、お電話でもお問い合わせを承っております。
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #856404; margin: 0; line-height: 1.5;">
              <strong>⚠️ ご注意</strong><br>
              このメールは自動送信メールです。このメールに返信されても、お返事することができません。
              追加のご質問等がございましたら、改めてお問い合わせフォームよりご連絡ください。
            </p>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              何卒よろしくお願いいたします。
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; margin-bottom: 10px;">
            このメールに心当たりがない場合は、お手数ですが削除してください。
          </p>
          <p style="font-size: 12px; color: #999; margin: 0;">
            © 2024 Golf Website. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}