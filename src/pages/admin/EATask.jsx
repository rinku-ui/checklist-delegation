import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { Users, Phone, Calendar, FileText, Save, ArrowLeft, Loader2 } from "lucide-react";
import supabase from "../../SupabaseClient";
import { useDispatch, useSelector } from "react-redux";
import { userDetails } from "../../redux/slice/settingSlice";
import CalendarComponent from "../../components/CalendarComponent";

const formatDateLong = (date) => date ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
const formatDateISO = (date) => date ? date.toISOString().split('T')[0] : "";

export default function EATask() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.setting || {});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState({
        doer_name: "",
        phone_number: "",
        planned_date: "",
        planned_time: "09:00",
        task_description: ""
    });
    const [showCalendar, setShowCalendar] = useState(false);

    // Autocomplete states
    const [doerSuggestions, setDoerSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allDoers, setAllDoers] = useState([]);
    const [historicalDoers, setHistoricalDoers] = useState([]);

    // Fetch unique doers and holidays on component mount
    useEffect(() => {
        fetchUniqueDoers();
        dispatch(userDetails()); // Fetch all users from database
    }, [dispatch]);

    // Merge historical doers and system users
    useEffect(() => {
        const combined = [...historicalDoers];
        const existingNames = new Set(combined.map(d => d.name));

        if (userData && Array.isArray(userData)) {
            userData
                .filter(user => user.role === 'user') // Only show users with 'user' role
                .forEach(user => {
                    if (user.user_name && !existingNames.has(user.user_name)) {
                        combined.push({
                            name: user.user_name,
                            phone: user.phone || user.number ? String(user.phone || user.number) : ""
                        });
                        existingNames.add(user.user_name);
                    }
                });
        }

        // Sort alphabetically
        combined.sort((a, b) => a.name.localeCompare(b.name));

        // Only update if different length to avoid render loops (simple check)
        if (combined.length !== allDoers.length || allDoers.length === 0) {
            setAllDoers(combined);
        }
    }, [historicalDoers, userData]);


    const fetchUniqueDoers = async () => {
        try {
            // 1. Fetch historical doers from ea_tasks
            const { data, error } = await supabase
                .from('ea_tasks')
                .select('doer_name, phone_number')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create unique doers map (latest phone for each name)
            const doersMap = {};

            // Add historical doers
            data?.forEach(task => {
                if (task.doer_name && !doersMap[task.doer_name]) {
                    doersMap[task.doer_name] = task.phone_number || "";
                }
            });

            const uniqueDoers = Object.keys(doersMap).map(name => ({
                name,
                phone: doersMap[name]
            }));

            setHistoricalDoers(uniqueDoers);
        } catch (err) {
            console.error("Error fetching doers:", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Handle autocomplete for doer_name
        if (name === "doer_name") {
            if (value.trim()) {
                const filtered = allDoers.filter(doer =>
                    doer.name.toLowerCase().includes(value.toLowerCase())
                );
                setDoerSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                // Show all suggestions when cleared
                setDoerSuggestions(allDoers);
                setShowSuggestions(true);
            }
        }
    };

    const selectDoer = (doer) => {
        setFormData(prev => ({
            ...prev,
            doer_name: doer.name,
            phone_number: doer.phone
        }));
        setShowSuggestions(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.doer_name || !formData.planned_date || !formData.task_description) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const givenBy = localStorage.getItem("user-name") || "Admin";
            const tasksToInsert = [];

            if (!formData.planned_date) {
                alert("Please select a date");
                return;
            }

            const startDate = new Date(`${formData.planned_date}T${formData.planned_time || "00:00"}:00`);

            tasksToInsert.push({
                doer_name: formData.doer_name,
                phone_number: formData.phone_number,
                planned_date: startDate.toISOString(),
                task_description: formData.task_description,
                status: 'pending',
                given_by: givenBy
            });

            const { error } = await supabase
                .from('ea_tasks')
                .insert(tasksToInsert);

            if (error) throw error;

            setSuccessMessage(`${tasksToInsert.length} EA Task(s) assigned successfully!`);

            // Reset form
            setFormData({
                doer_name: "",
                phone_number: "",
                planned_date: "",
                planned_time: "09:00",
                task_description: ""
            });

            // Refresh doers list
            fetchUniqueDoers();

            // Navigate to tasks page after 1.5 seconds
            setTimeout(() => {
                navigate("/dashboard/assign-task");
            }, 1500);

        } catch (err) {
            console.error("Error creating EA task:", err);
            alert("Failed to assign task: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">

                    {/* Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded text-white shadow-md">
                                <Users size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">EA Task Assignment</h1>
                                <p className="text-sm text-gray-500 mt-0.5 font-medium">Create and manage executive assistant tasks</p>
                            </div>
                        </div>
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="m-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <Save size={18} />
                                <span className="font-bold text-sm">{successMessage}</span>
                            </div>
                            <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-800 text-xl font-bold">
                                ×
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Doer Name */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Doer Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="doer_name"
                                    value={formData.doer_name}
                                    onChange={handleInputChange}
                                    onFocus={() => {
                                        if (!formData.doer_name.trim()) {
                                            setDoerSuggestions(allDoers);
                                            setShowSuggestions(true);
                                        } else if (doerSuggestions.length > 0) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setShowSuggestions(false), 200);
                                    }}
                                    required
                                    placeholder="Enter or select doer name"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && doerSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-150">
                                    {doerSuggestions.map((doer, index) => (
                                        <div
                                            key={index}
                                            onMouseDown={() => selectDoer(doer)}
                                            className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors duration-150 flex justify-between items-center group"
                                        >
                                            <div className="font-bold text-gray-800 group-hover:text-purple-700">{doer.name}</div>
                                            {doer.phone && (
                                                <div className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full group-hover:bg-purple-100 group-hover:text-purple-600 flex items-center gap-1">
                                                    <Phone className="w-2.5 h-2.5" />
                                                    {doer.phone}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    placeholder="Enter contact number"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Planned Date & Frequency */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Planned Date <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    className="w-full px-4 py-3 text-left border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50 focus:bg-white transition-all flex items-center justify-between text-sm font-medium"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {formData.planned_date ? formatDateLong(new Date(formData.planned_date)) : "Select a date"}
                                    </div>
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                </button>
                                {showCalendar && (
                                    <div className="absolute top-full left-0 mt-2 z-50">
                                        <CalendarComponent
                                            date={formData.planned_date ? new Date(formData.planned_date) : null}
                                            onChange={(date) => setFormData(prev => ({ ...prev, planned_date: formatDateISO(date) }))}
                                            onClose={() => setShowCalendar(false)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="planned_time"
                                    value={formData.planned_time}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                                />
                            </div>


                        </div>

                        {/* Task Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Task Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="task_description"
                                value={formData.task_description}
                                onChange={handleInputChange}
                                required
                                rows="5"
                                placeholder="Describe the task instructions in detail..."
                                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all text-sm font-medium"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Processing Assignment...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                                        Initialize Task Assignment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
