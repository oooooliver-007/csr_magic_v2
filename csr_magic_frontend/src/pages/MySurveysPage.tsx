import { useCallback, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, Loader2 } from 'lucide-react';
import { surveyApi } from '../services/surveyApi';
import type { Survey } from '../types/survey';

export default function MySurveysPage() {
  const navigate = useNavigate();
  const [activityIdInput, setActivityIdInput] = useState<string>('');
  const [surveyIdInput, setSurveyIdInput] = useState<string>('');
  const [found, setFound] = useState<Survey | null>(null);
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByActivity = useCallback(async () => {
    const id = parseInt(activityIdInput, 10);
    if (!id) { setError('请输入有效的活动ID'); return; }
    setLoading(true);
    setError(null);
    setFound(null);
    setSubmitted(null);
    try {
      const res = await surveyApi.getByActivityId(id);
      const survey = res.data.data;
      setFound(survey);
      try {
        const subRes = await surveyApi.hasUserSubmitted(survey.id);
        setSubmitted(subRes.data.data);
      } catch {
        setSubmitted(null);
      }
    } catch {
      setError('未找到该活动的问卷');
    } finally {
      setLoading(false);
    }
  }, [activityIdInput]);

  const openBySurveyId = useCallback(() => {
    const id = parseInt(surveyIdInput, 10);
    if (!id) { setError('请输入有效的问卷ID'); return; }
    navigate(`/surveys/${id}`);
  }, [surveyIdInput, navigate]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#1A2E22]">我的问卷</h1>
        <p className="text-sm text-[#1A2E22]/60 mt-1">通过活动ID或问卷ID快速进入填写页</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm text-[#1A2E22]/70 mb-1">通过活动ID查找</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2E22]/40" />
              <input
                type="number"
                inputMode="numeric"
                placeholder="输入活动ID..."
                value={activityIdInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setActivityIdInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={searchByActivity}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#2EB87A] text-white font-medium hover:bg-[#2EB87A]/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '查找'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#1A2E22]/70 mb-1">或直接输入问卷ID</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="输入问卷ID..."
              value={surveyIdInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSurveyIdInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
            <button
              type="button"
              onClick={openBySurveyId}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm"
            >
              打开
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
        )}

        {found && (
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-[#1A2E22]">{found.title}</h3>
                <p className="text-xs text-[#1A2E22]/50 mt-0.5">问卷ID：{found.id} · 活动ID：{found.activityId}</p>
                <p className="text-sm text-[#1A2E22]/70 mt-2">{found.description}</p>
              </div>
              {submitted === true && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2EB87A] bg-[#2EB87A]/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" /> 已提交
                </span>
              )}
            </div>
            <div className="pt-3 text-right">
              <button
                type="button"
                onClick={() => navigate(`/surveys/${found.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2EB87A] text-white text-sm font-medium hover:bg-[#2EB87A]/90"
              >
                去填写
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
