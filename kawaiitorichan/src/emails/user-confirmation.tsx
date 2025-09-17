import * as React from 'react'

interface UserConfirmationEmailProps {
  name: string
  message: string
  submittedAt: string
}

export const UserConfirmationEmail: React.FC<UserConfirmationEmailProps> = ({
  name,
  message,
  submittedAt,
}) => {
  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#357A35',
          color: 'white',
          padding: '30px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '28px' }}>
          お問い合わせありがとうございます
        </h1>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '30px',
        }}
      >
        <p style={{ fontSize: '16px', color: '#333', marginBottom: '20px' }}>
          {name} 様
        </p>

        <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.6', marginBottom: '25px' }}>
          この度は、お問い合わせいただき誠にありがとうございます。<br />
          お問い合わせ内容を確認させていただきました。
        </p>

        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            marginBottom: '25px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              color: '#333',
              marginTop: 0,
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '2px solid #357A35',
            }}
          >
            お問い合わせ内容
          </h2>
          <div
            style={{
              fontSize: '14px',
              color: '#555',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {message}
          </div>
          <p
            style={{
              fontSize: '13px',
              color: '#666',
              marginTop: '15px',
              marginBottom: 0,
            }}
          >
            送信日時: {submittedAt}
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#E8F5E8',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '25px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              color: '#357A35',
              marginTop: 0,
              marginBottom: '10px',
            }}
          >
            📧 今後の対応について
          </h3>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
            担当者より、通常1-2営業日以内にご連絡させていただきます。<br />
            お急ぎの場合は、お電話でもお問い合わせを承っております。
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#856404', margin: 0, lineHeight: '1.5' }}>
            <strong>⚠️ ご注意</strong><br />
            このメールは自動送信メールです。このメールに返信されても、お返事することができません。
            追加のご質問等がございましたら、改めてお問い合わせフォームよりご連絡ください。
          </p>
        </div>

        <div
          style={{
            borderTop: '1px solid #e0e0e0',
            paddingTop: '20px',
            marginTop: '30px',
          }}
        >
          <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
            何卒よろしくお願いいたします。
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <p style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
          このメールに心当たりがない場合は、お手数ですが削除してください。
        </p>
        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
          © 2024 Golf Website. All rights reserved.
        </p>
      </div>
    </div>
  )
}

