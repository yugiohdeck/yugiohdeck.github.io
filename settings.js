const defaultSettings = 
{
    'stackLTR': false,
    'stackDuplicates': false,
    'highResCards': false,
    'useTcgplayerPrices': true,
    'alwaysLoadPrices': false,
    'ocgBanlist': false,
    'konamiDBData': false,
};

let storagekey = function(key) { return 'config-'+key; }

function SetUserSetting(key, val)
{
    if (!(key in defaultSettings))
    {
        console.error('Attempt to set unknown settings key: ' + key + ' (to ' + val + ')');
        return;
    }
    
    try
    {
        window.localStorage.setItem(storagekey(key), val);
    } catch (e) {
        if ((e instanceof DOMException) && (e.name === 'SecurityError'))
            console.log('LocalStorage access is denied', e);
        else
            throw e;
    }
}

function ClearUserSetting(key)
{
    if (!(key in defaultSettings))
    {
        console.error('Attempt to reset unknown settings key: ' + key);
        return;
    }
    
    try
    {
        window.localStorage.removeItem(storagekey(key));
    } catch (e) {
        if ((e instanceof DOMException) && (e.name === 'SecurityError'))
            console.log('LocalStorage access is denied', e);
        else
            throw e;
    }
}

function GetUserSetting(key)
{
    if (!(key in defaultSettings))
    {
        console.error('Attempt to get unknown settings key: ' + key);
        return null;
    }
    
    try
    {
        var val = window.localStorage.getItem(storagekey(key));
        if (val === null)
            return String(defaultSettings[key]);
        else
            return val;
    } catch (e) {
        if ((e instanceof DOMException) && (e.name === 'SecurityError'))
        {
            console.log('LocalStorage access is denied', e);
            return String(defaultSettings[key]);
        }
        else
            throw e;
    }
}

function GetUserSettingBool(key)
{
    return GetUserSetting(key) === String(true);
}
