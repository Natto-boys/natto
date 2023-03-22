"use client";
import { useState, Fragment, ChangeEvent } from "react";
import useWebSocket from 'react-use-websocket';
import { Cog6ToothIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { Title } from "@components/title";

import { ErrorMessage } from "@components/error";

export default function Home() {
  const [text, setText] = useState("");

  const [context, setContext] = useState("");
  const [messageOne, setMessageOne] = useState("");
  const [messageTwo, setMessageTwo] = useState("");
  const [messageThree, setMessageThree] = useState("");
  const [resOne, setResOne] = useState("");
  const [resTwo, setResTwo] = useState("");
  const [resThree, setResThree] = useState("");
  const [serverRes, setServerRes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [link, setLink] = useState("");

  const SOCKET_URL = 'wss://continuousgpt.fly.dev';

  const PLACEHOLDERS = [
    "Aziz's prompt",
    "B prompt",
    "C prompt"
  ]

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
    switch (data.streaming) {
      case "start":
        setServerRes("");
      case "streaming":
        const newRes = serverRes + data.text;
        setServerRes(newRes);
    }
    // if start, prepare new string
    // if streaming, append to new string
    // if stop, end it. (?)
  }

  const handlePlaceholder = () => {
    switch (context) {
      case "first":
        return PLACEHOLDERS[0];

      case "second":
        return PLACEHOLDERS[1];

      case "third":
        return PLACEHOLDERS[2];

    }

  }
  // TODO: Change prompt to match the structure of chatGPT
  
  const buildPrompt = () => {
    return (
      text + '\n'
      + "their first prompt: \n" + messageOne + 'my response: \n' + resOne + '\n' 
      + "their second prompt: \n" + messageTwo + 'my response: \n' + resTwo + '\n' 
      + "their third prompt: \n" + messageThree + 'my response: \n' + resThree + '\n' 
    );
  }

  const onSubmit = async () => {
      setError("");
      setLink("");
      setLoading(true);

      const reqBody = {
        event: "text",
        text: buildPrompt()
      }
      
      sendJsonMessage(reqBody);
  };

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setContext(e.target.value);
  
  }

  const isDisabled = () => {
    return loading || [
      messageOne.length,
      messageTwo.length, 
      messageThree.length,
      resOne.length,
      resTwo.length,
      resThree.length
    ].indexOf(0) != -1
  }

  return (
    <div className="container px-8 mx-auto mt-16 lg:mt-32 ">
      {error ? <ErrorMessage message={error} /> : null}

      {link ? (
        <div className="flex flex-col items-center justify-center w-full h-full mt-8 md:mt-16 xl:mt-32">
          <Title>Share this link with others</Title>
          <div className="relative flex items-stretch flex-grow mt-16 focus-within:z-10">
            <pre className="px-4 py-3 font-mono text-center bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
              {link}
            </pre>
            <button
              type="button"
              className="relative inline-flex items-center px-4 py-2 -ml-px space-x-2 text-sm font-medium duration-150 border text-zinc-700 border-zinc-300 rounded-r-md bg-zinc-50 hover focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 hover:text-zinc-900 hover:bg-white"
              onClick={() => {
                navigator.clipboard.writeText(link);
                setCopied(true);
              }}
            >
              {copied ? (
                <ClipboardDocumentCheckIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5" aria-hidden="true" />
              )}{" "}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      ) : (
        <form
          className="max-w-3xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.length <= 0) return;
            onSubmit();
          }}
        >
          <Title>Generate and Share</Title>
          <div>
            <label htmlFor="prompt" className="block mt-8 text-xs font-medium text-zinc-100">
              Select prompt
            </label>
            <select onChange={handleSelect} className="h-10 px-3 py-2 mt-2 overflow-hidden text-zinc-100 duration-150 bg-transparent border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0">
              <option value="first">Aziz Ansari</option>
              <option value="second">Second</option>
              <option value="third">Third</option>
            </select>
          </div>
          
          <pre className="px-4 py-3 mt-4 font-mono text-left bg-transparent border rounded border-zinc-600 focus:border-zinc-100/80 focus:ring-0 sm:text-sm text-zinc-100">
            <div className="flex items-start px-1 text-sm">
              <div aria-hidden="true" className="pr-4 font-mono border-r select-none border-zinc-300/5 text-zinc-700">
                {Array.from({
                  length: text.split("\n").length,
                }).map((_, index) => (
                  <Fragment key={index}>
                    {(index + 1).toString().padStart(2, "0")}
                    <br />
                  </Fragment>
                ))}
              </div>
              <textarea
                id="text"
                name="text"
                value={text}
                minLength={1}
                onChange={(e) => setText(e.target.value)}
                rows={Math.max(5, text.split("\n").length)}
                placeholder={handlePlaceholder()}
                className="w-full p-0 text-base bg-transparent border-0 appearance-none resize-none hover:resize text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
              />
            </div>
          </pre>
          <div className="flex flex-col items-center justify-center w-full gap-4 mt-4 sm:flex-row">
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0 ">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Their 1st prompt
              </label>
              <input
                type="text"
                name="prompt_1"
                id="prompt1"
                className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
                value={messageOne}
                onChange={(e) => setMessageOne(e.target.value)}
              />
            </div>
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0 ">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Their 1st response
              </label>
              <input
                type="text"
                name="prompt_2"
                id="prompt2"
                className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
                value={resOne}
                onChange={(e) => setResOne(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-full gap-4 mt-4 sm:flex-row">
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0 ">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Their 2nd prompt
              </label>
              <input
                type="text"
                name="prompt_1"
                id="prompt1"
                className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
                value={messageTwo}
                onChange={(e) => setMessageTwo(e.target.value)}
              />
            </div>
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0 ">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Their 2nd response
              </label>
              <input
                type="text"
                name="prompt_2"
                id="prompt2"
                className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
                value={resTwo}
                onChange={(e) => setResTwo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-full gap-4 mt-4 sm:flex-row">
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0 ">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Their 3rd prompt
              </label>
              <input
                type="text"
                name="prompt_1"
                id="prompt1"
                className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
                value={messageThree}
                onChange={(e) => setMessageThree(e.target.value)}
              />
            </div>
            <div className="w-full h-16 px-3 py-2 duration-150 border rounded sm:w-2/5 hover:border-zinc-100/80 border-zinc-600 focus-within:border-zinc-100/80 focus-within:ring-0 ">
              <label htmlFor="reads" className="block text-xs font-medium text-zinc-100">
                Their 3rd response
              </label>
              <input
                type="text"
                name="prompt_2"
                id="prompt2"
                className="w-full p-0 text-base bg-transparent border-0 appearance-none text-zinc-100 placeholder-zinc-500 focus:ring-0 sm:text-sm"
                value={resThree}
                onChange={(e) => setResThree(e.target.value)}
              />
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

          {serverRes ? <div className="duration-150 border rounded sm:w-2/5 border-zinc-100/80 focus:ring-0 sm:text-sm">
            {serverRes}
          </div> : <></>}

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
      )}
    </div>
  );
}
