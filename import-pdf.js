let addScript = function(path)
{
    var script = document.createElement('script');
    script.async = false;
    script.type = 'text/javascript';
    script.src = path;
    var p = new Promise((res) => script.addEventListener('load',res));
    document.head.appendChild(script);
    return p;
}

let doImportPDF = async function()
{
    if (!window.pdfjsLib)
    {
        await addScript('include/pdf.js');
        //addScript('include/pdf.worker.js');
    }
    const PDFJS = window.pdfjsLib;
    PDFJS.GlobalWorkerOptions.workerSrc = 'include/pdf.worker.js';
    const d = await PDFJS.getDocument(this.result).promise;
    const p = await d.getPage(1);
    console.log(d);
    console.log(p);
    console.log(await d.getDestinations());
    console.log(await p.getAnnotations());
};

RegisterFileTransferHandler(function(file)
{
    if (!file.name.endsWith('.pdf'))
        return;
    var reader = new FileReader();
    reader.fileName = file.name;
    reader.addEventListener('load',doImportPDF);
    reader.readAsArrayBuffer(file);
    return 'PDF decklist';
});