function DuelingbookFailed()
{
    console.error("Duelingbook API failed", this);
    ImportAborted();
}

function ConvertDuelingbookDeck(data)
{
    var deck = [];
    var last = null;
    var num = 0;
    for (var i=0, n=data.length; i<=n; ++i)
    {
        var card = (i<n) ? data[i].serial_number : null;
        if ((card === last) && (num < 3))
        {
            ++num;
            continue;
        }
        deck.push([+last, num]);
        last = card;
        num = 1;
    }
    return deck;
}

function ProcessDuelingbookData(data)
{
    try
    {
        var data = JSON.parse(this.responseText);
        if (data.action !== "Success")
            throw ('Reported status: ' + data.action);
        var main = ConvertDuelingbookDeck(data.main);
        var extra = ConvertDuelingbookDeck(data.extra);
        var side = ConvertDuelingbookDeck(data.side);
        SetDeckData(main, extra, side, data.name);
        ImportFinished();
    } catch (e) {
        console.error(e);
        DuelingbookFailed.call(this);
        return;
    }
}

RegisterTextTransferHandler(function(url)
{
    var match = url.match(/duelingbook\.com\/deck\?id=(\d+)/);
    if (!match)
        return null;
    var id = +match[1];
    if (!id)
        return null;
    var request = new XMLHttpRequest();
    request.addEventListener("load", ProcessDuelingbookData);
    request.addEventListener("error", DuelingbookFailed);
    request.open("POST", "https://www.duelingbook.com/php-scripts/load-deck.php");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("id=" + id);
    return 'Duelingbook deck #'+id;
});
