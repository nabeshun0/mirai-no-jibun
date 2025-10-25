'use client';

import { useState, useRef } from 'react';

type TimelineVideo = {
  period: string;
  video: string | null;
  isGenerating: boolean;
  label: string;
};

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [timelineVideos, setTimelineVideos] = useState<TimelineVideo[]>([
    { period: 'present', video: null, isGenerating: false, label: '現在' },
    { period: 'future', video: null, isGenerating: false, label: '25年後' },
  ]);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  // カメラ関連
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 健康パラメータ
  const [uvExposure, setUvExposure] = useState(2);
  const [bodyComposition, setBodyComposition] = useState(2);
  const [sleepStress, setSleepStress] = useState(2);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setTimelineVideos([
          { period: 'present', video: null, isGenerating: false, label: '現在' },
          { period: 'future', video: null, isGenerating: false, label: '25年後' },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // インカメラを使用
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraOpen(true);

      // ビデオ要素にストリームを設定
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('カメラのアクセスに失敗しました:', error);
      alert('カメラにアクセスできませんでした。ブラウザの設定を確認してください。');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // キャンバスにビデオの現在のフレームを描画
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    // base64形式で画像を取得
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    setSelectedImage(imageData);
    setTimelineVideos([
      { period: 'present', video: null, isGenerating: false, label: '現在' },
      { period: 'future', video: null, isGenerating: false, label: '25年後' },
    ]);
    closeCamera();
  };

  const addLog = (message: string) => {
    setStatusLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  // 健康パラメータに基づくアドバイス生成
  const generateAdvice = () => {
    const advice: string[] = [];

    // UV露出のアドバイス
    if (uvExposure >= 2) {
      advice.push('☀️ UV対策を強化しましょう：日焼け止め（SPF30以上）を毎日使用、帽子や日傘の活用、11時〜15時の外出を避ける');
    }
    if (uvExposure === 1) {
      advice.push('✅ UV対策は良好です！現在の習慣を継続してください');
    }

    // 体組成のアドバイス
    if (bodyComposition >= 2) {
      advice.push('🏃 体組成の改善：週3回以上の有酸素運動、筋力トレーニング、タンパク質を含むバランスの良い食事');
    }
    if (bodyComposition === 1) {
      advice.push('✅ 体組成は理想的です！現在の運動習慣を維持してください');
    }

    // 睡眠・ストレスのアドバイス
    if (sleepStress >= 2) {
      advice.push('😴 睡眠とストレス管理：7時間以上の睡眠確保、就寝前のスマホ使用を控える、瞑想やヨガでストレス軽減');
    }
    if (sleepStress === 1) {
      advice.push('✅ 睡眠とストレス管理は良好です！現在の生活リズムを大切に');
    }

    // 共通のアドバイス
    advice.push('💧 水分補給：1日2リットル以上の水を飲む');
    advice.push('🥗 抗酸化物質：ビタミンC・E、ポリフェノールを含む食品を積極的に摂取');
    advice.push('🚭 禁煙：喫煙は老化を加速させる最大の要因です');

    return advice;
  };

  const generateAllTimelines = async () => {
    if (!selectedImage) return;

    setStatusLog([]);
    addLog('未来の動画生成を開始します...');

    // 未来（25年後）のみ生成（現在は画像のまま）
    for (let i = 0; i < timelineVideos.length; i++) {
      const timeline = timelineVideos[i];

      // 現在はスキップ
      if (timeline.period === 'present') {
        continue;
      }

      // 生成中フラグを設定
      setTimelineVideos(prev => {
        const updated = [...prev];
        updated[i].isGenerating = true;
        return updated;
      });

      addLog(`${timeline.label}の動画を生成中...`);

      try {
        const response = await fetch('/api/generate-future', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: selectedImage,
            parameters: {
              uvExposure,
              bodyComposition,
              sleepStress,
            },
            period: timeline.period,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setTimelineVideos(prev => {
            const updated = [...prev];
            updated[i].video = data.videoUrl;
            updated[i].isGenerating = false;
            return updated;
          });
          addLog(`${timeline.label}の動画生成が完了しました！`);
        } else {
          const errorData = await response.json();
          console.error('API error:', errorData);
          addLog(`${timeline.label}のエラー: ${errorData.error || 'Unknown error'}`);
          setTimelineVideos(prev => {
            const updated = [...prev];
            updated[i].isGenerating = false;
            return updated;
          });
        }
      } catch (error) {
        console.error(`${timeline.label} generation error:`, error);
        addLog(`${timeline.label}のエラー: ${error}`);
        setTimelineVideos(prev => {
          const updated = [...prev];
          updated[i].isGenerating = false;
          return updated;
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            未来の自分
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            25年後のあなたの姿を見てみませんか？
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {!selectedImage && !isCameraOpen ? (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <div className="space-y-6">
                {/* カメラ撮影ボタン */}
                <button
                  onClick={openCamera}
                  className="w-full flex flex-col items-center justify-center h-48 border-4 border-dashed border-purple-300 rounded-2xl hover:border-purple-500 transition-colors bg-purple-50"
                >
                  <svg
                    className="w-20 h-20 text-purple-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-2xl font-semibold text-purple-700 mb-2">
                    カメラで撮影
                  </span>
                  <span className="text-purple-600">
                    インカメラを起動して撮影
                  </span>
                </button>

                {/* ファイルアップロード */}
                <label className="flex flex-col items-center justify-center h-48 border-4 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-400 transition-colors">
                  <svg
                    className="w-20 h-20 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="text-2xl font-semibold text-gray-700 mb-2">
                    写真をアップロード
                  </span>
                  <span className="text-gray-500">
                    クリックまたはドラッグ&ドロップ
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          ) : isCameraOpen ? (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                カメラで撮影
              </h2>
              <div className="relative">
                <video
                  ref={(ref) => {
                    videoRef.current = ref;
                    if (ref && stream) {
                      ref.srcObject = stream;
                      ref.play();
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full rounded-2xl"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={closeCamera}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                >
                  📸 撮影する
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 健康パラメータ入力 */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  健康・ライフスタイル情報
                </h2>

                {/* ライフスタイル要因 */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      UV露出レベル: {uvExposure}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      value={uvExposure}
                      onChange={(e) => setUvExposure(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>室内/日焼け止め毎日</span>
                      <span>適度な外出</span>
                      <span>屋外作業/UV対策なし</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      体組成レベル: {bodyComposition}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      value={bodyComposition}
                      onChange={(e) => setBodyComposition(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>BMI 18-21/筋肉質</span>
                      <span>BMI 22-24/標準</span>
                      <span>BMI 25+/肥満</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      睡眠・ストレスレベル: {sleepStress}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      value={sleepStress}
                      onChange={(e) => setSleepStress(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>睡眠7h+/低ストレス</span>
                      <span>睡眠5-6h/中ストレス</span>
                      <span>睡眠4h未満/高ストレス</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* タイムライン動画表示 */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  タイムラインビュー
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {timelineVideos.map((timeline, idx) => (
                    <div key={timeline.period} className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-700 text-center">
                        {timeline.label}
                      </h3>
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                        {timeline.isGenerating ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-2"></div>
                            <p className="text-gray-600 text-sm">生成中...</p>
                          </div>
                        ) : timeline.video ? (
                          <video
                            src={timeline.video}
                            controls
                            autoPlay
                            loop
                            className="object-cover w-full h-full"
                          />
                        ) : idx === 0 ? (
                          // 現在は元の写真を表示
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedImage || ''}
                              alt="現在の写真"
                              className="object-cover w-full h-full"
                            />
                          </>
                        ) : (
                          <p className="text-gray-400 text-center px-4 text-sm">
                            動画生成待ち
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 若々しくなるためのアドバイス */}
              {timelineVideos.find(t => t.period === 'future')?.video && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 25年後も若々しくいるためのアドバイス</h3>
                  <div className="space-y-3">
                    {generateAdvice().map((advice, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-700">{advice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 処理ログ */}
              {statusLog.length > 0 && (
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">処理ログ</h3>
                  <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    {statusLog.map((log, i) => (
                      <p key={i} className="text-xs text-gray-600 font-mono mb-1">{log}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setTimelineVideos([
                      { period: 'present', video: null, isGenerating: false, label: '現在' },
                      { period: 'future', video: null, isGenerating: false, label: '25年後' },
                    ]);
                  }}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  別の写真を選ぶ
                </button>
                <button
                  onClick={generateAllTimelines}
                  disabled={timelineVideos.some(t => t.isGenerating)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {timelineVideos.some(t => t.isGenerating) ? '生成中...' : 'タイムライン動画を生成'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
