import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BYTEPLUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // 25年後のプロンプトを生成（一般的な説明を使用）
    const futurePrompt = 'Portrait of an Asian person 25 years older, showing natural aging with wrinkles, some gray hair, and mature features. The person looks wise and experienced with visible signs of aging like laugh lines and forehead wrinkles. Photorealistic portrait, professional photography, high quality, detailed, studio lighting, neutral background.';

    // BytePlus Image Generation APIを使って未来の画像を生成
    const imageResponse = await fetch(
      'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'seedream-4-0-250828',
          prompt: futurePrompt,
          sequential_image_generation: 'disabled',
          response_format: 'url',
          size: '2K',
          stream: false,
          watermark: false,
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate image', details: errorText },
        { status: imageResponse.status }
      );
    }

    const imageData = await imageResponse.json();
    const generatedImageUrl = imageData.data[0]?.url;

    if (!generatedImageUrl) {
      return NextResponse.json(
        { error: 'No image URL in response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl: generatedImageUrl });
  } catch (error) {
    console.error('Error generating future image:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
