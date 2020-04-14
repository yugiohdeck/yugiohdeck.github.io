function UpdateZoomData(data)
{
    if (document.getElementById('zoom-viewer').zoomedCardId != data.id)
        return;
    document.getElementById('zoom-name').innerText = data.name;
    document.getElementById('zoom-text').innerText = data.desc;
    
    const konamiId = data.konami_id;
    if (konamiId)
    {
        var kdbBtn = document.getElementById('zoom-konamidb');
        kdbBtn.href = 'https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=' + konamiId;
        kdbBtn.style.display = '';
        var ygorgBtn = document.getElementById('zoom-ygorgdb');
        ygorgBtn.href = 'https://db.ygorganization.com/card#' + konamiId;
        ygorgBtn.style.display = '';
    }
}

var zoomedCard = null;
function ZoomThisCard()
{
    if (this != zoomedCard)
    {
        if (zoomedCard)
            zoomedCard.classList.remove('selected')
        zoomedCard = this;
        this.classList.add('selected');
        
        var id = this.cardId;
        
        document.getElementById('zoom-viewer').style.visibility = 'visible';
        document.getElementById('zoom-viewer').zoomedCardId = id;
        document.getElementById('zoom-image').firstChild.src = 'https://storage.googleapis.com/ygoprodeck.com/pics/' + id + '.jpg';
        document.getElementById('zoom-name').innerText = 'Loading...';
        document.getElementById('zoom-text').innerText = 'Loading card info from API...';
        document.getElementById('zoom-ygorgdb').style.display = 'none';
        document.getElementById('zoom-konamidb').style.display = 'none';
        document.getElementById('zoom-yugipedia').href = 'https://yugipedia.com/wiki/' + id;
        RequestCardData(id, UpdateZoomData);
    }
    else
    {
        document.getElementById('zoom-viewer').style.visibility = 'hidden';
        
        this.classList.remove('selected');
        zoomedCard = null;
    }
}

function CloseZoomViewer()
{
    if (zoomedCard)
        ZoomThisCard.call(zoomedCard);
}
