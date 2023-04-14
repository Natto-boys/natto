"use client";
import { useState, useRef, useCallback, ChangeEvent } from "react";
import useWebSocket from 'react-use-websocket';
import { PencilIcon, DocumentDuplicateIcon, PhotoIcon } from "@heroicons/react/24/outline";
import _ from 'lodash';

import { ToastType, ToastMessage } from "app/components/toast";

export default function Home() {
  const [name, setName] = useState("Maria");
  const [promptHead, setPromptHead] = useState("Do you agree or disagree that");
  const [text, setText] = useState("Your mum should not take you on holiday to Napa 🙃");
  const [toastContent, setToastContent] = useState<Object[]>([]);
  const [ex1Selected, setEx1Selected] = useState(false);
  const [ex2Selected, setEx2Selected] = useState(false);
  const [ex3Selected, setEx3Selected] = useState(false);
  const [serverRes, setServerRes] = useState("");
  const [isCopy, setIsCopy]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpload, setIsUpload] = useState(false);
  const [error, setError] = useState("");

  const resRef = useRef("");
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const promptHeadRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  
  const SOCKET_URL = 'wss://natto-backend-prod.fly.dev/';
  const COPY_CLIPBOARD = "Copied to clipboard.";

  const {
    sendMessage, 
    sendJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(SOCKET_URL, {
    onOpen: () => {
      console.log("opened");
      setIsUpload(false)
    },
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    /*
    attemptNumber will be 0 the first time it attempts to reconnect, so this equation results in a reconnect pattern of 1 second, 2 seconds, 4 seconds, 8 seconds, and then caps at 10 seconds until the maximum number of attempts is reached
    */
    reconnectInterval: (attemptNumber) =>
      Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
    share: true,
    onMessage: (messageEvent) => recvMessage(messageEvent),
    onError: (errorEvent) => setError("There's a problem with the connection.")
  });

  const recvMessage = (dataFromServer: MessageEvent<any>) => {
    let data = JSON.parse(dataFromServer.data)
    if (data.error) {
      setError(data.error);
      return;
    }

    switch (data.event) {
      case "text":  
        handleChatText(data);
        break;
      case "image":
        console.log("Receiving OCR text...")
        setServerRes("");
        setName(data.name);
        setPromptHead(data.prompt);
        setText(data.response);
        setIsUpload(false);
        break;
    }
  }

  const handleChatText = (data: any) => {
    switch (data.stream) {
      case "start":
        setServerRes("");
        resRef.current = '';

      case "streaming":
        const current = resRef.current;
        resRef.current = current + data.text;
        debounceServerRes(serverRes + resRef.current);

      case "stop":
        setLoading(false);
    }
  }

  const updateServerRes = (text: string) => {
    setServerRes(text);
    resRef.current = "";
  }

  const debounceServerRes = useCallback(_.debounce(updateServerRes, 10), []);

  const handleName = (name: string) => {
    setName(name);
  }

  const onSubmit = async () => {
      setError("");
      setServerRes("");
      setLoading(true);

      const reqBody = {
        event: "text",
        name: name,
        text: promptHead + " " + text
      }
      
      sendJsonMessage(reqBody);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            console.log('file: ', reader.result);
            if (typeof reader.result === 'string') {
                handleUpload(reader.result);
                setName("");
                setIsUpload(true);
            }
        }
        reader.onerror = (err) => {
            setError("There's something wrong with the file upload. Please try again.");
        }
    }
  }

  const handleUpload = (bytestr: string) => {
      const regex = /^data:image\/png;base64,|data:image\/jpeg;base64,/;
      const result = bytestr.replace(regex, '');

      const reqBody = {
        event: "image",
        content: result
      }
      console.log("sending image...");
      sendJsonMessage(reqBody);
      
  }

  const handleNameFocus = () => {
    if (nameRef.current) {
      nameRef.current.focus();
      nameRef.current.setSelectionRange(
        nameRef.current.value.length,
        nameRef.current.value.length
      );
    } 
  }

  const handlePromptHead = (text: string) => {
    setPromptHead(text);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(serverRes);
    setIsCopy(true);
    _.delay(setIsCopy, 2000, false);
  }

  const handlePromptFocus = () => {
    if (promptHeadRef.current) {
      promptHeadRef.current.focus();
      promptHeadRef.current.setSelectionRange(
        promptHeadRef.current.value.length,
        promptHeadRef.current.value.length
      );
    } 
  }

  const handleImageFocus = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
    
  }

  const handleExample = (num: number) => {
    switch (num) {
      case 1:
        setName("Rachel");
        setPromptHead("My best Dad Joke");
        setText("What do you call a Russian with 3 testicles? ........Hudyanick Abolockov!!!!!!!!!!!");
        break;
      case 2:
        setName("Maxime");
        setPromptHead("Dating me is like");
        setText("Cracking your back");
        break;
      case 3:
        setName("Sammy");
        setPromptHead("Best travel story");
        setText("missed my flight to mykonos form grabbing a breakfast burrito");
        break;
    }
  }

  const loadingClassname = isUpload ? "loading" : "";

  const isDisabled = () => {
    return loading || [
      text.length,
      name.length
    ].indexOf(0) != -1
  }

  return (
    <div>
      {error ? <ToastMessage message={error} type={ToastType.ERROR} onClose={() => setError("")} /> : <></>}
      {isCopy ? <ToastMessage message={COPY_CLIPBOARD} onClose={() => setIsCopy(false)} /> : <></>}
      {/* <ImageUpload onUpload={handleUpload} onError={(err) => setError(err)} isOpen={isUpload} onClose={handleCloseUpload} /> */}
        <form
          className="max-w-sm mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.length <= 0) return;
            onSubmit();
          }}
        >
          <div className="flex flex-col">
                <button type="button" id="screenshot" onClick={handleImageFocus} className={`flex items-center justify-center rounded-full w-4/5 mb-4 h-8 self-center text-lg bg-violet-600 text-white hover:bg-violet-900/30 ${loadingClassname}`}>
                  Upload screenshot
                  <div className="pl-2"> 
                    <span className="badge badge-accent badge-outline badge-xs">BETA</span>
                  </div>
                </button>
                <div className="flex w-4/5 items-center justify-end self-center mb-2">
                  <div className="pr-2">
                    <p className="flex text-center text-md w-full text-zinc-700">Examples</p>
                  </div>
                  <div className="btn-group">
                    <input type="radio" name="options" data-title="1" id="example" onChange={() => handleExample(1)} className="btn btn-sm w-12" />
                    <input type="radio" name="options" data-title="2" id="example" onChange={() => handleExample(2)} className="btn btn-sm w-12" />
                    <input type="radio" name="options" data-title="3" id="example" onChange={() => handleExample(3)} className="btn btn-sm w-12" />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleChange(e)} />
                <p className="flex text-center horizontal-line text-sm w-full text-zinc-700">OR</p>
                <div className="flex items-center w-full h-16 py-2 px-1 bg-transparent justify-between focus-within:border-zinc-100/80 focus-within:ring-0">
              <div className="flex justify-between w-full" id="nameDiv">
                <input type="name" ref={nameRef} value={name} onChange={(e) => handleName(e.target.value)} className="duration-150 w-3/5 pl-2 bg-transparent border-none text-zinc-900 focus:ring-0 text-2xl font-semibold" />
                <button type="button" id="nameEdit" onClick={handleNameFocus} className="flex items-center p-2 rounded-md hover:bg-zinc-900/10">
                  <PencilIcon id="nameEditIcon" className="w-5 h-5" />
                </button>
              </div>
              
            </div>
              <div className="flex chat chat-start justify-between items-center px-1 text-sm">
                <div className="flex gap-2 flex-col justify-end">
                  {isUpload ? 
                  <div className="chat-bubble mt-6 w-3/8 inline-flex justify-center items-center bg-white">
                    <div className="loader-dark" />
                  </div> : 
                  <div className="chat-bubble bg-white">
                    <div className="w-full pl-3 pt-4" id="promptHead">
                      <textarea 
                      ref={promptHeadRef} 
                      id="promptHeadInput" 
                      value={promptHead} 
                      onChange={(e) => handlePromptHead(e.target.value)} 
                      minLength={1}
                      cols={40}
                      rows={Math.max(2, promptHead.split("\n").length)}
                      className="duration-150 w-full bg-transparent border-none text-zinc-900 focus:ring-0 text-md font-bold" />
                    </div>
                    <textarea
                      id="prompt"
                      ref={promptRef}
                      name="text"
                      value={text}
                      cols={40}
                      minLength={1}
                      onChange={(e) => setText(e.target.value)}
                      rows={Math.max(5, text.split("\n").length)}
                      className="w-full font-serif bg-transparent border-0 appearance-none pb-6 pt-2 pl-6 pr-6 resize-none hover:resize text-zinc-900 placeholder-zinc-500 focus:ring-0 text-2xl"
                    />
                  </div>
                    }
                </div>
                
                <div className="flex flex-col gap-4">
                  <button type="button" id="promptEdit" onClick={handlePromptFocus} className="flex items-end p-2 rounded-md hover:bg-zinc-900/10">
                    <PencilIcon id="promptEditIcon" className="w-5 h-5" />
                  </button>
                </div>
                
              </div>
              {serverRes ? 
              <div className="flex chat chat-end flex-col items-center justify-center w-full gap-4 mt-4 sm:flex-row">
                  <div className="flex flex-row items-center chat-bubble duration-150 text-zinc-100 bg-violet-700 font-light focus:ring-0 text-lg">
                    {serverRes}
                    <button type="button" id="copyResponse" onClick={handleCopy} className="flex items-end p-2 rounded-md hover:bg-zinc-900/10">
                      <DocumentDuplicateIcon id="copyResponseIcon" className="w-5 h-5" />
                    </button>
                  </div>
                  
              </div> : <></>}
              <div className="chat chat-end">
                {loading ? 
                <div className="w-3/8 chat-bubble mt-6 w-3/8 inline-flex justify-center items-center bg-violet-700">
                  <div className="loader" />
                  </div> :
                  <button
                    type="submit"
                    disabled={isDisabled()}
                    className={`mt-6 w-3/8 h-12 inline-flex justify-center items-center transition-all rounded-full px-4 py-1.5 md:py-2 text-base font-semibold leading-7 bg-zinc-200 ring-1 ring-transparent duration-150   ${
                      isDisabled()
                        ? "text-zinc-400 cursor-not-allowed"
                        : "text-zinc-900 hover:text-zinc-100  hover:bg-zinc-900/40"
                    }`}
                  >
                    <span>Generate</span>
                  </button>
                }
              </div>

            <div className="mt-8">
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>
                  <p>
                    <span className="font-semibold text-zinc-400">Your data:</span> We don't store anything you write. <a href="https://openai.com/policies/api-data-usage-policies">We do send data to Open AI.</a>
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </form>
    </div>
  );
}
