import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { surveyApi } from '../services/surveyApi';
import type { Survey, SurveyQuestion, SubmitSurveyRequest } from '../types/survey';

export default function SurveyFillPage() {
  const { id } = useParams();
  const surveyId = useMemo(() => Number(id), [id]);

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    if (!Number.isFinite(surveyId)) return;
    setLoading(true);
    try {
      const [sRes, subRes] = await Promise.all([
        surveyApi.getById(surveyId),
        surveyApi.hasUserSubmitted(surveyId),
      ]);
      setSurvey(sRes.data.data);
      setSubmitted(subRes.data.data);
    } catch {
      showToast('加载问卷失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [surveyId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setAnswer = (questionId: number, value: string) => {
    setAnswers((prev: Record<number, string>) => ({ ...prev, [questionId]: value }));
  };

  const validateRequired = (qs: SurveyQuestion[]): boolean => {
    for (const q of qs) {
      if (q.required) {
        const val = answers[q.id];
        if (!val || val.trim() === '') return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!survey) return;
    if (!validateRequired(survey.questions)) {
      showToast('请填写所有必填题目', 'error');
      return;
    }
    const payload: SubmitSurveyRequest = {
      surveyId: survey.id,
      answers: survey.questions
        .filter((q: SurveyQuestion) => answers[q.id] !== undefined)
        .map((q: SurveyQuestion) => ({ questionId: q.id, answerValue: answers[q.id] ?? '' })),
    };
    setSubmitting(true);
    try {
      await surveyApi.submit(payload);
      showToast('提交成功');
      setSubmitted(true);
    } catch {
      showToast('提交失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: SurveyQuestion) => {
    switch (q.questionType) {
      case 'RATING': {
        const current = Number(answers[q.id] ?? 0);
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswer(q.id, String(i))}
                  className="p-1"
                  title={`${i} 分`}
                >
                  <Star className={`w-6 h-6 ${i <= current ? 'text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
        );
      }
      case 'CHOICE': {
        const val = answers[q.id] ?? '';
        return (
          <div className="space-y-2">
            {(q.options ?? []).map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={val === opt}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAnswer(q.id, e.target.value)}
                  className="text-[#2EB87A] focus:ring-[#2EB87A]"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      }
      case 'TEXT':
      default: {
        const val = answers[q.id] ?? '';
        return (
          <textarea
            value={val}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAnswer(q.id, e.target.value)}
            placeholder="请输入..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm min-h-[88px]"
          />
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#2EB87A]" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-24 text-[#1A2E22]/60">未找到问卷</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A2E22]">{survey.title}</h1>
            <p className="text-sm text-[#1A2E22]/60 mt-1">{survey.description}</p>
          </div>
          {submitted && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2EB87A] bg-[#2EB87A]/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> 已完成
            </span>
          )}
        </div>
      </div>

      {!submitted && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {survey.questions.map((q: SurveyQuestion, idx: number) => (
            <div key={q.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium text-[#1A2E22]">
                  {idx + 1}. {q.questionText}
                </div>
                <div className="shrink-0 text-xs text-gray-500">
                  {q.questionType}
                  {q.required ? ' · 必填' : ''}
                </div>
              </div>
              <div className="mt-3">
                {renderQuestion(q)}
              </div>
            </div>
          ))}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2EB87A] text-white font-medium hover:bg-[#2EB87A]/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              提交问卷
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#2EB87A] mx-auto" />
          <p className="mt-3 text-[#1A2E22] font-medium">您已完成该问卷</p>
          <p className="text-sm text-[#1A2E22]/60 mt-1">感谢您的参与与反馈</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'success' ? 'bg-[#2EB87A]' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
