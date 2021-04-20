const defaultSettings = 
{
    'stackLTR': false,
    'stackDuplicates': false,
    'highResCards': false,
    'useTcgplayerPrices': false,
    'alwaysLoadPrices': false,
    'ocgBanlist': false,
};

let storagekey = function(key) { return 'config-'+key; }

function SetUserSetting(key, val)
{
    if (!(key in defaultSettings))
    {
        console.error('Attempt to set unknown settings key: ' + key + ' (to ' + val + ')');
        return;
    }
    
    window.localStorage.setItem(storagekey(key), val);
}

function ClearUserSetting(key)
{
    if (!(key in defaultSettings))
    {
        console.error('Attempt to reset unknown settings key: ' + key);
        return;
    }
    
    window.localStorage.removeItem(storagekey(key));
}

function GetUserSetting(key)
{
    if (!(key in defaultSettings))
    {
        console.error('Attempt to get unknown settings key: ' + key);
        return null;
    }
    
    var val = window.localStorage.getItem(storagekey(key));
    if (val === null)
        return String(defaultSettings[key]);
    else
        return val;
}

function GetUserSettingBool(key)
{
    return GetUserSetting(key) === String(true);
}
