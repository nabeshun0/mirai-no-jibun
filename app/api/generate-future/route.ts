import { NextRequest, NextResponse } from 'next/server';

// Helper function to poll task status
async function pollTaskStatus(taskId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`Task status (attempt ${i + 1}):`, JSON.stringify(data, null, 2));

    // Check for succeeded status (not 'success')
    if (data.status === 'succeeded' || data.status === 'success') {
      // Try different possible keys for the video URL
      const videoUrl = data.content?.video_url || data.video_url || data.videoUrl || data.url ||
                      data.result?.video_url || data.result?.url ||
                      data.data?.video_url || data.data?.url;

      if (videoUrl) {
        console.log('Video URL found:', videoUrl);
        return videoUrl;
      }
      console.log('Status is succeeded but no video URL found in response');
    }

    if (data.status === 'failed') {
      throw new Error(`Video generation failed: ${data.error || 'Unknown error'}`);
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Video generation timed out');
}

export async function POST(request: NextRequest) {
  try {
    const { image, parameters, period = 'future' } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // パラメータのデフォルト値
    const {
      uvExposure = 2,
      bodyComposition = 2,
      sleepStress = 2,
    } = parameters || {};

    const apiKey = process.env.BYTEPLUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // UV露出レベルの説明
    const uvLevelDesc = {
      1: 'Indoor lifestyle / sunscreen daily',
      2: 'Moderate outdoor activity',
      3: 'Outdoor work or no UV protection',
    }[uvExposure];

    // 体組成レベルの説明
    const bodyLevelDesc = {
      1: 'BMI 18-21 / muscular',
      2: 'BMI 22-24 / standard',
      3: 'BMI 25+ / overweight or muscle loss',
    }[bodyComposition];

    // 睡眠・ストレスレベルの説明
    const sleepLevelDesc = {
      1: 'Sleep 7h+, low stress',
      2: 'Sleep 5-6h, moderate stress',
      3: 'Sleep <4h, high stress',
    }[sleepStress];

    // period（タイムライン）に応じたプロンプト生成
    let videoPrompt = '';

    if (period === 'present') {
      // 現在のプロンプト - 軽微な動きのみ
      videoPrompt = `Generate a photorealistic image-to-video of the person as they are now. No aging or rejuvenation effects. Only add subtle natural movements.

Movement Style:
- The person opens eyes and looks gently at the camera with a warm smile
- Subtle head movement and natural breathing
- Gentle facial expressions
- No changes to skin, wrinkles, or facial features
- Maintain exact current appearance

Output Style:
- Photorealistic, no aging or rejuvenation
- Maintain all facial identity and proportions exactly as in the image
- Neutral lighting, professional studio composition
- Output: Current appearance portrait video with subtle movement

--ratio adaptive --dur 5`;
    } else {
      // 25年後のプロンプト - 健康パラメータを考慮した老化予測
      videoPrompt = `Generate a photorealistic image-to-video of the same person 25 years older. Apply natural aging effects such as wrinkles, skin tone change, and facial volume shift, based on the following quantified lifestyle and health factors.

Lifestyle Aging Factors (3-level scale):
- UV Exposure: Level ${uvExposure} (${uvLevelDesc})
- Body Composition (BMI/Fat): Level ${bodyComposition} (${bodyLevelDesc})
- Sleep & Stress Balance: Level ${sleepStress} (${sleepLevelDesc})

Weighting:
- UV exposure: 3
- Body composition: 2
- Sleep & stress: 1

Output Style:
- Photorealistic, natural aging only
- Maintain all facial identity and proportions
- Add realistic signs of aging (wrinkles, pigmentation, volume changes) according to levels
- The person opens eyes and looks gently at the camera with a warm smile
- Subtle head movement, natural breathing
- Neutral lighting, professional studio composition
- Output: 25 years later portrait video

--ratio adaptive --dur 5`;
    }

    // BytePlus Video Generation APIを使って未来の動画を生成（image-to-video）
    const createTaskResponse = await fetch(
      'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'seedance-1-0-pro-fast-251015',
          content: [
            {
              type: 'text',
              text: videoPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        }),
      }
    );

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text();
      console.error('Video API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create video generation task', details: errorText },
        { status: createTaskResponse.status }
      );
    }

    const taskData = await createTaskResponse.json();
    const taskId = taskData.id || taskData.task_id;

    if (!taskId) {
      return NextResponse.json(
        { error: 'No task ID in response', details: JSON.stringify(taskData) },
        { status: 500 }
      );
    }

    console.log('Video generation task created:', taskId);

    // Poll for completion
    const videoUrl = await pollTaskStatus(taskId, apiKey);

    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error('Error generating future video:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
