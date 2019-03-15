// API gracefully provided by yugiohprices.com

// Rate limit is currently unknown
// We send at most one request every 100ms
const REQUEST_THROTTLE_PRICE = 100;

let _cardPriceCache = {};
let _cardPriceRequests = [];
let _cardPriceCallbacks = {};

function RequestCardPrice(name, callback, ctx)
{
    if (name in _cardPriceCache)
    {
        if (_cardPriceCache[name].status)
        {
            if (callback)
                callback.call(ctx, _cardPriceCache[name]);
            return;
        }
    }
    if (!(name in _cardPriceCallbacks))
    {
        _cardPriceRequests.push(name)
        _cardPriceCallbacks[name] = [];
    }
    
    if (callback)
        _cardPriceCallbacks[name].push([callback, ctx]);
}

function CardPriceSuccess()
{
    var response;
    if (this.status < 200 || this.status >= 300)
        response = { status: false, message: this.status + ' ' + this.statusText };
    else try {
        response = JSON.parse(this.responseText);
        response.status = (response.status === "success");
        if (!response.status)
            console.error("Price API failed", this);
    } catch (e) {
        response = { status: false, message: "Invalid response" };
        console.error("Price API parsing failed", e);
    }
    
    ProcessCardPrice(this.cardName, response);
}

function CardPriceFailed()
{
    var resp = { status: false, message: "XHR failed" };
    console.error("Price API request failed", this);
    ProcessCardPrice(this.cardName, resp);
}

function ProcessCardPrice(name, data)
{
    data.name = name;
    var callbacks = _cardPriceCallbacks[name];
    for (var i=0; i<callbacks.length; ++i)
        callbacks[i][0].call(callbacks[i][1], data);
    delete _cardPriceCallbacks[name];
}

window.setInterval(function()
{
    if (!_cardPriceRequests.length)
        return;
    
    var name = _cardPriceRequests.pop();
    var request = new XMLHttpRequest();
    request.addEventListener("load", CardPriceSuccess);
    request.addEventListener("error", CardPriceFailed);
    request.open("GET", "https://cors-anywhere.herokuapp.com/yugiohprices.com/api/get_card_prices/" + encodeURIComponent(name));
    request.cardName = name;
    request.send();
}, REQUEST_THROTTLE_PRICE);