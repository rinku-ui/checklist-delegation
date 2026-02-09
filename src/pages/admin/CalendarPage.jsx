import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import supabase from '../../SupabaseClient';

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    useEffect(() => {
        fetchTasks();
    }, [currentDate]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

            // Parallel fetch from all three task tables
            const [checklistRes, maintenanceRes, repairRes] = await Promise.all([
                supabase.from('checklist').select('*').gte('task_start_date', startOfMonth).lte('task_start_date', endOfMonth),
                supabase.from('maintenance_tasks').select('*').gte('task_start_date', startOfMonth).lte('task_start_date', endOfMonth),
                supabase.from('repair_tasks').select('*').gte('created_at', startOfMonth).lte('created_at', endOfMonth)
            ]);

            const normalizedTasks = [
                ...(checklistRes.data || []).map(t => ({ ...t, cat: 'CK', title: t.tasks, date: t.task_start_date })),
                ...(maintenanceRes.data || []).map(t => ({ ...t, cat: 'MT', title: t.task_description || t.task_id, date: t.task_start_date })),
                ...(repairRes.data || []).map(t => ({ ...t, cat: 'RP', title: t.issue_description || t.task_id, date: t.created_at }))
            ];

            setTasks(normalizedTasks);
        } catch (err) {
            console.error('Error fetching calendar tasks:', err);
        } finally {
            setLoading(false);
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

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square bg-gray-50/50 border border-gray-100 p-2"></div>);
    }

    // Days of the month
    for (let i = 1; i <= totalDays; i++) {
        const dayDate = new Date(year, month, i).toISOString().split('T')[0];
        const dayTasks = tasks.filter(t => t.date?.split('T')[0] === dayDate);
        const isToday = new Date().toISOString().split('T')[0] === dayDate;

        days.push(
            <div key={i} className={`aspect-square border border-gray-100 p-2 transition-all hover:bg-purple-50/30 group ${isToday ? 'bg-purple-50/50' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-1">
                    <span className={`text-[11px] font-bold ${isToday ? 'bg-purple-600 text-white w-6 h-6 flex items-center justify-center rounded-md shadow-sm' : 'text-gray-500'}`}>
                        {i}
                    </span>
                    {dayTasks.length > 0 && (
                        <div className="flex gap-0.5">
                            {Array.from(new Set(dayTasks.map(d => d.cat))).map(cat => (
                                <div key={cat} className={`w-1.5 h-1.5 rounded-full ${cat === 'CK' ? 'bg-blue-500' : cat === 'MT' ? 'bg-orange-500' : 'bg-red-500'}`} />
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-1 overflow-y-auto h-[calc(100%-1.8rem)] no-scrollbar mt-1">
                    {dayTasks.slice(0, 4).map((task, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-1.5 px-2 py-1 border-l-[3px] rounded-r-lg transition-all hover:translate-x-0.5 cursor-default ${task.cat === 'CK' ? 'bg-blue-50 border-blue-600' :
                                task.cat === 'MT' ? 'bg-orange-50 border-orange-600' :
                                    'bg-red-50 border-red-600'
                                }`}
                        >
                            <span className={`text-[7px] font-black uppercase tracking-tighter truncate ${task.cat === 'CK' ? 'text-blue-800' :
                                task.cat === 'MT' ? 'text-orange-800' :
                                    'text-red-800'
                                }`}>
                                {task.title || 'Task Record'}
                            </span>
                        </div>
                    ))}
                    {dayTasks.length > 4 && (
                        <div className="text-[7px] font-black text-purple-600 pl-1 py-0.5 animate-pulse">
                            +{dayTasks.length - 4} SYSTEM NODES
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Calendar Header */}
                <div className="bg-white p-3 md:p-4 rounded-xl border border-purple-100 shadow-lg flex flex-col xl:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600 rounded-xl shadow-md shadow-purple-200 transform rotate-3">
                            <CalendarIcon className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 leading-tight">Task Calendar</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} /> Schedule & Live Planning
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 hover:text-purple-600">
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <div className="px-4 font-black text-purple-700 min-w-[150px] text-center text-sm tracking-tight">
                            {monthName} {year}
                        </div>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 hover:text-purple-600">
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { label: 'Checklist', color: 'bg-blue-500', cat: 'CK' },
                            { label: 'Maintenance', color: 'bg-orange-500', cat: 'MT' },
                            { label: 'Repair', color: 'bg-red-500', cat: 'RP' }
                        ].map(item => (
                            <div key={item.cat} className="flex items-center gap-1.5 bg-gray-50/50 px-2 py-1 rounded-lg border border-gray-100">
                                <div className={`w-2 h-2 ${item.color} rounded-full`}></div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-xl border border-purple-100 shadow-xl overflow-hidden">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-purple-600 text-white">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2.5 text-center text-[9px] font-black uppercase tracking-[0.2em] border-r border-purple-500/30 last:border-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-7 relative divide-x divide-y divide-gray-100">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent shadow-xl"></div>
                            </div>
                        )}
                        {days}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CalendarPage;
