function SaveAs(filename, content)
{
    var a = document.createElement('a');
    a.style.display = 'none';
    document.body.appendChild(a);
    var blob = new Blob([content], {type: 'text/plain'});
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(blob);
    document.body.removeChild(a);
}

function CopyURL()
{
    var btn = this;
    if (btn.currentlyDisabled)
        return;
    btn.currentlyDisabled = true;
    navigator.clipboard.writeText(document.location.href).then(function()
    {
        btn.firstElementChild.style.display = 'block';
        btn.firstElementChild.style.display = 
        window.setTimeout(function()
        {
            btn.firstElementChild.style.display = '';
            btn.currentlyDisabled = false;
        }, 2000);
    });
}

let getExportedFileName = function(ending)
{
    var title = GetDeckTitle();
    if (!title)
        title = 'Exported Deck';
    if (!title.endsWith(ending))
        title += ending;
    return title;
};
let addYDKLines = function(lines, tag)
{
    var cards = SortDeckCards(document.getElementById(tag+'-deck-container'));
    for (var i=0; i<cards.length; ++i)
        lines.push(String(cards[i].cardId));
};
function ExportYDK()
{
    var lines = ['#created by Deck Viewer (' + document.location.host + ')','#main'];
    addYDKLines(lines, 'main');
    lines.push('#extra');
    addYDKLines(lines, 'extra');
    lines.push('!side');
    addYDKLines(lines, 'side');
    lines.push('');
    
    SaveAs(getExportedFileName('.ydk'), lines.join('\n'));
}

let addTextLine = function(lines, card, count)
{
    lines.push(count + 'x ' + card.name);
};
let addTextLines = function(lines, cards, label)
{
    if (!cards.length)
        return;
    lines.push('== ' + label + ' (' + cards.length + ((cards.length > 1) ? ' cards) ==' : ' card) =='));
    var lastData = null;
    var count = 0;
    for (var i=0; i<cards.length; ++i)
    {
        var card = cards[i][1];
        if (lastData)
        {
            if (card.name == lastData.name)
            {
                ++count;
                continue;
            }
            addTextLine(lines, lastData, count);
        }
        lastData = card;
        count = 1;
    }
    addTextLine(lines, lastData, count);
    lines.push('');
};
function ExportText()
{
    var overlay = document.getElementById('toolbox-export-text').firstElementChild;
    overlay.style.display = 'block';
    RequestAllCardData(function(data)
    {
        var lines = [];
        addTextLines(lines, data.main, 'Main Deck');
        addTextLines(lines, data.extra, 'Extra Deck');
        addTextLines(lines, data.side, 'Side Deck');
        
        SaveAs(getExportedFileName('.txt'), lines.join('\n'));
        
        overlay.style.display = '';
    });
}

function TotalPriceForCards(cards)
{
    var t = 0;
    for (var i=0; i<cards.length; ++i)
    {
        var cardName = cards[i][1].name;
        var data = TryCardPrice(cardName);
        if (!data)
            continue;
        var price = Infinity;
        for (var j=0; j<data.length; ++j)
        {
            var pricedata = data[j].price_data;
            if (pricedata.status !== 'success')
                continue;
            var p = pricedata.data.prices.low;
            if (p < price)
                price = p;
        }
        if (price < Infinity)
            t += price;
    }
    return t;
}
function UpdatePriceTotal()
{
    RequestAllCardData(function(data)
    {
        var total = 0;
        total += TotalPriceForCards(data.main);
        total += TotalPriceForCards(data.side);
        total += TotalPriceForCards(data.extra);
        document.getElementById('toolbox-price-list').firstElementChild.priceElement.innerText = '$' + total.toFixed(2);
    });
}

