function UpdateZoomData(data)
{
    if (document.getElementById('zoom-viewer').zoomedCardId != data.id)
        return;
    document.getElementById('zoom-name').innerText = data.name;
    document.getElementById('zoom-text').innerText = data.desc;
    if (data.misc_info && data.misc_info[0] && !data.misc_info[0].has_effect)
        document.getElementById('zoom-text').style.fontStyle = 'italic';
    
    var konamiId = data.konami_id;
    if (konamiId)
    {
        var kdbBtn = document.getElementById('zoom-konamidb');
        kdbBtn.href = 'https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=' + konamiId;
        kdbBtn.style.visibility = '';
        var ygorgBtn = document.getElementById('zoom-ygorgdb');
        ygorgBtn.href = 'https://db.ygorganization.com/card#' + konamiId;
        ygorgBtn.style.visibility = '';
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
        
        document.getElementById('zoom-viewer').zoomedCardId = id;
        document.getElementById('zoom-image').firstChild.src = 'https://storage.googleapis.com/ygoprodeck.com/pics/' + id + '.jpg';
        document.getElementById('zoom-name').innerText = '';
        document.getElementById('zoom-text').innerText = 'Loading card info from API...';
        document.getElementById('zoom-text').style.fontStyle = '';
        document.getElementById('zoom-ygorgdb').style.visibility = 'hidden';
        document.getElementById('zoom-konamidb').style.visibility = 'hidden';
        document.getElementById('zoom-yugipedia').href = ('https://yugipedia.com/wiki/' + ('0000000'+id).slice(-8));
        document.getElementById('zoom-yugipedia').style.visibility = '';
        RequestCardData(id, UpdateZoomData);
    }
}

function CloseZoomViewer()
{
    if (zoomedCard)
    {
        zoomedCard.classList.remove('selected');
        zoomedCard = null;
    }
    document.getElementById('zoom-viewer').zoomedCardId = null;
    document.getElementById('zoom-image').firstChild.src = 'zoom-placeholder.png';
    document.getElementById('zoom-name').innerText = '';
    document.getElementById('zoom-text').innerText = 'Click any card to view it here...';
    document.getElementById('zoom-text').style.fontStyle = 'italic';
    document.getElementById('zoom-ygorgdb').style.visibility = 'hidden';
    document.getElementById('zoom-konamidb').style.visibility = 'hidden';
    document.getElementById('zoom-yugipedia').style.visibility = 'hidden';
}
