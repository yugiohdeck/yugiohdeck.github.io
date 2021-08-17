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
    if (this.currentlyDisabled)
        return;
    this.currentlyDisabled = true;
    navigator.clipboard.writeText(document.location.href).then(() =>
    {
        this.firstElementChild.style.display = 'block';
        this.firstElementChild.style.display = 
        window.setTimeout(() =>
        {
            this.firstElementChild.style.display = '';
            this.currentlyDisabled = false;
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
    this.firstElementChild.style.display = 'block';
    RequestAllCardData((data) =>
    {
        var lines = [];
        addTextLines(lines, data.main, 'Main Deck');
        addTextLines(lines, data.extra, 'Extra Deck');
        addTextLines(lines, data.side, 'Side Deck');
        
        SaveAs(getExportedFileName('.txt'), lines.join('\n'));
        
        this.firstElementChild.style.display = '';
    });
}

let redditCmp = function(a,b)
{
    if (a[1] != b[1])
        return b[1]-a[1];
    return (a[0] < b[0]) ? -1 : 1;
};
let addRedditGroupLines = function(lines, pairs, label, doLabel)
{
    if (!pairs.length)
        return;
    let total = 0;
    if (doLabel) for (const pair of pairs) total += pair[1];
    if (doLabel) lines.push('    |- ' + label + ' (' + total + '):');
    for (const pair of pairs) lines.push((doLabel ? '      |- ' : '    |- ') + pair[1] + 'x ' + pair[0]);
};
let addRedditLines = function(lines, cards, label, splitLabels)
{
    if (!cards.length)
        return;
    lines.push('    ' + label + ' (' + cards.length + '):');
    let maps = [{},{},{}];
    for (var i=0; i<cards.length; ++i)
    {
        var card = cards[i][1];
        let t = 0;
        if (card.type === 'Spell Card')
            t = 1;
        else if (card.type === 'Trap Card')
            t = 2;
        
        if (!(card.name in maps[t]))
            maps[t][card.name] = 1;
        else
            maps[t][card.name] += 1;
    }
    
    addRedditGroupLines(lines, Object.entries(maps[0]).sort(redditCmp), 'MONSTER CARDS', splitLabels);
    addRedditGroupLines(lines, Object.entries(maps[1]).sort(redditCmp), 'SPELL CARDS', splitLabels);
    addRedditGroupLines(lines, Object.entries(maps[2]).sort(redditCmp), 'TRAP CARDS', splitLabels);
    lines.push('');
};
function ExportReddit()
{
    if (this.currentlyDisabled)
        return;
    this.currentlyDisabled = true;
    this.firstElementChild.style.display = 'block';
    RequestAllCardData((data) =>
    {
        var lines = [];
        lines.push('**You can view this list interactively [here](' + document.location.href + ')!**');
        lines.push('');
        addRedditLines(lines, data.main, 'MAIN DECK', true);
        addRedditLines(lines, data.extra, 'EXTRA DECK', false);
        addRedditLines(lines, data.side, 'SIDE DECK', false);
        
        this.firstElementChild.style.display = '';
        this.currentlyDisabled = false;
        
        document.getElementById('modal-copy-container').innerText = lines.join('\n');
        ShowModal('modal-copyable');
    });
}

let getKonamiList = function(deck)
{
    let maps = [{},{},{}];
    for (var i=0; i<deck.length; ++i)
    {
        var card = deck[i][1];
        let t = 0;
        if (card.type === 'Spell Card')
            t = 1;
        else if (card.type === 'Trap Card')
            t = 2;
        
        if (!(card.name in maps[t]))
            maps[t][card.name] = 1;
        else
            maps[t][card.name] += 1;
    }
    return maps.map((m) => Object.entries(m));
};
function ExportKonami()
{
    RequestAllCardData((data) =>
    {
        let mainMaps = getKonamiList(data.main);
        document.getElementById('modal-copy-container').innerText = (
            'function put(pre,data) {\n'+
            '  for (let i=0; i<data.length; ++i) {\n'+
            '    document.getElementById(pre+\'nm_\'+(i+1)).value = data[i][0];\n'+
            '    document.getElementById(pre+\'num_\'+(i+1)).value = data[i][1];\n'+
            '  }\n'+
            '}\n'+
            'put(\'mo\','+JSON.stringify(mainMaps[0])+');\n'+
            'put(\'sp\','+JSON.stringify(mainMaps[1])+');\n'+
            'put(\'tr\','+JSON.stringify(mainMaps[2])+');\n'+
            'put(\'ex\','+JSON.stringify(getKonamiList(data.extra).flat())+');\n'+
            'put(\'si\','+JSON.stringify(getKonamiList(data.side).flat())+');\n'
        );
        ShowModal('modal-copyable');
    });
}

function ExportQRCode()
{
    if (!ExportQRCode.qrCode)
        ExportQRCode.qrCode = new QRCode(document.getElementById('modal-qr'), {
            width: 256,
            height: 256,
            logo: 'large.ico',
            colorLight: '#cccccc',
            titleHeight: 0
        });
    ExportQRCode.qrCode.makeCode(document.location.href);
    ShowModal('modal-qr');
}

function UpdatePriceTotal()
{
    var container = document.getElementById('toolbox-price-list');
    var total = 0;
    for (var i=0; i<container.children.length; ++i)
    {
        var el = container.children[i];
        if (el.priceAmount < Infinity)
            total += el.priceAmount * el.count;
    }
    document.getElementById('toolbox-price-list').firstElementChild.priceElement.innerText = (GetUserSettingBool('useTcgplayerPrices') ? '$' : '€') + total.toFixed(2);
}

let cardmarketEscape = function(name)
{
    return name.replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-/,'').replace(/-$/,'');
};
let createListEntry = function(cardName)
{
    var container = document.createElement('div');
    container.count = 1;
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
    var ygopIcon = document.createElement('img');
	ygopIcon.src = 'https://www.tcgplayer.com/favicon.ico';
    ygopLink.appendChild(ygopIcon);
    ygopElement.appendChild(ygopLink);
    container.appendChild(ygopElement);
    
    var cmElement = document.createElement('div');
    cmElement.className = 'price-link-cm';
    var cmLink = document.createElement('a');
    cmLink.title = 'View card on cardmarket.com';
    cmLink.target = '_blank';
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
    
    container.nameElement = name;
    container.priceElement = price;
	container.ygopIconElement = ygopIcon;
    container.ygopLinkElement = ygopLink;
    container.cmLinkElement = cmLink;
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
        this.nameElement.innerText = data.name;
        if (GetUserSettingBool('useTcgplayerPrices'))
        {
            this.priceAmount = data.card_prices[0].tcgplayer_price;
            this.priceElement.innerText = '$'+this.priceAmount.toFixed(2);
        }
        else
        {
            this.priceAmount = data.card_prices[0].cardmarket_price;
            this.priceElement.innerText = '€'+this.priceAmount.toFixed(2);
        }
		
		if (data.tcgplayer_url)
		{
			var tcgplayerURL = new URL(data.tcgplayer_url);
			if (window.tcgplayerAffiliate)
			{
				tcgplayerURL.searchParams.set('utm_campaign', 'affiliate');
				tcgplayerURL.searchParams.set('partner', window.tcgplayerAffiliate);
				tcgplayerURL.searchParams.set('utm_medium', window.tcgplayerAffiliate);
				tcgplayerURL.searchParams.set('utm_source', window.tcgplayerAffiliate);
			}
			else
			{
				tcgplayerURL.searchParams.delete('utm_campaign');
				tcgplayerURL.searchParams.delete('partner');
				tcgplayerURL.searchParams.delete('utm_medium');
				tcgplayerURL.searchParams.delete('utm_source');
			}
			
			this.ygopIconElement.src = 'https://www.tcgplayer.com/favicon.ico';
			this.ygopLinkElement.href = tcgplayerURL.href;
		}
		else
		{
			this.ygopIconElement.src = 'https://yugiohprices.com/img/favicon.png';
			this.ygopLinkElement.href = 'https://yugiohprices.com/card_price?name=' + encodeURIComponent(data.name);
		}
		
        var cardmarketURL = new URL(data.cardmarket_url || ('https://www.cardmarket.com/en/YuGiOh/Cards/' + cardmarketEscape(data.name)));
		cardmarketURL.searchParams.delete('utm_source');
		cardmarketURL.searchParams.delete('utm_medium');
		cardmarketURL.searchParams.delete('utm_campaign');
			
		this.cmLinkElement.href = cardmarketURL.href;

        var siblings = this.parentElement.children;
        var i;
        for (i=0; i<siblings.length; ++i)
            if (siblings[i].priceAmount < this.priceAmount)
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

let AddPriceBreakdownForCards = function(container, tag, index)
{
    var deck = document.getElementById(tag + '-deck-container');
    for (var i=0; i<deck.children.length; ++i)
    {
        var cardId = deck.children[i].cardId;
        if (cardId in index)
        {
            ++(index[cardId].count);
            continue;
        }
        
        var entry = createListEntry('#'+cardId);
        container.appendChild(entry);
        index[cardId] = entry;
        RequestCardData(cardId, updateCardPrice, entry);
    }
};

function LoadPriceBreakdown()
{
    var button = document.getElementById('toolbox-price-load');
    button.firstElementChild.style.display = 'block';
    var container = document.getElementById('toolbox-price-list');
    while (container.lastChild)
        container.removeChild(container.lastChild);
    
    button.firstElementChild.style.display = '';
    button.style.display = 'none';
    
    var total = createListEntry('== PRICE BREAKDOWN ==');
    total.priceAmount = Infinity;
    total.className = 'price-entry price-total';
    container.appendChild(total);
    
    var index = {}
    AddPriceBreakdownForCards(container, 'main', index);
    AddPriceBreakdownForCards(container, 'side', index);
    AddPriceBreakdownForCards(container, 'extra', index);
    UpdatePriceTotal();
    container.style.display = 'block';
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
    document.getElementById('toolbox-export-reddit').addEventListener("click", ExportReddit);
    document.getElementById('toolbox-export-qr').addEventListener("click", ExportQRCode);
    
    document.getElementById('toolbox-price-load').addEventListener("click", LoadPriceBreakdown);
});
