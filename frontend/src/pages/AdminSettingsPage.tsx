import { useDispatch, useSelector } from 'react-redux';
import AnimatedPage from '../components/AnimatedPage';
import type { RootState, AppDispatch } from '../store/store';
import { setShowImageCacheIndicator } from '../store/adminSettingsSlice';

export default function AdminSettingsPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { showImageCacheIndicator } = useSelector((state: RootState) => state.adminSettings);

    return (
        <AnimatedPage>
            <div className="page">

                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Administrator Settings</h1>
                </div>

                {/* UI Display section */}
                <div className="bg-surface-raised rounded-lg p-4 border border-border mb-4">
                    <h2 className="font-semibold mb-3">UI Display</h2>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="font-medium text-sm">Image cache source indicators</p>
                            <p className="text-sm text-text-muted">
                                A colored dot on each image shows whether it's served from the backend cache
                                (green) or a 3rd party CDN (orange). Only visible to administrators.
                            </p>
                        </div>
                        <button
                            onClick={() => dispatch(setShowImageCacheIndicator(!showImageCacheIndicator))}
                            className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                                showImageCacheIndicator
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {showImageCacheIndicator ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                </div>

            </div>
        </AnimatedPage>
    );
}
