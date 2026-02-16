"use client";

import Spline from '@splinetool/react-spline';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SplineSceneProps {
    scene: string;
    className?: string;
}

export default function SplineScene({ scene, className }: SplineSceneProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative w-full h-full ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-kodrix-purple dark:text-amber-500" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
                    </div>
                </div>
            )}
            <Spline
                scene={scene}
                onLoad={() => setIsLoading(false)}
                className="w-full h-full"
            />
        </div>
    );
}
