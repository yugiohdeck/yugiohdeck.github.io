(()=>{

const importDeckTo = ((target, data) =>
{
    data = atob(data);
    if ((data.length % 4) !== 0)
        throw 'Invalid data length, expected multiple of 4';
    let lastId = null;
    let num;
    for (let i=0, n=data.length; i<n; i += 4)
    {
        const id = (
          (data.charCodeAt(i+0) <<  0) |
          (data.charCodeAt(i+1) <<  8) |
          (data.charCodeAt(i+2) << 16) |
          (data.charCodeAt(i+3) << 24));
        
        if ((id === lastId) && (num < 3))
        {
            ++num;
            continue;
        }
        
        if (lastId)
            target.push([lastId, num]);
        
        lastId = id;
        num = 1;
    }
    
    if (lastId)
        target.push([lastId, num]);
});

const doImportYDKE = ((ydke) =>
{
    const datas = ydke.substring(7).split('!');
    const main = [];
    const extra = [];
    const side = [];
    
    try
    {
        if (datas.length >= 1)
            importDeckTo(main, datas[0]);
        if (datas.length >= 2)
            importDeckTo(extra, datas[1]);
        if (datas.length >= 3)
            importDeckTo(side, datas[2]);
    } catch (e) {
        console.error(e);
        console.error(datas);
        ImportAborted();
        return;
    }
    
    SetDeckData(main, extra, side, 'YDKe import');
    ImportFinished();
});

RegisterTextTransferHandler(function(ydke)
{
    if (!ydke.startsWith('ydke://'))
        return;
    setTimeout(doImportYDKE, 0, ydke);
    return 'YDKe data';
});

})();
