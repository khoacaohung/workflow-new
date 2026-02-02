import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CheckCircle2, 
  Package, 
  Truck, 
  ChevronRight, 
  AlertCircle,
  FileText,
  UserCircle2,
  Search,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Send,
  XCircle,
  User,
  SendHorizontal,
  ClipboardList,
  Paperclip,
  File
} from 'lucide-react';
import { ParentTask, SubTask, TaskStatus, UserRole, ApprovalStep, Product } from './types';
import { StatusBadge } from './components/StatusBadge';

const STORAGE_KEY_PARENTS = 'po_manager_parents_data_v2';
const STORAGE_KEY_SUBS = 'po_manager_subs_data_v2';

export default function App() {
  const [parentTasks, setParentTasks] = useState<ParentTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PARENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [subTasks, setSubTasks] = useState<SubTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SUBS);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'approvals'>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Staff);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [tempFiles, setTempFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PARENTS, JSON.stringify(parentTasks));
  }, [parentTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(subTasks));
  }, [subTasks]);

  useEffect(() => {
    if (parentTasks.length === 0) return;

    setParentTasks(prev => {
      const updated = prev.map(parent => {
        const children = subTasks.filter(s => s.parentId === parent.id);
        if (children.length === 0) return { ...parent, status: TaskStatus.Draft };

        const anyRejected = children.some(c => c.status === TaskStatus.Rejected);
        const allApproved = children.every(c => c.status === TaskStatus.Approved);
        const anyApproved = children.some(c => c.status === TaskStatus.Approved);
        const anySubmitted = children.some(c => c.status === TaskStatus.Submitted);
        const allDraft = children.every(c => c.status === TaskStatus.Draft);
        
        let newStatus = parent.status;
        
        // CẬP NHẬT LOGIC TRẠNG THÁI CHA:
        // 1. Nếu tất cả Approved -> Completed
        if (allApproved && children.length > 0) {
          newStatus = TaskStatus.Completed;
        } 
        // 2. Nếu có ít nhất 1 Approved -> Partially Completed (Kể cả khi có Rejected hoặc Submitted khác)
        else if (anyApproved) {
          newStatus = TaskStatus.PartiallyCompleted;
        } 
        // 3. Nếu có Rejected (và chưa có cái nào Approved) -> Rejected
        else if (anyRejected) {
          newStatus = TaskStatus.Rejected;
        } 
        // 4. Nếu có cái đang Submitted -> Submitted
        else if (anySubmitted) {
          newStatus = TaskStatus.Submitted;
        }
        // 5. Mặc định là Draft
        else if (allDraft) {
          newStatus = TaskStatus.Draft;
        }

        if (parent.status !== newStatus) {
            return { ...parent, status: newStatus };
        }
        return parent;
      });
      
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
          return updated;
      }
      return prev;
    });
  }, [subTasks]);

  const handleCreateParent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const autoCode = `YC-${Math.floor(100 + Math.random() * 900)}`;
    const newParentId = Math.random().toString(36).substr(2, 9);
    
    const newParent: ParentTask = {
      id: newParentId,
      code: autoCode,
      employeeName: formData.get('employeeName') as string,
      description: formData.get('description') as string,
      products: [],
      totalValue: 0,
      deliveryTime: '',
      status: TaskStatus.Draft,
      createdAt: new Date().toISOString().split('T')[0],
      attachments: [...tempFiles]
    };

    const initialSub: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      parentId: newParentId,
      taskCode: `Task-${Math.floor(1000 + Math.random() * 9000)}`,
      description: 'Nội dung thực hiện bước 1...',
      status: TaskStatus.Draft,
      currentStep: ApprovalStep.Manager1Review
    };

    setParentTasks([newParent, ...parentTasks]);
    setSubTasks([initialSub, ...subTasks]);
    setTempFiles([]);
    setActiveView('dashboard');
    setSelectedParent(newParentId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f: File) => f.name);
      setTempFiles([...tempFiles, ...names]);
    }
  };

  const handleAddSubTask = (parentId: string) => {
    const newSub: SubTask = {
      id: Math.random().toString(36).substr(2, 9),
      parentId,
      taskCode: `Task-${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      status: TaskStatus.Draft,
      currentStep: ApprovalStep.Manager1Review
    };
    setSubTasks([...subTasks, newSub]);
  };

  const handleSubmitSub = (subId: string) => {
    setSubTasks(prev => prev.map(s => s.id === subId ? { ...s, status: TaskStatus.Submitted, currentStep: ApprovalStep.Manager1Review } : s));
  };

  const handleSubmitAllDrafts = (parentId: string) => {
    setSubTasks(prev => prev.map(s => 
      (s.parentId === parentId && s.status === TaskStatus.Draft) 
      ? { ...s, status: TaskStatus.Submitted, currentStep: ApprovalStep.Manager1Review } 
      : s
    ));
  };

  const handleApprove = (subId: string) => {
    setSubTasks(prev => prev.map(s => {
      if (s.id !== subId) return s;
      
      const nextStep = s.currentStep + 1;
      if (nextStep > 5) {
        return { ...s, status: TaskStatus.Approved, currentStep: 6 as any };
      }
      return { ...s, currentStep: nextStep };
    }));
  };

  const handleReject = (subId: string) => {
    setSubTasks(prev => prev.map(s => s.id === subId ? { ...s, status: TaskStatus.Rejected } : s));
  };

  const handleEditSub = (subId: string, updates: Partial<SubTask>) => {
    setSubTasks(prev => prev.map(s => s.id === subId ? { ...s, ...updates } : s));
  };

  const getApprovalProgress = (parentId: string) => {
    const children = subTasks.filter(s => s.parentId === parentId);
    if (children.length === 0) return { m1: 0, m2: 0, a1: 0, a2: 0, ceo: 0 };
    
    const stats = children.reduce((acc, curr) => {
      if (curr.status === TaskStatus.Approved) {
        acc.m1++; acc.m2++; acc.a1++; acc.a2++; acc.ceo++;
      } else if (curr.status === TaskStatus.Submitted || curr.status === TaskStatus.Rejected) {
        if (curr.currentStep > ApprovalStep.Manager1Review) acc.m1++;
        if (curr.currentStep > ApprovalStep.Manager2Review) acc.m2++;
        if (curr.currentStep > ApprovalStep.Accountant1Review) acc.a1++;
        if (curr.currentStep > ApprovalStep.Accountant2Review) acc.a2++;
        if (curr.currentStep > ApprovalStep.CEOReview) acc.ceo++;
      }
      return acc;
    }, { m1: 0, m2: 0, a1: 0, a2: 0, ceo: 0 });

    const count = children.length;
    return {
      m1: (stats.m1 / count) * 100,
      m2: (stats.m2 / count) * 100,
      a1: (stats.a1 / count) * 100,
      a2: (stats.a2 / count) * 100,
      ceo: (stats.ceo / count) * 100
    };
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ClipboardList className="text-blue-400 w-8 h-8" />
          <h1 className="font-bold text-lg leading-tight uppercase tracking-tight">Quy trình<br/><span className="text-slate-400 font-normal text-sm lowercase">duyệt phiếu</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <LayoutDashboard size={20} />
            Bảng điều khiển
          </button>
          <button 
            onClick={() => setActiveView('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'create' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <PlusCircle size={20} />
            Tạo mới yêu cầu
          </button>
          <button 
            onClick={() => setActiveView('approvals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'approvals' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <ShieldCheck size={20} />
            Phê duyệt
            {subTasks.some(s => s.status === TaskStatus.Submitted) && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">!</span>
            )}
          </button>
        </nav>

        <div className="p-4 bg-slate-800/50 m-4 rounded-xl space-y-3 shadow-inner border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle2 size={16} className="text-blue-400" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Giả lập vai trò</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {[UserRole.Staff, UserRole.Manager1, UserRole.Manager2, UserRole.Accountant1, UserRole.Accountant2, UserRole.CEO].map(role => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`text-left px-3 py-1.5 rounded text-[10px] transition-all border ${currentRole === role ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-sm' : 'bg-slate-800 text-slate-400 border-transparent hover:text-slate-200'}`}
              >
                {role === UserRole.Staff && 'Nhân viên'}
                {role === UserRole.Manager1 && 'Trưởng phòng 1'}
                {role === UserRole.Manager2 && 'Trưởng phòng 2'}
                {role === UserRole.Accountant1 && 'Kế toán 1'}
                {role === UserRole.Accountant2 && 'Kế toán 2'}
                {role === UserRole.CEO && 'CEO'}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' && 'Danh sách yêu cầu'}
              {activeView === 'create' && 'Tạo yêu cầu mới'}
              {activeView === 'approvals' && 'Danh sách chờ duyệt'}
            </h2>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest">ĐANG GIẢ LẬP: {currentRole}</span>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto bg-slate-50/50">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {parentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                  <FileText size={48} className="mb-4 opacity-10" />
                  <p className="font-medium text-slate-500">Chưa có dữ liệu. Vui lòng tạo yêu cầu mới.</p>
                  <button onClick={() => setActiveView('create')} className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
                    <PlusCircle size={18} />
                    Tạo yêu cầu đầu tiên
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <StatCard label="Tổng yêu cầu" value={parentTasks.length} icon={<FileText className="text-blue-500" />} />
                    <StatCard label="Chờ duyệt (Sub)" value={subTasks.filter(s => s.status === TaskStatus.Submitted).length} icon={<AlertCircle className="text-orange-500" />} />
                    <StatCard label="Đã hoàn tất" value={parentTasks.filter(p => p.status === TaskStatus.Completed).length} icon={<CheckCircle2 className="text-green-500" />} />
                    <StatCard label="Duyệt một phần" value={parentTasks.filter(p => p.status === TaskStatus.PartiallyCompleted).length} icon={<AlertCircle className="text-amber-500" />} />
                    <StatCard label="Bị từ chối" value={parentTasks.filter(p => p.status === TaskStatus.Rejected).length} icon={<XCircle className="text-red-500" />} />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Theo dõi tiến độ yêu cầu</h3>
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                          <th className="px-6 py-4 whitespace-nowrap">Mã Yêu Cầu</th>
                          <th className="px-6 py-4 whitespace-nowrap">Nhân Viên</th>
                          <th className="px-6 py-4 w-1/4">Nội dung</th>
                          <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                          <th className="px-6 py-4 whitespace-nowrap">Tiến độ duyệt (5 bước)</th>
                          <th className="px-6 py-4 text-right whitespace-nowrap">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {parentTasks.map(parent => {
                          const progress = getApprovalProgress(parent.id);
                          const hasDrafts = subTasks.some(s => s.parentId === parent.id && s.status === TaskStatus.Draft);
                          return (
                            <React.Fragment key={parent.id}>
                              <tr className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedParent === parent.id ? 'bg-blue-50/30' : ''}`} onClick={() => setSelectedParent(selectedParent === parent.id ? null : parent.id)}>
                                <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                                  <ChevronRight className={`transition-transform duration-200 ${selectedParent === parent.id ? 'rotate-90 text-blue-500' : 'text-slate-300'}`} size={16} />
                                  {parent.code}
                                </td>
                                <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-sm">
                                  {parent.employeeName}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm italic line-clamp-1">{parent.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={parent.status} /></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-1 items-center">
                                        {[
                                          { label: 'TP1', p: progress.m1 },
                                          { label: 'TP2', p: progress.m2 },
                                          { label: 'KT1', p: progress.a1 },
                                          { label: 'KT2', p: progress.a2 },
                                          { label: 'CEO', p: progress.ceo }
                                        ].map((step, idx) => (
                                          <React.Fragment key={idx}>
                                            <div className="flex flex-col gap-1 items-center">
                                                <div className={`w-2 h-2 rounded-full ${step.p === 100 ? 'bg-green-500' : step.p > 0 ? 'bg-blue-400 animate-pulse' : 'bg-slate-200'}`} />
                                                <span className="text-[7px] text-slate-400 font-bold uppercase">{step.label}</span>
                                            </div>
                                            {idx < 4 && <div className="w-2 h-px bg-slate-200 mb-2"></div>}
                                          </React.Fragment>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {currentRole === UserRole.Staff && hasDrafts && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleSubmitAllDrafts(parent.id); }}
                                        className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm active:scale-95"
                                      >
                                        Gửi duyệt
                                      </button>
                                    )}
                                    {currentRole === UserRole.Staff && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleAddSubTask(parent.id); setSelectedParent(parent.id); }}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md whitespace-nowrap"
                                      >
                                        + Task
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {selectedParent === parent.id && (
                                <tr>
                                  <td colSpan={6} className="px-8 py-4 bg-slate-100/30">
                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-md animate-in slide-in-from-top-2 duration-300">
                                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Danh sách task</span>
                                            <Edit2 size={12} className="text-slate-400" />
                                          </div>
                                          {parent.attachments && parent.attachments.length > 0 && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-300">|</span>
                                              <Paperclip size={12} className="text-slate-400" />
                                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Tài liệu: {parent.attachments.join(', ')}</span>
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                          {subTasks.filter(s => s.parentId === parent.id).length} task trong yêu cầu này
                                        </span>
                                      </div>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-4 py-2 w-1/6">Mã Task</th>
                                            <th className="px-4 py-2">Nội dung thực hiện</th>
                                            <th className="px-4 py-2 w-1/4 text-center">Tiến độ (5 bước)</th>
                                            <th className="px-4 py-2 w-1/6 text-right">Trạng thái</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {subTasks.filter(s => s.parentId === parent.id).map(sub => (
                                            <tr key={sub.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                              <td className="px-4 py-2 font-bold text-slate-700">
                                                {sub.taskCode}
                                              </td>
                                              <td className="px-4 py-2">
                                                <input 
                                                  disabled={sub.status !== TaskStatus.Draft && sub.status !== TaskStatus.Rejected}
                                                  type="text"
                                                  value={sub.description}
                                                  placeholder="Nhập nội dung thực hiện task..."
                                                  onChange={(e) => handleEditSub(sub.id, { description: e.target.value })}
                                                  className="w-full bg-transparent border-transparent hover:border-slate-200 disabled:hover:border-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-1 -mx-1 py-1 outline-none transition-all text-slate-700"
                                                />
                                              </td>
                                              <td className="px-4 py-2">
                                                <div className="flex gap-1 justify-center">
                                                  {[1, 2, 3, 4, 5].map(step => (
                                                    <div 
                                                      key={step}
                                                      className={`w-2.5 h-2.5 rounded-full border ${
                                                        sub.status === TaskStatus.Approved ? 'bg-green-500 border-green-600' :
                                                        sub.status === TaskStatus.Rejected ? 'bg-red-500 border-red-600' :
                                                        sub.status === TaskStatus.Draft ? 'bg-slate-100 border-slate-200' :
                                                        sub.currentStep > step ? 'bg-green-500 border-green-600' :
                                                        sub.currentStep === step ? 'bg-blue-500 border-blue-600 animate-pulse' :
                                                        'bg-slate-200 border-slate-300'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                              </td>
                                              <td className="px-4 py-2 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                                                <StatusBadge status={sub.status} />
                                                {currentRole === UserRole.Staff && (sub.status === TaskStatus.Draft || sub.status === TaskStatus.Rejected) && (
                                                  <button 
                                                    onClick={() => handleSubmitSub(sub.id)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded active:scale-90"
                                                  >
                                                    <Send size={14} />
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeView === 'create' && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Tạo yêu cầu mới</h3>
                  <p className="text-blue-300 text-sm mt-1">Mã số (YC-xxx) sẽ được cấp tự động.</p>
                </div>
                <div className="p-3 bg-blue-600/20 rounded-full border border-blue-500/30">
                  <ClipboardList size={24} className="text-blue-400" />
                </div>
              </div>
              <form onSubmit={handleCreateParent} className="p-8 space-y-6">
                <FormField label="Nhân viên đề xuất" name="employeeName" placeholder="Họ và tên người thực hiện..." required />
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Tóm tắt nội dung yêu cầu</label>
                    <textarea 
                        name="description" 
                        required
                        placeholder="Mô tả lý do và nội dung tổng quát của yêu cầu này..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-24 shadow-sm"
                    ></textarea>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Đính kèm tài liệu liên quan</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group"
                  >
                    <Paperclip className="text-slate-400 group-hover:text-blue-500 transition-colors" size={24} />
                    <span className="text-xs font-medium text-slate-500">Nhấp để chọn file hoặc kéo thả vào đây</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                  </div>
                  {tempFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tempFiles.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600">
                          <File size={12} className="text-slate-400" />
                          <span className="truncate max-w-[150px]">{name}</span>
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setTempFiles(tempFiles.filter((_, i) => i !== idx)); }}
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setActiveView('dashboard')} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Hủy bỏ</button>
                  <button type="submit" className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2">
                    Lưu & Lập danh sách task
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeView === 'approvals' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                <ShieldCheck className="text-amber-600 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-amber-800 text-sm uppercase tracking-wide">Hàng đợi xét duyệt công việc</h4>
                  <p className="text-amber-700 text-xs mt-1 leading-relaxed">Bạn đang thực hiện xét duyệt nội dung công việc với tư cách là <strong>{currentRole}</strong>.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {subTasks
                  .filter(s => {
                    if (s.status !== TaskStatus.Submitted) return false;
                    if (currentRole === UserRole.Manager1 && s.currentStep === ApprovalStep.Manager1Review) return true;
                    if (currentRole === UserRole.Manager2 && s.currentStep === ApprovalStep.Manager2Review) return true;
                    if (currentRole === UserRole.Accountant1 && s.currentStep === ApprovalStep.Accountant1Review) return true;
                    if (currentRole === UserRole.Accountant2 && s.currentStep === ApprovalStep.Accountant2Review) return true;
                    if (currentRole === UserRole.CEO && s.currentStep === ApprovalStep.CEOReview) return true;
                    return false;
                  })
                  .map(sub => (
                    <ApprovalCard 
                      key={sub.id} 
                      sub={sub} 
                      parent={parentTasks.find(p => p.id === sub.parentId)!}
                      role={currentRole}
                      onApprove={() => handleApprove(sub.id)}
                      onReject={() => handleReject(sub.id)}
                    />
                  ))}
                
                {subTasks.filter(s => s.status === TaskStatus.Submitted && (
                  (currentRole === UserRole.Manager1 && s.currentStep === ApprovalStep.Manager1Review) ||
                  (currentRole === UserRole.Manager2 && s.currentStep === ApprovalStep.Manager2Review) ||
                  (currentRole === UserRole.Accountant1 && s.currentStep === ApprovalStep.Accountant1Review) ||
                  (currentRole === UserRole.Accountant2 && s.currentStep === ApprovalStep.Accountant2Review) ||
                  (currentRole === UserRole.CEO && s.currentStep === ApprovalStep.CEOReview)
                )).length === 0 && (
                  <div className="col-span-full py-40 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle2 size={64} className="mb-4 text-slate-100" />
                    <p className="font-bold text-slate-500 text-lg">Hàng đợi đang trống</p>
                    <p className="text-sm text-slate-400 mt-2">Hiện tại không có task nào cần bạn phê duyệt.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{label}</p>
        <p className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">{icon}</div>
    </div>
  );
}

function FormField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input 
        {...props} 
        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
      />
    </div>
  );
}

const ApprovalCard: React.FC<{
  sub: SubTask;
  parent: ParentTask;
  role: UserRole;
  onApprove: () => void;
  onReject: () => void;
}> = ({ sub, parent, role, onApprove, onReject }) => {
  const getRoleInfo = () => {
    switch(role) {
      case UserRole.Manager1:
        return { label: 'TRƯỞNG PHÒNG 1', color: 'blue', note: 'Xác nhận nội dung công việc này phù hợp và cần thiết cho kế hoạch.' };
      case UserRole.Manager2:
        return { label: 'TRƯỞNG PHÒNG 2', color: 'indigo', note: 'Phê duyệt nội dung chuyên môn cấp cao cho kế hoạch này.' };
      case UserRole.Accountant1:
        return { label: 'KẾ TOÁN 1', color: 'emerald', note: 'Xác nhận đã có nguồn ngân sách dự phòng cho nội dung này.' };
      case UserRole.Accountant2:
        return { label: 'KẾ TOÁN 2', color: 'teal', note: 'Xác nhận tính hợp lệ của phương thức thanh toán.' };
      case UserRole.CEO:
        return { label: 'CEO PHÊ DUYỆT CUỐI', color: 'purple', note: 'Căn cứ trên các xác nhận chuyên môn, tôi phê duyệt thực hiện.' };
      default:
        return { label: 'PHÊ DUYỆT', color: 'slate', note: '' };
    }
  };

  const info = getRoleInfo();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col hover:border-blue-200 transition-all">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
        <div className="overflow-hidden">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider truncate mb-0.5">YÊU CẦU: {parent.code}</span>
          <h4 className="font-bold flex items-center gap-2 truncate text-sm">
            <Package size={16} className="text-blue-400 shrink-0" /> {sub.taskCode}
          </h4>
        </div>
        <div className="shrink-0 ml-2">
           <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">BƯỚC {sub.currentStep}/5</span>
        </div>
      </div>
      <div className="p-6 space-y-5 flex-1">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-black mb-1.5 tracking-wide">Nội dung thực hiện</span>
            <span className="font-bold text-slate-900 text-sm leading-snug block">{sub.description || '(Chưa có nội dung)'}</span>
          </div>
          {parent.attachments && parent.attachments.length > 0 && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-black mb-1.5 tracking-wide">Tài liệu đính kèm ({parent.attachments.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {parent.attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-medium text-slate-500">
                    <File size={10} /> {file}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
             <div>
               <span className="text-slate-400 block text-[10px] uppercase font-black mb-0.5 tracking-wide">Đề xuất bởi</span>
               <p className="text-xs text-slate-700 font-bold">{parent.employeeName}</p>
             </div>
             <div className="text-right">
               <span className="text-slate-400 block text-[10px] uppercase font-black mb-0.5 tracking-wide">Ngày tạo</span>
               <p className="text-xs text-slate-700 font-medium">{parent.createdAt}</p>
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className={`p-4 bg-${info.color}-50 rounded-xl border border-${info.color}-100 animate-in fade-in duration-300`}>
            <p className={`text-[10px] font-black text-${info.color}-600 uppercase mb-2 tracking-widest flex items-center gap-1.5`}>
              <ShieldCheck size={12} />
              {info.label}
            </p>
            <p className={`text-xs text-${info.color}-800 leading-relaxed font-medium italic`}>"{info.note}"</p>
          </div>
        </div>

        <div className="flex gap-4 pt-6 mt-auto">
          <button 
            onClick={onReject}
            className="flex-1 px-4 py-3 border border-red-200 text-red-600 font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-red-50 transition-all active:scale-95 shadow-sm"
          >
            Từ chối
          </button>
          <button 
            onClick={onApprove}
            className="flex-[2] px-6 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-lg"
          >
            {sub.currentStep === 5 ? 'KÝ DUYỆT HOÀN TẤT' : 'CHẤP THUẬN BƯỚC NÀY'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
