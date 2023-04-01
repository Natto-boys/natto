type ToastProps = {
    message: string;
    type?: ToastType;
    onClose: () => void;
}

export enum ToastType {
    INFO,
    SUCCESS,
    WARNING,
    ERROR
}

export const ToastMessage: React.FC<ToastProps> = ({ message, type, onClose }) => {

    const setAlert = () => {
        switch (type as ToastType) {
            case ToastType.INFO:
                return 'alert-info';
            case ToastType.SUCCESS:
                return 'alert-success';
            case ToastType.WARNING:
                return 'alert-warning';
            case ToastType.ERROR:
                return 'alert-error';
            default:
                return 'bg-zinc-200';
        }
    }

    const handleClose = () => {
        onClose();
    }

    return (
        <div className="toast toast-start transition ease-in-out">
            <div className={`alert ${setAlert()} flex flex-row`}>
                <div>
                    <span>{message}</span>
                </div>
                <div className="flex-none">
                    <button className="btn btn-sm btn-ghost" onClick={handleClose}>Close</button>
                </div>
            </div>
        </div>
    );
}