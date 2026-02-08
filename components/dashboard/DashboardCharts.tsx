"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface MonthlyStat {
    month: string;
    income: number;
    expense: number;
}

interface DashboardChartsProps {
    stats: MonthlyStat[];
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
    // Calculate totals for Pie Chart
    const totalIncome = stats.reduce((sum, item) => sum + Number(item.income), 0);
    const totalExpense = stats.reduce((sum, item) => sum + Number(item.expense), 0);
    const netProfit = totalIncome - totalExpense;

    const pieData = [
        { name: "Gelir", value: totalIncome },
        { name: "Gider", value: totalExpense },
    ];

    const COLORS = ["#10B981", "#EF4444"]; // Green for Income, Red for Expense

    return (
        <div className="space-y-8">

            {/* Summary Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Toplam Gelir</h3>
                    <p className="text-3xl font-bold text-green-500">{totalIncome.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Toplam Gider</h3>
                    <p className="text-3xl font-bold text-red-500">{totalExpense.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm flex flex-col items-center justify-center text-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Net Kâr</h3>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {netProfit.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bar Chart - Monthly Trend */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Aylık Finansal Durum</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#F3F4F6" }}
                                    itemStyle={{ color: "#F3F4F6" }}
                                    formatter={(value: number) => [`${value.toLocaleString("tr-TR")} ₺`, ""]}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                                <Bar dataKey="income" name="Gelir" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" name="Gider" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Distribution */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Gelir / Gider Dağılımı</h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#F3F4F6" }}
                                    itemStyle={{ color: "#F3F4F6" }}
                                    formatter={(value: number) => [`${value.toLocaleString("tr-TR")} ₺`, ""]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text overlay for Pie Chart */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Net</span>
                            <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {((netProfit / (totalIncome || 1)) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
