import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, X, Edit, Save, Loader2, Play, Pause } from 'lucide-react';
import supabase from '../../SupabaseClient';
import { useRef } from 'react';

const extractAudioUrl = (text) => {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(/(https?:\/\/[^\s]+(?:voice-notes|audio-recordings)[^\s]*\.(?:mp3|wav|ogg|webm|m4a|aac)(\?.*)?)/i) ||
        text.match(/(https?:\/\/[^\s]+(?:voice-notes|audio-recordings)[^\s]*)/i);
    return match ? match[0] : null;
};

const isAudioUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http') && (
        url.includes('audio-recordings') ||
        url.includes('voice-notes') ||
        url.match(/\.(mp3|wav|ogg|webm|m4a|aac)(\?.*)?$/i)
    );
};

const AudioPlayer = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, []);

    return (
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all duration-300 min-w-[140px] mt-2 ${isPlaying
            ? 'bg-blue-50 border-blue-200 shadow-sm scale-[1.02]'
            : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-xs'
            }`}>
            <button
                onClick={togglePlay}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isPlaying
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-110'
                    }`}
            >
                {isPlaying ? (
                    <Pause size={14} className="text-white fill-white" />
                ) : (
                    <Play size={14} className="text-white fill-white ml-0.5" />
                )}
            </button>
            <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlaying ? 'text-blue-700' : 'text-gray-400'}`}>
                    {isPlaying ? 'Playing...' : 'Voice Note'}
                </span>
                {isPlaying && (
                    <div className="flex gap-0.5 mt-0.5 h-1.5 items-center">
                        <div className="w-0.5 h-full bg-blue-400 animate-bounce" style={{ animationDuration: '0.6s' }}></div>
                        <div className="w-0.5 h-2/3 bg-blue-500 animate-bounce" style={{ animationDuration: '0.8s' }}></div>
                        <div className="w-0.5 h-full bg-blue-600 animate-bounce" style={{ animationDuration: '0.4s' }}></div>
                        <div className="w-0.5 h-2/3 bg-blue-500 animate-bounce" style={{ animationDuration: '0.7s' }}></div>
                    </div>
                )}
            </div>
            <audio ref={audioRef} src={url} className="hidden" />
        </div>
    );
};

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [isHolidayDate, setIsHolidayDate] = useState(false);
    const [holidayName, setHolidayName] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editForm, setEditForm] = useState({ status: '', remark: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    useEffect(() => {
        fetchTasks();
    }, [currentDate]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('user-name');
            const userAccess = localStorage.getItem('user_access');

            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

            let checklistQuery = supabase.from('checklist').select('*').gte('task_start_date', startOfMonth).lte('task_start_date', endOfMonth);
            let maintenanceQuery = supabase.from('maintenance_tasks').select('*').gte('task_start_date', startOfMonth).lte('task_start_date', endOfMonth);
            let repairQuery = supabase.from('repair_tasks').select('*').gte('created_at', startOfMonth).lte('created_at', endOfMonth);

            // Apply filters based on role
            if (role === 'user' && username) {
                checklistQuery = checklistQuery.eq('name', username);
                maintenanceQuery = maintenanceQuery.eq('name', username);
                repairQuery = repairQuery.eq('name', username);
            } else if (role === 'admin' && userAccess && userAccess !== 'all') {
                const allowedDepartments = userAccess.split(',').map(dept => dept.trim()).filter(d => d && d !== 'all');
                if (allowedDepartments.length > 0) {
                    checklistQuery = checklistQuery.in('department', allowedDepartments);
                    maintenanceQuery = maintenanceQuery.in('department', allowedDepartments);
                    repairQuery = repairQuery.in('department', allowedDepartments);
                }
            }

            const [checklistRes, maintenanceRes, repairRes, holidaysRes] = await Promise.all([
                checklistQuery,
                maintenanceQuery,
                repairQuery,
                supabase.from('holidays').select('*')
            ]);

            const normalizedTasks = [
                ...(checklistRes.data || []).map(t => ({ ...t, id: t.task_id, cat: 'CK', title: t.tasks || t.task_description, date: t.task_start_date, type: 'checklist' })),
                ...(maintenanceRes.data || []).map(t => ({ ...t, cat: 'MT', title: t.task_description || t.id, date: t.task_start_date, type: 'maintenance' })),
                ...(repairRes.data || []).map(t => ({ ...t, cat: 'RP', title: t.issue_description || t.id, date: t.created_at, type: 'repair' }))
            ];

            setTasks(normalizedTasks);
            setHolidays(holidaysRes.data || []);
        } catch (err) {
            console.error('Error fetching calendar tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (day, holiday) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.date?.split('T')[0] === dateStr);

        setSelectedDate(dateStr);
        setSelectedTasks(dayTasks);
        setIsHolidayDate(!!holiday);
        setHolidayName(holiday?.holiday_name || '');
        setIsModalOpen(true);
        setEditingTaskId(null); // Reset editing state
    };

    const handleEditClick = (task) => {
        setEditingTaskId(task.id);
        setEditForm({
            status: task.status || '',
            remark: task.remark || task.remarks || ''
        });
    };

    const handleUpdateTask = async (task) => {
        setIsUpdating(true);
        try {
            let tableName = '';
            const updates = { status: editForm.status };

            if (task.type === 'checklist') {
                tableName = 'checklist';
                updates.remark = editForm.remark;
                if (editForm.status === 'yes') updates.submission_date = new Date().toISOString();
            } else if (task.type === 'maintenance') {
                tableName = 'maintenance_tasks';
                updates.remarks = editForm.remark;
                if (editForm.status === 'completed') updates.submission_date = new Date().toISOString();
            } else if (task.type === 'repair') {
                tableName = 'repair_tasks';
                updates.remarks = editForm.remark;
            }

            const pkField = task.type === 'checklist' ? 'task_id' : 'id';
            const { error } = await supabase.from(tableName).update(updates).eq(pkField, task.id);
            if (error) throw error;

            setEditingTaskId(null);
            fetchTasks(); // Refresh data

            // Update local state for the modal
            setSelectedTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates, remark: editForm.remark, remarks: editForm.remark } : t));
        } catch (err) {
            console.error('Update error:', err);
            alert('Update failed');
        } finally {
            setIsUpdating(false);
        }
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square bg-gray-50 border-r border-b border-gray-200"></div>);
    }

    for (let i = 1; i <= totalDays; i++) {
        const dayDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const holiday = holidays.find(h => h.holiday_date === dayDate);
        const dayTasks = holiday ? [] : tasks.filter(t => t.date?.split('T')[0] === dayDate);
        const isToday = new Date().toISOString().split('T')[0] === dayDate;
        const isHoliday = !!holiday;

        days.push(
            <div
                key={i}
                onClick={() => handleCellClick(i, holiday)}
                className={`aspect-square border-r border-b border-gray-200 p-2 cursor-pointer transition-colors relative ${isHoliday ? 'bg-red-50' : isToday ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold ${isHoliday ? 'text-red-700 underline' : isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                        {i}
                    </span>
                    {dayTasks.length > 0 && !isHoliday && (
                        <div className="flex gap-0.5">
                            {Array.from(new Set(dayTasks.map(d => d.cat))).map(cat => (
                                <div key={cat} className={`w-2 h-2 rounded-full ${cat === 'CK' ? 'bg-blue-600' : cat === 'MT' ? 'bg-orange-600' : 'bg-red-600'}`} title={cat} />
                            ))}
                        </div>
                    )}
                </div>

                {isHoliday ? (
                    <div className="mt-1">
                        <p className="text-[10px] font-bold text-red-800 uppercase leading-tight truncate px-1">
                            {holiday.holiday_name}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5 mt-1 overflow-hidden h-[calc(100%-1.5rem)]">
                        {dayTasks.slice(0, 3).map((task, idx) => (
                            <div key={idx} className="bg-white border-l-4 border-gray-200 pl-1 py-0.5 shadow-sm mb-0.5">
                                <p className="text-[9px] font-bold text-gray-700 truncate uppercase">
                                    {isAudioUrl(task.title) ? "Voice Note" : task.title}
                                </p>
                            </div>
                        ))}
                        {dayTasks.length > 3 && (
                            <p className="text-[9px] font-bold text-blue-700 pl-1">+ {dayTasks.length - 3} More</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200 pb-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-700 rounded text-white font-bold">
                            <CalendarIcon size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight uppercase">Operational Calendar</h1>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Task Scheduling & Resource Planning
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center border border-gray-300 rounded shadow-sm overflow-hidden">
                        <button onClick={prevMonth} className="p-2 bg-gray-50 hover:bg-gray-100 transition-colors border-r border-gray-300 text-gray-700">
                            <ChevronLeft size={16} strokeWidth={3} />
                        </button>
                        <div className="px-6 py-2 bg-white font-bold text-gray-900 text-sm min-w-[180px] text-center uppercase tracking-widest">
                            {monthName} {year}
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-gray-50 hover:bg-gray-100 transition-colors border-l border-gray-300 text-gray-700">
                            <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        {[
                            { label: 'Checklist', color: 'bg-blue-600' },
                            { label: 'Maintenance', color: 'bg-orange-600' },
                            { label: 'Repair', color: 'bg-red-600' }
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-3 h-3 ${item.color} rounded-sm`}></div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar View */}
                <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                    <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                            <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 relative border-l border-t border-gray-200">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center font-bold text-blue-700 uppercase tracking-[0.3em]">
                                Loading Data...
                            </div>
                        )}
                        {days}
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white w-full max-w-2xl rounded shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 bg-blue-700 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3">
                                    <Clock className="w-4 h-4" /> {isHolidayDate ? 'Public Holiday' : 'Task Records'}
                                </h2>
                                <p className="text-[10px] font-medium uppercase opacity-75 mt-0.5">
                                    {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            {isHolidayDate ? (
                                <div className="p-10 text-center space-y-3 bg-red-50 border border-red-100 rounded">
                                    <h3 className="text-xl font-bold text-red-800 uppercase tracking-tight">{holidayName}</h3>
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Company Holiday - No Operations</p>
                                </div>
                            ) : selectedTasks.length === 0 ? (
                                <div className="p-10 text-center bg-gray-50 border border-gray-100 rounded">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Zero Tasks For This Day</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedTasks.map((task) => (
                                        <div key={task.id} className="border border-gray-200 rounded p-4 flex flex-col relative overflow-hidden">
                                            <div className={`absolute top-0 left-0 w-2 h-full ${task.cat === 'CK' ? 'bg-blue-600' : task.cat === 'MT' ? 'bg-orange-600' : 'bg-red-600'}`}></div>
                                            <div className="pl-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">ID: #{task.id}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase ${['completed', 'yes', 'Done'].includes(task.status) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {task.status || 'Pending'}
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const audioUrl = extractAudioUrl(task.title);
                                                    return (
                                                        <div className="mb-3">
                                                            {audioUrl && (
                                                                <div className="mb-2">
                                                                    <h4 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Description Recording:</h4>
                                                                    <AudioPlayer url={audioUrl} />
                                                                </div>
                                                            )}
                                                            {(!audioUrl || task.title.replace(audioUrl, '').trim().length > 0) && (
                                                                <h4 className="text-sm font-bold text-gray-900 uppercase mb-1 leading-tight">
                                                                    {task.title.replace(/Voice Note Link:?\s*/i, '').replace(audioUrl || '', '').trim() || (audioUrl ? '' : '—')}
                                                                </h4>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                <div className="grid grid-cols-2 gap-4 text-[10px] font-medium text-gray-500 uppercase mb-4">
                                                    <div>Assigned: <span className="text-gray-900 font-bold">{task.name || '-'}</span></div>
                                                    <div>Type: <span className="text-gray-900 font-bold">{task.type}</span></div>
                                                </div>

                                                {(task.remark || task.remarks) && (
                                                    <div className="mt-2 pt-2 border-t border-gray-100 mb-4">
                                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Remarks:</h4>
                                                        {(() => {
                                                            const remarkText = task.remark || task.remarks;
                                                            const audioUrl = extractAudioUrl(remarkText);
                                                            return (
                                                                <>
                                                                    {audioUrl && <AudioPlayer url={audioUrl} />}
                                                                    {(!audioUrl || remarkText.replace(audioUrl, '').trim().length > 0) && (
                                                                        <p className="text-xs font-medium text-gray-600 italic">
                                                                            {remarkText.replace(/Voice Note Link:?\s*/i, '').replace(audioUrl || '', '').trim()}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CalendarPage;
