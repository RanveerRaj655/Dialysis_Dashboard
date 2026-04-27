import { useState } from "react";
import { type Session, updateSession } from "../api";
import { X, Save, AlertCircle, Scale, Activity, ClipboardList } from "lucide-react";

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSessionModal({ session, onClose, onSuccess }: EditSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    preWeight: session.preWeight,
    postWeight: session.postWeight || "",
    systolicBp: session.systolicBp || "",
    diastolicBp: session.diastolicBp || "",
    machineId: session.machineId,
    nurseNotes: session.nurseNotes || "",
    startTime: new Date(session.startTime).toISOString().slice(0, 16),
    endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : "",
    status: session.status
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      preWeight: Number(formData.preWeight),
      postWeight: formData.postWeight !== "" ? Number(formData.postWeight) : null,
      systolicBp: formData.systolicBp !== "" ? Number(formData.systolicBp) : null,
      diastolicBp: formData.diastolicBp !== "" ? Number(formData.diastolicBp) : null,
      machineId: formData.machineId,
      nurseNotes: formData.nurseNotes,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: formData.endTime !== "" ? new Date(formData.endTime).toISOString() : null,
      status: formData.status as any,
    };

    try {
      await updateSession(session._id, payload);
      onSuccess();
    } catch (err: any) {
      setError("Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clinical Update</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Adjusting session # {session._id.slice(-6)}</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex gap-3 items-center border border-red-100">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <span className="font-bold">{error}</span>
            </div>
          )}

          <form id="edit-session-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700">
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Machine Assignment</label>
                <input required type="text" name="machineId" value={formData.machineId} onChange={handleChange} className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Session Start</label>
                <input required type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Session End</label>
                <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>

            <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">Vital Signs</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Pre-Weight (kg)
                  </label>
                  <input required step="0.1" type="number" name="preWeight" value={formData.preWeight} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border-transparent shadow-sm rounded-2xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-black text-indigo-700 text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Post-Weight (kg)
                  </label>
                  <input step="0.1" type="number" name="postWeight" value={formData.postWeight} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border-transparent shadow-sm rounded-2xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-black text-indigo-700 text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Post Systolic BP</label>
                  <input type="number" name="systolicBp" value={formData.systolicBp} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border-transparent shadow-sm rounded-2xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-black text-indigo-700 text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Post Diastolic BP</label>
                  <input type="number" name="diastolicBp" value={formData.diastolicBp} onChange={handleChange} className="w-full px-4 py-3.5 bg-white border-transparent shadow-sm rounded-2xl focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-black text-indigo-700 text-lg" />
                </div>
              </div>
            </div>

            <div className="space-y-2 px-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <ClipboardList className="w-4 h-4" /> Nurse Observations
              </label>
              <textarea name="nurseNotes" value={formData.nurseNotes} onChange={handleChange} rows={4} className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-700 resize-none" placeholder="Enter clinical notes here..." />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3.5 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">
            Cancel
          </button>
          <button form="edit-session-form" type="submit" disabled={loading} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
            {loading ? "Saving..." : "Commit Update"}
            {!loading && <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
