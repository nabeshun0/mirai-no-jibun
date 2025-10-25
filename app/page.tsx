'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [futureImage, setFutureImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setFutureImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateFuture = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-future', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        alert('画像の生成に失敗しました: ' + (errorData.error || 'Unknown error'));
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setFutureImage(data.imageUrl);
    } catch (error) {
      console.error('Error:', error);
      alert('画像の生成中にエラーが発生しました');
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
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
                        <p className="text-gray-600">未来を生成中...</p>
                      </div>
                    ) : futureImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={futureImage}
                        alt="25年後の写真"
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
                    setFutureImage(null);
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