let cardmarketEscape = function(name)
{
    return name.replace(/-/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-/,'').replace(/-$/,'');
};
let createListEntry = function(cardName)
{
    var container = document.createElement('div');
    container.priceAmount = 0;
    container.className = 'price-entry price-loading';
    
    var name = document.createElement('div');
    name.className = 'price-name';
    name.innerText = cardName;
    container.appendChild(name);
    
    var price = document.createElement('div');
    price.className = 'price-price';
    container.appendChild(price);
    
    var ygopElement = document.createElement('div');
    ygopElement.className = 'price-link-ygop';
    var ygopLink = document.createElement('a');
    ygopLink.title = 'View card on yugiohprices.com';
    ygopLink.target = '_blank';
    ygopLink.href = 'https://yugiohprices.com/card_price?name=' + encodeURIComponent(cardName);
    var ygopIcon = document.createElement('img');
    ygopIcon.src = 'https://yugiohprices.com/img/favicon.png';
    ygopLink.appendChild(ygopIcon);
    ygopElement.appendChild(ygopLink);
    container.appendChild(ygopElement);
    
    var cmElement = document.createElement('div');
    cmElement.className = 'price-link-cm';
    var cmLink = document.createElement('a');
    cmLink.title = 'View card on cardmarket.com';
    cmLink.target = '_blank';
    cmLink.href = 'https://www.cardmarket.com/en/YuGiOh/Cards/' + cardmarketEscape(cardName);
    var cmIcon = document.createElement('img');
    cmIcon.src = 'https://static.cardmarket.com/img/526dbb9ae52c5e62404fe903e9769807/static/misc/favicon-96x96.png';
    cmLink.appendChild(cmIcon);
    cmElement.appendChild(cmLink);
    container.appendChild(cmElement);
    
    var progress = document.createElement('div');
    progress.className = 'price-progress';
    progress.innerText = 'Loading...';
    container.appendChild(progress);
    
    var error = document.createElement('div');
    error.className = 'price-error';
    error.innerText = 'API failed';
    container.appendChild(error);
    
    container.priceElement = price;
    container.errorElement = error;
    
    return container;
};
let updateCardPrice = function(data)
{
    if (!this.parentElement)
        return;

    if (data.status)
    {
        this.className = 'price-entry price-okay';
        var min = Infinity;
        for (var j=0; j<data.data.length; ++j)
        {
            var pricedata = data.data[j].price_data;
            if (pricedata.status !== 'success')
                continue;
            var p = pricedata.data.prices.low;
            if (p < min)
                min = p;
        }
        if (min < Infinity)
            this.priceElement.innerText = '$'+min.toFixed(2);
        else
        {
            data.status = false;
            updateCardPrice.call(this,data);
        }
        
        this.priceAmount = min;
        
        var siblings = this.parentElement.children;
        var i;
        for (i=0; i<siblings.length; ++i)
            if (siblings[i].priceAmount < min)
                break;
        if (i < siblings.length)
            this.parentElement.insertBefore(this, siblings[i]);
        else
            this.parentElement.appendChild(this);
    }
    else
    {
        this.className = 'price-entry price-failed';
        this.errorElement.title = data.message;
    }
    UpdatePriceTotal();
};
function LoadPriceBreakdownForCards(parent, cards, index)
{
    for (var i=0; i<cards.length; ++i)
    {
        var cardName = cards[i][1].name;
        if (cardName in index)
            continue;
        index[cardName] = true;
        
        var container = createListEntry(cardName);
        parent.appendChild(container);
        RequestCardPrice(cardName, updateCardPrice, container);
    }
}

function LoadPriceBreakdown()
{
    var button = document.getElementById('toolbox-price-load');
    button.firstElementChild.style.display = 'block';
    var container = document.getElementById('toolbox-price-list');
    while (container.lastChild)
        container.removeChild(container.lastChild);

    RequestAllCardData(function(data)
    {
        button.firstElementChild.style.display = '';
        button.style.display = 'none';
        
        var total = createListEntry('== PRICE BREAKDOWN ==');
        total.priceAmount = Infinity;
        total.className = 'price-entry price-total';
        container.appendChild(total);
        
        var index = {};
        LoadPriceBreakdownForCards(container, data.main, index);
        LoadPriceBreakdownForCards(container, data.side, index);
        LoadPriceBreakdownForCards(container, data.extra, index);
        UpdatePriceTotal();
        
        container.style.display = 'block';
    });
}

function ClosePriceBreakdown()
{
    var button = document.getElementById('toolbox-price-load');
    button.style.display = 'block';
    button.firstElementChild.style.display = 'none';
    document.getElementById('toolbox-price-list').style.display = 'none';
}

document.addEventListener("DOMContentLoaded",function()
{
    document.getElementById('toolbox-settings').addEventListener("click", function() { ShowModal('modal-settings'); });
    document.getElementById('toolbox-title').addEventListener("click", function() { SetDeckTitle(window.prompt("New title:", GetDeckTitle())); });
    document.getElementById('toolbox-close').addEventListener("click", function() { document.location.hash = ''; ReloadFromHashData(); });
    document.getElementById('toolbox-copyurl').addEventListener("click", CopyURL);
    document.getElementById('toolbox-export-ydk').addEventListener("click", ExportYDK);
    document.getElementById('toolbox-export-text').addEventListener("click", ExportText);
    
    document.getElementById('toolbox-price-load').addEventListener("click", LoadPriceBreakdown);
});
