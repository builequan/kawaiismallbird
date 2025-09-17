import { getPayload } from 'payload'
import config from '../src/payload.config'
import { RequiredDataFromCollectionSlug } from 'payload'

async function createContactPage() {
  const payload = await getPayload({ config })

  try {
    console.log('Creating Japanese contact form and page...')

    // Create the contact form
    const contactFormData: RequiredDataFromCollectionSlug<'forms'> = {
      title: 'お問い合わせフォーム',
      confirmationType: 'message',
      confirmationMessage: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'お問い合わせありがとうございます',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h2',
              version: 1,
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'お問い合わせ内容を確認させていただきました。',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: '内容を確認の上、担当者より1-2営業日以内にご連絡させていただきます。',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'お急ぎの場合は、お電話でもお問い合わせを承っております。',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      submitButtonLabel: '送信する',
      fields: [
        {
          name: 'name',
          blockName: 'お名前',
          blockType: 'text',
          label: 'お名前',
          required: true,
          width: 100,
        },
        {
          name: 'email',
          blockName: 'メールアドレス',
          blockType: 'email',
          label: 'メールアドレス',
          required: true,
          width: 100,
        },
        {
          name: 'phone',
          blockName: '電話番号',
          blockType: 'text',
          label: '電話番号',
          required: false,
          width: 100,
        },
        {
          name: 'message',
          blockName: 'お問い合わせ内容',
          blockType: 'textarea',
          label: 'お問い合わせ内容',
          required: true,
          width: 100,
        },
      ],
      emails: [
        {
          emailFrom: '"お問い合わせフォーム" <noreply@yourdomain.com>',
          emailTo: process.env.CONTACT_EMAIL_TO || 'admin@example.com',
          subject: '【お問い合わせ】{{name}}様より',
          message: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'heading',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '新しいお問い合わせが届きました',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  tag: 'h2',
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 1,
                      mode: 'normal',
                      style: '',
                      text: 'お名前: ',
                      version: 1,
                    },
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '{{name}}',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 1,
                      mode: 'normal',
                      style: '',
                      text: 'メールアドレス: ',
                      version: 1,
                    },
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '{{email}}',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 1,
                      mode: 'normal',
                      style: '',
                      text: '電話番号: ',
                      version: 1,
                    },
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '{{phone}}',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 1,
                      mode: 'normal',
                      style: '',
                      text: 'お問い合わせ内容:',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '{{message}}',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
        {
          emailFrom: '"Golf Website" <noreply@yourdomain.com>',
          emailTo: '{{email}}',
          subject: 'お問い合わせを受け付けました',
          message: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '{{name}} 様',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'この度は、お問い合わせいただき誠にありがとうございます。',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '以下の内容でお問い合わせを受け付けました：',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '{{message}}',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '内容を確認の上、担当者より1-2営業日以内にご連絡させていただきます。',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: '何卒よろしくお願いいたします。',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
      ],
    }

    // Check if form already exists
    const existingForms = await payload.find({
      collection: 'forms',
      where: {
        title: {
          equals: 'お問い合わせフォーム',
        },
      },
    })

    let contactForm
    if (existingForms.docs.length > 0) {
      console.log('Contact form already exists, updating...')
      contactForm = await payload.update({
        collection: 'forms',
        id: existingForms.docs[0].id,
        data: contactFormData,
      })
    } else {
      console.log('Creating new contact form...')
      contactForm = await payload.create({
        collection: 'forms',
        data: contactFormData,
      })
    }

    console.log('✅ Contact form created/updated successfully')

    // Create the contact page (using custom React component, not Payload form)
    const contactPageData: RequiredDataFromCollectionSlug<'pages'> = {
      title: 'お問い合わせ',
      slug: 'contact-jp',
      _status: 'published',
      hero: {
        type: 'none',
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              richText: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'heading',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'お問い合わせページについて',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      tag: 'h2',
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'このページは、カスタムReactコンポーネントとして実装されています。',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      textFormat: 0,
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'URL: /contact にアクセスしてご確認ください。',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      textFormat: 0,
                      version: 1,
                    },
                    {
                      type: 'heading',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: '機能',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      tag: 'h3',
                      version: 1,
                    },
                    {
                      type: 'list',
                      children: [
                        {
                          type: 'listitem',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: 'Google reCAPTCHA v3によるスパム防止',
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          value: 1,
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: 'Resendによるメール送信',
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          value: 2,
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: 'レート制限（1分間に3回まで）',
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          value: 3,
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: '入力値の検証とサニタイゼーション',
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          value: 4,
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: '管理者とユーザーへの自動メール通知',
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          value: 5,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      listType: 'bullet',
                      start: 1,
                      tag: 'ul',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              },
              size: 'full',
            },
          ],
        },
      ],
    }

    // Check if page already exists
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'contact-jp',
        },
      },
    })

    if (existingPages.docs.length > 0) {
      console.log('Contact page already exists, updating...')
      await payload.update({
        collection: 'pages',
        id: existingPages.docs[0].id,
        data: contactPageData,
      })
    } else {
      console.log('Creating new contact page...')
      await payload.create({
        collection: 'pages',
        data: contactPageData,
      })
    }

    console.log('✅ Contact page created/updated successfully')
    console.log('\n📌 Important: Please configure the following environment variables:')
    console.log('   - RESEND_API_KEY: Your Resend API key')
    console.log('   - NEXT_PUBLIC_RECAPTCHA_SITE_KEY: Your Google reCAPTCHA v3 site key')
    console.log('   - RECAPTCHA_SECRET_KEY: Your Google reCAPTCHA v3 secret key')
    console.log('   - CONTACT_EMAIL_TO: Email address to receive contact form submissions')
    console.log('\n🌐 Visit http://localhost:3000/contact to see the contact page')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating contact page:', error)
    process.exit(1)
  }
}

createContactPage()