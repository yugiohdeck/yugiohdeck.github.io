let doImportYDK = function()
{
    var lines = this.result.split(/[\r\n]+/);
    var main = [];
    var extra = [];
    var side = [];
    
    var deck = null;
    var lastId = null;
    var num;
    for (var i=0; i<lines.length; ++i)
    {
        var line = lines[i].trim();
        if ((line === lastId) && (num < 3))
        {
            ++num;
            continue;
        }
        
        if (deck && lastId)
        {
            var pair = [+lastId, num];
            if (deck === 'main')
                main.push(pair);
            else if (deck === 'extra')
                extra.push(pair);
            else if (deck === 'side')
                side.push(pair);
            lastId = null;
        }
        
        if (line === '#main')
            deck = 'main';
        else if (line === '#extra')
            deck = 'extra';
        else if (line === '!side')
            deck = 'side';
        else if (/^\d+$/.test(line))
        {
            lastId = line;
            num = 1;
        }
        else if (line.length && !line.startsWith('#'))
        {
            console.log('Import aborted, invalid line:\n\''+line+'\'');
            ImportAborted();
            return;
        }
    }
    if (deck && lastId)
    {
        var pair = [+lastId, num];
        if (deck === 'main')
            main.push(pair);
        else if (deck === 'extra')
            extra.push(pair);
        else if (deck === 'side')
            side.push(pair);
        lastId = null;
    }
    
    let fileName = this.fileName;
    if (fileName.endsWith('.ydk'))
        fileName = fileName.substr(0,fileName.length - 4);
    SetDeckData(main, extra, side, fileName);
    ImportFinished();
};

RegisterFileTransferHandler(function(ydkFile)
{
    var reader = new FileReader();
    reader.fileName = ydkFile.name;
    reader.addEventListener('load',doImportYDK);
    reader.readAsText(ydkFile);
    return 'YDK file';
});
