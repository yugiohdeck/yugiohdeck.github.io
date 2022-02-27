function SortDeckCards(container)
{
    var l = []
    for (var i=0; i<container.children.length; ++i)
        l.push(container.children[i]);
    
    const sortStyle = 'as-is';
    switch(sortStyle)
    {
        case 'as-is':
            break;
    }
    return l;
}

const DECK_MARGIN_SIDE = (1.5/104)*100;
const STACKED_CARD_WIDTH = (2/104)*100;
const CARD_WIDTH = (10/104)*100;
const CARD_MARGIN_X = (0.1/104)*100;
const DECK_MARGIN_TOP_VH = 2.5;
const DECK_MARGIN_BOTTOM_VH = 1;
const CARD_HEIGHT_VH = 14;
const CARD_MARGIN_Y_VH = 0.1;
function UpdateDeckCardLayout(container)
{
    // all X units are already in %
    // Y units need to be converted to % (from vh) to work with narrow mode
    const DECK_HEIGHT_FACTOR = (container.id == 'main-deck-container') ? (1/.6) : (1/.18);
    const DECK_MARGIN_TOP = DECK_MARGIN_TOP_VH * DECK_HEIGHT_FACTOR;
    const DECK_MARGIN_BOTTOM = DECK_MARGIN_BOTTOM_VH * DECK_HEIGHT_FACTOR;
    const CARD_HEIGHT = CARD_HEIGHT_VH * DECK_HEIGHT_FACTOR;
    const CARD_MARGIN_Y = CARD_MARGIN_Y_VH * DECK_HEIGHT_FACTOR;
    
    var cardlist = SortDeckCards(container);
    var stackLTR = GetUserSettingBool('stackLTR'); // true for rightmost card in front of stack, false for leftmost card
    var stackDuplicates = GetUserSettingBool('stackDuplicates'); // true to stack subsequent identical cards
    
    document.body.classList.toggle('stack-ltr', stackLTR);
    
    var previousId = null;
    for (var factor = 1.0; factor > 0; factor *= 0.98)
    {
        var i;
        var x = DECK_MARGIN_SIDE - factor*(CARD_WIDTH + CARD_MARGIN_X);
        var y = DECK_MARGIN_TOP;
        for (i=0; i<cardlist.length; ++i)
        {
            var card = cardlist[i];
            card.style.zIndex = stackLTR ? (i+1) : (cardlist.length-i);
            
            var dx;
            if (!stackDuplicates || previousId != card.cardId)
                dx = CARD_WIDTH + CARD_MARGIN_X;
            else
                dx = STACKED_CARD_WIDTH;
            
            x += factor * dx;
            if (x + CARD_WIDTH > 100)
            {
                x = DECK_MARGIN_SIDE;
                y += CARD_HEIGHT + CARD_MARGIN_Y;
                if (y + CARD_HEIGHT > 100)
                    break;
            }
            card.style.left = x+'%';
            card.style.top  = y+'%';
            previousId = card.cardId;
        }
        if (!(i < cardlist.length))
            break;
    }
}

function UpdateAllDeckLayouts()
{
    UpdateDeckCardLayout(document.getElementById('main-deck-container'));
    UpdateDeckCardLayout(document.getElementById('extra-deck-container'));
    UpdateDeckCardLayout(document.getElementById('side-deck-container'));
}

function LimitedCallback(data)
{
    if (data.status)
    {
        const ban = (data.banlist_info && data.banlist_info[GetUserSettingBool('ocgBanlist') ? 'ban_ocg' : 'ban_tcg']);
        switch (ban)
        {
            case 'Banned':
            case 'Forbidden':
                this.src = 'limited_0.png';
                break;
            case 'Limited':
                this.src = 'limited_1.png';
                break;
            case 'Semi-Limited':
                this.src = 'limited_2.png';
                break;
            default:
                return;
        }
        this.title = ban;
    }
    else
    {
        this.src = 'limited_0.png';
        this.title = 'Failed to retrieve Forbidden & Limited List status';
    }
}

