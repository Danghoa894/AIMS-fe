import {Card} from './ui/card';
import {Button} from './ui/button';
import { error } from 'console';
import { AlertCircle, ArrowLeft, Home, RefreshCw, XCircle } from 'lucide-react';

interface ErrorScreenProps {
    type?: 'error' | 'notFound' | 'network' | 'server';
    title?: string;
    message?: string;
    onRetry?: () => void;
    onGoBack?: () => void;
    onGoHome?: () => void;
    showActions?: boolean;
}

export function ErrorScreen({
    type = 'error',
    title,
    message,
    onRetry,
    onGoBack,
    onGoHome,
    showActions = true
}: ErrorScreenProps) {
    const errorConfig = {
        error: {
            icon: XCircle,
            defaultTitle: 'Something went wrong',
            defaultMessage: 'An unexpected error has occurred. Please try again later.',
            iconColor: 'text-red-600',
            bgColor: 'bg-red-50'
        },
        notFound: {
            icon: AlertCircle,
            defaultTitle: '404 - Not Found',
            defaultMessage: 'The page you are looking for does not exist.',
            iconColor: 'text-gray-600',
            bgColor: 'bg-gray-50',
        },
        network: {
            icon: XCircle,
            defaultTitle: 'Network Error',
            defaultMessage: 'Check your internet connection and try again.',
            iconColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        server: {
            icon: XCircle,
            defaultTitle: 'Server Error',
            defaultMessage: 'Unable to connect to the server. Try again!',
            iconColor: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    };

    const config = errorConfig[type];
    const Icon = config.icon;
    const displayTitle = title || config.defaultTitle;
    const displayMessage = message || config.defaultMessage;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Card className="max-w-md w-full p-8">

                //icon
                <div className={`${config.bgColor} rounded-full p-4`}>
                    <Icon className={`w-16 h-16 ${config.iconColor}`} />
                </div>

                //title
                <div>
                    <h2 className="text-gray-900 mb-2">
                        {displayTitle}
                    </h2>
                    <p className="text-gray-600">
                        {displayMessage}
                    </p>
                </div>

                //action buttons
                {showActions && (
                    <div className="flex flex-col w-full gap-3 pt-4">
                        {onRetry && (
                            <Button onClick= {onRetry}
                            className="w-full bg-teal-600 hover:bg-teal-700">
                                <RefreshCw className="w-4 h-4 mr-2">
                                    Try Again
                                </RefreshCw>
                            </Button>
                        )}

                        <div className="flex gap-3">
                            {onGoBack && (
                                <Button
                                onClick={onGoBack}
                                variant="outline"
                                className="flex-1">
                                    <ArrowLeft>
                                        Go Back
                                    </ArrowLeft>
                                </Button>
                            )}

                            {onGoHome && (
                                <Button className="flex-1"
                                onClick={onGoHome}
                                variant="outline">
                                    <Home className="w-4 h-4 mr-2">
                                        Home
                                    </Home>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}




export default ErrorScreen