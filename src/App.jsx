import DocsGen from './DocsGen';

function App() {
  return (
    <div className='font-mono overflow-y-scroll no-scrollbar flex-col w-screen h-screen py-3 bg-slate-900'>
      <p className=' text-white hover:text-green-600 text-xl font-bold text-center'>
        ReactDocument
      </p>
      <p className='text-xs mx-[15vw] hover:text-green-600 text-white text-center py-1'>
        Note that lengthy code may take more time to generate documentation, so meaningful variable names are recommended. <br />
      </p>
      <p className='text-xs mx-[25vw] text-green-600 text-center py-1'>
        To get started, input the code you want documentation for in the code editor below.
      </p>
      <DocsGen />
      <div title="Go to site's Github" className='underline text-xs text-white hover:text-green-600 fixed bottom-2 right-2'>
        <a href="https://github.com/mehmet-f-dogan/react-document" target="_blank" rel="noopener noreferrer">Github</a>
      </div>

    </div>
  );
}


export default App;
