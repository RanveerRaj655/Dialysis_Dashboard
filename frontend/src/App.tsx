import { useEffect, useState } from "react";
import { type ScheduleItem, fetchSchedule, type Patient, type Session } from "./api";
import { Activity, AlertTriangle, Plus, CheckCircle2, RefreshCw } from "lucide-react";
import AddSessionModal from "./components/AddSessionModal";
import EditSessionModal from "./components/EditSessionModal";

function App() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAnomalies, setFilterAnomalies] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSchedule();
      setSchedule(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load schedule. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddSession = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsAddModalOpen(true);
  };

  const filteredSchedule = filterAnomalies
    ? schedule.filter((item) => item.session && item.session.anomalies.length > 0)
    : schedule;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 antialiased">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-5 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 premium-gradient rounded-xl shadow-lg shadow-indigo-200">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dialysis Dashboard</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Unit 4 • Clinical Intake</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterAnomalies(!filterAnomalies)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${filterAnomalies
                ? "bg-red-500 text-white shadow-xl shadow-red-100"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:shadow-lg"
                }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filterAnomalies ? "animate-pulse" : ""}`} />
              {filterAnomalies ? "Show All" : "Issues Only"}
            </button>
            <button
              onClick={loadData}
              title="Refresh Sync"
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 border border-slate-100 bg-white"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-10 flex items-end justify-between px-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Operational Log</h2>
            <p className="text-slate-400 text-sm font-medium">Last 24 hours schedule • {filteredSchedule.length} active</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-[2rem] flex items-center gap-4 text-red-800 modern-shadow">
            <div className="p-3 bg-red-100 rounded-2xl"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <h3 className="font-bold">Database Error</h3>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={loadData} className="ml-auto px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {loading && schedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-6" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Records...</p>
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 modern-shadow">
              <CheckCircle2 className="w-16 h-16 text-teal-100 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Station All Clear</h3>
              <p className="text-slate-500 font-medium">No results matching current view.</p>
              {filterAnomalies && (
                <button onClick={() => setFilterAnomalies(false)} className="mt-6 text-sm font-bold text-indigo-600 hover:underline">Show All Records</button>
              )}
            </div>
          ) : (
            filteredSchedule.map((item, idx) => (
              <div
                key={item.patient._id}
                className="animate-fade-in group bg-white rounded-[2.5rem] border border-slate-100 modern-shadow p-8 transition-all duration-500 hover:border-indigo-200/50"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-10 lg:items-center">
                  {/* Patient Info Column */}
                  <div className="lg:w-1/4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0 lg:pr-10">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                        {item.patient.firstName}<br />{item.patient.lastName}
                      </h3>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                      Dry: <span className="text-slate-700 ml-1">{item.patient.dryWeight} kg</span>
                    </p>

                    <span className={`px-5 py-2 rounded-full text-[10px] font-black tracking-[0.15em] uppercase flex items-center justify-center gap-2 border w-fit ${!item.session || item.session.status === "NOT_STARTED" ? "bg-slate-50 text-slate-400 border-slate-100" :
                      item.session.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-teal-50 text-teal-600 border-teal-100"
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${!item.session || item.session.status === "NOT_STARTED" ? "bg-slate-300" :
                        item.session.status === "IN_PROGRESS" ? "bg-amber-400 animate-pulse" :
                          "bg-teal-500"
                        }`} />
                      {item.session?.status?.replace("_", " ") || "Not Started"}
                    </span>
                  </div>

                  {/* Operational Metrics */}
                  <div className="lg:flex-1">
                    {!item.session ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:border-indigo-200 transition-all">
                        <div className="mb-6 sm:mb-0">
                          <p className="text-lg font-black text-slate-700 tracking-tight">Awaiting Intake</p>
                          <p className="text-sm text-slate-400 font-medium">Station is clear for patient check-in</p>
                        </div>
                        <button
                          onClick={() => openAddSession(item.patient)}
                          className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                        >
                          <Plus className="w-5 h-5 font-black" /> Begin Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Pre-Weight</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{item.session.preWeight} <span className="text-xs text-slate-400 font-medium tracking-normal ml-0.5">kg</span></p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Post-Weight</p>
                            <p className={`text-2xl font-black tracking-tight ${item.session.postWeight ? "text-slate-800" : "text-slate-200 italic font-medium"}`}>
                              {item.session.postWeight ? `${item.session.postWeight} kg` : "--"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Pre/Post BP</p>
                            <p className={`text-2xl font-black tracking-tight ${item.session.systolicBp ? "text-slate-800" : "text-slate-200 italic font-medium"}`}>
                              {item.session.systolicBp ? `${item.session.systolicBp}/${item.session.diastolicBp}` : "--/--"} <span className="text-[10px] text-slate-300 ml-1">mmHg</span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Runtime</p>
                            <p className={`text-2xl font-black tracking-tight ${item.session.endTime ? "text-slate-800" : "text-slate-200 italic font-medium"}`}>
                              {item.session.endTime ?
                                `${Math.round((new Date(item.session.endTime).getTime() - new Date(item.session.startTime).getTime()) / 60000)}m`
                                : "LIVE"}
                            </p>
                          </div>
                        </div>

                        {/* Clinical Alerts Area */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-slate-100">
                          <div className="flex flex-wrap gap-2.5">
                            {item.session.anomalies.length > 0 ? (
                              item.session.anomalies.map(anomaly => (
                                <span key={anomaly} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 shadow-sm shadow-red-50">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {anomaly === "HIGH_WEIGHT_GAIN" ? "High IDWG (>5%)" :
                                    anomaly === "HIGH_POST_SYSTOLIC_BP" ? "High BP (>160)" :
                                      anomaly === "SHORT_DURATION" ? "Short Session" : "Extended Run"}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-1.5 pl-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Normal Readings
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setEditingSession(item.session!)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-800 flex items-center gap-3 group/btn px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            Update Records
                            <Plus className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-90" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modals Positioning */}
      {isAddModalOpen && selectedPatient && (
        <AddSessionModal
          patient={selectedPatient}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadData();
          }}
        />
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSuccess={() => {
            setEditingSession(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default App;
