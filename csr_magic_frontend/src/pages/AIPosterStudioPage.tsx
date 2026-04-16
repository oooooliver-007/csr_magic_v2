import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Download, Share2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { posterApi } from '../services/posterApi';
import { participationApi } from '../services/participationApi';
import type { MyParticipation } from '../types/participation';
import type { PosterStyle, PosterStatus } from '../types/poster';
import { POSTER_STYLES, POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../constants/posterStyles';

export default function AIPosterStudioPage() {
  const navigate = useNavigate();

  // 活动选择
  const [activities, setActivities] = useState<MyParticipation[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // 风格 + 提示词
  const [selectedStyle, setSelectedStyle] = useState<PosterStyle>('cartoon');
  const [userPrompt, setUserPrompt] = useState('');

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 轮询相关
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // 加载已参与的活动
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await participationApi.getMyParticipations({ page: 0, size: 100 });
        const approved = res.data.data.content.filter((p) => p.state === 'APPROVED');
        setActivities(approved);
      } catch (err) {
        console.error('获取参与活动失败:', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (taskId: string) => {
      pollStartRef.current = Date.now();

      pollTimerRef.current = setInterval(async () => {
        // 超时检查
        if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
          stopPolling();
          setIsGenerating(false);
          setErrorMessage('生成超时，请稍后重试');
          return;
        }

        try {
          const res = await posterApi.getStatus(taskId);
          const data = res.data.data;
          const status: PosterStatus = data.status;

          if (status === 'COMPLETED' && data.posterUrl) {
            stopPolling();
            setIsGenerating(false);
            setGeneratedImageUrl(data.posterUrl);
            setErrorMessage(null);
          } else if (status === 'FAILED') {
            stopPolling();
            setIsGenerating(false);
            setErrorMessage(data.errorMessage || '生成失败，请重试');
          }
        } catch (err: unknown) {
          // 401/403 自动停止轮询
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
            stopPolling();
            setIsGenerating(false);
            setErrorMessage('认证失败，请重新登录');
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  const handleGenerate = async () => {
    if (!selectedActivityId || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedImageUrl(null);

    try {
      const res = await posterApi.generate({
        activityId: selectedActivityId,
        style: selectedStyle,
        userPrompt: userPrompt.trim() || undefined,
      });
      const { taskId } = res.data.data;
      startPolling(taskId);
    } catch (err) {
      setIsGenerating(false);
      setErrorMessage('提交失败，请重试');
      console.error('海报生成请求失败:', err);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = 'csr-poster.png';
    link.target = '_blank';
    link.click();
  };

  const selectedActivity = activities.find((a) => a.activityId === selectedActivityId);

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white hover:bg-gray-50 rounded-full shadow-sm transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1A2E22]" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A2E22] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#2EB87A]" />
            AI 海报工作台
          </h1>
          <p className="text-[#1A2E22]/60 mt-1">基于你的活动参与记录，生成专属纪念海报</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：控制面板 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            {/* 1. 选择活动 */}
            <h2 className="font-bold text-lg mb-4">1. 选择活动</h2>
            {loadingActivities ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse mb-6" />
            ) : activities.length === 0 ? (
              <p className="text-[#1A2E22]/50 text-sm mb-6">暂无已审核通过的活动参与记录</p>
            ) : (
              <select
                value={selectedActivityId ?? ''}
                onChange={(e) => setSelectedActivityId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#2EB87A] focus:outline-none transition-all text-sm mb-6"
              >
                <option value="">请选择活动...</option>
                {activities.map((a) => (
                  <option key={a.activityId} value={a.activityId}>
                    {a.activityName}
                  </option>
                ))}
              </select>
            )}

            {/* 2. 选择风格 */}
            <h2 className="font-bold text-lg mb-4">2. 选择风格</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {POSTER_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                    selectedStyle === style.value
                      ? 'border-[#2EB87A] bg-[#2EB87A]/5 text-[#2EB87A]'
                      : 'border-gray-100 hover:border-gray-200 text-[#1A2E22]/70'
                  }`}
                >
                  {style.labelZh}
                </button>
              ))}
            </div>

            {/* 3. 自定义提示词 */}
            <h2 className="font-bold text-lg mb-4">3. 自定义描述（可选）</h2>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#2EB87A] focus:bg-white focus:outline-none transition-all text-sm resize-none mb-6"
              placeholder="例如：阳光明媚的公园里，一群人在植树..."
            />

            {/* 错误提示 */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 4. 生成按钮 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedActivityId}
              className="w-full py-3.5 bg-[#2EB87A] text-white rounded-xl font-bold hover:bg-[#2EB87A]/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI 正在创作中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成海报
                </>
              )}
            </button>

            {isGenerating && (
              <p className="text-center text-[#1A2E22]/50 text-xs mt-3">
                AI 正在为你创作专属海报，请稍等约 20 秒...
              </p>
            )}
          </div>
        </div>

        {/* 右侧：预览区 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="font-bold text-lg mb-4">预览</h2>
          <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden min-h-[400px] relative">
            {generatedImageUrl ? (
              <div className="relative w-full h-full group">
                <img
                  src={generatedImageUrl}
                  alt="生成的海报"
                  className="w-full h-full object-cover"
                />
                {/* 渐变覆盖层文字 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
                  <p className="text-sm font-bold text-[#FFB347] mb-1 uppercase tracking-wider">
                    I&apos;m joining!
                  </p>
                  <h3 className="text-2xl font-bold mb-2">
                    {selectedActivity?.activityName ?? ''}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-[#1A2E22]/50 text-sm">你的海报将在此展示</p>
              </div>
            )}
          </div>

          {/* 下载/分享按钮 */}
          {generatedImageUrl && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-gray-100 text-[#1A2E22] rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
              <button className="flex-1 py-3 bg-[#FFB347] text-white rounded-xl font-bold hover:bg-[#FFB347]/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Share2 className="w-4 h-4" />
                分享到动态
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
