import { useState, useRef, ChangeEvent } from "react";
import cn from "classnames";
import { useOnClickOutside } from "usehooks-ts";

type ImageUploadProps = {
    onUpload: (file: string) => void
    onError: (err: string) => void
    isOpen: boolean
    onClose(): void
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, onError, isOpen, onClose }) => {
    const [file, setFile] = useState<string>("");
    const ref = useRef(null);
    useOnClickOutside(ref, () => {
          onClose();
      });

    const modalClass = cn({
        "modal modal-bottom sm:modal-middle": true,
        "modal-open": isOpen,
      });

    const handleUpload = () => {
        onUpload(file);
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file[0]);
            reader.onload = () => {
                console.log('file: ', reader.result);
                if (typeof reader.result === 'string') {
                    setFile(reader.result);
                }
            }
            reader.onerror = (err) => {
                onError("There's something wrong with the file upload. Please try again.");
            }
        }
    }
    
    return (
        <div className={modalClass}>
            <div className="modal-box" ref={ref}>
                <h3 className="font-bold text-lg">Screenshot upload</h3>
                <p className="py-4">We&apos;ll extract prompts from your screenshot, and will not keep your image beyond your current session.</p>
                <input type="file" accept="image/png, image/jpeg" className="file-input file-input-bordered w-full max-w-xs" onChange={(e) => handleChange(e)} />
                <div className="modal-action">
                    <button className="btn" onClick={handleUpload}>Upload</button>
                </div>
            </div>
        </div>
    )
} 