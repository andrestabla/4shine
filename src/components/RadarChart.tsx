'use client';

import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface RadarChartProps {
    mini?: boolean;
}

export default function RadarChart({ mini = false }: RadarChartProps) {
    const data = {
        labels: ['Shine Within', 'Shine Out', 'Shine Up', 'Shine Beyond'],
        datasets: [
            {
                label: 'Tu Resultado',
                data: [75, 50, 85, 60],
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                borderColor: '#d4af37',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#d4af37',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#d4af37',
                fill: true,
            },
            {
                label: 'Ideal',
                data: [90, 90, 90, 90], // Target ideal
                backgroundColor: 'transparent',
                borderColor: '#94a3b8',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            },
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: mini ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                },
                grid: {
                    color: mini ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
                },
                ticks: {
                    display: !mini,
                    backdropColor: 'transparent',
                },
                pointLabels: {
                    font: {
                        size: mini ? 10 : 12,
                        weight: 'bold' as const,
                    },
                    color: '#64748b',
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
        plugins: {
            legend: {
                display: !mini,
                position: 'bottom' as const,
            },
        },
        maintainAspectRatio: false,
    };

    return <Radar data={data} options={options} />;
}
