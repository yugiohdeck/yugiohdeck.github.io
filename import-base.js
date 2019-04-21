let fileTransferHandlers = [];
let textTransferHandlers = [];
function RegisterFileTransferHandler(f) { fileTransferHandlers.push(f); }
function RegisterTextTransferHandler(f) { textTransferHandlers.push(f); }
let isImporting = false;
let attemptImport = function(handlers, data)
{
    if (IsImportInProgress())
        return;
    for (var i=0, n=handlers.length; i<n; ++i)
    {
        var ident = handlers[i](data);
        if (ident)
        {
            isImporting = true;
            var status = document.getElementById('import-status')
            status.innerText = ('Now importing: ' + ident);
            status.className = 'import-progress';
            return true;
        }
    }
    return false;
};
function AttemptFileImport(d) { return attemptImport(fileTransferHandlers, d); }
function AttemptTextImport(d) { return attemptImport(textTransferHandlers, d); }

function IsImportInProgress() { return isImporting; }

function ImportAborted()
{
    if (!IsImportInProgress())
        return;
    var status = document.getElementById('import-status')
    status.innerText = ('Import failed');
    status.className = 'import-error';
    window.setTimeout(ImportFinished, 2000);
}

function ImportFinished()
{
    if (!IsImportInProgress())
        return;
    var status = document.getElementById('import-status')
    status.innerText = '';
    status.className = '';
    isImporting = false;
}
