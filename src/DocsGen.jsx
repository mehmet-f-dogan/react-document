import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { Prism as PrismSyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import classNames from 'classnames';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css'
import flourite from 'flourite';
import ChatGPT from './Components/ChatGPT'
import DownloadButton from './Components/DownloadButton';
import CopyButton from './Components/CopyButton';
import { languageToFileExtension, getFileExtension } from './Components/Data'

const currStatus = ['Generating', 'Generating.', 'Generating..', ' Generating...'];

function DocsGen() {

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const [value, setValue] = useState('');
  const [response, setResponse] = useState('Your altered code will appear here');
  const [status, setStatus] = useState('Generate Documentation');
  const [loading, isLoading] = useState(false);
  const [language, setLanguage] = useState("Unknown");
  const [fileExtension, setFileExt] = useState('.txt');
  const abortController = useRef(null);
  const chatbot = new ChatGPT();
  const accept = Object.values(languageToFileExtension).join(",");
  const [error, isError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [abortToast, setAbortToast] = useState(false);

  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
      }, 2200);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [showToast]);

  useEffect(() => {
    let timer;
    if (abortToast) {
      timer = setTimeout(() => {
        setAbortToast(false);
      }, 2200);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [abortToast]);

  useEffect(() => {
    clearAbortController();
  }, []);

  const clearAbortController = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
  };

  const handleAbort = () => {
    if (abortController.current) {
      abortController.current.abort();
      clearAbortController();
      setAbortToast(true);
    }
  };

  const buttonClass = classNames(
    'bg-gray-500',
    'w-[100vh]',
    'text-center',
    'h-[5vh]',
    'hover:bg-green-600',
    'rounded-md',
    {
      'text-black': (status === 'Generate Documentation'),
      'text-red-800 shake': (error && (status === 'Error, Click To Try Again' || status === 'Input Is Too Long, Click To Try Again')),
    }
  )

  let intervalId;
  var statusChange = 0;

  function statusUpdate() {
    if (statusChange === 0) {
      setStatus(currStatus[0]);
      statusChange++;
    } else if (statusChange === 1) {
      statusChange++;
      setStatus(currStatus[1]);
    } else if (statusChange === 2) {
      statusChange++;
      setStatus(currStatus[2]);
    } else {
      statusChange = 0;
      setStatus(currStatus[3]);
    }
  }

  function startInterval() {
    isLoading(true);
    intervalId = setInterval(statusUpdate, 300);
  }

  function stopInterval() {
    isLoading(false);
    clearInterval(intervalId);
  }

  function handleEditorChange(newValue) {
    setValue(newValue);
    detectLang(newValue);
  }

  function detectLang(value) {
    setLanguage(flourite(value).language);
    if (language !== "unknown") {
      setFileExt(getFileExtension(language));
    }
  }

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

  async function generateDocs() {
    setResponse('Your altered code will appear here');
    isError(false);
    const textIn = editorRef.current.getValue();
    if (loading) {
      setShowToast(true);
    } else {
      if (textIn.trim() !== '') {
        startInterval();
        await new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
        if (countTokens(textIn) < 2048) {
          const answer = await chatbot.ask("Properly format and add documentation/comments to this code (keep code under column 100): \n" + textIn, abortController.current);
          if (answer === "Error") {
            isError(true)
            stopInterval();
            setStatus("Error, Click To Try Again")
          } else {
            setResponse(answer);
            stopInterval();
            setStatus('Generate Documentation');
          }
        } else {
          isError(true)
          stopInterval();
          setStatus("Input Is Too Long, Click To Try Again");
        }
      }
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      handleEditorChange(event.target.result);
      setValue(event.target.result);
      setResponse("Your altered code will appear here");
    };
    reader.readAsText(file);
  };

  function countTokens(text) {
    const tokenRegExp = /[^\s]+/g;
    const tokens = text.match(tokenRegExp);
    return tokens ? tokens.length : 0;
  }

  function clearButtonClick() {
    setResponse('Your altered code will appear here');
    setValue('');
    setStatus('Generate Documentation');
    setLanguage("Unknown");
    fileInputRef.current.value = null;
  };

  return (
    <>
      <p className='-py-2 text-xs hover:text-green-600 text-white text-center'>
        Programming Language Detected: {language}
      </p>
      <div className="flex-col w-[100vh] mx-auto py-5 space-y-2">
        <Tooltip
          title={"Can't upload files during generation"}
          disabled={!loading}
          duration={200}
        >
          <input
            title="Upload files"
            className="m-0 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] text-base font-normal text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-green-600 focus:border-primary focus:text-neutral-700 focus:shadow-te-primary focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-gray-500 dark:file:text-neutral-100 dark:focus:border-primary"
            type="file"
            onChange={handleFileSelect}
            disabled={loading}
            ref={fileInputRef}
            accept={accept}
          />
        </Tooltip>
        <Editor
          theme='vs-dark'
          title="Input Editor"
          language={(language === "C++") ? "cpp" : (language === "C#") ? "csharp" : language.toLowerCase()}
          onMount={handleEditorDidMount}
          value={value}
          onChange={handleEditorChange}
          className='h-[30vh] rounded-md'
          options={{ domReadOnly: loading, readOnly: loading }}
        />
        <button
          onClick={() => generateDocs()}
          title='Generate Documentation'
          className={buttonClass}
        >
          {status}
        </button>
        <PrismSyntaxHighlighter
          title="Output Editor"
          language={response !== 'Your altered code will appear here' ? ((language === "C++") ? "cpp" : (language === "C#") ? "csharp" : language.toLowerCase()) : null}
          style={vscDarkPlus}
          className="h-[30vh] overflow-y-scroll no-scrollbar rounded-md"
        >
          {response}
        </PrismSyntaxHighlighter>
        <div className='flex-row space-x-2'>
          {(!loading && value || (response !== 'Your altered code will appear here')) ? (
            <button
              title="Clear"
              onClick={clearButtonClick}
              className='text-xs bg-gray-500 w-[20vh] h-[4vh] hover:bg-green-600 rounded-md'
            >
              Clear
            </button>
          ) : null}
          <CopyButton content={response} response={response} loading={loading} />
          <DownloadButton content={response} fileType={fileExtension} response={response} loading={loading} />
          {loading ? (
            <button
              title='Abort generation'
              className='text-xs bg-gray-500 w-[20vh] h-[4vh] hover:bg-red-600 rounded-md'
              onClick={handleAbort}
            >
              Cancel
            </button>
          ) : null}
        </div>
        <div className='fixed justify-end right-2 top-2'>
          {showToast &&
            <div
              className={`w-auto bg-red-600 text-xs text-white px-4 justify-right py-2 rounded-md top-2 right-2 mt-2 mr-2 fade-in-out`}
            >
              Generator is already running
            </div>
          }
          {abortToast &&
            <div
              className={`bg-green-600 w-auto text-xs text-white justify-right px-4 py-2 rounded-md top-2 right-2 mt-2 mr-2 fade-in-out`}
            >
              Abort Success
            </div>
          }
        </div>
      </div>
    </>
  )
};

export default DocsGen;
