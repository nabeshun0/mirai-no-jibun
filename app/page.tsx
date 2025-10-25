'use client';

import { useState, useRef } from 'react';

type PoseImage = {
  id: number;
  image: string | null;
  video: string | null;
  pose: string;
  isGenerating: boolean;
};

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [futureVideo, setFutureVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  // 9グリッド用
  const [gridMode, setGridMode] = useState(false);
  const [poseImages, setPoseImages] = useState<PoseImage[]>([
    { id: 1, image: null, video: null, pose: '正面を向いて微笑む', isGenerating: false },
    { id: 2, image: null, video: null, pose: '右を向いて微笑む', isGenerating: false },
    { id: 3, image: null, video: null, pose: '左を向いて微笑む', isGenerating: false },
    { id: 4, image: null, video: null, pose: '上を見上げる', isGenerating: false },
    { id: 5, image: null, video: null, pose: '笑顔で手を振る', isGenerating: false },
    { id: 6, image: null, video: null, pose: '考え込む表情', isGenerating: false },
    { id: 7, image: null, video: null, pose: '驚いた表情', isGenerating: false },
    { id: 8, image: null, video: null, pose: '穏やかに目を閉じる', isGenerating: false },
    { id: 9, image: null, video: null, pose: 'ウィンクする', isGenerating: false },
  ]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);

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
        setFutureVideo(null);
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

    if (gridMode) {
      // 9グリッドモード：現在のポーズに写真を設定
      const newPoseImages = [...poseImages];
      newPoseImages[currentPoseIndex].image = imageData;
      setPoseImages(newPoseImages);

      // 次のポーズに進むか、カメラを閉じる
      if (currentPoseIndex < 8) {
        setCurrentPoseIndex(currentPoseIndex + 1);
      } else {
        closeCamera();
      }
    } else {
      // 通常モード
      setSelectedImage(imageData);
      setFutureVideo(null);
      closeCamera();
    }
  };

  const generateAllPoseVideos = async () => {
    for (let i = 0; i < poseImages.length; i++) {
      if (!poseImages[i].image) continue;

      // 生成中フラグを設定
      const newPoseImages = [...poseImages];
      newPoseImages[i].isGenerating = true;
      setPoseImages(newPoseImages);

      try {
        const response = await fetch('/api/generate-future', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: poseImages[i].image,
            parameters: {
              uvExposure,
              bodyComposition,
              sleepStress,
            },
            pose: poseImages[i].pose,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const updatedPoseImages = [...poseImages];
          updatedPoseImages[i].video = data.videoUrl;
          updatedPoseImages[i].isGenerating = false;
          setPoseImages(updatedPoseImages);
        }
      } catch (error) {
        console.error(`Pose ${i + 1} generation error:`, error);
        const updatedPoseImages = [...poseImages];
        updatedPoseImages[i].isGenerating = false;
        setPoseImages(updatedPoseImages);
      }
    }
  };

  const addLog = (message: string) => {
    setStatusLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const handleGenerateFuture = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setStatusLog([]);
    addLog('動画生成を開始します...');

    try {
      addLog('APIリクエストを送信中...');
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        addLog(`エラー: ${errorData.error || 'Unknown error'}`);
        alert('動画の生成に失敗しました: ' + (errorData.error || 'Unknown error'));
        setIsLoading(false);
        return;
      }

      addLog('動画生成が完了しました！');
      const data = await response.json();
      setFutureVideo(data.videoUrl);
      addLog('動画URLを取得しました');
    } catch (error) {
      console.error('Error:', error);
      addLog(`エラー: ${error}`);
      alert('動画の生成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
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

          {/* モード切り替え */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setGridMode(false)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                !gridMode
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              シングルモード
            </button>
            <button
              onClick={() => setGridMode(true)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                gridMode
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              9ポーズモード
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {gridMode && poseImages.some(p => p.image) ? (
            /* 9グリッド表示 */
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  9ポーズコレクション
                </h2>

                {/* 9グリッド */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {poseImages.map((pose) => (
                    <div key={pose.id} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                      {pose.video ? (
                        <video
                          src={pose.video}
                          controls
                          loop
                          className="w-full h-full object-cover"
                        />
                      ) : pose.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pose.image}
                            alt={`ポーズ ${pose.id}`}
                            className="w-full h-full object-cover"
                          />
                          {pose.isGenerating && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white mb-2 mx-auto"></div>
                                <p className="text-sm">生成中...</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <p className="text-sm text-center px-2">{pose.pose}</p>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-xs text-center">{pose.pose}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setPoseImages(poseImages.map(p => ({ ...p, image: null, video: null })));
                      setCurrentPoseIndex(0);
                    }}
                    className="px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                  >
                    やり直す
                  </button>
                  {poseImages.filter(p => p.image).length < 9 && (
                    <button
                      onClick={() => {
                        setIsCameraOpen(true);
                        openCamera();
                      }}
                      className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
                    >
                      続きを撮影
                    </button>
                  )}
                  <button
                    onClick={generateAllPoseVideos}
                    disabled={poseImages.every(p => !p.image) || poseImages.some(p => p.isGenerating)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    全て生成する
                  </button>
                </div>
              </div>
            </div>
          ) : !selectedImage && !isCameraOpen ? (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <div className="space-y-6">
                {gridMode && (
                  <div className="text-center mb-4">
                    <p className="text-lg font-semibold text-purple-600">
                      9種類のポーズで撮影します
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      それぞれのポーズで撮影してください
                    </p>
                  </div>
                )}
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
              {gridMode && (
                <div className="mb-4 text-center">
                  <p className="text-lg font-semibold text-purple-600">
                    ポーズ {currentPoseIndex + 1}/9: {poseImages[currentPoseIndex].pose}
                  </p>
                  <div className="flex gap-2 justify-center mt-2">
                    {poseImages.map((pose, idx) => (
                      <div
                        key={pose.id}
                        className={`w-8 h-8 rounded-full ${
                          idx < currentPoseIndex
                            ? 'bg-green-500'
                            : idx === currentPoseIndex
                            ? 'bg-purple-600'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
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

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    現在
                  </h2>
                  <div className="relative aspect-square rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImage}
                      alt="現在の写真"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    25年後
                  </h2>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center w-full px-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                        <p className="text-gray-600 font-semibold">未来を生成中...</p>
                        <p className="text-gray-500 text-sm mt-2">動画生成には数分かかります</p>
                        <div className="mt-6 w-full max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-4 text-left">
                          <p className="text-xs font-semibold text-gray-700 mb-2">処理ログ:</p>
                          {statusLog.map((log, i) => (
                            <p key={i} className="text-xs text-gray-600 font-mono">{log}</p>
                          ))}
                        </div>
                      </div>
                    ) : futureVideo ? (
                      <video
                        src={futureVideo}
                        controls
                        autoPlay
                        loop
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <p className="text-gray-400 text-center px-8">
                        「未来を見る」ボタンを押してください
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setFutureVideo(null);
                  }}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  別の写真を選ぶ
                </button>
                <button
                  onClick={handleGenerateFuture}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? '生成中...' : '未来を見る'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
