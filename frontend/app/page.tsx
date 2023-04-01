"use client";
import { useState, useRef, useCallback } from "react";
import useWebSocket from 'react-use-websocket';
import { PencilIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import _ from 'lodash';

import { ErrorMessage } from "app/components/error";

export default function Home() {
  const [name, setName] = useState("Maria");
  const [text, setText] = useState("Do you agree or disagree that your mum should not take you on holiday to Napa 🙃");
  const [serverRes, setServerRes] = useState("");
  const resRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const SOCKET_URL = 'wss://natto-server.fly.dev/';

  const {
    sendMessage, 
    sendJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(SOCKET_URL, {
    onOpen: () => console.log("opened"),
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
        text: text
      }
      
      sendJsonMessage(reqBody);
  };

  const handleNameFocus = () => {
    if (nameRef.current) {
      nameRef.current.focus();
    } 
  }

  const handlePromptFocus = () => {
    if (promptRef.current) {
      promptRef.current.focus();
    } 
  }

  const isDisabled = () => {
    return loading || [
      text.length,
      name.length
    ].indexOf(0) != -1
  }

  return (
    <div>
      {error ? <ErrorMessage message={error} /> : <></>}
        <form
          className="max-w-sm mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.length <= 0) return;
            onSubmit();
          }}
        >
          
          <div className="flex items-center w-full h-16 py-2 bg-transparent justify-between focus-within:border-zinc-100/80 focus-within:ring-0">
            
            <input type="name" ref={nameRef} value={name} onChange={(e) => handleName(e.target.value)} className="duration-150 w-3/5 bg-transparent p-0 border-none text-zinc-900 focus:ring-0 text-2xl font-semibold" />
            <button type="button" onClick={handleNameFocus} className="p-2 rounded-md hover:bg-zinc-900/10">
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
            <div className="flex chat chat-start justify-between items-center px-1 text-sm">
              <textarea
                id="prompt"
                ref={promptRef}
                name="text"
                value={text}
                minLength={1}
                onChange={(e) => setText(e.target.value)}
                rows={Math.max(5, text.split("\n").length)}
                className="w-full chat-bubble bg-white font-serif bg-transparent border-0 appearance-none p-6 resize-none hover:resize text-zinc-900 placeholder-zinc-500 focus:ring-0 text-2xl"
              />
              <button type="button" onClick={handlePromptFocus} className="flex items-end p-2 rounded-md hover:bg-zinc-900/10">
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
            {serverRes ? 
            <div className="flex chat chat-end flex-col items-center justify-center w-full gap-4 mt-4 sm:flex-row">
                <div className="flex flex-row items-center chat-bubble duration-150 text-zinc-100 bg-violet-700 font-light focus:ring-0 text-lg">
                  {serverRes}
                  <button type="button" onClick={() => {navigator.clipboard.writeText(serverRes)}} className="flex items-end p-2 rounded-md hover:bg-zinc-900/10">
                    <DocumentDuplicateIcon className="w-5 h-5" />
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
        </form>
    </div>
  );
}
