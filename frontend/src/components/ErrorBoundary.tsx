import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback: ReactNode;
    label: string;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error(`[${this.props.label}] error — falling back:`, error);
    }

    render() {

        // If there is an error, render the fallback instead of the HTML objects within it.
        // For Example:
        /*
         <ErrorBoundary
             label="Preventing Errors"
             fallback={<div>Yes Error</div>}
         >
             <div>No Error.</div>
         </ErrorBoundary>
        */

        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}
