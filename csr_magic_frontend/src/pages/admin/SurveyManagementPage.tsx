import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Trash2, Send, X, Loader2, Sparkles } from 'lucide-react';
import { surveyApi } from '../../services/surveyApi';
import type { Survey, AiGeneratedSurvey } from '../../types/survey';

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
  const [saveLoading, setSaveLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSurvey, setDetailSurvey] = useState<Survey | null>(null);
  const [delId, setDelId] = useState<number | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000);
  }, []);

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

  const doGen = async () => {
    const id = parseInt(genAid, 10);
    if (!id) { setGenError('请输入有效的活动ID'); return; }
    setGenLoading(true); setGenError(''); setAiResult(null);
    try { const res = await surveyApi.generateWithAi({ activityId: id }); setAiResult(res.data.data); }
    catch (e: unknown) { setGenError(e instanceof Error ? e.message : 'AI生成失败'); }
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
    } catch { showToast('保存问卷失败', 'error'); }
    finally { setSaveLoading(false); }
  };

  const doPub = async (id: number) => {
    try { await surveyApi.publish(id); showToast('发布成功'); fetchSurveys(); }
    catch { showToast('发布失败', 'error'); }
  };
  const doClose = async (id: number) => {
    try { await surveyApi.close(id); showToast('已关闭'); fetchSurveys(); }
    catch { showToast('关闭失败', 'error'); }
  };
  const doDel = async (id: number) => {
    try { await surveyApi.delete(id); showToast('删除成功'); setDelId(null); fetchSurveys(); }
    catch { showToast('删除失败', 'error'); }
  };
  const doView = async (s: Survey) => {
    try { const res = await surveyApi.getById(s.id); setDetailSurvey(res.data.data); setDetailOpen(true); }
    catch { showToast('获取详情失败', 'error'); }
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
          <button onClick={() => { setGenOpen(true); setAiResult(null); setGenError(''); setGenAid(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} /> AI 生成问卷
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
                        <button onClick={() => doView(s)} className="p-1.5 text-gray-400 hover:text-blue-600" title="查看">
                          <Eye size={16} /></button>
                        {s.status === 'DRAFT' && (
                          <button onClick={() => doPub(s.id)} className="p-1.5 text-gray-400 hover:text-green-600" title="发布">
                            <Send size={16} /></button>
                        )}
                        {s.status === 'PUBLISHED' && (
                          <button onClick={() => doClose(s.id)} className="p-1.5 text-gray-400 hover:text-orange-600" title="关闭">
                            <X size={16} /></button>
                        )}
                        <button onClick={() => setDelId(s.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="删除">
                          <Trash2 size={16} /></button>
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
                  {s.status === 'DRAFT' && <button onClick={() => doPub(s.id)} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">发布</button>}
                  {s.status === 'PUBLISHED' && <button onClick={() => doClose(s.id)} className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded">关闭</button>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">活动ID</label>
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

      {/* Detail Modal */}
      {detailOpen && detailSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{detailSurvey.title}</h2>
              <button onClick={() => setDetailOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500">{detailSurvey.description}</p>
            <div className="mt-4 space-y-3">
              {detailSurvey.questions.map((q, i) => (
                <div key={q.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{q.questionType}</span>
                    {q.required && <span className="text-xs text-red-500">必填</span>}
                  </div>
                  <p className="text-sm mt-1">{i + 1}. {q.questionText}</p>
                  {q.options && <p className="text-xs text-gray-500 mt-1">选项: {q.options.join(', ')}</p>}
                </div>
              ))}
            </div>
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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}