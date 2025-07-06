const BITS_PER_CHAR = 8;
const BITS_PER_CARD_CODE = 27;
const BITS_PER_CARD_COUNT = 2;

/** [cardId, cardId, cardId] => [[cardId, 3]] */
const compressCopies = ((data) => {
    const output = [];
    for (const cardId of data) {
        if (output.length && (output[output.length-1][0] == cardId))
            output[output.length-1][1] += 1;
        else
            output.push([cardId,1]);
    }
    return output;
});

/** [[cardId, 3]] => [cardId, cardId, cardId] */
const decompressCopies = ((data) => {
    const output = [];
    for (const [cardId, copies] of data) {
        for (let i=0; i<copies; ++i)
            output.push(cardId);
    }
    return output;
});

function CompressDeckData(data)
{
    if (!data || !data.length)
        return '';
    
    if (typeof(data[0]) === 'number')
        data = compressCopies(data);
    
    var raw = '';
    
    var currentCardIndex = 0;
    var nextBitInInput = 0;
    var outputCharCode = 0;
    var nextBitInOutput = 0;
    while (currentCardIndex < data.length)
    {
        var cardCode = data[currentCardIndex][0];
        var cardCount = data[currentCardIndex][1];
        if ((cardCode >> BITS_PER_CARD_CODE) || (cardCount >> BITS_PER_CARD_COUNT))
        { // skip any cards that do not fit into 27+2 bits
            console.error('Invalid card code or card count', cardCode, cardCount);
            currentCardIndex += 1;
            nextBitInInput = 0;
            continue;
        }
        var currentCardNumData = ((cardCode << BITS_PER_CARD_COUNT) | Math.min(cardCount,(1 << BITS_PER_CARD_COUNT)-1));
        var bitsToWrite = Math.min(BITS_PER_CHAR - nextBitInOutput, (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - nextBitInInput);
        if (nextBitInInput)
            currentCardNumData &= (1 << ((BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - nextBitInInput))-1;
        if (nextBitInInput + bitsToWrite < BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT)
            currentCardNumData >>= ((BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - (nextBitInInput + bitsToWrite));
        if (nextBitInOutput + bitsToWrite < BITS_PER_CHAR)
            currentCardNumData <<= (BITS_PER_CHAR - (nextBitInOutput + bitsToWrite));
        outputCharCode |= currentCardNumData;
        if ((nextBitInOutput += bitsToWrite) == BITS_PER_CHAR)
        {
            raw += String.fromCharCode(outputCharCode);
            outputCharCode = 0;
            nextBitInOutput = 0;
        }
        if ((nextBitInInput += bitsToWrite) == (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT))
        {
            currentCardIndex += 1;
            nextBitInInput = 0;
        }
    }
    if (nextBitInOutput)
        raw += String.fromCharCode(outputCharCode);
    
    return btoa(raw);
}

function DecompressDeckData(data)
{
    if (!data || !data.length)
        return null;
    
    var raw = atob(data);
    var decompressed = [];
    
    var nextCharacterIndex = 0;
    var nextBitInCharacter = 0;
    
    var readCardData = 0;
    var nextBitInOutput = 0;
    while (nextCharacterIndex < raw.length)
    {
        var charAtIndex = raw.charCodeAt(nextCharacterIndex);
        var bitsToRead = Math.min(BITS_PER_CHAR - nextBitInCharacter, (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - nextBitInOutput);
        if (nextBitInCharacter)
            charAtIndex &= (1 << (BITS_PER_CHAR - nextBitInCharacter))-1;
        if (nextBitInCharacter + bitsToRead < BITS_PER_CHAR)
            charAtIndex >>= (BITS_PER_CHAR - (nextBitInCharacter + bitsToRead));
        if (nextBitInOutput + bitsToRead < (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT))
            charAtIndex <<= ((BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT) - (nextBitInOutput + bitsToRead));
        readCardData |= charAtIndex;
        if ((nextBitInOutput += bitsToRead) == (BITS_PER_CARD_CODE + BITS_PER_CARD_COUNT))
        {
            var cardCode = readCardData >> BITS_PER_CARD_COUNT;
            var cardCount = readCardData & ((1 << BITS_PER_CARD_COUNT)-1);
            decompressed.push([+cardCode, +cardCount]);
            
            readCardData = 0;
            nextBitInOutput = 0;
        }
        if ((nextBitInCharacter += bitsToRead) == BITS_PER_CHAR)
        {
            ++nextCharacterIndex;
            nextBitInCharacter = 0;
        }
    }
    
    return decompressCopies(decompressed);
}
