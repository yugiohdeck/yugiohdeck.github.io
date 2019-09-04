let currentModal = null;
function ShowModal(id)
{
    var newModal;
    if (id)
        newModal = document.getElementById(id);
    
    if (currentModal)
        currentModal.style.display = 'none';
    if (newModal)
        newModal.style.display = 'block';
    document.getElementById('modal-background').style.display = newModal ? 'block' : 'none';
    currentModal = newModal;
}

let switch_to_setting = function(v, redraw)
{
    var s = document.getElementById('switch-' + v);
    s.changeCallback = function(b)
    {
        SetUserSetting(v, b);
        if (redraw)
            ReloadFromHashData();
        else
            UpdateAllDeckLayouts();
    };
    if (GetUserSettingBool(v))
        s.classList.add('enabled');
};

document.addEventListener("DOMContentLoaded",function()
{
    document.getElementById('modal-background').addEventListener('click', function() { ShowModal(null); });
    document.getElementById('modal-copy-button').addEventListener('click', function()
    {
        if (this.currentlyDisabled)
            return;
        this.currentlyDisabled = true;
        navigator.clipboard.writeText(this.previousElementSibling.innerText).then(() =>
        {
            this.firstElementChild.style.display = 'block';
            this.firstElementChild.style.display = 
            window.setTimeout(() =>
            {
                this.firstElementChild.style.display = '';
                this.currentlyDisabled = false;
            }, 2000);
        });
    });
    
    var switches = document.getElementsByClassName('switch');
    var toggle = function()
    {
        this.classList.toggle('enabled');
        if (this.changeCallback)
            this.changeCallback(this.classList.contains('enabled'));
    };
    for (var i=0; i<switches.length; ++i)
        switches[i].addEventListener('click', toggle);
    
    switch_to_setting('stackDuplicates');
    switch_to_setting('stackLTR');
    switch_to_setting('highResCards', true);
});