function LimitedCallbackOrgDB(data)
{
    const cardData = data.cardData[GetUserSettingBool('ocgBanlist') ? 'ja' : 'en'];
    const allowed = (
        (!cardData || (cardData.thisSrc.type !== 2)) ? 0 :
        isNaN(cardData.banlistStatus) ? 3 :
        cardData.banlistStatus
    );
    if (allowed < 3)
    {
        this.src = ('limited_'+allowed+'.png');
        this.title = ('Maximum copies: '+allowed);
    }
}

function LimitedCallbackOrgDBFailed(e)
{
    this.src = 'limited_0.png';
    this.title = ('Failed to retrieve Forbidden & Limited List status:\n- '+e);
}

function MakeDOMCard(id)
{
    var main = document.createElement('div');
    main.className = 'card';
    main.cardId = id;
    main.addEventListener("click", ZoomThisCard);
    
    var pic = document.createElement('img');
    if (GetUserSettingBool('highResCards'))
        pic.src = 'https://storage.googleapis.com/ygoprodeck.com/pics/' + id + '.jpg';
    else
        pic.src = 'https://storage.googleapis.com/ygoprodeck.com/pics_small/' + id + '.jpg';
    main.appendChild(pic);
    
    var limited = document.createElement('div');
    limited.className = 'limited';
    main.appendChild(limited);
    
    var limitedPic = document.createElement('img');
    limited.appendChild(limitedPic);
    
    if (GetUserSettingBool('konamiDBData'))
        window.RequestOrgDBData(id).then(LimitedCallbackOrgDB.bind(limitedPic)).catch(LimitedCallbackOrgDBFailed.bind(limitedPic));
    else
        RequestCardData(id, LimitedCallback, limitedPic);
    
    return main;
}

function LoadDeck(cards, tag)
{
    var container = document.getElementById(tag+'-deck-container');
    while (container.lastChild)
        container.removeChild(container.lastChild);
    
    if (cards)
    {
        for (var i=0, n=cards.length; i<n; ++i)
        {
            var id = cards[i][0];
            var count = cards[i][1];
            for (var j=0;j<count;++j)
                container.appendChild(MakeDOMCard(id));
        }
    }
    
    var label = document.getElementById(tag+'-deck-label');
    label.innerText = container.children.length + ')';
    
    UpdateDeckCardLayout(container);
}

let hashData = { decks: { main: null, extra: null, side: null }, title: null };
let updateFromHashData = function()
{
    if (!hashData.decks.main)
    {
        document.body.className = 'import';
        document.title = 'Deck Viewer';
        return;
    }
    CloseZoomViewer();
    ClosePriceBreakdown();
    document.body.className = 'view';
    
    LoadDeck(hashData.decks.main, 'main');
    LoadDeck(hashData.decks.extra, 'extra');
    LoadDeck(hashData.decks.side, 'side');
    
    if (hashData.title)
        document.title = hashData.title + ' – Deck Viewer';
    else
        document.title = 'Deck Viewer';
        
    if (GetUserSettingBool('alwaysLoadPrices'))
        LoadPriceBreakdown();
};

function SetDeckTitle(title) { hashData.title = (title && title.length) ? title : null; HashDataChanged(); }
function GetDeckTitle() { return hashData.title; }
function SetDeckData(main, extra, side, title) { hashData.decks.main = main; hashData.decks.extra = extra; hashData.decks.side = side; SetDeckTitle(title); }

let updateSubscriber = null;
function HashDataChanged()
{
    if (updateSubscriber !== null)
        updateSubscriber[0].postMessage({deckInfo: hashData}, updateSubscriber[1]);
    
    if (!hashData.decks.main)
    {
        document.location.hash = '';
        updateFromHashData();
        return;
    }
    if (hashData.decks.extra && !hashData.decks.extra.length)
        hashData.decks.extra = null;
    if (hashData.decks.side && !hashData.decks.side.length)
        hashData.decks.side = null;
    
    var newTag = CompressDeckData(hashData.decks.main);
    if (hashData.decks.extra || hashData.decks.side)
        newTag += ';' + CompressDeckData(hashData.decks.extra);
    if (hashData.decks.side)
        newTag += ';' + CompressDeckData(hashData.decks.side);
    if (hashData.title)
        newTag += ':' + encodeURIComponent(hashData.title);
    
    document.location.hash = newTag;
    
    updateFromHashData();
}

