import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';

export default function MySettingsPage() {
    const navigate = useNavigate();

    return (
        <AnimatedPage>
            <div className="page">
                <h1 className="h1-styling">My Settings</h1>

                <button
                    className="btn btn-secondary w-fit"
                    onClick={() => navigate("/my-settings/theme")}
                >
                    Theme
                </button>
            </div>
        </AnimatedPage>
    );
}
