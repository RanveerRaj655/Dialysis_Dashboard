import { useState } from "react";
import { registerPatient } from "../api";
import { X, Save, AlertCircle, User, Scale } from "lucide-react";

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dryWeight: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      firstName: formData.firstName,
      lastName: formData.lastName,
      dryWeight: Number(formData.dryWeight),
    };

    try {
      await registerPatient(payload);
      onSuccess();
    } catch (err: any) {
      setError("Failed to register patient. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-white/20">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Patient Registration</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Register a patient for clinical intake</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex gap-3 items-center border border-red-100">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <span className="font-bold">{error}</span>
            </div>
          )}

          <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> First Name
                </label>
                <input 
                  required 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700" 
                  placeholder="e.g. John" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Last Name
                </label>
                <input 
                  required 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700" 
                  placeholder="e.g. Doe" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5" /> Dry Weight (kg)
                </label>
                <input 
                  required 
                  type="number" 
                  step="0.1"
                  name="dryWeight" 
                  value={formData.dryWeight} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 text-lg" 
                  placeholder="70.5" 
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3.5 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">
            Cancel
          </button>
          <button form="patient-form" type="submit" disabled={loading} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
            {loading ? "Registering..." : "Register Patient"}
            {!loading && <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
