// API gracefully provided by ygoprodeck.com

// Rate limit is 20 requests per 1 second
// We send at most one request every 100ms to be safe
const REQUEST_THROTTLE_DATA = 100;

let _cardDataCache = {};
let _cardDataRequests = [];
let _cardDataCallbacks = {};
let _cardDataLastRequest = null;

function RequestCardData(id, callback, ctx)
{
    if (id in _cardDataCache)
    {
        if (_cardDataCache[id] !== null)
        {
            if (callback)
                callback.call(ctx, _cardDataCache[id]);
            return;
        }
    }
    if (!(id in _cardDataCallbacks))
    {
        _cardDataRequests.push(id);
        _cardDataCallbacks[id] = [];
    }
    
    if (callback)
        _cardDataCallbacks[id].push([callback,ctx]);
    
    _cardDataLastRequest = id;
}

let _allCardDataCallbacks = [];
let AddAllCardData = function(data, tag)
{
    var container = document.getElementById(tag + '-deck-container');
    var list = data[tag];
    for (var i=0; i<container.children.length; ++i)
    {
        var card = container.children[i];
        var id = card.cardId;
        var cardData = null;
        if (id in _cardDataCache)
            cardData = _cardDataCache[id];
        if (cardData !== null)
        {
            if (data.success)
                data[tag].push([card, cardData]);
        }
        else
        {
            RequestCardData(id);
            data.success = false;
        }
    }
};
function RequestAllCardData(callback, ctx)
{
    var data = { success: true, main: [], extra: [], side: [] };
    AddAllCardData(data, 'main');
    AddAllCardData(data, 'extra');
    AddAllCardData(data, 'side');
    
    if (data.success)
    {
        if (callback)
            callback.call(ctx, data);
    }
    else if (callback)
        _allCardDataCallbacks.push([callback,ctx]);
}

let processCardData = function(id, data)
{
    if (data.id)
        data.id = parseInt(data.id);
    else
        data.id = id;
    
    if (data.status)
    {
        if (data.card_prices && data.card_prices[0])
            for (const key in data.card_prices[0])
                data.card_prices[0][key] = parseFloat(data.card_prices[0][key]);

        _cardDataCache[id] = data;
    }
    
    var callbacks = _cardDataCallbacks[id];
    for (var i=0; i<callbacks.length; ++i)
        callbacks[i][0].call(callbacks[i][1], data);
    delete _cardDataCallbacks[id];
    
    if (_allCardDataCallbacks.length && !Object.keys(_cardDataCallbacks).length)
    {
        var allData = { success: true, main: [], extra: [], side: [] };
        AddAllCardData(allData, 'main');
        AddAllCardData(allData, 'extra');
        AddAllCardData(allData, 'side');
        if (!allData.success)
            return;
        while (_allCardDataCallbacks.length)
        {
            var f = _allCardDataCallbacks.pop();
            f[0].call(f[1],allData);
        }
    }
};

let cardDataSuccess = function()
{
    var response;
    if (this.status < 200 || this.status >= 300)
        response = { status: false, message: this.status + ' ' + this.statusText };
    else try
    {
        response = JSON.parse(this.responseText);
        if (response.error)
            response = { status: false, message: response.error };
        else
        {
            response = response.data[0];
            response.status = true;
        }
        if (!response.status)
            console.error("Price API failed", this);
    }
    catch (e)
    {
        response = { status: false, message: "Invalid response" };
        console.error("Price API parsing failed", e);
    }
    
    processCardData(this.cardId, response);
};

let cardDataFailed = function()
{
    var resp = { status: false, message: "XHR failed" };
    console.error("Data API failed", this);
    processCardData(this.cardId, response);
};

window.setInterval(function()
{
    var id = null;
    if (_cardDataLastRequest)
    {
        id = _cardDataLastRequest;
        _cardDataLastRequest = null;
    }
    else
        while (!id)
        {
            if (!_cardDataRequests.length)
                return;
            id = _cardDataRequests.pop();
            if (id in _cardDataCache)
                id = null;
        }
    
    _cardDataCache[id] = null;
    
    var request = new XMLHttpRequest();
    request.addEventListener("load", cardDataSuccess);
    request.addEventListener("error", cardDataFailed);
    request.open("GET", "https://db.ygoprodeck.com/api/v7/cardinfo.php?id=" + id + "&misc=yes&urls", true);
    request.cardId = id;
    request.send();
    
}, REQUEST_THROTTLE_DATA);
