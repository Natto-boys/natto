"use client";
import { useState, Fragment, ChangeEvent } from "react";
import useWebSocket from 'react-use-websocket';
import { Cog6ToothIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { Title } from "@components/title";

import { ErrorMessage } from "@components/error";

export default function Home() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [serverRes, setServerRes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [link, setLink] = useState("");

  const SOCKET_URL = 'wss://8c1c-62-244-186-53.eu.ngrok.io/';

  const PLACEHOLDER_PROMPT = ""

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
    console.log(data);
    if (data.error) {
      setError(data.error);
      return;
    }

    switch (data.stream) {
      case "start":
        setServerRes("");
      case "streaming":
        const newRes = serverRes + data.text;
        setServerRes(newRes);
      case "stop":
        setLoading(false);
    }
  }

  const handleName = (name: string) => {
    setName(name);
  }

  // TODO: Change prompt to match the structure of chatGPT

  const onSubmit = async () => {
      setError("");
      setLink("");
      setServerRes("");
      setLoading(true);

      const reqBody = {
        event: "text",
        name: name,
        text: text
      }
      
      sendJsonMessage(reqBody);
  };

  const isDisabled = () => {
    return loading || [
      text.length,
      name.length
    ].indexOf(0) != -1
  }

  return (
    <div>
        <form
          className="max-w-3xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.length <= 0) return;
            onSubmit();
          }}
        >
          <Title>Generate and Share</Title>
          
          <div className="w-full h-16 mt-8 px-3 py-2 bg-transparent duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0">
            <label htmlFor="prompt" className="block text-xs font-medium text-zinc-100">
              Name
            </label>
            <input type="text" onChange={(e) => handleName(e.target.value)} className="duration-150 bg-transparent border-none text-zinc-100 focus:ring-0 sm:text-sm" />
          </div>
          <pre className="px-4 py-3 mt-4 font-mono text-left bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
            <div className="flex items-start px-1 text-sm">
              <textarea
                id="text"
                name="text"
                value={text}
                minLength={1}
                onChange={(e) => setText(e.target.value)}
                rows={Math.max(5, text.split("\n").length)}
                placeholder={PLACEHOLDER_PROMPT}
                className="w-full p-0 text-base bg-transparent border-0 appearance-none resize-none hover:resize text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
              />
            </div>
          </pre>
          <div className="flex flex-col items-center justify-center w-full gap-4 mt-4 sm:flex-row">
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Response
              </label>
              {serverRes ? <div className="duration-150 border rounded text-zinc-100 border-zinc-100/80 focus:ring-0 sm:text-sm">
              {serverRes}
              </div> : <></>}
            </div>
          </div>
          <button
            type="submit"
            disabled={isDisabled()}
            className={`mt-6 w-full h-12 inline-flex justify-center items-center  transition-all  rounded px-4 py-1.5 md:py-2 text-base font-semibold leading-7    bg-zinc-200 ring-1 ring-transparent duration-150   ${
              isDisabled()
                ? "text-zinc-400 cursor-not-allowed"
                : "text-zinc-900 hover:text-zinc-100 hover:ring-zinc-600/80  hover:bg-zinc-900/20"
            } ${loading ? "animate-pulse" : ""}`}
          >
            <span>{loading ? <Cog6ToothIcon className="w-5 h-5 animate-spin" /> : "Generate"}</span>
          </button>

          <div className="mt-8">
            <ul className="space-y-2 text-xs text-zinc-500">
              <li>
                <p>
                  <span className="font-semibold text-zinc-400">Reads:</span> The number of reads determines how often
                  the data can be shared, before it deletes itself. 0 means unlimited.
                </p>
              </li>
              <li>
                <p>
                  <span className="font-semibold text-zinc-400">TTL:</span> You can add a TTL (time to live) to the
                  data, to automatically delete it after a certain amount of time. 0 means no TTL.
                </p>
              </li>
              <p>
                Clicking Share will generate a new symmetrical key and encrypt your data before sending only the
                encrypted data to the server.
              </p>
            </ul>
          </div>
        </form>
    </div>
  );
}