function ReloadFromHashData()
{
    var tag = document.location.hash;
    if (tag.length <= 1)
    {
        hashData.decks.main = null;
        hashData.decks.extra = null;
        hashData.decks.side = null;
        hashData.title = null;
        updateFromHashData();
        return;
    }
    
    try
    {
        var datas = tag.substring(1).split(':');
        if (!datas.length)
            throw ('Invalid data structure');
        
        var decks = datas[0].split(';')
        if (decks.length < 1 || decks.length > 3)
            throw ('Too few or too many decks (' + decks.length + ')');
        
        hashData.decks.main = DecompressDeckData(decks[0]);
        hashData.decks.extra = (decks.length > 1) ? DecompressDeckData(decks[1]) : null;
        hashData.decks.side = (decks.length > 2) ? DecompressDeckData(decks[2]) : null;
        if (datas.length > 1)
            hashData.title = decodeURIComponent(datas[1]);
        else
            hashData.title = null;
        
        HashDataChanged();
    }
    catch (error)
    {
        hashData.decks.main = null;
        hashData.decks.extra = null;
        hashData.decks.side = null;
        hashData.title = null;
        HashDataChanged();
        console.error('ERROR: ' + error);
    }
}

function HandleDataTransfer(data)
{
    if (data.items)
    {
        for (var i=0; i < data.items.length; ++i)
        {
            if (data.items[i].kind !== 'file')
                continue;
            if (AttemptFileImport(data.items[i].getAsFile()))
                return;
        }
    }
    else
    {
        for (var i=0; i < data.files.length; ++i)
        {
            if (AttemptFileImport(data.files[i]))
                return;
        }
    }
    var text = data.getData('text/plain');
    if (text && text !== '')
        AttemptTextImport(text);
}

function HandleDrag(e)
{
    e.preventDefault();
}

function HandleDrop(e)
{
    e.preventDefault();
    HandleDataTransfer(e.dataTransfer);
}

function HandlePaste(e)
{
    e.preventDefault();
    HandleDataTransfer(e.clipboardData || window.clipboardData);
}

function HandleFileSelect()
{
    if (!this.files.length)
        return;
    AttemptFileImport(this.files[0]);
}

let dummyInput = document.createElement('input');
dummyInput.type = 'file';
dummyInput.accept = '.ydk';
dummyInput.addEventListener('change', HandleFileSelect);

document.addEventListener("DOMContentLoaded",function()
{
    ReloadFromHashData();
    
    document.getElementById('subtext-about').addEventListener('click', function() { ShowModal('modal-about'); });
    document.getElementById('subtext-privacy').addEventListener('click', function() { ShowModal('modal-privacy'); });
    document.body.addEventListener('paste', HandlePaste);
    document.getElementById('import-box').addEventListener('click', function() { dummyInput.click(); });
});

window.addEventListener('message', function(e)
{
    if (e.source !== window.parent)
        return;

	if ('cssFile' in e.data)
	{
		var elm = document.createElement('link');
		elm.rel = 'stylesheet';
		elm.href = e.data.cssFile;
		document.head.appendChild(elm);
	}
	
	if ('tcgplayerAffiliate' in e.data)
		window.tcgplayerAffiliate = e.data.tcgplayerAffiliate;
    
    if ('getDeckInfo' in e.data)
        e.source.postMessage({ deckInfo: hashData }, e.origin);
    
    if ('requestDeckInfoUpdate' in e.data)
        updateSubscriber = [e.source, e.origin];
        
    const newDeckInfo = e.data.setDeckInfo;
    if (newDeckInfo)
    {
        const oldDeckInfo = hashData;
        try
        {
            hashData = newDeckInfo;
            HashDataChanged();
        } catch (e) {
            console.error('Your deck info is broken, so we aborted the load. Here\'s the error message:');
            console.error(e);
            document.location.hash = '';
            ReloadFromHashData();
        }
    }
});

window.addEventListener('hashchange', ReloadFromHashData);
