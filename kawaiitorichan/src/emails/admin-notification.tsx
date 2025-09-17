import * as React from 'react'

interface AdminNotificationEmailProps {
  name: string
  email: string
  phone?: string
  message: string
  submittedAt: string
}

export const AdminNotificationEmail: React.FC<AdminNotificationEmailProps> = ({
  name,
  email,
  phone,
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
          padding: '20px',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>
          新しいお問い合わせ
        </h1>
        <p style={{ margin: '10px 0 0', opacity: 0.9 }}>
          {name}様からお問い合わせが届きました
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '20px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '18px',
              color: '#333',
              marginBottom: '15px',
              borderBottom: '2px solid #357A35',
              paddingBottom: '5px',
            }}
          >
            送信者情報
          </h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#666',
                    width: '120px',
                    verticalAlign: 'top',
                  }}
                >
                  <strong>お名前:</strong>
                </td>
                <td style={{ padding: '8px 0', color: '#333' }}>{name}</td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#666',
                    width: '120px',
                    verticalAlign: 'top',
                  }}
                >
                  <strong>メールアドレス:</strong>
                </td>
                <td style={{ padding: '8px 0' }}>
                  <a href={`mailto:${email}`} style={{ color: '#357A35' }}>
                    {email}
                  </a>
                </td>
              </tr>
              {phone && (
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      color: '#666',
                      width: '120px',
                      verticalAlign: 'top',
                    }}
                  >
                    <strong>電話番号:</strong>
                  </td>
                  <td style={{ padding: '8px 0', color: '#333' }}>
                    <a href={`tel:${phone}`} style={{ color: '#357A35', textDecoration: 'none' }}>
                      {phone}
                    </a>
                  </td>
                </tr>
              )}
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    color: '#666',
                    width: '120px',
                    verticalAlign: 'top',
                  }}
                >
                  <strong>送信日時:</strong>
                </td>
                <td style={{ padding: '8px 0', color: '#333' }}>{submittedAt}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2
            style={{
              fontSize: '18px',
              color: '#333',
              marginBottom: '15px',
              borderBottom: '2px solid #357A35',
              paddingBottom: '5px',
            }}
          >
            お問い合わせ内容
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              color: '#333',
              lineHeight: '1.6',
            }}
          >
            {message}
          </div>
        </div>

        <div
          style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
            <strong>⚠️ 対応のお願い</strong><br />
            このメールは自動送信されています。お客様への返信をお願いいたします。
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '10px',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px',
        }}
      >
        <p>このメールは自動送信システムから送信されています。</p>
      </div>
    </div>
  )
}

