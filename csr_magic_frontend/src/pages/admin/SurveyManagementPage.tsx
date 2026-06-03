import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Trash2, X, Loader2, Sparkles, Edit2 } from 'lucide-react';
import type { Activity } from '../../types/activity';
import { activityApi } from '../../services/activityApi';
import { surveyApi } from '../../services/surveyApi';
import type { Survey, AiGeneratedSurvey, SurveyStats, SurveyResult, QuestionStats } from '../../types/survey';

type EditableQuestion = {
  questionText: string;
  questionType: 'RATING' | 'CHOICE' | 'TEXT';
  optionsText: string;
  required: boolean;
};

type EditForm = {
  surveyId: number;
  title: string;
  description: string;
  questions: EditableQuestion[];
};

const SL: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', CLOSED: '已关闭' };
const SC: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700', PUBLISHED: 'bg-green-100 text-green-700', CLOSED: 'bg-red-100 text-red-700',
};

export default function SurveyManagementPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const [genAid, setGenAid] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiGeneratedSurvey | null>(null);
  const [genError, setGenError] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [activitySearchLoading, setActivitySearchLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSurvey, setDetailSurvey] = useState<Survey | null>(null);
  const [detailStats, setDetailStats] = useState<SurveyStats | null>(null);
  const [detailResults, setDetailResults] = useState<SurveyResult[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailQuestionStats, setDetailQuestionStats] = useState<QuestionStats[]>([]);
  const [delId, setDelId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [statusModalId, setStatusModalId] = useState<number | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualForm, setManualForm] = useState<{
    activityId: string;
    title: string;
    description: string;
    questions: EditableQuestion[];
  }>({ activityId: '', title: '', description: '', questions: [{ questionText: '', questionType: 'TEXT', optionsText: '', required: true }] });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000);
  }, []);

  const getErrorMessage = (err: unknown, fallback = '操作失败') => {
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { message?: string } } }).response;
      if (resp?.data && typeof resp.data === 'object' && 'message' in resp.data && typeof resp.data.message === 'string') {
        return resp.data.message;
      }
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await surveyApi.list({ page, size: 20, keyword: keyword || undefined });
      setSurveys(res.data.data.content); setTotalPages(res.data.data.totalPages); setTotalElements(res.data.data.totalElements);
    } catch { showToast('获取问卷列表失败', 'error'); }
    finally { setLoading(false); }
  }, [page, keyword, showToast]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);
  useEffect(() => {
    const t = setTimeout(() => { setKeyword(searchInput); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // 活动名称搜索（用于 AI 生成问卷）
  useEffect(() => {
    const q = activitySearch.trim();
    if (!genOpen) return;
    if (!q) {
      setActivityOptions([]);
      setSelectedActivity(null);
      setActivitySearchLoading(false);
      return;
    }
    let cancelled = false;
    setActivitySearchLoading(true);
    (async () => {
      try {
        const res = await activityApi.list({ page: 0, size: 5, keyword: q });
        if (cancelled) return;
        setActivityOptions(res.data.data.content);
      } catch {
        if (!cancelled) setActivityOptions([]);
      } finally {
        if (!cancelled) setActivitySearchLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activitySearch, genOpen]);

  const doGen = async () => {
    const id = parseInt(genAid, 10);
    if (!id) { setGenError('请输入有效的活动'); return; }
    setGenLoading(true); setGenError(''); setAiResult(null);
    try { const res = await surveyApi.generateWithAi({ activityId: id }); setAiResult(res.data.data); }
    catch (e: unknown) { setGenError(getErrorMessage(e, 'AI生成失败')); }
    finally { setGenLoading(false); }
  };

  const doSave = async () => {
    if (!aiResult) return;
    setSaveLoading(true);
    try {
      await surveyApi.create({
        activityId: parseInt(genAid, 10), title: aiResult.title, description: aiResult.description,
        questions: aiResult.questions.map((q, i) => ({
          questionText: q.questionText, questionType: q.questionType,
          options: q.options || undefined, required: q.required, sortOrder: i,
        })),
      });
      showToast('问卷创建成功'); setGenOpen(false); setAiResult(null); setGenAid(''); fetchSurveys();
    } catch (e) { showToast(getErrorMessage(e, '保存问卷失败'), 'error'); }
    finally { setSaveLoading(false); }
  };

  const doDel = async (id: number) => {
    try { await surveyApi.delete(id); showToast('删除成功'); setDelId(null); fetchSurveys(); }
    catch (e) { showToast(getErrorMessage(e, '删除失败'), 'error'); }
  };
  const doView = async (s: Survey) => {
    setDetailLoading(true);
    try {
      const [surveyRes, statsRes, resultRes, qStatsRes] = await Promise.all([
        surveyApi.getById(s.id),
        surveyApi.getStats(s.id),
        surveyApi.getResults(s.id, { page: 0, size: 10 }),
        surveyApi.getQuestionStats(s.id),
      ]);
      setDetailSurvey(surveyRes.data.data);
      setDetailStats(statsRes.data.data);
      setDetailResults(resultRes.data.data.content ?? []);
      setDetailQuestionStats(qStatsRes.data.data ?? []);
      setDetailOpen(true);
    } catch (e) {
      showToast(getErrorMessage(e, '获取详情失败'), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (s: Survey) => {
    setEditOpen(true);
    setEditLoading(true);
    setEditError('');
    try {
      const res = await surveyApi.getById(s.id);
      const data = res.data.data;
      setEditForm({
        surveyId: data.id,
        title: data.title,
        description: data.description ?? '',
        questions: data.questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          optionsText: q.options ? q.options.join(',') : '',
          required: Boolean(q.required),
        })),
      });
    } catch (e) {
      setEditError(getErrorMessage(e, '加载问卷失败'));
    } finally {
      setEditLoading(false);
    }
  };

  const updateQuestion = (idx: number, field: keyof EditableQuestion, value: string | boolean) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const nextQuestions = prev.questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q));
      return { ...prev, questions: nextQuestions };
    });
  };

  const updateManualQuestion = (idx: number, field: keyof EditableQuestion, value: string | boolean) => {
    setManualForm((prev) => {
      if (!prev) return prev;
      const nextQuestions = prev.questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q));
      return { ...prev, questions: nextQuestions };
    });
  };

  const addManualQuestion = () => {
    setManualForm((prev) => (
      prev ? {
        ...prev,
        questions: [...prev.questions, { questionText: '', questionType: 'TEXT', optionsText: '', required: true }],
      } : prev
    ));
  };

  const removeManualQuestion = (idx: number) => {
    setManualForm((prev) => {
      if (!prev) return prev;
      return { ...prev, questions: prev.questions.filter((_, i) => i !== idx) };
    });
  };

  const addQuestion = () => {
    setEditForm((prev) => (
      prev ? {
        ...prev,
        questions: [...prev.questions, { questionText: '', questionType: 'TEXT', optionsText: '', required: true }],
      } : prev
    ));
  };

  const removeQuestion = (idx: number) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      return { ...prev, questions: prev.questions.filter((_, i) => i !== idx) };
    });
  };

  const doEditSave = async () => {
    if (!editForm) return;
    if (!editForm.title.trim()) { setEditError('标题不能为空'); return; }
    if (editForm.questions.length === 0) { setEditError('请至少保留一道题目'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      await surveyApi.update(editForm.surveyId, {
        title: editForm.title.trim(),
        description: editForm.description?.trim() ?? '',
        questions: editForm.questions.map((q, i) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === 'CHOICE'
            ? q.optionsText.split(',').map((opt) => opt.trim()).filter((opt) => opt.length > 0)
            : undefined,
          required: q.required,
          sortOrder: i,
        })),
      });
      showToast('保存成功');
      setEditOpen(false);
      setEditForm(null);
      fetchSurveys();
    } catch (e) {
      setEditError(getErrorMessage(e, '保存失败'));
    } finally {
      setEditSaving(false);
    }
  };

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">问卷管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理活动反馈问卷的生成、发布与统计</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#1A2E22]/60">共 {totalElements} 份问卷</span>
          <button onClick={() => { setGenOpen(true); setAiResult(null); setGenError(''); setGenAid(''); setActivitySearch(''); setActivityOptions([]); setSelectedActivity(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} /> AI 生成问卷
          </button>
          <button onClick={() => { setManualOpen(true); setManualError(''); setManualForm({ activityId: '', title: '', description: '', questions: [{ questionText: '', questionType: 'TEXT', optionsText: '', required: true }] }); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            <Plus size={18} /> 手动创建问卷
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="搜索问卷标题..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-blue-600" /></div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">标题</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">活动ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">答卷数</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {surveys.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{s.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.activityId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SC[s.status]}`}>
                        {SL[s.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.responseCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => doView(s)} className="text-xs px-2 py-1 border rounded text-gray-600 hover:text-blue-600" title="查看">
                          <Eye size={14} className="inline mr-1" />查看</button>
                        <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 border rounded text-gray-600 hover:text-green-600" title="编辑">
                          <Edit2 size={14} className="inline mr-1" />编辑</button>
                        <button onClick={() => { setStatusModalId(s.id); setStatusValue(s.status); }} className="text-xs px-2 py-1 border rounded text-gray-600 hover:text-orange-600" title="变更状态">
                          <Sparkles size={14} className="inline mr-1" />状态</button>
                        <button onClick={() => setDelId(s.id)} className="text-xs px-2 py-1 border rounded text-gray-600 hover:text-red-600" title="删除">
                          <Trash2 size={14} className="inline mr-1" />删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {surveys.map(s => (
              <div key={s.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{s.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SC[s.status]}`}>{SL[s.status]}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">活动ID: {s.activityId} | 答卷: {s.responseCount}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => doView(s)} className="text-xs px-2 py-1 border rounded text-gray-600">查看</button>
                  <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">编辑</button>
                  <button onClick={() => { setStatusModalId(s.id); setStatusValue(s.status); }} className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded">变更状态</button>
                  <button onClick={() => setDelId(s.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">删除</button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
              <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
            </div>
          )}
        </>
      )}


      {/* AI Generate Modal */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI 生成问卷</h2>
              <button onClick={() => setGenOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            {!aiResult ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择活动</label>
                <input
                  type="text"
                  value={activitySearch}
                  onChange={e => { setActivitySearch(e.target.value); setSelectedActivity(null); setGenAid(''); }}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                  placeholder="输入活动名称关键字"
                />
                {activitySearchLoading && (
                  <div className="flex items-center text-sm text-gray-500 mb-2"><Loader2 size={16} className="animate-spin mr-2" />搜索中...</div>
                )}
                {!activitySearchLoading && activityOptions.length > 0 && (
                  <div className="border rounded-lg mb-2 divide-y max-h-48 overflow-y-auto">
                    {activityOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedActivity(opt);
                          setGenAid(String(opt.id));
                          setActivitySearch(opt.name);
                        }}
                      >
                        <div className="font-medium text-sm text-gray-900">{opt.name}</div>
                        <div className="text-xs text-gray-500">活动ID: {opt.id} · 事件: {opt.eventName}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedActivity && (
                  <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                    已选择：{selectedActivity.name}（ID: {selectedActivity.id}）
                  </div>
                )}
                <label className="block text-sm font-medium text-gray-700 mb-1">或直接输入活动ID</label>
                <input type="number" value={genAid} onChange={e => setGenAid(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-3" placeholder="输入活动ID" />
                {genError && <p className="text-sm text-red-600 mb-3">{genError}</p>}
                <button onClick={doGen} disabled={genLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {genLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  AI 生成题目
                </button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg">{aiResult.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{aiResult.description}</p>
                <div className="mt-4 space-y-3">
                  {aiResult.questions.map((q, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{q.questionType}</span>
                        {q.required && <span className="text-xs text-red-500">必填</span>}
                      </div>
                      <p className="text-sm mt-1">{i + 1}. {q.questionText}</p>
                      {q.options && <p className="text-xs text-gray-500 mt-1">选项: {q.options.join(', ')}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={doSave} disabled={saveLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {saveLoading && <Loader2 size={16} className="animate-spin inline mr-1" />}
                    确认保存
                  </button>
                  <button onClick={() => setAiResult(null)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50">重新生成</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">手动创建问卷</h2>
              <button onClick={() => setManualOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动ID</label>
                  <input
                    type="number"
                    value={manualForm.activityId}
                    onChange={(e) => setManualForm({ ...manualForm, activityId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="必填"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    value={manualForm.title}
                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="问卷标题"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">说明</label>
                <textarea
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
                  placeholder="可选"
                />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">题目（{manualForm.questions.length}）</h3>
                <button type="button" onClick={addManualQuestion} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">新增题目</button>
              </div>
              <div className="space-y-3">
                {manualForm.questions.map((q, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input
                          value={q.questionText}
                          onChange={(e) => updateManualQuestion(idx, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder={`题目 ${idx + 1}`}
                        />
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={q.questionType === 'RATING'}
                              onChange={() => updateManualQuestion(idx, 'questionType', 'RATING')}
                            />
                            评分题
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={q.questionType === 'CHOICE'}
                              onChange={() => updateManualQuestion(idx, 'questionType', 'CHOICE')}
                            />
                            单选题
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              checked={q.questionType === 'TEXT'}
                              onChange={() => updateManualQuestion(idx, 'questionType', 'TEXT')}
                            />
                            文本题
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateManualQuestion(idx, 'required', e.target.checked)}
                            />
                            必填
                          </label>
                        </div>
                        {q.questionType === 'CHOICE' && (
                          <input
                            value={q.optionsText}
                            onChange={(e) => updateManualQuestion(idx, 'optionsText', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="选项，逗号分隔"
                          />
                        )}
                      </div>
                      <button type="button" onClick={() => removeManualQuestion(idx)} className="text-sm text-red-500 px-2 py-1 hover:bg-red-50 rounded">删除</button>
                    </div>
                  </div>
                ))}
              </div>
              {manualError && <p className="text-sm text-red-600">{manualError}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setManualOpen(false)} className="px-4 py-2 border rounded-lg">取消</button>
                <button
                  onClick={async () => {
                    if (!manualForm.activityId.trim()) { setManualError('活动ID必填'); return; }
                    if (!manualForm.title.trim()) { setManualError('标题必填'); return; }
                    if (manualForm.questions.length === 0) { setManualError('请至少添加一道题目'); return; }
                    setManualSaving(true);
                    setManualError('');
                    try {
                      await surveyApi.create({
                        activityId: Number(manualForm.activityId),
                        title: manualForm.title.trim(),
                        description: manualForm.description.trim(),
                        questions: manualForm.questions.map((q, i) => ({
                          questionText: q.questionText,
                          questionType: q.questionType,
                          options: q.questionType === 'CHOICE'
                            ? q.optionsText.split(',').map((opt) => opt.trim()).filter((opt) => opt.length > 0)
                            : undefined,
                          required: q.required,
                          sortOrder: i,
                        })),
                      });
                      showToast('创建成功');
                      setManualOpen(false);
                      fetchSurveys();
                    } catch (e) {
                      setManualError(getErrorMessage(e, '创建失败'));
                    } finally {
                      setManualSaving(false);
                    }
                  }}
                  disabled={manualSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {manualSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">编辑问卷</h2>
              <button onClick={() => { setEditOpen(false); setEditForm(null); setEditError(''); }} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            {editLoading || !editForm ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 size={20} className="animate-spin mr-2" /> 加载中...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="问卷标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">说明</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
                    placeholder="可选"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">题目（{editForm.questions.length}）</h3>
                  <button type="button" onClick={addQuestion} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">新增题目</button>
                </div>
                <div className="space-y-3">
                  {editForm.questions.map((q, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            value={q.questionText}
                            onChange={(e) => updateQuestion(idx, 'questionText', e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            placeholder={`题目 ${idx + 1}`}
                          />
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                checked={q.questionType === 'RATING'}
                                onChange={() => updateQuestion(idx, 'questionType', 'RATING')}
                              />
                              评分题
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                checked={q.questionType === 'CHOICE'}
                                onChange={() => updateQuestion(idx, 'questionType', 'CHOICE')}
                              />
                              单选题
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                checked={q.questionType === 'TEXT'}
                                onChange={() => updateQuestion(idx, 'questionType', 'TEXT')}
                              />
                              文本题
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                              />
                              必填
                            </label>
                          </div>
                          {q.questionType === 'CHOICE' && (
                            <input
                              value={q.optionsText}
                              onChange={(e) => updateQuestion(idx, 'optionsText', e.target.value)}
                              className="w-full px-3 py-2 border rounded"
                              placeholder="选项，逗号分隔"
                            />
                          )}
                        </div>
                        <button type="button" onClick={() => removeQuestion(idx)} className="text-sm text-red-500 px-2 py-1 hover:bg-red-50 rounded">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditOpen(false); setEditForm(null); setEditError(''); }} className="px-4 py-2 border rounded-lg">取消</button>
                  <button onClick={doEditSave} disabled={editSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {editSaving && <Loader2 size={16} className="inline-block mr-2 animate-spin" />}保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && detailSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{detailSurvey.title}</h2>
              <button onClick={() => setDetailOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-500"><Loader2 size={18} className="animate-spin mr-2" />加载中...</div>
            ) : (
              <>
                <p className="text-sm text-gray-500">{detailSurvey.description}</p>
                {detailStats && (
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">答卷数</div>
                      <div className="text-xl font-bold">{detailStats.responseCount}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">平均情感</div>
                      <div className="text-xl font-bold">{detailStats.averageSentiment}</div>
                    </div>
                  </div>
                )}

                <h3 className="text-sm font-semibold text-gray-800 mt-4">题目</h3>
                <div className="mt-2 space-y-3">
                  {detailSurvey.questions.map((q, i) => {
                    const qs = detailQuestionStats.find((item) => item.questionId === q.id);
                    return (
                      <div key={q.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{q.questionType}</span>
                          {q.required && <span className="text-xs text-red-500">必填</span>}
                          <span className="text-xs text-gray-500">ID: {q.id}</span>
                        </div>
                        <p className="text-sm mt-1">{i + 1}. {q.questionText}</p>
                        {q.options && <p className="text-xs text-gray-500 mt-1">选项: {q.options.join(', ')}</p>}

                        {qs && q.questionType === 'RATING' && (
                          <div className="text-xs text-gray-700">平均分：{qs.averageRating ?? 0}（答卷数 {qs.answerCount}）</div>
                        )}

                        {qs && q.questionType === 'CHOICE' && qs.optionRatios && (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">选项分布（答卷数 {qs.answerCount}）</div>
                            {qs.optionRatios.map((o) => (
                              <div key={o.option} className="flex items-center gap-2 text-xs text-gray-700">
                                <span className="min-w-[80px]">{o.option}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded">
                                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${o.ratio}%` }} />
                                </div>
                                <span className="w-16 text-right">{o.ratio}%</span>
                                <span className="w-12 text-right text-gray-500">{o.count}票</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {qs && q.questionType === 'TEXT' && qs.textAnswers && qs.textAnswers.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">文本答案（共 {qs.answerCount} 条，显示全部）</div>
                            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 text-xs text-gray-700 space-y-1">
                              {qs.textAnswers.map((t, idx) => (
                                <div key={`${q.id}-ans-${idx}`} className="border-b last:border-0 pb-1 last:pb-0">
                                  {t}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {detailResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">最近答卷（前10条）</h3>
                    <div className="space-y-3">
                      {detailResults.map((r) => (
                        <div key={r.id} className="border rounded-lg p-3 text-sm text-gray-700">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{r.displayName ?? r.username}</span>
                            <span>{new Date(r.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="space-y-1">
                            {r.answers.map((a) => (
                              <div key={`${r.id}-${a.questionId}`} className="text-gray-700">
                                <span className="font-medium">{a.questionText}：</span>
                                <span>{a.answerValue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <p className="text-sm">确定要删除该问卷吗？此操作不可撤销。</p>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setDelId(null)} className="px-4 py-2 border rounded-lg">取消</button>
              <button onClick={() => doDel(delId)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-3">变更问卷状态</h3>
            <select
              className="w-full border rounded-lg px-3 py-2 mb-3"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
              <option value="CLOSED">已关闭</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setStatusModalId(null); setStatusSaving(false); }} className="px-4 py-2 border rounded-lg">取消</button>
              <button
                onClick={async () => {
                  if (statusModalId === null) return;
                  setStatusSaving(true);
                  try {
                    await surveyApi.updateStatus(statusModalId, statusValue);
                    showToast('状态已更新');
                    setStatusModalId(null);
                    fetchSurveys();
                  } catch (e) {
                    showToast(getErrorMessage(e, '状态更新失败'), 'error');
                  } finally {
                    setStatusSaving(false);
                  }
                }}
                disabled={statusSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {statusSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}