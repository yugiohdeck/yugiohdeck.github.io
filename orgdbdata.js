(()=>{

const _passcodeToKonamiIdReal = ((passcode) => new Promise((res,rej) =>
{
    try
    {
        RequestCardData(passcode, (data) =>
        {
            try
            {
                if (!data.status)
                {
                    rej(data.message);
                    return;
                }
                const id = (data.misc_info && data.misc_info[0] && data.misc_info[0].konami_id);
                if (id)
                    res(id)
                else
                    rej('No KonamiDB ID is listed for card '+passcode);
            } catch (e) { rej(e); }
        });
    } catch (e) { rej(e); }
}));

let _passcodeCache = {};
const _passcodeToKonamiId = ((p) => (_passcodeCache[p] || (_passcodeCache[p] = _passcodeToKonamiIdReal(p))));

const _orgdbRequest = (async (p) =>
{
    return await (await fetch('https://db.ygoresources.com/data/card/'+(await _passcodeToKonamiId(p)))).json();
});

let _orgdbCache = {};
window.RequestOrgDBData = ((p) => (_orgdbCache[p] || (_orgdbCache[p] = _orgdbRequest(p))));

})();
