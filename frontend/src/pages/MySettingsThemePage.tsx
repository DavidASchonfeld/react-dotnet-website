import AnimatedPage from '../components/AnimatedPage';
import { ThemePicker } from '../components/ThemePicker';

export default function MySettingsThemePage() {
    return (
        <AnimatedPage>
            <div className="page">
                <h1 className="h1-styling">Theme</h1>

                <ThemePicker />
            </div>
        </AnimatedPage>
    );
}
