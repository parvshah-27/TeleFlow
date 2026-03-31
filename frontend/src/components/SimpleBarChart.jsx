import React from 'react';

const SimpleBarChart = ({ data, color = "bg-blue-500" }) => (
    <div className="h-48 flex items-end gap-2 w-full pt-4">
        {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                <div className="relative w-full flex justify-center items-end h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {item.actual !== undefined ? `${item.actual} (${item.value}%)` : `${item.value}%`}
                    </div>
                    {/* Bar */}
                    <div 
                        className={`w-full max-w-[32px] rounded-t-sm transition-all duration-500 ${color} opacity-80 group-hover:opacity-100`}
                        style={{ height: item.value > 0 ? `${Math.max(item.value, 4)}%` : '0%' }}
                    >
                    </div>
                </div>
                <div className="h-6 flex items-center w-full overflow-hidden">
                    <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center" title={item.label}>
                        {item.label}
                    </span>
                </div>
            </div>
        ))}
    </div>
);

export default SimpleBarChart;
