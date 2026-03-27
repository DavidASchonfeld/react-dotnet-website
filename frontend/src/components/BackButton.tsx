import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    onClick?: () => void;
    label?: string;
}

export default function BackButton({ onClick, label = '← Back' }: BackButtonProps) {
    const navigate = useNavigate();
    return (
        <button
            className="btn btn-secondary w-fit"
            onClick={onClick ?? (() => navigate(-1))}
        >
            {label}
        </button>
    );
}
