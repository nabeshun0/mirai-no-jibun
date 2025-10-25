'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [futureVideo, setFutureVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  // 健康パラメータ
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [ethnicity, setEthnicity] = useState('Asian');
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
            age,
            gender,
            ethnicity,
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
          <p className="text-xl text-gray-600">
            25年後のあなたの姿を見てみませんか？
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!selectedImage ? (
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <label className="flex flex-col items-center justify-center h-96 border-4 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-400 transition-colors">
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
          ) : (
            <div className="space-y-8">
              {/* 健康パラメータ入力 */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  健康・ライフスタイル情報
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* 基本情報 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      年齢
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      min="18"
                      max="80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      性別
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      人種
                    </label>
                    <select
                      value={ethnicity}
                      onChange={(e) => setEthnicity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="Asian">アジア人</option>
                      <option value="Caucasian">白人</option>
                      <option value="African">アフリカ系</option>
                      <option value="Hispanic">ヒスパニック</option>
                    </select>
                  </div>
                </div>

                {/* ライフスタイル要因 */}
                <div className="mt-6 space-y-6">
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
